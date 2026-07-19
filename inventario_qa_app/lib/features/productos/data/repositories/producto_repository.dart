import 'dart:io';

import 'package:dio/dio.dart';
import 'package:http_parser/http_parser.dart';

import '../../../../core/api/api_client.dart';
import '../models/producto.dart';

class ProductoRepository {
  ProductoRepository({ApiClient? api}) : _api = api ?? ApiClient.instance;

  final ApiClient _api;

  Future<List<Producto>> listar() async {
    final data = await _api.guard<List<dynamic>>(() => _api.get('/productos'));
    return data
        .map((e) => Producto.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<Producto> obtener(int id) async {
    final data = await _api.guard<Map<String, dynamic>>(
      () => _api.get('/productos/$id'),
    );
    return Producto.fromJson(data);
  }

  Future<Producto> crear({
    required String nombre,
    required double precio,
    required int stock,
    String? descripcion,
    required int categoriaId,
    String? imagenUrl,
  }) async {
    final data = await _api.guard<Map<String, dynamic>>(
      () => _api.post('/productos', data: {
        'nombre': nombre,
        'precio': precio,
        'stock': stock,
        'descripcion': descripcion,
        'categoriaId': categoriaId,
        'imagenUrl': imagenUrl,
      }),
    );
    return Producto.fromJson(data);
  }

  Future<Producto> actualizar({
    required int id,
    required String nombre,
    required double precio,
    required int stock,
    String? descripcion,
    required int categoriaId,
    String? imagenUrl,
  }) async {
    final data = await _api.guard<Map<String, dynamic>>(
      () => _api.put('/productos/$id', data: {
        'nombre': nombre,
        'precio': precio,
        'stock': stock,
        'descripcion': descripcion,
        'categoriaId': categoriaId,
        'imagenUrl': imagenUrl,
      }),
    );
    return Producto.fromJson(data);
  }

  Future<void> eliminar(int id) async {
    await _api.guard<Map<String, dynamic>>(
      () => _api.delete('/productos/$id'),
    );
  }

  Future<String> subirImagen(File file) async {
    final formData = FormData.fromMap({
      'imagen': await MultipartFile.fromFile(
        file.path,
        contentType: MediaType('image', 'jpeg'),
      ),
    });
    final res = await _api.guard<Map<String, dynamic>>(
      () => _api.post('/imagenes', data: formData),
    );
    return res['url'] as String;
  }
}
