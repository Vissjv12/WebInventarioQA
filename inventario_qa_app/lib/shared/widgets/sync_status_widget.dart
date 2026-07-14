import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../features/sync/presentation/sync_status_provider.dart';

/// Widget que muestra el estado de sincronización en tiempo real
class SyncStatusWidget extends StatelessWidget {
  final double fontSize;
  final EdgeInsets padding;

  const SyncStatusWidget({
    Key? key,
    this.fontSize = 12,
    this.padding = const EdgeInsets.all(8),
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Consumer<SyncStatusProvider>(
      builder: (context, syncProvider, _) {
        final isConnected = syncProvider.isConnected;
        final lastSync = syncProvider.lastSync;

        return Container(
          padding: padding,
          decoration: BoxDecoration(
            color: isConnected ? Colors.green[600] : Colors.red[600],
            borderRadius: BorderRadius.circular(8),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Indicador pulsante
              Container(
                width: 8,
                height: 8,
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(50),
                ),
                child: isConnected
                    ? const _PulseAnimation()
                    : null,
              ),
              const SizedBox(width: 8),
              
              // Texto de estado
              Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    isConnected ? 'Sincronizado' : 'Desconectado',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: fontSize,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                  if (lastSync != null)
                    Text(
                      '${lastSync.hour}:${lastSync.minute.toString().padLeft(2, '0')}:${lastSync.second.toString().padLeft(2, '0')}',
                      style: TextStyle(
                        color: Colors.white.withOpacity(0.8),
                        fontSize: fontSize - 2,
                      ),
                    ),
                ],
              ),
              
              // Botón de reconexión si está desconectado
              if (!isConnected)
                Padding(
                  padding: const EdgeInsets.only(left: 8),
                  child: GestureDetector(
                    onTap: () => syncProvider.reconectar(),
                    child: Icon(
                      Icons.refresh,
                      color: Colors.white,
                      size: fontSize + 4,
                    ),
                  ),
                ),
            ],
          ),
        );
      },
    );
  }
}

/// Animación de pulso para el indicador
class _PulseAnimation extends StatefulWidget {
  const _PulseAnimation();

  @override
  State<_PulseAnimation> createState() => _PulseAnimationState();
}

class _PulseAnimationState extends State<_PulseAnimation> with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _animation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: const Duration(milliseconds: 1500),
      vsync: this,
    )..repeat();

    _animation = Tween<double>(begin: 0.3, end: 1.0).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _animation,
      builder: (context, _) {
        return Container(
          width: 8,
          height: 8,
          decoration: BoxDecoration(
            color: Colors.white.withOpacity(_animation.value),
            borderRadius: BorderRadius.circular(50),
          ),
        );
      },
    );
  }
}
