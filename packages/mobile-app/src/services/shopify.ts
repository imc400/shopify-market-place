import axios from 'axios';
import { Product, Store, Checkout, CartItem } from '../types';

const API_BASE_URL = 'http://localhost:3001/api';

class ShopifyService {
  private api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 15000,
  });

  async getStores(): Promise<Store[]> {
    const response = await this.api.get('/stores');
    return response.data.stores;
  }

  async getStoreProducts(storeId: string, limit: number = 20): Promise<Product[]> {
    const response = await this.api.get(`/stores/${storeId}/products`, {
      params: { limit }
    });
    return response.data.products;
  }

  async getProduct(storeId: string, productId: string): Promise<Product> {
    const response = await this.api.get(`/stores/${storeId}/products/${productId}`);
    return response.data.product;
  }

  async searchProducts(query: string, storeIds?: string[]): Promise<Product[]> {
    const response = await this.api.post('/products/search', {
      query,
      storeIds
    });
    return response.data.products;
  }

  async createCheckout(storeId: string, lineItems: CartItem[]): Promise<Checkout> {
    const formattedLineItems = lineItems.map(item => ({
      variantId: item.variantId,
      quantity: item.quantity
    }));

    const response = await this.api.post(`/stores/${storeId}/checkout`, {
      lineItems: formattedLineItems
    });
    
    return response.data.checkout;
  }

  async subscribeToStore(storeId: string, token: string): Promise<boolean> {
    try {
      const response = await this.api.post(`/stores/${storeId}/subscribe`, {}, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      return response.data.success;
    } catch (error) {
      console.error('Error subscribing to store:', error);
      return false;
    }
  }

  async unsubscribeFromStore(storeId: string, token: string): Promise<boolean> {
    try {
      const response = await this.api.delete(`/stores/${storeId}/subscribe`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      return response.data.success;
    } catch (error) {
      console.error('Error unsubscribing from store:', error);
      return false;
    }
  }

  async getPromotions(token: string): Promise<any[]> {
    const response = await this.api.get('/promotions', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data.promotions;
  }
}

export const shopifyService = new ShopifyService();