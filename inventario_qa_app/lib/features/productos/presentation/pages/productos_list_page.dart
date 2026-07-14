import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../shared/widgets/sync_status_widget.dart';
import '../productos_provider.dart';
import '../sync_status_provider.dart';

/// Ejemplo de página que usa sincronización en tiempo real
class ProductosListPage extends StatefulWidget {
  const ProductosListPage({Key? key}) : super(key: key);

  @override
  State<ProductosListPage> createState() => _ProductosListPageState();
}

class _ProductosListPageState extends State<ProductosListPage> {
  late ProductosProvider _productosProvider;

  @override
  void initState() {
    super.initState();
    _productosProvider = context.read<ProductosProvider>();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Productos'),
        elevation: 0,
        actions: [
          // ✅ Indicador de sincronización en la AppBar
          Padding(
            padding: const EdgeInsets.all(8.0),
            child: SyncStatusWidget(
              fontSize: 11,
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            ),
          ),
        ],
      ),
      body: Column(
        children: [
          // Buscador
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: TextField(
              decoration: InputDecoration(
                hintText: 'Buscar producto...',
                prefixIcon: const Icon(Icons.search),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
              ),
              onChanged: (value) {
                setState(() {});
              },
            ),
          ),
          
          // Lista de productos con sincronización
          Expanded(
            child: Consumer<ProductosProvider>(
              builder: (context, productosProvider, _) {
                if (productosProvider.isLoading) {
                  return const Center(
                    child: CircularProgressIndicator(),
                  );
                }

                if (productosProvider.productos.isEmpty) {
                  return const Center(
                    child: Text('No hay productos disponibles'),
                  );
                }

                return ListView.builder(
                  itemCount: productosProvider.productos.length,
                  itemBuilder: (context, index) {
                    final producto = productosProvider.productos[index];
                    return Card(
                      margin: const EdgeInsets.symmetric(
                        horizontal: 16,
                        vertical: 8,
                      ),
                      child: ListTile(
                        leading: Container(
                          width: 50,
                          height: 50,
                          decoration: BoxDecoration(
                            borderRadius: BorderRadius.circular(8),
                            color: Colors.grey[300],
                          ),
                          child: producto.imagenUrl != null
                              ? Image.network(
                                  producto.imagenUrl!,
                                  fit: BoxFit.cover,
                                )
                              : const Icon(Icons.shopping_bag),
                        ),
                        title: Text(producto.nombre),
                        subtitle: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              '\$${producto.precio.toStringAsFixed(2)}',
                              style: const TextStyle(
                                color: Colors.green,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            Text(
                              'Stock: ${producto.stock}',
                              style: TextStyle(
                                color: producto.stock > 0 ? Colors.blue : Colors.red,
                              ),
                            ),
                          ],
                        ),
                        trailing: const Icon(Icons.arrow_forward_ios),
                        onTap: () {
                          // Navegar a detalle del producto
                        },
                      ),
                    );
                  },
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}
