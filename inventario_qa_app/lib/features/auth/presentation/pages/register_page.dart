import 'package:flutter/material.dart';
import 'package:flutter_form_builder/flutter_form_builder.dart';
import 'package:form_builder_validators/form_builder_validators.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../../../core/theme/app_theme.dart';
import '../auth_provider.dart';

class RegisterPage extends StatefulWidget {
  const RegisterPage({super.key});

  @override
  State<RegisterPage> createState() => _RegisterPageState();
}

class _RegisterPageState extends State<RegisterPage> {
  final _key = GlobalKey<FormBuilderState>();
  bool _cargando = false;
  String? _error;
  bool _showPassword = false;
  bool _showConfirmar = false;

  Future<void> _submit() async {
    if (!(_key.currentState?.saveAndValidate() ?? false)) return;
    final values = _key.currentState!.value;
    final pass = values['password'] as String;
    final confirmar = values['confirmar'] as String;

    if (pass != confirmar) {
      setState(() => _error = 'Las contraseñas no coinciden');
      return;
    }

    setState(() {
      _cargando = true;
      _error = null;
    });
    try {
      await context.read<AuthProvider>().register(
            nombre: (values['nombre'] as String).trim(),
            email: (values['email'] as String).trim().toLowerCase(),
            password: pass,
          );
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Cuenta creada. Inicia sesión.'),
          backgroundColor: AppColors.success,
        ),
      );
      context.go('/login');
    } catch (e) {
      setState(() => _error = e.toString().replaceFirst('Exception: ', ''));
    } finally {
      if (mounted) setState(() => _cargando = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(20),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 440),
              child: Container(
                padding: const EdgeInsets.all(28),
                decoration: BoxDecoration(
                  color: AppColors.surface,
                  borderRadius: BorderRadius.circular(12),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.4),
                      blurRadius: 24,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: FormBuilder(
                  key: _key,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      const Text(
                        'Crear Cuenta',
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          color: AppColors.textPrimary,
                          fontSize: 26,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 4),
                      const Text(
                        'Sistema de Gestión de Inventario',
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          color: AppColors.textMuted,
                          fontSize: 14,
                        ),
                      ),
                      const SizedBox(height: 32),

                      // Nombre
                      FormBuilderTextField(
                        name: 'nombre',
                        textCapitalization: TextCapitalization.words,
                        maxLength: 80,
                        decoration: const InputDecoration(
                          labelText: 'Nombre completo',
                          prefixIcon: Icon(Icons.person_outline),
                          counterText: '',
                        ),
                        validator: FormBuilderValidators.compose([
                          FormBuilderValidators.required(errorText: 'El nombre es requerido'),
                          FormBuilderValidators.minLength(3, errorText: 'Mínimo 3 caracteres'),
                          FormBuilderValidators.maxLength(80, errorText: 'Máximo 80 caracteres'),
                          (val) {
                            if (val == null || val.trim().isEmpty) return null;
                            final regex = RegExp(r"^[\p{L}\s'\-]{2,80}$", unicode: true);
                            if (!regex.hasMatch(val.trim())) {
                              return 'Solo letras, espacios, guiones y apóstrofes';
                            }
                            return null;
                          },
                        ]),
                      ),
                      const SizedBox(height: 16),

                      // Email
                      FormBuilderTextField(
                        name: 'email',
                        keyboardType: TextInputType.emailAddress,
                        autocorrect: false,
                        maxLength: 254,
                        decoration: const InputDecoration(
                          labelText: 'Email',
                          prefixIcon: Icon(Icons.email_outlined),
                          counterText: '',
                        ),
                        validator: FormBuilderValidators.compose([
                          FormBuilderValidators.required(errorText: 'El email es requerido'),
                          FormBuilderValidators.email(errorText: 'Ingresa un email válido'),
                        ]),
                      ),
                      const SizedBox(height: 16),

                      // Contraseña
                      FormBuilderTextField(
                        name: 'password',
                        obscureText: !_showPassword,
                        maxLength: 100,
                        decoration: InputDecoration(
                          labelText: 'Contraseña',
                          helperText: 'Mínimo 6 caracteres',
                          prefixIcon: const Icon(Icons.lock_outline),
                          counterText: '',
                          suffixIcon: IconButton(
                            icon: Icon(_showPassword ? Icons.visibility_off : Icons.visibility),
                            onPressed: () => setState(() => _showPassword = !_showPassword),
                          ),
                        ),
                        validator: FormBuilderValidators.compose([
                          FormBuilderValidators.required(errorText: 'La contraseña es requerida'),
                          FormBuilderValidators.minLength(6, errorText: 'Mínimo 6 caracteres'),
                          FormBuilderValidators.maxLength(100, errorText: 'Máximo 100 caracteres'),
                        ]),
                      ),
                      const SizedBox(height: 16),

                      // Confirmar contraseña
                      FormBuilderTextField(
                        name: 'confirmar',
                        obscureText: !_showConfirmar,
                        maxLength: 100,
                        decoration: InputDecoration(
                          labelText: 'Confirmar contraseña',
                          prefixIcon: const Icon(Icons.lock_outline),
                          counterText: '',
                          suffixIcon: IconButton(
                            icon: Icon(_showConfirmar ? Icons.visibility_off : Icons.visibility),
                            onPressed: () => setState(() => _showConfirmar = !_showConfirmar),
                          ),
                        ),
                        validator: FormBuilderValidators.compose([
                          FormBuilderValidators.required(errorText: 'Confirma tu contraseña'),
                        ]),
                      ),

                      if (_error != null) ...[
                        const SizedBox(height: 16),
                        Text(
                          _error!,
                          textAlign: TextAlign.center,
                          style: const TextStyle(
                            color: AppColors.danger,
                            fontSize: 13,
                          ),
                        ),
                      ],
                      const SizedBox(height: 20),
                      ElevatedButton(
                        onPressed: _cargando ? null : _submit,
                        child: _cargando
                            ? const SizedBox(
                                width: 20,
                                height: 20,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                  valueColor: AlwaysStoppedAnimation(
                                    AppColors.textPrimary,
                                  ),
                                ),
                              )
                            : const Text('Crear Cuenta'),
                      ),
                      const SizedBox(height: 16),
                      TextButton(
                        onPressed: () => context.go('/login'),
                        child: const Text('¿Ya tienes cuenta? Inicia sesión'),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
