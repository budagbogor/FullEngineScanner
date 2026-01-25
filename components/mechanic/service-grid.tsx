import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Modal, Pressable } from 'react-native';
import { SERVICE_FUNCTIONS } from '@/constants/service-functions';
import { useResponsive } from '@/hooks/use-responsive';

interface ServiceGridProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (label: string) => void;
}

export function ServiceGrid({ visible, onClose, onSelect }: ServiceGridProps) {
  const { isMobile } = useResponsive();
  const numColumns = isMobile ? 4 : 6;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable 
        className="flex-1 bg-black/60 justify-end"
        onPress={onClose}
      >
        <Pressable 
          className="bg-surface border-t border-border rounded-t-3xl max-h-[70%]"
          onPress={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <View className="flex-row justify-between items-center p-4 border-b border-border">
            <Text className="text-sm font-bold text-amber">37+ Special Functions</Text>
            <TouchableOpacity onPress={onClose} className="p-2">
              <Text className="text-muted text-lg">✕</Text>
            </TouchableOpacity>
          </View>

          {/* Grid */}
          <ScrollView className="p-3" showsVerticalScrollIndicator={false}>
            <View className="flex-row flex-wrap">
              {SERVICE_FUNCTIONS.map((svc) => (
                <TouchableOpacity
                  key={svc.id}
                  onPress={() => {
                    onSelect(svc.label);
                    onClose();
                  }}
                  className="items-center justify-center p-2 bg-background rounded-lg border border-border m-1 active:border-amber/50 active:bg-surface"
                  style={{ width: `${100 / numColumns - 2}%`, minHeight: 70 }}
                >
                  <Text className="text-xl mb-1">{svc.icon}</Text>
                  <Text className="text-[9px] text-muted text-center leading-tight">
                    {svc.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <View className="h-8" />
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
