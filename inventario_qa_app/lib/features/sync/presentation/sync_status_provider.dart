import 'package:flutter/foundation.dart';

import '../../../core/websocket/websocket_client.dart';
/// Provider para monitorear el estado de conexión del WebSocket
class SyncStatusProvider extends ChangeNotifier {
  bool _isConnected = false;
  DateTime? _lastSync;

  bool get isConnected => _isConnected;
  DateTime? get lastSync => _lastSync;

  /// Inicia el monitoreo de conexión
  void inicializar() {
    // Conectar al WebSocket
    websocketClient.connect();

    // Escuchar eventos para actualizar lastSync
    websocketClient.events.listen((_) {
      _lastSync = DateTime.now();
      notifyListeners();
    });

    // Verificar conexión inicial
    _isConnected = websocketClient.isConnected;
    notifyListeners();

    // Simular verificación de estado cada segundo
    _verificarEstadoConexion();
  }

  /// Verifica el estado de la conexión periódicamente
  void _verificarEstadoConexion() {
    Future.delayed(const Duration(seconds: 2), () {
      if (websocketClient.isConnected && !_isConnected) {
        _isConnected = true;
        _lastSync = DateTime.now();
        print('[SyncStatus] Reconectado');
        notifyListeners();
      } else if (!websocketClient.isConnected && _isConnected) {
        _isConnected = false;
        print('[SyncStatus] Desconectado');
        notifyListeners();
      }

      if (_isConnected) {
        _verificarEstadoConexion();
      }
    });
  }

  /// Reconecta manualmente
  Future<void> reconectar() async {
    if (!_isConnected) {
      await websocketClient.connect();
      _isConnected = websocketClient.isConnected;
      _lastSync = DateTime.now();
      notifyListeners();
    }
  }

  @override
  void dispose() {
    super.dispose();
  }
}
