import 'package:dio/dio.dart';

import '../constants.dart';
import '../storage/secure_storage.dart';
import 'api_exception.dart';

class ApiClient {
  ApiClient._internal()
      : _dio = Dio(
          BaseOptions(
            baseUrl: AppConfig.apiBaseUrl,
            connectTimeout: AppConfig.requestTimeout,
            receiveTimeout: AppConfig.requestTimeout,
            sendTimeout: AppConfig.requestTimeout,
            headers: {'Accept': 'application/json'},
            validateStatus: (s) => s != null && s < 500,
          ),
        ) {
    _dio.interceptors.add(
      InterceptorsRequestHandlerWrapper(_storage).handler,
    );
    print("================================");
print("API URL: ${AppConfig.apiBaseUrl}");
print("================================");
  }

  static final ApiClient instance = ApiClient._internal();

  final Dio _dio;
  final SecureStorage _storage = SecureStorage();

  Dio get dio => _dio;

  Future<Response<T>> get<T>(String path, {Map<String, dynamic>? query}) {
    return _dio.get<T>(path, queryParameters: query);
  }

  Future<Response<T>> post<T>(String path, {dynamic data}) {
    return _dio.post<T>(path, data: data);
  }

  Future<Response<T>> put<T>(String path, {dynamic data}) {
    return _dio.put<T>(path, data: data);
  }

  Future<Response<T>> patch<T>(String path, {dynamic data}) {
    return _dio.patch<T>(path, data: data);
  }

  Future<Response<T>> delete<T>(String path) {
    return _dio.delete<T>(path);
  }

  String extractError(Response response, {String fallback = 'Error en la solicitud'}) {
    final data = response.data;
    if (data is Map && data['error'] is String) {
      return data['error'] as String;
    }
    if (data is Map && data['message'] is String) {
      return data['message'] as String;
    }
    if (response.statusCode != null) {
      return '$fallback (${response.statusCode})';
    }
    return fallback;
  }

  Future<T> guard<T>(Future<Response<T>> Function() call) async {
    try {
      final res = await call();
      if (res.statusCode != null && res.statusCode! >= 200 && res.statusCode! < 300) {
        return res.data as T;
      }
      throw ApiException(
        extractError(res),
        statusCode: res.statusCode,
        raw: res.data,
      );
    } on DioException catch (e) {
      if (e.response != null) {
        throw ApiException(
          extractError(e.response!),
          statusCode: e.response!.statusCode,
          raw: e.response!.data,
        );
      }
      throw ApiException(e.message ?? 'Error de red');
    }
  }
}

class InterceptorsRequestHandlerWrapper {
  InterceptorsRequestHandlerWrapper(this._storage);
  final SecureStorage _storage;
  late final Interceptor handler = InterceptorsWrapper(
    onRequest: (options, handler) async {
      final token = await _storage.getToken();
      if (token != null && token.isNotEmpty) {
        options.headers['Authorization'] = 'Bearer $token';
      }
      handler.next(options);
    },
  );
}
