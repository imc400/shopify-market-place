# Shopify Marketplace Backend

Backend API para el MVP de marketplace multi-tienda Shopify.

## 🚀 Características

- **Autenticación JWT** con registro y login
- **Integración Shopify Storefront API** para productos y checkout
- **Notificaciones Push** con Firebase Cloud Messaging
- **Webhooks de Shopify** para sincronización en tiempo real
- **Gestión de suscripciones** a tiendas
- **Base de datos PostgreSQL** con Prisma ORM

## 📋 Requisitos Previos

- Node.js >= 18.0.0
- PostgreSQL >= 13
- Cuenta de Firebase con FCM habilitado
- App privada de Shopify configurada

## ⚡ Setup Rápido

### 1. Instalación

```bash
npm install
```

### 2. Variables de Entorno

Copia el archivo `.env.example` a `.env` y configura:

```bash
cp .env.example .env
```

**Variables requeridas:**

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/shopify_marketplace"

# JWT
JWT_SECRET="tu-clave-secreta-jwt-muy-segura-32-caracteres-minimo"
JWT_EXPIRES_IN="7d"

# Shopify
SHOPIFY_API_KEY="tu-shopify-app-api-key"
SHOPIFY_API_SECRET="tu-shopify-app-secret"
SHOPIFY_SCOPES="read_products,read_orders,write_checkouts"

# Firebase
FIREBASE_PROJECT_ID="tu-proyecto-firebase"
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\ntu-clave-privada\n-----END PRIVATE KEY-----"
FIREBASE_CLIENT_EMAIL="firebase-adminsdk-xxxxx@tu-proyecto.iam.gserviceaccount.com"
```

### 3. Base de Datos

```bash
# Generar cliente Prisma
npm run generate

# Ejecutar migraciones
npm run migrate

# (Opcional) Sembrar datos de prueba
npm run seed
```

### 4. Desarrollo

```bash
npm run dev
```

El servidor estará disponible en `http://localhost:3001`

## 🏗️ Arquitectura

```
src/
├── config/          # Configuración (DB, Firebase, env)
├── controllers/     # Controladores de rutas
├── middleware/      # Middleware (auth, errors)
├── routes/          # Definición de rutas
├── services/        # Lógica de negocio
├── types/           # Tipos TypeScript
└── utils/           # Utilidades
```

## 📚 API Endpoints

### Autenticación
- `POST /api/auth/register` - Registro de usuario
- `POST /api/auth/login` - Inicio de sesión
- `GET /api/auth/me` - Obtener usuario actual
- `POST /api/auth/refresh` - Renovar token
- `PUT /api/auth/fcm-token` - Actualizar token FCM

### Tiendas
- `GET /api/stores` - Listar tiendas
- `GET /api/stores/:id` - Obtener tienda específica
- `GET /api/stores/:id/products` - Productos de tienda
- `POST /api/stores/:id/subscribe` - Suscribirse a tienda
- `DELETE /api/stores/:id/subscribe` - Desuscribirse
- `POST /api/stores/:id/checkout` - Crear checkout

### Productos
- `POST /api/products/search` - Buscar productos
- `GET /api/products/featured` - Productos destacados

### Notificaciones/Promociones
- `POST /api/promotions/send` - Enviar notificación
- `POST /api/promotions` - Crear promoción
- `GET /api/promotions` - Obtener promociones del usuario
- `GET /api/promotions/history` - Historial de notificaciones

### Webhooks
- `POST /api/webhooks/shopify` - Webhook de Shopify
- `GET /api/webhooks/logs/:storeId` - Logs de webhooks
- `POST /api/webhooks/retry/:webhookId` - Reintentar webhook

## 🔧 Configuración de Shopify

### 1. Crear App Privada

1. Ve a tu tienda Shopify → Settings → Apps and sales channels
2. Desarrollar apps → Crear una app
3. Configura los permisos necesarios:
   - `read_products`
   - `read_orders` 
   - `write_checkouts`

### 2. Configurar Webhooks

En tu app de Shopify, configura estos webhooks apuntando a tu servidor:

```
Endpoint: https://tu-dominio.com/api/webhooks/shopify
Events:
- Product creation
- Product update  
- Product deletion
- Inventory level update
- Order creation
```

### 3. Obtener Credenciales

- **API Key**: Desde la configuración de tu app
- **API Secret**: Desde la configuración de tu app
- **Access Token**: Se genera automáticamente por tienda

## 🔥 Configuración de Firebase

### 1. Crear Proyecto

1. Ve a [Firebase Console](https://console.firebase.google.com)
2. Crear nuevo proyecto
3. Habilitar Cloud Messaging

### 2. Obtener Credenciales

1. Project Settings → Service accounts
2. Generate new private key
3. Descargar el archivo JSON
4. Extraer `project_id`, `private_key`, `client_email`

### 3. Configurar FCM

En tu app móvil:

```javascript
import messaging from '@react-native-firebase/messaging';

// Solicitar permisos
const authStatus = await messaging().requestPermission();

// Obtener token
const fcmToken = await messaging().getToken();

// Enviar token al backend
await api.put('/auth/fcm-token', { fcmToken });
```

## 🗄️ Base de Datos

### Schema Principal

- **users**: Usuarios de la app
- **stores**: Tiendas Shopify conectadas
- **subscriptions**: Suscripciones usuario-tienda
- **promotions**: Promociones creadas por tiendas
- **push_notifications**: Historial de notificaciones
- **webhook_logs**: Logs de webhooks recibidos

### Comandos Útiles

```bash
# Ver estado de la base de datos
npx prisma studio

# Reset de base de datos
npx prisma migrate reset

# Generar migración
npx prisma migrate dev --name nombre_migracion
```

## 🚀 Despliegue

### Variables de Entorno Producción

```env
NODE_ENV=production
DATABASE_URL="tu-conexion-postgres-produccion"
CORS_ORIGIN="https://tu-app-movil.com"
# ... resto de variables
```

### Docker (Opcional)

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3001
CMD ["npm", "start"]
```

### Heroku Deployment

```bash
# Instalar Heroku CLI
npm install -g heroku

# Login y crear app
heroku login
heroku create tu-app-name

# Configurar variables de entorno
heroku config:set NODE_ENV=production
heroku config:set DATABASE_URL="tu-postgres-url"
# ... resto de variables

# Deploy
git push heroku main

# Ejecutar migraciones
heroku run npm run migrate
```

## 🧪 Testing

```bash
# Ejecutar tests
npm test

# Tests con coverage
npm run test:coverage

# Tests en modo watch
npm run test:watch
```

## 📊 Monitoreo

### Logs

Los logs se guardan en:
- `logs/error.log` - Solo errores
- `logs/combined.log` - Todos los logs

### Métricas Disponibles

- Webhooks procesados/fallidos
- Notificaciones enviadas
- Checkouts creados
- Suscripciones activas

### Health Check

```bash
curl http://localhost:3001/health
```

## 🔐 Seguridad

- Tokens JWT con expiración
- Rate limiting habilitado
- Validación de webhooks Shopify
- Headers de seguridad con Helmet
- Validación de entrada con Zod

## 🐛 Solución de Problemas

### Error: "Database connection failed"
- Verificar que PostgreSQL esté corriendo
- Validar DATABASE_URL
- Verificar permisos de usuario

### Error: "Shopify API authentication failed"  
- Verificar SHOPIFY_API_KEY y SHOPIFY_API_SECRET
- Confirmar que la app tenga los permisos necesarios
- Validar que el dominio de la tienda sea correcto

### Error: "Firebase messaging failed"
- Verificar credenciales de Firebase
- Confirmar que FCM esté habilitado
- Validar formato de FIREBASE_PRIVATE_KEY

## 📈 Roadmap

- [ ] Checkout nativo (sin redirección web)
- [ ] Soporte para Shopify Plus
- [ ] Analytics avanzados
- [ ] Panel de administración web
- [ ] API de métricas para tiendas
- [ ] Soporte multi-idioma
- [ ] Caché con Redis
- [ ] WebSockets para updates en tiempo real