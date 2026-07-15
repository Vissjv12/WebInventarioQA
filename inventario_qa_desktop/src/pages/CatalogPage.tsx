import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import type { Producto } from '../types';

export default function CatalogPage() {
  const { usuario, logout } = useAuth();
  const [productos, setProductos] = useState<Producto[]>([]);

  useEffect(() => {
    cargarProductos();
  }, []);

  const cargarProductos = async () => {
    try {
      const response = await api.get('/productos');
      setProductos(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#020617', color: '#f8fafc', padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0 }}>Catálogo</h1>
          <p style={{ margin: '4px 0 0', color: '#94a3b8' }}>Usuario: {usuario?.nombre}</p>
        </div>
        <button onClick={logout} style={{ padding: '10px 14px', borderRadius: 10, background: '#1f2937', color: 'white', border: '1px solid #334155', cursor: 'pointer' }}>Cerrar sesión</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
        {productos.map((producto) => (
          <div key={producto.id} style={{ background: '#111827', borderRadius: 16, padding: 16 }}>
            <h3 style={{ marginTop: 0 }}>{producto.nombre}</h3>
            <p style={{ color: '#94a3b8', marginBottom: 6 }}>{producto.descripcion || 'Sin descripción'}</p>
            <div>Precio: ${producto.precio}</div>
            <div>Stock: {producto.stock}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
