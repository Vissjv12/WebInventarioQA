# 🚀 FASE 1: SETUP DEL BACKEND CON SOCKET.IO

## 📋 Cambios Realizados

✅ Agregadas dependencias Socket.IO en `package.json`
✅ Modificado `src/index.ts` para inicializar WebSocket server
✅ Creado `src/services/notification.service.ts` para manejo de eventos
✅ Actualizado `src/controllers/producto.controller.ts` con emisión de eventos
✅ Actualizado `src/controllers/categoria.controller.ts` con emisión de eventos
✅ Creado archivo `.env.example` como referencia

## 🔧 PASO 1: Instalar Dependencias

Navega a la carpeta del backend:
```bash
cd backend
```

Instala las nuevas dependencias (incluyendo Socket.IO):
```bash
pnpm install
```

O si usas npm:
```bash
npm install
```

## 📝 PASO 2: Configurar Variables de Entorno

1. Verifica si existe un archivo `.env` en la carpeta `backend/`
2. Si NO existe, crea uno basado en `.env.example`:
   ```bash
   cp .env.example .env
   ```

3. Edita el archivo `.env` con tus valores:
   ```
   DATABASE_URL="postgresql://usuario:password@localhost:5432/inventario_db"
   JWT_SECRET="tu_clave_secreta_muy_segura"
   PORT=3000
   CORS_ORIGINS="http://localhost:5173,http://localhost:3001,http://localhost:3000"
   NODE_ENV="development"
   ```

⚠️ **IMPORTANTE**: Asegúrate de que tu base de datos PostgreSQL esté corriendo y el `DATABASE_URL` sea correcto.

## 🗄️ PASO 3: Ejecutar Migraciones (si es necesario)

Si ya tienes la base de datos configurada, ejecuta las migraciones de Prisma:
```bash
pnpm prisma migrate deploy
```

O si necesitas crear la base de datos desde cero:
```bash
pnpm prisma generate
pnpm prisma db push
```

Si quieres generar datos de prueba:
```bash
pnpm seed
```

## ✅ PASO 4: Verificar la Instalación

Antes de iniciar el servidor, verifica que todo está correcto:

```bash
# Verificar tipos de TypeScript
pnpm tsc --noEmit

# Verificar que Socket.IO está disponible
pnpm list socket.io
```

## 🚀 PASO 5: Iniciar el Servidor de Desarrollo

Para iniciar el backend en modo desarrollo con hot-reload:
```bash
pnpm dev
```

Deberías ver en la consola:
```
[Express] Servidor corriendo en http://localhost:3000
[Socket.IO] WebSocket disponible en ws://localhost:3000
```

## 🧪 PASO 6: Prueba Rápida de Conectividad

Abre otra terminal y haz una petición de prueba:

```bash
# Test del servidor HTTP
curl http://localhost:3000/api/health

# Debería responder:
# {"status":"ok","message":"Servidor funcionando"}
```

## 📊 Estructura Actual del Backend

```
backend/
├── src/
│   ├── index.ts                          [MODIFICADO] ✅ Socket.IO server
│   ├── services/
│   │   ├── producto.service.ts           (sin cambios)
│   │   ├── cloudinary.service.ts         (sin cambios)
│   │   └── notification.service.ts       [NUEVO] ✅ Sistema de notificaciones
│   ├── controllers/
│   │   ├── producto.controller.ts        [MODIFICADO] ✅ Emite eventos
│   │   ├── categoria.controller.ts       [MODIFICADO] ✅ Emite eventos
│   │   ├── auth.controller.ts            (sin cambios)
│   │   └── imagen.controller.ts          (sin cambios)
│   ├── routes/
│   │   ├── producto.routes.ts            (sin cambios)
│   │   ├── categoria.routes.ts           (sin cambios)
│   │   ├── auth.routes.ts                (sin cambios)
│   │   ├── imagen.routes.ts              (sin cambios)
│   │   └── usuario.routes.ts             (sin cambios)
│   ├── middlewares/
│   │   ├── auth.middleware.ts            (sin cambios)
│   └── prisma.ts                         (sin cambios)
├── prisma/
│   └── schema.prisma                     (sin cambios)
├── package.json                          [MODIFICADO] ✅ Socket.IO agregado
├── .env.example                          [NUEVO] ✅ Template de variables
└── tsconfig.json                         (sin cambios)
```

## 🔌 Eventos WebSocket Disponibles

El backend ahora emite los siguientes eventos que todas las aplicaciones pueden escuchar:

### Eventos de Productos
```typescript
// Cuando se crea un producto
io.emit('inventario:PRODUCTO_CREADO', {
  tipo: "PRODUCTO_CREADO",
  datos: { producto: {...} },
  timestamp: Date,
  usuarioId: number
})

// Cuando se actualiza un producto
io.emit('inventario:PRODUCTO_ACTUALIZADO', {...})

// Cuando se elimina un producto
io.emit('inventario:PRODUCTO_ELIMINADO', {...})
```

### Eventos de Categorías
```typescript
// Cuando se crea una categoría
io.emit('inventario:CATEGORIA_CREADA', {...})

// Cuando se elimina una categoría
io.emit('inventario:CATEGORIA_ELIMINADA', {...})
```

## ⚙️ Próximas Fases

### Fase 2: Actualizar Frontend (React)
- Instalar `socket.io-client`
- Crear socket service
- Conectar listeners en componentes
- Actualizar estado en tiempo real

### Fase 3: Actualizar App Móvil (Flutter)
- Instalar `web_socket_channel`
- Crear conexión WebSocket
- Implementar listeners
- Refrescar UI automáticamente

### Fase 4: Crear App de Escritorio (Electron)
- Crear proyecto Electron + Vite + React
- Configurar Socket.IO client
- Implementar componentes reutilizables
- Empaquetar con Electron Builder

## ✨ Checklist de Finalización Fase 1

- [ ] Pnpm install ejecutado sin errores
- [ ] Archivo .env configurado con valores correctos
- [ ] Migraciones de Prisma ejecutadas
- [ ] `pnpm dev` inicia sin errores
- [ ] Servidor responde a http://localhost:3000/api/health
- [ ] Logs muestran "[Socket.IO] WebSocket disponible"
- [ ] Verificar que package.json tiene socket.io ^4.7.2

## 🆘 Solución de Problemas

### Error: "Cannot find module 'socket.io'"
```bash
# Vuelve a instalar
pnpm install socket.io socket.io-cors --save
```

### Error: "CORS error" al conectarse
Verifica que CORS_ORIGINS incluya el puerto de tu cliente:
```
CORS_ORIGINS="http://localhost:5173,http://localhost:3000"
```

### Error: "Database connection failed"
Asegúrate de que:
1. PostgreSQL está corriendo
2. DATABASE_URL es correcto
3. La base de datos existe

### Error: "Port 3000 already in use"
Cambia el puerto en .env:
```
PORT=3001
```

---

**Estado: ✅ FASE 1 COMPLETADA**
**Siguiente: Fase 2 - Actualizar Frontend React**
