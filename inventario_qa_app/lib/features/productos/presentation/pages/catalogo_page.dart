import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/theme/app_theme.dart';
import '../../../../shared/widgets/app_navbar.dart';
import '../../../../shared/widgets/app_spinner.dart';
import '../../data/models/producto.dart';
import '../../data/repositories/producto_repository.dart';

class CatalogoPage extends StatefulWidget {
  const CatalogoPage({super.key});

  @override
  State<CatalogoPage> createState() => _CatalogoPageState();
}

class _CatalogoPageState extends State<CatalogoPage> {
  final _repo = ProductoRepository();
  List<Producto> _productos = [];
  String _busqueda = '';
  bool _cargando = true;
  int _pagina = 1;
  static const int _porPagina = 8;

  @override
  void initState() {
    super.initState();
    _cargar();
  }

  Future<void> _cargar() async {
    setState(() => _cargando = true);
    try {
      final list = await _repo.listar();
      if (!mounted) return;
      setState(() => _productos = list);
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error: $e'), backgroundColor: AppColors.danger),
      );
    } finally {
      if (mounted) setState(() => _cargando = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final filtrados = _productos
        .where((p) => p.nombre.toLowerCase().contains(_busqueda.toLowerCase()))
        .toList();
    final totalPaginas = (filtrados.length / _porPagina).ceil().clamp(1, 999);
    final inicio = (_pagina - 1) * _porPagina;
    final fin = inicio + _porPagina;
    final pagina = filtrados.sublist(
      inicio.clamp(0, filtrados.length),
      fin.clamp(0, filtrados.length),
    );

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: const AppNavbar(),
      body: RefreshIndicator(
        onRefresh: _cargar,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            Row(
              children: [
                const Expanded(
                  child: Text(
                    'Catálogo de Productos',
                    style: TextStyle(
                      color: AppColors.textPrimary,
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
                SizedBox(
                  width: 220,
                  child: TextField(
                    onChanged: (v) {
                      setState(() {
                        _busqueda = v;
                        _pagina = 1;
                      });
                    },
                    decoration: const InputDecoration(
                      isDense: true,
                      hintText: '🔍 Buscar producto...',
                      prefixIcon: null,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 20),
            if (_cargando)
              const AppSpinner()
            else if (filtrados.isEmpty)
              const Padding(
                padding: EdgeInsets.all(40),
                child: Center(
                  child: Text(
                    'No hay productos disponibles.',
                    style: TextStyle(color: AppColors.textMuted),
                  ),
                ),
              )
            else
              OrientationBuilder(
                builder: (context, orientation) {
                  final isLand = orientation == Orientation.landscape;
                  return GridView.builder(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    itemCount: pagina.length,
                    gridDelegate: SliverGridDelegateWithMaxCrossAxisExtent(
                      maxCrossAxisExtent: isLand ? 180 : 220,
                      mainAxisSpacing: 12,
                      crossAxisSpacing: 12,
                      childAspectRatio: isLand ? 0.75 : 0.72,
                    ),
                    itemBuilder: (_, i) => _ProductoCard(producto: pagina[i]),
                  );
                },
              ),
            if (totalPaginas > 1) ...[
              const SizedBox(height: 24),
              _Pagination(
                pagina: _pagina,
                totalPaginas: totalPaginas,
                onChange: (p) => setState(() => _pagina = p),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _ProductoCard extends StatelessWidget {
  const _ProductoCard({required this.producto});
  final Producto producto;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      borderRadius: BorderRadius.circular(12),
      onTap: () => context.push('/producto/${producto.id}'),
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
              height: 80,
              color: AppColors.surfaceAlt,
              alignment: Alignment.center,
              child: producto.imagenUrl != null && producto.imagenUrl!.isNotEmpty
                  ? CachedNetworkImage(
                      imageUrl: producto.imagenUrl!,
                      fit: BoxFit.cover,
                      width: double.infinity,
                      height: double.infinity,
                      placeholder: (_, __) => const Center(
                        child: SizedBox(
                          width: 24,
                          height: 24,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            valueColor: AlwaysStoppedAnimation(AppColors.primary),
                          ),
                        ),
                      ),
                      errorWidget: (_, __, ___) =>
                          const Center(child: Text('📦', style: TextStyle(fontSize: 28))),
                    )
                  : const Center(child: Text('📦', style: TextStyle(fontSize: 28))),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(8, 6, 8, 4),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    producto.nombre,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      color: AppColors.textPrimary,
                      fontSize: 13,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    '\$${producto.precio.toStringAsFixed(2)}',
                    style: const TextStyle(
                      color: AppColors.success,
                      fontWeight: FontWeight.bold,
                      fontSize: 13,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    producto.stock > 0
                        ? 'Stock: ${producto.stock}'
                        : 'Sin stock',
                    style: TextStyle(
                      color: producto.stock > 0
                          ? AppColors.textSecondary
                          : AppColors.danger,
                      fontSize: 11,
                    ),
                  ),
                  const SizedBox(height: 1),
                  Text(
                    producto.categoria.nombre,
                    style: const TextStyle(
                      color: AppColors.primary,
                      fontSize: 11,
                    ),
                  ),
                ],
              ),
            ),
            const Spacer(),
            Container(
              decoration: const BoxDecoration(
                border: Border(top: BorderSide(color: AppColors.border)),
              ),
              child: TextButton(
                onPressed: () => context.push('/producto/${producto.id}'),
                style: TextButton.styleFrom(
                  foregroundColor: AppColors.textSecondary,
                  padding: const EdgeInsets.symmetric(vertical: 6),
                  minimumSize: Size.zero,
                  tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                  shape: const RoundedRectangleBorder(),
                ),
                child: const Text('👁️ Ver detalle', style: TextStyle(fontSize: 13)),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _Pagination extends StatelessWidget {
  const _Pagination({
    required this.pagina,
    required this.totalPaginas,
    required this.onChange,
  });

  final int pagina;
  final int totalPaginas;
  final ValueChanged<int> onChange;

  @override
  Widget build(BuildContext context) {
    return Wrap(
      alignment: WrapAlignment.center,
      spacing: 6,
      runSpacing: 6,
      children: [
        OutlinedButton(
          onPressed: pagina == 1 ? null : () => onChange(pagina - 1),
          child: const Text('← Anterior'),
        ),
        for (int i = 1; i <= totalPaginas; i++)
          _PaginaButton(
            label: '$i',
            active: i == pagina,
            onTap: () => onChange(i),
          ),
        OutlinedButton(
          onPressed: pagina == totalPaginas ? null : () => onChange(pagina + 1),
          child: const Text('Siguiente →'),
        ),
      ],
    );
  }
}

class _PaginaButton extends StatelessWidget {
  const _PaginaButton({
    required this.label,
    required this.active,
    required this.onTap,
  });
  final String label;
  final bool active;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: active ? AppColors.primary : AppColors.surface,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(6),
        side: const BorderSide(color: AppColors.border),
      ),
      child: InkWell(
        borderRadius: BorderRadius.circular(6),
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
          child: Text(
            label,
            style: TextStyle(
              color: AppColors.textPrimary,
              fontWeight: active ? FontWeight.bold : FontWeight.normal,
            ),
          ),
        ),
      ),
    );
  }
}
