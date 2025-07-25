import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Image,
  Alert,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MainStackParamList } from '../navigation/MainNavigator';
import { Product, ProductVariant, CartItem } from '../types';
import { shopifyService } from '../services/shopify';

type ProductDetailScreenRouteProp = RouteProp<MainStackParamList, 'ProductDetail'>;
type ProductDetailScreenNavigationProp = StackNavigationProp<MainStackParamList, 'ProductDetail'>;

interface Props {
  route: ProductDetailScreenRouteProp;
  navigation: ProductDetailScreenNavigationProp;
}

const { width } = Dimensions.get('window');

export default function ProductDetailScreen({ route, navigation }: Props) {
  const { productId, storeId } = route.params;
  const [product, setProduct] = useState<Product | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<CartItem[]>([]);

  useEffect(() => {
    loadProduct();
  }, [productId, storeId]);

  const loadProduct = async () => {
    try {
      const productData = await shopifyService.getProduct(storeId, productId);
      setProduct(productData);
      if (productData.variants.length > 0) {
        setSelectedVariant(productData.variants[0]);
      }
    } catch (error) {
      console.error('Error loading product:', error);
      Alert.alert('Error', 'No se pudo cargar el producto');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const addToCart = () => {
    if (!product || !selectedVariant) return;

    const cartItem: CartItem = {
      variantId: selectedVariant.id,
      quantity: 1,
      product,
      variant: selectedVariant,
    };

    setCart(prevCart => {
      const existingIndex = prevCart.findIndex(item => item.variantId === selectedVariant.id);
      if (existingIndex >= 0) {
        const updatedCart = [...prevCart];
        updatedCart[existingIndex].quantity += 1;
        return updatedCart;
      } else {
        return [...prevCart, cartItem];
      }
    });

    Alert.alert('Éxito', 'Producto agregado al carrito', [
      { text: 'Continuar comprando', style: 'cancel' },
      { text: 'Ver carrito', onPress: () => navigation.navigate('Cart') },
    ]);
  };

  const handleCheckout = async () => {
    if (!product || !selectedVariant) return;

    try {
      const cartItem: CartItem = {
        variantId: selectedVariant.id,
        quantity: 1,
        product,
        variant: selectedVariant,
      };

      const checkout = await shopifyService.createCheckout(storeId, [cartItem]);
      
      Alert.alert(
        'Proceder al pago',
        'Serás redirigido al checkout de Shopify para completar tu compra.',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Continuar', onPress: () => {
            // TODO: Open checkout.webUrl in WebView or external browser
            console.log('Checkout URL:', checkout.webUrl);
          }},
        ]
      );
    } catch (error) {
      console.error('Error creating checkout:', error);
      Alert.alert('Error', 'No se pudo crear el checkout');
    }
  };

  if (loading || !product) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <Text style={styles.loadingText}>Cargando producto...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {product.images.length > 0 && (
          <Image
            source={{ uri: product.images[0].url }}
            style={styles.productImage}
          />
        )}

        <View style={styles.productContent}>
          <Text style={styles.storeName}>{product.storeName}</Text>
          <Text style={styles.productTitle}>{product.title}</Text>
          
          <View style={styles.priceContainer}>
            <Text style={styles.price}>${selectedVariant?.price || product.price}</Text>
            {product.compareAtPrice && (
              <Text style={styles.comparePrice}>${product.compareAtPrice}</Text>
            )}
          </View>

          {product.description && (
            <View style={styles.descriptionContainer}>
              <Text style={styles.sectionTitle}>Descripción</Text>
              <Text style={styles.description}>{product.description}</Text>
            </View>
          )}

          {product.variants.length > 1 && (
            <View style={styles.variantsContainer}>
              <Text style={styles.sectionTitle}>Variantes</Text>
              {product.variants.map((variant) => (
                <TouchableOpacity
                  key={variant.id}
                  style={[
                    styles.variantButton,
                    selectedVariant?.id === variant.id && styles.selectedVariant,
                  ]}
                  onPress={() => setSelectedVariant(variant)}
                >
                  <Text
                    style={[
                      styles.variantText,
                      selectedVariant?.id === variant.id && styles.selectedVariantText,
                    ]}
                  >
                    {variant.title} - ${variant.price}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {product.tags.length > 0 && (
            <View style={styles.tagsContainer}>
              <Text style={styles.sectionTitle}>Etiquetas</Text>
              <View style={styles.tagsRow}>
                {product.tags.map((tag, index) => (
                  <View key={index} style={styles.tag}>
                    <Text style={styles.tagText}>{tag}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.actionButton, styles.addToCartButton]}
          onPress={addToCart}
          disabled={!product.available || !selectedVariant?.available}
        >
          <Ionicons name="bag-add" size={20} color="white" />
          <Text style={styles.actionButtonText}>Agregar al carrito</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.buyNowButton]}
          onPress={handleCheckout}
          disabled={!product.available || !selectedVariant?.available}
        >
          <Ionicons name="card" size={20} color="white" />
          <Text style={styles.actionButtonText}>Comprar ahora</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollView: {
    flex: 1,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
  },
  productImage: {
    width: width,
    height: width,
  },
  productContent: {
    padding: 16,
  },
  storeName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6366f1',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  productTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
    lineHeight: 32,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  price: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#059669',
  },
  comparePrice: {
    fontSize: 18,
    color: '#9ca3af',
    textDecorationLine: 'line-through',
    marginLeft: 12,
  },
  descriptionContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: '#6b7280',
    lineHeight: 24,
  },
  variantsContainer: {
    marginBottom: 20,
  },
  variantButton: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  selectedVariant: {
    borderColor: '#6366f1',
    backgroundColor: '#ede9fe',
  },
  variantText: {
    fontSize: 16,
    color: '#374151',
  },
  selectedVariantText: {
    color: '#6366f1',
    fontWeight: '600',
  },
  tagsContainer: {
    marginBottom: 20,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tag: {
    backgroundColor: '#e0e7ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    fontSize: 12,
    color: '#3730a3',
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  addToCartButton: {
    backgroundColor: '#6366f1',
  },
  buyNowButton: {
    backgroundColor: '#059669',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 6,
  },
});