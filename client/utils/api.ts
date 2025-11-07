/**
 * API Service Layer for FarmX MVP
 * Handles all backend communication with automatic authentication
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// Base API URL - change this to your backend URL
const API_BASE_URL = 'http://192.168.1.6:4000/api';

// Storage keys
const AUTH_TOKEN_KEY = '@farmx_auth_token';
const USER_DATA_KEY = '@farmx_user_data';

/**
 * API Client with automatic token management
 */
class ApiClient {
  private token: string | null = null;
  private userData: any = null;

  constructor() {
    this.loadStoredAuth();
  }

  // Load stored auth token
  private async loadStoredAuth() {
    try {
      const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
      const userData = await AsyncStorage.getItem(USER_DATA_KEY);

      if (token) {
        this.token = token;
      }
      if (userData) {
        this.userData = JSON.parse(userData);
      }
    } catch (error) {
      console.error('Failed to load stored auth:', error);
    }
  }

  // Set auth token
  async setAuth(token: string, userData: any) {
    this.token = token;
    this.userData = userData;

    try {
      await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
      await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(userData));
    } catch (error) {
      console.error('Failed to store auth:', error);
    }
  }

  // Clear auth
  async clearAuth() {
    this.token = null;
    this.userData = null;

    try {
      await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
      await AsyncStorage.removeItem(USER_DATA_KEY);
    } catch (error) {
      console.error('Failed to clear auth:', error);
    }
  }

  // Get stored auth
  getAuth() {
    return {
      token: this.token,
      userData: this.userData,
    };
  }

  // Make authenticated request
  private async request(endpoint: string, options: RequestInit = {}) {
    const url = `${API_BASE_URL}${endpoint}`;

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    // Add auth token if available
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // Auth endpoints
  async login(username: string, password: string) {
    const data = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });

    await this.setAuth(data.token, data.user);
    return data;
  }

  async autoLogin() {
    try {
      // Auto-login with default credentials
      return await this.login('user', 'user');
    } catch (error) {
      console.error('Auto-login failed:', error);
      throw error;
    }
  }

  // Farm endpoints
  async getFarms() {
    return this.request('/farms');
  }

  async createFarm(name: string, location?: string) {
    return this.request('/farms', {
      method: 'POST',
      body: JSON.stringify({ name, location }),
    });
  }

  async getFarm(farmId: string) {
    return this.request(`/farms/${farmId}`);
  }

  async updateFarm(farmId: string, data: { name?: string; location?: string }) {
    return this.request(`/farms/${farmId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteFarm(farmId: string) {
    return this.request(`/farms/${farmId}`, {
      method: 'DELETE',
    });
  }

  // Pond endpoints
  async getPonds(farmId: string) {
    return this.request(`/farms/${farmId}/ponds`);
  }

  async createPond(farmId: string, name: string, area?: number) {
    return this.request(`/farms/${farmId}/ponds`, {
      method: 'POST',
      body: JSON.stringify({ name, area }),
    });
  }

  async getPond(pondId: string) {
    return this.request(`/ponds/${pondId}`);
  }

  async updatePond(pondId: string, data: { name?: string; area?: number }) {
    return this.request(`/ponds/${pondId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deletePond(pondId: string) {
    return this.request(`/ponds/${pondId}`, {
      method: 'DELETE',
    });
  }

  // Scan endpoints
  async createScan(data: {
    deviceId?: string;
    metrics: Record<string, any>;
    rawData?: any;
    saveToPondId?: string;
    imageUrl?: string;
    healthScore?: number;
    diseasePrediction?: {
      disease?: string;
      confidence?: number;
      recommendations?: string[];
    };
  }) {
    return this.request('/scans', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getScans(pondId?: string, page = 1, limit = 20) {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (pondId) {
      params.append('pondId', pondId);
    }

    return this.request(`/scans?${params.toString()}`);
  }

  async getScan(scanId: string) {
    return this.request(`/scans/${scanId}`);
  }

  // Analytics endpoints
  async getPondAnalytics(pondId: string, startDate?: string, endDate?: string) {
    const params = new URLSearchParams();

    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    const queryString = params.toString();
    return this.request(`/ponds/${pondId}/analytics${queryString ? `?${queryString}` : ''}`);
  }

  async getFarmAnalytics(farmId: string) {
    return this.request(`/farms/${farmId}/analytics`);
  }

  // Product endpoints
  async getProducts(category?: string) {
    const params = category ? `?category=${category}` : '';
    return this.request(`/products${params}`);
  }

  async getProduct(productId: string) {
    return this.request(`/products/${productId}`);
  }

  // Cart endpoints
  async getCart() {
    return this.request('/cart');
  }

  async addToCart(productId: string, qty: number) {
    return this.request('/cart', {
      method: 'POST',
      body: JSON.stringify({ productId, qty }),
    });
  }

  async updateCartItem(productId: string, qty: number) {
    return this.request(`/cart/${productId}`, {
      method: 'PUT',
      body: JSON.stringify({ qty }),
    });
  }

  async removeFromCart(productId: string) {
    return this.request(`/cart/${productId}`, {
      method: 'DELETE',
    });
  }

  async clearCart() {
    return this.request('/cart/clear', {
      method: 'POST',
    });
  }

  // Order endpoints
  async checkout() {
    return this.request('/cart/checkout', {
      method: 'POST',
    });
  }

  async createOrder() {
    return this.request('/cart/checkout', {
      method: 'POST',
    });
  }

  async getOrders(page = 1, limit = 10) {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    return this.request(`/orders?${params.toString()}`);
  }

  async getOrder(orderId: string) {
    return this.request(`/orders/${orderId}`);
  }

  // Subscription endpoints
  async getCurrentSubscription() {
    return this.request('/subscriptions/current');
  }

  async getSubscriptionPlans() {
    return this.request('/subscriptions/plans');
  }

  async upgradeSubscription(plan: 'free' | 'premium' | 'enterprise') {
    return this.request('/subscriptions/subscribe', {
      method: 'POST',
      body: JSON.stringify({ plan }),
    });
  }

  async subscribe(plan: 'free' | 'premium' | 'enterprise') {
    return this.request('/subscriptions/subscribe', {
      method: 'POST',
      body: JSON.stringify({ plan }),
    });
  }

  // User endpoints
  async getCurrentUser() {
    return this.request('/users/me');
  }

  async updateProfile(data: any) {
    return this.request('/users/me', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }
}

// Export singleton instance
export const api = new ApiClient();

// Export types
export interface Farm {
  _id: string;
  name: string;
  location?: string;
  owner: string;
  status: 'active' | 'inactive' | 'archived';
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Pond {
  _id: string;
  name: string;
  farm: string;
  area?: number;
  status: 'active' | 'inactive' | 'maintenance';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ScanResult {
  _id: string;
  pond?: string;
  deviceId?: string;
  healthScore?: number;
  diseasePrediction?: {
    disease?: string;
    confidence?: number;
    recommendations?: string[];
  };
  metrics: Record<string, any>;
  rawData?: any;
  imageUrl?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  _id: string;
  name: string;
  category: string;
  price: number;
  description?: string;
  imageUrl?: string;
  stock: number;
  unit: string;
  isActive: boolean;
}

export interface CartItem {
  product: Product;
  qty: number;
  itemTotal: number;
}

export interface Order {
  _id: string;
  user: string;
  items: Array<{
    product: Product;
    qty: number;
    price: number;
  }>;
  total: number;
  status: 'pending' | 'completed' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}
