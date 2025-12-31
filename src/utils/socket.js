import { io } from "socket.io-client";

const SOCKET_URL = "http://localhost:5000"; // Ton URL backend
export const socket = io(SOCKET_URL, {
  autoConnect: true,
});
