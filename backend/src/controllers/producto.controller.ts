import { Request, Response } from "express";
import * as ProductoService from "../services/producto.service";
import { emitirActualizacionProducto } from "../services/notification.service";

export const listarProductos = async (req: Request, res: Response) => {
  try {
    const productos = await ProductoService.obtenerProductos();
    res.json(productos);
  } catch {
    res.status(500).json({ error: "Error al obtener productos" });
  }
};

export const obtenerProducto = async (req: Request, res: Response) => {
  try {
    const producto = await ProductoService.obtenerProductoPorId(Number(req.params.id));
    if (!producto) return res.status(404).json({ error: "Producto no encontrado" });
    res.json(producto);
  } catch {
    res.status(500).json({ error: "Error al obtener producto" });
  }
};

export const crearProducto = async (req: Request, res: Response) => {
  try {
    const { nombre, precio, stock, descripcion, imagenUrl, categoriaId } = req.body;
    const nombreTrim = String(nombre ?? '').trim();
    const precioNum = Number(precio);
    const stockNum = Number(stock);
    const categoriaNum = Number(categoriaId);

    if (nombreTrim.length === 0 || precio === undefined || stock === undefined || categoriaId === undefined) {
      return res.status(400).json({ error: "Nombre, precio, stock y categoría son requeridos" });
    }

    if (nombreTrim.length < 3 || nombreTrim.length > 120) {
      return res.status(400).json({ error: "El nombre debe tener entre 3 y 120 caracteres" });
    }

    if (Number.isNaN(precioNum) || precioNum < 0 || precioNum > 1000000) {
      return res.status(400).json({ error: "Precio inválido" });
    }

    if (!Number.isInteger(stockNum) || stockNum < 0 || stockNum > 1000000) {
      return res.status(400).json({ error: "Stock inválido" });
    }

    if (Number.isNaN(categoriaNum) || categoriaNum <= 0) {
      return res.status(400).json({ error: "Categoría inválida" });
    }

    if (descripcion && String(descripcion).length > 1000) {
      return res.status(400).json({ error: "La descripción no puede exceder los 1000 caracteres" });
    }

    const producto = await ProductoService.crearProducto({
      nombre: nombreTrim,
      precio: precioNum,
      stock: stockNum,
      descripcion: descripcion ? String(descripcion).trim() : undefined,
      imagenUrl: imagenUrl ? String(imagenUrl).trim() : undefined,
      categoriaId: categoriaNum,
      usuarioId: req.usuario!.id,
    });

    // ✅ EMIT: Notificar a todas las aplicaciones
    await emitirActualizacionProducto(
      "PRODUCTO_CREADO",
      producto,
      req.usuario!.id
    );

    res.status(201).json(producto);
  } catch {
    res.status(500).json({ error: "Error al crear producto" });
  }
};

export const actualizarProducto = async (req: Request, res: Response) => {
  try {
    const { nombre, precio, stock, descripcion, imagenUrl, categoriaId } = req.body;
    const nombreTrim = nombre != null ? String(nombre).trim() : undefined;
    const precioNum = precio != null ? Number(precio) : undefined;
    const stockNum = stock != null ? Number(stock) : undefined;
    const categoriaNum = categoriaId != null ? Number(categoriaId) : undefined;

    if (nombreTrim != null && (nombreTrim.length === 0 || nombreTrim.length < 3 || nombreTrim.length > 120)) {
      return res.status(400).json({ error: "El nombre debe tener entre 3 y 120 caracteres" });
    }

    if (precioNum != null && (Number.isNaN(precioNum) || precioNum < 0 || precioNum > 1000000)) {
      return res.status(400).json({ error: "Precio inválido" });
    }

    if (stockNum != null && (!Number.isInteger(stockNum) || stockNum < 0 || stockNum > 1000000)) {
      return res.status(400).json({ error: "Stock inválido" });
    }

    if (categoriaNum != null && (Number.isNaN(categoriaNum) || categoriaNum <= 0)) {
      return res.status(400).json({ error: "Categoría inválida" });
    }

    if (descripcion != null && String(descripcion).length > 1000) {
      return res.status(400).json({ error: "La descripción no puede exceder los 1000 caracteres" });
    }

    const producto = await ProductoService.actualizarProducto(Number(req.params.id), {
      nombre: nombreTrim ?? undefined,
      precio: precioNum ?? undefined,
      stock: stockNum ?? undefined,
      descripcion: descripcion != null ? String(descripcion).trim() : undefined,
      imagenUrl: imagenUrl ? String(imagenUrl).trim() : undefined,
      categoriaId: categoriaNum,
    });

    // ✅ EMIT: Notificar a todas las aplicaciones
    await emitirActualizacionProducto(
      "PRODUCTO_ACTUALIZADO",
      producto,
      req.usuario!.id
    );

    res.json(producto);
  } catch {
    res.status(500).json({ error: "Error al actualizar producto" });
  }
};

export const eliminarProducto = async (req: Request, res: Response) => {
  try {
    const productoId = Number(req.params.id);
    const producto = await ProductoService.obtenerProductoPorId(productoId);

    await ProductoService.eliminarProducto(productoId);

    // ✅ EMIT: Notificar a todas las aplicaciones
    await emitirActualizacionProducto(
      "PRODUCTO_ELIMINADO",
      { id: productoId, ...producto },
      req.usuario!.id
    );

    res.json({ message: "Producto eliminado correctamente" });
  } catch {
    res.status(500).json({ error: "Error al eliminar producto" });
  }
};