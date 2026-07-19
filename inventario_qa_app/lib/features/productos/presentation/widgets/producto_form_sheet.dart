import 'dart:io';

import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_form_builder/flutter_form_builder.dart';
import 'package:form_builder_validators/form_builder_validators.dart';
import 'package:image_picker/image_picker.dart';

import '../../../../core/theme/app_theme.dart';
import '../../../../shared/widgets/app_spinner.dart';
import '../../data/models/producto.dart';

typedef ProductoFormSubmit = Future<void> Function({
  required String nombre,
  required double precio,
  required int stock,
  String? descripcion,
  required int categoriaId,
  String? imagenUrl,
  File? imagenFile,
});

/// Devuelve:
///   true  -> guardado OK
///   false -> cancelado
///   null  -> error
Future<bool?> showProductoFormSheet({
  required BuildContext context,
  required List<Categoria> categorias,
  required ProductoFormSubmit onSubmit,
  Producto? producto,
}) async {
  final result = await showModalBottomSheet<bool?>(
    context: context,
    isScrollControlled: true,
    backgroundColor: AppColors.surface,
    shape: const RoundedRectangleBorder(
      borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
    ),
    builder: (ctx) => _ProductoFormSheet(
      categorias: categorias,
      onSubmit: onSubmit,
      producto: producto,
    ),
  );
  return result;
}

class _ProductoFormSheet extends StatefulWidget {
  const _ProductoFormSheet({
    required this.categorias,
    required this.onSubmit,
    this.producto,
  });
  final List<Categoria> categorias;
  final ProductoFormSubmit onSubmit;
  final Producto? producto;

  @override
  State<_ProductoFormSheet> createState() => _ProductoFormSheetState();
}

class _ProductoFormSheetState extends State<_ProductoFormSheet> {
  final _key = GlobalKey<FormBuilderState>();
  bool _cargando = false;
  File? _imagenFile;
  String? _imagenPreview;

  @override
  void initState() {
    super.initState();
    _imagenPreview = widget.producto?.imagenUrl;
  }

  Future<void> _pickImage() async {
    final picker = ImagePicker();
    final picked = await picker.pickImage(
      source: ImageSource.gallery,
      imageQuality: 80,
      maxWidth: 1280,
    );
    if (picked == null) return;
    setState(() {
      _imagenFile = File(picked.path);
      _imagenPreview = picked.path;
    });
  }

  Future<void> _guardar() async {
    if (!(_key.currentState?.saveAndValidate() ?? false)) return;
    final v = _key.currentState!.value;
    final precio = double.tryParse(v['precio'].toString());
    final stock = int.tryParse(v['stock'].toString());
    if (precio == null || precio < 0) {
      _showSnack('Precio inválido');
      return;
    }
    if (stock == null || stock < 0) {
      _showSnack('Stock inválido');
      return;
    }
    setState(() => _cargando = true);
    try {
      await widget.onSubmit(
        nombre: v['nombre'] as String,
        precio: precio,
        stock: stock,
        descripcion: v['descripcion'] as String?,
        categoriaId: int.parse(v['categoriaId'].toString()),
        imagenUrl: _imagenFile == null ? widget.producto?.imagenUrl : null,
        imagenFile: _imagenFile,
      );
      if (mounted) Navigator.of(context).pop(true);
    } catch (e) {
      if (mounted) Navigator.of(context).pop(null);
    } finally {
      if (mounted) setState(() => _cargando = false);
    }
  }

  void _showSnack(String msg) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(msg), backgroundColor: AppColors.danger),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isEdit = widget.producto != null;
    return AnimatedPadding(
      duration: const Duration(milliseconds: 150),
      padding: EdgeInsets.only(
        bottom: MediaQuery.of(context).viewInsets.bottom + 16,
      ),
      child: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: FormBuilder(
            key: _key,
            initialValue: isEdit
                ? {
                    'nombre': widget.producto!.nombre,
                    'precio': widget.producto!.precio.toStringAsFixed(2),
                    'stock': widget.producto!.stock.toString(),
                    'descripcion': widget.producto!.descripcion ?? '',
                    'categoriaId': widget.producto!.categoria.id.toString(),
                  }
                : {
                    'nombre': '',
                    'precio': '',
                    'stock': '',
                    'descripcion': '',
                    'categoriaId': '',
                  },
            child: SingleChildScrollView(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          isEdit ? 'Editar Producto' : 'Nuevo Producto',
                          style: const TextStyle(
                            color: AppColors.textPrimary,
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                      IconButton(
                        onPressed: () => Navigator.of(context).pop(false),
                        icon: const Icon(Icons.close, color: AppColors.textMuted),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  FormBuilderTextField(
                    name: 'nombre',
                    decoration: const InputDecoration(
                      labelText: 'Nombre *',
                      prefixIcon: Icon(Icons.inventory_2_outlined),
                    ),
                    validator: FormBuilderValidators.required(),
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(
                        child: FormBuilderTextField(
                          name: 'precio',
                          keyboardType: const TextInputType.numberWithOptions(decimal: true),
                          decoration: const InputDecoration(
                            labelText: 'Precio (\$) *',
                            prefixIcon: Icon(Icons.attach_money),
                          ),
                          validator: FormBuilderValidators.compose([
                            FormBuilderValidators.required(),
                            FormBuilderValidators.numeric(),
                            FormBuilderValidators.min(0),
                          ]),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: FormBuilderTextField(
                          name: 'stock',
                          keyboardType: TextInputType.number,
                          decoration: const InputDecoration(
                            labelText: 'Stock *',
                            prefixIcon: Icon(Icons.numbers),
                          ),
                          validator: FormBuilderValidators.compose([
                            FormBuilderValidators.required(),
                            FormBuilderValidators.integer(),
                            FormBuilderValidators.min(0),
                          ]),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  FormBuilderDropdown<String>(
                    name: 'categoriaId',
                    decoration: const InputDecoration(
                      labelText: 'Categoría *',
                      prefixIcon: Icon(Icons.category_outlined),
                    ),
                    items: widget.categorias
                        .map((c) => DropdownMenuItem(
                              value: c.id.toString(),
                              child: Text(c.nombre),
                            ))
                        .toList(),
                    validator: FormBuilderValidators.required(),
                  ),
                  const SizedBox(height: 12),
                  FormBuilderTextField(
                    name: 'descripcion',
                    maxLines: 3,
                    decoration: const InputDecoration(
                      labelText: 'Descripción',
                      alignLabelWithHint: true,
                    ),
                  ),
                  const SizedBox(height: 12),
                  _ImagePickerBox(
                    preview: _imagenPreview,
                    onTap: _pickImage,
                  ),
                  const SizedBox(height: 16),
                  if (_cargando)
                    const AppSpinner()
                  else
                    Row(
                      children: [
                        Expanded(
                          child: OutlinedButton(
                            onPressed: () => Navigator.of(context).pop(false),
                            child: const Text('Cancelar'),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: ElevatedButton(
                            onPressed: _guardar,
                            child: Text(isEdit ? 'Guardar Cambios' : 'Crear Producto'),
                          ),
                        ),
                      ],
                    ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _ImagePickerBox extends StatelessWidget {
  const _ImagePickerBox({this.preview, required this.onTap});
  final String? preview;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(8),
      child: Container(
        height: 160,
        decoration: BoxDecoration(
          border: Border.all(color: AppColors.border, style: BorderStyle.solid, width: 2),
          borderRadius: BorderRadius.circular(8),
          color: AppColors.surfaceAlt,
        ),
        alignment: Alignment.center,
        child: preview != null
            ? ClipRRect(
                borderRadius: BorderRadius.circular(6),
                child: preview!.startsWith('http')
                    ? CachedNetworkImage(
                        imageUrl: preview!,
                        fit: BoxFit.contain,
                        height: 150,                        placeholder: (_, __) => const Center(child: CircularProgressIndicator()),
                        errorWidget: (_, __, ___) => const Center(child: Text('📦', style: TextStyle(fontSize: 28))),                      )
                    : Image.file(File(preview!), fit: BoxFit.contain, height: 150),
              )
            : Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: const [
                  Text('📷', style: TextStyle(fontSize: 28)),
                  SizedBox(height: 6),
                  Text(
                    'Clic para seleccionar imagen',
                    style: TextStyle(color: AppColors.textMuted, fontSize: 13),
                  ),
                  Text(
                    'JPG, PNG o WEBP',
                    style: TextStyle(color: AppColors.textMuted, fontSize: 11),
                  ),
                ],
              ),
      ),
    );
  }
}
