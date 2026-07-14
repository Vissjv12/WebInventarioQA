import 'package:flutter/foundation.dart';

import '../../../core/websocket/websocket_client.dart';

/// Modelo simplificado de Producto
class Producto {
  final int id;
  final String nombre;
  final double precio;
  final int stock;
  final String? descripcion;
  final String? imagenUrl;
  final int categoriaId;
  final String? categoriaNombre;

  Producto({
    required this.id,
    required this.nombre,
    required this.precio,
    required this.stock,
    this.descripcion,
    this.imagenUrl,
    required this.categoriaId,
    this.categoriaNombre,
  });

  factory Producto.fromJson(Map<String, dynamic> json) {
    return Producto(
      id: json['id'],
      nombre: json['nombre'],
      precio: (json['precio'] as num).toDouble(),
      stock: json['stock'],
      descripcion: json['descripcion'],
      imagenUrl: json['imagenUrl'],
      categoriaId: json['categoriaId'],
      categoriaNombre: json['categoria']?['nombre'],
    );
  }

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is Producto &&
          runtimeType == other.runtimeType &&
          id == other.id;

  @override
  int get hashCode => id.hashCode;
}

/// Provider para gestionar productos con sincronización en tiempo real
class ProductosProvider extends ChangeNotifier {
  List<Producto> _productos = [];
  bool _isLoading = false;
  String? _error;
  bool _isSynced = false;

  List<Producto> get productos => _productos;
  bool get isLoading => _isLoading;
  String? get error => _error;
  bool get isSynced => _isSynced;

  /// Obtiene productos desde la API
  Future<void> cargarProductos(Function obtenerProductos) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final products = await obtenerProductos();
      _productos = products;
      _error = null;
    } catch (e) {
      _error = 'Error al cargar productos: $e';
      print(_error);
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  /// Inicializa la sincronización con WebSocket
  void inicializarSincronizacion() {
    // Escucha eventos de productos creados
    websocketClient.events.listen((event) {
      switch (event.type) {
        case WebSocketEventType.productCreated:
          _handleProductoCreado(event);
        case WebSocketEventType.productUpdated:
          _handleProductoActualizado(event);
        case WebSocketEventType.productDeleted:
          _handleProductoEliminado(event);
        default:
          break;
      }
    });

    _isSynced = true;
    notifyListeners();
  }

  /// Maneja cuando se crea un producto
  void _handleProductoCreado(WebSocketEvent event) {
    try {
      final productoJson = event.data['producto'];
      if (productoJson != null) {
        final producto = Producto.fromJson(productoJson);
        
        // Evitar duplicados
        if (!_productos.any((p) => p.id == producto.id)) {
          _productos.insert(0, producto);
          print('[Sync] Producto creado: ${producto.nombre}');
          notifyListeners();
        }
      }
    } catch (e) {
      print('[Sync] Error al procesar producto creado: $e');
    }
  }

  /// Maneja cuando se actualiza un producto
  void _handleProductoActualizado(WebSocketEvent event) {
    try {
      final productoJson = event.data['producto'];
      if (productoJson != null) {
        final productoActualizado = Producto.fromJson(productoJson);
        
        final index = _productos.indexWhere((p) => p.id == productoActualizado.id);
        if (index != -1) {
          _productos[index] = productoActualizado;
          print('[Sync] Producto actualizado: ${productoActualizado.nombre}');
          notifyListeners();
        }
      }
    } catch (e) {
      print('[Sync] Error al procesar producto actualizado: $e');
    }
  }

  /// Maneja cuando se elimina un producto
  void _handleProductoEliminado(WebSocketEvent event) {
    try {
      final productoJson = event.data['producto'];
      if (productoJson != null) {
        final id = productoJson['id'];
        _productos.removeWhere((p) => p.id == id);
        print('[Sync] Producto eliminado: $id');
        notifyListeners();
      }
    } catch (e) {
      print('[Sync] Error al procesar producto eliminado: $e');
    }
  }

  /// Agrega un producto a la lista localmente
  void agregarProducto(Producto producto) {
    if (!_productos.any((p) => p.id == producto.id)) {
      _productos.insert(0, producto);
      notifyListeners();
    }
  }

  /// Actualiza un producto en la lista localmente
  void actualizarProducto(Producto producto) {
    final index = _productos.indexWhere((p) => p.id == producto.id);
    if (index != -1) {
      _productos[index] = producto;
      notifyListeners();
    }
  }

  /// Elimina un producto de la lista localmente
  void eliminarProducto(int id) {
    _productos.removeWhere((p) => p.id == id);
    notifyListeners();
  }

  /// Filtra productos por búsqueda
  List<Producto> buscar(String query) {
    if (query.isEmpty) return _productos;
    return _productos
        .where((p) =>
            p.nombre.toLowerCase().contains(query.toLowerCase()) ||
            (p.categoriaNombre?.toLowerCase().contains(query.toLowerCase()) ?? false))
        .toList();
  }

  @override
  void dispose() {
    super.dispose();
  }
}
