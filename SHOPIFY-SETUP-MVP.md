# 🛍️ Setup Shopify Apps Privadas para MVP

Guía rápida para conectar tus tiendas Shopify existentes al marketplace usando apps privadas.

## 🎯 Ventajas del Approach MVP

- ⚡ **Inmediato**: Sin proceso de aprobación
- 🎮 **Control total**: Tus tiendas, tus reglas
- 🧪 **Perfect para testing**: Validar concepto rápidamente
- 🔄 **Escalable**: Migrar a app pública después

## 📋 Pasos por Tienda

### 1. Crear App Privada en Shopify

Para cada tienda que quieras conectar:

1. **Ir a Admin de la tienda**
   - https://tu-tienda.myshopify.com/admin

2. **Settings → Apps and sales channels**
   - Clic en "Develop apps"
   - "Create an app"

3. **Configurar App**
   - Nombre: "Marketplace Connector"
   - App developer: Tu nombre/empresa

4. **Configurar API access**
   - Configuration tab
   - Admin API access → Configure
   - Scopes requeridos:
     - `read_products`
     - `read_orders`
     - `write_checkouts`
     - `read_inventory`

5. **Install App**
   - Clic en "Install app"
   - Confirmar permisos

6. **Obtener Credenciales**
   - API credentials tab
   - Copiar:
     - **Admin API access token** (shpat_xxx...)
     - API key
     - API secret key

### 2. Configurar Webhooks (Opcional para MVP)

Si quieres notificaciones en tiempo real:

1. **En tu app** → App setup → Webhooks
2. **Endpoint URL**: `https://tu-backend.herokuapp.com/api/webhooks/shopify`
3. **Webhook version**: Latest
4. **Events to subscribe**:
   - Product creation
   - Product updates
   - Product deletion
   - Inventory level updates
   - Order creation

## 🚀 Agregar Tienda al Backend

### Opción 1: Script de Línea de Comandos

```bash
cd packages/backend

# Formato: domain name access_token [description] [categories]  
npm run add-store tu-tienda.myshopify.com "Mi Tienda Fashion" shpat_abc123 "Ropa y accesorios trendy" "clothing,accessories,fashion"
```

### Opción 2: API Endpoint (Postman/curl)

```bash
POST http://localhost:3001/api/admin/stores
Authorization: Bearer tu-jwt-token
Content-Type: application/json

{
  "shopifyDomain": "tu-tienda.myshopify.com",
  "name": "Mi Tienda Fashion", 
  "description": "Ropa y accesorios trendy",
  "accessToken": "shpat_abc123...",
  "categories": ["clothing", "accessories", "fashion"],
  "logo": "https://tu-tienda.com/logo.png"
}
```

### Opción 3: Directo en Base de Datos

```sql
INSERT INTO stores (
  id,
  shopify_domain,
  name,
  description, 
  access_token,
  categories,
  is_active,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'tu-tienda.myshopify.com',
  'Mi Tienda Fashion',
  'Ropa y accesorios trendy',
  'shpat_abc123...',
  ARRAY['clothing', 'accessories', 'fashion'],
  true,
  NOW(),
  NOW()
);
```

## ✅ Verificar Conexión

### Test desde Backend

```bash
# Probar conexión a tienda específica
curl http://localhost:3001/api/admin/stores/{store-id}/test
```

### Test desde App Móvil

1. Abrir app móvil
2. Ir a "Tiendas" tab
3. Verificar que aparezca tu tienda
4. Intentar suscribirse
5. Ir a "Productos" y verificar que carguen productos

## 📊 Ejemplo Completo

### Mi Setup de Prueba

```bash
# Tienda 1: Fashion
npm run add-store \
  fashionstore.myshopify.com \
  "Fashion Boutique" \
  shpat_fashion123 \
  "Ropa femenina y accesorios de moda" \
  "clothing,women,accessories,fashion"

# Tienda 2: Tech
npm run add-store \
  techgear.myshopify.com \
  "Tech Gear Store" \
  shpat_techgear456 \
  "Gadgets y electrónicos de última generación" \
  "electronics,gadgets,tech,mobile"
```

## 🔧 Troubleshooting

### Error: "Invalid Shopify credentials"

```bash
# Verificar domain (sin https://)
✅ Correcto: mi-tienda.myshopify.com
❌ Incorrecto: https://mi-tienda.myshopify.com

# Verificar access token
✅ Debe empezar con: shpat_
❌ No usar: API key o secret (son diferentes)
```

### Error: "Store connection failed"

1. **Verificar permisos** de la app privada
2. **Reinstalar app** en Shopify si es necesario
3. **Generar nuevo access token**

### Error: "No products found"

```bash
# Normal si la tienda está vacía
# Agregar algunos productos de prueba en Shopify Admin
```

## 📱 Testing del Flujo Completo

### 1. Setup Básico ✅
- [ ] Backend corriendo
- [ ] Base de datos con migraciones
- [ ] Al menos 1 tienda agregada
- [ ] App móvil compilando

### 2. Test de Tiendas ✅
- [ ] Listar tiendas en app
- [ ] Suscribirse a tienda
- [ ] Ver productos de tienda

### 3. Test de Productos ✅  
- [ ] Productos cargan en "Productos" tab
- [ ] Búsqueda funciona
- [ ] Detalle de producto abre
- [ ] Agregar al carrito

### 4. Test de Checkout ✅
- [ ] Crear checkout desde carrito
- [ ] Redirección a Shopify funciona
- [ ] Completar compra de prueba

### 5. Test de Promociones ✅
- [ ] Crear promoción desde admin
- [ ] Aparece en feed de usuario suscrito
- [ ] (Opcional) Notificación push

## 🎯 MVP Success Criteria

Cuando tengas esto funcionando, habrás validado:

- ✅ **Autenticación** de usuarios
- ✅ **Conexión multi-tienda** Shopify  
- ✅ **Catálogo en tiempo real**
- ✅ **Suscripciones** a tiendas
- ✅ **Checkout flow** completo
- ✅ **Feed personalizado**

## 🚀 Siguientes Pasos Post-MVP

Una vez validado el concepto:

1. **Crear Shopify App Pública**
   - Partner Dashboard → Create public app
   - OAuth flow automático
   - Process de aprobación

2. **Onboarding Automatizado**
   - Landing page para tiendas
   - Self-service app installation
   - Dashboard para store owners

3. **Monetización**
   - Subscription fees para tiendas
   - Comisión por venta
   - Features premium

## 💡 Pro Tips

- **Usa tiendas de desarrollo** si no tienes tiendas reales
- **Importa productos variados** para testing
- **Configura webhooks** si quieres notificaciones real-time
- **Haz backup** de access tokens de manera segura
- **Documenta cada tienda** que conectes

¿Listo para conectar tu primera tienda? 🚀