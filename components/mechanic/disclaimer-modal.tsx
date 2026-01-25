import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { cn } from '@/lib/utils';

interface DisclaimerModalProps {
  visible: boolean;
  onAccept: () => void;
}

export function DisclaimerModal({ visible, onAccept }: DisclaimerModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <View className="flex-1 bg-black/80 justify-center items-center p-4">
        <View className="bg-surface border border-border rounded-2xl max-w-lg w-full p-6 shadow-2xl">
          {/* Header */}
          <View className="flex-row items-center gap-3 mb-4">
            <View className="w-10 h-10 bg-error/20 rounded-full items-center justify-center border border-error/50">
              <Text className="text-error text-lg">⚠️</Text>
            </View>
            <Text className="text-xl font-bold text-foreground">
              Professional Liability Agreement
            </Text>
          </View>

          {/* Content */}
          <ScrollView 
            className="bg-background rounded-lg p-4 mb-6 max-h-60"
            showsVerticalScrollIndicator={true}
          >
            <Text className="text-sm text-muted mb-3">
              <Text className="font-bold text-foreground">1. Alat Bantu, Bukan Pengganti:</Text>
              {' '}Aplikasi ini adalah alat bantu Artificial Intelligence (AI). Hasil diagnosa, wiring diagram, dan spesifikasi torsi mungkin memiliki ketidakakuratan. Selalu verifikasi dengan Manual Servis Resmi (Factory Service Manual).
            </Text>
            
            <Text className="text-sm text-muted mb-3">
              <Text className="font-bold text-foreground">2. Risiko Engineering Mode:</Text>
              {' '}Penggunaan fitur manipulasi ECU (Reset/Coding/UDS) memiliki risiko kerusakan permanen pada modul kendaraan jika tidak dilakukan dengan benar. Pengguna bertanggung jawab penuh atas segala dampak yang timbul.
            </Text>
            
            <Text className="text-sm text-muted mb-3">
              <Text className="font-bold text-foreground">3. Pembebasan Tanggung Jawab:</Text>
              {' '}Pengembang aplikasi tidak bertanggung jawab atas kerusakan kendaraan, cedera pribadi, atau kerugian finansial yang diakibatkan oleh penggunaan saran dari aplikasi ini.
            </Text>
            
            <Text className="text-sm text-muted">
              <Text className="font-bold text-foreground">4. Keselamatan Kerja:</Text>
              {' '}Selalu gunakan APD dan prosedur keselamatan bengkel (Safety Stand, Wheel Chock, Battery Disconnect) saat bekerja.
            </Text>
          </ScrollView>

          {/* Accept Button */}
          <TouchableOpacity
            onPress={onAccept}
            className="w-full bg-primary py-4 rounded-xl active:opacity-80"
          >
            <Text className="text-background font-bold text-center text-base">
              SAYA MENGERTI & SETUJU
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
