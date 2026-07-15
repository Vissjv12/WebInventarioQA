import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { io, Socket } from 'socket.io-client';
import type { Categoria, Producto, Usuario } from '../types';
import { useAuth } from '../context/AuthContext';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { usuario, logout } = useAuth();
  const [productos, setProductos] = useState<Producto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [formProducto, setFormProducto] = useState({ nombre: '', precio: '', stock: '', descripcion: '', categoriaId: '' });
  const [formCategoria, setFormCategoria] = useState({ nombre: '', descripcion: '' });
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    cargarDatos();
    const socket: Socket = io('http://localhost:3000', { transports: ['websocket'], reconnection: true });
    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));
    socket.on('connect_error', () => setConnected(false));
    socket.on('inventario:PRODUCTO_CREADO', (payload: any) => setProductos((prev) => [payload.datos?.producto, ...prev].filter(Boolean) as Producto[]));
    socket.on('inventario:PRODUCTO_ACTUALIZADO', (payload: any) => setProductos((prev) => prev.map((p) => p.id === payload.datos?.producto?.id ? payload.datos.producto : p)));
    socket.on('inventario:PRODUCTO_ELIMINADO', (payload: any) => setProductos((prev) => prev.filter((p) => p.id !== payload.datos?.producto?.id)));
    socket.on('inventario:CATEGORIA_CREADA', (payload: any) => setCategorias((prev) => [payload.datos?.categoria, ...prev].filter(Boolean) as Categoria[]));
    socket.on('inventario:CATEGORIA_ELIMINADA', (payload: any) => setCategorias((prev) => prev.filter((c) => c.id !== payload.datos?.categoria?.id)));
    return () => socket.disconnect();
  }, []);

  const cargarDatos = async () => {
    try {
      const [productosRes, categoriasRes] = await Promise.all([api.get('/productos'), api.get('/categorias')]);
      setProductos(productosRes.data);
      setCategorias(categoriasRes.data);
    } catch (error) {
      console.error(error);
    }
  };

  const crearProducto = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/productos', {
        nombre: formProducto.nombre,
        precio: Number(formProducto.precio),
        stock: Number(formProducto.stock),
        descripcion: formProducto.descripcion,
        categoriaId: Number(formProducto.categoriaId),
      });
      setFormProducto({ nombre: '', precio: '', stock: '', descripcion: '', categoriaId: '' });
    } catch (err) {
      console.error(err);
    }
  };

  const crearCategoria = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/categorias', { nombre: formCategoria.nombre, descripcion: formCategoria.descripcion });
      setFormCategoria({ nombre: '', descripcion: '' });
    } catch (err) {
      console.error(err);
    }
  };

  const eliminarProducto = async (id: number) => {
    try {
      await api.delete(`/productos/${id}`);
    } catch (err) {
      console.error(err);
    }
  };

  const eliminarCategoria = async (id: number) => {
    try {
      await api.delete(`/categorias/${id}`);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#020617', color: '#f8fafc', padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0 }}>Dashboard</h1>
          <p style={{ margin: '4px 0 0', color: '#94a3b8' }}>Bienvenido {usuario?.nombre || 'admin'}</p>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <span style={{ color: connected ? '#4ade80' : '#f87171' }}>{connected ? '🟢 Sincronizado' : '🔴 Desconectado'}</span>
          <button onClick={() => { logout(); navigate('/login'); }} style={{ padding: '10px 14px', borderRadius: 10, background: '#1f2937', color: 'white', border: '1px solid #334155', cursor: 'pointer' }}>Cerrar sesión</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <div style={cardStyle}>
          <h3>Crear producto</h3>
          <form onSubmit={crearProducto} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <input placeholder="Nombre" value={formProducto.nombre} onChange={(e) => setFormProducto({ ...formProducto, nombre: e.target.value })} style={inputStyle} />
            <input placeholder="Precio" type="number" value={formProducto.precio} onChange={(e) => setFormProducto({ ...formProducto, precio: e.target.value })} style={inputStyle} />
            <input placeholder="Stock" type="number" value={formProducto.stock} onChange={(e) => setFormProducto({ ...formProducto, stock: e.target.value })} style={inputStyle} />
            <input placeholder="Descripción" value={formProducto.descripcion} onChange={(e) => setFormProducto({ ...formProducto, descripcion: e.target.value })} style={inputStyle} />
            <select value={formProducto.categoriaId} onChange={(e) => setFormProducto({ ...formProducto, categoriaId: e.target.value })} style={inputStyle}>
              <option value="">Selecciona categoría</option>
              {categorias.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>
            <button type="submit" style={buttonStyle}>Crear producto</button>
          </form>
        </div>

        <div style={cardStyle}>
          <h3>Crear categoría</h3>
          <form onSubmit={crearCategoria} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <input placeholder="Nombre" value={formCategoria.nombre} onChange={(e) => setFormCategoria({ ...formCategoria, nombre: e.target.value })} style={inputStyle} />
            <input placeholder="Descripción" value={formCategoria.descripcion} onChange={(e) => setFormCategoria({ ...formCategoria, descripcion: e.target.value })} style={inputStyle} />
            <button type="submit" style={buttonStyle}>Crear categoría</button>
          </form>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginTop: 24 }}>
        <div style={cardStyle}>
          <h3>Productos</h3>
          {productos.map((producto) => (
            <div key={producto.id} style={{ background: '#111827', padding: 12, borderRadius: 10, marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <strong>{producto.nombre}</strong>
                <button onClick={() => eliminarProducto(producto.id)} style={{ background: '#dc2626', color: 'white', border: 'none', padding: '6px 10px', borderRadius: 8, cursor: 'pointer' }}>Eliminar</button>
              </div>
              <div>Precio: ${producto.precio}</div>
              <div>Stock: {producto.stock}</div>
              <div>Categoría: {producto.categoriaNombre || 'Sin categoría'}</div>
            </div>
          ))}
        </div>

        <div style={cardStyle}>
          <h3>Categorías</h3>
          {categorias.map((categoria) => (
            <div key={categoria.id} style={{ background: '#111827', padding: 12, borderRadius: 10, marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <strong>{categoria.nombre}</strong>
                <button onClick={() => eliminarCategoria(categoria.id)} style={{ background: '#dc2626', color: 'white', border: 'none', padding: '6px 10px', borderRadius: 8, cursor: 'pointer' }}>Eliminar</button>
              </div>
              <div>{categoria.descripcion || 'Sin descripción'}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const cardStyle = { background: '#111827', padding: 20, borderRadius: 16, border: '1px solid #334155' } as const;
const inputStyle = { padding: '10px 12px', borderRadius: 10, background: '#0f172a', color: '#f8fafc', border: '1px solid #334155' } as const;
const buttonStyle = { padding: '10px 12px', borderRadius: 10, background: '#2563eb', color: 'white', border: 'none', cursor: 'pointer' } as const;
