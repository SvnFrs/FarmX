import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage keys
export const STORAGE_KEYS = {
  SCAN_HISTORY: '@farmx_scan_history',
  FARMS: '@farmx_farms',
  PONDS: '@farmx_ponds',
  SUBSCRIPTION: '@farmx_subscription',
  USER_PROFILE: '@farmx_user_profile',
};

// Types
export interface ScanRecord {
  id: string;
  date: string;
  imageUri?: string;
  muscleGutRatio: number;
  healthStatus: 'excellent' | 'good' | 'fair' | 'poor';
  recommendations: string[];
  pondId?: string;
  farmId?: string;
  shrimpCount?: number;
  temperature?: number;
  ph?: number;
}

export interface Farm {
  id: string;
  name: string;
  location: string;
  pondCount: number;
  totalArea: number;
  createdDate: string;
}

export interface Pond {
  id: string;
  name: string;
  farmId: string;
  size: number;
  shrimpCount: number;
  lastScanDate?: string;
  waterQuality?: {
    temperature: number;
    ph: number;
    dissolvedOxygen: number;
  };
}

export interface Subscription {
  type: 'free' | 'basic' | 'premium' | 'enterprise';
  scansRemaining: number;
  scanLimit: number;
  renewalDate: string;
  features: string[];
}

// Storage utilities
export const storageUtils = {
  // Scan History
  async getScanHistory(): Promise<ScanRecord[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.SCAN_HISTORY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting scan history:', error);
      return [];
    }
  },

  async saveScan(scan: ScanRecord): Promise<void> {
    try {
      const history = await this.getScanHistory();
      history.unshift(scan);
      await AsyncStorage.setItem(STORAGE_KEYS.SCAN_HISTORY, JSON.stringify(history));
    } catch (error) {
      console.error('Error saving scan:', error);
      throw error;
    }
  },

  async deleteScan(scanId: string): Promise<void> {
    try {
      const history = await this.getScanHistory();
      const updated = history.filter(scan => scan.id !== scanId);
      await AsyncStorage.setItem(STORAGE_KEYS.SCAN_HISTORY, JSON.stringify(updated));
    } catch (error) {
      console.error('Error deleting scan:', error);
      throw error;
    }
  },

  // Farms
  async getFarms(): Promise<Farm[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.FARMS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting farms:', error);
      return [];
    }
  },

  async saveFarm(farm: Farm): Promise<void> {
    try {
      const farms = await this.getFarms();
      const existingIndex = farms.findIndex(f => f.id === farm.id);
      if (existingIndex >= 0) {
        farms[existingIndex] = farm;
      } else {
        farms.push(farm);
      }
      await AsyncStorage.setItem(STORAGE_KEYS.FARMS, JSON.stringify(farms));
    } catch (error) {
      console.error('Error saving farm:', error);
      throw error;
    }
  },

  async deleteFarm(farmId: string): Promise<void> {
    try {
      const farms = await this.getFarms();
      const updated = farms.filter(farm => farm.id !== farmId);
      await AsyncStorage.setItem(STORAGE_KEYS.FARMS, JSON.stringify(updated));
    } catch (error) {
      console.error('Error deleting farm:', error);
      throw error;
    }
  },

  // Ponds
  async getPonds(): Promise<Pond[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.PONDS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting ponds:', error);
      return [];
    }
  },

  async getPondsByFarm(farmId: string): Promise<Pond[]> {
    try {
      const ponds = await this.getPonds();
      return ponds.filter(pond => pond.farmId === farmId);
    } catch (error) {
      console.error('Error getting ponds by farm:', error);
      return [];
    }
  },

  async savePond(pond: Pond): Promise<void> {
    try {
      const ponds = await this.getPonds();
      const existingIndex = ponds.findIndex(p => p.id === pond.id);
      if (existingIndex >= 0) {
        ponds[existingIndex] = pond;
      } else {
        ponds.push(pond);
      }
      await AsyncStorage.setItem(STORAGE_KEYS.PONDS, JSON.stringify(ponds));
    } catch (error) {
      console.error('Error saving pond:', error);
      throw error;
    }
  },

  async deletePond(pondId: string): Promise<void> {
    try {
      const ponds = await this.getPonds();
      const updated = ponds.filter(pond => pond.id !== pondId);
      await AsyncStorage.setItem(STORAGE_KEYS.PONDS, JSON.stringify(updated));
    } catch (error) {
      console.error('Error deleting pond:', error);
      throw error;
    }
  },

  // Subscription
  async getSubscription(): Promise<Subscription> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.SUBSCRIPTION);
      return data ? JSON.parse(data) : {
        type: 'free',
        scansRemaining: 5,
        scanLimit: 5,
        renewalDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        features: ['Basic scanning', '5 scans per month'],
      };
    } catch (error) {
      console.error('Error getting subscription:', error);
      return {
        type: 'free',
        scansRemaining: 5,
        scanLimit: 5,
        renewalDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        features: ['Basic scanning', '5 scans per month'],
      };
    }
  },

  async updateSubscription(subscription: Subscription): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.SUBSCRIPTION, JSON.stringify(subscription));
    } catch (error) {
      console.error('Error updating subscription:', error);
      throw error;
    }
  },

  async decrementScanCount(): Promise<boolean> {
    try {
      const subscription = await this.getSubscription();
      if (subscription.scansRemaining > 0) {
        subscription.scansRemaining--;
        await this.updateSubscription(subscription);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error decrementing scan count:', error);
      return false;
    }
  },

  // Clear all data
  async clearAllData(): Promise<void> {
    try {
      await AsyncStorage.multiRemove(Object.values(STORAGE_KEYS));
    } catch (error) {
      console.error('Error clearing all data:', error);
      throw error;
    }
  },
};
