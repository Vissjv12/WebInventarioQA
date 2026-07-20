import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../core/theme/app_theme.dart';
import '../../features/auth/presentation/auth_provider.dart';

/// CustomAppBar real de Flutter Material 3.
/// Reemplaza al AppNavbar manual para que el sistema de insets/IME funcione correctamente.
class AppNavbar extends StatelessWidget implements PreferredSizeWidget {
  const AppNavbar({super.key, this.showBack = false});

  /// Si es true muestra botón de regresar en lugar del título completo.
  final bool showBack;

  @override
  Size get preferredSize => const Size.fromHeight(kToolbarHeight);

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final user = auth.usuario;

    return AppBar(
      backgroundColor: AppColors.surface,
      foregroundColor: AppColors.textPrimary,
      elevation: 0,
      scrolledUnderElevation: 0,
      centerTitle: false,
      title: Row(
        children: [
          const Text(
            '📦',
            style: TextStyle(fontSize: 20),
          ),
          const SizedBox(width: 8),
          const Text(
            'Inventario QA',
            style: TextStyle(
              color: AppColors.textPrimary,
              fontSize: 17,
              fontWeight: FontWeight.bold,
            ),
          ),
        ],
      ),
      bottom: PreferredSize(
        preferredSize: const Size.fromHeight(1),
        child: Container(color: AppColors.border, height: 1),
      ),
      actions: [
        if (user != null) ...[
          // Badge de rol
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
            margin: const EdgeInsets.only(right: 4),
            decoration: BoxDecoration(
              color: AppColors.tagBackground,
              borderRadius: BorderRadius.circular(999),
            ),
            child: Text(
              user.isAdmin ? 'ADMIN' : 'CLIENTE',
              style: const TextStyle(
                color: AppColors.primary,
                fontSize: 11,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
          // Botón cerrar sesión
          TextButton(
            onPressed: () async {
              await auth.logout();
              if (context.mounted) {
                context.go('/login');
              }
            },
            style: TextButton.styleFrom(
              foregroundColor: AppColors.textSecondary,
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
            ),
            child: const Text('Salir', style: TextStyle(fontSize: 13)),
          ),
          const SizedBox(width: 4),
        ],
      ],
    );
  }
}
