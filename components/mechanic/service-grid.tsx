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
  const numColumns = isMobile ? 3 : 5;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable 
        className="flex-1 bg-foreground/20 backdrop-blur-sm justify-end"
        onPress={onClose}
      >
        <Pressable 
          className="bg-surface border-t border-border rounded-t-3xl max-h-[85%] shadow-2xl"
          onPress={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <View className="flex-row justify-between items-center p-5 border-b border-border shadow-sm z-10">
            <Text className="text-base font-bold text-amber">37+ Special Functions</Text>
            <TouchableOpacity onPress={onClose} className="p-2">
              <Text className="text-muted text-xl">✕</Text>
            </TouchableOpacity>
          </View>

          {/* Grid */}
          <ScrollView className="p-4" showsVerticalScrollIndicator={false}>
            <View className="flex-row flex-wrap justify-center">
              {SERVICE_FUNCTIONS.map((svc) => (
                <TouchableOpacity
                  key={svc.id}
                  onPress={() => {
                    onSelect(svc.label);
                    onClose();
                  }}
                  className="items-center justify-center p-4 bg-background rounded-xl border border-border m-2 shadow-sm active:border-amber/50 active:bg-surface hover:border-amber/30 hover:shadow-md transition-all"
                  style={{ width: `${100 / numColumns - 4}%`, minHeight: 110 }}
                >
                  <Text className="text-4xl mb-3">{svc.icon}</Text>
                  <Text className="text-xs font-bold text-foreground text-center leading-tight">
                    {svc.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <View className="h-10" />
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
