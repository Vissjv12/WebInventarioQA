import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { io, type Socket } from 'socket.io-client';
import type { Producto } from '../types';

function normalizarProducto(p: any): Producto {
  return {
    ...p,
    categoriaNombre: p.categoriaNombre ?? p.categoria?.nombre ?? '',
    categoriaId: p.categoriaId ?? p.categoria?.id,
  } as Producto;
}

export default function CatalogPage() {
  const { usuario, logout } = useAuth();
  const [productos, setProductos] = useState<Producto[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const cargarProductos = async () => {
      try {
        const response = await api.get('/productos');
        setProductos((response.data as any[]).map(normalizarProducto));
      } catch (error) {
        console.error(error);
      }
    };
    cargarProductos();
    const socket: Socket = io('http://localhost:3000', { transports: ['websocket'], reconnection: true });
    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));
    socket.on('connect_error', () => setConnected(false));
    socket.on('inventario:PRODUCTO_CREADO', (payload: any) => {
      const p = payload.datos?.producto;
      if (p) setProductos((prev) => [normalizarProducto(p), ...prev.filter((x) => x.id !== p.id)]);
    });
    socket.on('inventario:PRODUCTO_ACTUALIZADO', (payload: any) => {
      const p = payload.datos?.producto;
      if (p) setProductos((prev) => prev.map((x) => x.id === p.id ? normalizarProducto(p) : x));
    });
    socket.on('inventario:PRODUCTO_ELIMINADO', (payload: any) => setProductos((prev) => prev.filter((p) => p.id !== payload.datos?.producto?.id)));
    return () => socket.disconnect();
  }, []);

  const productosFiltrados = useMemo(
    () => productos.filter((p) => p.nombre.toLowerCase().includes(busqueda.toLowerCase())),
    [productos, busqueda]
  );


  return (
    <div className="page-shell">
      <div className="page-header">
        <div>
          <h1 className="page-title">📦 Catálogo</h1>
          <p className="page-subtitle">
            {usuario?.nombre} · {connected ? '🟢 Sincronizado' : '🔴 Desconectado'}
          </p>
        </div>
        <div className="page-actions">
          <input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="🔍 Buscar producto..."
            className="input-field"
            style={{ maxWidth: 260 }}
          />
          <button onClick={logout} className="secondary-btn">Cerrar sesión</button>
        </div>
      </div>

      {productosFiltrados.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#64748b' }}>
          <div style={{ fontSize: '3rem', marginBottom: 12 }}>📦</div>
          <p style={{ margin: 0 }}>No hay productos disponibles.</p>
        </div>
      ) : (
        <div className="product-grid">
          {productosFiltrados.map((producto) => (
            <ProductoCard key={producto.id} producto={producto} />
          ))}
        </div>
      )}
    </div>
  );
}

function ProductoCard({ producto }: { producto: Producto }) {
  const [imgError, setImgError] = useState(false);

  return (
    <div className="product-card">
      <div className="product-img-wrapper">
        {producto.imagenUrl && !imgError ? (
          <img
            src={producto.imagenUrl}
            alt={producto.nombre}
            className="product-img"
            onError={() => setImgError(true)}
          />
        ) : (
          <span className="product-img-placeholder">📦</span>
        )}
      </div>
      <div className="product-info">
        <p className="product-name" title={producto.nombre}>{producto.nombre}</p>
        <p className="product-price">${Number(producto.precio).toFixed(2)}</p>
        <p className={`product-stock ${producto.stock > 0 ? 'ok' : 'low'}`}>
          {producto.stock > 0 ? `Stock: ${producto.stock}` : '⚠️ Sin stock'}
        </p>
        <p className="product-category">{producto.categoriaNombre || 'Sin categoría'}</p>
        {producto.descripcion && (
          <p className="product-desc">{producto.descripcion}</p>
        )}
      </div>
    </div>
  );
}
