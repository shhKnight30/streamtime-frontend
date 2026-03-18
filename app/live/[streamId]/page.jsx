"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { useSelector } from "react-redux";
import { socket } from "@/lib/socket";
import * as mediasoupClient from "mediasoup-client";
import { Users, AlertCircle } from "lucide-react";

export default function LiveViewerPage() {
  const { streamId } = useParams();
  const { user } = useSelector((state) => state.auth);

  const videoRef = useRef(null);
  const [status, setStatus] = useState("Connecting...");
  const [viewerCount, setViewerCount] = useState(0);
  const [streamTitle, setStreamTitle] = useState("");
  const [isStreamActive, setIsStreamActive] = useState(true);

  // Mediasoup refs
  const deviceRef = useRef(null);
  const recvTransportRef = useRef(null);

  useEffect(() => {
    if (!streamId) return;

    const initViewer = async () => {
      if (!socket.connected) socket.connect();

      setStatus("Joining stream...");
      socket.emit("join-webrtc-stream", { streamId, userId: user?._id || "anonymous" });

      // 1. Successfully joined the room
      socket.once("stream-joined", ({ streamTitle, totalViewers }) => {
        setStreamTitle(streamTitle);
        setViewerCount(totalViewers);
        setStatus("Loading video...");
        startWebRTC();
      });

      // Handle stream not existing
      socket.once("stream-error", ({ error }) => {
        setStatus(`Error: ${error}`);
        setIsStreamActive(false);
      });
    };

    const startWebRTC = () => {
      // 2. Get Router Capabilities
      socket.emit("get-router-capabilities", { streamId });
      
      socket.once("router-capabilities", async ({ capabilities }) => {
        try {
          deviceRef.current = new mediasoupClient.Device();
          await deviceRef.current.load({ routerRtpCapabilities: capabilities });

          // 3. Create a Transport to RECEIVE Media
          socket.emit("create-transport", { streamId, direction: "recv" });
        } catch (err) {
          console.error(err);
          setStatus("Hardware/Browser not supported.");
        }
      });

      // 4. Connect the Transport
      socket.once("transport-created", async ({ transport }) => {
        recvTransportRef.current = deviceRef.current.createRecvTransport(transport);

        recvTransportRef.current.on("connect", ({ dtlsParameters }, callback, errback) => {
          socket.emit("connect-transport", { transportId: transport.id, dtlsParameters });
          socket.once("transport-connected", () => callback());
        });

        // 5. Ask the server for the streamer's video/audio tracks
        socket.emit("get-producers", { streamId });
      });

      // 6. Consume the Tracks
      socket.once("producers-list", async ({ producers }) => {
        if (producers.length === 0) {
          setStatus("Waiting for creator to start video...");
          return;
        }

        const stream = new MediaStream(); // Create an empty stream

        for (const producer of producers) {
          // Tell backend we want to consume this specific track
          socket.emit("consume", {
            transportId: recvTransportRef.current.id,
            producerId: producer.id,
            rtpCapabilities: deviceRef.current.rtpCapabilities,
          });

          // Wait for backend to approve
          await new Promise((resolve) => {
            const handleConsumerCreated = async ({ consumer }) => {
              if (consumer.producerId !== producer.id) return; 
              
              // Tell our local device to decode the track
              const localConsumer = await recvTransportRef.current.consume({
                id: consumer.id,
                producerId: consumer.producerId,
                kind: consumer.kind,
                rtpParameters: consumer.rtpParameters,
              });

              // Add the decoded track to our media stream
              stream.addTrack(localConsumer.track);
              socket.off("consumer-created", handleConsumerCreated); // cleanup listener
              resolve();
            };
            socket.on("consumer-created", handleConsumerCreated);
          });
        }

        // 7. Play the video!
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setStatus("Live");
        }
      });
    };

    // --- Live Socket Listeners ---
    socket.on("viewer-joined", ({ totalViewers }) => setViewerCount(totalViewers));
    socket.on("viewer-left", ({ totalViewers }) => setViewerCount(totalViewers));
    socket.on("stream-ended", () => {
      setIsStreamActive(false);
      setStatus("Stream has ended.");
    });

    initViewer();

    // Cleanup when leaving page
    return () => {
      if (recvTransportRef.current) recvTransportRef.current.close();
      socket.emit("leave-stream", streamId);
      socket.off("stream-joined");
      socket.off("stream-error");
      socket.off("router-capabilities");
      socket.off("transport-created");
      socket.off("producers-list");
      socket.off("viewer-joined");
      socket.off("viewer-left");
      socket.off("stream-ended");
    };
  }, [streamId, user]);

  return (
    <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column: Video Player */}
        <div className="lg:col-span-2 space-y-4">
          <div className="relative aspect-video overflow-hidden rounded-xl border border-[var(--border)] bg-black shadow-sm flex items-center justify-center">
            
            <video
              ref={videoRef}
              autoPlay
              playsInline
              controls
              className={`h-full w-full object-contain transition-opacity ${status === 'Live' ? 'opacity-100' : 'opacity-0'}`}
            />
            
            {/* Status Overlay */}
            {status !== "Live" && isStreamActive && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/80 backdrop-blur-sm z-10 text-white">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
                <p className="font-medium">{status}</p>
              </div>
            )}

            {!isStreamActive && (
               <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-[var(--surface-raised)] z-10 text-[var(--text-muted)]">
                 <AlertCircle className="h-12 w-12 opacity-50" />
                 <p className="text-lg font-medium">{status}</p>
               </div>
            )}
          </div>

          {/* Stream Info */}
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)]">
              {streamTitle || "Loading Stream..."}
            </h1>
            <div className="mt-2 flex items-center gap-4 text-sm text-[var(--text-muted)]">
              <span className="flex items-center gap-1 font-medium text-red-500">
                <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" /> LIVE
              </span>
              <span className="flex items-center gap-1">
                <Users className="h-4 w-4" /> {viewerCount} watching
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Live Chat Placeholder */}
        <div className="flex h-[400px] lg:h-[600px] flex-col rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-sm">
          <div className="border-b border-[var(--border)] p-4">
            <h2 className="font-bold text-[var(--text-primary)]">Live Chat</h2>
          </div>
          <div className="flex-1 overflow-y-auto p-4 flex flex-col items-center justify-center text-center text-[var(--text-muted)]">
            <p className="text-sm">Welcome to the live chat!</p>
            <p className="text-xs mt-1">Chat feature coming soon.</p>
          </div>
          <div className="border-t border-[var(--border)] p-4 flex gap-2">
            <input
              type="text"
              placeholder="Chat is disabled"
              disabled
              className="flex-1 rounded-full border border-[var(--border)] bg-[var(--surface-raised)] px-4 py-2 text-sm outline-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
}