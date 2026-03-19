import { useState, useEffect, useRef, useCallback } from "react";
import { Device } from "mediasoup-client";
import { socket } from "@/lib/socket";

// Helper — same pattern as the live pages
function socketRequest(event, data, responseEvent, timeoutMs = 10000) {
  return new Promise((resolve, reject) => {
    let settled = false;

    const cleanup = () => {
      clearTimeout(timer);
      socket.off(responseEvent, onSuccess);
      socket.off("stream-error", onError);
    };

    const onSuccess = (res) => {
      if (settled) return;
      settled = true;
      cleanup();
      if (res?.error) reject(new Error(res.error));
      else resolve(res);
    };

    const onError = (err) => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(new Error(err?.error || "Socket error"));
    };

    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(new Error(`Timeout: ${responseEvent}`));
    }, timeoutMs);

    socket.once(responseEvent, onSuccess);
    socket.once("stream-error", onError);
    socket.emit(event, data);
  });
}

export function useStream(streamId, userId, streamTitle) {
  const [localStream, setLocalStream] = useState(null);
  const [isStreaming, setIsStreaming]  = useState(false);
  const [error, setError]             = useState(null);
  const [viewerCount, setViewerCount] = useState(0);

  const deviceRef        = useRef(null);
  const transportRef     = useRef(null);
  const videoProducerRef = useRef(null);
  const audioProducerRef = useRef(null);
  const localStreamRef   = useRef(null);

  // Viewer count listener
  useEffect(() => {
    const handler = (d) => setViewerCount(d.count ?? d.currentViewerCount ?? 0);
    socket.on("viewer-count-update", handler);
    return () => socket.off("viewer-count-update", handler);
  }, []);

  const startStreaming = async () => {
    try {
      setError(null);

      // Acquire media
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30 } },
        audio: { echoCancellation: true, noiseSuppression: true },
      });
      setLocalStream(stream);
      localStreamRef.current = stream;

      // Connect socket
      if (!socket.connected) socket.connect();

      await socketRequest("start-webrtc-stream", { streamId, userId, streamTitle }, "stream-started");

      const { capabilities } = await socketRequest("get-router-capabilities", { streamId }, "router-capabilities");

      const device = new Device();
      await device.load({ routerRtpCapabilities: capabilities });
      deviceRef.current = device;

      const { transport: transportOpts } = await socketRequest("create-transport", { streamId, direction: "send" }, "transport-created");
      const transport = device.createSendTransport(transportOpts);
      transportRef.current = transport;

      transport.on("connect", async ({ dtlsParameters }, callback, errback) => {
        try {
          await socketRequest("connect-transport", { transportId: transport.id, dtlsParameters }, "transport-connected");
          callback();
        } catch (err) { errback(err); }
      });

      transport.on("produce", async ({ kind, rtpParameters }, callback, errback) => {
        try {
          const { producer } = await socketRequest("produce", { transportId: transport.id, kind, rtpParameters }, "producer-created");
          callback({ id: producer.id });
        } catch (err) { errback(err); }
      });

      const videoTrack = stream.getVideoTracks()[0];
      const audioTrack = stream.getAudioTracks()[0];

      if (videoTrack?.readyState === "live") {
        videoProducerRef.current = await transport.produce({ track: videoTrack });
      }
      if (audioTrack?.readyState === "live") {
        audioProducerRef.current = await transport.produce({ track: audioTrack });
      }

      setIsStreaming(true);
    } catch (err) {
      console.error("useStream: start failed:", err);
      setError(err.message);
      stopStreaming();
    }
  };

  const stopStreaming = useCallback(() => {
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;
    setLocalStream(null);

    videoProducerRef.current?.close();
    audioProducerRef.current?.close();
    transportRef.current?.close();

    videoProducerRef.current = null;
    audioProducerRef.current = null;
    transportRef.current     = null;
    deviceRef.current        = null;

    if (socket.connected) {
      socket.emit("stream-ended", { streamId });
      socket.disconnect();
    }

    setIsStreaming(false);
    setViewerCount(0);
  }, [streamId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isStreaming) stopStreaming();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return { localStream, isStreaming, error, viewerCount, startStreaming, stopStreaming };
}