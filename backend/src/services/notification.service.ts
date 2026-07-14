import { io } from "../index";

export type NotificationType =
  | "PRODUCTO_CREADO"
  | "PRODUCTO_ACTUALIZADO"
  | "PRODUCTO_ELIMINADO"
  | "CATEGORIA_CREADA"
  | "CATEGORIA_ELIMINADA";

export interface Notificacion {
  tipo: NotificationType;
  datos: any;
  timestamp: Date;
  usuarioId: number;
}

/**
 * Emite una notificación a todos los clientes conectados
 * @param tipo Tipo de evento
 * @param datos Datos del evento
 * @param usuarioId ID del usuario que realiza la acción
 */
export const emitirNotificacion = async (
  tipo: NotificationType,
  datos: any,
  usuarioId: number
) => {
  const notificacion: Notificacion = {
    tipo,
    datos,
    timestamp: new Date(),
    usuarioId,
  };

  // Emitir a todos los clientes conectados
  io.emit(`inventario:${tipo}`, notificacion);

  console.log(`[Notificación] ${tipo} emitido:`, {
    usuarioId,
    timestamp: notificacion.timestamp,
    datosId: datos?.id || "N/A",
  });
};

/**
 * Emite una notificación específica para actualización de productos
 * @param tipo Tipo de evento (CREADO, ACTUALIZADO, ELIMINADO)
 * @param producto Datos del producto
 * @param usuarioId ID del usuario que realiza la acción
 */
export const emitirActualizacionProducto = async (
  tipo: NotificationType,
  producto: any,
  usuarioId: number
) => {
  await emitirNotificacion(
    tipo,
    {
      producto: {
        id: producto.id,
        nombre: producto.nombre,
        precio: producto.precio,
        stock: producto.stock,
        descripcion: producto.descripcion,
        imagenUrl: producto.imagenUrl,
        categoriaId: producto.categoriaId,
        creadoEn: producto.creadoEn,
        actualizadoEn: producto.actualizadoEn,
      },
    },
    usuarioId
  );
};

/**
 * Emite una notificación específica para actualización de categorías
 * @param tipo Tipo de evento (CREADA, ELIMINADA)
 * @param categoria Datos de la categoría
 * @param usuarioId ID del usuario que realiza la acción
 */
export const emitirActualizacionCategoria = async (
  tipo: NotificationType,
  categoria: any,
  usuarioId: number
) => {
  await emitirNotificacion(
    tipo,
    {
      categoria: {
        id: categoria.id,
        nombre: categoria.nombre,
        descripcion: categoria.descripcion,
        creadoEn: categoria.creadoEn,
      },
    },
    usuarioId
  );
};
