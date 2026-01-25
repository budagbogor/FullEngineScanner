import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, ScrollView, Platform, Linking } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SettingsModalProps {
  visible: boolean;
  onClose: () => void;
  onApiKeyChange: (key: string) => void;
  currentApiKey: string;
}

export function SettingsModal({ visible, onClose, onApiKeyChange, currentApiKey }: SettingsModalProps) {
  const [apiKey, setApiKey] = useState(currentApiKey);
  const [showKey, setShowKey] = useState(false);

  useEffect(() => {
    setApiKey(currentApiKey);
  }, [currentApiKey]);

  const handleSave = async () => {
    try {
      await AsyncStorage.setItem('gemini_api_key', apiKey);
      onApiKeyChange(apiKey);
      onClose();
    } catch (error) {
      console.error('Error saving API key:', error);
    }
  };

  const openGeminiConsole = () => {
    Linking.openURL('https://aistudio.google.com/app/apikey');
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/80 justify-center items-center p-4">
        <View className="bg-surface w-full max-w-md rounded-2xl overflow-hidden border border-border">
          {/* Header */}
          <View className="p-4 border-b border-border flex-row justify-between items-center">
            <Text className="text-lg font-bold text-foreground">⚙️ Pengaturan</Text>
            <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
              <Text className="text-2xl text-muted">✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView className="p-4">
            {/* API Key Section */}
            <View className="mb-6">
              <Text className="text-sm font-bold text-foreground mb-2">
                🔑 Google Gemini API Key
              </Text>
              <Text className="text-xs text-muted mb-3">
                Diperlukan untuk fitur AI diagnosis. Gratis hingga 60 request/menit.
              </Text>
              
              <View className="flex-row items-center mb-3">
                <TextInput
                  className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-foreground text-sm"
                  placeholder="Masukkan API Key..."
                  placeholderTextColor="#687076"
                  value={apiKey}
                  onChangeText={setApiKey}
                  secureTextEntry={!showKey}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity 
                  className="ml-2 p-2"
                  onPress={() => setShowKey(!showKey)}
                  activeOpacity={0.7}
                >
                  <Text className="text-lg">{showKey ? '👁️' : '🙈'}</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity 
                className="mb-4"
                onPress={openGeminiConsole}
                activeOpacity={0.7}
              >
                <Text className="text-xs text-primary underline">
                  → Dapatkan API Key gratis di Google AI Studio
                </Text>
              </TouchableOpacity>

              {/* Status */}
              <View className={`p-3 rounded-lg ${apiKey ? 'bg-success/20' : 'bg-warning/20'}`}>
                <Text className={`text-xs ${apiKey ? 'text-success' : 'text-warning'}`}>
                  {apiKey ? '✓ API Key tersimpan' : '⚠️ API Key belum diatur'}
                </Text>
              </View>
            </View>

            {/* Info Section */}
            <View className="bg-background/50 rounded-lg p-3 mb-4">
              <Text className="text-xs font-bold text-foreground mb-2">ℹ️ Cara Mendapatkan API Key:</Text>
              <Text className="text-xs text-muted leading-5">
                1. Kunjungi aistudio.google.com/app/apikey{'\n'}
                2. Login dengan akun Google{'\n'}
                3. Klik "Create API Key"{'\n'}
                4. Copy dan paste API key di sini
              </Text>
            </View>

            {/* Privacy Note */}
            <View className="bg-primary/10 rounded-lg p-3 mb-4">
              <Text className="text-xs text-primary">
                🔒 API Key disimpan secara lokal di perangkat Anda dan tidak dikirim ke server manapun kecuali Google.
              </Text>
            </View>
          </ScrollView>

          {/* Footer */}
          <View className="p-4 border-t border-border flex-row gap-3">
            <TouchableOpacity 
              className="flex-1 py-3 rounded-lg bg-surface border border-border items-center"
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Text className="text-sm font-bold text-muted">Batal</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              className="flex-1 py-3 rounded-lg bg-primary items-center"
              onPress={handleSave}
              activeOpacity={0.7}
            >
              <Text className="text-sm font-bold text-white">Simpan</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
