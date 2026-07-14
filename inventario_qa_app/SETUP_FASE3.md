# 🚀 FASE 3: APP MÓVIL FLUTTER CON WEBSOCKET

## 📋 Cambios Realizados

✅ Agregada dependencia `web_socket_channel` en `pubspec.yaml`
✅ Creado `lib/core/websocket/websocket_client.dart` para manejo de conexión
✅ Creado `lib/features/productos/presentation/productos_provider.dart` con sincronización
✅ Creado `lib/features/sync/presentation/sync_status_provider.dart` para monitoreo
✅ Creado `lib/shared/widgets/sync_status_widget.dart` para indicador visual
✅ Actualizado `lib/app.dart` con MultiProvider y proveedores
✅ Creado ejemplo de página con sincronización en tiempo real

## 🔧 PASO 1: Actualizar pubspec.yaml

Ya se agregó automáticamente la dependencia:

```yaml
dependencies:
  web_socket_channel: ^3.0.0
```

## 📦 PASO 2: Descargar Dependencias

En la carpeta `inventario_qa_app/`:

```bash
flutter pub get
```

O si usas VS Code/Android Studio:
- Abre el archivo `pubspec.yaml`
- Verás una opción "Get packages" o "Pub get"
- Haz click en ella

## ⚙️ PASO 3: Configurar URL del Backend

En `lib/core/constants.dart`, verifica que la URL sea correcta:

```dart
class AppConfig {
  static const String apiBaseUrl = String.fromEnvironment(
    'API_URL',
    defaultValue: 'http://10.0.2.2:3000/api',  // Para Android Emulator
  );
}
```

**Notas importantes**:
- `http://10.0.2.2:3000` = Para Android Emulator (accede a localhost del host)
- `http://localhost:3000` = Para físico en misma red (cambiar por IP)
- `http://192.168.x.x:3000` = IP real de tu máquina (para dispositivo físico)

## 🚀 PASO 4: Ejecutar la App

En la carpeta `inventario_qa_app/`:

### Opción A: Android Emulator
```bash
flutter run
```

### Opción B: Dispositivo Físico
```bash
flutter run -d <device_id>
```

### Opción C: Emulador iOS (si tienes Mac)
```bash
flutter run -d <simulador_id>
```

## 📊 Verificación

Cuando la app inicie:

1. Abre la consola de Flutter con **F12** (en la terminal)
2. Busca estos mensajes:

```
[WebSocket] Conectando a: ws://10.0.2.2:3000
[WebSocket] Conectado exitosamente
```

3. En la app, deberías ver en la AppBar:
   - **🟢 Sincronizado** si está conectado
   - **🔴 Desconectado** si no está conectado

## 🎯 PRUEBA DE SINCRONIZACIÓN

### Prueba 1: Crear Producto en Web
1. Abre Dashboard en web: `http://localhost:5173/dashboard`
2. Crea un nuevo producto
3. En la app Flutter, **SIN refrescar**, debería aparecer el producto

### Prueba 2: Actualizar Stock en Web
1. Edita un producto en Dashboard web
2. Cambia el stock
3. En la app Flutter, el stock se actualiza automáticamente

### Prueba 3: Eliminar Producto en Web
1. Elimina un producto en Dashboard web
2. En la app Flutter, el producto desaparece sin refrescar

## 📂 Estructura Nueva en Flutter

```
lib/
├── core/
│   ├── websocket/
│   │   └── websocket_client.dart              [NUEVO] ✅
│   ├── api/
│   │   └── api_client.dart                    (sin cambios)
│   └── constants.dart                         (sin cambios)
├── features/
│   ├── productos/
│   │   └── presentation/
│   │       ├── productos_provider.dart        [NUEVO] ✅
│   │       └── pages/
│   │           └── productos_list_page.dart   [EJEMPLO]
│   ├── sync/
│   │   └── presentation/
│   │       └── sync_status_provider.dart      [NUEVO] ✅
│   └── auth/
│       └── ... (sin cambios)
├── shared/
│   └── widgets/
│       └── sync_status_widget.dart            [NUEVO] ✅
└── app.dart                                   [MODIFICADO] ✅
```

## 🔌 Cómo Usar en tus Páginas

### Ejemplo 1: Mostrar Indicador de Sincronización

```dart
import 'package:provider/provider.dart';
import '../../shared/widgets/sync_status_widget.dart';

class MiPagina extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        actions: [
          Padding(
            padding: EdgeInsets.all(8),
            child: SyncStatusWidget(
              fontSize: 11,
              padding: EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            ),
          ),
        ],
      ),
    );
  }
}
```

### Ejemplo 2: Escuchar Cambios de Productos

```dart
Consumer<ProductosProvider>(
  builder: (context, productosProvider, _) {
    return ListView.builder(
      itemCount: productosProvider.productos.length,
      itemBuilder: (context, index) {
        final producto = productosProvider.productos[index];
        return ListTile(
          title: Text(producto.nombre),
          subtitle: Text('\$${producto.precio}'),
        );
      },
    );
  },
);
```

### Ejemplo 3: Acceder al Estado de Sincronización

```dart
Consumer<SyncStatusProvider>(
  builder: (context, syncProvider, _) {
    return Column(
      children: [
        if (syncProvider.isConnected)
          Text('✅ Sincronizado')
        else
          Text('❌ Desconectado'),
        if (syncProvider.lastSync != null)
          Text('Última actualización: ${syncProvider.lastSync}'),
      ],
    );
  },
);
```

## 🔄 Flujo de Sincronización en Flutter

```
┌─────────────────────────────────┐
│ app.dart                        │
│ MultiProvider                   │
├─────────────────────────────────┤
│ • AuthProvider                  │
│ • SyncStatusProvider            │
│   └─ websocketClient.connect()  │
│ • ProductosProvider             │
│   └─ escucha eventos            │
└──────────────┬──────────────────┘
               │ (WebSocket)
               ▼
        ┌─────────────────┐
        │ Backend         │
        │ Socket.IO       │
        └─────────────────┘
               │ (Emite eventos)
               ▼
   ┌──────────────────────┐
   │ Listener recibe      │
   │ PRODUCTO_CREADO/     │
   │ ACTUALIZADO/         │
   │ ELIMINADO            │
   └──────────────────────┘
               │
               ▼
   ┌──────────────────────────┐
   │ ProductosProvider        │
   │ actualiza lista          │
   │ notifyListeners()        │
   └──────────────────────────┘
               │
               ▼
   ┌──────────────────────────┐
   │ UI se reconstruye        │
   │ mostrando datos nuevos    │
   └──────────────────────────┘
```

## 🆘 Solución de Problemas

### ❌ Error: "Could not connect to WebSocket"
- Verifica que el backend está corriendo
- Verifica que la URL en `constants.dart` es correcta
- Si usas Android Emulator, usa `10.0.2.2` en lugar de `localhost`

### ❌ Error: "web_socket_channel not found"
- Ejecuta `flutter pub get`
- Limpia caché: `flutter clean`
- Vuelve a ejecutar: `flutter pub get`

### ❌ La app no muestra "Sincronizado"
- Abre la consola de Flutter
- Busca `[WebSocket]` en los logs
- Verifica que no hay errores de conexión

### ❌ Los cambios no aparecen en tiempo real
- Verifica que el backend emite eventos (revisar logs del backend)
- Verifica que la app está conectada ("Sincronizado" en verde)
- En la consola busca `[Sync]` para ver qué eventos llegan

### ❌ App se congela al conectar
- Puede ser que intente conectar a la URL equivocada
- Verifica `constants.dart`
- Intenta con localhost en emulador

## 📝 INTEGRACIÓN EN PÁGINAS EXISTENTES

Para integrar en tus páginas existentes:

1. En cualquier `Consumer<ProductosProvider>`, los productos ahora se actualizan automáticamente
2. En cualquier lugar, agrega `SyncStatusWidget()` para mostrar el estado
3. Los cambios del backend se reflejan sin necesidad de refrescar

## 🎯 Próximos Pasos

Una vez que verifies que la sincronización funciona:

1. ✅ Backend funcionando en :3000
2. ✅ Frontend React sincronizado en :5173
3. ✅ App Móvil Flutter sincronizada

### Siguiente Fase: FASE 4 - App Desktop Electron
- Crear proyecto Electron + Vite + React
- Implementar Socket.IO client
- Crear componentes reutilizables
- Empaquetar aplicación

---

**Estado: ✅ FASE 3 COMPLETADA**
**Próxima: Fase 4 - App Desktop Electron**
