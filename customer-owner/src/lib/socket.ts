import { io, type Socket } from "socket.io-client";
const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000";

let socket: Socket | null = null;

export function getSocket() {
  return socket;
}

export function connectSocket(token: string) {
  if (!token) return null;

  if (socket?.connected) {
    return socket;
  }

  if (socket) {
    socket.auth = { token };
    socket.connect();
    return socket;
  }

  socket = io(API_BASE, {
    path: "/socket.io",
    transports: ["websocket", "polling"],
    autoConnect: true,
    auth: { token },
  });

  return socket;
}

export function disconnectSocket() {
  if (!socket) return;
  socket.disconnect();
  socket = null;
}
