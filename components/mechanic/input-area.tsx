import React from 'react';
import { View, Text, TextInput, TouchableOpacity, Platform } from 'react-native';
import type { VinData, MediaInput, ObdScannerState } from '@/shared/mechanic-types';
import { Image } from 'expo-image';

interface InputAreaProps {
  input: string;
  onInputChange: (text: string) => void;
  selectedMedia: MediaInput | null;
  onClearMedia: () => void;
  decodedVehicle: VinData | null;
  onClearVehicle: () => void;
  isLoading: boolean;
  isListening: boolean;
  isRecording: boolean;
  obdState: ObdScannerState;
  onSubmit: () => void;
  onVoicePress: () => void;
  onRecordStart: () => void;
  onRecordEnd: () => void;
  onImagePress: () => void;
  onServicePress: () => void;
  onObdConnect: () => void;
}

export function InputArea({
  input,
  onInputChange,
  selectedMedia,
  onClearMedia,
  decodedVehicle,
  onClearVehicle,
  isLoading,
  isListening,
  isRecording,
  obdState,
  onSubmit,
  onVoicePress,
  onRecordStart,
  onRecordEnd,
  onImagePress,
  onServicePress,
  onObdConnect,
}: InputAreaProps) {
  return (
    <View className="p-4 border-t border-border bg-surface shadow-md z-10">
      {/* Context Badges */}
      {(decodedVehicle || selectedMedia) && (
        <View className="flex-row flex-wrap gap-2 mb-3">
          {decodedVehicle && (
            <View className="flex-row items-center bg-emerald/20 border border-emerald/30 px-2 py-1 rounded-lg">
              <Text className="text-emerald text-[10px] font-bold">
                ✓ {decodedVehicle.year} {decodedVehicle.model}
              </Text>
              <TouchableOpacity onPress={onClearVehicle} className="ml-2 pl-2 border-l border-emerald/30">
                <Text className="text-emerald text-xs">✕</Text>
              </TouchableOpacity>
            </View>
          )}
          
          {selectedMedia && (
            <View className={`flex-row items-center border rounded-lg overflow-hidden ${
              selectedMedia.mimeType.startsWith('image') 
                ? 'bg-primary/20 border-primary/30' 
                : 'bg-rose/20 border-rose/30'
            }`}>
              {selectedMedia.mimeType.startsWith('image') ? (
                <View className="flex-row items-center">
                  <Image
                    source={{ uri: selectedMedia.data }}
                    style={{ width: 40, height: 40 }}
                    contentFit="cover"
                  />
                  <TouchableOpacity 
                    onPress={onClearMedia} 
                    className="px-2"
                  >
                    <Text className="text-primary text-xs">✕</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View className="flex-row items-center px-2 py-1">
                  <Text className="text-rose text-[10px] font-bold">🔊 Audio Ready</Text>
                  <TouchableOpacity onPress={onClearMedia} className="ml-2 pl-2 border-l border-rose/30">
                    <Text className="text-rose text-xs">✕</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
        </View>
      )}

      {/* Text Input */}
      <TextInput
        value={input}
        onChangeText={onInputChange}
        placeholder={isListening ? "Mendengarkan..." : "Deskripsikan keluhan, suara mesin, atau masukkan VIN..."}
        placeholderTextColor="#64748b"
        multiline
        numberOfLines={3}
        className={`w-full bg-background text-foreground rounded-xl border p-4 text-sm ${
          isListening ? 'border-emerald' : 'border-border'
        }`}
        style={{ minHeight: 80, maxHeight: 120, textAlignVertical: 'top' }}
      />

      {/* Toolbar */}
      <View className="flex-row items-center justify-between gap-2 mt-3">
        <View className="flex-row gap-2">
          {/* Voice Input */}
          <TouchableOpacity 
            onPress={onVoicePress}
            className={`p-2.5 rounded-lg border ${
              isListening 
                ? 'bg-emerald border-emerald' 
                : 'bg-surface border-border'
            }`}
          >
            <Text className={isListening ? 'text-white' : 'text-muted'}>🎤</Text>
          </TouchableOpacity>

          {/* Audio Record */}
          <TouchableOpacity 
            onPressIn={onRecordStart}
            onPressOut={onRecordEnd}
            className={`p-2.5 rounded-lg border ${
              isRecording 
                ? 'bg-rose border-rose' 
                : 'bg-surface border-border'
            }`}
          >
            <Text className={isRecording ? 'text-white' : 'text-muted'}>🎵</Text>
          </TouchableOpacity>

          {/* Image Upload */}
          <TouchableOpacity 
            onPress={onImagePress}
            className={`p-2.5 rounded-lg border ${
              selectedMedia?.mimeType.startsWith('image') 
                ? 'bg-primary/20 border-primary' 
                : 'bg-surface border-border'
            }`}
          >
            <Text className={selectedMedia?.mimeType.startsWith('image') ? 'text-primary' : 'text-muted'}>📷</Text>
          </TouchableOpacity>

          {/* Service Functions */}
          <TouchableOpacity 
            onPress={onServicePress}
            className="p-2.5 rounded-lg border bg-surface border-border"
          >
            <Text className="text-amber">🔧</Text>
          </TouchableOpacity>

          {/* OBD Connect */}
          {!obdState.isConnected && (
            <TouchableOpacity 
              onPress={onObdConnect}
              disabled={obdState.isConnecting}
              className={`p-2.5 rounded-lg border ${
                obdState.isConnecting 
                  ? 'bg-purple/20 border-purple' 
                  : 'bg-surface border-border'
              }`}
            >
              <Text className={obdState.isConnecting ? 'text-purple' : 'text-muted'}>
                {obdState.isConnecting ? '↻' : '⚡'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Submit Button */}
        <TouchableOpacity 
          onPress={onSubmit}
          disabled={isLoading || (!input.trim() && !selectedMedia)}
          className={`bg-primary px-6 py-2.5 rounded-lg flex-row items-center gap-2 ${
            (isLoading || (!input.trim() && !selectedMedia)) ? 'opacity-50' : ''
          }`}
        >
          <Text className="text-white font-bold">Analisa</Text>
          <Text className="text-white">➤</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
