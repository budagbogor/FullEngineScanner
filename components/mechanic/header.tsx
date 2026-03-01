import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface HeaderProps {
  isConnected: boolean;
  hasHistory: boolean;
  hasApiKey: boolean;
  onClearHistory: () => void;
  onOpenSettings: () => void;
}

export function Header({ isConnected, hasHistory, hasApiKey, onClearHistory, onOpenSettings }: HeaderProps) {
  return (
    <View className="px-4 py-3 border-b border-border bg-surface flex-row items-center justify-between">
      <View className="flex-row items-center gap-3">
        {/* Logo */}
        <View className="w-10 h-10 rounded-lg overflow-hidden shadow-lg">
          <LinearGradient
            colors={['#3b82f6', '#6366f1']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
          >
            <Text className="text-white text-lg">⚙️</Text>
          </LinearGradient>
        </View>

        {/* Title */}
        <View>
          <Text className="font-bold text-foreground text-base leading-tight">
            Mechanic Co-Pilot
          </Text>
          <View className="flex-row items-center gap-1 mt-0.5">
            <View className="bg-indigo px-1.5 py-0.5 rounded">
              <Text className="text-[9px] text-white font-bold">Pro Scanner</Text>
            </View>
            {isConnected && (
              <View className="bg-emerald/20 px-1.5 py-0.5 rounded">
                <Text className="text-[9px] text-emerald font-bold">CONNECTED</Text>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* Right Actions */}
      <View className="flex-row items-center gap-2">
        {/* Settings Button */}
        <TouchableOpacity
          onPress={onOpenSettings}
          className="p-2 rounded-lg active:bg-surface"
          activeOpacity={0.7}
        >
          <View className="relative">
            <Text className="text-muted text-lg">⚙️</Text>
            {!hasApiKey && (
              <View className="absolute -top-1 -right-1 w-2 h-2 bg-warning rounded-full" />
            )}
          </View>
        </TouchableOpacity>

        {/* Clear History Button */}
        {hasHistory && (
          <TouchableOpacity
            onPress={onClearHistory}
            className="p-2 rounded-lg active:bg-surface"
            activeOpacity={0.7}
          >
            <Text className="text-muted text-lg">🗑️</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
