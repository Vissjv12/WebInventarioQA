# 🎯 INVENTARIO QA - Sistema de Sincronización en Tiempo Real

## 📊 Estado del Proyecto

| Fase | Nombre | Estado | Puerto | Tecnología |
|------|--------|--------|--------|------------|
| 1️⃣ | Backend | ✅ **COMPLETADA** | 3000 | Node.js + Express + Socket.IO |
| 2️⃣ | Frontend Web | ✅ **COMPLETADA** | 5173 | React + Vite + socket.io-client |
| 3️⃣ | App Móvil Flutter | ✅ **COMPLETADA** | Emulador | Flutter + Provider + web_socket_channel |
| 4️⃣ | App Desktop Electron | 🔄 **PRÓXIMA** | 3001 | Electron + Vite + React |

---

## 🏗️ Arquitectura General

```
┌─────────────────────────────────────────────────────────┐
│                    BACKEND                              │
│              Node.js + Express + PostgreSQL             │
│                    :3000                                │
│  ┌─────────────────────────────────────────────────┐   │
│  │ Socket.IO WebSocket Server                      │   │
│  │ • PRODUCTO_CREADO                              │   │
│  │ • PRODUCTO_ACTUALIZADO                         │   │
│  │ • PRODUCTO_ELIMINADO                           │   │
│  │ • CATEGORIA_CREADA                             │   │
│  │ • CATEGORIA_ELIMINADA                          │   │
│  └─────────────────────────────────────────────────┘   │
└──────────────┬──────────────────────────────────────────┘
               │
     ┌─────────┼─────────┐
     │         │         │
     ▼         ▼         ▼
┌────────┐ ┌────────┐ ┌────────┐
│ React  │ │Flutter │ │Electron│
│ 5173   │ │Android │ │ 3001   │
│ ✅     │ │ ✅     │ │ 🔄     │
└────────┘ └────────┘ └────────┘
```

---

## 📂 Estructura de Carpetas

```
WebInventarioQA/
├── backend/                           # Node.js + Express
│   ├── src/
│   │   ├── index.ts                   # ✅ Server + Socket.IO
│   │   ├── prisma.ts                  # Database connection
│   │   ├── controllers/
│   │   │   ├── auth.controller.ts     # Autenticación
│   │   │   ├── producto.controller.ts # ✅ Emite eventos
│   │   │   ├── categoria.controller.ts # ✅ Emite eventos
│   │   │   └── imagen.controller.ts
│   │   ├── services/
│   │   │   ├── cloudinary.service.ts
│   │   │   ├── producto.service.ts
│   │   │   └── notification.service.ts # ✅ Centraliza eventos
│   │   ├── middlewares/
│   │   └── routes/
│   ├── prisma/
│   │   ├── schema.prisma              # Modelos: Usuario, Categoria, Producto
│   │   ├── seed.ts                    # Datos iniciales
│   │   └── migrations/
│   ├── package.json                   # socket.io 4.7.2
│   └── SETUP_FASE1.md                 # Documentación
│
├── frontend/                          # React + Vite
│   ├── src/
│   │   ├── main.tsx                   # ✅ Wrapped with SocketProvider
│   │   ├── App.tsx
│   │   ├── services/
│   │   │   └── socket.service.ts      # ✅ WebSocket initialization
│   │   ├── hooks/
│   │   │   ├── useSync.ts             # ✅ Product/Category sync
│   │   │   └── useSocketStatus.ts     # ✅ Connection status
│   │   ├── components/
│   │   │   ├── Navbar.tsx
│   │   │   ├── SyncStatus.tsx          # ✅ Visual indicator
│   │   │   └── ...
│   │   ├── context/
│   │   │   ├── AuthContext.tsx
│   │   │   └── SocketProvider.tsx      # ✅ WebSocket initialization
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx           # ✅ With useSyncProductos
│   │   │   ├── Catalogo.tsx            # ✅ With useSyncProductos
│   │   │   └── ...
│   │   └── services/
│   │       └── api.ts                  # HTTP API client
│   ├── package.json                   # socket.io-client 4.7.2
│   ├── vite.config.ts
│   └── SETUP_FASE2.md                 # Documentación
│
├── inventario_qa_app/                 # Flutter
│   ├── lib/
│   │   ├── main.dart
│   │   ├── app.dart                   # ✅ MultiProvider con sincronización
│   │   ├── core/
│   │   │   ├── websocket/
│   │   │   │   └── websocket_client.dart    # ✅ WebSocket singleton
│   │   │   ├── api/
│   │   │   │   └── api_client.dart
│   │   │   ├── router/
│   │   │   ├── storage/
│   │   │   ├── theme/
│   │   │   └── constants.dart         # API URL config
│   │   ├── features/
│   │   │   ├── auth/
│   │   │   ├── productos/
│   │   │   │   └── presentation/
│   │   │   │       ├── productos_provider.dart  # ✅ Sync state
│   │   │   │       └── pages/
│   │   │   └── sync/
│   │   │       └── presentation/
│   │   │           └── sync_status_provider.dart # ✅ Connection status
│   │   └── shared/
│   │       └── widgets/
│   │           └── sync_status_widget.dart  # ✅ Visual indicator
│   ├── pubspec.yaml                   # web_socket_channel: ^3.0.0
│   └── SETUP_FASE3.md                 # Documentación
│
├── COMANDOS_FINALES_FASE1.md          # Backend
├── COMANDOS_FINALES_FASE2.md          # Frontend
├── COMANDOS_FINALES_FASE3.md          # Flutter
├── RESUMEN_CAMBIOS_FASE1.md           # Backend
├── RESUMEN_CAMBIOS_FASE2.md           # Frontend
├── RESUMEN_CAMBIOS_FASE3.md           # Flutter
└── README.md                          # Este archivo
```

---

## 🚀 INICIO RÁPIDO

### Requisitos Previos

- ✅ Node.js 18+
- ✅ pnpm (`npm install -g pnpm`)
- ✅ PostgreSQL 14+
- ✅ Flutter 3.10+
- ✅ Android Studio / Xcode

### Paso 1: Backend

```bash
cd backend
pnpm install
pnpm dev
```

Deberías ver:
```
[Express] Servidor corriendo en http://localhost:3000
[Socket.IO] WebSocket disponible en ws://localhost:3000
```

### Paso 2: Frontend Web

```bash
cd frontend
pnpm install
pnpm dev
```

Accede a: `http://localhost:5173`

### Paso 3: App Móvil Flutter

```bash
cd inventario_qa_app
flutter pub get
flutter run
```

---

## 🎯 Características de Sincronización

### Real-time Updates

✅ Cuando creas un producto en el dashboard web:
- Aparece automáticamente en la app Flutter
- Aparece en el catálogo de otros navegadores
- Sin necesidad de refrescar

✅ Cuando actualizas un producto:
- El cambio es visible en todas las aplicaciones
- Stock, precio, descripción se sincronizan

✅ Cuando eliminas un producto:
- Desaparece de todas las aplicaciones

### Visual Indicators

**React**: 
- 🟢 Sincronizado (verde)
- 🔴 Desconectado (rojo)
- ⏱️ Última actualización: HH:MM:SS

**Flutter**:
- 🟢 Sincronizado (verde, pulsante)
- 🔴 Desconectado (rojo, con botón reconectar)
- ⏱️ Última actualización: HH:MM:SS

---

## 📋 Eventos WebSocket

El backend emite los siguientes eventos en tiempo real:

```
PRODUCTO_CREADO {
  id, nombre, precio, stock, 
  categoriaNombre, imagenUrl, usuarioId
}

PRODUCTO_ACTUALIZADO {
  id, nombre, precio, stock,
  categoriaNombre, imagenUrl, usuarioId
}

PRODUCTO_ELIMINADO {
  id
}

CATEGORIA_CREADA {
  id, nombre, usuarioId
}

CATEGORIA_ELIMINADA {
  id
}
```

---

## 🔧 CONFIGURACIÓN

### Backend - `backend/src/index.ts`

```typescript
const PORT = process.env.PORT || 3000;
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';

// Socket.IO escucha en el mismo puerto
const httpServer = http.createServer(app);
const io = new Server(httpServer, { cors: { origin: CORS_ORIGIN } });
```

### Frontend - `frontend/src/services/socket.service.ts`

```typescript
const API_URL = 'http://localhost:3000/api';
const WS_URL = 'http://localhost:3000'; // Se convierte a ws://
const socket = io(WS_URL, { reconnection: true });
```

### Flutter - `lib/core/constants.dart`

```dart
static const String apiBaseUrl = String.fromEnvironment(
  'API_URL',
  defaultValue: 'http://10.0.2.2:3000/api',  // Android Emulator
);
```

---

## 📱 Diferencias por Plataforma

| Aspecto | Backend | React | Flutter |
|--------|---------|-------|---------|
| WebSocket | Socket.IO (HTTP) | socket.io-client | web_socket_channel |
| Conexión | emit() | on() + listeners | Stream |
| Estado | notificación.service | useSync hook | ProductosProvider |
| UI Sync | N/A | Consumer + useEffect | Consumer widget |
| Indicador | N/A | SyncStatus | SyncStatusWidget |

---

## 🐛 Troubleshooting

### Backend no inicia

```bash
# Verificar que PostgreSQL está corriendo
# Verificar que el puerto 3000 está disponible
netstat -ano | findstr :3000  # Windows
lsof -i :3000                 # Mac/Linux

# Limpiar e instalar
pnpm install
pnpm dev
```

### Frontend no conecta

```bash
# Verificar backend está corriendo
curl http://localhost:3000/health

# Revisar console en browser (F12)
# Buscar errores de CORS o WebSocket

# Limpiar caché
pnpm install
pnpm dev
```

### Flutter no sincroniza

```bash
# Verificar que backend está en :3000
# Revisar URL en lib/core/constants.dart

# Para Android Emulator: usa 10.0.2.2:3000
# Para dispositivo físico: usa IP local

# Logs
flutter run -v

# Buscar: [WebSocket] Conectando
```

---

## 📊 Matriz de Sincronización

```
┌──────────┬──────────┬──────────┐
│  Backend │  React   │ Flutter  │
├──────────┼──────────┼──────────┤
│   :3000  │  :5173   │ Emulator │
├──────────┼──────────┼──────────┤
│   ✅     │   ✅     │   ✅     │
│ Running  │ Running  │ Running  │
└──────────┴──────────┴──────────┘

✅ Todos sincronizados
   en tiempo real
```

---

## 📚 Documentación Completa

- [SETUP_FASE1.md](./backend/SETUP_FASE1.md) - Backend setup
- [SETUP_FASE2.md](./frontend/SETUP_FASE2.md) - Frontend setup
- [SETUP_FASE3.md](./inventario_qa_app/SETUP_FASE3.md) - Flutter setup
- [COMANDOS_FINALES_FASE1.md](./COMANDOS_FINALES_FASE1.md) - Backend commands
- [COMANDOS_FINALES_FASE2.md](./COMANDOS_FINALES_FASE2.md) - Frontend commands
- [COMANDOS_FINALES_FASE3.md](./COMANDOS_FINALES_FASE3.md) - Flutter commands
- [RESUMEN_CAMBIOS_FASE1.md](./RESUMEN_CAMBIOS_FASE1.md) - Backend changes
- [RESUMEN_CAMBIOS_FASE2.md](./RESUMEN_CAMBIOS_FASE2.md) - Frontend changes
- [RESUMEN_CAMBIOS_FASE3.md](./RESUMEN_CAMBIOS_FASE3.md) - Flutter changes

---

## ✅ CHECKLIST DE VERIFICACIÓN

```
Fase 1: Backend
[ ] Node.js/pnpm instalados
[ ] PostgreSQL corriendo
[ ] cd backend && pnpm install
[ ] pnpm dev ejecutado sin errores
[ ] http://localhost:3000/health responde
[ ] Socket.IO conecta en ws://localhost:3000

Fase 2: Frontend React
[ ] Node.js/pnpm instalados
[ ] cd frontend && pnpm install
[ ] pnpm dev ejecutado sin errores
[ ] http://localhost:5173 se abre
[ ] Backend está corriendo
[ ] 🟢 Sincronizado aparece en la esquina
[ ] Crear producto aparece sin refrescar

Fase 3: Flutter
[ ] Flutter instalado
[ ] Android Studio / Xcode configurado
[ ] cd inventario_qa_app && flutter pub get
[ ] flutter run ejecutado sin errores
[ ] Backend está corriendo
[ ] 🟢 Sincronizado aparece en la app
[ ] Producto creado en web aparece en app

Integración Completa
[ ] Las 3 aplicaciones ejecutándose
[ ] Crear producto en web → aparece en React y Flutter
[ ] Actualizar stock en web → cambios en React y Flutter
[ ] Eliminar producto en web → desaparece de React y Flutter
```

---

## 🎯 PRÓXIMOS PASOS

### ✅ Completado

- ✅ Backend con WebSocket
- ✅ Frontend React sincronizado
- ✅ App Móvil Flutter sincronizada

### 🔄 En Progreso / Próxima

- 🔄 **FASE 4**: App Desktop Electron
  - Crear estructura Electron + Vite + React
  - Implementar Socket.IO client
  - Sincronización en tiempo real
  - Empaquetar aplicación

### ⏰ Futuro

- ⏰ Autenticación por OAuth
- ⏰ Notificaciones push
- ⏰ Soporte offline
- ⏰ Sincronización offline → online

---

## 📊 Resumen de Tecnologías

| Capa | Tecnología | Versión | Propósito |
|------|-----------|---------|----------|
| Backend | Node.js + Express | 5.2.1 | Server HTTP + API |
| Backend | PostgreSQL + Prisma | 5.22.0 | Base de datos |
| Backend | Socket.IO | 4.7.2 | WebSocket real-time |
| Frontend | React | 19.2.6 | UI Web |
| Frontend | Vite | 8.0.12 | Build tool |
| Frontend | socket.io-client | 4.7.2 | WebSocket client |
| Mobile | Flutter | 3.10+ | App iOS/Android |
| Mobile | Provider | Latest | State management |
| Mobile | web_socket_channel | 3.0.0 | WebSocket client |

---

## 📞 Soporte

Si encuentras problemas:

1. Revisa los logs en cada aplicación
2. Verifica que todos los servicios están corriendo
3. Consulta el archivo de SETUP correspondiente
4. Revisar COMANDOS_FINALES para solucionar

---

## 🎉 ¡Sistema Listo!

Tienes un sistema de inventario completamente sincronizado en:

- ✅ **Web** (React)
- ✅ **Móvil** (Flutter) 
- 🔄 **Desktop** (Electron - próxima fase)

**Todos los cambios se replican en tiempo real.**

---

**Estado Global**: ✅ **FASES 1, 2, 3 COMPLETADAS**

**Próximo**: FASE 4 - Desktop Electron

