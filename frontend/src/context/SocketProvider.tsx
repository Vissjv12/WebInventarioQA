import { useEffect } from "react";
import type { ReactNode } from "react";
import { initializeSocket, disconnectSocket } from "../services/socket.service";

export function SocketProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    // Inicializar socket cuando el app monta
    initializeSocket();

    // Limpiar cuando el app se desmonta
    return () => {
      disconnectSocket();
    };
  }, []);

  return <>{children}</>;
}
