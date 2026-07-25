import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Spinner from "../components/Spinner";
import api from "../services/api";
import { useSyncProductos, type Producto } from "../hooks/useSync";
import SyncStatus from "../components/SyncStatus";

type OrdenPrecio = "" | "asc" | "desc";
type FiltroStock = "" | "disponible" | "sinstock";

export default function Catalogo() {
  const navigate = useNavigate();
  const [productos, setProductos] = useState<Producto[]>([]);
  const [cargando, setCargando] = useState(true);
  const [pagina, setPagina] = useState(1);
  const PRODUCTOS_POR_PAGINA = 8;

  // ── Filtros ───────────────────────────────────────────
  const [busqueda, setBusqueda]         = useState("");
  const [categoriaId, setCategoriaId]   = useState<string>("");
  const [ordenPrecio, setOrdenPrecio]   = useState<OrdenPrecio>("");
  const [filtroStock, setFiltroStock]   = useState<FiltroStock>("");
  const [precioMin, setPrecioMin]       = useState<string>("");
  const [precioMax, setPrecioMax]       = useState<string>("");
  const [filtrosVisible, setFiltrosVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem("token")) {
      navigate("/login");
      return;
    }
    api.get("/productos")
      .then(res => setProductos(res.data))
      .finally(() => setCargando(false));
  }, []);

  // ✅ Sincronizar productos en tiempo real
  useSyncProductos(productos, setProductos);

  // Categorías disponibles derivadas de los productos cargados
  const categorias = useMemo(() => {
    const map = new Map<number, string>();
    productos.forEach(p => map.set(p.categoria.id, p.categoria.nombre));
    return Array.from(map.entries()).map(([id, nombre]) => ({ id, nombre }));
  }, [productos]);

  // Número de filtros activos (para badge)
  const filtrosActivos = [categoriaId, ordenPrecio, filtroStock, precioMin, precioMax]
    .filter(Boolean).length;

  const limpiarFiltros = () => {
    setCategoriaId("");
    setOrdenPrecio("");
    setFiltroStock("");
    setPrecioMin("");
    setPrecioMax("");
    setBusqueda("");
    setPagina(1);
  };

  // ── Lógica de filtrado y ordenamiento ────────────────
  const productosFiltrados = useMemo(() => {
    const min = precioMin !== "" ? Number(precioMin) : null;
    const max = precioMax !== "" ? Number(precioMax) : null;

    let lista = productos.filter(p => {
      const coincideNombre = p.nombre.toLowerCase().includes(busqueda.toLowerCase());
      const coincideCategoria = categoriaId ? p.categoria.id === Number(categoriaId) : true;
      const coincideStock =
        filtroStock === "disponible" ? p.stock > 0 :
        filtroStock === "sinstock"   ? p.stock === 0 : true;
      const coincidePrecioMin = min !== null ? Number(p.precio) >= min : true;
      const coincidePrecioMax = max !== null ? Number(p.precio) <= max : true;
      return coincideNombre && coincideCategoria && coincideStock && coincidePrecioMin && coincidePrecioMax;
    });

    if (ordenPrecio === "asc")  lista = [...lista].sort((a, b) => Number(a.precio) - Number(b.precio));
    if (ordenPrecio === "desc") lista = [...lista].sort((a, b) => Number(b.precio) - Number(a.precio));

    return lista;
  }, [productos, busqueda, categoriaId, ordenPrecio, filtroStock, precioMin, precioMax]);

  const totalPaginas = Math.ceil(productosFiltrados.length / PRODUCTOS_POR_PAGINA);
  const productosPaginados = productosFiltrados.slice(
    (pagina - 1) * PRODUCTOS_POR_PAGINA,
    pagina * PRODUCTOS_POR_PAGINA
  );

  const cambiarFiltro = (fn: () => void) => { fn(); setPagina(1); };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#0F172A" }}>
      <Navbar />
      <div className="contenido">

        {/* ── Encabezado ─────────────────────────────────── */}
        <div className="encabezado">
          <div style={{ display: "flex", alignItems: "center", gap: "20px", flex: 1 }}>
            <h1 className="encabezado-titulo">Catálogo de Productos</h1>
            <SyncStatus />
          </div>
          <div className="encabezado-acciones">
            <input
              type="text"
              placeholder="🔍 Buscar producto..."
              value={busqueda}
              onChange={e => cambiarFiltro(() => setBusqueda(e.target.value))}
              className="buscador"
            />
            <button
              onClick={() => setFiltrosVisible(v => !v)}
              style={{
                padding: "0.6rem 1rem",
                borderRadius: "8px",
                border: `1px solid ${filtrosActivos > 0 ? "#2563EB" : "#334155"}`,
                backgroundColor: filtrosActivos > 0 ? "#1E3A5F" : "transparent",
                color: filtrosActivos > 0 ? "#60A5FA" : "#94A3B8",
                cursor: "pointer",
                fontWeight: "bold",
                whiteSpace: "nowrap",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              ⚙️ Filtros
              {filtrosActivos > 0 && (
                <span style={{
                  background: "#2563EB", color: "#fff", borderRadius: "999px",
                  fontSize: "0.7rem", padding: "1px 7px", fontWeight: "bold",
                }}>
                  {filtrosActivos}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* ── Panel de filtros ────────────────────────────── */}
        {filtrosVisible && (
          <div style={{
            background: "#1E293B",
            border: "1px solid #334155",
            borderRadius: "12px",
            padding: "1.25rem 1.5rem",
            marginBottom: "1.5rem",
            display: "flex",
            flexWrap: "wrap",
            gap: "1rem",
            alignItems: "flex-end",
          }}>

            {/* Categoría */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem", minWidth: "160px" }}>
              <label style={{ color: "#94A3B8", fontSize: "0.8rem" }}>Categoría</label>
              <select
                value={categoriaId}
                onChange={e => cambiarFiltro(() => setCategoriaId(e.target.value))}
                className="input"
                style={{ padding: "0.5rem 0.75rem" }}
              >
                <option value="">Todas las categorías</option>
                {categorias.map(c => (
                  <option key={c.id} value={c.id}>{c.nombre}</option>
                ))}
              </select>
            </div>

            {/* Orden precio */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem", minWidth: "180px" }}>
              <label style={{ color: "#94A3B8", fontSize: "0.8rem" }}>Ordenar por precio</label>
              <select
                value={ordenPrecio}
                onChange={e => cambiarFiltro(() => setOrdenPrecio(e.target.value as OrdenPrecio))}
                className="input"
                style={{ padding: "0.5rem 0.75rem" }}
              >
                <option value="">Sin orden</option>
                <option value="asc">Precio: Menor a mayor</option>
                <option value="desc">Precio: Mayor a menor</option>
              </select>
            </div>

            {/* Rango de precio */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem", minWidth: "200px" }}>
              <label style={{ color: "#94A3B8", fontSize: "0.8rem" }}>Rango de precio ($)</label>
              <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                <input
                  type="number"
                  placeholder="Mín"
                  min={0}
                  value={precioMin}
                  onChange={e => cambiarFiltro(() => setPrecioMin(e.target.value))}
                  className="input"
                  style={{ padding: "0.5rem 0.6rem", width: "90px" }}
                />
                <span style={{ color: "#64748B" }}>–</span>
                <input
                  type="number"
                  placeholder="Máx"
                  min={0}
                  value={precioMax}
                  onChange={e => cambiarFiltro(() => setPrecioMax(e.target.value))}
                  className="input"
                  style={{ padding: "0.5rem 0.6rem", width: "90px" }}
                />
              </div>
            </div>

            {/* Disponibilidad */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem", minWidth: "160px" }}>
              <label style={{ color: "#94A3B8", fontSize: "0.8rem" }}>Disponibilidad</label>
              <select
                value={filtroStock}
                onChange={e => cambiarFiltro(() => setFiltroStock(e.target.value as FiltroStock))}
                className="input"
                style={{ padding: "0.5rem 0.75rem" }}
              >
                <option value="">Todos</option>
                <option value="disponible">Con stock</option>
                <option value="sinstock">Sin stock</option>
              </select>
            </div>

            {/* Limpiar */}
            {filtrosActivos > 0 && (
              <button
                onClick={limpiarFiltros}
                style={{
                  padding: "0.5rem 1rem",
                  borderRadius: "8px",
                  border: "1px solid #EF4444",
                  background: "transparent",
                  color: "#EF4444",
                  cursor: "pointer",
                  fontSize: "0.85rem",
                  whiteSpace: "nowrap",
                  alignSelf: "flex-end",
                }}
              >
                ✕ Limpiar filtros
              </button>
            )}
          </div>
        )}

        {/* Contador de resultados */}
        {(busqueda || filtrosActivos > 0) && (
          <p style={{ color: "#64748B", fontSize: "0.85rem", marginBottom: "1rem" }}>
            {productosFiltrados.length === 0
              ? "No se encontraron productos con los filtros aplicados."
              : `Mostrando ${productosFiltrados.length} producto${productosFiltrados.length !== 1 ? "s" : ""}`}
          </p>
        )}

        {/* ── Grid de productos ──────────────────────────── */}
        <div className="grid-productos">
          {cargando ? (
            <Spinner />
          ) : productosFiltrados.length === 0 ? (
            <p style={{ color: "#64748B" }}>No hay productos disponibles.</p>
          ) : (
            productosPaginados.map(p => (
              <div key={p.id} className="tarjeta">
                <div className="tarjeta-imagen">
                  {p.imagenUrl
                    ? <img src={p.imagenUrl} alt={p.nombre} />
                    : <span>📦</span>
                  }
                </div>
                <div className="tarjeta-info">
                  <h3 className="tarjeta-nombre">{p.nombre}</h3>
                  <p className="tarjeta-precio">${Number(p.precio).toFixed(2)}</p>
                  <p className="tarjeta-stock">
                    {p.stock > 0
                      ? `Stock: ${p.stock}`
                      : <span style={{ color: "#EF4444" }}>Sin stock</span>
                    }
                  </p>
                  <p className="tarjeta-categoria">{p.categoria.nombre}</p>
                  {p.descripcion && (
                    <p style={{ color: "#64748B", fontSize: "0.8rem", marginTop: "0.25rem" }}>
                      {p.descripcion}
                    </p>
                  )}
                </div>
                <div className="tarjeta-acciones">
                  <button onClick={() => navigate(`/producto/${p.id}`)} className="boton-editar">
                    👁️ Ver detalle
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* ── Paginación ─────────────────────────────────── */}
        {totalPaginas > 1 && (
          <div style={{
            display: "flex", justifyContent: "center", alignItems: "center",
            gap: "0.5rem", marginTop: "2rem", flexWrap: "wrap",
          }}>
            <button
              onClick={() => setPagina(p => Math.max(1, p - 1))}
              disabled={pagina === 1}
              style={{
                padding: "0.5rem 1rem", borderRadius: "6px", border: "1px solid #334155",
                backgroundColor: pagina === 1 ? "#0F172A" : "#1E293B",
                color: pagina === 1 ? "#475569" : "#FFFFFF",
                cursor: pagina === 1 ? "not-allowed" : "pointer",
              }}
            >
              ← Anterior
            </button>

            {Array.from({ length: totalPaginas }, (_, i) => i + 1).map(n => (
              <button
                key={n}
                onClick={() => setPagina(n)}
                style={{
                  padding: "0.5rem 0.85rem", borderRadius: "6px", border: "1px solid #334155",
                  backgroundColor: pagina === n ? "#2563EB" : "#1E293B",
                  color: "#FFFFFF", cursor: "pointer",
                  fontWeight: pagina === n ? "bold" : "normal",
                }}
              >
                {n}
              </button>
            ))}

            <button
              onClick={() => setPagina(p => Math.min(totalPaginas, p + 1))}
              disabled={pagina === totalPaginas}
              style={{
                padding: "0.5rem 1rem", borderRadius: "6px", border: "1px solid #334155",
                backgroundColor: pagina === totalPaginas ? "#0F172A" : "#1E293B",
                color: pagina === totalPaginas ? "#475569" : "#FFFFFF",
                cursor: pagina === totalPaginas ? "not-allowed" : "pointer",
              }}
            >
              Siguiente →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}