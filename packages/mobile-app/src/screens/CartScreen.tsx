import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CartItem } from '../types';
import { shopifyService } from '../services/shopify';

export default function CartScreen() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);

  const updateQuantity = (variantId: string, newQuantity: number) => {
    if (newQuantity === 0) {
      removeItem(variantId);
      return;
    }

    setCartItems(prevItems =>
      prevItems.map(item =>
        item.variantId === variantId
          ? { ...item, quantity: newQuantity }
          : item
      )
    );
  };

  const removeItem = (variantId: string) => {
    setCartItems(prevItems =>
      prevItems.filter(item => item.variantId !== variantId)
    );
  };

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => {
      return total + (parseFloat(item.variant.price) * item.quantity);
    }, 0);
  };

  const handleCheckout = async () => {
    if (cartItems.length === 0) {
      Alert.alert('Carrito vacío', 'Agrega productos al carrito para continuar');
      return;
    }

    const storeGroups = cartItems.reduce((groups, item) => {
      const storeId = item.product.storeId;
      if (!groups[storeId]) {
        groups[storeId] = [];
      }
      groups[storeId].push(item);
      return groups;
    }, {} as Record<string, CartItem[]>);

    const storeIds = Object.keys(storeGroups);
    
    if (storeIds.length > 1) {
      Alert.alert(
        'Múltiples tiendas',
        'Tu carrito contiene productos de diferentes tiendas. Necesitarás hacer checkouts separados.',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Continuar', onPress: () => processMultipleCheckouts(storeGroups) },
        ]
      );
    } else {
      processSingleCheckout(storeIds[0], storeGroups[storeIds[0]]);
    }
  };

  const processSingleCheckout = async (storeId: string, items: CartItem[]) => {
    setLoading(true);
    try {
      const checkout = await shopifyService.createCheckout(storeId, items);
      
      Alert.alert(
        'Proceder al pago',
        'Serás redirigido al checkout de Shopify para completar tu compra.',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Continuar', onPress: () => {
            // TODO: Open checkout.webUrl in WebView or external browser
            console.log('Checkout URL:', checkout.webUrl);
            setCartItems([]); // Clear cart after checkout
          }},
        ]
      );
    } catch (error) {
      console.error('Error creating checkout:', error);
      Alert.alert('Error', 'No se pudo crear el checkout');
    } finally {
      setLoading(false);
    }
  };

  const processMultipleCheckouts = async (storeGroups: Record<string, CartItem[]>) => {
    setLoading(true);
    const checkoutUrls: string[] = [];

    try {
      for (const [storeId, items] of Object.entries(storeGroups)) {
        const checkout = await shopifyService.createCheckout(storeId, items);
        checkoutUrls.push(checkout.webUrl);
      }

      Alert.alert(
        'Checkouts creados',
        `Se crearon ${checkoutUrls.length} checkouts separados. Procede con cada uno para completar tus compras.`,
        [
          { text: 'OK', onPress: () => {
            // TODO: Handle multiple checkout URLs
            console.log('Checkout URLs:', checkoutUrls);
            setCartItems([]); // Clear cart after checkouts
          }},
        ]
      );
    } catch (error) {
      console.error('Error creating checkouts:', error);
      Alert.alert('Error', 'No se pudieron crear todos los checkouts');
    } finally {
      setLoading(false);
    }
  };

  const renderCartItem = ({ item }: { item: CartItem }) => (
    <View style={styles.cartItem}>
      {item.product.images.length > 0 ? (
        <Image
          source={{ uri: item.product.images[0].url }}
          style={styles.productImage}
        />
      ) : (
        <View style={[styles.productImage, styles.noImage]}>
          <Ionicons name="image-outline" size={24} color="#9ca3af" />
        </View>
      )}

      <View style={styles.itemDetails}>
        <Text style={styles.storeName}>{item.product.storeName}</Text>
        <Text style={styles.productTitle} numberOfLines={2}>
          {item.product.title}
        </Text>
        <Text style={styles.variantTitle}>{item.variant.title}</Text>
        <Text style={styles.price}>${item.variant.price}</Text>
      </View>

      <View style={styles.quantityControls}>
        <TouchableOpacity
          style={styles.quantityButton}
          onPress={() => updateQuantity(item.variantId, item.quantity - 1)}
        >
          <Ionicons name="remove" size={16} color="#6366f1" />
        </TouchableOpacity>
        
        <Text style={styles.quantity}>{item.quantity}</Text>
        
        <TouchableOpacity
          style={styles.quantityButton}
          onPress={() => updateQuantity(item.variantId, item.quantity + 1)}
        >
          <Ionicons name="add" size={16} color="#6366f1" />
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.removeButton}
        onPress={() => removeItem(item.variantId)}
      >
        <Ionicons name="trash-outline" size={20} color="#ef4444" />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {cartItems.length > 0 ? (
        <>
          <FlatList
            data={cartItems}
            renderItem={renderCartItem}
            keyExtractor={(item) => item.variantId}
            contentContainerStyle={styles.listContainer}
          />

          <View style={styles.footer}>
            <View style={styles.totalContainer}>
              <Text style={styles.totalLabel}>Total:</Text>
              <Text style={styles.totalAmount}>
                ${calculateTotal().toFixed(2)}
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.checkoutButton, loading && styles.checkoutButtonDisabled]}
              onPress={handleCheckout}
              disabled={loading}
            >
              <Text style={styles.checkoutButtonText}>
                {loading ? 'Procesando...' : 'Proceder al pago'}
              </Text>
            </TouchableOpacity>
          </View>
        </>
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="bag-outline" size={64} color="#9ca3af" />
          <Text style={styles.emptyTitle}>Tu carrito está vacío</Text>
          <Text style={styles.emptySubtitle}>
            Explora nuestros productos y agrega algunos al carrito
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  listContainer: {
    padding: 16,
  },
  cartItem: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  productImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  noImage: {
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemDetails: {
    flex: 1,
    marginRight: 12,
  },
  storeName: {
    fontSize: 10,
    fontWeight: '600',
    color: '#6366f1',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  productTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 2,
  },
  variantTitle: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  price: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#059669',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  quantityButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantity: {
    fontSize: 16,
    fontWeight: '600',
    marginHorizontal: 12,
    minWidth: 20,
    textAlign: 'center',
  },
  removeButton: {
    padding: 4,
  },
  footer: {
    backgroundColor: 'white',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  totalAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#059669',
  },
  checkoutButton: {
    backgroundColor: '#6366f1',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  checkoutButtonDisabled: {
    opacity: 0.7,
  },
  checkoutButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
});