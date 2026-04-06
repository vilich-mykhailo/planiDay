// socket.js
import { io } from "socket.io-client";

export const socket = io(import.meta.env.VITE_API_URL, {
  transports: ["websocket"],
  withCredentials: true,
  autoConnect: true,
});

socket.on("connect", () => {
  console.log("✅ Socket connected:", socket.id);

  const userId = localStorage.getItem("userId");
  const role = localStorage.getItem("role");
  const studioId = localStorage.getItem("studioId");

  socket.emit("auth:join", {
    userId,
    role,
    studioId,
  });

  if (role === "client" && userId) {
    socket.emit("join:client", { clientId: userId });
  }

  if (studioId) {
    socket.emit("join:studio", { studioId });
  }
});