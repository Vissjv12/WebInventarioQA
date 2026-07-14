# 🚀 FASE 2: FRONTEND REACT CON SOCKET.IO

## 📋 Cambios Realizados

✅ Agregada dependencia `socket.io-client` en `package.json`
✅ Creado `src/services/socket.service.ts` para manejo de conexión
✅ Creado `src/hooks/useSync.ts` para sincronización de productos y categorías
✅ Creado `src/hooks/useSocketStatus.ts` para monitorear conexión
✅ Creado `src/components/SyncStatus.tsx` para mostrar estado
✅ Creado `src/context/SocketProvider.tsx` para inicializar socket
✅ Actualizado `src/pages/Dashboard.tsx` con sincronización
✅ Actualizado `src/pages/Catalogo.tsx` con sincronización
✅ Actualizado `src/main.tsx` para envolver app con SocketProvider
✅ Creado `.env.example` para variables de entorno

## 🔧 PASO 1: Instalar Dependencias

Navega a la carpeta del frontend:
```bash
cd frontend
```

Instala las dependencias incluyendo Socket.IO:
```bash
pnpm install
```

O si usas npm:
```bash
npm install
```

## 📝 PASO 2: Configurar Variables de Entorno

Verifica que existe el archivo `.env.local` en la carpeta `frontend/`:

```
VITE_API_URL=http://localhost:3000/api
```

⚠️ **IMPORTANTE**: Asegúrate de que apunta al backend correcto.

Si el backend está en otro puerto, actualiza este valor:
```
VITE_API_URL=http://localhost:3001/api
```

## 🚀 PASO 3: Iniciar el Frontend

Con el backend corriendo en otra terminal, inicia el frontend:

```bash
pnpm dev
```

Debería abrirse automáticamente en `http://localhost:5173`

Si no se abre, accede manualmente a: **http://localhost:5173**

## 📊 Verificación

Abre la consola del navegador (F12) y deberías ver:

```
[Socket.IO] Conectado al servidor
```

Y en Dashboard o Catálogo, deberías ver el indicador verde de "Sincronizado".

## ✨ Nuevas Características

### 1. **Indicador de Sincronización** (`SyncStatus.tsx`)
   - Muestra estado de conexión en tiempo real
   - Verde = Sincronizado
   - Rojo = Desconectado
   - Ubicado en Dashboard y Catálogo

### 2. **Sincronización Automática de Productos**
   - ✅ Si se crea un producto → Aparece en todas las pestañas
   - ✅ Si se actualiza stock → Se refleja inmediatamente
   - ✅ Si se elimina → Desaparece en tiempo real

### 3. **Sincronización de Categorías**
   - ✅ Nuevas categorías aparecen al instante
   - ✅ Categorías eliminadas se remueven
   - ✅ Disponibles en dropdown de formularios

### 4. **Reconexión Automática**
   - Intenta reconectarse automáticamente
   - Máximo 5 intentos
   - Retraso progresivo entre intentos

## 🔌 Estructura de Socket Events

### Eventos que ESCUCHA el frontend:

```typescript
// Cuando se crea un producto
inventario:PRODUCTO_CREADO
{
  tipo: "PRODUCTO_CREADO",
  datos: { producto: {...} },
  timestamp: Date,
  usuarioId: number
}

// Cuando se actualiza un producto
inventario:PRODUCTO_ACTUALIZADO
{
  tipo: "PRODUCTO_ACTUALIZADO",
  datos: { producto: {...} },
  timestamp: Date,
  usuarioId: number
}

// Cuando se elimina un producto
inventario:PRODUCTO_ELIMINADO
{
  tipo: "PRODUCTO_ELIMINADO",
  datos: { producto: {...} },
  timestamp: Date,
  usuarioId: number
}

// Cuando se crea una categoría
inventario:CATEGORIA_CREADA
{
  tipo: "CATEGORIA_CREADA",
  datos: { categoria: {...} },
  timestamp: Date,
  usuarioId: number
}

// Cuando se elimina una categoría
inventario:CATEGORIA_ELIMINADA
{
  tipo: "CATEGORIA_ELIMINADA",
  datos: { categoria: {...} },
  timestamp: Date,
  usuarioId: number
}
```

## 📂 Nuevos Archivos Creados

```
frontend/
├── src/
│   ├── services/
│   │   └── socket.service.ts          [NUEVO] ✅ Conexión Socket.IO
│   ├── hooks/
│   │   ├── useSync.ts                 [NUEVO] ✅ Sincronización
│   │   └── useSocketStatus.ts         [NUEVO] ✅ Estado de conexión
│   ├── context/
│   │   └── SocketProvider.tsx         [NUEVO] ✅ Proveedor Socket
│   ├── components/
│   │   └── SyncStatus.tsx             [NUEVO] ✅ Indicador visual
│   └── pages/
│       ├── Dashboard.tsx              [MODIFICADO] ✅ Con sincronización
│       └── Catalogo.tsx               [MODIFICADO] ✅ Con sincronización
├── .env.local (o .env.example)
└── package.json                       [MODIFICADO] ✅ socket.io-client agregado
```

## 🔄 Flujo de Sincronización en Frontend

```
┌─────────────────────────────────────────────────┐
│ main.tsx                                         │
│ ┌───────────────────────────────────────────┐  │
│ │ SocketProvider                             │  │
│ │ • Inicializa Socket.IO                    │  │
│ │ • Limpia conexión al desmontar            │  │
│ │ ┌────────────────────────────────────┐    │  │
│ │ │ App.tsx                             │    │  │
│ │ │ ┌──────────────────────────────┐    │    │  │
│ │ │ │ Dashboard.tsx / Catalogo.tsx │    │    │  │
│ │ │ │ • useSyncProductos()         │    │    │  │
│ │ │ │ • useSyncCategorias()        │    │    │  │
│ │ │ │ • Escucha eventos en tiempo  │    │    │  │
│ │ │ │   real                       │    │    │  │
│ │ │ └──────────────────────────────┘    │    │  │
│ │ └────────────────────────────────────┘    │  │
│ └───────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
            │
            │ (WebSocket)
            ▼
┌─────────────────────────────────────────────────┐
│ Backend (Express + Socket.IO)                   │
│ • Emite PRODUCTO_CREADO                         │
│ • Emite PRODUCTO_ACTUALIZADO                    │
│ • Emite PRODUCTO_ELIMINADO                      │
│ • Emite CATEGORIA_CREADA                        │
│ • Emite CATEGORIA_ELIMINADA                     │
└─────────────────────────────────────────────────┘
```

## ✅ Verificación Final (Checklist)

```
[ ] ✅ pnpm install completó sin errores
[ ] ✅ socket.io-client aparece en node_modules/
[ ] ✅ .env.local configurado con VITE_API_URL correcto
[ ] ✅ pnpm dev inicia en http://localhost:5173
[ ] ✅ Backend sigue corriendo en http://localhost:3000
[ ] ✅ Consola muestra "[Socket.IO] Conectado al servidor"
[ ] ✅ En Dashboard/Catálogo aparece indicador verde "Sincronizado"
[ ] ✅ Al crear producto en Dashboard, aparece en Catálogo sin refrescar
[ ] ✅ Stock se actualiza en tiempo real en todas las pestañas

🎉 ¡Si todos los checks están marcados, Fase 2 está lista!
```

## 🆘 Solución de Problemas

### ❌ Error: "Cannot find module 'socket.io-client'"
```bash
# Reinstala la dependencia
pnpm install socket.io-client@^4.7.2 --save
```

### ❌ Error: "WebSocket connection failed"
- Verifica que el backend esté corriendo en http://localhost:3000
- Verifica que VITE_API_URL es correcto en .env.local
- Abre DevTools → Network → verifica conexión a ws://localhost:3000

### ❌ No aparece indicador de sincronización
- Abre consola (F12)
- Busca "[Socket.IO]" en los logs
- Si ves errores, comprueba CORS en backend

### ❌ Los cambios no se reflejan en tiempo real
- Abre consola
- Comprueba que los eventos se emiten en backend
- Verifica que los listeners estén registrados en frontend

## 📝 CORS Configuration

Si tienes problemas de CORS, actualiza en backend/.env:

```
CORS_ORIGINS=http://localhost:5173,http://localhost:3000,http://localhost:3001
```

Luego reinicia el backend.

---

**Estado: ✅ FASE 2 COMPLETADA**
**Próxima: Fase 3 - App Móvil Flutter**
