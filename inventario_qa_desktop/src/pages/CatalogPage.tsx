import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { io, type Socket } from 'socket.io-client';
import type { Producto } from '../types';

export default function CatalogPage() {
  const { usuario, logout } = useAuth();
  const [productos, setProductos] = useState<Producto[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    cargarProductos();
    const socket: Socket = io('http://localhost:3000', { transports: ['websocket'], reconnection: true });
    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));
    socket.on('connect_error', () => setConnected(false));
    socket.on('inventario:PRODUCTO_CREADO', (payload: any) => setProductos((prev) => [payload.datos?.producto, ...prev].filter(Boolean) as Producto[]));
    socket.on('inventario:PRODUCTO_ACTUALIZADO', (payload: any) => setProductos((prev) => prev.map((p) => p.id === payload.datos?.producto?.id ? payload.datos.producto : p)));
    socket.on('inventario:PRODUCTO_ELIMINADO', (payload: any) => setProductos((prev) => prev.filter((p) => p.id !== payload.datos?.producto?.id)));
    return () => socket.disconnect();
  }, []);

  const cargarProductos = async () => {
    try {
      const response = await api.get('/productos');
      setProductos(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  const productosFiltrados = useMemo(() => productos.filter((producto) => producto.nombre.toLowerCase().includes(busqueda.toLowerCase())), [productos, busqueda]);

  return (
    <div className="page-shell">
      <div className="page-header">
        <div>
          <h1 className="page-title">Catálogo</h1>
          <p className="page-subtitle">Usuario: {usuario?.nombre} · {connected ? '🟢 Sincronizado' : '🔴 Desconectado'}</p>
        </div>
        <div className="page-actions">
          <button onClick={logout} className="secondary-btn">Cerrar sesión</button>
        </div>
      </div>

      <div style={{ marginBottom: 18 }}>
        <input value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar producto" className="input-field" />
      </div>

      <div className="grid-2">
        {productosFiltrados.map((producto) => (
          <div key={producto.id} className="panel-card">
            <h3 style={{ marginTop: 0 }}>{producto.nombre}</h3>
            <p className="muted" style={{ marginBottom: 8 }}>{producto.descripcion || 'Sin descripción'}</p>
            <div><strong>Precio:</strong> ${producto.precio}</div>
            <div><strong>Stock:</strong> {producto.stock}</div>
            <div className="muted" style={{ marginTop: 8 }}>{producto.categoriaNombre || 'Sin categoría'}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
