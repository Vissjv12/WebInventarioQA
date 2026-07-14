import { useSocketStatus } from "../hooks/useSocketStatus";

export default function SyncStatus() {
  const { isConnected, lastSync } = useSocketStatus();

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "10px",
        padding: "8px 16px",
        backgroundColor: isConnected ? "#10b981" : "#ef4444",
        color: "white",
        borderRadius: "6px",
        fontSize: "13px",
        fontWeight: "500",
        transition: "background-color 0.3s ease",
      }}
      title={lastSync ? `Última sincronización: ${lastSync.toLocaleTimeString()}` : ""}
    >
      <div
        style={{
          width: "8px",
          height: "8px",
          borderRadius: "50%",
          backgroundColor: "white",
          animation: isConnected ? "pulse 2s infinite" : "none",
          "@keyframes pulse": {
            "0%, 100%": { opacity: 1 },
            "50%": { opacity: 0.5 },
          },
        }}
      />
      <span>{isConnected ? "Sincronizado" : "Desconectado"}</span>
      {lastSync && (
        <span style={{ fontSize: "11px", opacity: 0.85 }}>
          ({lastSync.toLocaleTimeString()})
        </span>
      )}
    </div>
  );
}
