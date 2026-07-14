import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

/**
 * Inicializa la conexión a Socket.IO
 * Se conecta al mismo servidor que el API
 */
export function initializeSocket() {
  const apiUrl = import.meta.env.VITE_API_URL?.replace("/api", "") || "http://localhost:3000";

  socket = io(apiUrl, {
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 5,
    transports: ["websocket", "polling"],
  });

  socket.on("connect", () => {
    console.log("[Socket.IO] Conectado al servidor");
  });

  socket.on("disconnect", () => {
    console.log("[Socket.IO] Desconectado del servidor");
  });

  socket.on("connect_error", (error) => {
    console.error("[Socket.IO] Error de conexión:", error);
  });

  return socket;
}

/**
 * Obtiene la instancia del socket, creándola si no existe
 */
export function getSocket() {
  if (!socket) {
    return initializeSocket();
  }
  return socket;
}

/**
 * Desconecta el socket
 */
export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

/**
 * Escucha cambios en productos
 */
export function onProductoCreado(callback: (data: any) => void) {
  const socket = getSocket();
  socket?.on("inventario:PRODUCTO_CREADO", callback);
}

export function onProductoActualizado(callback: (data: any) => void) {
  const socket = getSocket();
  socket?.on("inventario:PRODUCTO_ACTUALIZADO", callback);
}

export function onProductoEliminado(callback: (data: any) => void) {
  const socket = getSocket();
  socket?.on("inventario:PRODUCTO_ELIMINADO", callback);
}

/**
 * Escucha cambios en categorías
 */
export function onCategoriaCreada(callback: (data: any) => void) {
  const socket = getSocket();
  socket?.on("inventario:CATEGORIA_CREADA", callback);
}

export function onCategoriaEliminada(callback: (data: any) => void) {
  const socket = getSocket();
  socket?.on("inventario:CATEGORIA_ELIMINADA", callback);
}

/**
 * Desuscribirse de eventos
 */
export function offProductoCreado(callback: (data: any) => void) {
  const socket = getSocket();
  socket?.off("inventario:PRODUCTO_CREADO", callback);
}

export function offProductoActualizado(callback: (data: any) => void) {
  const socket = getSocket();
  socket?.off("inventario:PRODUCTO_ACTUALIZADO", callback);
}

export function offProductoEliminado(callback: (data: any) => void) {
  const socket = getSocket();
  socket?.off("inventario:PRODUCTO_ELIMINADO", callback);
}

export function offCategoriaCreada(callback: (data: any) => void) {
  const socket = getSocket();
  socket?.off("inventario:CATEGORIA_CREADA", callback);
}

export function offCategoriaEliminada(callback: (data: any) => void) {
  const socket = getSocket();
  socket?.off("inventario:CATEGORIA_ELIMINADA", callback);
}

/**
 * Verifica si el socket está conectado
 */
export function isSocketConnected() {
  return socket?.connected ?? false;
}
