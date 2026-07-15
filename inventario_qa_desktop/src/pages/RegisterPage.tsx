import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ nombre: '', email: '', password: '', confirmar: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (form.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    if (form.password !== form.confirmar) {
      setError('Las contraseñas no coinciden');
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/register', { nombre: form.nombre, email: form.email, password: form.password });
      navigate('/login');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al registrar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>Crear cuenta</h1>
        <form onSubmit={handleSubmit} style={styles.form}>
          <input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} placeholder="Nombre" style={styles.input} />
          <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Email" style={styles.input} />
          <input value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} type="password" placeholder="Contraseña" style={styles.input} />
          <input value={form.confirmar} onChange={(e) => setForm({ ...form, confirmar: e.target.value })} type="password" placeholder="Confirmar contraseña" style={styles.input} />
          {error && <p style={styles.error}>{error}</p>}
          <button type="submit" style={styles.button} disabled={loading}>{loading ? 'Registrando...' : 'Registrar'}</button>
        </form>
        <p style={styles.link}><Link to="/login" style={{ color: '#60a5fa' }}>Volver al login</Link></p>
      </div>
    </div>
  );
}

const styles = {
  container: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#020617' },
  card: { width: '100%', maxWidth: 430, padding: 32, borderRadius: 16, background: '#111827', boxShadow: '0 20px 50px rgba(0,0,0,0.35)' },
  title: { margin: 0, color: '#f8fafc', textAlign: 'center' },
  form: { display: 'flex', flexDirection: 'column', gap: 12, marginTop: 24 },
  input: { padding: '12px 14px', borderRadius: 10, border: '1px solid #334155', background: '#0f172a', color: '#f8fafc' },
  button: { padding: '12px 14px', borderRadius: 10, border: 'none', background: '#16a34a', color: 'white', cursor: 'pointer' },
  error: { color: '#f87171', margin: 0, textAlign: 'center' },
  link: { color: '#94a3b8', textAlign: 'center', marginTop: 16 },
} as const;
