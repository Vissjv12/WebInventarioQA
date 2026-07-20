import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import api from "../services/api";
import Spinner from "../components/Spinner";
import Toast from "../components/Toast";
import ModalConfirm from "../components/ModalConfirm";
import { useSyncProductos, useSyncCategorias } from "../hooks/useSync";
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

interface Categoria {
  id: number;
  nombre: string;
}

export default function Dashboard() {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const [productos, setProductos] = useState<Producto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [modalAbierto, setModalAbierto] = useState(false);
  const [productoEditando, setProductoEditando] = useState<Producto | null>(null);
  const [cargando, setCargando] = useState(false);
  const [form, setForm] = useState({
    nombre: "", precio: "", stock: "", descripcion: "", categoriaId: "",
  });
  const [error, setError] = useState("");
  const [imagenPreview, setImagenPreview] = useState<string>("");
  const [imagenFile, setImagenFile] = useState<File | null>(null);
  const [modalCategorias, setModalCategorias] = useState(false);
  const [nuevaCategoria, setNuevaCategoria] = useState("");
  const [errorCategoria, setErrorCategoria] = useState("");
  const [cargandoProductos, setCargandoProductos] = useState(true);
  const [toast, setToast] = useState<{ mensaje: string; tipo: "exito" | "error" } | null>(null);
  const [pagina, setPagina] = useState(1);
  const PRODUCTOS_POR_PAGINA = 8;
  const [modalUsuarios, setModalUsuarios] = useState(false);
  const [usuarios, setUsuarios] = useState<{id: number; nombre: string; email: string; rol: string}[]>([]);
  const [confirm, setConfirm] = useState<{ mensaje: string; accion: () => void } | null>(null);

  useEffect(() => {
    if (!localStorage.getItem("token")) {
      navigate("/login");
      return;
    }
    cargarDatos();
  }, []);

  // ✅ Sincronizar productos en tiempo real
  useSyncProductos(productos, setProductos);

  // ✅ Sincronizar categorías en tiempo real
  useSyncCategorias(categorias, setCategorias);

  const cargarDatos = async () => {
    setCargandoProductos(true);
    try {
      const [prod, cats, users] = await Promise.all([
        api.get("/productos"),
        api.get("/categorias"),
        api.get("/usuarios"),
      ]);
      setProductos(prod.data);
      setCategorias(cats.data);
      setUsuarios(users.data);
    } finally {
      setCargandoProductos(false);
    }
  };

  const abrirModal = (producto?: Producto) => {
    if (producto) {
      setProductoEditando(producto);
      setForm({
        nombre: producto.nombre,
        precio: String(producto.precio),
        stock: String(producto.stock),
        descripcion: producto.descripcion || "",
        categoriaId: String(producto.categoria.id),
      });
      setImagenPreview(producto.imagenUrl || "");
    } else {
      setProductoEditando(null);
      setForm({ nombre: "", precio: "", stock: "", descripcion: "", categoriaId: "" });
      setImagenPreview("");
    }
    setImagenFile(null);
    setError("");
    setModalAbierto(true);
  };

  const cerrarModal = () => {
    setModalAbierto(false);
    setProductoEditando(null);
    setError("");
  };
  const handleImagen = (e: React.ChangeEvent<HTMLInputElement>) => {

    const file = e.target.files?.[0];
    if (!file) return;
    setImagenFile(file);
    setImagenPreview(URL.createObjectURL(file));
  };

  const guardar = async () => {
    setError("");

    // Validaciones extendidas
    const nombreTrim = form.nombre.trim();
    const precioNum = Number(form.precio);
    const stockNum = Number(form.stock);

    if (!nombreTrim) { setError("El nombre es requerido"); return; }
    if (nombreTrim.length < 3) { setError("El nombre debe tener al menos 3 caracteres"); return; }
    if (nombreTrim.length > 120) { setError("El nombre no puede superar 120 caracteres"); return; }

    if (!form.precio) { setError("El precio es requerido"); return; }
    if (isNaN(precioNum) || precioNum < 0) { setError("El precio debe ser un número mayor o igual a 0"); return; }
    if (precioNum > 1_000_000) { setError("El precio no puede superar $1,000,000"); return; }

    if (!form.stock) { setError("El stock es requerido"); return; }
    if (!Number.isInteger(stockNum) || stockNum < 0) { setError("El stock debe ser un número entero ≥ 0"); return; }
    if (stockNum > 1_000_000) { setError("El stock no puede superar 1,000,000"); return; }

    if (!form.categoriaId) { setError("Selecciona una categoría"); return; }

    if (form.descripcion.length > 1000) { setError("La descripción no puede superar 1,000 caracteres"); return; }

    setCargando(true);
    try {
      let imagenUrl = productoEditando?.imagenUrl || "";

      // Si hay imagen nueva, súbela primero
      if (imagenFile) {
        const formData = new FormData();
        formData.append("imagen", imagenFile);
        const res = await api.post("/imagenes", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        imagenUrl = res.data.url;
      }

      const data = {
        nombre: nombreTrim,
        precio: precioNum,
        stock: stockNum,
        descripcion: form.descripcion.trim(),
        categoriaId: Number(form.categoriaId),
        imagenUrl,
      };

      if (productoEditando) {
        await api.put(`/productos/${productoEditando.id}`, data);
      } else {
        await api.post("/productos", data);
      }

      await cargarDatos();
      cerrarModal();
      mostrarToast(productoEditando ? "Producto actualizado correctamente" : "Producto creado correctamente");
    } catch (err: any) {
      setError(err.response?.data?.error || "Error al guardar");
    } finally {
      setCargando(false);
    }
  };


  const eliminar = async (id: number) => {
    setConfirm({
      mensaje: "¿Estás seguro de que deseas eliminar este producto? Esta acción no se puede deshacer.",
      accion: async () => {
        try {
          await api.delete(`/productos/${id}`);
          await cargarDatos();
          mostrarToast("Producto eliminado correctamente");
        } catch {
          mostrarToast("Error al eliminar el producto", "error");
        } finally {
          setConfirm(null);
        }
      },
    });
  };

  const productosFiltrados = productos.filter(p =>
    p.nombre.toLowerCase().includes(busqueda.toLowerCase())
  );

  const crearCategoria = async () => {
    if (!nuevaCategoria.trim()) {
      setErrorCategoria("El nombre es requerido");
      return;
    }
    try {
      await api.post("/categorias", { nombre: nuevaCategoria });
      setNuevaCategoria("");
      setErrorCategoria("");
      await cargarDatos();
      mostrarToast("Categoría creada correctamente");
    } catch (err: any) {
      setErrorCategoria(err.response?.data?.error || "Error al crear categoría");
    }
  };

const eliminarCategoria = async (id: number) => {
  setConfirm({
    mensaje: "¿Eliminar esta categoría? No podrás eliminarla si tiene productos asociados.",
    accion: async () => {
      try {
        await api.delete(`/categorias/${id}`);
        await cargarDatos();
        mostrarToast("Categoría eliminada correctamente");
      } catch {
        mostrarToast("No se puede eliminar una categoría con productos asociados", "error");
      } finally {
        setConfirm(null);
      }
    },
  });
};

const mostrarToast = (mensaje: string, tipo: "exito" | "error" = "exito") => {
  setToast({ mensaje, tipo });
};
const totalPaginas = Math.ceil(productosFiltrados.length / PRODUCTOS_POR_PAGINA);

const productosPaginados = productosFiltrados.slice(
  (pagina - 1) * PRODUCTOS_POR_PAGINA,
  pagina * PRODUCTOS_POR_PAGINA
);

const eliminarUsuario = async (id: number) => {
  setConfirm({
    mensaje: "¿Eliminar este usuario? Esta acción no se puede deshacer.",
    accion: async () => {
      try {
        await api.delete(`/usuarios/${id}`);
        const res = await api.get("/usuarios");
        setUsuarios(res.data);
        mostrarToast("Usuario eliminado correctamente");
      } catch {
        mostrarToast("Error al eliminar usuario", "error");
      } finally {
        setConfirm(null);
      }
    },
  });
};

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#0F172A" }}>
      <Navbar />
      <div className="contenido">
        <div className="encabezado">
          <div style={{ display: "flex", alignItems: "center", gap: "20px", flex: 1 }}>
            <h1 className="encabezado-titulo">Control de Almacén</h1>
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
            {isAdmin() && (
              <>
                <button onClick={() => setModalCategorias(true)} style={{
                  padding: "0.6rem 1.2rem",
                  borderRadius: "8px",
                  border: "1px solid #334155",
                  backgroundColor: "transparent",
                  color: "#94A3B8",
                  cursor: "pointer",
                  fontWeight: "bold",
                  whiteSpace: "nowrap",
                }}>
                  🏷️ Categorías
                </button>
                <button onClick={() => abrirModal()} className="boton-agregar">
                  + Nuevo Producto
                </button>

                <button onClick={() => setModalUsuarios(true)} style={{
                  padding: "0.6rem 1.2rem",
                  borderRadius: "8px",
                  border: "1px solid #334155",
                  backgroundColor: "transparent",
                  color: "#94A3B8",
                  cursor: "pointer",
                  fontWeight: "bold",
                  whiteSpace: "nowrap",
                }}>
                  👥 Usuarios
                </button>
              </>
            )}
          </div>
        </div>

        <div className="grid-productos">
          {cargandoProductos ? (

            <Spinner/>

           ) : productosFiltrados.length === 0 ? (
            <p style={{ color: "#64748B" }}>No hay productos disponibles.</p>
          ) :(
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
                  <p className="tarjeta-stock">Stock: {p.stock}</p>
                  <p className="tarjeta-categoria">{p.categoria.nombre}</p>
                </div>
                {isAdmin() && (
                  <div className="tarjeta-acciones">
                    <div className="tarjeta-acciones">
                      <button onClick={() => navigate(`/producto/${p.id}`)} className="boton-editar">👁️ Ver</button>
                      <button onClick={() => abrirModal(p)} className="boton-editar">✏️ Editar</button>
                      <button onClick={() => eliminar(p.id)} className="boton-eliminar">🗑️ Eliminar</button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
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

      {modalAbierto && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2 className="modal-titulo">
                {productoEditando ? "Editar Producto" : "Nuevo Producto"}
              </h2>
              <button onClick={cerrarModal} className="modal-boton-cerrar">✕</button>
            </div>

            <div className="modal-body">
              <div className="campo">
                <label className="label">Nombre *</label>
                <input
                  className="input"
                  value={form.nombre}
                  onChange={e => setForm({ ...form, nombre: e.target.value })}
                  placeholder="Nombre del producto"
                />
              </div>

              <div className="campo-fila">
                <div className="campo">
                  <label className="label">Precio ($) *</label>
                  <input
                    className="input"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.precio}
                    onChange={e => setForm({ ...form, precio: e.target.value })}
                  />
                </div>
                <div className="campo">
                  <label className="label">Stock *</label>
                  <input
                    className="input"
                    type="number"
                    min="0"
                    value={form.stock}
                    onChange={e => setForm({ ...form, stock: e.target.value })}
                  />
                </div>
              </div>

              <div className="campo">
                <label className="label">Categoría *</label>
                <select
                  className="input"
                  value={form.categoriaId}
                  onChange={e => setForm({ ...form, categoriaId: e.target.value })}
                >
                  <option value="">Selecciona una categoría</option>
                  {categorias.map(c => (
                    <option key={c.id} value={c.id}>{c.nombre}</option>
                  ))}
                </select>
              </div>

              <div className="campo">
                <label className="label">Descripción</label>
                <textarea
                  className="input"
                  style={{ height: "80px", resize: "none" }}
                  value={form.descripcion}
                  onChange={e => setForm({ ...form, descripcion: e.target.value })}
                  placeholder="Descripción opcional"
                />
              </div>
              <div className="campo">
                <label className="label">Imagen del Producto</label>
                <div style={{
                  border: "2px dashed #334155",
                  borderRadius: "8px",
                  padding: "1rem",
                  textAlign: "center",
                  backgroundColor: "#0F172A",
                  cursor: "pointer",
                }}
                  onClick={() => document.getElementById("inputImagen")?.click()}
                >
                  {imagenPreview ? (
                    <img
                      src={imagenPreview}
                      alt="preview"
                      style={{ maxHeight: "150px", maxWidth: "100%", borderRadius: "6px" }}
                    />
                  ) : (
                    <div style={{ color: "#64748B" }}>
                      <p style={{ fontSize: "2rem" }}>📷</p>
                      <p style={{ fontSize: "0.85rem" }}>Clic para seleccionar imagen</p>
                      <p style={{ fontSize: "0.75rem" }}>JPG, PNG o WEBP — máx 5MB</p>
                    </div>
                  )}
                </div>
                <input
                  id="inputImagen"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  style={{ display: "none" }}
                  onChange={handleImagen}
                />
              </div>

              {error && <p className="error-texto">{error}</p>}
            </div>

            <div className="modal-footer">
              <button onClick={cerrarModal} className="boton-cancelar">Cancelar</button>
              <button onClick={guardar} className="boton-guardar" disabled={cargando}>
                {cargando ? "Guardando..." : productoEditando ? "Guardar Cambios" : "Crear Producto"}
              </button>
            </div>
          </div>
        </div>
      )}

      {modalCategorias && (

        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2 className="modal-titulo">Gestionar Categorías</h2>
              <button onClick={() => setModalCategorias(false)} className="modal-boton-cerrar">✕</button>
            </div>

            <div className="modal-body">
              {/* Crear nueva */}
              <div className="campo">
                <label className="label">Nueva Categoría</label>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <input
                    className="input"
                    value={nuevaCategoria}
                    onChange={e => setNuevaCategoria(e.target.value)}
                    placeholder="Nombre de la categoría"
                    onKeyDown={e => e.key === "Enter" && crearCategoria()}
                  />
                  <button onClick={crearCategoria} className="boton-guardar">
                    Agregar
                  </button>
                </div>
                {errorCategoria && <p className="error-texto">{errorCategoria}</p>}
              </div>

              {/* Lista de categorías */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <label className="label">Categorías existentes</label>
                {categorias.length === 0 ? (
                  <p style={{ color: "#64748B", fontSize: "0.85rem" }}>No hay categorías</p>
                ) : (
                  categorias.map(c => (
                    <div key={c.id} style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "0.6rem 1rem",
                      backgroundColor: "#0F172A",
                      borderRadius: "8px",
                      border: "1px solid #334155",
                    }}>
                      <span style={{ color: "#FFFFFF", fontSize: "0.9rem" }}>{c.nombre}</span>
                      <button
                        onClick={() => eliminarCategoria(c.id)}
                        style={{
                          background: "none",
                          border: "none",
                          color: "#EF4444",
                          cursor: "pointer",
                          fontSize: "0.85rem",
                        }}
                      >
                        🗑️ Eliminar
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="modal-footer">
              <button onClick={() => setModalCategorias(false)} className="boton-cancelar">
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
      {modalUsuarios && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2 className="modal-titulo">Gestionar Usuarios</h2>
              <button onClick={() => setModalUsuarios(false)} className="modal-boton-cerrar">✕</button>
            </div>
              

              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginTop: "0.5rem" }}>
                <label className="label">Usuarios registrados</label>
                {usuarios.map(u => (
                  <div key={u.id} style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "0.6rem 1rem",
                    backgroundColor: "#0F172A",
                    borderRadius: "8px",
                    border: "1px solid #334155",
                    gap: "0.5rem",
                  }}>
                    <div>
                      <p style={{ color: "#FFFFFF", fontSize: "0.9rem", margin: 0 }}>{u.nombre}</p>
                      <p style={{ color: "#64748B", fontSize: "0.8rem", margin: 0 }}>{u.email}</p>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                      <select
                        value={u.rol}
                        onChange={async (e) => {
                          try {
                            await api.patch(`/usuarios/${u.id}/rol`, { rol: e.target.value });
                            const res = await api.get("/usuarios");
                            setUsuarios(res.data);
                            mostrarToast("Rol actualizado correctamente");
                          } catch {
                            mostrarToast("Error al cambiar rol", "error");
                          }
                        }}
                        style={{
                          backgroundColor: "#1E293B",
                          border: "1px solid #334155",
                          color: u.rol === "ADMIN" ? "#2563EB" : "#22C55E",
                          borderRadius: "6px",
                          padding: "0.2rem 0.5rem",
                          fontSize: "0.8rem",
                          cursor: "pointer",
                        }}
                      >
                        <option value="ADMIN">ADMIN</option>
                        <option value="CLIENTE">CLIENTE</option>
                      </select>
                      <button
                        onClick={() => eliminarUsuario(u.id)}
                        style={{ background: "none", border: "none", color: "#EF4444", cursor: "pointer" }}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="modal-footer">
              <button onClick={() => setModalUsuarios(false)} className="boton-cancelar">Cerrar</button>
            </div>
          </div>
      )}
      {confirm && (
        <ModalConfirm
          mensaje={confirm.mensaje}
          onConfirmar={confirm.accion}
          onCancelar={() => setConfirm(null)}
        />
      )}
      {toast && (

        <Toast
          mensaje={toast.mensaje}
          tipo={toast.tipo}
          onClose={() => setToast(null)}
        />
      )}
    </div>
    
  );

  
}
