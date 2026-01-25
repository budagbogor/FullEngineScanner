import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '@/constants/service-functions';
import type { Message, MechanicResponse } from '@/shared/mechanic-types';

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
