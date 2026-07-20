import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../services/api";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NOMBRE_REGEX = /^[\p{L}\s'-]{2,80}$/u;

interface FormErrors {
  nombre?: string;
  email?: string;
  password?: string;
  confirmar?: string;
}

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ nombre: "", email: "", password: "", confirmar: "" });
  const [fieldErrors, setFieldErrors] = useState<FormErrors>({});
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  const setField = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    const nombreTrim = form.nombre.trim();
    const emailTrim = form.email.trim();

    if (!nombreTrim) newErrors.nombre = "El nombre es requerido";
    else if (nombreTrim.length < 3) newErrors.nombre = "Mínimo 3 caracteres";
    else if (nombreTrim.length > 80) newErrors.nombre = "Máximo 80 caracteres";
    else if (!NOMBRE_REGEX.test(nombreTrim)) newErrors.nombre = "Solo letras, espacios, guiones y apóstrofes";

    if (!emailTrim) newErrors.email = "El email es requerido";
    else if (!EMAIL_REGEX.test(emailTrim)) newErrors.email = "Ingresa un email válido";

    if (!form.password) newErrors.password = "La contraseña es requerida";
    else if (form.password.length < 6) newErrors.password = "Mínimo 6 caracteres";
    else if (form.password.length > 100) newErrors.password = "Máximo 100 caracteres";

    if (!form.confirmar) newErrors.confirmar = "Confirma tu contraseña";
    else if (form.password !== form.confirmar) newErrors.confirmar = "Las contraseñas no coinciden";

    setFieldErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!validate()) return;
    setCargando(true);
    try {
      await api.post("/auth/register", {
        nombre: form.nombre.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
      });
      navigate("/login");
    } catch (err: any) {
      setError(err.response?.data?.error || "Error al registrar usuario");
    } finally {
      setCargando(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.titulo}>Crear Cuenta</h1>
        <p style={styles.subtitulo}>Sistema de Gestión de Inventario</p>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.campo}>
            <label style={styles.label}>Nombre completo *</label>
            <input
              type="text"
              value={form.nombre}
              onChange={(e) => setField('nombre', e.target.value)}
              style={{ ...styles.input, borderColor: fieldErrors.nombre ? "#EF4444" : "#334155" }}
              placeholder="Tu nombre"
              maxLength={80}
              autoComplete="name"
            />
            {fieldErrors.nombre && <p style={styles.fieldError}>{fieldErrors.nombre}</p>}
          </div>

          <div style={styles.campo}>
            <label style={styles.label}>Email *</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setField('email', e.target.value)}
              style={{ ...styles.input, borderColor: fieldErrors.email ? "#EF4444" : "#334155" }}
              placeholder="correo@ejemplo.com"
              maxLength={254}
              autoComplete="email"
            />
            {fieldErrors.email && <p style={styles.fieldError}>{fieldErrors.email}</p>}
          </div>

          <div style={styles.campo}>
            <label style={styles.label}>Contraseña * <span style={{ color: "#64748B", fontWeight: 400 }}>(mín. 6 caracteres)</span></label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setField('password', e.target.value)}
              style={{ ...styles.input, borderColor: fieldErrors.password ? "#EF4444" : "#334155" }}
              placeholder="Mínimo 6 caracteres"
              maxLength={100}
              autoComplete="new-password"
            />
            {fieldErrors.password && <p style={styles.fieldError}>{fieldErrors.password}</p>}
          </div>

          <div style={styles.campo}>
            <label style={styles.label}>Confirmar contraseña *</label>
            <input
              type="password"
              value={form.confirmar}
              onChange={(e) => setField('confirmar', e.target.value)}
              style={{ ...styles.input, borderColor: fieldErrors.confirmar ? "#EF4444" : "#334155" }}
              placeholder="Repite tu contraseña"
              maxLength={100}
              autoComplete="new-password"
            />
            {fieldErrors.confirmar && <p style={styles.fieldError}>{fieldErrors.confirmar}</p>}
          </div>

          {error && <p style={styles.error}>{error}</p>}

          <button
            type="submit"
            style={{
              ...styles.boton,
              opacity: cargando ? 0.6 : 1,
              cursor: cargando ? "not-allowed" : "pointer",
            }}
            disabled={cargando}
          >
            {cargando ? "Registrando..." : "Crear Cuenta"}
          </button>
        </form>

        <p style={styles.link}>
          ¿Ya tienes cuenta?{" "}
          <Link to="/login" style={{ color: "#2563EB" }}>
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0F172A",
  },
  card: {
    backgroundColor: "#1E293B",
    padding: "2.5rem",
    borderRadius: "12px",
    width: "100%",
    maxWidth: "420px",
    boxShadow: "0 4px 24px rgba(0,0,0,0.4)",
  },
  titulo: {
    color: "#FFFFFF",
    fontSize: "1.8rem",
    fontWeight: "bold",
    margin: "0 0 0.25rem 0",
    textAlign: "center",
  },
  subtitulo: {
    color: "#64748B",
    textAlign: "center",
    marginBottom: "2rem",
    fontSize: "0.9rem",
  },
  form: { display: "flex", flexDirection: "column", gap: "1.2rem" },
  campo: { display: "flex", flexDirection: "column", gap: "0.4rem" },
  label: { color: "#94A3B8", fontSize: "0.875rem" },
  input: {
    padding: "0.75rem 1rem",
    borderRadius: "8px",
    border: "1px solid #334155",
    backgroundColor: "#0F172A",
    color: "#FFFFFF",
    fontSize: "1rem",
    outline: "none",
    width: "100%",
  },
  error: {
    color: "#EF4444",
    fontSize: "0.875rem",
    textAlign: "center",
    margin: 0,
  },
  fieldError: {
    color: "#EF4444",
    fontSize: "0.8rem",
    margin: "4px 0 0",
  },
  boton: {
    padding: "0.85rem",
    borderRadius: "8px",
    border: "none",
    backgroundColor: "#2563EB",
    color: "#FFFFFF",
    fontSize: "1rem",
    fontWeight: "bold",
    marginTop: "0.5rem",
  },
  link: {
    color: "#64748B",
    textAlign: "center",
    marginTop: "1.5rem",
    fontSize: "0.9rem",
  },
};