import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NOMBRE_REGEX = /^[\p{L}\s'-]{2,80}$/u;

interface FormErrors {
  nombre?: string;
  email?: string;
  password?: string;
  confirmar?: string;
}

export default function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ nombre: '', email: '', password: '', confirmar: '' });
  const [errors, setErrors] = useState<FormErrors>({});
  const [errorGeneral, setErrorGeneral] = useState('');
  const [loading, setLoading] = useState(false);

  const setField = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    const nombreTrim = form.nombre.trim();
    const emailTrim = form.email.trim();

    if (!nombreTrim) newErrors.nombre = 'El nombre es requerido';
    else if (nombreTrim.length < 3) newErrors.nombre = 'Mínimo 3 caracteres';
    else if (nombreTrim.length > 80) newErrors.nombre = 'Máximo 80 caracteres';
    else if (!NOMBRE_REGEX.test(nombreTrim)) newErrors.nombre = 'Solo letras, espacios, guiones y apóstrofes';

    if (!emailTrim) newErrors.email = 'El email es requerido';
    else if (!EMAIL_REGEX.test(emailTrim)) newErrors.email = 'Ingresa un email válido';
    else if (emailTrim.length > 254) newErrors.email = 'Email demasiado largo';

    if (!form.password) newErrors.password = 'La contraseña es requerida';
    else if (form.password.length < 6) newErrors.password = 'Mínimo 6 caracteres';
    else if (form.password.length > 100) newErrors.password = 'Máximo 100 caracteres';

    if (!form.confirmar) newErrors.confirmar = 'Confirma tu contraseña';
    else if (form.password !== form.confirmar) newErrors.confirmar = 'Las contraseñas no coinciden';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorGeneral('');
    if (!validate()) return;
    setLoading(true);
    try {
      await api.post('/auth/register', {
        nombre: form.nombre.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
      });
      navigate('/login');
    } catch (err: any) {
      setErrorGeneral(err.response?.data?.error || 'Error al registrar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 8 }}>📦</div>
          <h1 style={styles.title}>Crear cuenta</h1>
          <p style={styles.subtitle}>Sistema de Gestión de Inventario</p>
        </div>
        <form onSubmit={handleSubmit} style={styles.form}>
          <div>
            <label style={styles.label}>Nombre completo *</label>
            <input
              type="text"
              value={form.nombre}
              onChange={(e) => setField('nombre', e.target.value)}
              placeholder="Tu nombre"
              maxLength={80}
              style={{ ...styles.input, borderColor: errors.nombre ? '#f87171' : '#334155' }}
              autoComplete="name"
            />
            {errors.nombre && <p style={styles.fieldError}>{errors.nombre}</p>}
          </div>
          <div>
            <label style={styles.label}>Email *</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setField('email', e.target.value)}
              placeholder="correo@ejemplo.com"
              maxLength={254}
              style={{ ...styles.input, borderColor: errors.email ? '#f87171' : '#334155' }}
              autoComplete="email"
            />
            {errors.email && <p style={styles.fieldError}>{errors.email}</p>}
          </div>
          <div>
            <label style={styles.label}>Contraseña * <span style={{ color: '#64748b', fontWeight: 400 }}>(mín. 6 caracteres)</span></label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setField('password', e.target.value)}
              placeholder="••••••••"
              maxLength={100}
              style={{ ...styles.input, borderColor: errors.password ? '#f87171' : '#334155' }}
              autoComplete="new-password"
            />
            {errors.password && <p style={styles.fieldError}>{errors.password}</p>}
          </div>
          <div>
            <label style={styles.label}>Confirmar contraseña *</label>
            <input
              type="password"
              value={form.confirmar}
              onChange={(e) => setField('confirmar', e.target.value)}
              placeholder="Repite tu contraseña"
              maxLength={100}
              style={{ ...styles.input, borderColor: errors.confirmar ? '#f87171' : '#334155' }}
              autoComplete="new-password"
            />
            {errors.confirmar && <p style={styles.fieldError}>{errors.confirmar}</p>}
          </div>
          {errorGeneral && <p style={styles.error}>{errorGeneral}</p>}
          <button
            type="submit"
            style={{ ...styles.button, opacity: loading ? 0.7 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}
            disabled={loading}
          >
            {loading ? 'Registrando...' : 'Crear cuenta'}
          </button>
        </form>
        <p style={styles.link}><Link to="/login" style={{ color: '#60a5fa' }}>← Volver al inicio de sesión</Link></p>
      </div>
    </div>
  );
}

const styles = {
  container: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, background: 'radial-gradient(circle at top left, #1e293b 0%, #020617 55%)' } as React.CSSProperties,
  card: { width: '100%', maxWidth: 440, padding: 36, borderRadius: 20, background: 'rgba(15, 23, 42, 0.95)', border: '1px solid rgba(148, 163, 184, 0.18)', boxShadow: '0 16px 40px rgba(2, 6, 23, 0.4)' } as React.CSSProperties,
  title: { margin: 0, color: '#f8fafc', textAlign: 'center' as const, fontSize: '1.8rem', fontWeight: 700 },
  subtitle: { color: '#94a3b8', textAlign: 'center' as const, marginBottom: 0, marginTop: 4 },
  form: { display: 'flex', flexDirection: 'column' as const, gap: 16 },
  label: { display: 'block', color: '#94a3b8', fontSize: '0.875rem', marginBottom: 4 } as React.CSSProperties,
  input: { width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid #334155', background: '#020617', color: '#f8fafc', fontSize: '1rem' } as React.CSSProperties,
  button: { padding: '13px 14px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #16a34a 0%, #22c55e 100%)', color: 'white', fontWeight: 700, fontSize: '1rem' } as React.CSSProperties,
  error: { color: '#f87171', margin: 0, textAlign: 'center' as const, fontSize: '0.9rem' },
  fieldError: { color: '#f87171', margin: '4px 0 0', fontSize: '0.8rem' } as React.CSSProperties,
  link: { color: '#94a3b8', textAlign: 'center' as const, marginTop: 20 } as React.CSSProperties,
};
