import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/theme/app_theme.dart';
import '../../../../shared/widgets/app_navbar.dart';
import '../../../../shared/widgets/app_spinner.dart';
import '../../../../shared/widgets/app_toast.dart';
import '../../../../shared/widgets/confirm_dialog.dart';
import '../../data/models/producto.dart';
import '../../data/repositories/categoria_repository.dart';
import '../../data/repositories/producto_repository.dart';
import '../../data/repositories/usuario_repository.dart';
import '../widgets/categoria_manager_sheet.dart';
import '../widgets/producto_form_sheet.dart';
import '../widgets/usuario_manager_sheet.dart';

class DashboardPage extends StatefulWidget {
  const DashboardPage({super.key});

  @override
  State<DashboardPage> createState() => _DashboardPageState();
}

class _DashboardPageState extends State<DashboardPage> {
  final _productoRepo = ProductoRepository();
  final _categoriaRepo = CategoriaRepository();
  final _usuarioRepo = UsuarioRepository();

  List<Producto> _productos = [];
  String _busqueda = '';
  bool _cargandoProductos = true;
  int _pagina = 1;
  static const int _porPagina = 8;

  // ── Filtros ──────────────────────────────────────────
  String _filtroCategoria = '';
  String _ordenPrecio = ''; // '' | 'asc' | 'desc'
  String _filtroStock = '';  // '' | 'disponible' | 'sinstock'
  double? _precioMin;
  double? _precioMax;
  bool _panelFiltros = false;

  List<String> get _categoriasDisponibles {
    final names = _productos.map((p) => p.categoria.nombre).toSet().toList();
    names.sort();
    return names;
  }

  @override
  void initState() {
    super.initState();
    _cargar();
  }

  Future<void> _cargar() async {
    setState(() => _cargandoProductos = true);
    try {
      final list = await _productoRepo.listar();
      if (!mounted) return;
      setState(() => _productos = list);
    } catch (e) {
      if (!mounted) return;
      showAppToast(context, 'Error al cargar productos: $e', error: true);
    } finally {
      if (mounted) setState(() => _cargandoProductos = false);
    }
  }

  Future<void> _abrirFormulario(Producto? producto) async {
    final categorias = await _categoriaRepo.listar();
    if (!mounted) return;
    final result = await showProductoFormSheet(
      context: context,
      categorias: categorias,
      producto: producto,
      onSubmit: ({required nombre, required precio, required stock, required categoriaId, descripcion, imagenUrl, imagenFile}) async {
        String? finalUrl = imagenUrl;
        if (imagenFile != null) {
          finalUrl = await _productoRepo.subirImagen(imagenFile);
        }
        if (producto == null) {
          await _productoRepo.crear(
            nombre: nombre,
            precio: precio,
            stock: stock,
            descripcion: descripcion,
            categoriaId: categoriaId,
            imagenUrl: finalUrl,
          );
        } else {
          await _productoRepo.actualizar(
            id: producto.id,
            nombre: nombre,
            precio: precio,
            stock: stock,
            descripcion: descripcion,
            categoriaId: categoriaId,
            imagenUrl: finalUrl,
          );
        }
      },
    );

    if (!mounted) return;
    if (result == true) {
      await _cargar();
      if (!mounted) return;
      showAppToast(
        context,
        producto == null
            ? 'Producto creado correctamente'
            : 'Producto actualizado correctamente',
      );
    } else if (result == false) {
      // usuario cerró sin enviar
    } else {
      // error
      showAppToast(context, 'Error al guardar', error: true);
    }
  }

  Future<void> _eliminarProducto(int id) async {
    final ok = await showAppConfirmDialog(
      context,
      mensaje:
          '¿Estás seguro de que deseas eliminar este producto? Esta acción no se puede deshacer.',
    );
    if (!ok) return;
    try {
      await _productoRepo.eliminar(id);
      await _cargar();
      if (!mounted) return;
      showAppToast(context, 'Producto eliminado correctamente');
    } catch (_) {
      if (!mounted) return;
      showAppToast(context, 'Error al eliminar el producto', error: true);
    }
  }

  Future<void> _abrirCategorias() async {
    await showCategoriaManagerSheet(
      context: context,
      repository: _categoriaRepo,
      onChanged: _cargar,
    );
  }

  Future<void> _abrirUsuarios() async {
    await showUsuarioManagerSheet(
      context: context,
      repository: _usuarioRepo,
    );
  }

  @override
  Widget build(BuildContext context) {
    // Filtrado completo
    List<Producto> filtrados = _productos.where((p) {
      final okNombre   = p.nombre.toLowerCase().contains(_busqueda.toLowerCase());
      final okCategoria = _filtroCategoria.isEmpty || p.categoria.nombre == _filtroCategoria;
      final okStock    = _filtroStock == 'disponible'
          ? p.stock > 0
          : _filtroStock == 'sinstock'
              ? p.stock == 0
              : true;
      final okMin = _precioMin == null || p.precio >= _precioMin!;
      final okMax = _precioMax == null || p.precio <= _precioMax!;
      return okNombre && okCategoria && okStock && okMin && okMax;
    }).toList();

    if (_ordenPrecio == 'asc')  filtrados.sort((a, b) => a.precio.compareTo(b.precio));
    if (_ordenPrecio == 'desc') filtrados.sort((a, b) => b.precio.compareTo(a.precio));

    final filtrosActivos = [_filtroCategoria, _ordenPrecio, _filtroStock]
        .where((v) => v.isNotEmpty)
        .length +
        (_precioMin != null ? 1 : 0) +
        (_precioMax != null ? 1 : 0);

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
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _abrirFormulario(null),
        backgroundColor: AppColors.primary,
        foregroundColor: AppColors.textPrimary,
        icon: const Icon(Icons.add),
        label: const Text('Nuevo'),
      ),
      body: RefreshIndicator(
        onRefresh: _cargar,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            LayoutBuilder(
              builder: (context, constraints) {
                final isWide = constraints.maxWidth >= 600;
                
                // Botón de filtros con badge
                final btnFiltros = Stack(
                  clipBehavior: Clip.none,
                  children: [
                    OutlinedButton.icon(
                      onPressed: () => setState(() => _panelFiltros = !_panelFiltros),
                      icon: const Icon(Icons.tune, size: 16),
                      label: const Text('Filtros'),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: filtrosActivos > 0 ? AppColors.primary : null,
                        side: filtrosActivos > 0
                            ? const BorderSide(color: AppColors.primary)
                            : null,
                      ),
                    ),
                    if (filtrosActivos > 0)
                      Positioned(
                        top: -6,
                        right: -6,
                        child: Container(
                          padding: const EdgeInsets.all(4),
                          decoration: const BoxDecoration(
                            color: AppColors.primary,
                            shape: BoxShape.circle,
                          ),
                          child: Text(
                            '$filtrosActivos',
                            style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold),
                          ),
                        ),
                      ),
                  ],
                );

                if (isWide) {
                  return Row(
                    children: [
                      const Expanded(
                        child: Text(
                          'Control de Almacén',
                          style: TextStyle(
                            color: AppColors.textPrimary,
                            fontSize: 20,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                      SizedBox(
                        width: 160,
                        child: TextField(
                          onChanged: (v) {
                            setState(() {
                              _busqueda = v;
                              _pagina = 1;
                            });
                          },
                          decoration: const InputDecoration(
                            isDense: true,
                            hintText: '🔍 Buscar...',
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      btnFiltros,
                      const SizedBox(width: 8),
                      OutlinedButton.icon(
                        onPressed: _abrirCategorias,
                        icon: const Icon(Icons.label_outline, size: 16),
                        label: const Text('Categorías'),
                      ),
                      const SizedBox(width: 8),
                      OutlinedButton.icon(
                        onPressed: _abrirUsuarios,
                        icon: const Icon(Icons.people_outline, size: 16),
                        label: const Text('Usuarios'),
                      ),
                      const SizedBox(width: 8),
                      ElevatedButton.icon(
                        onPressed: () => _abrirFormulario(null),
                        icon: const Icon(Icons.add, size: 18),
                        label: const Text('Nuevo'),
                      ),
                    ],
                  );
                }

                // Layout móvil: botones directamente visibles
                return Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    const Text(
                      'Control de Almacén',
                      style: TextStyle(
                        color: AppColors.textPrimary,
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 10),
                    Row(
                      children: [
                        Expanded(
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
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        btnFiltros,
                      ],
                    ),
                    const SizedBox(height: 10),
                    // Botones visibles directamente — scroll horizontal
                    SingleChildScrollView(
                      scrollDirection: Axis.horizontal,
                      child: Row(
                        children: [
                          OutlinedButton.icon(
                            onPressed: _abrirCategorias,
                            icon: const Icon(Icons.label_outline, size: 16),
                            label: const Text('Categorías'),
                          ),
                          const SizedBox(width: 8),
                          OutlinedButton.icon(
                            onPressed: _abrirUsuarios,
                            icon: const Icon(Icons.people_outline, size: 16),
                            label: const Text('Usuarios'),
                          ),
                          const SizedBox(width: 8),
                          ElevatedButton.icon(
                            onPressed: () => _abrirFormulario(null),
                            icon: const Icon(Icons.add, size: 16),
                            label: const Text('Nuevo producto'),
                          ),
                        ],
                      ),
                    ),
                  ],
                );
              },
            ),

            // ── Panel de filtros colapsable ──
            if (_panelFiltros) ...[
              const SizedBox(height: 12),
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: AppColors.surface,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppColors.border),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    // Categoría
                    Text('Categoría', style: TextStyle(color: AppColors.textSecondary, fontSize: 12)),
                    const SizedBox(height: 4),
                    DropdownButtonFormField<String>(
                      value: _filtroCategoria.isEmpty ? null : _filtroCategoria,
                      decoration: const InputDecoration(isDense: true, hintText: 'Todas las categorías'),
                      items: [
                        const DropdownMenuItem(value: '', child: Text('Todas')),
                        ..._categoriasDisponibles.map((c) => DropdownMenuItem(value: c, child: Text(c))),
                      ],
                      onChanged: (v) => setState(() { _filtroCategoria = v ?? ''; _pagina = 1; }),
                    ),
                    const SizedBox(height: 12),

                    // Orden precio
                    Text('Ordenar por precio', style: TextStyle(color: AppColors.textSecondary, fontSize: 12)),
                    const SizedBox(height: 4),
                    DropdownButtonFormField<String>(
                      value: _ordenPrecio.isEmpty ? null : _ordenPrecio,
                      decoration: const InputDecoration(isDense: true, hintText: 'Sin orden'),
                      items: const [
                        DropdownMenuItem(value: '', child: Text('Sin orden')),
                        DropdownMenuItem(value: 'asc', child: Text('Precio: Menor a mayor')),
                        DropdownMenuItem(value: 'desc', child: Text('Precio: Mayor a menor')),
                      ],
                      onChanged: (v) => setState(() { _ordenPrecio = v ?? ''; _pagina = 1; }),
                    ),
                    const SizedBox(height: 12),

                    // Rango precio
                    Text('Rango de precio (\$)', style: TextStyle(color: AppColors.textSecondary, fontSize: 12)),
                    const SizedBox(height: 4),
                    Row(
                      children: [
                        Expanded(
                          child: TextField(
                            keyboardType: const TextInputType.numberWithOptions(decimal: true),
                            decoration: const InputDecoration(isDense: true, hintText: 'Mín'),
                            onChanged: (v) => setState(() { _precioMin = double.tryParse(v); _pagina = 1; }),
                          ),
                        ),
                        const Padding(
                          padding: EdgeInsets.symmetric(horizontal: 8),
                          child: Text('–', style: TextStyle(color: AppColors.textMuted)),
                        ),
                        Expanded(
                          child: TextField(
                            keyboardType: const TextInputType.numberWithOptions(decimal: true),
                            decoration: const InputDecoration(isDense: true, hintText: 'Máx'),
                            onChanged: (v) => setState(() { _precioMax = double.tryParse(v); _pagina = 1; }),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),

                    // Disponibilidad
                    Text('Disponibilidad', style: TextStyle(color: AppColors.textSecondary, fontSize: 12)),
                    const SizedBox(height: 4),
                    DropdownButtonFormField<String>(
                      value: _filtroStock.isEmpty ? null : _filtroStock,
                      decoration: const InputDecoration(isDense: true, hintText: 'Todos'),
                      items: const [
                        DropdownMenuItem(value: '', child: Text('Todos')),
                        DropdownMenuItem(value: 'disponible', child: Text('Con stock')),
                        DropdownMenuItem(value: 'sinstock', child: Text('Sin stock')),
                      ],
                      onChanged: (v) => setState(() { _filtroStock = v ?? ''; _pagina = 1; }),
                    ),

                    if (filtrosActivos > 0) ...[
                      const SizedBox(height: 12),
                      OutlinedButton.icon(
                        onPressed: () => setState(() {
                          _filtroCategoria = '';
                          _ordenPrecio = '';
                          _filtroStock = '';
                          _precioMin = null;
                          _precioMax = null;
                          _busqueda = '';
                          _pagina = 1;
                        }),
                        icon: const Icon(Icons.clear, size: 16, color: Colors.redAccent),
                        label: const Text('Limpiar filtros', style: TextStyle(color: Colors.redAccent)),
                        style: OutlinedButton.styleFrom(side: const BorderSide(color: Colors.redAccent)),
                      ),
                    ],
                  ],
                ),
              ),
            ],

            // Contador de resultados
            if (_busqueda.isNotEmpty || filtrosActivos > 0) ...[
              const SizedBox(height: 10),
              Text(
                filtrados.isEmpty
                    ? 'Sin resultados con los filtros aplicados.'
                    : '${filtrados.length} producto${filtrados.length != 1 ? "s" : ""} encontrado${filtrados.length != 1 ? "s" : ""}',
                style: const TextStyle(color: AppColors.textMuted, fontSize: 13),
              ),
            ],
            const SizedBox(height: 20),
            if (_cargandoProductos)
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
                    itemBuilder: (_, i) {
                      final p = pagina[i];
                      return _ProductoAdminCard(
                        producto: p,
                        onVer: () => context.push('/producto/${p.id}'),
                        onEditar: () => _abrirFormulario(p),
                        onEliminar: () => _eliminarProducto(p.id),
                      );
                    },
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

class _ProductoAdminCard extends StatelessWidget {
  const _ProductoAdminCard({
    required this.producto,
    required this.onVer,
    required this.onEditar,
    required this.onEliminar,
  });

  final Producto producto;
  final VoidCallback onVer;
  final VoidCallback onEditar;
  final VoidCallback onEliminar;

  @override
  Widget build(BuildContext context) {
    return Container(
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
                  'Stock: ${producto.stock}',
                  style: const TextStyle(
                    color: AppColors.textSecondary,
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
            child: Row(
              children: [
                _IconBtn(icon: '👁️', onTap: onVer),
                _IconBtn(icon: '✏️', onTap: onEditar),
                _IconBtn(icon: '🗑️', onTap: onEliminar, danger: true),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _IconBtn extends StatelessWidget {
  const _IconBtn({required this.icon, required this.onTap, this.danger = false});
  final String icon;
  final VoidCallback onTap;
  final bool danger;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: InkWell(
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 6),
          alignment: Alignment.center,
          child: Text(icon, style: const TextStyle(fontSize: 14)),
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
