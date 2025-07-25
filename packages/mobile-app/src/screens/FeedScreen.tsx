import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  SafeAreaView,
  RefreshControl,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Promotion } from '../types';
import { shopifyService } from '../services/shopify';
import * as SecureStore from 'expo-secure-store';

export default function FeedScreen() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadPromotions();
  }, []);

  const loadPromotions = async () => {
    try {
      const token = await SecureStore.getItemAsync('authToken');
      if (token) {
        const promos = await shopifyService.getPromotions(token);
        setPromotions(promos);
      }
    } catch (error) {
      console.error('Error loading promotions:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPromotions();
    setRefreshing(false);
  };

  const renderPromotion = ({ item }: { item: Promotion }) => (
    <TouchableOpacity style={styles.promotionCard}>
      {item.image && (
        <Image source={{ uri: item.image }} style={styles.promotionImage} />
      )}
      <View style={styles.promotionContent}>
        <Text style={styles.storeName}>{item.storeName}</Text>
        <Text style={styles.promotionTitle}>{item.title}</Text>
        <Text style={styles.promotionDescription}>{item.description}</Text>
        {item.discountCode && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>Código: {item.discountCode}</Text>
          </View>
        )}
        {item.validUntil && (
          <Text style={styles.validUntil}>
            Válido hasta: {new Date(item.validUntil).toLocaleDateString()}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <Text style={styles.loadingText}>Cargando promociones...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={promotions}
        renderItem={renderPromotion}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={() => (
          <View style={styles.centerContent}>
            <Text style={styles.emptyText}>
              No hay promociones disponibles
            </Text>
            <Text style={styles.emptySubtext}>
              Suscríbete a tiendas para ver sus ofertas aquí
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
  listContainer: {
    padding: 16,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  promotionCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  promotionImage: {
    width: '100%',
    height: 200,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  promotionContent: {
    padding: 16,
  },
  storeName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6366f1',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  promotionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  promotionDescription: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
    marginBottom: 12,
  },
  discountBadge: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  discountText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#92400e',
  },
  validUntil: {
    fontSize: 12,
    color: '#6b7280',
    fontStyle: 'italic',
  },
});