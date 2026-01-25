import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useResponsive } from '@/hooks/use-responsive';

type Section = 'workflow' | 'guide' | 'tips';

export function Documentation() {
  const [activeSection, setActiveSection] = useState<Section>('workflow');
  const { isDesktop } = useResponsive();

  return (
    <ScrollView 
      className="flex-1 bg-background"
      showsVerticalScrollIndicator={false}
    >
      <View className={`p-6 ${isDesktop ? 'max-w-4xl mx-auto' : ''}`}>
        {/* Header */}
        <View className="mb-8 border-b border-border pb-6">
          <Text className="text-3xl font-bold text-foreground mb-2">Mechanic Co-Pilot Manual</Text>
          <Text className="text-muted text-base">
            Panduan sistematis penggunaan Super App untuk efisiensi diagnosa dan akurasi perbaikan.
          </Text>
        </View>

        {/* Tabs */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          className="mb-8"
        >
          {[
            { id: 'workflow', label: '⚡ Workflow Mekanik' },
            { id: 'guide', label: '📖 Cara Penggunaan' },
            { id: 'tips', label: '🛠️ Engineering Master Class' }
          ].map((tab) => (
            <TouchableOpacity
              key={tab.id}
              onPress={() => setActiveSection(tab.id as Section)}
              className={`px-4 py-2 rounded-lg mr-3 ${
                activeSection === tab.id 
                  ? 'bg-primary' 
                  : 'bg-surface'
              }`}
            >
              <Text className={`text-sm font-bold ${
                activeSection === tab.id ? 'text-white' : 'text-muted'
              }`}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Workflow Section */}
        {activeSection === 'workflow' && (
          <View>
            <Text className="text-2xl font-bold text-foreground mb-6 flex-row items-center">
              <Text className="text-emerald mr-3">01</Text>
              Alur Kerja Ideal (The Perfect Loop)
            </Text>

            {/* Visual Flow */}
            <View className="bg-background border border-border rounded-xl p-4 mb-8">
              <View className={`${isDesktop ? 'flex-row justify-between' : 'flex-col gap-4'}`}>
                {[
                  { icon: '🔍', label: '1. Scan & Input', color: 'primary' },
                  { icon: '⚡', label: '2. AI Analysis', color: 'amber' },
                  { icon: '⚙️', label: '3. Execution', color: 'purple' },
                  { icon: '✓', label: '4. Reset & QC', color: 'emerald' },
                ].map((step, idx) => (
                  <View key={idx} className="items-center">
                    <View className={`w-12 h-12 rounded-full bg-${step.color}/20 items-center justify-center mb-2`}>
                      <Text className="text-xl">{step.icon}</Text>
                    </View>
                    <Text className="text-xs font-bold text-muted text-center">{step.label}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Steps Detail */}
            <View className={isDesktop ? 'flex-row flex-wrap' : ''}>
              {[
                { title: '1. Initial Scan (Pra-Diagnosa)', desc: 'Hubungkan OBD. Baca DTC Code. Masukkan keluhan pelanggan dan foto STNK/Fisik mobil ke aplikasi.', color: 'primary' },
                { title: '2. AI Analysis & Verification', desc: 'Biarkan AI menganalisa hubungan antara DTC + Keluhan. Verifikasi Wiring Diagram dan TSB yang muncul.', color: 'amber' },
                { title: '3. Execution (SOP & Parts)', desc: 'Ikuti SOP langkah demi langkah. Cek Torsi baut. Pesan sparepart sesuai rekomendasi Part Number.', color: 'purple' },
                { title: '4. Final QC & Reset', desc: 'Gunakan fitur "Service Func" untuk Reset Oli/SAS/Throttle. Hapus DTC. Test drive.', color: 'emerald' },
              ].map((item, idx) => (
                <View key={idx} className={`bg-surface p-4 rounded-lg border-l-4 border-${item.color} mb-4 ${isDesktop ? 'w-[48%] mr-[2%]' : ''}`}>
                  <Text className="font-bold text-foreground mb-2">{item.title}</Text>
                  <Text className="text-sm text-muted">{item.desc}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Guide Section */}
        {activeSection === 'guide' && (
          <View>
            {/* Multimodal Feature */}
            <View className="bg-primary/10 border border-primary/30 p-6 rounded-xl mb-8">
              <Text className="text-xl font-bold text-primary mb-2">Fitur Utama: Multimodal Input</Text>
              <Text className="text-sm text-muted mb-4">Aplikasi ini bisa "Melihat" dan "Mendengar". Jangan hanya mengetik.</Text>
              
              <View className={isDesktop ? 'flex-row gap-4' : ''}>
                {[
                  { icon: '📸', title: 'Visual Diagnosis', desc: 'Foto komponen rembes, kabel putus, atau STNK untuk auto-detect mobil.' },
                  { icon: '🎙️', title: 'Voice Command', desc: 'Tekan mic saat tangan kotor. "Carikan torsi cylinder head Innova Diesel".' },
                  { icon: '🔊', title: 'Sound Analysis', desc: 'Rekam suara mesin kasar. AI akan menganalisa pola suara (knocking/hissing).' },
                ].map((item, idx) => (
                  <View key={idx} className={`items-center text-center ${isDesktop ? 'flex-1' : 'mb-4'}`}>
                    <Text className="text-4xl mb-2">{item.icon}</Text>
                    <Text className="font-bold text-foreground text-sm">{item.title}</Text>
                    <Text className="text-xs text-muted mt-1 text-center">{item.desc}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Steps */}
            {[
              { icon: '📱', title: 'Langkah 1: Koneksi OBD (vLinker MC+)', steps: ['Pastikan Bluetooth HP aktif.', 'Colok vLinker ke port OBD-II mobil.', 'Tekan tombol Connect OBD di sidebar.', 'Tunggu status CONNECTED.'] },
              { icon: '📝', title: 'Langkah 2: Deskripsi Keluhan', steps: ['Ketik keluhan pelanggan dengan detail.', 'Gunakan voice input jika tangan kotor.', 'Lampirkan foto jika perlu.', 'Tekan tombol Analisa.'] },
              { icon: '📊', title: 'Langkah 3: Baca Hasil Diagnosa', steps: ['Review diagnosis dari AI.', 'Cek DTC codes dan TSB.', 'Lihat estimasi biaya.', 'Ikuti SOP perbaikan.'] },
            ].map((section, idx) => (
              <View key={idx} className="flex-row gap-4 items-start mb-6">
                <View className="w-16 h-16 bg-surface rounded-xl items-center justify-center border border-border">
                  <Text className="text-2xl">{section.icon}</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-lg font-bold text-foreground mb-2">{section.title}</Text>
                  {section.steps.map((step, i) => (
                    <Text key={i} className="text-sm text-muted mb-1">• {step}</Text>
                  ))}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Tips Section */}
        {activeSection === 'tips' && (
          <View>
            <View className="bg-indigo/10 border border-indigo/30 p-6 rounded-xl mb-8">
              <Text className="text-xl font-bold text-indigo mb-2">Engineering Mode: Advanced Functions</Text>
              <Text className="text-sm text-muted">
                Fitur ini memungkinkan Anda mengirim command HEX langsung ke ECU kendaraan melalui vLinker MC+.
              </Text>
            </View>

            {/* Protocol Info */}
            <View className="mb-6">
              <Text className="text-lg font-bold text-foreground mb-4">Protocol yang Didukung</Text>
              <View className={isDesktop ? 'flex-row gap-4' : ''}>
                {[
                  { name: 'UDS (ISO 14229)', desc: 'Service $31 (Routine Control), $2F (IO Control), $2E (Write Data)' },
                  { name: 'OBD-II (SAE J1979)', desc: 'Mode $01-$0A untuk data real-time dan DTC' },
                  { name: 'CAN Protocol', desc: 'SW-CAN, MS-CAN, HS-CAN untuk berbagai pabrikan' },
                ].map((proto, idx) => (
                  <View key={idx} className={`bg-surface p-4 rounded-lg border border-border mb-3 ${isDesktop ? 'flex-1' : ''}`}>
                    <Text className="font-bold text-foreground mb-1">{proto.name}</Text>
                    <Text className="text-xs text-muted">{proto.desc}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Safety Warning */}
            <View className="bg-error/10 border border-error/30 p-4 rounded-xl">
              <Text className="text-error font-bold mb-2">⚠️ Peringatan Keamanan</Text>
              <Text className="text-muted text-sm">
                Penggunaan Engineering Mode yang tidak tepat dapat menyebabkan kerusakan permanen pada ECU kendaraan. 
                Selalu pastikan Anda memahami command yang akan dikirim dan kondisi pre-requisite yang diperlukan.
              </Text>
            </View>
          </View>
        )}

        <View className="h-20" />
      </View>
    </ScrollView>
  );
}
