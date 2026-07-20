class Categoria {
  final int id;
  final String nombre;
  final String? descripcion;

  const Categoria({required this.id, required this.nombre, this.descripcion});

  factory Categoria.fromJson(Map<String, dynamic> json) => Categoria(
        id: (json['id'] as num).toInt(),
        nombre: json['nombre'] as String,
        descripcion: json['descripcion'] as String?,
      );
}

class Producto {
  final int id;
  final String nombre;
  final double precio;
  final int stock;
  final String? descripcion;
  final String? imagenUrl;
  final DateTime? creadoEn;
  final DateTime? actualizadoEn;
  final Categoria categoria;
  final String? creadoPorNombre;

  const Producto({
    required this.id,
    required this.nombre,
    required this.precio,
    required this.stock,
    this.descripcion,
    this.imagenUrl,
    this.creadoEn,
    this.actualizadoEn,
    required this.categoria,
    this.creadoPorNombre,
  });

  factory Producto.fromJson(Map<String, dynamic> json) {
    final cat = json['categoria'];
    final creadoPor = json['creadoPor'];
    return Producto(
      id: (json['id'] as num).toInt(),
      nombre: json['nombre'] as String,
      precio: _toDouble(json['precio']),
      stock: (json['stock'] as num).toInt(),
      descripcion: json['descripcion'] as String?,
      imagenUrl: _normalizarUrlImagen(json['imagenUrl'] as String?),
      creadoEn: json['creadoEn'] != null
          ? DateTime.tryParse(json['creadoEn'] as String)
          : null,
      actualizadoEn: json['actualizadoEn'] != null
          ? DateTime.tryParse(json['actualizadoEn'] as String)
          : null,
      categoria: cat is Map<String, dynamic>
          ? Categoria.fromJson(cat)
          : Categoria(id: 0, nombre: ''),
      creadoPorNombre:
          creadoPor is Map<String, dynamic> ? creadoPor['nombre'] as String? : null,
    );
  }
}

double _toDouble(dynamic v) {
  if (v is num) return v.toDouble();
  if (v is String) return double.tryParse(v) ?? 0.0;
  return 0.0;
}

/// Normaliza la URL de imagen reemplazando "localhost" por la IP real del servidor.
/// Esto permite que las imágenes subidas desde la web (que generan URLs con localhost)
/// sean accesibles desde el dispositivo móvil en la red local.
String? _normalizarUrlImagen(String? url) {
  if (url == null || url.isEmpty) return null;
  // Reemplaza localhost por la IP del servidor para que el móvil pueda cargar la imagen
  return url
      .replaceAll('http://localhost:3000', 'http://192.168.18.8:3000')
      .replaceAll('https://localhost:3000', 'http://192.168.18.8:3000');
}
