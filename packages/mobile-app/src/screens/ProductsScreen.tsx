import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Image,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { MainStackParamList } from '../navigation/MainNavigator';
import { Product } from '../types';
import { shopifyService } from '../services/shopify';

type ProductsScreenNavigationProp = StackNavigationProp<MainStackParamList>;

interface Props {
  navigation: ProductsScreenNavigationProp;
}

export default function ProductsScreen({ navigation }: Props) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    loadInitialProducts();
  }, []);

  const loadInitialProducts = async () => {
    try {
      const stores = await shopifyService.getStores();
      const allProducts: Product[] = [];
      
      for (const store of stores.slice(0, 3)) {
        try {
          const storeProducts = await shopifyService.getStoreProducts(store.id, 10);
          allProducts.push(...storeProducts);
        } catch (error) {
          console.error(`Error loading products from ${store.name}:`, error);
        }
      }
      
      setProducts(allProducts);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    
    if (query.length < 2) {
      loadInitialProducts();
      return;
    }

    setSearching(true);
    try {
      const searchResults = await shopifyService.searchProducts(query);
      setProducts(searchResults);
    } catch (error) {
      console.error('Error searching products:', error);
    } finally {
      setSearching(false);
    }
  };

  const renderProduct = ({ item }: { item: Product }) => (
    <TouchableOpacity
      style={styles.productCard}
      onPress={() =>
        navigation.navigate('ProductDetail', {
          productId: item.id,
          storeId: item.storeId,
        })
      }
    >
      {item.images.length > 0 ? (
        <Image source={{ uri: item.images[0].url }} style={styles.productImage} />
      ) : (
        <View style={[styles.productImage, styles.noImage]}>
          <Ionicons name="image-outline" size={40} color="#9ca3af" />
        </View>
      )}
      
      <View style={styles.productInfo}>
        <Text style={styles.storeName}>{item.storeName}</Text>
        <Text style={styles.productTitle} numberOfLines={2}>
          {item.title}
        </Text>
        
        <View style={styles.priceContainer}>
          <Text style={styles.price}>${item.price}</Text>
          {item.compareAtPrice && (
            <Text style={styles.comparePrice}>${item.compareAtPrice}</Text>
          )}
        </View>
        
        {!item.available && (
          <Text style={styles.unavailable}>Agotado</Text>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color="#9ca3af" />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar productos..."
            value={searchQuery}
            onChangeText={handleSearch}
          />
          {searching && (
            <Ionicons name="refresh" size={20} color="#6366f1" />
          )}
        </View>
      </View>

      <FlatList
        data={products}
        renderItem={renderProduct}
        keyExtractor={(item) => `${item.storeId}-${item.id}`}
        numColumns={2}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={() => (
          <View style={styles.centerContent}>
            <Text style={styles.emptyText}>
              {loading || searching
                ? 'Cargando productos...'
                : searchQuery
                ? 'No se encontraron productos'
                : 'No hay productos disponibles'}
            </Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  searchContainer: {
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
  },
  listContainer: {
    padding: 16,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
  productCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    margin: 4,
    flex: 1,
    maxWidth: '48%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  productImage: {
    width: '100%',
    height: 150,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  noImage: {
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  productInfo: {
    padding: 12,
  },
  storeName: {
    fontSize: 10,
    fontWeight: '600',
    color: '#6366f1',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  productTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
    lineHeight: 18,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  price: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#059669',
  },
  comparePrice: {
    fontSize: 12,
    color: '#9ca3af',
    textDecorationLine: 'line-through',
    marginLeft: 6,
  },
  unavailable: {
    fontSize: 12,
    color: '#ef4444',
    fontWeight: '500',
  },
});