import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "../prisma";

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email y contraseña son requeridos" });
  }

  const usuario = await prisma.usuario.findUnique({ where: { email } });

  if (!usuario) {
    return res.status(401).json({ error: "Credenciales incorrectas" });
  }

  const passwordValida = await bcrypt.compare(password, usuario.password);

  if (!passwordValida) {
    return res.status(401).json({ error: "Credenciales incorrectas" });
  }

  const token = jwt.sign(
    { id: usuario.id, rol: usuario.rol },
    process.env.JWT_SECRET!,
    { expiresIn: "8h" }
  );

  return res.json({
    token,
    usuario: {
      id: usuario.id,
      nombre: usuario.nombre,
      email: usuario.email,
      rol: usuario.rol,
    },
  });
};

export const register = async (req: Request, res: Response) => {
  const nombreTrim = String(req.body.nombre ?? '').trim();
  const emailTrim = String(req.body.email ?? '').trim().toLowerCase();
  const passwordStr = String(req.body.password ?? '');
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (nombreTrim.length === 0 || emailTrim.length === 0 || passwordStr.length === 0) {
    return res.status(400).json({ error: "Todos los campos son requeridos" });
  }

  if (nombreTrim.length < 3 || nombreTrim.length > 80) {
    return res.status(400).json({ error: "El nombre debe tener entre 3 y 80 caracteres" });
  }

  if (!emailPattern.test(emailTrim)) {
    return res.status(400).json({ error: "Email inválido" });
  }

  if (passwordStr.length < 6) {
    return res.status(400).json({ error: "La contraseña debe tener al menos 6 caracteres" });
  }

  const existe = await prisma.usuario.findUnique({ where: { email: emailTrim } });
  if (existe) {
    return res.status(409).json({ error: "El email ya está registrado" });
  }

  const hash = await bcrypt.hash(passwordStr, 10);

  // Siempre CLIENTE, ignoramos el rol que venga del body
  const usuario = await prisma.usuario.create({
    data: { nombre: nombreTrim, email: emailTrim, password: hash, rol: "CLIENTE" },
  });

  return res.status(201).json({
    id: usuario.id,
    nombre: usuario.nombre,
    email: usuario.email,
    rol: usuario.rol,
  });
};

export const cambiarRol = async (req: Request, res: Response) => {
  const { rol } = req.body;

  if (!["ADMIN", "CLIENTE"].includes(rol)) {
    return res.status(400).json({ error: "Rol inválido" });
  }

  try {
    const usuario = await prisma.usuario.update({
      where: { id: Number(req.params.id) },
      data: { rol },
      select: { id: true, nombre: true, email: true, rol: true },
    });
    return res.json(usuario);
  } catch {
    return res.status(500).json({ error: "Error al cambiar rol" });
  }
};
export const listarUsuarios = async (req: Request, res: Response) => {
  try {
    const usuarios = await prisma.usuario.findMany({
      select: { id: true, nombre: true, email: true, rol: true },
      orderBy: { creadoEn: "asc" },
    });
    return res.json(usuarios);
  } catch {
    return res.status(500).json({ error: "Error al obtener usuarios" });
  }
};

export const eliminarUsuario = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    // Evita que el admin se elimine a sí mismo
    if (id === req.usuario!.id) {
      return res.status(400).json({ error: "No puedes eliminarte a ti mismo" });
    }
    await prisma.usuario.delete({ where: { id } });
    return res.json({ message: "Usuario eliminado" });
  } catch {
    return res.status(500).json({ error: "Error al eliminar usuario" });
  }
};