"use client";

import { useState, useRef, useEffect } from "react";
import { useSelector } from "react-redux";
import { toast } from "sonner";
import { Video, Mic, MicOff, VideoOff, Settings, Play, Square, Users, Copy, Loader2, MonitorUp, MonitorOff } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import LiveChat from "@/components/live/LiveChat";
import { socket } from "@/lib/socket";
import * as mediasoupClient from "mediasoup-client";

export default function CreatorLiveStudio() {
    const { user } = useSelector((state) => state.auth);

    // Media Refs
    const videoRef = useRef(null);
    const screenVideoRef = useRef(null); // NEW: Ref for screen share
    
    // Media State
    const [localStream, setLocalStream] = useState(null);
    const [isCameraOn, setIsCameraOn] = useState(true);
    const [isMicOn, setIsMicOn] = useState(true);
    
    // Screen Share State
    const [isScreenSharing, setIsScreenSharing] = useState(false);
    const screenTrackRef = useRef(null);

    // Stream State
    const [title, setTitle] = useState("");
    const [isLive, setIsLive] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [viewerCount, setViewerCount] = useState(0);
    const [dbStreamId, setDbStreamId] = useState(null);

    // WebRTC / Mediasoup Refs
    const deviceRef = useRef(null);
    const sendTransportRef = useRef(null);
    const videoProducerRef = useRef(null);
    const audioProducerRef = useRef(null);
    const screenProducerRef = useRef(null); // NEW: Producer for screen share

    const streamId = user?._id ? `stream_${user._id}` : null;

    useEffect(() => {
        async function setupMedia() {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: { width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30 } },
                    audio: { echoCancellation: true, noiseSuppression: true },
                });
                setLocalStream(stream);
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                }
            } catch (err) {
                toast.error("Could not access camera/microphone.");
            }
        }
        setupMedia();

        socket.on('viewer-count-update', (data) => setViewerCount(data.count || data.currentViewerCount || 0));

        return () => {
            handleEndStream();
            socket.off('viewer-count-update');
        };
    }, []);

    const socketRequest = (event, data, responseEvent) => {
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => reject(new Error(`Timeout waiting for ${responseEvent}`)), 10000);
            socket.once(responseEvent, (res) => {
                clearTimeout(timeout);
                if (res?.error) reject(new Error(res.error));
                else resolve(res);
            });
            socket.once(`${event}-error`, (err) => {
                clearTimeout(timeout);
                reject(new Error(err?.error || "Socket request failed"));
            });
            socket.emit(event, data);
        });
    };

    const handleStartStream = async () => {
        if (!title.trim()) return toast.error("Please enter a stream title!");
        if (!localStream || !streamId) return toast.error("Hardware not ready.");

        setIsConnecting(true);
        const toastId = toast.loading("Starting broadcast engine...");

        let activeStream = localStream;
        let videoTrack = activeStream?.getVideoTracks()[0];
        let audioTrack = activeStream?.getAudioTracks()[0];

        if (!videoTrack || videoTrack.readyState === 'ended') {
            try {
                toast.loading("Re-initializing camera...", { id: toastId });
                activeStream = await navigator.mediaDevices.getUserMedia({
                    video: { width: { ideal: 1280 }, height: { ideal: 720 } },
                    audio: { echoCancellation: true, noiseSuppression: true },
                });
                setLocalStream(activeStream);
                if (videoRef.current) videoRef.current.srcObject = activeStream;
                videoTrack = activeStream.getVideoTracks()[0];
                audioTrack = activeStream.getAudioTracks()[0];
            } catch (err) {
                toast.dismiss(toastId);
                setIsConnecting(false);
                return toast.error("Camera disconnected.");
            }
        }

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/live-stream/create`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, category: 'other', visibility: 'public' })
            });
            const dbRes = await res.json();
            const createdStreamId = dbRes?.data?.stream?._id || dbRes?.data?._id;

            if (!createdStreamId) throw new Error("Database failed to register stream.");
            setDbStreamId(createdStreamId);

            if (!socket.connected) socket.connect();

            await socketRequest('start-webrtc-stream', { streamId, userId: user._id, streamTitle: title, dbStreamId: createdStreamId }, 'stream-started');
            const { capabilities } = await socketRequest('get-router-capabilities', { streamId }, 'router-capabilities');

            deviceRef.current = new mediasoupClient.Device();
            await deviceRef.current.load({ routerRtpCapabilities: capabilities });

            const { transport } = await socketRequest('create-transport', { streamId, direction: 'send' }, 'transport-created');
            sendTransportRef.current = deviceRef.current.createSendTransport(transport);

            sendTransportRef.current.on('connect', async ({ dtlsParameters }, callback, errback) => {
                try {
                    await socketRequest('connect-transport', { transportId: sendTransportRef.current.id, dtlsParameters }, 'transport-connected');
                    callback();
                } catch (err) { errback(err); }
            });

            sendTransportRef.current.on('produce', async ({ kind, rtpParameters }, callback, errback) => {
                try {
                    const { producer } = await socketRequest('produce', { transportId: sendTransportRef.current.id, kind, rtpParameters }, 'producer-created');
                    callback({ id: producer.id });
                } catch (err) { errback(err); }
            });

            // Produce Camera
            if (videoTrack && videoTrack.readyState === 'live') {
                videoProducerRef.current = await sendTransportRef.current.produce({ track: videoTrack });
            }
            // Produce Mic
            if (audioTrack && audioTrack.readyState === 'live') {
                audioProducerRef.current = await sendTransportRef.current.produce({ track: audioTrack });
            }
            // Produce Screen (if active before going live)
            if (isScreenSharing && screenTrackRef.current) {
                screenProducerRef.current = await sendTransportRef.current.produce({ track: screenTrackRef.current });
            }

            setIsLive(true);
            toast.success("You are now LIVE! 🔴", { id: toastId });

        } catch (err) {
            console.error("Stream Start Error:", err);
            toast.error(err.message || "Failed to start stream.", { id: toastId });
            handleEndStream();
        } finally {
            setIsConnecting(false);
        }
    };

    const handleEndStream = async () => {
        setIsLive(false);
        setViewerCount(0);
        setIsConnecting(false);

        if (videoProducerRef.current) videoProducerRef.current.close();
        if (audioProducerRef.current) audioProducerRef.current.close();
        if (screenProducerRef.current) screenProducerRef.current.close();
        if (sendTransportRef.current) sendTransportRef.current.close();

        if (socket.connected) {
            socket.emit('stream-ended', { streamId });
            socket.disconnect();
        }

        if (dbStreamId) {
            try {
                await fetch(`${process.env.NEXT_PUBLIC_API_URL}/live-stream/${dbStreamId}/stop`, { method: 'POST', credentials: 'include' });
            } catch (err) {}
        }
        if (isScreenSharing) stopScreenShare();
    };

    // --- DUAL TRACK SCREEN SHARE LOGIC ---
    const toggleScreenShare = async () => {
        try {
            if (!isScreenSharing) {
                const displayStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
                const screenVideoTrack = displayStream.getVideoTracks()[0];
                if (!screenVideoTrack) return;

                screenVideoTrack.onended = () => stopScreenShare();

                // Produce SECOND track dynamically if already live
                if (isLive && sendTransportRef.current) {
                    screenProducerRef.current = await sendTransportRef.current.produce({ track: screenVideoTrack });
                }

                if (screenVideoRef.current) {
                    screenVideoRef.current.srcObject = new MediaStream([screenVideoTrack]);
                }

                screenTrackRef.current = screenVideoTrack;
                setIsScreenSharing(true);
            } else {
                stopScreenShare();
            }
        } catch (err) {
            toast.error("Screen sharing cancelled.");
        }
    };

    const stopScreenShare = () => {
        if (screenTrackRef.current) {
            screenTrackRef.current.stop();
            screenTrackRef.current = null;
        }
        if (screenProducerRef.current) {
            screenProducerRef.current.close();
            screenProducerRef.current = null;
        }
        if (screenVideoRef.current) {
            screenVideoRef.current.srcObject = null;
        }
        setIsScreenSharing(false);
    };

    const toggleCamera = () => {
        if (localStream) {
            const videoTrack = localStream.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = !videoTrack.enabled;
                setIsCameraOn(videoTrack.enabled);
                if (videoProducerRef.current) {
                    videoTrack.enabled ? videoProducerRef.current.resume() : videoProducerRef.current.pause();
                }
            }
        }
    };

    const toggleMic = () => {
        if (localStream) {
            const audioTrack = localStream.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                setIsMicOn(audioTrack.enabled);
                if (audioProducerRef.current) {
                    audioTrack.enabled ? audioProducerRef.current.resume() : audioProducerRef.current.pause();
                }
            }
        }
    };

    return (
        <div className="flex flex-col lg:flex-row h-[calc(100vh-70px)] bg-[#09090b] text-white overflow-hidden font-sans">
            {/* MAIN STAGE */}
            <div className="flex-1 flex flex-col p-4 lg:p-6 relative min-w-0">
                <div className="flex items-center justify-between mb-4 shrink-0">
                    <div className="flex flex-col">
                        <h1 className="text-2xl font-bold truncate max-w-[500px] tracking-tight">{title || "Untitled Studio"}</h1>
                        <p className="text-sm text-gray-500">{user?.username}'s Channel</p>
                    </div>
                    {isLive && (
                        <div className="flex items-center gap-3 bg-[#18181b] border border-white/10 px-4 py-2 rounded-full shadow-lg">
                            <span className="flex items-center gap-2 text-red-500 text-xs font-bold animate-pulse"><div className="w-2 h-2 bg-red-500 rounded-full"></div>LIVE</span>
                            <div className="w-px h-4 bg-gray-700 mx-1"></div>
                            <span className="flex items-center gap-2 text-gray-300 text-xs font-semibold"><Users className="w-4 h-4 text-blue-400" />{viewerCount} Viewers</span>
                        </div>
                    )}
                </div>

                {/* DUAL VIDEO LAYOUT */}
                <div className="flex-1 relative bg-[#0f0f13] border border-gray-800/60 rounded-3xl overflow-hidden shadow-2xl flex items-center justify-center group">
                    
                    {/* CAMERA (Becomes small Picture-in-Picture when screen sharing) */}
                    <video 
                        ref={videoRef} autoPlay muted playsInline 
                        className={`object-cover transition-all duration-500 shadow-2xl transform scale-x-[-1]
                            ${isScreenSharing ? 'absolute bottom-24 right-6 w-48 h-64 rounded-2xl z-30 border-2 border-gray-700/50' : 'w-full h-full'} 
                            ${!isCameraOn ? 'opacity-0' : 'opacity-100'}
                        `} 
                    />

                    {/* SCREEN SHARE (Main Background) */}
                    <video 
                        ref={screenVideoRef} autoPlay muted playsInline 
                        className={`absolute inset-0 w-full h-full object-contain transition-opacity duration-300 z-10 ${isScreenSharing ? 'opacity-100' : 'opacity-0'}`} 
                    />

                    {!isCameraOn && !isScreenSharing && (
                         <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#09090b]/90 backdrop-blur-md z-20">
                              <div className="w-32 h-32 rounded-full bg-gray-800 border-4 border-gray-900 overflow-hidden mb-4 shadow-xl">
                                   <img src={user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username}`} className="w-full h-full object-cover" />
                              </div>
                              <p className="text-gray-400 font-medium">Camera Disabled</p>
                         </div>
                    )}
                    
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/60 backdrop-blur-xl border border-white/10 p-2 rounded-2xl shadow-2xl z-40 transition-transform hover:scale-[1.02]">
                        <button onClick={toggleMic} className={`p-4 rounded-xl transition-all ${isMicOn ? 'bg-gray-800/80 hover:bg-gray-700 text-white' : 'bg-red-500/20 text-red-500'}`}>
                            {isMicOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                        </button>
                        <button onClick={toggleCamera} className={`p-4 rounded-xl transition-all ${isCameraOn ? 'bg-gray-800/80 hover:bg-gray-700 text-white' : 'bg-red-500/20 text-red-500'}`}>
                            {isCameraOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
                        </button>
                        <div className="w-px h-8 bg-white/10 mx-1"></div>
                        <button onClick={toggleScreenShare} className={`p-4 rounded-xl transition-all ${isScreenSharing ? 'bg-blue-600 text-white' : 'bg-gray-800/80 hover:bg-gray-700 text-white'}`}>
                            {isScreenSharing ? <MonitorOff className="w-5 h-5" /> : <MonitorUp className="w-5 h-5" />}
                        </button>
                        {isLive && (
                            <>
                                <div className="w-px h-8 bg-white/10 mx-1"></div>
                                <button onClick={handleEndStream} className="ml-1 px-6 py-4 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold flex items-center gap-2"><Square className="w-4 h-4 fill-current" /> END</button>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* SIDE PANEL */}
            <div className="w-full lg:w-[400px] border-l border-gray-800/60 bg-[#0f0f13] flex flex-col shrink-0 z-10">
                {!isLive ? (
                    <div className="p-6 flex flex-col h-full overflow-y-auto">
                        <div className="flex items-center gap-3 mb-8"><div className="p-2.5 bg-blue-500/20 text-blue-400 rounded-xl"><Settings className="w-5 h-5" /></div><h2 className="text-xl font-bold">Setup</h2></div>
                        <div className="space-y-6 flex-1">
                            <div>
                                <label className="text-xs font-bold text-gray-400 mb-2 block">Stream Title</label>
                                <Input placeholder="What are you broadcasting?" value={title} onChange={(e) => setTitle(e.target.value)} className="bg-[#18181b] border-gray-800 text-white h-14" />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-400 mb-2 block">Viewer Link</label>
                                <div className="flex gap-2">
                                    <div className="flex-1 bg-black/40 border border-gray-800 rounded-xl px-4 py-3 text-sm text-gray-400 truncate">{`${typeof window !== 'undefined' ? window.location.origin : ''}/live/${streamId || ''}`}</div>
                                    <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/live/${streamId}`); toast.success("Copied!"); }} className="p-3 bg-gray-800 rounded-xl"><Copy className="w-5 h-5" /></button>
                                </div>
                            </div>
                        </div>
                        <Button onClick={handleStartStream} disabled={isConnecting || !localStream} className="w-full mt-6 h-16 text-lg font-bold bg-blue-600 hover:bg-blue-500 text-white rounded-xl">
                            {isConnecting ? <Loader2 className="w-6 h-6 animate-spin" /> : <><Play className="w-5 h-5 mr-2 fill-current" /> GO LIVE</>}
                        </Button>
                    </div>
                ) : (
                    <div className="flex flex-col h-full w-full animate-in fade-in duration-500">
                        <LiveChat streamId={streamId} user={user} />
                    </div>
                )}
            </div>
        </div>
    );
}