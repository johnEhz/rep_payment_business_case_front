# Payment Business Case - Frontend Application

Aplicación web para compras en línea con flujo de pago como invitado, cotización de envíos en tiempo real, gestión de inventario y facturación electrónica. Desarrollada con React 19, TypeScript, Redux Toolkit y Tailwind CSS.

---

## Despliegue en Producción

- **URL Pública (AWS Amplify):** [https://main.d2f5kud8t26ng8.amplifyapp.com](https://main.d2f5kud8t26ng8.amplifyapp.com)
- **API Backend (CloudFront HTTPS):** `https://d2fwq2zkaxox3s.cloudfront.net/api`

---

## Características Principales

- **Catálogo de Productos:** Filtrado reactivo por categorías y marcas, búsqueda en tiempo real e indicador de stock disponible.
- **Carrito de Compras:** Gestión de cantidades con validación automática de existencias.
- **Formulario de Envío:** Integración con mapas interactivos de Mapbox para captura de coordenadas, dirección y cálculo de tarifas de flete.
- **Procesamiento de Pagos Seguro:** Tokenización de tarjetas directamente contra la pasarela de pagos (cumplimiento PCI-DSS sin almacenar datos sensibles de tarjetas).
- **Pantalla de Estado y Factura:** Confirmación visual en tiempo real del resultado bancario, generación de comprobante formal con desglose de IVA (19%) y soporte para impresión física (`window.print`).
- **Persistencia y Navegación Limpia:** Al completar una orden o vencerse, la sesión se limpia automáticamente permitiendo navegar y recargar el catálogo sin bloqueos.

---

## Tecnologías Utilizadas

- **Framework:** React 19
- **Lenguaje:** TypeScript
- **Manejo de Estado:** Redux Toolkit (@reduxjs/toolkit, react-redux)
- **Estilos:** Tailwind CSS 3
- **Formularios y Validación:** React Hook Form + Zod
- **Notificaciones UI:** Sonner (Toast notifications)
- **Mapas:** Mapbox GL
- **Hosting:** AWS Amplify Hosting

---

## Instalación y Ejecución Local

### Prerrequisitos
- Node.js >= 20
- npm >= 10

### Pasos

1. Clonar el repositorio e ingresar a la carpeta:
```bash
cd rep_payment_business_case_front
npm install --legacy-peer-deps
```

2. Configurar variables de entorno (`.env`):
```env
REACT_APP_API_URL=http://localhost:3000/api
REACT_APP_GATEWAY_SANDBOX_URL=https://api-sandbox.co.uat.wompi.dev/v1
REACT_APP_MAPBOX_TOKEN=pk.eyJ1I...
```

3. Iniciar el servidor de desarrollo:
```bash
npm start
```
La aplicación se abrirá en [http://localhost:3001](http://localhost:3001) (o `http://localhost:3000`).

---

## Compilación para Producción

```bash
# Compilar proyecto optimizado
npm run build

# Ejecutar pruebas unitarias
npm test
```

---

## Despliegue en AWS Amplify

Para empaquetar y subir una nueva versión del frontend a AWS Amplify:

```powershell
cd rep_payment_business_case_infra
powershell -ExecutionPolicy Bypass -File .\scripts\deploy-frontend.ps1
```
El script compila la aplicación con las variables de producción de CloudFront, crea un archivo ZIP compatible con POSIX y activa el despliegue en AWS Amplify.
