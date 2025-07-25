import React, { useState, useEffect } from 'react';
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
import { Store } from '../types';
import { shopifyService } from '../services/shopify';
import * as SecureStore from 'expo-secure-store';

export default function StoresScreen() {
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStores();
  }, []);

  const loadStores = async () => {
    try {
      const storeList = await shopifyService.getStores();
      setStores(storeList);
    } catch (error) {
      console.error('Error loading stores:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSubscription = async (store: Store) => {
    try {
      const token = await SecureStore.getItemAsync('authToken');
      if (!token) return;

      const success = store.isSubscribed
        ? await shopifyService.unsubscribeFromStore(store.id, token)
        : await shopifyService.subscribeToStore(store.id, token);

      if (success) {
        setStores(prevStores =>
          prevStores.map(s =>
            s.id === store.id
              ? { ...s, isSubscribed: !s.isSubscribed }
              : s
          )
        );
        
        Alert.alert(
          'Éxito',
          store.isSubscribed
            ? `Te has desuscrito de ${store.name}`
            : `Te has suscrito a ${store.name}`
        );
      } else {
        Alert.alert('Error', 'No se pudo actualizar la suscripción');
      }
    } catch (error) {
      console.error('Error toggling subscription:', error);
      Alert.alert('Error', 'No se pudo conectar con el servidor');
    }
  };

  const renderStore = ({ item }: { item: Store }) => (
    <View style={styles.storeCard}>
      <View style={styles.storeHeader}>
        {item.logo ? (
          <Image source={{ uri: item.logo }} style={styles.storeLogo} />
        ) : (
          <View style={[styles.storeLogo, styles.defaultLogo]}>
            <Ionicons name="storefront" size={24} color="#6b7280" />
          </View>
        )}
        
        <View style={styles.storeInfo}>
          <Text style={styles.storeName}>{item.name}</Text>
          <Text style={styles.storeDomain}>{item.domain}</Text>
          {item.description && (
            <Text style={styles.storeDescription} numberOfLines={2}>
              {item.description}
            </Text>
          )}
        </View>
      </View>

      {item.categories.length > 0 && (
        <View style={styles.categoriesContainer}>
          {item.categories.slice(0, 3).map((category, index) => (
            <View key={index} style={styles.categoryTag}>
              <Text style={styles.categoryText}>{category}</Text>
            </View>
          ))}
          {item.categories.length > 3 && (
            <Text style={styles.moreCategories}>
              +{item.categories.length - 3} más
            </Text>
          )}
        </View>
      )}

      <TouchableOpacity
        style={[
          styles.subscribeButton,
          item.isSubscribed && styles.subscribedButton,
        ]}
        onPress={() => toggleSubscription(item)}
      >
        <Ionicons
          name={item.isSubscribed ? 'checkmark-circle' : 'add-circle-outline'}
          size={20}
          color={item.isSubscribed ? '#059669' : '#6366f1'}
        />
        <Text
          style={[
            styles.subscribeButtonText,
            item.isSubscribed && styles.subscribedButtonText,
          ]}
        >
          {item.isSubscribed ? 'Suscrito' : 'Suscribirse'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <Text style={styles.loadingText}>Cargando tiendas...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={stores}
        renderItem={renderStore}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={() => (
          <View style={styles.centerContent}>
            <Text style={styles.emptyText}>No hay tiendas disponibles</Text>
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
  listContainer: {
    padding: 16,
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
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
  storeCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  storeHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  storeLogo: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 12,
  },
  defaultLogo: {
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  storeInfo: {
    flex: 1,
  },
  storeName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  storeDomain: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  storeDescription: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 18,
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
    alignItems: 'center',
  },
  categoryTag: {
    backgroundColor: '#e0e7ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 4,
  },
  categoryText: {
    fontSize: 12,
    color: '#3730a3',
    fontWeight: '500',
  },
  moreCategories: {
    fontSize: 12,
    color: '#6b7280',
    fontStyle: 'italic',
  },
  subscribeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#6366f1',
    paddingVertical: 10,
    borderRadius: 8,
  },
  subscribedButton: {
    backgroundColor: '#f0fdf4',
    borderColor: '#059669',
  },
  subscribeButtonText: {
    color: '#6366f1',
    fontWeight: '600',
    marginLeft: 6,
  },
  subscribedButtonText: {
    color: '#059669',
  },
});