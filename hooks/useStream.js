import { useState, useEffect, useRef, useCallback } from 'react';
import { Device } from 'mediasoup-client';
import { io } from 'socket.io-client';

export const useStream = (streamId, userId, streamTitle) => {
    const [localStream, setLocalStream] = useState(null);
    const [isStreaming, setIsStreaming] = useState(false);
    const [error, setError] = useState(null);
    const [viewerCount, setViewerCount] = useState(0);

    const socketRef = useRef(null);
    const deviceRef = useRef(null);
    const transportRef = useRef(null);
    const videoProducerRef = useRef(null);
    const audioProducerRef = useRef(null);

    // Helper to wrap socket events in Promises for clean async/await flow
    const socketRequest = (event, data, responseEvent) => {
        return new Promise((resolve, reject) => {
            if (!socketRef.current) return reject('Socket not connected');
            
            // Listen for the specific response event
            socketRef.current.once(responseEvent, (response) => {
                if (response.error) reject(new Error(response.error));
                else resolve(response);
            });
            
            // Also listen for generic error events related to this action
            socketRef.current.once(`${event}-error`, (err) => reject(new Error(err.error || 'Socket request failed')));
            
            socketRef.current.emit(event, data);
        });
    };

    const initializeSocket = useCallback(() => {
        // Replace with your backend URL
        const socket = io('http://localhost:4000', {
            withCredentials: true,
        });

        socket.on('connect', () => console.log('WebSocket Connected:', socket.id));
        
        socket.on('viewer-count-update', ({ currentViewerCount }) => {
            setViewerCount(currentViewerCount);
        });

        socketRef.current = socket;
        return socket;
    }, []);

    const startStreaming = async () => {
        try {
            setError(null);
            const socket = socketRef.current || initializeSocket();

            // 1. Get Local Media (Camera & Mic)
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30 } },
                audio: { echoCancellation: true, noiseSuppression: true }
            });
            setLocalStream(stream);

            // 2. Notify Backend to start the stream room
            await socketRequest('start-webrtc-stream', { streamId, userId, streamTitle }, 'stream-started');

            // 3. Get Router Capabilities & Load Device
            const { capabilities } = await socketRequest('get-router-capabilities', { streamId }, 'router-capabilities');
            
            const device = new Device();
            await device.load({ routerRtpCapabilities: capabilities });
            deviceRef.current = device;

            // 4. Create Send Transport
            const { transport: transportOptions } = await socketRequest('create-transport', { 
                streamId, 
                direction: 'send' 
            }, 'transport-created');

            const transport = device.createSendTransport(transportOptions);
            transportRef.current = transport;

            // 5. Setup Transport Event Handlers
            transport.on('connect', async ({ dtlsParameters }, callback, errback) => {
                try {
                    await socketRequest('connect-transport', {
                        transportId: transport.id,
                        dtlsParameters
                    }, 'transport-connected');
                    callback();
                } catch (err) {
                    errback(err);
                }
            });

            transport.on('produce', async (parameters, callback, errback) => {
                try {
                    const { producer } = await socketRequest('produce', {
                        transportId: transport.id,
                        kind: parameters.kind,
                        rtpParameters: parameters.rtpParameters
                    }, 'producer-created');
                    
                    callback({ id: producer.id });
                } catch (err) {
                    errback(err);
                }
            });

            // 6. Start Producing Media
            const videoTrack = stream.getVideoTracks()[0];
            const audioTrack = stream.getAudioTracks()[0];

            if (videoTrack) {
                videoProducerRef.current = await transport.produce({
                    track: videoTrack,
                    // Phase 3: Adaptive Bitrate / Simulcast implementation
                    encodings: [
                        { maxBitrate: 100000 },
                        { maxBitrate: 300000 },
                        { maxBitrate: 900000 }
                    ],
                    codecOptions: { videoGoogleStartBitrate: 1000 }
                });
            }

            if (audioTrack) {
                audioProducerRef.current = await transport.produce({ track: audioTrack });
            }

            setIsStreaming(true);

        } catch (err) {
            console.error('Failed to start stream:', err);
            setError(err.message);
            stopStreaming();
        }
    };

    const stopStreaming = useCallback(() => {
        if (localStream) {
            localStream.getTracks().forEach(track => track.stop());
            setLocalStream(null);
        }

        if (socketRef.current) {
            socketRef.current.emit('stream-ended', { streamId });
            socketRef.current.disconnect();
            socketRef.current = null;
        }

        if (transportRef.current) transportRef.current.close();
        if (videoProducerRef.current) videoProducerRef.current.close();
        if (audioProducerRef.current) audioProducerRef.current.close();

        setIsStreaming(false);
        setViewerCount(0);
    }, [localStream, streamId]);

    // Cleanup on unmount
    useEffect(() => {
        return () => stopStreaming();
    }, [stopStreaming]);

    return {
        localStream,
        isStreaming,
        error,
        viewerCount,
        startStreaming,
        stopStreaming
    };
};