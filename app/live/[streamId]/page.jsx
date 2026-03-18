"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { useSelector } from "react-redux";
// import { io } from "socket.io-client";
import * as mediasoupClient from "mediasoup-client";
import { Users, AlertCircle, Loader2 } from "lucide-react";
import LiveChat from "@/components/live/LiveChat"; 
import { socket } from "@/lib/socket";
export default function LiveViewerPage() {
    const { streamId } = useParams();
    const { user } = useSelector((state) => state.auth);
    
    // Multiple Video Refs for Dual Tracks
    const mainVideoRef = useRef(null); // Used for Screen (or Camera if only 1)
    const pipVideoRef = useRef(null);  // Used for Camera if Screen is active

    const socketRef = useRef(null);
    const deviceRef = useRef(null);
    const transportRef = useRef(null);
    const consumersRef = useRef(new Map());

    const [isLive, setIsLive] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [viewerCount, setViewerCount] = useState(0);
    const [streamInfo, setStreamInfo] = useState({ title: "Live Stream" });
    
    // Track how many video feeds we have
    const [videoTracksCount, setVideoTracksCount] = useState(0);

    const socketRequest = (socket, event, data, responseEvent) => {
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => reject(new Error(`Timeout on ${event}`)), 15000);
            
            // Centralized cleanup to prevent memory leaks
            const cleanup = () => {
                clearTimeout(timeout);
                socket.off(responseEvent, handleSuccess);
                socket.off(`${event}-error`, handleError);
                socket.off('stream-error', handleGenericError);
            };

            const handleSuccess = (res) => {
                cleanup();
                if (res?.error) reject(new Error(res.error));
                else resolve(res);
            };

            const handleError = (err) => {
                cleanup();
                reject(new Error(err?.error || "Socket request failed"));
            };

            // THE FIX: Catch the generic errors the backend spits out when a stream is offline
            const handleGenericError = (err) => {
                cleanup();
                reject(new Error(err?.error || err?.message || "Stream is currently unavailable"));
            };

            socket.once(responseEvent, handleSuccess);
            socket.once(`${event}-error`, handleError);
            socket.once('stream-error', handleGenericError); 
            
            socket.emit(event, data);
        });
    };

   useEffect(() => {
        if (!streamId) return;

        let isMounted = true;
        let pollingInterval = null;
        let isFetchingProducers = false;
        const pendingConsumers = new Set();

        const viewerId = user?._id || `guest_${Math.random().toString(36).substr(2, 9)}`;

        const initViewer = async () => {
            try {
                setIsLoading(true);
                setError(null);

                // 1. Ensure the shared socket is connected
                if (!socket.connected) {
                    socket.connect();
                }

                // 2. Strict Connection Waiter (Fixes the memory leak and phantom timeouts)
                await new Promise((resolve, reject) => {
                    if (socket.connected) return resolve();
                    
                    const timer = setTimeout(() => {
                        reject(new Error("Socket connection timed out. Is the backend running?"));
                    }, 10000);

                    const onConnect = () => {
                        clearTimeout(timer);
                        socket.off('connect_error', onError);
                        resolve();
                    };

                    const onError = (err) => {
                        clearTimeout(timer);
                        socket.off('connect', onConnect);
                        reject(new Error(`Socket connection failed: ${err.message}`));
                    };

                    socket.once('connect', onConnect);
                    socket.once('connect_error', onError);
                });

                // 3. React Strict Mode Failsafe: Stop if the component unmounted while waiting
                if (!isMounted) return;

                // Bind standard listeners
                socket.on('viewer-count-update', (data) => setViewerCount(data.count || data.currentViewerCount || 0));
                socket.on('stream-ended', () => {
                    setIsLive(false);
                    setError("This live stream has ended.");
                    if (mainVideoRef.current) mainVideoRef.current.srcObject = null;
                    if (pipVideoRef.current) pipVideoRef.current.srcObject = null;
                });

                // 4. Request to join the room
                const joinRes = await socketRequest(socket, 'join-webrtc-stream', { streamId, userId: viewerId }, 'stream-joined');
                
                if (!isMounted) return; // Second failsafe
                
                setIsLive(true);
                setViewerCount(joinRes.totalViewers);
                if (joinRes.streamTitle) setStreamInfo({ title: joinRes.streamTitle });

                // 5. Setup Mediasoup
                const { capabilities } = await socketRequest(socket, 'get-router-capabilities', { streamId }, 'router-capabilities');
                const device = new mediasoupClient.Device();
                await device.load({ routerRtpCapabilities: capabilities });
                deviceRef.current = device;

                const { transport: transportOptions } = await socketRequest(socket, 'create-transport', { streamId, direction: 'recv' }, 'transport-created');
                const transport = device.createRecvTransport(transportOptions);
                transportRef.current = transport;

                transport.on('connect', async ({ dtlsParameters }, callback, errback) => {
                    try {
                        await socketRequest(socket, 'connect-transport', { transportId: transport.id, dtlsParameters }, 'transport-connected');
                        callback();
                    } catch (err) { errback(err); }
                });

                // ... Keep your existing consumeTrack and fetchAndConsumeProducers logic here ...
                const consumeTrack = async (producer) => {
                    if (consumersRef.current.has(producer.id) || pendingConsumers.has(producer.id)) return null;
                    pendingConsumers.add(producer.id);
                    try {
                        const { consumer: consumerOptions } = await socketRequest(socket, 'consume', {
                            transportId: transport.id, producerId: producer.id, rtpCapabilities: device.rtpCapabilities
                        }, 'consumer-created');

                        const consumer = await transport.consume({
                            id: consumerOptions.id, producerId: consumerOptions.producerId, kind: consumerOptions.kind, rtpParameters: consumerOptions.rtpParameters
                        });
                        consumersRef.current.set(producer.id, consumer);
                        return consumer.track;
                    } catch (err) {
                        console.error(`Failed to consume track ${producer.kind}:`, err);
                        return null;
                    } finally {
                        pendingConsumers.delete(producer.id);
                    }
                };

                const fetchAndConsumeProducers = async () => {
                    if (isFetchingProducers) return;
                    isFetchingProducers = true;

                    try {
                        const { producers } = await socketRequest(socket, 'get-producers', { streamId }, 'producers-list');
                        if (producers && producers.length > 0) {
                            
                            const videoProducers = producers.filter(p => p.kind === 'video');
                            const audioProducers = producers.filter(p => p.kind === 'audio');

                            setVideoTracksCount(videoProducers.length);

                            const videoTracks = [];
                            for (const p of videoProducers) {
                                const t = await consumeTrack(p);
                                if (t) videoTracks.push(t);
                            }

                            const audioTracks = [];
                            for (const p of audioProducers) {
                                const t = await consumeTrack(p);
                                if (t) audioTracks.push(t);
                            }

                            if (videoTracks.length > 0 || audioTracks.length > 0) {
                                if (videoProducers.length <= 1 && mainVideoRef.current) {
                                    const currentTracks = mainVideoRef.current.srcObject ? mainVideoRef.current.srcObject.getTracks() : [];
                                    mainVideoRef.current.srcObject = new MediaStream([...currentTracks, ...videoTracks, ...audioTracks]);
                                } else if (videoProducers.length >= 2 && mainVideoRef.current && pipVideoRef.current) {
                                    // Make sure we have the tracks before applying them
                                    const camStream = new MediaStream([videoProducers[0] ? await consumeTrack(videoProducers[0]) : null].filter(Boolean));
                                    const screenStream = new MediaStream([videoProducers[1] ? await consumeTrack(videoProducers[1]) : null, ...audioTracks].filter(Boolean));
                                    
                                    pipVideoRef.current.srcObject = camStream;
                                    mainVideoRef.current.srcObject = screenStream;
                                }
                            }

                            if (videoProducers.length > 0) setIsLoading(false);
                        }
                    } catch (err) { 
                        console.error("Error fetching producers:", err); 
                    } finally {
                        isFetchingProducers = false;
                    }
                };

                await fetchAndConsumeProducers();
                pollingInterval = setInterval(fetchAndConsumeProducers, 3000);

            } catch (err) {
                console.error("Viewer setup failed:", err);
                if (isMounted) { setError(err.message || "Failed to connect to stream."); setIsLoading(false); }
            }
        };

        initViewer();

        return () => {
            isMounted = false;
            if (pollingInterval) clearInterval(pollingInterval);
            
            // Do NOT call socket.disconnect() here since it's a shared socket instance!
            // Just emit leave-stream and clean up transports.
            socket.emit('leave-stream', streamId);
            socket.off('viewer-count-update');
            socket.off('stream-ended');
            
            if (transportRef.current) transportRef.current.close();
            consumersRef.current.forEach(c => c.close());
        };
    }, [streamId, user]);

    return (
        <div className="mx-auto max-w-[1400px] p-4 sm:p-6 lg:p-8 min-h-[calc(100vh-70px)] bg-[#09090b]">
            <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white">{streamInfo.title}</h1>
                </div>
                {isLive && !error && (
                    <div className="flex gap-3">
                        <div className="flex items-center gap-2 rounded-full bg-gray-900/80 border border-gray-800 px-4 py-2 text-sm font-bold text-gray-200">
                            <Users className="h-4 w-4 text-blue-400" />{viewerCount} Watching
                        </div>
                        <div className="flex items-center gap-2 rounded-full bg-red-500/10 border border-red-500/20 px-5 py-2 text-sm font-bold text-red-500 animate-pulse">
                            <div className="h-2 w-2 rounded-full bg-red-500" />LIVE
                        </div>
                    </div>
                )}
            </div>

            <div className="grid gap-6 lg:grid-cols-12">
                <div className="lg:col-span-8 lg:col-start-1">
                    <div className="relative aspect-video overflow-hidden rounded-2xl border border-gray-800 bg-[#0f0f13] shadow-2xl">
                        
                        {isLoading && !error && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 z-30">
                                <Loader2 className="h-10 w-10 text-blue-500 animate-spin mb-4" />
                                <p className="text-gray-400 font-medium">Connecting to live feed...</p>
                            </div>
                        )}

                        {error && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 z-30 backdrop-blur-sm">
                                <div className="h-16 w-16 bg-red-500/10 rounded-full flex items-center justify-center mb-4">
                                    <AlertCircle className="h-8 w-8 text-red-500" />
                                </div>
                                <h2 className="text-xl font-bold text-white mb-2">Stream Unavailable</h2>
                                <p className="text-gray-400">{error}</p>
                                <button onClick={() => window.history.back()} className="mt-6 px-6 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-xl">Go Back</button>
                            </div>
                        )}

                        {/* PICTURE-IN-PICTURE FOR DUAL TRACKS */}
                        
                        {/* CAMERA BUBBLE (Only visible if 2 tracks exist) */}
                        <video 
                            ref={pipVideoRef} autoPlay playsInline muted
                            className={`absolute bottom-4 right-4 w-40 h-56 lg:w-48 lg:h-64 object-cover rounded-xl border-2 border-gray-700/50 shadow-2xl z-20 transition-all duration-500 ${videoTracksCount >= 2 ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}
                        />

                        {/* MAIN FEED (Screen Share or Camera) */}
                        <video 
                            ref={mainVideoRef} autoPlay playsInline controls={!isLoading && !error}
                            className={`w-full h-full object-contain transition-opacity duration-500 z-10 ${isLoading || error ? 'opacity-0' : 'opacity-100'}`}
                        />
                    </div>
                </div>

                <div className="lg:col-span-4 lg:col-start-9 h-[600px] lg:h-auto">
                    <div className="h-full rounded-2xl border border-gray-800 bg-[#0f0f13] shadow-xl overflow-hidden flex flex-col">
                        <LiveChat streamId={streamId} user={user} />
                    </div>
                </div>
            </div>
        </div>
    );
}