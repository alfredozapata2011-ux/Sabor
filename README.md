# Sabor Divino Servicio Exprés — PWA starter

Primera versión de interfaz para la aplicación de gestión. Incluye navegación adaptable, panel principal, pantallas iniciales para inventario, artículos, compras con opciones de impuesto, pagos, ventas, menú/platos, proveedores, usuarios y exportaciones CSV de demostración. Incluye manifest y service worker para instalación/caché PWA en producción.

## Requisitos
- Node.js 20.19+ o 22.12+ recomendado
- npm

## Ejecutar en Mac
1. Descomprime `SaborDivino-PWA.zip`.
2. Abre Terminal y entra en la carpeta del proyecto:
   `cd ~/Downloads/sabor-divino-pwa` (ajusta la ruta si la descomprimiste en otro sitio)
3. Instala dependencias: `npm install`
4. Arranca: `npm run dev`
5. Abre la URL local que muestre Vite.

Para probar una compilación: `npm run build` y luego `npm run preview`.

## Estado y limitaciones
Esta es una primera base funcional de interfaz y prototipo local, no el sistema final listo para operar el negocio. Algunas listas se guardan solo en el navegador o en la sesión actual; todavía no hay Supabase Auth, base de datos en la nube, controles de acceso reales, auditoría segura, recetas completas, informes PDF ni integración Square. No introducir datos reales ni usarla para contabilidad real hasta implementar y probar esas partes. El selector de rol es solo demostrativo y no constituye seguridad.

## Próximas fases
1. Conectar Supabase y crear esquema SQL con RLS y roles.
2. Implementar login real, gestión de usuarios y permisos en backend.
3. Terminar CRUD, recetas y cálculos de inventario/beneficio.
4. Generar PDF reales y configurar auditoría inmutable de cambios.
5. Configurar Square API y sincronización programada en servidor con idempotencia, zona horaria del negocio y manejo de devoluciones.
6. Desplegar por HTTPS y probar instalación en iOS/Android.
