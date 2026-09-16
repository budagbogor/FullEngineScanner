import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '@/constants/service-functions';
import type { Message, MechanicResponse, AppSettings } from '@/shared/mechanic-types';

export const StorageService = {
  // Messages
  async getMessages(): Promise<Message[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.MESSAGES);
      if (data) {
        const messages = JSON.parse(data);
        return messages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }));
      }
      return [];
    } catch (error) {
      console.error('Error loading messages:', error);
      return [];
    }
  },

  async saveMessages(messages: Message[]): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(messages));
    } catch (error) {
      console.error('Error saving messages:', error);
    }
  },

  async clearMessages(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.MESSAGES);
    } catch (error) {
      console.error('Error clearing messages:', error);
    }
  },

  // Current Job
  async getCurrentJob(): Promise<MechanicResponse | null> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.JOB);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error loading job:', error);
      return null;
    }
  },

  async saveCurrentJob(job: MechanicResponse): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.JOB, JSON.stringify(job));
    } catch (error) {
      console.error('Error saving job:', error);
    }
  },

  async clearCurrentJob(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.JOB);
    } catch (error) {
      console.error('Error clearing job:', error);
    }
  },

  // Disclaimer
  async isDisclaimerAccepted(): Promise<boolean> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.DISCLAIMER);
      return data === 'true';
    } catch (error) {
      console.error('Error loading disclaimer status:', error);
      return false;
    }
  },

  async acceptDisclaimer(): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.DISCLAIMER, 'true');
    } catch (error) {
      console.error('Error saving disclaimer status:', error);
    }
  },

  // API Key
  async getApiKey(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(STORAGE_KEYS.API_KEY);
    } catch (error) {
      console.error('Error loading API key:', error);
      return null;
    }
  },

  async saveApiKey(key: string): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.API_KEY, key);
    } catch (error) {
      console.error('Error saving API key:', error);
    }
  },

  // Settings
  async getSettings(): Promise<AppSettings> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (data) {
        return JSON.parse(data) as AppSettings;
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
    
    // Default settings
    return {
      provider: 'gemini',
      geminiApiKey: '',
      sumopodApiKey: '',
      sumopodBaseUrl: '',
      sumopodModel: 'llama-3.1-8b',
      saveScope: 'global',
    };
  },

  async saveSettings(settings: AppSettings): Promise<void> {
    try {
      if (settings.saveScope === 'global') {
        await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
        // Keep API_KEY backward compatible
        await AsyncStorage.setItem(STORAGE_KEYS.API_KEY, settings.geminiApiKey);
      } else {
        // If local, we don't save to AsyncStorage, we just clear it or let the app state handle it.
        // Actually, if we want it to be purely local session, we shouldn't save to AsyncStorage.
      }
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  },

  // Clear all
  async clearAll(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.MESSAGES,
        STORAGE_KEYS.JOB,
      ]);
    } catch (error) {
      console.error('Error clearing all data:', error);
    }
  },
};
