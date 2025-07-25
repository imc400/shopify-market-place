# Shopify Marketplace Mobile App

App móvil React Native + Expo para el marketplace multi-tienda Shopify.

## 🚀 Características

- **Autenticación** con email/password
- **Navegación por tiendas** Shopify conectadas  
- **Catálogo de productos** en tiempo real
- **Búsqueda** across múltiples tiendas
- **Carrito y checkout** (redirección a Shopify)
- **Suscripciones** a tiendas favoritas
- **Feed de promociones** personalizadas
- **Notificaciones push** de ofertas

## 📋 Requisitos Previos

- Node.js >= 18.0.0
- Expo CLI: `npm install -g @expo/cli`
- iOS Simulator (Mac) o Android Studio
- Backend API corriendo

## ⚡ Setup Rápido

### 1. Instalación

```bash
npm install
```

### 2. Configuración

Actualiza la URL del backend en:

```typescript
// src/services/auth.ts
// src/services/shopify.ts
const API_BASE_URL = 'http://localhost:3001/api'; // Cambiar por tu URL
```

### 3. Desarrollo

```bash
# Iniciar Expo dev server
npm start

# iOS
npm run ios

# Android  
npm run android

# Web
npm run web
```

## 🏗️ Arquitectura

```
src/
├── components/      # Componentes reutilizables
├── contexts/        # Context providers (Auth)
├── navigation/      # Navegación de la app
├── screens/         # Pantallas principales
├── services/        # Servicios API
├── types/           # Tipos TypeScript
└── utils/           # Utilidades
```

## 📱 Pantallas

### Autenticación
- **LoginScreen**: Inicio de sesión
- **RegisterScreen**: Registro de usuario

### Navegación Principal (Tabs)
- **FeedScreen**: Feed de promociones
- **StoresScreen**: Lista de tiendas disponibles
- **ProductsScreen**: Catálogo de productos
- **ProfileScreen**: Perfil y configuración

### Pantallas Adicionales
- **ProductDetailScreen**: Detalle de producto
- **CartScreen**: Carrito de compras

## 🔧 Servicios

### AuthService (`src/services/auth.ts`)
```typescript
// Login
const response = await authService.login(email, password);

// Registro
const response = await authService.register(email, password, name);

// Usuario actual
const user = await authService.getCurrentUser(token);
```

### ShopifyService (`src/services/shopify.ts`)
```typescript
// Listar tiendas
const stores = await shopifyService.getStores();

// Productos de tienda
const products = await shopifyService.getStoreProducts(storeId);

// Buscar productos
const results = await shopifyService.searchProducts(query);

// Crear checkout
const checkout = await shopifyService.createCheckout(storeId, lineItems);

// Suscribirse a tienda
await shopifyService.subscribeToStore(storeId, token);
```

## 🎨 Componentes Principales

### AuthContext
Maneja el estado de autenticación global:

```typescript
const { user, login, logout, loading } = useAuth();
```

### Navegación
- **AuthNavigator**: Login/Register stack
- **MainNavigator**: Navegación principal con tabs
- **Stack Navigation**: Para pantallas modales

## 🔔 Notificaciones Push

### Setup Inicial

1. **Instalar dependencias**:
```bash
expo install expo-notifications
```

2. **Configurar permisos** (`app.json`):
```json
{
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
```

3. **Solicitar permisos**:
```typescript
import * as Notifications from 'expo-notifications';

const { status } = await Notifications.requestPermissionsAsync();
const token = await Notifications.getExpoPushTokenAsync();
```

### Manejar Notificaciones

```typescript
// Notificación recibida (app abierta)
Notifications.addNotificationReceivedListener(notification => {
  console.log('Notification received:', notification);
});

// Notificación clickeada
Notifications.addNotificationResponseReceivedListener(response => {
  const data = response.notification.request.content.data;
  // Navegar según el tipo de notificación
});
```

## 📊 Flujo de Datos

### 1. Autenticación
```
Login → AuthService → JWT Token → SecureStore → AuthContext
```

### 2. Productos
```
Tiendas → ShopifyService → Backend → Shopify Storefront API → Productos
```

### 3. Checkout
```
Carrito → ShopifyService → Backend → Shopify Checkout → WebView/Browser
```

### 4. Suscripciones
```
Store Subscribe → Backend → Database → Push Topic Subscribe
```

## 🛒 Flujo de Compra

1. **Explorar productos** en ProductsScreen o por tienda
2. **Ver detalle** en ProductDetailScreen
3. **Agregar al carrito** (local state)
4. **Crear checkout** via ShopifyService
5. **Redireccionar** a Shopify checkout web
6. **Completar pago** en Shopify
7. **Orden registrada** en tienda Shopify

## 🎯 Estados de la App

```typescript
// Loading states
const [loading, setLoading] = useState(true);
const [refreshing, setRefreshing] = useState(false);

// Data states  
const [products, setProducts] = useState<Product[]>([]);
const [stores, setStores] = useState<Store[]>([]);

// Error handling
try {
  const data = await service.getData();
} catch (error) {
  Alert.alert('Error', 'No se pudo cargar los datos');
}
```

## 📱 Build y Deploy

### Development Build

```bash
# Crear development build
eas build --platform ios --profile development
eas build --platform android --profile development
```

### Production Build

```bash
# Configurar EAS
npm install -g eas-cli
eas login

# Build para stores
eas build --platform all --profile production

# Submit a stores
eas submit --platform ios
eas submit --platform android
```

### App Store Connect / Google Play

1. **iOS**: Subir a App Store Connect
2. **Android**: Subir a Google Play Console
3. Configurar metadata, screenshots, descripción
4. Enviar para review

## 🔧 Configuración Avanzada

### Variables de Entorno

```javascript
// app.config.js
export default {
  expo: {
    extra: {
      apiUrl: process.env.API_URL || 'http://localhost:3001',
      environment: process.env.NODE_ENV || 'development',
    },
  },
};
```

### Acceso en código:
```typescript
import Constants from 'expo-constants';

const API_URL = Constants.expoConfig?.extra?.apiUrl;
```

### Deep Linking

```json
{
  "expo": {
    "scheme": "shopify-marketplace",
    "slug": "shopify-marketplace"
  }
}
```

```typescript
// Manejar deep links
import * as Linking from 'expo-linking';

const url = Linking.createURL('product', { id: '123' });
// shopify-marketplace://product?id=123
```

## 🧪 Testing

### Unit Tests

```bash
# Instalar dependencias de testing
npm install --save-dev jest @testing-library/react-native

# Ejecutar tests
npm test
```

### Ejemplo de test:

```typescript
import { render, fireEvent } from '@testing-library/react-native';
import LoginScreen from '../src/screens/LoginScreen';

test('renders login form', () => {
  const { getByPlaceholderText } = render(<LoginScreen />);
  
  expect(getByPlaceholderText('Email')).toBeTruthy();
  expect(getByPlaceholderText('Contraseña')).toBeTruthy();
});
```

## 🐛 Debugging

### React Native Debugger

```bash
# Instalar
brew install --cask react-native-debugger

# Usar
# En iOS Simulator: Cmd+D → Debug
# En Android: Cmd+M → Debug
```

### Flipper (Opcional)

```bash
# Instalar Flipper
brew install --cask flipper

# Habilitar en proyecto
npx react-native init --template react-native-template-typescript
```

### Console Logs

```typescript
// Desarrollo
console.log('Debug info:', data);

// Producción (usar logger)
import { logger } from '../utils/logger';
logger.info('App started');
```

## 📈 Performance

### Optimizaciones

```typescript
// Lazy loading de pantallas
const ProductDetail = lazy(() => import('./ProductDetailScreen'));

// Memoización de componentes
const ProductCard = React.memo(({ product }) => {
  return <View>...</View>;
});

// Image optimization
<Image 
  source={{ uri: imageUrl }}
  resizeMode="cover"
  style={{ width: 100, height: 100 }}
/>
```

### Bundle Analysis

```bash
# Analizar bundle size
npx react-native bundle --platform android --dev false --entry-file index.js --bundle-output android-release.bundle --analyze
```

## 🔐 Seguridad

### Secure Storage

```typescript
import * as SecureStore from 'expo-secure-store';

// Guardar token
await SecureStore.setItemAsync('authToken', token);

// Leer token  
const token = await SecureStore.getItemAsync('authToken');
```

### API Security

```typescript
// Headers de seguridad
const api = axios.create({
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
});
```

## 🚀 Updates OTA

### Expo Updates

```bash
# Configurar
eas update:configure

# Publicar update
eas update --branch production --message "Bug fixes"
```

### CodePush (React Native CLI)

```bash
# Instalar
npm install --save react-native-code-push

# Deploy update
code-push release-react ShopifyMarketplace-iOS ios --deploymentName Production
```

## 📊 Analytics

### Expo Analytics

```typescript
import * as Analytics from 'expo-analytics';

// Track events
Analytics.track('product_viewed', {
  productId: product.id,
  storeId: product.storeId,
});

// Track screens
Analytics.screen('ProductDetail');
```

### Firebase Analytics

```bash
# Instalar
expo install @react-native-firebase/analytics

# Track
import analytics from '@react-native-firebase/analytics';

await analytics().logSelectContent({
  content_type: 'product',
  item_id: product.id,
});
```

## 🎨 Personalización

### Tema/Colores

```typescript
// src/theme/colors.ts
export const colors = {
  primary: '#6366f1',
  secondary: '#059669',
  background: '#f8fafc',
  surface: '#ffffff',
  text: '#1f2937',
  // ...
};
```

### Componentes Reutilizables

```typescript
// src/components/Button.tsx
export const Button = ({ title, onPress, style, ...props }) => (
  <TouchableOpacity 
    style={[styles.button, style]} 
    onPress={onPress}
    {...props}
  >
    <Text style={styles.text}>{title}</Text>
  </TouchableOpacity>
);
```

## 📱 Platform Specific

### iOS Específico

```typescript
import { Platform } from 'react-native';

if (Platform.OS === 'ios') {
  // Código específico iOS
}
```

### Android Específico

```typescript
if (Platform.OS === 'android') {
  // Configuración específica Android
}
```

## 🔄 Estado Global

### Context Pattern

```typescript
// Crear contexto
const CartContext = createContext();

// Provider
export const CartProvider = ({ children }) => {
  const [items, setItems] = useState([]);
  
  return (
    <CartContext.Provider value={{ items, setItems }}>
      {children}
    </CartContext.Provider>
  );
};

// Hook
export const useCart = () => useContext(CartContext);
```

## 📋 Checklist Pre-Launch

- [ ] Testear en dispositivos reales iOS/Android
- [ ] Configurar push notifications
- [ ] Configurar deep linking  
- [ ] Optimizar imágenes y assets
- [ ] Configurar analytics
- [ ] Testing exhaustivo de flujos principales
- [ ] Configurar crash reporting
- [ ] Setup de CI/CD
- [ ] Documentar proceso de release
- [ ] Preparar assets para stores (iconos, screenshots)