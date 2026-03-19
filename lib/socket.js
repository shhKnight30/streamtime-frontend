import { io } from "socket.io-client";

// const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'  // ← correct

export const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL, {
  transports: ["websocket"],
  withCredentials: true,
  autoConnect: false,
});