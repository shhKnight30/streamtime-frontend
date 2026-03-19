"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useSelector } from "react-redux";
import { toast } from "sonner";
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  MonitorUp,
  MonitorOff,
  Play,
  Square,
  Users,
  Copy,
  Loader2,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import LiveChat from "@/components/live/LiveChat";
import { socket } from "@/lib/socket";
import { useCreateLiveStreamMutation } from "@/store/services/liveStreamApi";
import * as mediasoupClient from "mediasoup-client";

// ─── Reusable socket promise helper ───────────────────────────────────────────
function socketRequest(event, data, responseEvent, timeoutMs = 10000) {
  return new Promise((resolve, reject) => {
    let settled = false;

    const cleanup = () => {
      clearTimeout(timer);
      socket.off(responseEvent, onSuccess);
      socket.off("stream-error", onStreamError);
    };

    const onSuccess = (res) => {
      if (settled) return;
      settled = true;
      cleanup();
      if (res?.error) reject(new Error(res.error));
      else resolve(res);
    };

    const onStreamError = (err) => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(new Error(err?.error || "Stream error"));
    };

    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(new Error(`Timeout: no response for "${responseEvent}" in ${timeoutMs}ms`));
    }, timeoutMs);

    socket.once(responseEvent, onSuccess);
    socket.once("stream-error", onStreamError);
    socket.emit(event, data);
  });
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function CreatorLiveStudio() {
  const { user } = useSelector((state) => state.auth);

  // UI state
  const [title, setTitle]               = useState("");
  const [isLive, setIsLive]             = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [viewerCount, setViewerCount]   = useState(0);

  // Media state
  const [localStream, setLocalStream]       = useState(null);
  const [isCameraOn, setIsCameraOn]         = useState(true);
  const [isMicOn, setIsMicOn]               = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  // DB stream id (for stop-stream API call)
  const [dbStreamId, setDbStreamId] = useState(null);

  // Refs — keep current values without stale closures
  const videoRef       = useRef(null);
  const screenVideoRef = useRef(null);
  const localStreamRef = useRef(null);         // always current stream
  const isScreenRef    = useRef(false);         // always current screen-share state
  const screenTrackRef = useRef(null);

  // mediasoup refs
  const deviceRef        = useRef(null);
  const sendTransportRef = useRef(null);
  const videoProducerRef = useRef(null);
  const audioProducerRef = useRef(null);
  const screenProducerRef = useRef(null);

  const streamId = user?._id ? `stream_${user._id}` : null;

  // RTK Query
  const [createLiveStream] = useCreateLiveStreamMutation();

  // ── Camera init ─────────────────────────────────────────────────────────────
  useEffect(() => {
    let stream;
    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30 } },
          audio: { echoCancellation: true, noiseSuppression: true },
        });
        setLocalStream(stream);
        localStreamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
      } catch {
        toast.error("Could not access camera/microphone. Please allow permissions.");
      }
    })();

    return () => {
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  // ── Viewer count ────────────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (data) =>
      setViewerCount(data.count ?? data.currentViewerCount ?? 0);
    socket.on("viewer-count-update", handler);
    return () => socket.off("viewer-count-update", handler);
  }, []);

  // ── GO LIVE ─────────────────────────────────────────────────────────────────
  const handleStartStream = async () => {
    if (!title.trim()) return toast.error("Please enter a stream title!");

    let stream = localStreamRef.current;

    // If camera track is dead, re-acquire
    if (!stream || stream.getVideoTracks()[0]?.readyState === "ended") {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: { echoCancellation: true, noiseSuppression: true },
        });
        setLocalStream(stream);
        localStreamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
      } catch {
        return toast.error("Camera unavailable. Please allow permissions and try again.");
      }
    }

    setIsConnecting(true);
    const tid = toast.loading("Connecting to broadcast server...");

    try {
      // 1. Create LiveStream document in DB via RTK Query
      const result = await createLiveStream({
        title: title.trim(),
        category: "other",
        visibility: "public",
      }).unwrap();

      const createdDbId = result?.data?.stream?._id || result?.data?._id;
      if (!createdDbId) throw new Error("Failed to register stream in database.");
      setDbStreamId(createdDbId);

      // 2. Connect shared socket
      if (!socket.connected) socket.connect();

      // 3. Signal backend
      await socketRequest(
        "start-webrtc-stream",
        { streamId, userId: user._id, streamTitle: title.trim(), dbStreamId: createdDbId },
        "stream-started"
      );

      // 4. Get router capabilities & load Device
      const { capabilities } = await socketRequest(
        "get-router-capabilities",
        { streamId },
        "router-capabilities"
      );

      deviceRef.current = new mediasoupClient.Device();
      await deviceRef.current.load({ routerRtpCapabilities: capabilities });

      // 5. Create send transport
      const { transport: transportOpts } = await socketRequest(
        "create-transport",
        { streamId, direction: "send" },
        "transport-created"
      );

      sendTransportRef.current = deviceRef.current.createSendTransport(transportOpts);

      sendTransportRef.current.on("connect", async ({ dtlsParameters }, callback, errback) => {
        try {
          await socketRequest(
            "connect-transport",
            { transportId: sendTransportRef.current.id, dtlsParameters },
            "transport-connected"
          );
          callback();
        } catch (err) {
          errback(err);
        }
      });

      sendTransportRef.current.on("produce", async ({ kind, rtpParameters }, callback, errback) => {
        try {
          const { producer } = await socketRequest(
            "produce",
            { transportId: sendTransportRef.current.id, kind, rtpParameters },
            "producer-created"
          );
          callback({ id: producer.id });
        } catch (err) {
          errback(err);
        }
      });

      // 6. Produce camera + mic tracks
      const videoTrack = stream.getVideoTracks()[0];
      const audioTrack = stream.getAudioTracks()[0];

      if (videoTrack?.readyState === "live") {
        videoProducerRef.current = await sendTransportRef.current.produce({ track: videoTrack });
      }
      if (audioTrack?.readyState === "live") {
        audioProducerRef.current = await sendTransportRef.current.produce({ track: audioTrack });
      }

      // 7. If screen share was started before going live, produce that too
      if (isScreenRef.current && screenTrackRef.current) {
        screenProducerRef.current = await sendTransportRef.current.produce({
          track: screenTrackRef.current,
        });
      }

      setIsLive(true);
      toast.success("🔴 You are now LIVE!", { id: tid });
    } catch (err) {
      console.error("Stream start failed:", err);
      toast.error(err.message || "Failed to start stream.", { id: tid });
      await cleanupStream();
    } finally {
      setIsConnecting(false);
    }
  };

  // ── END STREAM ───────────────────────────────────────────────────────────────
  const cleanupStream = useCallback(async () => {
    setIsLive(false);
    setIsConnecting(false);
    setViewerCount(0);

    // Close producers
    videoProducerRef.current?.close();
    audioProducerRef.current?.close();
    screenProducerRef.current?.close();
    sendTransportRef.current?.close();

    videoProducerRef.current  = null;
    audioProducerRef.current  = null;
    screenProducerRef.current = null;
    sendTransportRef.current  = null;
    deviceRef.current         = null;

    // Stop screen share if active
    if (isScreenRef.current) stopScreenShare();

    // Signal backend & disconnect
    if (socket.connected) {
      socket.emit("stream-ended", { streamId });
      socket.disconnect();
    }

    // Tell backend to mark stream ended in DB
    if (dbStreamId) {
      try {
        await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/live-stream/${dbStreamId}/stop`,
          { method: "POST", credentials: "include" }
        );
      } catch {
        // non-critical — backend will clean up on socket disconnect too
      }
      setDbStreamId(null);
    }
  }, [streamId, dbStreamId]);

  const handleEndStream = () => cleanupStream();

  // ── SCREEN SHARE ─────────────────────────────────────────────────────────────
  const toggleScreenShare = async () => {
    if (isScreenRef.current) {
      stopScreenShare();
      return;
    }

    try {
      const displayStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
      const screenTrack = displayStream.getVideoTracks()[0];
      if (!screenTrack) return;

      screenTrack.onended = () => stopScreenShare();
      screenTrackRef.current = screenTrack;

      if (screenVideoRef.current) {
        screenVideoRef.current.srcObject = new MediaStream([screenTrack]);
      }

      // If already live, produce the screen track immediately
      if (isLive && sendTransportRef.current) {
        screenProducerRef.current = await sendTransportRef.current.produce({ track: screenTrack });
      }

      setIsScreenSharing(true);
      isScreenRef.current = true;
    } catch (err) {
      if (err.name !== "NotAllowedError") {
        toast.error("Screen sharing failed.");
      }
    }
  };

  const stopScreenShare = () => {
    screenTrackRef.current?.stop();
    screenTrackRef.current = null;

    screenProducerRef.current?.close();
    screenProducerRef.current = null;

    if (screenVideoRef.current) screenVideoRef.current.srcObject = null;

    setIsScreenSharing(false);
    isScreenRef.current = false;
  };

  // ── CAMERA & MIC TOGGLES ────────────────────────────────────────────────────
  const toggleCamera = () => {
    const track = localStreamRef.current?.getVideoTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setIsCameraOn(track.enabled);
    if (videoProducerRef.current) {
      track.enabled
        ? videoProducerRef.current.resume()
        : videoProducerRef.current.pause();
    }
  };

  const toggleMic = () => {
    const track = localStreamRef.current?.getAudioTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setIsMicOn(track.enabled);
    if (audioProducerRef.current) {
      track.enabled
        ? audioProducerRef.current.resume()
        : audioProducerRef.current.pause();
    }
  };

  // ── Cleanup on unmount ───────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (isLive) cleanupStream();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Share link ───────────────────────────────────────────────────────────────
  const viewerLink =
    typeof window !== "undefined" && streamId
      ? `${window.location.origin}/live/${streamId}`
      : "";

  const copyLink = () => {
    if (!viewerLink) return;
    navigator.clipboard.writeText(viewerLink);
    toast.success("Viewer link copied!");
  };

  // ────────────────────────────────────────────────────────────────────────────
  // RENDER
  // ────────────────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-56px)] bg-[#09090b] text-white overflow-hidden">
      {/* ── LEFT: Video Stage ── */}
      <div className="flex-1 flex flex-col p-4 lg:p-6 min-w-0">
        {/* Title bar */}
        <div className="flex items-center justify-between mb-4 shrink-0">
          <div>
            <h1 className="text-xl font-bold truncate max-w-xs lg:max-w-lg">
              {title || "Live Studio"}
            </h1>
            <p className="text-sm text-gray-500">@{user?.username}</p>
          </div>
          {isLive && (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-gray-900 border border-gray-800 px-3 py-1.5 rounded-full text-sm font-semibold">
                <Users className="w-4 h-4 text-blue-400" />
                {viewerCount}
              </div>
              <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 px-3 py-1.5 rounded-full text-sm font-bold text-red-500 animate-pulse">
                <span className="w-2 h-2 bg-red-500 rounded-full" />
                LIVE
              </div>
            </div>
          )}
        </div>

        {/* Video preview */}
        <div className="flex-1 relative bg-black rounded-2xl overflow-hidden border border-gray-800 min-h-0">
          {/* Main feed: screen share fills background, camera is PiP */}
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className={`object-cover transition-all duration-500 transform scale-x-[-1]
              ${isScreenSharing
                ? "absolute bottom-4 right-4 w-40 h-28 lg:w-48 lg:h-36 rounded-xl z-20 border border-gray-700 shadow-2xl"
                : "w-full h-full"}
              ${!isCameraOn ? "opacity-0" : "opacity-100"}`}
          />

          {/* Screen share feed */}
          <video
            ref={screenVideoRef}
            autoPlay
            muted
            playsInline
            className={`absolute inset-0 w-full h-full object-contain transition-opacity duration-300 z-10
              ${isScreenSharing ? "opacity-100" : "opacity-0 pointer-events-none"}`}
          />

          {/* Camera-off placeholder */}
          {!isCameraOn && !isScreenSharing && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 z-30">
              <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-gray-700 mb-3">
                <img
                  src={
                    user?.avatar ||
                    `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username}`
                  }
                  alt="avatar"
                  className="w-full h-full object-cover"
                />
              </div>
              <p className="text-gray-400 text-sm">Camera is off</p>
            </div>
          )}

          {/* Controls bar */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 bg-black/70 backdrop-blur-md border border-white/10 px-4 py-2 rounded-2xl">
            <button
              onClick={toggleMic}
              title={isMicOn ? "Mute mic" : "Unmute mic"}
              className={`p-3 rounded-xl transition-colors ${
                isMicOn ? "bg-gray-800 hover:bg-gray-700" : "bg-red-600 hover:bg-red-500"
              }`}
            >
              {isMicOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
            </button>

            <button
              onClick={toggleCamera}
              title={isCameraOn ? "Turn off camera" : "Turn on camera"}
              className={`p-3 rounded-xl transition-colors ${
                isCameraOn ? "bg-gray-800 hover:bg-gray-700" : "bg-red-600 hover:bg-red-500"
              }`}
            >
              {isCameraOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
            </button>

            <div className="w-px h-6 bg-white/20 mx-1" />

            <button
              onClick={toggleScreenShare}
              title={isScreenSharing ? "Stop sharing" : "Share screen"}
              className={`p-3 rounded-xl transition-colors ${
                isScreenSharing ? "bg-blue-600 hover:bg-blue-500" : "bg-gray-800 hover:bg-gray-700"
              }`}
            >
              {isScreenSharing ? (
                <MonitorOff className="w-5 h-5" />
              ) : (
                <MonitorUp className="w-5 h-5" />
              )}
            </button>

            {isLive && (
              <>
                <div className="w-px h-6 bg-white/20 mx-1" />
                <button
                  onClick={handleEndStream}
                  className="flex items-center gap-2 px-4 py-3 bg-red-600 hover:bg-red-500 rounded-xl font-bold text-sm transition-colors"
                >
                  <Square className="w-4 h-4 fill-current" />
                  END
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── RIGHT: Setup / Chat panel ── */}
      <div className="w-full lg:w-[380px] border-t lg:border-t-0 lg:border-l border-gray-800 bg-[#0f0f13] flex flex-col shrink-0">
        {!isLive ? (
          /* Setup panel */
          <div className="flex flex-col h-full p-6 overflow-y-auto">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-blue-500/20 rounded-xl">
                <Settings className="w-5 h-5 text-blue-400" />
              </div>
              <h2 className="text-lg font-bold">Stream Setup</h2>
            </div>

            <div className="space-y-5 flex-1">
              {/* Title */}
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2">
                  Stream Title *
                </label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Coding a full-stack app live!"
                  maxLength={100}
                  className="bg-gray-900 border-gray-800 text-white h-11 focus-visible:ring-blue-500"
                  disabled={isConnecting}
                />
                <p className="text-xs text-gray-600 mt-1 text-right">{title.length}/100</p>
              </div>

              {/* Viewer link */}
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2">
                  Viewer Link
                </label>
                <div className="flex gap-2">
                  <div className="flex-1 bg-black/50 border border-gray-800 rounded-xl px-3 py-2.5 text-sm text-gray-400 truncate">
                    {viewerLink || "Link will appear here"}
                  </div>
                  <button
                    onClick={copyLink}
                    disabled={!viewerLink}
                    className="p-2.5 bg-gray-800 hover:bg-gray-700 disabled:opacity-40 rounded-xl transition-colors"
                    title="Copy viewer link"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Go Live button */}
            <Button
              onClick={handleStartStream}
              disabled={isConnecting || !title.trim() || !localStream}
              className="w-full mt-6 h-14 text-base font-bold bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-xl"
            >
              {isConnecting ? (
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
              ) : (
                <Play className="w-5 h-5 mr-2 fill-current" />
              )}
              {isConnecting ? "Connecting..." : "GO LIVE"}
            </Button>
          </div>
        ) : (
          /* Live chat */
          <div className="flex flex-col flex-1 min-h-0">
            <LiveChat streamId={streamId} user={user} />
          </div>
        )}
      </div>
    </div>
  );
}