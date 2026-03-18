"use client";

import { useState, useRef, useEffect } from "react";
import { useSelector } from "react-redux";
import { toast } from "sonner";
import { Video, Mic, MicOff, VideoOff, Settings, Play, Square, Users } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

// 1. Import Socket and Mediasoup Client
import { socket } from "@/lib/socket"; 
import * as mediasoupClient from "mediasoup-client";

export default function CreatorLiveStudio() {
  const { user } = useSelector((state) => state.auth);
  
  // Media State
  const videoRef = useRef(null);
  const [localStream, setLocalStream] = useState(null);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);

  // Stream State
  const [title, setTitle] = useState("");
  const [isLive, setIsLive] = useState(false);
  const [viewerCount, setViewerCount] = useState(0);

  // WebRTC / Mediasoup State (Kept in refs so they persist without triggering re-renders)
  const deviceRef = useRef(null);
  const sendTransportRef = useRef(null);
  const videoProducerRef = useRef(null);
  const audioProducerRef = useRef(null);
  
  // Create a unique room ID based on the user's ID
  const streamId = user?._id ? `stream_${user._id}` : null;

  // --- INITIALIZE WEBCAM ON LOAD ---
  useEffect(() => {
    async function setupMedia() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 1280, height: 720 },
          audio: true,
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

    // Setup Socket Listeners for Viewer Count
    socket.on('viewer-joined', (data) => setViewerCount(data.totalViewers));
    socket.on('viewer-left', (data) => setViewerCount(data.totalViewers));

    return () => {
      handleEndStream();
      socket.off('viewer-joined');
      socket.off('viewer-left');
    };
  }, []);

  // --- START THE WEBRTC MAGIC ---
  const handleStartStream = async () => {
    if (!title.trim()) return toast.error("Please enter a stream title!");
    if (!localStream || !streamId) return toast.error("Hardware not ready.");

    try {
      setIsLive(true);
      toast.success("Connecting to server...");

      // 1. Connect Socket
      if (!socket.connected) {
        socket.connect();
      }

      // 2. Tell backend we are starting
      socket.emit('start-webrtc-stream', { streamId, userId: user._id, streamTitle: title });

      // 3. Get Router Capabilities
      socket.emit('get-router-capabilities', { streamId });
      
      socket.once('router-capabilities', async ({ capabilities }) => {
        // Initialize Mediasoup Device
        deviceRef.current = new mediasoupClient.Device();
        await deviceRef.current.load({ routerRtpCapabilities: capabilities });

        // 4. Request a Transport to Send Media
        socket.emit('create-transport', { streamId, direction: 'send' });
      });

      // 5. Backend sends us Transport Info, we connect it locally
      socket.once('transport-created', async ({ transport }) => {
        sendTransportRef.current = deviceRef.current.createSendTransport(transport);

        // --- Handle WebRTC Events triggered by the local transport ---
        
        // A. Transport needs to connect (DTLS Handshake)
        sendTransportRef.current.on('connect', ({ dtlsParameters }, callback, errback) => {
           // Wait! We need an endpoint for this in our backend!
           // Currently, your backend doesn't have a 'connect-transport' event listener.
           // *NOTE: We will need to add this to websocket.service.js later.*
           socket.emit('connect-transport', { transportId: transport.id, dtlsParameters });
           socket.once('transport-connected', () => callback());
        });

        // B. Transport needs to produce (Send video tracks)
        sendTransportRef.current.on('produce', async (parameters, callback, errback) => {
            socket.emit('produce', {
                transportId: transport.id,
                kind: parameters.kind,
                rtpParameters: parameters.rtpParameters,
            });

            socket.once('producer-created', ({ producer }) => {
                callback({ id: producer.id }); // Tell the local transport it worked
            });
        });

        // 6. Finally, push our local tracks through the transport!
        const videoTrack = localStream.getVideoTracks()[0];
        const audioTrack = localStream.getAudioTracks()[0];

        if (videoTrack) {
          videoProducerRef.current = await sendTransportRef.current.produce({ track: videoTrack });
        }
        if (audioTrack) {
          audioProducerRef.current = await sendTransportRef.current.produce({ track: audioTrack });
        }

        toast.success("You are now LIVE! 🔴");
      });

    } catch (err) {
      console.error(err);
      toast.error("Failed to start stream.");
      setIsLive(false);
    }
  };

  const handleEndStream = () => {
    setIsLive(false);
    setViewerCount(0);
    
    // Stop local producers
    if (videoProducerRef.current) videoProducerRef.current.close();
    if (audioProducerRef.current) audioProducerRef.current.close();
    if (sendTransportRef.current) sendTransportRef.current.close();
    
    // Notify server
    if (socket.connected) {
      socket.emit('stream-ended', { streamId });
      socket.disconnect();
    }
  };

  // UI Toggles
  const toggleCamera = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsCameraOn(videoTrack.enabled);
        // If live, pause/resume the producer too
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
    <div className="mx-auto max-w-6xl p-4 sm:p-6 lg:p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">Live Control Room</h1>
          <p className="text-sm text-[var(--text-muted)]">Setup your stream and go live to your subscribers.</p>
        </div>
        
        {isLive && (
          <div className="flex gap-4">
             <div className="flex items-center gap-2 rounded-full bg-[var(--surface-raised)] px-4 py-1.5 text-sm font-bold border border-[var(--border)]">
                <Users className="h-4 w-4 text-blue-500" />
                {viewerCount} Viewers
             </div>
             <div className="flex items-center gap-2 rounded-full bg-red-500/10 px-4 py-1.5 text-sm font-bold text-red-500 animate-pulse">
                <div className="h-2 w-2 rounded-full bg-red-500" />
                LIVE
             </div>
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column: Video Preview */}
        <div className="lg:col-span-2 space-y-4">
          <div className="relative aspect-video overflow-hidden rounded-xl border border-[var(--border)] bg-black shadow-sm">
            <video ref={videoRef} autoPlay playsInline muted className={`h-full w-full object-cover transition-opacity ${!isCameraOn ? 'opacity-0' : 'opacity-100'}`} />
            
            {!isCameraOn && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-[var(--surface-raised)]">
                <div className="h-24 w-24 overflow-hidden rounded-full border-4 border-[var(--border)]">
                  <img src={user?.avatar || "https://api.dicebear.com/7.x/avataaars/svg"} alt="Avatar" />
                </div>
                <p className="text-sm font-medium text-[var(--text-muted)]">Camera is turned off</p>
              </div>
            )}
            
            {/* Controls */}
            <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-4 rounded-full bg-black/60 px-6 py-3 backdrop-blur-md">
              <button onClick={toggleMic} className={`rounded-full p-3 transition-colors ${isMicOn ? 'bg-[var(--surface-raised)] text-white hover:bg-[var(--surface)]' : 'bg-red-500 text-white hover:bg-red-600'}`}>
                {isMicOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
              </button>
              <button onClick={toggleCamera} className={`rounded-full p-3 transition-colors ${isCameraOn ? 'bg-[var(--surface-raised)] text-white hover:bg-[var(--surface)]' : 'bg-red-500 text-white hover:bg-red-600'}`}>
                {isCameraOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
              </button>
              <button className="rounded-full bg-[var(--surface-raised)] p-3 text-white transition-colors hover:bg-[var(--surface)]">
                <Settings className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Settings */}
        <div className="space-y-6 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm flex flex-col">
          <div>
            <h2 className="text-lg font-bold text-[var(--text-primary)]">Stream Settings</h2>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Stream Title</label>
              <Input placeholder="e.g., Coding a YouTube Clone!" value={title} onChange={(e) => setTitle(e.target.value)} disabled={isLive} />
            </div>
          </div>

          <div className="pt-4 border-t border-[var(--border)] mt-auto">
            {!isLive ? (
              <Button onClick={handleStartStream} className="w-full bg-blue-600 text-white hover:bg-blue-700 py-6 text-lg font-bold rounded-xl">
                <Play className="mr-2 h-5 w-5" /> GO LIVE
              </Button>
            ) : (
              <Button onClick={handleEndStream} variant="destructive" className="w-full py-6 text-lg font-bold rounded-xl bg-red-600 hover:bg-red-700">
                <Square className="mr-2 h-5 w-5" /> END STREAM
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}