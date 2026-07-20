import { Request, Response } from "express";
import prisma from "../prisma";
import { emitirActualizacionCategoria } from "../services/notification.service";

export const listarCategorias = async (req: Request, res: Response) => {
  try {
    const categorias = await prisma.categoria.findMany();
    res.json(categorias);
  } catch {
    res.status(500).json({ error: "Error al obtener categorías" });
  }
};

export const crearCategoria = async (req: Request, res: Response) => {
  try {
    const nombreTrim = String(req.body.nombre ?? '').trim();
    const descripcionTrim = req.body.descripcion ? String(req.body.descripcion).trim() : undefined;

    if (nombreTrim.length === 0) {
      return res.status(400).json({ error: "El nombre de la categoría es requerido" });
    }

    if (nombreTrim.length < 2 || nombreTrim.length > 60) {
      return res.status(400).json({ error: "El nombre debe tener entre 2 y 60 caracteres" });
    }

    if (descripcionTrim && descripcionTrim.length > 500) {
      return res.status(400).json({ error: "La descripción no puede exceder los 500 caracteres" });
    }

    const categoria = await prisma.categoria.create({
      data: { nombre: nombreTrim, descripcion: descripcionTrim },
    });

    // ✅ EMIT: Notificar a todas las aplicaciones
    await emitirActualizacionCategoria(
      "CATEGORIA_CREADA",
      categoria,
      req.usuario?.id || 0
    );

    res.status(201).json(categoria);
  } catch {
    res.status(500).json({ error: "Error al crear categoría" });
  }
};

export const eliminarCategoria = async (req: Request, res: Response) => {
  try {
    const categoriaId = Number(req.params.id);

    if (isNaN(categoriaId) || categoriaId <= 0) {
      return res.status(400).json({ error: "ID de categoría inválido" });
    }

    const categoria = await prisma.categoria.findUnique({
      where: { id: categoriaId },
    });

    if (!categoria) {
      return res.status(404).json({ error: "Categoría no encontrada" });
    }

    await prisma.categoria.delete({ where: { id: categoriaId } });

    // ✅ EMIT: Notificar a todas las aplicaciones
    await emitirActualizacionCategoria(
      "CATEGORIA_ELIMINADA",
      categoria,
      req.usuario?.id || 0
    );

    res.json({ message: "Categoría eliminada" });
  } catch {
    res.status(500).json({ error: "No se puede eliminar una categoría con productos asociados" });
  }
};