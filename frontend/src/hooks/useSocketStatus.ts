import { useEffect, useState } from "react";
import { getSocket } from "../services/socket.service";

/**
 * Hook para monitorear el estado de conexión del Socket.IO
 * @returns {object} { isConnected: boolean, lastSync: Date | null }
 */
export function useSocketStatus() {
  const [isConnected, setIsConnected] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);

  useEffect(() => {
    const socket = getSocket();

    const handleConnect = () => {
      setIsConnected(true);
      setLastSync(new Date());
      console.log("[Socket Status] Conectado");
    };

    const handleDisconnect = () => {
      setIsConnected(false);
      console.log("[Socket Status] Desconectado");
    };

    socket?.on("connect", handleConnect);
    socket?.on("disconnect", handleDisconnect);

    // Verificar estado actual
    setIsConnected(socket?.connected ?? false);

    return () => {
      socket?.off("connect", handleConnect);
      socket?.off("disconnect", handleDisconnect);
    };
  }, []);

  return { isConnected, lastSync };
}
