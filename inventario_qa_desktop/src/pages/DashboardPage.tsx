import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { io, type Socket } from 'socket.io-client';
import type { Categoria, Producto } from '../types';
import { useAuth } from '../context/AuthContext';

type OrdenPrecio = '' | 'asc' | 'desc';
type FiltroStock  = '' | 'disponible' | 'sinstock';

/// Normaliza un producto recibido por socket o REST para que siempre tenga categoriaNombre
function normalizarProducto(p: any): Producto {
  return {
    ...p,
    // Si el backend envía categoria como objeto anidado, extraemos el nombre
    categoriaNombre: p.categoriaNombre ?? p.categoria?.nombre ?? '',
    // Asegurar que categoriaId esté disponible
    categoriaId: p.categoriaId ?? p.categoria?.id,
  } as Producto;
}

// ─── Validation helpers ────────────────────────────────────────────────────
function validateProductoForm(form: ProductoForm): Partial<ProductoFormErrors> {
  const errors: Partial<ProductoFormErrors> = {};
  const nombre = form.nombre.trim();
  const precio = Number(form.precio);
  const stock = Number(form.stock);

  if (!nombre) errors.nombre = 'El nombre es requerido';
  else if (nombre.length < 3) errors.nombre = 'Mínimo 3 caracteres';
  else if (nombre.length > 120) errors.nombre = 'Máximo 120 caracteres';

  if (form.precio === '') errors.precio = 'El precio es requerido';
  else if (isNaN(precio) || precio < 0) errors.precio = 'Precio inválido (mínimo 0)';
  else if (precio > 1_000_000) errors.precio = 'El precio no puede superar $1,000,000';

  if (form.stock === '') errors.stock = 'El stock es requerido';
  else if (!Number.isInteger(stock) || stock < 0) errors.stock = 'Debe ser un número entero ≥ 0';
  else if (stock > 1_000_000) errors.stock = 'El stock no puede superar 1,000,000';

  if (!form.categoriaId) errors.categoriaId = 'Selecciona una categoría';

  if (form.descripcion.length > 1000) errors.descripcion = 'Máximo 1,000 caracteres';

  return errors;
}

function validateCategoriaForm(nombre: string): string {
  const t = nombre.trim();
  if (!t) return 'El nombre es requerido';
  if (t.length < 2) return 'Mínimo 2 caracteres';
  if (t.length > 60) return 'Máximo 60 caracteres';
  return '';
}

// ─── Types ────────────────────────────────────────────────────────────────
interface ProductoForm {
  nombre: string;
  precio: string;
  stock: string;
  descripcion: string;
  categoriaId: string;
}

interface ProductoFormErrors {
  nombre: string;
  precio: string;
  stock: string;
  descripcion: string;
  categoriaId: string;
}

// ─── Main Component ───────────────────────────────────────────────────────
export default function DashboardPage() {
  const navigate = useNavigate();
  const { usuario, logout } = useAuth();
  const [productos, setProductos] = useState<Producto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [connected, setConnected] = useState(false);

  // ── Filtros ────────────────────────────────────────────
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [ordenPrecio, setOrdenPrecio] = useState<OrdenPrecio>('');
  const [filtroStock, setFiltroStock] = useState<FiltroStock>('');
  const [precioMin, setPrecioMin] = useState('');
  const [precioMax, setPrecioMax] = useState('');
  const [panelVisible, setPanelVisible] = useState(false);

  // Producto modal
  const [modalAbierto, setModalAbierto] = useState(false);
  const [productoEditando, setProductoEditando] = useState<Producto | null>(null);
  const [form, setForm] = useState<ProductoForm>({ nombre: '', precio: '', stock: '', descripcion: '', categoriaId: '' });
  const [formErrors, setFormErrors] = useState<Partial<ProductoFormErrors>>({});
  const [imagenPreview, setImagenPreview] = useState('');
  const [imagenFile, setImagenFile] = useState<File | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [errorGuardar, setErrorGuardar] = useState('');

  // Categoria modal
  const [modalCategoria, setModalCategoria] = useState(false);
  const [nuevaCategoria, setNuevaCategoria] = useState('');
  const [errorCategoria, setErrorCategoria] = useState('');

  // Toast
  const [mensaje, setMensaje] = useState<{ text: string; ok: boolean } | null>(null);

  // Confirm
  const [confirmando, setConfirmando] = useState<{ texto: string; accion: () => void } | null>(null);

  useEffect(() => {
    cargarDatos();
    const socket: Socket = io('http://localhost:3000', { transports: ['websocket'], reconnection: true });
    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));
    socket.on('connect_error', () => setConnected(false));
    socket.on('inventario:PRODUCTO_CREADO', (payload: any) => {
      const p = payload.datos?.producto;
      if (!p) return;
      // Normalizar: el socket puede traer categoria como objeto o solo categoriaId
      const normalizado = normalizarProducto(p);
      setProductos((prev) => [normalizado, ...prev.filter((x) => x.id !== normalizado.id)]);
    });
    socket.on('inventario:PRODUCTO_ACTUALIZADO', (payload: any) => {
      const p = payload.datos?.producto;
      if (!p) return;
      const normalizado = normalizarProducto(p);
      setProductos((prev) => prev.map((x) => x.id === normalizado.id ? normalizado : x));
    });
    socket.on('inventario:PRODUCTO_ELIMINADO', (payload: any) => setProductos((prev) => prev.filter((p) => p.id !== payload.datos?.producto?.id)));
    socket.on('inventario:CATEGORIA_CREADA', (payload: any) => setCategorias((prev) => [payload.datos?.categoria, ...prev].filter(Boolean) as Categoria[]));
    socket.on('inventario:CATEGORIA_ELIMINADA', (payload: any) => setCategorias((prev) => prev.filter((c) => c.id !== payload.datos?.categoria?.id)));
    return () => socket.disconnect();
  }, []);

  const cargarDatos = async () => {
    try {
      const [productosRes, categoriasRes] = await Promise.all([api.get('/productos'), api.get('/categorias')]);
      // Normalizar productos para que siempre tengan categoriaNombre
      setProductos((productosRes.data as any[]).map(normalizarProducto));
      setCategorias(categoriasRes.data);
    } catch (error) {
      console.error(error);
    }
  };

  const toast = (text: string, ok = true) => {
    setMensaje({ text, ok });
    setTimeout(() => setMensaje(null), 3500);
  };

  // ─── Producto CRUD ─────────────────────────────────────────────────────
  const abrirModal = (producto?: Producto) => {
    if (producto) {
      setProductoEditando(producto);
      setForm({
        nombre: producto.nombre,
        precio: String(producto.precio),
        stock: String(producto.stock),
        descripcion: producto.descripcion || '',
        categoriaId: String(producto.categoriaId || ''),
      });
      setImagenPreview(producto.imagenUrl || '');
    } else {
      setProductoEditando(null);
      setForm({ nombre: '', precio: '', stock: '', descripcion: '', categoriaId: '' });
      setImagenPreview('');
    }
    setImagenFile(null);
    setFormErrors({});
    setErrorGuardar('');
    setModalAbierto(true);
  };

  const cerrarModal = () => setModalAbierto(false);

  const guardarProducto = async (e: FormEvent) => {
    e.preventDefault();
    const errors = validateProductoForm(form);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    setFormErrors({});
    setGuardando(true);
    setErrorGuardar('');
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
        nombre: form.nombre.trim(),
        precio: Number(form.precio),
        stock: Number(form.stock),
        descripcion: form.descripcion.trim(),
        categoriaId: Number(form.categoriaId),
        imagenUrl,
      };

      if (productoEditando) {
        await api.put(`/productos/${productoEditando.id}`, data);
        toast('Producto actualizado correctamente');
      } else {
        await api.post('/productos', data);
        toast('Producto creado correctamente');
      }
      setModalAbierto(false);
      setImagenFile(null);
      setImagenPreview('');
    } catch (err: any) {
      setErrorGuardar(err.response?.data?.error || 'Error al guardar producto');
    } finally {
      setGuardando(false);
    }
  };

  const pedirEliminarProducto = (id: number, nombre: string) => {
    setConfirmando({
      texto: `¿Eliminar "${nombre}"? Esta acción no se puede deshacer.`,
      accion: async () => {
        try {
          await api.delete(`/productos/${id}`);
          toast('Producto eliminado');
        } catch {
          toast('No se pudo eliminar', false);
        } finally {
          setConfirmando(null);
        }
      },
    });
  };

  // ─── Categoria CRUD ─────────────────────────────────────────────────────
  const crearCategoria = async (e: FormEvent) => {
    e.preventDefault();
    const errMsg = validateCategoriaForm(nuevaCategoria);
    if (errMsg) { setErrorCategoria(errMsg); return; }
    try {
      await api.post('/categorias', { nombre: nuevaCategoria.trim() });
      setNuevaCategoria('');
      setModalCategoria(false);
      toast('Categoría creada');
    } catch (err: any) {
      setErrorCategoria(err.response?.data?.error || 'Error al crear categoría');
    }
  };

  const pedirEliminarCategoria = (id: number, nombre: string) => {
    setConfirmando({
      texto: `¿Eliminar la categoría "${nombre}"?`,
      accion: async () => {
        try {
          await api.delete(`/categorias/${id}`);
          toast('Categoría eliminada');
        } catch {
          toast('No se puede eliminar una categoría con productos', false);
        } finally {
          setConfirmando(null);
        }
      },
    });
  };

  const filtrosActivos = [filtroCategoria, ordenPrecio, filtroStock, precioMin, precioMax].filter(Boolean).length;

  const limpiarFiltros = () => { setBusqueda(''); setFiltroCategoria(''); setOrdenPrecio(''); setFiltroStock(''); setPrecioMin(''); setPrecioMax(''); };

  const productosFiltrados = useMemo(() => {
    const min = precioMin !== '' ? Number(precioMin) : null;
    const max = precioMax !== '' ? Number(precioMax) : null;
    let lista = productos.filter(p => {
      const ok1 = p.nombre.toLowerCase().includes(busqueda.toLowerCase());
      const ok2 = filtroCategoria ? p.categoriaId === Number(filtroCategoria) : true;
      const ok3 = filtroStock === 'disponible' ? p.stock! > 0 : filtroStock === 'sinstock' ? p.stock === 0 : true;
      const ok4 = min !== null ? Number(p.precio) >= min : true;
      const ok5 = max !== null ? Number(p.precio) <= max : true;
      return ok1 && ok2 && ok3 && ok4 && ok5;
    });
    if (ordenPrecio === 'asc')  lista = [...lista].sort((a, b) => Number(a.precio) - Number(b.precio));
    if (ordenPrecio === 'desc') lista = [...lista].sort((a, b) => Number(b.precio) - Number(a.precio));
    return lista;
  }, [productos, busqueda, filtroCategoria, ordenPrecio, filtroStock, precioMin, precioMax]);

  const estadisticas = useMemo(
    () => ({ productos: productos.length, categorias: categorias.length }),
    [productos, categorias]
  );

  return (
    <div className="page-shell">
      {/* Toast */}
      {mensaje && (
        <div style={{
          position: 'fixed', top: 20, right: 20, zIndex: 9999,
          padding: '12px 20px', borderRadius: 12,
          background: mensaje.ok ? '#16a34a' : '#dc2626',
          color: 'white', fontWeight: 600, boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
          animation: 'fadeIn 0.2s ease',
        }}>
          {mensaje.text}
        </div>
      )}

      {/* Confirm Dialog */}
      {confirmando && (
        <div style={overlayStyle}>
          <div style={modalCardStyle}>
            <p style={{ margin: '0 0 20px', color: '#f8fafc' }}>{confirmando.texto}</p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setConfirmando(null)} className="secondary-btn">Cancelar</button>
              <button onClick={confirmando.accion} className="danger-btn" style={{ padding: '10px 16px' }}>Eliminar</button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Panel de Administración</h1>
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
            style={{ maxWidth: 200 }}
          />
          <button
            onClick={() => setPanelVisible(v => !v)}
            className="secondary-btn"
            style={{ position: 'relative', borderColor: filtrosActivos > 0 ? '#2563eb' : undefined, color: filtrosActivos > 0 ? '#60a5fa' : undefined }}
          >
            ⚙️ Filtros{filtrosActivos > 0 && (
              <span style={{ marginLeft: 6, background: '#2563eb', color: '#fff', borderRadius: '999px', fontSize: '0.7rem', padding: '1px 7px', fontWeight: 700 }}>
                {filtrosActivos}
              </span>
            )}
          </button>
          <button onClick={() => setModalCategoria(true)} className="secondary-btn">🏷️ Categorías</button>
          <button onClick={() => abrirModal()} className="primary-btn">+ Nuevo producto</button>
          <button onClick={() => { logout(); navigate('/login'); }} className="secondary-btn">Salir</button>
        </div>
      </div>

      {/* Panel filtros */}
      {panelVisible && (
        <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 12, padding: '1rem 1.25rem', marginBottom: 20, display: 'flex', flexWrap: 'wrap', gap: 14, alignItems: 'flex-end' }}>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 150 }}>
            <label style={{ color: '#94a3b8', fontSize: '0.78rem' }}>Categoría</label>
            <select value={filtroCategoria} onChange={e => setFiltroCategoria(e.target.value)} className="input-field" style={{ padding: '6px 10px' }}>
              <option value="">Todas</option>
              {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 170 }}>
            <label style={{ color: '#94a3b8', fontSize: '0.78rem' }}>Ordenar por precio</label>
            <select value={ordenPrecio} onChange={e => setOrdenPrecio(e.target.value as OrdenPrecio)} className="input-field" style={{ padding: '6px 10px' }}>
              <option value="">Sin orden</option>
              <option value="asc">Menor a mayor</option>
              <option value="desc">Mayor a menor</option>
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ color: '#94a3b8', fontSize: '0.78rem' }}>Precio ($)</label>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <input type="number" placeholder="Mín" min={0} value={precioMin} onChange={e => setPrecioMin(e.target.value)} className="input-field" style={{ width: 80, padding: '6px 8px' }} />
              <span style={{ color: '#475569' }}>–</span>
              <input type="number" placeholder="Máx" min={0} value={precioMax} onChange={e => setPrecioMax(e.target.value)} className="input-field" style={{ width: 80, padding: '6px 8px' }} />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 140 }}>
            <label style={{ color: '#94a3b8', fontSize: '0.78rem' }}>Disponibilidad</label>
            <select value={filtroStock} onChange={e => setFiltroStock(e.target.value as FiltroStock)} className="input-field" style={{ padding: '6px 10px' }}>
              <option value="">Todos</option>
              <option value="disponible">Con stock</option>
              <option value="sinstock">Sin stock</option>
            </select>
          </div>

          {filtrosActivos > 0 && (
            <button onClick={limpiarFiltros} className="secondary-btn" style={{ alignSelf: 'flex-end', borderColor: '#ef4444', color: '#ef4444' }}>
              ✕ Limpiar
            </button>
          )}
        </div>
      )}

      {/* Contador */}
      {(busqueda || filtrosActivos > 0) && (
        <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: 14 }}>
          {productosFiltrados.length === 0 ? 'Sin resultados.' : `${productosFiltrados.length} producto${productosFiltrados.length !== 1 ? 's' : ''}`}
        </p>
      )}

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16, marginBottom: 24 }}>
        <div className="panel-card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: '#60a5fa' }}>{estadisticas.productos}</div>
          <div className="muted">Productos</div>
        </div>
        <div className="panel-card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: '#a78bfa' }}>{estadisticas.categorias}</div>
          <div className="muted">Categorías</div>
        </div>
      </div>

      {/* Product Grid */}
      {productosFiltrados.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#64748b' }}>
          <div style={{ fontSize: '3rem', marginBottom: 12 }}>📦</div>
          <p style={{ margin: 0 }}>No hay productos. Crea el primero.</p>
        </div>
      ) : (
        <div className="product-grid">
          {productosFiltrados.map((producto) => (
            <ProductoAdminCard
              key={producto.id}
              producto={producto}
              onEditar={() => abrirModal(producto)}
              onEliminar={() => pedirEliminarProducto(producto.id, producto.nombre)}
            />
          ))}
        </div>
      )}

      {/* ─── Modal Producto ─── */}
      {modalAbierto && (
        <div style={overlayStyle}>
          <div style={{ ...modalCardStyle, maxWidth: 520, maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ margin: '0 0 20px', color: '#f8fafc' }}>
              {productoEditando ? '✏️ Editar producto' : '+ Nuevo producto'}
            </h3>
            <form onSubmit={guardarProducto} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

              {/* Nombre */}
              <div>
                <label style={labelStyle}>Nombre *</label>
                <input
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  maxLength={120}
                  style={{ ...inputStyle, borderColor: formErrors.nombre ? '#f87171' : '#334155' }}
                  placeholder="Ej: Laptop HP ProBook"
                />
                {formErrors.nombre && <p className="field-error">{formErrors.nombre}</p>}
                <p className="char-count">{form.nombre.length}/120</p>
              </div>

              {/* Precio y Stock */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={labelStyle}>Precio ($) *</label>
                  <input
                    type="number"
                    min="0"
                    max="1000000"
                    step="0.01"
                    value={form.precio}
                    onChange={(e) => setForm({ ...form, precio: e.target.value })}
                    style={{ ...inputStyle, borderColor: formErrors.precio ? '#f87171' : '#334155' }}
                    placeholder="0.00"
                  />
                  {formErrors.precio && <p className="field-error">{formErrors.precio}</p>}
                </div>
                <div>
                  <label style={labelStyle}>Stock *</label>
                  <input
                    type="number"
                    min="0"
                    max="1000000"
                    step="1"
                    value={form.stock}
                    onChange={(e) => setForm({ ...form, stock: e.target.value })}
                    style={{ ...inputStyle, borderColor: formErrors.stock ? '#f87171' : '#334155' }}
                    placeholder="0"
                  />
                  {formErrors.stock && <p className="field-error">{formErrors.stock}</p>}
                </div>
              </div>

              {/* Categoría */}
              <div>
                <label style={labelStyle}>Categoría *</label>
                <select
                  value={form.categoriaId}
                  onChange={(e) => setForm({ ...form, categoriaId: e.target.value })}
                  style={{ ...inputStyle, borderColor: formErrors.categoriaId ? '#f87171' : '#334155' }}
                >
                  <option value="">Selecciona una categoría</option>
                  {categorias.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                </select>
                {formErrors.categoriaId && <p className="field-error">{formErrors.categoriaId}</p>}
              </div>

              {/* Descripción */}
              <div>
                <label style={labelStyle}>Descripción</label>
                <textarea
                  value={form.descripcion}
                  onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                  maxLength={1000}
                  rows={3}
                  style={{ ...inputStyle, resize: 'vertical', borderColor: formErrors.descripcion ? '#f87171' : '#334155' }}
                  placeholder="Descripción opcional..."
                />
                {formErrors.descripcion && <p className="field-error">{formErrors.descripcion}</p>}
                <p className="char-count">{form.descripcion.length}/1000</p>
              </div>

              {/* Imagen */}
              <div>
                <label style={labelStyle}>Imagen del producto</label>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setImagenFile(file);
                      setImagenPreview(URL.createObjectURL(file));
                    }
                  }}
                  style={inputStyle}
                />
                <p className="field-hint">JPG, PNG o WEBP · Máx. 10 MB</p>
                {imagenPreview && (
                  <div style={{ marginTop: 10, borderRadius: 12, overflow: 'hidden', background: '#0f172a', maxHeight: 200 }}>
                    <img src={imagenPreview} alt="Previsualización" style={{ width: '100%', maxHeight: 200, objectFit: 'contain', display: 'block' }} />
                  </div>
                )}
              </div>

              {errorGuardar && <p style={{ color: '#f87171', margin: 0, textAlign: 'center' }}>{errorGuardar}</p>}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 4 }}>
                <button type="button" onClick={cerrarModal} className="secondary-btn">Cancelar</button>
                <button type="submit" className="primary-btn" disabled={guardando}>
                  {guardando ? 'Guardando...' : (productoEditando ? 'Guardar cambios' : 'Crear producto')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Modal Categorías ─── */}
      {modalCategoria && (
        <div style={overlayStyle}>
          <div style={{ ...modalCardStyle, maxWidth: 460 }}>
            <h3 style={{ margin: '0 0 20px', color: '#f8fafc' }}>🏷️ Gestionar Categorías</h3>

            <form onSubmit={crearCategoria} style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
              <div style={{ flex: 1 }}>
                <input
                  value={nuevaCategoria}
                  onChange={(e) => { setNuevaCategoria(e.target.value); setErrorCategoria(''); }}
                  placeholder="Nombre de categoría"
                  maxLength={60}
                  style={{ ...inputStyle, borderColor: errorCategoria ? '#f87171' : '#334155' }}
                />
                {errorCategoria && <p className="field-error">{errorCategoria}</p>}
              </div>
              <button type="submit" className="primary-btn" style={{ whiteSpace: 'nowrap' }}>+ Agregar</button>
            </form>

            <div className="item-list">
              {categorias.map((c) => (
                <div key={c.id} className="item-card">
                  <div className="item-title-row">
                    <span style={{ color: '#f8fafc', fontWeight: 600 }}>{c.nombre}</span>
                    <button onClick={() => pedirEliminarCategoria(c.id, c.nombre)} className="danger-btn">🗑️</button>
                  </div>
                  {c.descripcion && <p className="muted" style={{ margin: '4px 0 0', fontSize: '0.85rem' }}>{c.descripcion}</p>}
                </div>
              ))}
              {categorias.length === 0 && <p className="muted" style={{ textAlign: 'center' }}>No hay categorías</p>}
            </div>

            <div style={{ marginTop: 20, textAlign: 'right' }}>
              <button onClick={() => setModalCategoria(false)} className="secondary-btn">Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Product Admin Card ───────────────────────────────────────────────────
function ProductoAdminCard({
  producto,
  onEditar,
  onEliminar,
}: {
  producto: Producto;
  onEditar: () => void;
  onEliminar: () => void;
}) {
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
      <div className="product-actions">
        <button onClick={onEditar} className="product-action-btn edit">✏️ Editar</button>
        <button onClick={onEliminar} className="product-action-btn delete">🗑️ Eliminar</button>
      </div>
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────
const labelStyle: React.CSSProperties = { display: 'block', color: '#94a3b8', fontSize: '0.875rem', marginBottom: 4 };
const inputStyle: React.CSSProperties = { width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid #334155', background: '#0f172a', color: '#f8fafc' };
const overlayStyle: React.CSSProperties = { position: 'fixed', inset: 0, background: 'rgba(2,6,23,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, zIndex: 1000 };
const modalCardStyle: React.CSSProperties = { width: '100%', maxWidth: 480, background: '#111827', borderRadius: 16, padding: 24, border: '1px solid #334155' };
