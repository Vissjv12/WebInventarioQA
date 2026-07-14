import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'core/router/app_router.dart';
import 'core/theme/app_theme.dart';
import 'core/websocket/websocket_client.dart';
import 'features/auth/presentation/auth_provider.dart';
import 'features/productos/presentation/productos_provider.dart';
import 'features/sync/presentation/sync_status_provider.dart';

class InventarioApp extends StatelessWidget {
  const InventarioApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        // ✅ Provider de autenticación
        ChangeNotifierProvider<AuthProvider>(
          create: (_) => AuthProvider()..bootstrap(),
        ),
        // ✅ Provider de estado de sincronización
        ChangeNotifierProvider<SyncStatusProvider>(
          create: (_) => SyncStatusProvider()..inicializar(),
        ),
        // ✅ Provider de productos con sincronización
        ChangeNotifierProvider<ProductosProvider>(
          create: (_) => ProductosProvider()..inicializarSincronizacion(),
        ),
      ],
      builder: (context, _) {
        final auth = context.read<AuthProvider>();
        final appRouter = AppRouter(auth);
        return AppRouterHolder(
          router: appRouter.router,
          child: MaterialApp.router(
            title: 'Inventario QA',
            debugShowCheckedModeBanner: false,
            theme: AppTheme.dark,
            routerConfig: appRouter.router,
          ),
        );
      },
    );
  }
}
