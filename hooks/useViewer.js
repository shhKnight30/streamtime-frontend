import { useState, useEffect, useRef, useCallback } from "react";
import { Device } from "mediasoup-client";
import { socket } from "@/lib/socket";

function socketRequest(event, data, responseEvent, timeoutMs = 15000) {
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
      reject(new Error(err?.error || "Stream error"));
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

export function useViewer(streamId, userId) {
  const [remoteStream, setRemoteStream] = useState(null);
  const [isLive, setIsLive]             = useState(false);
  const [error, setError]               = useState(null);
  const [viewerCount, setViewerCount]   = useState(0);

  const deviceRef    = useRef(null);
  const transportRef = useRef(null);
  const consumersRef = useRef(new Map());

  useEffect(() => {
    const handler = (d) => setViewerCount(d.count ?? d.currentViewerCount ?? 0);
    socket.on("viewer-count-update", handler);
    socket.on("stream-ended", () => {
      setIsLive(false);
      setRemoteStream(null);
    });
    return () => {
      socket.off("viewer-count-update", handler);
      socket.off("stream-ended");
    };
  }, []);

  const startViewing = async () => {
    try {
      setError(null);

      if (!socket.connected) {
        socket.connect();
        await new Promise((resolve, reject) => {
          const t = setTimeout(() => reject(new Error("Socket timeout")), 10000);
          socket.once("connect", () => { clearTimeout(t); resolve(); });
          socket.once("connect_error", (err) => { clearTimeout(t); reject(err); });
        });
      }

      const joinRes = await socketRequest("join-webrtc-stream", { streamId, userId }, "stream-joined");
      setViewerCount(joinRes.totalViewers ?? 0);
      setIsLive(true);

      const { capabilities } = await socketRequest("get-router-capabilities", { streamId }, "router-capabilities");
      const device = new Device();
      await device.load({ routerRtpCapabilities: capabilities });
      deviceRef.current = device;

      const { transport: transportOpts } = await socketRequest("create-transport", { streamId, direction: "recv" }, "transport-created");
      const transport = device.createRecvTransport(transportOpts);
      transportRef.current = transport;

      transport.on("connect", async ({ dtlsParameters }, callback, errback) => {
        try {
          await socketRequest("connect-transport", { transportId: transport.id, dtlsParameters }, "transport-connected");
          callback();
        } catch (err) { errback(err); }
      });

      const { producers } = await socketRequest("get-producers", { streamId }, "producers-list");
      const stream = new MediaStream();

      for (const producer of producers) {
        if (consumersRef.current.has(producer.id)) continue;

        const { consumer: opts } = await socketRequest("consume", {
          transportId: transport.id,
          producerId: producer.id,
          rtpCapabilities: device.rtpCapabilities,
        }, "consumer-created");

        const consumer = await transport.consume({
          id: opts.id,
          producerId: opts.producerId,
          kind: opts.kind,
          rtpParameters: opts.rtpParameters,
        });

        consumersRef.current.set(producer.id, consumer);
        stream.addTrack(consumer.track);
      }

      setRemoteStream(stream);
    } catch (err) {
      console.error("useViewer: start failed:", err);
      setError(err.message);
      stopViewing();
    }
  };

  const stopViewing = useCallback(() => {
    socket.emit("leave-stream", streamId);

    consumersRef.current.forEach((c) => c.close());
    consumersRef.current.clear();

    transportRef.current?.close();
    transportRef.current = null;
    deviceRef.current    = null;

    if (socket.connected) socket.disconnect();

    setRemoteStream(null);
    setIsLive(false);
  }, [streamId]);

  useEffect(() => {
    return () => stopViewing();
  }, [stopViewing]);

  return { remoteStream, isLive, error, viewerCount, startViewing, stopViewing };
}