# 🚀 Shopify Marketplace MVP - Guía de Setup Completa

Esta guía te llevará paso a paso para configurar y desplegar el MVP completo.

## 📋 Requisitos Previos

### Software Necesario
- **Node.js** >= 18.0.0 ([Descargar](https://nodejs.org/))
- **PostgreSQL** >= 13 ([Descargar](https://www.postgresql.org/download/))
- **Git** ([Descargar](https://git-scm.com/))
- **Expo CLI**: `npm install -g @expo/cli`

### Cuentas Requeridas
- **Shopify Partner Account** ([Crear cuenta](https://partners.shopify.com/))
- **Firebase Project** ([Firebase Console](https://console.firebase.google.com/))
- **Tienda Shopify** de prueba (opcional pero recomendado)

---

## 🏗️ Fase 1: Setup del Proyecto Base

### 1.1 Clonar e Instalar

```bash
# Clonar repositorio (o usar el código generado)
git clone <tu-repositorio>
cd shopify-marketplace-mvp

# Instalar dependencias del monorepo
npm install

# Instalar dependencias de cada package
npm run install:all
```

### 1.2 Verificar Estructura

Tu proyecto debe tener esta estructura:

```
shopify-marketplace-mvp/
├── packages/
│   ├── mobile-app/          # React Native app
│   └── backend/             # Node.js API
├── package.json             # Monorepo config
├── README.md
└── SETUP.md                 # Esta guía
```

---

## 🗄️ Fase 2: Configurar Base de Datos

### 2.1 Instalar PostgreSQL

**macOS (Homebrew):**
```bash
brew install postgresql
brew services start postgresql
```

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

**Windows:** Descargar desde [postgresql.org](https://www.postgresql.org/download/windows/)

### 2.2 Crear Base de Datos

```bash
# Conectar a PostgreSQL
psql postgres

# Crear usuario y base de datos
CREATE USER shopify_user WITH PASSWORD 'tu_password_seguro';
CREATE DATABASE shopify_marketplace OWNER shopify_user;
GRANT ALL PRIVILEGES ON DATABASE shopify_marketplace TO shopify_user;
\q
```

### 2.3 Configurar Prisma

```bash
cd packages/backend

# Copiar archivo de ejemplo
cp .env.example .env

# Editar .env con tu conexión a la base de datos
# DATABASE_URL="postgresql://shopify_user:tu_password_seguro@localhost:5432/shopify_marketplace"
```

```bash
# Generar cliente Prisma
npm run generate

# Ejecutar migraciones
npm run migrate
```

---

## 🔥 Fase 3: Configurar Firebase

### 3.1 Crear Proyecto Firebase

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Clic en "Add project"
3. Nombra tu proyecto: `shopify-marketplace-mvp`
4. Habilita Google Analytics (opcional)
5. Crear proyecto

### 3.2 Configurar Cloud Messaging

1. En tu proyecto Firebase → Project Settings
2. Cloud Messaging tab
3. Generar certificados para iOS/Android (ver docs específicas)

### 3.3 Obtener Credenciales de Servicio

1. Project Settings → Service accounts
2. Clic en "Generate new private key"
3. Descargar el archivo JSON
4. Extraer datos para `.env`:

```env
FIREBASE_PROJECT_ID="shopify-marketplace-mvp"
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n[tu-clave-privada]\n-----END PRIVATE KEY-----"
FIREBASE_CLIENT_EMAIL="firebase-adminsdk-xxxxx@shopify-marketplace-mvp.iam.gserviceaccount.com"
```

---

## 🛍️ Fase 4: Configurar Shopify

### 4.1 Crear Shopify Partner Account

1. Ve a [partners.shopify.com](https://partners.shopify.com/)
2. Crear cuenta de partner
3. Completar perfil

### 4.2 Crear App Privada

1. En Partner Dashboard → Apps
2. "Create app" → "Create app manually"
3. Nombre: "Marketplace MVP"
4. App URL: `https://tu-dominio.com` (temporal)

### 4.3 Configurar Permisos

En tu app recién creada:

1. **App setup** → **Configuration**
2. **Scopes** agregar:
   - `read_products`
   - `read_orders`
   - `write_checkouts`
   - `read_inventory`

### 4.4 Obtener Credenciales

1. Copia **Client ID** y **Client secret**
2. Agrega a tu `.env`:

```env
SHOPIFY_API_KEY="tu-client-id"
SHOPIFY_API_SECRET="tu-client-secret"
SHOPIFY_SCOPES="read_products,read_orders,write_checkouts,read_inventory"
```

### 4.5 Crear Tienda de Desarrollo (Opcional)

1. Partner Dashboard → Stores
2. "Add store" → Development store
3. Llenar datos y crear
4. Instalar tu app en esta tienda para pruebas

---

## 🔐 Fase 5: Configurar Variables de Entorno

### 5.1 Backend (`packages/backend/.env`)

```env
# Database
DATABASE_URL="postgresql://shopify_user:tu_password@localhost:5432/shopify_marketplace"

# JWT
JWT_SECRET="tu-super-clave-secreta-jwt-de-al-menos-32-caracteres-muy-segura"
JWT_EXPIRES_IN="7d"

# Shopify
SHOPIFY_API_KEY="tu-shopify-client-id"
SHOPIFY_API_SECRET="tu-shopify-client-secret"
SHOPIFY_SCOPES="read_products,read_orders,write_checkouts,read_inventory"

# Firebase
FIREBASE_PROJECT_ID="shopify-marketplace-mvp"
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\ntu-clave-privada\n-----END PRIVATE KEY-----"
FIREBASE_CLIENT_EMAIL="firebase-adminsdk-xxxxx@tu-proyecto.iam.gserviceaccount.com"

# Server
PORT=3001
NODE_ENV="development"

# CORS
CORS_ORIGIN="http://localhost:19006,exp://localhost:19000"

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### 5.2 Mobile App

Actualizar URLs en:

- `packages/mobile-app/src/services/auth.ts`
- `packages/mobile-app/src/services/shopify.ts`

```typescript
const API_BASE_URL = 'http://localhost:3001/api';
```

---

## 🚀 Fase 6: Ejecutar en Desarrollo

### 6.1 Iniciar Backend

```bash
# Terminal 1
cd packages/backend
npm run dev
```

Deberías ver:
```
🚀 Server running on port 3001
📱 Environment: development  
🔗 CORS enabled for: http://localhost:19006,exp://localhost:19000
✅ Database connected successfully
✅ Firebase Admin initialized
```

### 6.2 Iniciar Mobile App

```bash
# Terminal 2
cd packages/mobile-app
npm start
```

Opciones disponibles:
- `i` - iOS Simulator
- `a` - Android Emulator  
- `w` - Web browser

### 6.3 Verificar Funcionamiento

1. **API Health Check**: `curl http://localhost:3001/health`
2. **App móvil**: Debería cargar pantalla de login
3. **Registro**: Crear cuenta de prueba
4. **Login**: Iniciar sesión exitosamente

---

## 🔗 Fase 7: Conectar Tiendas Shopify

### 7.1 Agregar Tienda a la Base de Datos

Puedes usar el siguiente script SQL o crear un endpoint de admin:

```sql
INSERT INTO stores (
  id,
  shopify_domain, 
  name,
  description,
  categories,
  access_token,
  is_active
) VALUES (
  'uuid-generado',
  'tu-tienda.myshopify.com',
  'Mi Tienda de Prueba',
  'Tienda de desarrollo para testing',
  ARRAY['electronics', 'clothing'],
  'tu-access-token-de-tienda',
  true
);
```

### 7.2 Obtener Access Token de Tienda

1. Instala tu app en una tienda Shopify
2. Completa el OAuth flow
3. Guarda el access token en la base de datos

**Script temporal para obtener token:**

```javascript
// packages/backend/scripts/get-store-token.js
const { shopifyApi } = require('@shopify/shopify-api');

const shopify = shopifyApi({
  apiKey: process.env.SHOPIFY_API_KEY,
  apiSecretKey: process.env.SHOPIFY_API_SECRET,
  scopes: process.env.SHOPIFY_SCOPES.split(','),
  hostName: 'localhost:3001',
  // ...
});

// Implementar OAuth flow
```

---

## 🔔 Fase 8: Configurar Webhooks

### 8.1 Configurar Webhooks en Shopify

En tu app de Shopify:

1. **App setup** → **Webhooks**
2. Agregar webhooks:

```
Endpoint: https://tu-dominio.com/api/webhooks/shopify
Events:
- Product creation
- Product update
- Product deletion  
- Inventory level update
- Order creation
```

### 8.2 Para Desarrollo Local

Usar ngrok para exponer localhost:

```bash
# Instalar ngrok
npm install -g ngrok

# Exponer puerto 3001
ngrok http 3001

# Usar la URL https generada para webhooks
```

---

## 📱 Fase 9: Configurar Push Notifications

### 9.1 iOS Setup

1. **Apple Developer Account** requerida
2. Crear App ID en Apple Developer Portal
3. Habilitar Push Notifications capability
4. Generar certificado APNs
5. Subir certificado a Firebase Console

### 9.2 Android Setup

1. Descargar `google-services.json` de Firebase
2. Colocar en `packages/mobile-app/android/app/`
3. Configurar en `app.json`:

```json
{
  "expo": {
    "plugins": [
      [
        "expo-notifications",
        {
          "icon": "./assets/notification-icon.png",
          "color": "#ffffff"
        }
      ]
    ]
  }
}
```

### 9.3 Testear Notificaciones

```bash
# En la app, obtener FCM token
const token = await Notifications.getExpoPushTokenAsync();
console.log('FCM Token:', token);

# Usar Firebase Console para enviar test push
```

---

## 🧪 Fase 10: Testing Completo

### 10.1 Test de Funcionalidades Core

- [ ] Registro de usuario
- [ ] Login/logout
- [ ] Listar tiendas
- [ ] Suscribirse a tienda
- [ ] Ver productos
- [ ] Buscar productos
- [ ] Crear checkout
- [ ] Recibir notificaciones push

### 10.2 Test de Webhooks

```bash
# Simular webhook de Shopify
curl -X POST http://localhost:3001/api/webhooks/shopify \
  -H "Content-Type: application/json" \
  -H "X-Shopify-Shop-Domain: tu-tienda.myshopify.com" \
  -H "X-Shopify-Topic: products/update" \
  -H "X-Shopify-Hmac-Sha256: signature-calculada" \
  -d '{"id": 123, "title": "Producto Actualizado"}'
```

---

## 🚀 Fase 11: Deploy a Producción

### 11.1 Backend Deploy (Heroku)

```bash
# Instalar Heroku CLI
npm install -g heroku

# Login y crear app
heroku login
heroku create tu-app-backend

# Configurar variables de entorno
heroku config:set NODE_ENV=production
heroku config:set DATABASE_URL="tu-postgres-url-produccion"
heroku config:set JWT_SECRET="tu-jwt-secret-produccion"
# ... resto de variables

# Deploy
git subtree push --prefix packages/backend heroku main

# Ejecutar migraciones
heroku run npm run migrate
```

### 11.2 Mobile App Build

```bash
cd packages/mobile-app

# Actualizar API URL a producción
# src/services/*.ts: const API_BASE_URL = 'https://tu-app-backend.herokuapp.com/api';

# Instalar EAS CLI
npm install -g eas-cli
eas login

# Configurar EAS
eas build:configure

# Build para desarrollo
eas build --platform all --profile development

# Build para producción
eas build --platform all --profile production
```

---

## 📋 Checklist Final

### Backend ✅
- [ ] Base de datos PostgreSQL configurada
- [ ] Migraciones ejecutadas
- [ ] Variables de entorno configuradas  
- [ ] Firebase conectado
- [ ] Shopify API funcionando
- [ ] Webhooks configurados
- [ ] Deploy exitoso

### Mobile App ✅
- [ ] App compilando sin errores
- [ ] Navegación funcionando
- [ ] Autenticación operativa
- [ ] API calls exitosas
- [ ] Push notifications configuradas
- [ ] Build de producción exitoso

### Integración ✅
- [ ] Tienda Shopify conectada
- [ ] Productos cargando correctamente
- [ ] Checkout funcionando
- [ ] Webhooks recibiendo eventos
- [ ] Notificaciones enviándose
- [ ] Suscripciones funcionando

---

## 🐛 Solución de Problemas Comunes

### Error: "Database connection failed"
```bash
# Verificar PostgreSQL corriendo
brew services start postgresql  # macOS
sudo systemctl start postgresql # Linux

# Verificar conexión
psql "postgresql://user:pass@localhost:5432/shopify_marketplace"
```

### Error: "Shopify API authentication failed"
```bash
# Verificar credenciales en .env
echo $SHOPIFY_API_KEY
echo $SHOPIFY_API_SECRET

# Verificar scopes en Shopify Partner Dashboard
```

### Error: "Firebase messaging failed"
```bash
# Verificar formato de private key
echo $FIREBASE_PRIVATE_KEY | head -1
# Debe empezar con -----BEGIN PRIVATE KEY-----

# Verificar proyecto ID
echo $FIREBASE_PROJECT_ID
```

### Error: "Expo build failed"
```bash
# Limpiar cache
expo r -c

# Reinstalar dependencias  
rm -rf node_modules package-lock.json
npm install

# Verificar versiones
expo doctor
```

---

## 📞 Soporte

### Documentación Útil
- [Shopify API Docs](https://shopify.dev/api)
- [Firebase Docs](https://firebase.google.com/docs)
- [Expo Docs](https://docs.expo.dev/)
- [Prisma Docs](https://www.prisma.io/docs)

### Debugging
- **Backend**: Logs en `packages/backend/logs/`
- **Mobile**: React Native Debugger o Flipper
- **Database**: `npx prisma studio`
- **API**: Postman/Insomnia collections

---

🎉 **¡Felicidades!** Si llegaste hasta aquí, tienes un MVP completo funcionando.

**Next Steps:**
1. Personalizar diseño y branding
2. Agregar más tiendas Shopify
3. Configurar analytics
4. Optimizar performance  
5. Preparar para launch

**¿Necesitas ayuda?** Revisa los README específicos de cada package o crea issues en el repositorio.