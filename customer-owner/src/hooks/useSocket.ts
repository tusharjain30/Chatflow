import { useEffect, useRef } from "react";
import type { Socket } from "socket.io-client";
import { connectSocket, disconnectSocket, getSocket } from "@/lib/socket";
import { getAuthToken } from "@/utils/authStorage";

type Handler = (...args: any[]) => void;

/**
 * Connects to the backend Socket.IO server while authenticated
 * and optionally binds event listeners.
 */
export function useSocket(events?: Record<string, Handler>) {
  const eventsRef = useRef(events);
  eventsRef.current = events;

  useEffect(() => {
    const token = getAuthToken();
    if (!token) return;

    const socket = connectSocket(token);
    if (!socket) return;

    const bound: Array<[string, Handler]> = [];

    const bind = (s: Socket) => {
      const map = eventsRef.current || {};
      Object.entries(map).forEach(([event, handler]) => {
        s.on(event, handler);
        bound.push([event, handler]);
      });
    };

    if (socket.connected) {
      bind(socket);
    } else {
      socket.once("connect", () => bind(socket));
    }

    return () => {
      bound.forEach(([event, handler]) => {
        getSocket()?.off(event, handler);
      });
    };
  }, []);

  useEffect(() => {
    return () => {
      // Keep the shared socket alive across pages; AuthContext can disconnect on logout.
    };
  }, []);
}

export { disconnectSocket };
