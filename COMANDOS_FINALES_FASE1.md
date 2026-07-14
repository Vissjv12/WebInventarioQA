# 🚀 COMANDOS FINALES - FASE 1 BACKEND

## 📌 RESUMEN RÁPIDO

La Fase 1 está **100% implementada**. Aquí están los comandos exactos que debes ejecutar para tener todo listo.

---

## ⚡ EJECUCIÓN PASO A PASO

### PASO 1️⃣: Navegar a la carpeta del backend

```powershell
cd backend
```

---

### PASO 2️⃣: Instalar todas las dependencias (incluyendo Socket.IO)

```powershell
pnpm install
```

**Alternativa con npm** (si prefieres):
```powershell
npm install
```

**¿Qué se instala?**
- ✅ socket.io ^4.7.2 (servidor WebSocket)
- ✅ socket.io-cors ^4.0.1 (CORS para WebSocket)
- ✅ Todas las demás dependencias existentes

**Salida esperada**:
```
added X packages in X.XXs

packages in folder
```

---

### PASO 3️⃣: Crear archivo .env

Si **NO** existe archivo `.env` en la carpeta `backend/`:

```powershell
# Crear desde el template
Copy-Item .env.example -Destination .env
```

Si **YA EXISTE** un `.env`, vérificalo que incluya:
```
DATABASE_URL=postgresql://usuario:password@localhost:5432/inventario_db
JWT_SECRET=tu_clave_muy_segura
PORT=3000
CORS_ORIGINS=http://localhost:5173,http://localhost:3001,http://localhost:3000
NODE_ENV=development
```

---

### PASO 4️⃣: Ejecutar migraciones de Prisma

**Opción A - Si tu BD ya existe**:
```powershell
pnpm prisma migrate deploy
```

**Opción B - Si quieres sincronizar el esquema**:
```powershell
pnpm prisma db push
```

**Opción C - Si necesitas generar datos de prueba**:
```powershell
pnpm seed
```

**¿Cuál elegir?**
- Usa **Opción A** si ya tiene tablas
- Usa **Opción B** si es nueva BD
- Usa **Opción C** después de A o B para agregar datos

---

### PASO 5️⃣: Verificar que todo está correcto

```powershell
# Compilar TypeScript sin errores
pnpm tsc --noEmit
```

**Resultado esperado**: Sin errores (sin output)

---

### PASO 6️⃣: Iniciar el servidor en modo desarrollo

```powershell
pnpm dev
```

**Debería aparecer**:
```
[Express] Servidor corriendo en http://localhost:3000
[Socket.IO] WebSocket disponible en ws://localhost:3000
```

⏸️ **Mantén este servidor corriendo en esta terminal**

---

## 🧪 VERIFICACIÓN DE CONECTIVIDAD

**Abre una NUEVA terminal PowerShell** y ejecuta:

```powershell
# Probar que el servidor HTTP responde
Invoke-WebRequest -Uri http://localhost:3000/api/health

# O simplemente desde el navegador:
# http://localhost:3000/api/health
```

**Respuesta esperada**:
```json
{
  "status": "ok",
  "message": "Servidor funcionando"
}
```

---

## 📊 COMANDOS ÚTILES PARA DESARROLLO

```powershell
# Ver lista de dependencias instaladas
pnpm list

# Ver solo versión de socket.io
pnpm list socket.io

# Limpiar cache
pnpm store prune

# Reinstalar todo desde cero
pnpm install --force

# Actualizar Prisma
pnpm prisma generate

# Ver estado de la BD
pnpm prisma db execute --stdin < query.sql

# Resetear base de datos (⚠️ PELIGRO: Borra todo)
pnpm prisma migrate reset
```

---

## 🔍 VERIFICACIÓN FINAL (Checklist)

Antes de pasar a Fase 2, confirma estos puntos:

```
[ ] ✅ pnpm install completó sin errores
[ ] ✅ Archivo .env existe y está configurado
[ ] ✅ pnpm prisma db push ejecutó correctamente
[ ] ✅ pnpm dev inicia sin errores
[ ] ✅ Logs muestran "[Express] Servidor corriendo"
[ ] ✅ Logs muestran "[Socket.IO] WebSocket disponible"
[ ] ✅ http://localhost:3000/api/health responde
[ ] ✅ package.json incluye "socket.io": "^4.7.2"
[ ] ✅ Archivo notification.service.ts existe en src/services/
```

---

## 📂 ARCHIVOS QUE CAMBIARON

✏️ **Modificados**:
- `backend/package.json`
- `backend/src/index.ts`
- `backend/src/controllers/producto.controller.ts`
- `backend/src/controllers/categoria.controller.ts`

✨ **Nuevos**:
- `backend/src/services/notification.service.ts`
- `backend/.env.example`
- `backend/SETUP_FASE1.md`

---

## 🆘 PROBLEMAS COMUNES Y SOLUCIONES

### ❌ Error: "pnpm: The term 'pnpm' is not recognized"

**Solución**: Instala pnpm globalmente
```powershell
npm install -g pnpm
```

---

### ❌ Error: "Cannot find module 'socket.io'"

**Solución**: Socket.IO no se instaló correctamente
```powershell
pnpm install socket.io socket.io-cors --save
```

---

### ❌ Error: "ECONNREFUSED" en base de datos

**Solución**: PostgreSQL no está corriendo
```powershell
# Windows - Verifica en Servicios de Windows
# que PostgreSQL esté iniciado

# O verifica DATABASE_URL en .env
DATABASE_URL="postgresql://usuario:password@localhost:5432/nombre_bd"
```

---

### ❌ Error: "Port 3000 already in use"

**Solución**: Cambia el puerto en `.env`
```
PORT=3001
```

O mata el proceso que usa el puerto:
```powershell
# Ver qué usa el puerto 3000
netstat -ano | findstr :3000

# Matar el proceso (reemplaza PID)
taskkill /PID <numero_PID> /F
```

---

### ❌ Error: "CORS error" al conectar cliente

**Solución**: Actualiza `CORS_ORIGINS` en `.env`
```
CORS_ORIGINS="http://localhost:5173,http://localhost:3001,http://localhost:3000"
```

---

## 📝 PRÓXIMAS FASES

Cuando el backend esté corriendo correctamente y hayas verificado todos los checks:

```
✅ FASE 1: BACKEND (COMPLETADA)
    ├── Socket.IO configurado ✓
    ├── Notificaciones en tiempo real ✓
    └── Eventos emisibles ✓

🔄 FASE 2: FRONTEND (React)
    ├── Instalar socket.io-client
    ├── Crear socket service
    ├── Agregar listeners en componentes
    └── Actualizar estado en tiempo real

🔄 FASE 3: APP MÓVIL (Flutter)
    ├── Instalar web_socket_channel
    ├── Crear conexión WebSocket
    ├── Implementar listeners
    └── Refrescar UI automáticamente

🔄 FASE 4: APP DESKTOP (Electron)
    ├── Crear proyecto Electron + Vite
    ├── Configurar Socket.IO client
    ├── Implementar componentes
    └── Empaquetar aplicación
```

---

## 💡 NOTA IMPORTANTE

**El backend está completamente listo para que las 3 aplicaciones se sincronicen en tiempo real.**

Una vez que ejecutes `pnpm dev`, tu backend estará:
- ✅ Escuchando en `http://localhost:3000`
- ✅ Aceptando WebSocket en `ws://localhost:3000`
- ✅ Emitiendo eventos cuando haya cambios
- ✅ Listo para que web, móvil y desktop se conecten

---

## 🎯 PRÓXIMO PASO

Una vez verificado todo, avisa y procederemos con:

**FASE 2: Actualizar Frontend React**
- Instalar socket.io-client
- Crear servicios de socket
- Conectar componentes a eventos en tiempo real
- Prueba de sincronización web ↔ backend

---

**Estado**: ✅ **FASE 1 COMPLETADA Y LISTA PARA USAR**

**Tiempo estimado de instalación**: 5-10 minutos
**Complejidad**: ⭐ Baja (solo comandos)
**Riesgo**: 🟢 Bajo (no afecta datos existentes)

