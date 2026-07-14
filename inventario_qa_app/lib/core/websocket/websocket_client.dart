import 'dart:async';
import 'dart:convert';
import 'package:web_socket_channel/web_socket_channel.dart';

import '../constants.dart';

/// Tipos de eventos que puede emitir el servidor
enum WebSocketEventType {
  productCreated('PRODUCTO_CREADO'),
  productUpdated('PRODUCTO_ACTUALIZADO'),
  productDeleted('PRODUCTO_ELIMINADO'),
  categoryCreated('CATEGORIA_CREADA'),
  categoryDeleted('CATEGORIA_ELIMINADA'),
  unknown('UNKNOWN');

  final String value;
  const WebSocketEventType(this.value);

  static WebSocketEventType fromString(String? value) {
    return WebSocketEventType.values.firstWhere(
      (e) => e.value == value,
      orElse: () => WebSocketEventType.unknown,
    );
  }
}

/// Modelo para eventos del WebSocket
class WebSocketEvent {
  final WebSocketEventType type;
  final Map<String, dynamic> data;
  final DateTime timestamp;
  final int usuarioId;

  WebSocketEvent({
    required this.type,
    required this.data,
    required this.timestamp,
    required this.usuarioId,
  });

  factory WebSocketEvent.fromJson(Map<String, dynamic> json) {
    return WebSocketEvent(
      type: WebSocketEventType.fromString(json['tipo']),
      data: json['datos'] ?? {},
      timestamp: DateTime.parse(json['timestamp'] ?? DateTime.now().toIso8601String()),
      usuarioId: json['usuarioId'] ?? 0,
    );
  }
}

/// Cliente WebSocket para sincronización en tiempo real
class WebSocketClient {
  WebSocketChannel? _channel;
  StreamSubscription? _subscription;
  final _eventController = StreamController<WebSocketEvent>.broadcast();

  /// Stream de eventos que emite el servidor
  Stream<WebSocketEvent> get events => _eventController.stream;

  /// Indica si está conectado
  bool get isConnected => _channel != null;

  /// Conecta al servidor WebSocket
  Future<void> connect({String? baseUrl}) async {
    if (_channel != null) return;

    try {
      final url = baseUrl ?? AppConfig.apiBaseUrl.replaceFirst('/api', '');
      final wsUrl = url.replaceFirst('http://', 'ws://').replaceFirst('https://', 'wss://');

      print('[WebSocket] Conectando a: $wsUrl');

      _channel = WebSocketChannel.connect(Uri.parse(wsUrl));

      _subscription = _channel!.stream.listen(
        (message) {
          _handleMessage(message);
        },
        onError: (error) {
          print('[WebSocket] Error: $error');
          disconnect();
        },
        onDone: () {
          print('[WebSocket] Conexión cerrada por servidor');
          disconnect();
        },
      );

      print('[WebSocket] Conectado exitosamente');
    } catch (e) {
      print('[WebSocket] Error al conectar: $e');
      disconnect();
    }
  }

  /// Maneja mensajes recibidos del servidor
  void _handleMessage(dynamic message) {
    try {
      if (message is String) {
        final json = jsonDecode(message);
        if (json is Map<String, dynamic>) {
          final event = WebSocketEvent.fromJson(json);
          _eventController.add(event);
          print('[WebSocket] Evento recibido: ${event.type.value}');
        }
      }
    } catch (e) {
      print('[WebSocket] Error al procesar mensaje: $e');
    }
  }

  /// Emite un mensaje al servidor
  void send(Map<String, dynamic> message) {
    try {
      if (_channel != null) {
        _channel!.sink.add(jsonEncode(message));
        print('[WebSocket] Mensaje enviado: $message');
      } else {
        print('[WebSocket] No conectado. No se pudo enviar: $message');
      }
    } catch (e) {
      print('[WebSocket] Error al enviar mensaje: $e');
    }
  }

  /// Se desconecta del servidor
  void disconnect() {
    _subscription?.cancel();
    _channel?.sink.close();
    _channel = null;
    print('[WebSocket] Desconectado');
  }

  /// Limpia recursos
  void dispose() {
    disconnect();
    _eventController.close();
  }
}

/// Instancia singleton del cliente WebSocket
final websocketClient = WebSocketClient();
