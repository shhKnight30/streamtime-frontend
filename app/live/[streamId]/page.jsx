"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { useSelector } from "react-redux";
import { Users, AlertCircle, Loader2 } from "lucide-react";
import LiveChat from "@/components/live/LiveChat";
import { socket } from "@/lib/socket";
import * as mediasoupClient from "mediasoup-client";

// ─── Reusable socket promise helper (same pattern as streamer page) ────────────
function socketRequest(event, data, responseEvent, timeoutMs = 15000) {
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
      reject(new Error(err?.error || "Stream unavailable"));
    };

    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(new Error(`Timeout waiting for "${responseEvent}"`));
    }, timeoutMs);

    socket.once(responseEvent, onSuccess);
    socket.once("stream-error", onStreamError);
    socket.emit(event, data);
  });
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function LiveViewerPage() {
  const { streamId } = useParams();
  const { user }     = useSelector((state) => state.auth);

  // Video refs — main (screen or camera) + picture-in-picture
  const mainVideoRef = useRef(null);
  const pipVideoRef  = useRef(null);

  // mediasoup refs
  const deviceRef    = useRef(null);
  const transportRef = useRef(null);
  const consumersRef = useRef(new Map()); // producerId → consumer

  // UI state
  const [isLoading, setIsLoading]         = useState(true);
  const [isLive, setIsLive]               = useState(false);
  const [error, setError]                 = useState(null);
  const [viewerCount, setViewerCount]     = useState(0);
  const [streamTitle, setStreamTitle]     = useState("Live Stream");
  const [dualVideo, setDualVideo]         = useState(false); // true when 2 video tracks

  // Track consumer creation to avoid duplicates during polling
  const pendingConsumers = useRef(new Set());

  // ── Consume one producer track ─────────────────────────────────────────────
  const consumeTrack = useCallback(async (producer) => {
    if (
      consumersRef.current.has(producer.id) ||
      pendingConsumers.current.has(producer.id)
    ) return null;

    pendingConsumers.current.add(producer.id);

    try {
      const { consumer: opts } = await socketRequest(
        "consume",
        {
          transportId:    transportRef.current.id,
          producerId:     producer.id,
          rtpCapabilities: deviceRef.current.rtpCapabilities,
        },
        "consumer-created"
      );

      const consumer = await transportRef.current.consume({
        id:            opts.id,
        producerId:    opts.producerId,
        kind:          opts.kind,
        rtpParameters: opts.rtpParameters,
      });

      consumersRef.current.set(producer.id, consumer);

      consumer.on("trackended", () => {
        consumersRef.current.delete(producer.id);
      });

      return consumer.track;
    } catch (err) {
      console.error(`Failed to consume ${producer.kind} track:`, err);
      return null;
    } finally {
      pendingConsumers.current.delete(producer.id);
    }
  }, []);

  // ── Fetch producers & attach to video elements ─────────────────────────────
  const fetchAndRenderProducers = useCallback(async () => {
    try {
      const { producers } = await socketRequest(
        "get-producers",
        { streamId },
        "producers-list"
      );

      if (!producers?.length) return;

      const videoProducers = producers.filter((p) => p.kind === "video");
      const audioProducers = producers.filter((p) => p.kind === "audio");

      // Consume all tracks
      const videoTracks = (
        await Promise.all(videoProducers.map(consumeTrack))
      ).filter(Boolean);

      const audioTracks = (
        await Promise.all(audioProducers.map(consumeTrack))
      ).filter(Boolean);

      if (!videoTracks.length && !audioTracks.length) return;

      if (videoTracks.length >= 2) {
        // Dual video: first = camera (PiP), second = screen (main)
        setDualVideo(true);
        if (pipVideoRef.current) {
          pipVideoRef.current.srcObject = new MediaStream([videoTracks[0]]);
        }
        if (mainVideoRef.current) {
          mainVideoRef.current.srcObject = new MediaStream([
            videoTracks[1],
            ...audioTracks,
          ]);
        }
      } else {
        // Single video
        setDualVideo(false);
        if (mainVideoRef.current) {
          mainVideoRef.current.srcObject = new MediaStream([
            ...videoTracks,
            ...audioTracks,
          ]);
        }
      }

      setIsLoading(false);
    } catch (err) {
      // Producers may not be ready yet — the polling interval will retry
      console.warn("fetchAndRenderProducers:", err.message);
    }
  }, [streamId, consumeTrack]);

  // ── Main viewer init ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!streamId) return;

    let isMounted     = true;
    let pollInterval  = null;

    const viewerId =
      user?._id || `guest_${Math.random().toString(36).slice(2, 9)}`;

    const init = async () => {
      try {
        // 1. Connect shared socket
        if (!socket.connected) {
          socket.connect();
          await new Promise((resolve, reject) => {
            const t = setTimeout(
              () => reject(new Error("Socket connection timed out")),
              10000
            );
            socket.once("connect", () => { clearTimeout(t); resolve(); });
            socket.once("connect_error", (err) => {
              clearTimeout(t);
              reject(new Error(`Connection failed: ${err.message}`));
            });
          });
        }

        if (!isMounted) return;

        // 2. Attach persistent event listeners
        socket.on("viewer-count-update", (d) =>
          setViewerCount(d.count ?? d.currentViewerCount ?? 0)
        );
        socket.on("stream-ended", () => {
          setIsLive(false);
          setError("This stream has ended.");
          if (mainVideoRef.current) mainVideoRef.current.srcObject = null;
          if (pipVideoRef.current)  pipVideoRef.current.srcObject  = null;
        });

        // 3. Join the stream room
        const joinRes = await socketRequest(
          "join-webrtc-stream",
          { streamId, userId: viewerId },
          "stream-joined"
        );

        if (!isMounted) return;

        setIsLive(true);
        setViewerCount(joinRes.totalViewers ?? 0);
        if (joinRes.streamTitle) setStreamTitle(joinRes.streamTitle);

        // 4. Load mediasoup Device
        const { capabilities } = await socketRequest(
          "get-router-capabilities",
          { streamId },
          "router-capabilities"
        );

        deviceRef.current = new mediasoupClient.Device();
        await deviceRef.current.load({ routerRtpCapabilities: capabilities });

        // 5. Create receive transport
        const { transport: transportOpts } = await socketRequest(
          "create-transport",
          { streamId, direction: "recv" },
          "transport-created"
        );

        const transport = deviceRef.current.createRecvTransport(transportOpts);
        transportRef.current = transport;

        transport.on("connect", async ({ dtlsParameters }, callback, errback) => {
          try {
            await socketRequest(
              "connect-transport",
              { transportId: transport.id, dtlsParameters },
              "transport-connected"
            );
            callback();
          } catch (err) {
            errback(err);
          }
        });

        // 6. Initial fetch + polling (in case screen share is added later)
        await fetchAndRenderProducers();
        pollInterval = setInterval(fetchAndRenderProducers, 4000);
      } catch (err) {
        console.error("Viewer init failed:", err);
        if (isMounted) {
          setError(err.message || "Could not connect to the stream.");
          setIsLoading(false);
        }
      }
    };

    init();

    return () => {
      isMounted = false;
      clearInterval(pollInterval);

      // Signal leave & clean up
      socket.emit("leave-stream", streamId);
      socket.off("viewer-count-update");
      socket.off("stream-ended");

      // Close consumers & transport (don't disconnect — socket may be reused)
      consumersRef.current.forEach((c) => c.close());
      consumersRef.current.clear();
      transportRef.current?.close();
      transportRef.current = null;
      deviceRef.current    = null;

      // Disconnect only if no other page is using the socket
      if (socket.connected) socket.disconnect();
    };
  }, [streamId, user, fetchAndRenderProducers]);

  // ────────────────────────────────────────────────────────────────────────────
  // RENDER
  // ────────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-[calc(100vh-56px)] bg-[#09090b] text-white p-4 sm:p-6">
      {/* Title + status bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <h1 className="text-2xl font-bold truncate">{streamTitle}</h1>
        {isLive && !error && (
          <div className="flex items-center gap-3 shrink-0">
            <div className="flex items-center gap-2 bg-gray-900 border border-gray-800 px-3 py-1.5 rounded-full text-sm font-semibold">
              <Users className="w-4 h-4 text-blue-400" />
              {viewerCount} watching
            </div>
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 px-4 py-1.5 rounded-full text-sm font-bold text-red-500 animate-pulse">
              <span className="w-2 h-2 bg-red-500 rounded-full" />
              LIVE
            </div>
          </div>
        )}
      </div>

      {/* Grid */}
      <div className="grid gap-4 lg:grid-cols-12">
        {/* Video */}
        <div className="lg:col-span-8">
          <div className="relative aspect-video rounded-2xl overflow-hidden bg-black border border-gray-800">
            {/* Loading overlay */}
            {isLoading && !error && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 z-30">
                <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-3" />
                <p className="text-gray-400">Connecting to stream…</p>
              </div>
            )}

            {/* Error overlay */}
            {error && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 z-30 p-6 text-center">
                <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-4">
                  <AlertCircle className="w-8 h-8 text-red-500" />
                </div>
                <h2 className="text-lg font-bold mb-2">Stream Unavailable</h2>
                <p className="text-gray-400 text-sm">{error}</p>
                <button
                  onClick={() => window.history.back()}
                  className="mt-5 px-5 py-2 bg-gray-800 hover:bg-gray-700 rounded-xl text-sm transition-colors"
                >
                  Go Back
                </button>
              </div>
            )}

            {/* Camera PiP (only when dual video) */}
            <video
              ref={pipVideoRef}
              autoPlay
              playsInline
              muted
              className={`absolute bottom-4 right-4 w-36 h-24 lg:w-48 lg:h-32 object-cover rounded-xl border border-gray-700 shadow-2xl z-20 transition-all duration-500 ${
                dualVideo ? "opacity-100 scale-100" : "opacity-0 scale-90 pointer-events-none"
              }`}
            />

            {/* Main video */}
            <video
              ref={mainVideoRef}
              autoPlay
              playsInline
              controls={!isLoading && !error}
              className={`w-full h-full object-contain transition-opacity duration-500 ${
                isLoading || error ? "opacity-0" : "opacity-100"
              }`}
            />
          </div>
        </div>

        {/* Chat */}
        <div className="lg:col-span-4 h-[500px] lg:h-auto">
          <div className="h-full rounded-2xl border border-gray-800 overflow-hidden">
            <LiveChat streamId={streamId} user={user} />
          </div>
        </div>
      </div>
    </div>
  );
}