import { useEffect, useCallback } from "react";
import {
  onProductoCreado,
  onProductoActualizado,
  onProductoEliminado,
  offProductoCreado,
  offProductoActualizado,
  offProductoEliminado,
  onCategoriaCreada,
  onCategoriaEliminada,
  offCategoriaCreada,
  offCategoriaEliminada,
} from "../services/socket.service";

export interface Producto {
  id: number;
  nombre: string;
  precio: number;
  stock: number;
  descripcion?: string;
  imagenUrl?: string;
  categoriaId: number;
  creadoEn: string;
  actualizadoEn: string;
}

/**
 * Hook para manejar sincronización de productos en tiempo real
 * @param productos - Lista actual de productos
 * @param setProductos - Función para actualizar productos
 */
export function useSyncProductos(
  productos: Producto[],
  setProductos: (productos: Producto[]) => void
) {
  // Cuando se crea un producto
  const handleProductoCreado = useCallback(
    (data: any) => {
      const nuevoProducto = data.datos.producto;
      setProductos([nuevoProducto, ...productos]);
      console.log("[Sync] Producto creado:", nuevoProducto.nombre);
    },
    [productos, setProductos]
  );

  // Cuando se actualiza un producto
  const handleProductoActualizado = useCallback(
    (data: any) => {
      const productoActualizado = data.datos.producto;
      setProductos(
        productos.map((p) =>
          p.id === productoActualizado.id ? productoActualizado : p
        )
      );
      console.log("[Sync] Producto actualizado:", productoActualizado.nombre);
    },
    [productos, setProductos]
  );

  // Cuando se elimina un producto
  const handleProductoEliminado = useCallback(
    (data: any) => {
      const productoEliminado = data.datos.producto;
      setProductos(productos.filter((p) => p.id !== productoEliminado.id));
      console.log("[Sync] Producto eliminado:", productoEliminado.id);
    },
    [productos, setProductos]
  );

  // Configurar listeners cuando el componente monta
  useEffect(() => {
    onProductoCreado(handleProductoCreado);
    onProductoActualizado(handleProductoActualizado);
    onProductoEliminado(handleProductoEliminado);

    return () => {
      offProductoCreado(handleProductoCreado);
      offProductoActualizado(handleProductoActualizado);
      offProductoEliminado(handleProductoEliminado);
    };
  }, [handleProductoCreado, handleProductoActualizado, handleProductoEliminado]);
}

/**
 * Hook para manejar sincronización de categorías en tiempo real
 * @param categorias - Lista actual de categorías
 * @param setCategorias - Función para actualizar categorías
 */

export function useSyncCategorias(
  categorias: { id: number; nombre: string }[],
  setCategorias: (categorias: { id: number; nombre: string }[]) => void
) {

  const handleCategoriaCreada = useCallback(
    (data: any) => {
      const nuevaCategoria = data.datos.categoria;
      setCategorias([...categorias, nuevaCategoria]);
      console.log("[Sync] Categoría creada:", nuevaCategoria.nombre);
    },
    [categorias, setCategorias]
  );

  const handleCategoriaEliminada = useCallback(
    (data: any) => {
      const categoriaEliminada = data.datos.categoria;
      setCategorias(categorias.filter((c) => c.id !== categoriaEliminada.id));
      console.log("[Sync] Categoría eliminada:", categoriaEliminada.id);
    },
    [categorias, setCategorias]
  );

  useEffect(() => {
    onCategoriaCreada(handleCategoriaCreada);
    onCategoriaEliminada(handleCategoriaEliminada);

    return () => {
      offCategoriaCreada(handleCategoriaCreada);
      offCategoriaEliminada(handleCategoriaEliminada);
    };
  }, [handleCategoriaCreada, handleCategoriaEliminada]);
}
