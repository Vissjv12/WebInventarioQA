import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const validate = (): boolean => {
    const newErrors: { email?: string; password?: string } = {};
    const emailTrim = email.trim();
    if (!emailTrim) newErrors.email = 'El email es requerido';
    else if (!EMAIL_REGEX.test(emailTrim)) newErrors.email = 'Ingresa un email válido';

    if (!password) newErrors.password = 'La contraseña es requerida';
    else if (password.length < 6) newErrors.password = 'Mínimo 6 caracteres';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!validate()) return;
    setLoading(true);
    try {
      const response = await api.post('/auth/login', { email: email.trim().toLowerCase(), password });
      login(response.data.token, response.data.usuario);
      navigate(response.data.usuario.rol === 'ADMIN' ? '/dashboard' : '/catalogo');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 8 }}>📦</div>
          <h1 style={styles.title}>Inventario QA</h1>
          <p style={styles.subtitle}>Accede al sistema de gestión</p>
        </div>
        <form onSubmit={handleSubmit} style={styles.form}>
          <div>
            <label style={styles.label}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setErrors({ ...errors, email: undefined }); }}
              placeholder="correo@ejemplo.com"
              maxLength={254}
              style={{ ...styles.input, borderColor: errors.email ? '#f87171' : '#334155' }}
              autoComplete="email"
            />
            {errors.email && <p style={styles.fieldError}>{errors.email}</p>}
          </div>
          <div>
            <label style={styles.label}>Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setErrors({ ...errors, password: undefined }); }}
              placeholder="••••••••"
              maxLength={100}
              style={{ ...styles.input, borderColor: errors.password ? '#f87171' : '#334155' }}
              autoComplete="current-password"
            />
            {errors.password && <p style={styles.fieldError}>{errors.password}</p>}
          </div>
          {error && <p style={styles.error}>{error}</p>}
          <button type="submit" style={{ ...styles.button, opacity: loading ? 0.7 : 1 }} disabled={loading}>
            {loading ? 'Ingresando...' : 'Iniciar sesión'}
          </button>
        </form>
        <p style={styles.link}>¿No tienes cuenta? <Link to="/register" style={{ color: '#60a5fa' }}>Regístrate</Link></p>
      </div>
    </div>
  );
}

const styles = {
  container: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, background: 'radial-gradient(circle at top left, #1e293b 0%, #020617 55%)' } as React.CSSProperties,
  card: { width: '100%', maxWidth: 430, padding: 36, borderRadius: 20, background: 'rgba(15, 23, 42, 0.95)', border: '1px solid rgba(148, 163, 184, 0.18)', boxShadow: '0 16px 40px rgba(2, 6, 23, 0.4)' } as React.CSSProperties,
  title: { margin: 0, color: '#f8fafc', textAlign: 'center' as const, fontSize: '1.8rem', fontWeight: 700 },
  subtitle: { color: '#94a3b8', textAlign: 'center' as const, marginBottom: 0, marginTop: 4 },
  form: { display: 'flex', flexDirection: 'column' as const, gap: 16 },
  label: { display: 'block', color: '#94a3b8', fontSize: '0.875rem', marginBottom: 4 } as React.CSSProperties,
  input: { width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid #334155', background: '#020617', color: '#f8fafc', fontSize: '1rem' } as React.CSSProperties,
  button: { padding: '13px 14px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)', color: 'white', cursor: 'pointer', fontWeight: 700, fontSize: '1rem' } as React.CSSProperties,
  error: { color: '#f87171', margin: 0, textAlign: 'center' as const, fontSize: '0.9rem' },
  fieldError: { color: '#f87171', margin: '4px 0 0', fontSize: '0.8rem' } as React.CSSProperties,
  link: { color: '#94a3b8', textAlign: 'center' as const, marginTop: 20 } as React.CSSProperties,
};
