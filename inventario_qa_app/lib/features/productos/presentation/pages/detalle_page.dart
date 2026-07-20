import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import '../../../../core/theme/app_theme.dart';
import '../../../../shared/widgets/app_navbar.dart';
import '../../../../shared/widgets/app_spinner.dart';
import '../../../auth/presentation/auth_provider.dart';
import '../../data/models/producto.dart';
import '../../data/repositories/producto_repository.dart';
import 'package:provider/provider.dart';

class DetallePage extends StatefulWidget {
  const DetallePage({super.key, required this.id});
  final String id;

  @override
  State<DetallePage> createState() => _DetallePageState();
}

class _DetallePageState extends State<DetallePage> {
  final _repo = ProductoRepository();
  Producto? _producto;
  bool _cargando = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _cargar();
  }

  Future<void> _cargar() async {
    try {
      final p = await _repo.obtener(int.parse(widget.id));
      if (!mounted) return;
      setState(() => _producto = p);
    } catch (e) {
      if (!mounted) return;
      setState(() => _error = 'Producto no encontrado');
    } finally {
      if (mounted) setState(() => _cargando = false);
    }
  }

  void _volver() {
    final isAdmin = context.read<AuthProvider>().isAdmin;
    context.go(isAdmin ? '/dashboard' : '/catalogo');
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: const AppNavbar(),
      body: _cargando
          ? const AppSpinner()
          : _error != null || _producto == null
              ? _buildError()
              : _buildDetalle(_producto!),
    );
  }

  Widget _buildError() {
    return Padding(
      padding: const EdgeInsets.all(24),
      child: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text('📦', style: TextStyle(fontSize: 56)),
            const SizedBox(height: 12),
            Text(
              _error!,
              style: const TextStyle(
                color: AppColors.danger,
                fontSize: 16,
              ),
            ),
            const SizedBox(height: 20),
            OutlinedButton(
              onPressed: _volver,
              child: const Text('← Volver'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDetalle(Producto p) {
    final fmt = DateFormat("d 'de' MMMM 'de' y", 'es');
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 480),
          child: Container(
            decoration: BoxDecoration(
              color: AppColors.surface,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: AppColors.border),
            ),
            clipBehavior: Clip.antiAlias,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Container(
                  height: 180,
                  color: AppColors.surfaceAlt,
                  alignment: Alignment.center,
                  child: p.imagenUrl != null && p.imagenUrl!.isNotEmpty
                      ? CachedNetworkImage(
                          imageUrl: p.imagenUrl!,
                          fit: BoxFit.contain,
                          width: double.infinity,
                          height: double.infinity,
                          placeholder: (_, __) => const Center(
                            child: SizedBox(
                              width: 32,
                              height: 32,
                              child: CircularProgressIndicator(strokeWidth: 2),
                            ),
                          ),
                          errorWidget: (_, __, ___) =>
                              const Text('📦', style: TextStyle(fontSize: 48)),
                        )
                      : const Text('📦', style: TextStyle(fontSize: 48)),

                ),
                Padding(
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 10,
                          vertical: 4,
                        ),
                        decoration: BoxDecoration(
                          color: AppColors.tagBackground,
                          borderRadius: BorderRadius.circular(999),
                        ),
                        child: Text(
                          p.categoria.nombre,
                          style: const TextStyle(
                            color: AppColors.primary,
                            fontSize: 12,
                          ),
                        ),
                      ),
                      const SizedBox(height: 12),
                      Text(
                        p.nombre,
                        style: const TextStyle(
                          color: AppColors.textPrimary,
                          fontSize: 24,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        '\$${p.precio.toStringAsFixed(2)}',
                        style: const TextStyle(
                          color: AppColors.success,
                          fontSize: 22,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 12),
                      Container(
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(
                          color: AppColors.surfaceAlt,
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text(
                          p.stock > 0
                              ? '✅ En stock: ${p.stock} unidades'
                              : '❌ Sin stock',
                          style: TextStyle(
                            color: p.stock > 0
                                ? AppColors.success
                                : AppColors.danger,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                      if (p.descripcion != null && p.descripcion!.isNotEmpty) ...[
                        const SizedBox(height: 16),
                        const Text(
                          'Descripción',
                          style: TextStyle(
                            color: AppColors.textMuted,
                            fontSize: 12,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          p.descripcion!,
                          style: const TextStyle(
                            color: AppColors.textPrimary,
                            fontSize: 14,
                            height: 1.5,
                          ),
                        ),
                      ],
                      const SizedBox(height: 16),
                      const Divider(),
                      const SizedBox(height: 12),
                      if (p.creadoPorNombre != null)
                        _MetaRow(
                          label: 'Registrado por',
                          value: p.creadoPorNombre!,
                        ),
                      if (p.creadoEn != null)
                        _MetaRow(
                          label: 'Fecha de registro',
                          value: fmt.format(p.creadoEn!),
                        ),
                      if (p.actualizadoEn != null)
                        _MetaRow(
                          label: 'Última actualización',
                          value: fmt.format(p.actualizadoEn!),
                        ),
                      const SizedBox(height: 16),
                      OutlinedButton(
                        onPressed: _volver,
                        child: const Text('← Volver'),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _MetaRow extends StatelessWidget {
  const _MetaRow({required this.label, required this.value});
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        children: [
          Text(
            label,
            style: const TextStyle(
              color: AppColors.textMuted,
              fontSize: 12,
            ),
          ),
          const Spacer(),
          Text(
            value,
            style: const TextStyle(
              color: AppColors.textSecondary,
              fontSize: 13,
            ),
          ),
        ],
      ),
    );
  }
}
