import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { io, type Socket } from 'socket.io-client';
import type { Categoria, Producto } from '../types';

type OrdenPrecio = '' | 'asc' | 'desc';
type FiltroStock  = '' | 'disponible' | 'sinstock';

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
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [connected, setConnected] = useState(false);

  // ── Filtros ────────────────────────────────────────────
  const [busqueda, setBusqueda]       = useState('');
  const [categoriaId, setCategoriaId] = useState('');
  const [ordenPrecio, setOrdenPrecio] = useState<OrdenPrecio>('');
  const [filtroStock, setFiltroStock] = useState<FiltroStock>('');
  const [precioMin, setPrecioMin]     = useState('');
  const [precioMax, setPrecioMax]     = useState('');
  const [panelVisible, setPanelVisible] = useState(false);

  useEffect(() => {
    const cargar = async () => {
      try {
        const [pRes, cRes] = await Promise.all([api.get('/productos'), api.get('/categorias')]);
        setProductos((pRes.data as any[]).map(normalizarProducto));
        setCategorias(cRes.data);
      } catch (e) { console.error(e); }
    };
    cargar();

    const socket: Socket = io('http://localhost:3000', { transports: ['websocket'], reconnection: true });
    socket.on('connect',       () => setConnected(true));
    socket.on('disconnect',    () => setConnected(false));
    socket.on('connect_error', () => setConnected(false));
    socket.on('inventario:PRODUCTO_CREADO', (payload: any) => {
      const p = payload.datos?.producto;
      if (p) setProductos(prev => [normalizarProducto(p), ...prev.filter(x => x.id !== p.id)]);
    });
    socket.on('inventario:PRODUCTO_ACTUALIZADO', (payload: any) => {
      const p = payload.datos?.producto;
      if (p) setProductos(prev => prev.map(x => x.id === p.id ? normalizarProducto(p) : x));
    });
    socket.on('inventario:PRODUCTO_ELIMINADO', (payload: any) =>
      setProductos(prev => prev.filter(p => p.id !== payload.datos?.producto?.id))
    );
    socket.on('inventario:CATEGORIA_CREADA',   (payload: any) => setCategorias(prev => [payload.datos?.categoria, ...prev].filter(Boolean) as Categoria[]));
    socket.on('inventario:CATEGORIA_ELIMINADA', (payload: any) => setCategorias(prev => prev.filter(c => c.id !== payload.datos?.categoria?.id)));
    return () => socket.disconnect();
  }, []);

  const filtrosActivos = [categoriaId, ordenPrecio, filtroStock, precioMin, precioMax].filter(Boolean).length;

  const limpiar = () => { setBusqueda(''); setCategoriaId(''); setOrdenPrecio(''); setFiltroStock(''); setPrecioMin(''); setPrecioMax(''); };

  const productosFiltrados = useMemo(() => {
    const min = precioMin !== '' ? Number(precioMin) : null;
    const max = precioMax !== '' ? Number(precioMax) : null;
    let lista = productos.filter(p => {
      const ok1 = p.nombre.toLowerCase().includes(busqueda.toLowerCase());
      const ok2 = categoriaId ? p.categoriaId === Number(categoriaId) : true;
      const ok3 = filtroStock === 'disponible' ? p.stock! > 0 : filtroStock === 'sinstock' ? p.stock === 0 : true;
      const ok4 = min !== null ? Number(p.precio) >= min : true;
      const ok5 = max !== null ? Number(p.precio) <= max : true;
      return ok1 && ok2 && ok3 && ok4 && ok5;
    });
    if (ordenPrecio === 'asc')  lista = [...lista].sort((a, b) => Number(a.precio) - Number(b.precio));
    if (ordenPrecio === 'desc') lista = [...lista].sort((a, b) => Number(b.precio) - Number(a.precio));
    return lista;
  }, [productos, busqueda, categoriaId, ordenPrecio, filtroStock, precioMin, precioMax]);

  return (
    <div className="page-shell">

      {/* Header */}
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
            onChange={e => setBusqueda(e.target.value)}
            placeholder="🔍 Buscar producto..."
            className="input-field"
            style={{ maxWidth: 220 }}
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
          <button onClick={logout} className="secondary-btn">Cerrar sesión</button>
        </div>
      </div>

      {/* Panel filtros */}
      {panelVisible && (
        <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 12, padding: '1rem 1.25rem', marginBottom: 20, display: 'flex', flexWrap: 'wrap', gap: 14, alignItems: 'flex-end' }}>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 150 }}>
            <label style={{ color: '#94a3b8', fontSize: '0.78rem' }}>Categoría</label>
            <select value={categoriaId} onChange={e => setCategoriaId(e.target.value)} className="input-field" style={{ padding: '6px 10px' }}>
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
            <button onClick={limpiar} className="secondary-btn" style={{ alignSelf: 'flex-end', borderColor: '#ef4444', color: '#ef4444' }}>
              ✕ Limpiar
            </button>
          )}
        </div>
      )}

      {/* Contador */}
      {(busqueda || filtrosActivos > 0) && (
        <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: 14 }}>
          {productosFiltrados.length === 0 ? 'Sin resultados con los filtros aplicados.' : `${productosFiltrados.length} producto${productosFiltrados.length !== 1 ? 's' : ''} encontrado${productosFiltrados.length !== 1 ? 's' : ''}`}
        </p>
      )}

      {/* Grid */}
      {productosFiltrados.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#64748b' }}>
          <div style={{ fontSize: '3rem', marginBottom: 12 }}>📦</div>
          <p style={{ margin: 0 }}>{(busqueda || filtrosActivos > 0) ? 'No se encontraron productos con esos filtros.' : 'No hay productos disponibles.'}</p>
        </div>
      ) : (
        <div className="product-grid">
          {productosFiltrados.map(producto => (
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
          <img src={producto.imagenUrl} alt={producto.nombre} className="product-img" onError={() => setImgError(true)} />
        ) : (
          <span className="product-img-placeholder">📦</span>
        )}
      </div>
      <div className="product-info">
        <p className="product-name" title={producto.nombre}>{producto.nombre}</p>
        <p className="product-price">${Number(producto.precio).toFixed(2)}</p>
        <p className={`product-stock ${producto.stock! > 0 ? 'ok' : 'low'}`}>
          {producto.stock! > 0 ? `Stock: ${producto.stock}` : '⚠️ Sin stock'}
        </p>
        <p className="product-category">{producto.categoriaNombre || 'Sin categoría'}</p>
        {producto.descripcion && <p className="product-desc">{producto.descripcion}</p>}
      </div>
    </div>
  );
}
