import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import Spinner from "../components/Spinner";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

interface Producto {
  id: number;
  nombre: string;
  precio: number;
  stock: number;
  descripcion?: string;
  imagenUrl?: string;
  creadoEn: string;
  actualizadoEn: string;
  categoria: { id: number; nombre: string };
  creadoPor: { nombre: string };
}

export default function DetalleProducto() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [producto, setProducto] = useState<Producto | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!localStorage.getItem("token")) {
      navigate("/login");
      return;
    }
    api.get(`/productos/${id}`)
      .then(res => setProducto(res.data))
      .catch(() => setError("Producto no encontrado"))
      .finally(() => setCargando(false));
  }, [id]);

  const volver = () => {
    navigate(isAdmin() ? "/dashboard" : "/catalogo");
  };

  if (cargando) return (
    <div style={{ minHeight: "100vh", backgroundColor: "#0F172A" }}>
      <Navbar />
      <Spinner />
    </div>
  );

  if (error || !producto) return (
    <div style={{ minHeight: "100vh", backgroundColor: "#0F172A" }}>
      <Navbar />
      <div style={{ padding: "2rem", textAlign: "center" }}>
        <p style={{ fontSize: "3rem" }}>📦</p>
        <p style={{ color: "#EF4444", fontSize: "1.1rem", marginTop: "1rem" }}>
          {error || "Producto no encontrado"}
        </p>
        <button onClick={volver} style={styles.botonVolver}>← Volver</button>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#0F172A" }}>
      <Navbar />
      <div className="contenido">

        <div className="detalle-card">
          <div className="detalle-imagen">
            {producto.imagenUrl && producto.imagenUrl.trim() !== ''
              ? <img src={producto.imagenUrl} alt={producto.nombre} />
              : <span style={{ fontSize: "4rem" }}>📦</span>
            }
          </div>

          <div style={styles.info}>
            <div style={styles.categoriaTag}>{producto.categoria.nombre}</div>
            <h1 style={styles.nombre}>{producto.nombre}</h1>
            <p style={styles.precio}>${Number(producto.precio).toFixed(2)}</p>

            <div style={styles.stockBox}>
              <span style={{
                color: producto.stock > 0 ? "#22C55E" : "#EF4444",
                fontWeight: "bold",
              }}>
                {producto.stock > 0
                  ? `✅ En stock: ${producto.stock} unidades`
                  : "❌ Sin stock"
                }
              </span>
            </div>

            {producto.descripcion && (
              <div style={styles.descripcionBox}>
                <p style={styles.descripcionLabel}>Descripción</p>
                <p style={styles.descripcion}>{producto.descripcion}</p>
              </div>
            )}

            <div style={styles.metaBox}>
              <div style={styles.metaItem}>
                <span style={styles.metaLabel}>Registrado por</span>
                <span style={styles.metaValor}>{producto.creadoPor.nombre}</span>
              </div>
              <div style={styles.metaItem}>
                <span style={styles.metaLabel}>Fecha de registro</span>
                <span style={styles.metaValor}>
                  {new Date(producto.creadoEn).toLocaleDateString("es-ES", {
                    year: "numeric", month: "long", day: "numeric",
                  })}
                </span>
              </div>
              <div style={styles.metaItem}>
                <span style={styles.metaLabel}>Última actualización</span>
                <span style={styles.metaValor}>
                  {new Date(producto.actualizadoEn).toLocaleDateString("es-ES", {
                    year: "numeric", month: "long", day: "numeric",
                  })}
                </span>
              </div>
            </div>
            <button onClick={volver} style={{
              
              background: "none",
              border: "1px solid #334155",
              color: "#94A3B8",
              padding: "0.5rem 1rem",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "0.9rem",
              marginTop: "0.5rem",
              width: "100%",
            }}>
              ← Volver
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  botonVolver: {
    background: "none",
    border: "1px solid #334155",
    color: "#94A3B8",
    padding: "0.5rem 1rem",
    borderRadius: "6px",
    cursor: "pointer",
    marginBottom: "1.5rem",
    fontSize: "0.9rem",
  },
  info: {
    padding: "2rem",
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
  },
  categoriaTag: {
    display: "inline-block",
    color: "#2563EB",
    backgroundColor: "#1E3A5F",
    padding: "0.25rem 0.75rem",
    borderRadius: "999px",
    fontSize: "0.8rem",
    width: "fit-content",
  },
  nombre: {
    color: "#FFFFFF",
    fontSize: "1.8rem",
    fontWeight: "bold",
    margin: 0,
  },
  precio: {
    color: "#22C55E",
    fontSize: "1.5rem",
    fontWeight: "bold",
    margin: 0,
  },
  stockBox: {
    padding: "0.75rem",
    backgroundColor: "#0F172A",
    borderRadius: "8px",
  },
  descripcionBox: {
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
  },
  descripcionLabel: {
    color: "#64748B",
    fontSize: "0.85rem",
    margin: 0,
  },
  descripcion: {
    color: "#CBD5E1",
    fontSize: "0.95rem",
    lineHeight: "1.6",
    margin: 0,
  },
  metaBox: {
    display: "flex",
    flexDirection: "column",
    gap: "0.75rem",
    borderTop: "1px solid #334155",
    paddingTop: "1rem",
    marginTop: "auto",
  },
  metaItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  metaLabel: {
    color: "#64748B",
    fontSize: "0.8rem",
  },
  metaValor: {
    color: "#94A3B8",
    fontSize: "0.85rem",
  },
};