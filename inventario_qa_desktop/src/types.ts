export interface Usuario {
  id: number;
  nombre: string;
  email: string;
  rol: 'ADMIN' | 'CLIENTE';
}

export interface Producto {
  id: number;
  nombre: string;
  precio: number;
  stock: number;
  descripcion?: string;
  imagenUrl?: string;
  categoriaId?: number;
  categoriaNombre?: string;
  creadoEn?: string;
  actualizadoEn?: string;
}

export interface Categoria {
  id: number;
  nombre: string;
  descripcion?: string;
  creadoEn?: string;
}

export interface AuthResponse {
  token: string;
  usuario: Usuario;
}
