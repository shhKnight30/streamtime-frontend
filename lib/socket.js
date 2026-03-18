import { io } from "socket.io-client";

// Connect to your backend URL (make sure this matches your Express server port)
const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || "http://localhost:4000";

export const socket = io(SOCKET_URL, {
    transports: ["websocket"],
  withCredentials: true,
  autoConnect: false, // We only connect when they go to the Live Studio
});