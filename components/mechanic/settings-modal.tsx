import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, ScrollView, Linking, ActivityIndicator } from 'react-native';
import { StorageService } from '@/lib/services/storage-service';
import type { AppSettings, AIProvider } from '@/shared/mechanic-types';
import { testAiConnection } from '@/lib/services/gemini-service';

interface SettingsModalProps {
  visible: boolean;
  onClose: () => void;
  onSettingsChange: (settings: AppSettings) => void;
  currentSettings: AppSettings;
}

export function SettingsModal({ visible, onClose, onSettingsChange, currentSettings }: SettingsModalProps) {
  const [settings, setSettings] = useState<AppSettings>(currentSettings);
  const [showGeminiKey, setShowGeminiKey] = useState(false);
  const [showSumopodKey, setShowSumopodKey] = useState(false);
  
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<'none' | 'success' | 'failed'>('none');

  useEffect(() => {
    setSettings(currentSettings);
  }, [currentSettings]);

  const handleSave = async () => {
    try {
      await StorageService.saveSettings(settings);
      onSettingsChange(settings);
      onClose();
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  };

  const openGeminiConsole = () => {
    Linking.openURL('https://aistudio.google.com/app/apikey');
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult('none');
    try {
      const success = await testAiConnection(settings);
      setTestResult(success ? 'success' : 'failed');
    } catch (error) {
      setTestResult('failed');
    } finally {
      setIsTesting(false);
    }
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
            {/* Provider Selection */}
            <View className="mb-6">
              <Text className="text-sm font-bold text-foreground mb-3">Pilih Provider AI</Text>
              <View className="flex-row gap-3">
                <TouchableOpacity 
                  className={`flex-1 p-3 rounded-lg border ${settings.provider === 'gemini' ? 'border-primary bg-primary/10' : 'border-border bg-background'}`}
                  onPress={() => setSettings({ ...settings, provider: 'gemini' })}
                >
                  <Text className={`text-center font-bold ${settings.provider === 'gemini' ? 'text-primary' : 'text-foreground'}`}>Google Gemini</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  className={`flex-1 p-3 rounded-lg border ${settings.provider === 'sumopod' ? 'border-primary bg-primary/10' : 'border-border bg-background'}`}
                  onPress={() => setSettings({ ...settings, provider: 'sumopod' })}
                >
                  <Text className={`text-center font-bold ${settings.provider === 'sumopod' ? 'text-primary' : 'text-foreground'}`}>Sumopod</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Gemini Section */}
            {settings.provider === 'gemini' && (
              <View className="mb-6">
                <Text className="text-sm font-bold text-foreground mb-2">🔑 Google Gemini API Key</Text>
                <View className="flex-row items-center mb-3">
                  <TextInput
                    className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-foreground text-sm"
                    placeholder="Masukkan API Key Gemini..."
                    placeholderTextColor="#687076"
                    value={settings.geminiApiKey}
                    onChangeText={(val) => setSettings({ ...settings, geminiApiKey: val })}
                    secureTextEntry={!showGeminiKey}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <TouchableOpacity className="ml-2 p-2" onPress={() => setShowGeminiKey(!showGeminiKey)}>
                    <Text className="text-lg">{showGeminiKey ? '👁️' : '🙈'}</Text>
                  </TouchableOpacity>
                </View>
                <TouchableOpacity className="mb-4" onPress={openGeminiConsole}>
                  <Text className="text-xs text-primary underline">→ Dapatkan API Key gratis di Google AI Studio</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Sumopod Section */}
            {settings.provider === 'sumopod' && (
              <View className="mb-6">
                <Text className="text-sm font-bold text-foreground mb-2">🔑 Sumopod API Key</Text>
                <View className="flex-row items-center mb-4">
                  <TextInput
                    className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-foreground text-sm"
                    placeholder="Masukkan API Key Sumopod..."
                    placeholderTextColor="#687076"
                    value={settings.sumopodApiKey}
                    onChangeText={(val) => setSettings({ ...settings, sumopodApiKey: val })}
                    secureTextEntry={!showSumopodKey}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <TouchableOpacity className="ml-2 p-2" onPress={() => setShowSumopodKey(!showSumopodKey)}>
                    <Text className="text-lg">{showSumopodKey ? '👁️' : '🙈'}</Text>
                  </TouchableOpacity>
                </View>

                <Text className="text-sm font-bold text-foreground mb-2">🌐 Sumopod API Endpoint (Opsional)</Text>
                <View className="flex-row items-center mb-4">
                  <TextInput
                    className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-foreground text-sm"
                    placeholder="Contoh: https://api.openai.com/v1"
                    placeholderTextColor="#687076"
                    value={settings.sumopodBaseUrl}
                    onChangeText={(val) => setSettings({ ...settings, sumopodBaseUrl: val })}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>

                <Text className="text-sm font-bold text-foreground mb-2">🤖 Pilihan Model</Text>
                <View className="flex-row flex-wrap gap-2 mb-4">
                  {[
                    'gpt-4o', 'gpt-4o-mini', 'gpt-5-mini', 
                    'claude-sonnet-5', 'claude-haiku-4-5',
                    'deepseek-v4-pro', 'deepseek-v4-flash',
                    'gemini/gemini-3.5-flash', 'qwen3.7-max'
                  ].map((m) => (
                    <TouchableOpacity 
                      key={m}
                      className={`px-3 py-2 rounded-lg border ${settings.sumopodModel === m ? 'border-primary bg-primary/10' : 'border-border bg-background'}`}
                      onPress={() => setSettings({ ...settings, sumopodModel: m })}
                    >
                      <Text className={`text-xs ${settings.sumopodModel === m ? 'text-primary font-bold' : 'text-foreground'}`}>{m}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <View className="bg-background border border-border rounded-lg p-1">
                  <TextInput
                    className="px-3 py-2 text-foreground text-sm"
                    placeholder="Atau ketik model lainnya..."
                    placeholderTextColor="#687076"
                    value={settings.sumopodModel}
                    onChangeText={(val) => setSettings({ ...settings, sumopodModel: val })}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
              </View>
            )}

            {/* Save Scope & Test Connection */}
            <View className="bg-background/50 rounded-lg p-4 mb-4 border border-border">
              <Text className="text-sm font-bold text-foreground mb-3">Opsi Penyimpanan</Text>
              <View className="flex-row gap-3 mb-4">
                <TouchableOpacity 
                  className={`flex-1 py-2 rounded-lg border ${settings.saveScope === 'local' ? 'border-primary bg-primary/10' : 'border-border bg-surface'}`}
                  onPress={() => setSettings({ ...settings, saveScope: 'local' })}
                >
                  <Text className={`text-center text-xs font-bold ${settings.saveScope === 'local' ? 'text-primary' : 'text-muted'}`}>Lokal (Sesi Ini)</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  className={`flex-1 py-2 rounded-lg border ${settings.saveScope === 'global' ? 'border-primary bg-primary/10' : 'border-border bg-surface'}`}
                  onPress={() => setSettings({ ...settings, saveScope: 'global' })}
                >
                  <Text className={`text-center text-xs font-bold ${settings.saveScope === 'global' ? 'text-primary' : 'text-muted'}`}>Global (Tersimpan)</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity 
                className={`py-3 rounded-lg flex-row justify-center items-center ${isTesting ? 'bg-surface' : 'bg-[#2563eb]'}`}
                onPress={handleTestConnection}
                disabled={isTesting}
              >
                {isTesting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text className="text-sm font-bold text-white">🔌 Test Koneksi AI</Text>
                )}
              </TouchableOpacity>
              
              {testResult !== 'none' && (
                <Text className={`text-center mt-3 font-bold text-xs ${testResult === 'success' ? 'text-success' : 'text-warning'}`}>
                  {testResult === 'success' ? '✓ Koneksi Berhasil!' : '⚠️ Koneksi Gagal. Cek API Key & Internet.'}
                </Text>
              )}
            </View>

            {/* Privacy Note */}
            <View className="bg-primary/10 rounded-lg p-3 mb-4">
              <Text className="text-xs text-primary">
                🔒 API Key disimpan secara aman di perangkat Anda.
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
