import { Request, Response } from "express";

export const uploadImagen = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No se envió ninguna imagen" });
    }

    // Validar tipo MIME
    const allowedMimes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedMimes.includes(req.file.mimetype)) {
      return res.status(400).json({ error: "Tipo de imagen no permitido. Use JPG, PNG o WEBP." });
    }

    // Usar BASE_URL del entorno para que sea accesible desde dispositivos móviles en la red local
    const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get("host")}`;
    const url = `${baseUrl}/uploads/${req.file.filename}`;
    return res.json({ url });
  } catch (error: any) {
    console.error("Error al subir imagen:", error);
    return res.status(500).json({ error: "Error al subir imagen" });
  }
};
