import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { io, type Socket } from 'socket.io-client';
import type { Categoria, Producto } from '../types';
import { useAuth } from '../context/AuthContext';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { usuario, logout } = useAuth();
  const [productos, setProductos] = useState<Producto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [connected, setConnected] = useState(false);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [productoEditando, setProductoEditando] = useState<Producto | null>(null);
  const [form, setForm] = useState({ nombre: '', precio: '', stock: '', descripcion: '', categoriaId: '' });
  const [imagenPreview, setImagenPreview] = useState('');
  const [imagenFile, setImagenFile] = useState<File | null>(null);
  const [modalCategoria, setModalCategoria] = useState(false);
  const [nuevaCategoria, setNuevaCategoria] = useState('');
  const [mensaje, setMensaje] = useState<string | null>(null);

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

  const abrirModal = (producto?: Producto) => {
    if (producto) {
      setProductoEditando(producto);
      setForm({ nombre: producto.nombre, precio: String(producto.precio), stock: String(producto.stock), descripcion: producto.descripcion || '', categoriaId: String(producto.categoriaId || '') });
      setImagenPreview(producto.imagenUrl || '');
    } else {
      setProductoEditando(null);
      setForm({ nombre: '', precio: '', stock: '', descripcion: '', categoriaId: '' });
      setImagenPreview('');
    }
    setImagenFile(null);
    setModalAbierto(true);
  };

  const cerrarModal = () => setModalAbierto(false);

  const guardarProducto = async (e: FormEvent) => {
    e.preventDefault();
    try {
      let imagenUrl = productoEditando?.imagenUrl || '';
      if (imagenFile) {
        const uploadData = new FormData();
        uploadData.append('imagen', imagenFile);
        const uploadResponse = await api.post('/imagenes', uploadData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        imagenUrl = uploadResponse.data.url;
      }

      const data = {
        nombre: form.nombre,
        precio: Number(form.precio),
        stock: Number(form.stock),
        descripcion: form.descripcion,
        categoriaId: Number(form.categoriaId),
        imagenUrl,
      };

      if (productoEditando) {
        await api.put(`/productos/${productoEditando.id}`, data);
      } else {
        await api.post('/productos', data);
      }
      setMensaje(productoEditando ? 'Producto actualizado' : 'Producto creado');
      setModalAbierto(false);
      setImagenFile(null);
      setImagenPreview('');
      await cargarDatos();
    } catch {
      setMensaje('Error al guardar producto');
    }
  };

  const eliminarProducto = async (id: number) => {
    try {
      await api.delete(`/productos/${id}`);
      await cargarDatos();
      setMensaje('Producto eliminado');
    } catch {
      setMensaje('No se pudo eliminar');
    }
  };

  const crearCategoria = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/categorias', { nombre: nuevaCategoria });
      setNuevaCategoria('');
      setModalCategoria(false);
      await cargarDatos();
      setMensaje('Categoría creada');
    } catch {
      setMensaje('Error al crear categoría');
    }
  };

  const eliminarCategoria = async (id: number) => {
    try {
      await api.delete(`/categorias/${id}`);
      await cargarDatos();
      setMensaje('Categoría eliminada');
    } catch {
      setMensaje('No se pudo eliminar la categoría');
    }
  };

  const productosFiltrados = useMemo(() => productos.filter((p) => p.nombre.toLowerCase().includes(busqueda.toLowerCase())), [productos, busqueda]);
  const estadisticas = useMemo(() => ({ productos: productos.length, categorias: categorias.length }), [productos, categorias]);

  return (
    <div style={{ minHeight: '100vh', background: '#020617', color: '#f8fafc', padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 28 }}>Panel de administración</h1>
          <p style={{ margin: '6px 0 0', color: '#94a3b8' }}>Bienvenido {usuario?.nombre || 'admin'} · {connected ? '🟢 Sincronizado' : '🔴 Desconectado'}</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => setModalCategoria(true)} style={buttonPrimary}>+ Nueva categoría</button>
          <button onClick={() => abrirModal()} style={buttonPrimary}>+ Nuevo producto</button>
          <button onClick={() => { logout(); navigate('/login'); }} style={buttonSecondary}>Cerrar sesión</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 16, marginBottom: 20 }}>
        <div style={cardStyle}><strong>{estadisticas.productos}</strong> productos</div>
        <div style={cardStyle}><strong>{estadisticas.categorias}</strong> categorías</div>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        <input value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar producto" style={inputStyle} />
      </div>

      {mensaje && <div style={{ background: '#1e293b', padding: '10px 12px', borderRadius: 10, marginBottom: 16 }}>{mensaje}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 20 }}>
        <div style={cardStyle}>
          <h3 style={{ marginTop: 0 }}>Productos</h3>
          {productosFiltrados.map((producto) => (
            <div key={producto.id} style={{ background: '#111827', borderRadius: 12, padding: 14, marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong>{producto.nombre}</strong>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => abrirModal(producto)} style={buttonSecondary}>Editar</button>
                  <button onClick={() => eliminarProducto(producto.id)} style={buttonDanger}>Eliminar</button>
                </div>
              </div>
              <div style={{ color: '#94a3b8', marginTop: 6 }}>Precio: ${producto.precio}</div>
              <div style={{ color: '#94a3b8' }}>Stock: {producto.stock}</div>
              <div style={{ color: '#94a3b8' }}>Categoría: {producto.categoriaNombre || 'Sin categoría'}</div>
            </div>
          ))}
        </div>

        <div style={cardStyle}>
          <h3 style={{ marginTop: 0 }}>Categorías</h3>
          {categorias.map((categoria) => (
            <div key={categoria.id} style={{ background: '#111827', borderRadius: 12, padding: 12, marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <strong>{categoria.nombre}</strong>
                <div style={{ color: '#94a3b8' }}>{categoria.descripcion || 'Sin descripción'}</div>
              </div>
              <button onClick={() => eliminarCategoria(categoria.id)} style={buttonDanger}>Eliminar</button>
            </div>
          ))}
        </div>
      </div>

      {modalAbierto && (
        <div style={modalBackdrop}>
          <div style={modalCard}>
            <h3>{productoEditando ? 'Editar producto' : 'Nuevo producto'}</h3>
            <form onSubmit={guardarProducto} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <input placeholder="Nombre" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} style={inputStyle} required />
              <input placeholder="Precio" type="number" value={form.precio} onChange={(e) => setForm({ ...form, precio: e.target.value })} style={inputStyle} required />
              <input placeholder="Stock" type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} style={inputStyle} required />
              <input placeholder="Descripción" value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} style={inputStyle} />
              <label style={{ color: '#94a3b8', fontSize: 0.9 }}>Imagen del producto</label>
              <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  setImagenFile(file);
                  setImagenPreview(URL.createObjectURL(file));
                }
              }} style={inputStyle} />
              {imagenPreview && (
                <div style={{ marginTop: 8, borderRadius: 12, overflow: 'hidden', background: '#0f172a' }}>
                  <img src={imagenPreview} alt="Previsualización" style={{ width: '100%', display: 'block' }} />
                </div>
              )}
              <select value={form.categoriaId} onChange={(e) => setForm({ ...form, categoriaId: e.target.value })} style={inputStyle} required>
                <option value="">Selecciona categoría</option>
                {categorias.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </select>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button type="button" onClick={cerrarModal} style={buttonSecondary}>Cancelar</button>
                <button type="submit" style={buttonPrimary}>Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {modalCategoria && (
        <div style={modalBackdrop}>
          <div style={modalCard}>
            <h3>Nueva categoría</h3>
            <form onSubmit={crearCategoria} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <input placeholder="Nombre de categoría" value={nuevaCategoria} onChange={(e) => setNuevaCategoria(e.target.value)} style={inputStyle} required />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button type="button" onClick={() => setModalCategoria(false)} style={buttonSecondary}>Cancelar</button>
                <button type="submit" style={buttonPrimary}>Crear</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const cardStyle = { background: '#111827', borderRadius: 16, padding: 18, border: '1px solid #334155' } as const;
const inputStyle = { width: '100%', padding: '10px 12px', borderRadius: 10, background: '#0f172a', color: '#f8fafc', border: '1px solid #334155' } as const;
const buttonPrimary = { padding: '10px 12px', borderRadius: 10, border: 'none', background: '#2563eb', color: 'white', cursor: 'pointer' } as const;
const buttonSecondary = { padding: '10px 12px', borderRadius: 10, border: '1px solid #334155', background: '#1f2937', color: 'white', cursor: 'pointer' } as const;
const buttonDanger = { padding: '10px 12px', borderRadius: 10, border: 'none', background: '#dc2626', color: 'white', cursor: 'pointer' } as const;
const modalBackdrop = { position: 'fixed' as const, inset: 0, background: 'rgba(2,6,23,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 } as const;
const modalCard = { width: '100%', maxWidth: 480, background: '#111827', borderRadius: 16, padding: 24, border: '1px solid #334155' } as const;
