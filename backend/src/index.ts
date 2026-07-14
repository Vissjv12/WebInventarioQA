import express from "express";
import { createServer } from "http";
import { Server as SocketServer } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import authRoutes from "./routes/auth.routes";
import productoRoutes from "./routes/producto.routes";
import categoriaRoutes from "./routes/categoria.routes";
import imagenRoutes from "./routes/imagen.routes";
import usuarioRoutes from "./routes/usuario.routes";

dotenv.config();

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 3000;

// Socket.IO con CORS
const io = new SocketServer(httpServer, {
  cors: {
    origin: true,
    credentials: true,
  },
});

// Exportar io para usar en otros módulos
export { io };

app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

app.use(
  cors({
    origin: (origin, callback) => {
      // Permite herramientas como Postman
      if (!origin) return callback(null, true);

      // React
      if (origin === "http://localhost:5173")
        return callback(null, true);

      // Electron
      if (origin === "http://localhost:3001")
        return callback(null, true);

      // Flutter Web (cualquier puerto localhost)
      if (/^http:\/\/localhost:\d+$/.test(origin))
        return callback(null, true);

      callback(new Error("No permitido por CORS"));
    },
    credentials: true,
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.use("/api/auth", authRoutes);
app.use("/api/productos", productoRoutes);
app.use("/api/categorias", categoriaRoutes);
app.use("/api/usuarios", usuarioRoutes);
app.use("/api/imagenes", imagenRoutes);

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Servidor funcionando" });
});

// WebSocket Events
io.on("connection", (socket) => {
  console.log(`[Socket.IO] Usuario conectado: ${socket.id}`);

  socket.on("disconnect", () => {
    console.log(`[Socket.IO] Usuario desconectado: ${socket.id}`);
  });

  // Cliente escucha actualizaciones
  socket.on("join_updates", (data) => {
    socket.join(`producto_updates_${data.usuarioId}`);
    console.log(`[Socket.IO] Usuario ${data.usuarioId} se unió a actualizaciones`);
  });

  socket.on("leave_updates", (data) => {
    socket.leave(`producto_updates_${data.usuarioId}`);
    console.log(`[Socket.IO] Usuario ${data.usuarioId} se desuscribió de actualizaciones`);
  });
});

httpServer.listen(PORT, () => {
  console.log(`[Express] Servidor corriendo en http://localhost:${PORT}`);
  console.log(`[Socket.IO] WebSocket disponible en ws://localhost:${PORT}`);
});