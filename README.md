# Shopify Marketplace MVP

Una aplicación móvil marketplace que conecta múltiples tiendas Shopify con usuarios que pueden suscribirse, ver productos y realizar compras directamente desde la app.

## Estructura del Proyecto

```
shopify-marketplace-mvp/
├── packages/
│   ├── mobile-app/          # React Native + Expo app
│   └── backend/             # Node.js + Express API
├── package.json             # Monorepo configuration
└── README.md
```

## Tecnologías

- **Mobile App**: React Native + Expo
- **Backend**: Node.js + Express + PostgreSQL
- **Database**: PostgreSQL (Supabase compatible)
- **Push Notifications**: Firebase Cloud Messaging
- **Shopify Integration**: Storefront API + Webhooks

## Setup Rápido

```bash
# Instalar dependencias
npm run install:all

# Desarrollo (backend + app en paralelo)
npm run dev

# Solo backend
npm run dev:backend

# Solo app
npm run dev:app
```

## Funcionalidades del MVP

### App Móvil
- ✅ Registro/login (email + social)
- ✅ Suscripción a tiendas Shopify
- ✅ Feed de promociones
- ✅ Catálogo de productos en tiempo real
- ✅ Carrito y checkout (redirect a Shopify)
- ✅ Notificaciones push

### Backend
- ✅ Gestión de usuarios y suscripciones
- ✅ API para notificaciones push
- ✅ Integración con Shopify Storefront API
- ✅ Webhooks de Shopify
- ✅ Métricas básicas

## Próximos Pasos

1. Configurar variables de entorno
2. Configurar base de datos PostgreSQL
3. Crear app privada en Shopify
4. Configurar Firebase para push notifications
5. Deplegar backend y configurar webhooks

Ver documentación específica en cada package para más detalles.