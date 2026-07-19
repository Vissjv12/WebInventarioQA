# GUIA DE EJECUTABLE Y PRUEBA MANUAL

## Resumen de cambios aplicados

Se dejó la app desktop con una interfaz más parecida a la versión web:

- Login con estilo más limpio y consistente.
- Catálogo con layout tipo panel y mejor distribución visual.
- Dashboard con secciones claras para crear productos y categorías.
- Uso de tarjetas y botones con estilo más cercano a la interfaz web.
- Mejor presentación general del contenido y del estado de conexión.

## Archivos principales ajustados

- [src/pages/LoginPage.tsx](src/pages/LoginPage.tsx)
- [src/pages/CatalogPage.tsx](src/pages/CatalogPage.tsx)
- [src/pages/DashboardPage.tsx](src/pages/DashboardPage.tsx)
- [src/styles.css](src/styles.css)

## Ejecutable generado

El instalador quedó generado en:

- [dist/inventario-qa-desktop Setup 1.0.0.exe](dist/inventario-qa-desktop%20Setup%201.0.0.exe)

## Qué hacer para obtener el ejecutable

1. Asegúrate de tener Node.js instalado.
2. Desde la carpeta de la app desktop ejecuta:

```bash
cd inventario_qa_desktop
npm install
npm run build
npm run dist
```

3. El instalador se generará en la carpeta [dist](dist).

## Qué hacer para conectar todo

### 1) Iniciar el backend

```bash
cd backend
npm install
npm run dev
```

El backend debe quedar disponible en:

- http://localhost:3000
- API: http://localhost:3000/api

### 2) Iniciar la app desktop

Opción A: ejecutar desde código:

```bash
cd inventario_qa_desktop
npm run dev
```

Opción B: abrir el ejecutable generado en [dist](dist).

### 3) (Opcional) Iniciar la web

```bash
cd frontend
npm install
npm run dev
```

La web quedará en:

- http://localhost:5173

## Prueba manual recomendada

1. Abre la app desktop o el instalador.
2. Inicia sesión con:
   - Email: admin@inventario.com
   - Contraseña: 123456
3. En el dashboard crea un producto nuevo.
4. Verifica que el producto aparezca en la lista del dashboard.
5. Crea una categoría nueva.
6. Verifica que la categoría aparezca en la lista.
7. Si además tienes abierta la web, confirma que los cambios se reflejan también ahí.
8. Cierra sesión y vuelve a entrar para comprobar que el flujo completo funciona.

## Resultado esperado

- El login funciona.
- El dashboard permite crear productos y categorías.
- La interfaz se ve más parecida a la web.
- La app se conecta al backend correctamente.
- La sincronización en tiempo real funciona cuando el backend y la web están activos.
