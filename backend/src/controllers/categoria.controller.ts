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
    const { nombre, descripcion } = req.body;
    if (!nombre) return res.status(400).json({ error: "El nombre es requerido" });

    const categoria = await prisma.categoria.create({ data: { nombre, descripcion } });

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
    const categoria = await prisma.categoria.findUnique({
      where: { id: categoriaId },
    });

    await prisma.categoria.delete({ where: { id: categoriaId } });

    // ✅ EMIT: Notificar a todas las aplicaciones
    if (categoria) {
      await emitirActualizacionCategoria(
        "CATEGORIA_ELIMINADA",
        categoria,
        req.usuario?.id || 0
      );
    }

    res.json({ message: "Categoría eliminada" });
  } catch {
    res.status(500).json({ error: "No se puede eliminar una categoría con productos asociados" });
  }
};