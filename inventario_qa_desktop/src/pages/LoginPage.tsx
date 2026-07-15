import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('admin@inventario.com');
  const [password, setPassword] = useState('123456');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await api.post('/auth/login', { email, password });
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
        <h1 style={styles.title}>Inventario QA Desktop</h1>
        <p style={styles.subtitle}>Accede al sistema de gestión</p>
        <form onSubmit={handleSubmit} style={styles.form}>
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" style={styles.input} />
          <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="Contraseña" style={styles.input} />
          {error && <p style={styles.error}>{error}</p>}
          <button type="submit" style={styles.button} disabled={loading}>{loading ? 'Ingresando...' : 'Iniciar sesión'}</button>
        </form>
        <p style={styles.link}>¿No tienes cuenta? <Link to="/register" style={{ color: '#60a5fa' }}>Regístrate</Link></p>
      </div>
    </div>
  );
}

const styles = {
  container: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#020617' },
  card: { width: '100%', maxWidth: 430, padding: 32, borderRadius: 16, background: '#111827', boxShadow: '0 20px 50px rgba(0,0,0,0.35)' },
  title: { margin: 0, color: '#f8fafc', textAlign: 'center' },
  subtitle: { color: '#94a3b8', textAlign: 'center', marginBottom: 24 },
  form: { display: 'flex', flexDirection: 'column', gap: 12 },
  input: { padding: '12px 14px', borderRadius: 10, border: '1px solid #334155', background: '#0f172a', color: '#f8fafc' },
  button: { padding: '12px 14px', borderRadius: 10, border: 'none', background: '#2563eb', color: 'white', cursor: 'pointer' },
  error: { color: '#f87171', margin: 0, textAlign: 'center' },
  link: { color: '#94a3b8', textAlign: 'center', marginTop: 16 },
} as const;
