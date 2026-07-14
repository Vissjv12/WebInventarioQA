import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Spinner from "../components/Spinner";
import api from "../services/api";
import { useSyncProductos } from "../hooks/useSync";
import SyncStatus from "../components/SyncStatus";

interface Producto {
  id: number;
  nombre: string;
  precio: number;
  stock: number;
  descripcion?: string;
  imagenUrl?: string;
  categoria: { id: number; nombre: string };
}

export default function Catalogo() {
  const navigate = useNavigate();
  const [productos, setProductos] = useState<Producto[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [cargando, setCargando] = useState(true);
  const [pagina, setPagina] = useState(1);
  const PRODUCTOS_POR_PAGINA = 8;
  

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

  const productosFiltrados = productos.filter(p =>
    p.nombre.toLowerCase().includes(busqueda.toLowerCase())
  );

  const totalPaginas = Math.ceil(productosFiltrados.length / PRODUCTOS_POR_PAGINA);

const productosPaginados = productosFiltrados.slice(
    (pagina - 1) * PRODUCTOS_POR_PAGINA,
    pagina * PRODUCTOS_POR_PAGINA
);

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#0F172A" }}>
      <Navbar />
      <div className="contenido">
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
              onChange={(e) => {
                setBusqueda(e.target.value);
                setPagina(1);
             }}
              className="buscador"
            />
          </div>
        </div>

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
                      ? `Stock disponible: ${p.stock}`
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
      </div>
      {totalPaginas > 1 && (
        <div style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: "0.5rem",
            marginTop: "2rem",
            flexWrap: "wrap",
        }}>
            <button
            onClick={() => setPagina(p => Math.max(1, p - 1))}
            disabled={pagina === 1}
            style={{
                padding: "0.5rem 1rem",
                borderRadius: "6px",
                border: "1px solid #334155",
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
                padding: "0.5rem 0.85rem",
                borderRadius: "6px",
                border: "1px solid #334155",
                backgroundColor: pagina === n ? "#2563EB" : "#1E293B",
                color: "#FFFFFF",
                cursor: "pointer",
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
                padding: "0.5rem 1rem",
                borderRadius: "6px",
                border: "1px solid #334155",
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
  );
}