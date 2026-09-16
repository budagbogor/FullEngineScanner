import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { Image } from 'expo-image';
import type { MechanicResponse, DTCItem, TSBItem } from '@/shared/mechanic-types';
import { useResponsive } from '@/hooks/use-responsive';
import { LinearGradient } from 'expo-linear-gradient';

interface JobCardProps {
  data: MechanicResponse;
  onLoadHex?: (hex: string) => void;
}

export function JobCard({ data, onLoadHex }: JobCardProps) {
  const { isMobile, isDesktop } = useResponsive();
  const [imgError, setImgError] = useState(false);
  const [activeTab, setActiveTab] = useState<'specs' | 'parts' | 'wiring' | 'videos'>('specs');
  const [safetyConfirmed, setSafetyConfirmed] = useState(false);
  const [selectedDtc, setSelectedDtc] = useState<DTCItem | null>(null);

  const getSearchableVehicle = () => {
    if (!data.vehicle_info) return "Unknown Vehicle";
    let info = "";
    if (typeof data.vehicle_info === 'string') {
      info = data.vehicle_info;
    } else if (typeof data.vehicle_info === 'object') {
      info = Object.values(data.vehicle_info).filter(v => typeof v === 'string' || typeof v === 'number').join(' ');
    } else {
      info = String(data.vehicle_info);
    }
    return info.split(' ').slice(0, 3).join(' ');
  };

  const getDisplayVehicle = () => {
    if (!data.vehicle_info) return "Unknown Vehicle";
    if (typeof data.vehicle_info === 'string') return data.vehicle_info;
    if (typeof data.vehicle_info === 'object') {
      return Object.values(data.vehicle_info).filter(v => typeof v === 'string' || typeof v === 'number').join(' ');
    }
    return String(data.vehicle_info);
  };

  const cleanVehicleName = getSearchableVehicle();

  const stringToSeed = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  };

  const seed = stringToSeed(cleanVehicleName);
  const vehicleImageUrl = `https://image.pollinations.ai/prompt/realistic%20automotive%20photography%20of%20${encodeURIComponent(cleanVehicleName)}%20car%20studio%20lighting%20side%20profile%20on%20dark%20background?width=320&height=180&nologo=true&seed=${seed}`;

  const openSearch = (query: string, type: 'diagram' | 'photo' | 'tool') => {
    let suffix = "";
    if (type === 'diagram') {
      suffix = " diagram mounting location exploded view service manual";
    } else if (type === 'tool') {
      suffix = " automotive tool";
    }
    const finalQuery = `${query}${suffix}`;
    const url = `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(finalQuery)}`;
    Linking.openURL(url);
  };

  return (
    <ScrollView 
      className="flex-1 bg-background"
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View className="bg-primary/10 border-b border-primary/20 p-4">
        <View className={`flex-row items-center gap-4 ${isDesktop ? 'max-w-4xl mx-auto' : ''}`}>
          {/* Vehicle Image */}
          <View className="w-24 h-16 bg-surface rounded-lg overflow-hidden border border-border">
            {!imgError ? (
              <Image
                source={{ uri: vehicleImageUrl }}
                style={{ width: '100%', height: '100%' }}
                contentFit="cover"
                onError={() => setImgError(true)}
              />
            ) : (
              <View className="flex-1 items-center justify-center">
                <Text className="text-muted text-2xl">🚗</Text>
              </View>
            )}
          </View>
          
          {/* Vehicle Info */}
          <View className="flex-1">
            <Text className="text-primary text-[10px] font-bold uppercase tracking-wider mb-0.5">
              Vehicle Identification
            </Text>
            <Text className="text-lg font-bold text-foreground leading-tight" numberOfLines={2}>
              {getDisplayVehicle()}
            </Text>
            <View className="flex-row gap-2 mt-1">
              <View className="bg-surface border border-border rounded px-1.5 py-0.5">
                <Text className="text-[10px] text-muted font-mono">{data.component_id}</Text>
              </View>
              {data.estimated_work_time && (
                <View className="bg-surface border border-border rounded px-1.5 py-0.5">
                  <Text className="text-[10px] text-emerald font-bold">⏱ {data.estimated_work_time}</Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </View>

      <View className={`p-4 ${isDesktop ? 'max-w-4xl mx-auto' : ''}`}>
        {/* Cost Estimation */}
        {data.cost_estimation && (
          <View className="bg-surface rounded-xl border border-border p-4 mb-6">
            <View className={`${isMobile ? 'flex-col gap-3' : 'flex-row'}`}>
              <View className={isMobile ? '' : 'flex-1'}>
                <Text className="text-[10px] text-muted uppercase font-bold mb-1">Total Estimate</Text>
                <Text className="text-emerald font-mono font-bold text-xl">{data.cost_estimation.total_estimate}</Text>
              </View>
              <View className={isMobile ? '' : 'flex-1'}>
                <Text className="text-[10px] text-muted uppercase font-bold mb-1">Parts Cost</Text>
                <Text className="text-foreground font-mono font-bold">{data.cost_estimation.parts_total}</Text>
              </View>
              <View className={isMobile ? '' : 'flex-1'}>
                <Text className="text-[10px] text-muted uppercase font-bold mb-1">Labor Cost</Text>
                <Text className="text-foreground font-mono font-bold">{data.cost_estimation.labor_cost}</Text>
              </View>
              <View className={isMobile ? '' : 'flex-1'}>
                <Text className="text-[10px] text-muted uppercase font-bold mb-1">Rate/Hour</Text>
                <Text className="text-muted font-mono font-bold">{data.cost_estimation.hourly_rate}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Diagnosis */}
        <View className={`mb-6 ${isDesktop ? 'flex-row gap-6' : ''}`}>
          <View className={isDesktop ? 'flex-1' : 'mb-4'}>
            <View className="flex-row items-center mb-3 border-b border-amber/20 pb-2">
              <Text className="text-amber font-bold uppercase tracking-wide text-xs">
                📋 Expert Diagnosis
              </Text>
            </View>
            {Array.isArray(data.diagnosis) && data.diagnosis.length > 0 ? data.diagnosis.map((diag, idx) => (
              <View key={idx} className="flex-row items-start bg-surface/50 p-2 rounded mb-2">
                <Text className="text-primary mr-2">•</Text>
                <Text className="text-muted text-sm flex-1">{diag}</Text>
              </View>
            )) : typeof data.diagnosis === 'string' && (data.diagnosis as any).trim() !== '' ? (
              <View className="flex-row items-start bg-surface/50 p-2 rounded mb-2">
                <Text className="text-primary mr-2">•</Text>
                <Text className="text-muted text-sm flex-1">{data.diagnosis as any}</Text>
              </View>
            ) : (
              <Text className="text-muted text-xs italic">Data diagnosa belum tersedia.</Text>
            )}
            {data.manual_summary && (
              <View className="mt-3 border-l-2 border-primary pl-3">
                <Text className="text-muted italic text-sm">"{data.manual_summary}"</Text>
              </View>
            )}
          </View>

          {/* DTC List */}
          <View className={isDesktop ? 'flex-1' : ''}>
            <View className="flex-row items-center mb-3 border-b border-error/20 pb-2">
              <Text className="text-error font-bold uppercase tracking-wide text-xs">
                ⚠️ DTC & TSB Analysis
              </Text>
            </View>
            {Array.isArray(data.dtc_list) && data.dtc_list.length > 0 ? (
              data.dtc_list.map((dtc, idx) => (
                <TouchableOpacity
                  key={idx}
                  onPress={() => setSelectedDtc(dtc)}
                  className="bg-surface border border-border rounded p-2 mb-2 active:border-error/50"
                >
                  <View className="flex-row justify-between items-center mb-1">
                    <Text className="text-error font-bold font-mono text-sm">{dtc.code}</Text>
                    <Text className="text-[10px] bg-surface px-1.5 rounded text-muted">↗ Detail</Text>
                  </View>
                  <Text className="text-xs text-foreground font-bold" numberOfLines={1}>{dtc.definition}</Text>
                </TouchableOpacity>
              ))
            ) : (
              <Text className="text-xs text-muted italic">Tidak ada kode DTC spesifik.</Text>
            )}
          </View>
        </View>

        {/* Technical Tabs */}
        <View className="bg-surface border border-border rounded-xl overflow-hidden mb-6">
          {/* Tab Headers */}
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            className="border-b border-border bg-background"
          >
            {[
              { id: 'specs', label: 'Specs & Torsi', color: 'primary' },
              { id: 'parts', label: 'Parts & Tools', color: 'emerald' },
              { id: 'wiring', label: 'Wiring', color: 'amber' },
              { id: 'videos', label: 'Tutorials', color: 'rose' },
            ].map((tab) => (
              <TouchableOpacity
                key={tab.id}
                onPress={() => setActiveTab(tab.id as any)}
                className={`px-4 py-3 ${activeTab === tab.id ? 'bg-surface border-b-2 border-' + tab.color : ''}`}
              >
                <Text className={`text-xs font-bold uppercase ${activeTab === tab.id ? 'text-' + tab.color : 'text-muted'}`}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Tab Content */}
          <View className="p-4 min-h-[200px]">
            {activeTab === 'specs' && (
              <View className={isDesktop ? 'flex-row gap-8' : ''}>
                {/* Torque Specs */}
                <View className={isDesktop ? 'flex-1' : 'mb-6'}>
                  <Text className="text-muted text-xs font-bold uppercase mb-3">🔩 Torque Specifications</Text>
                  {Array.isArray(data.torque_specs) && data.torque_specs.length > 0 ? (
                    data.torque_specs.map((spec, i) => (
                      <TouchableOpacity
                        key={i}
                        onPress={() => openSearch(`${cleanVehicleName} ${spec.part}`, 'diagram')}
                        className="flex-row justify-between items-center bg-background p-2 rounded mb-1 active:bg-surface"
                      >
                        <Text className="text-foreground text-xs flex-1" numberOfLines={1}>{spec.part}</Text>
                        <Text className="text-cyan font-mono text-xs ml-2">{spec.value}</Text>
                        <Text className="text-muted text-xs ml-2">{spec.size || '-'}</Text>
                      </TouchableOpacity>
                    ))
                  ) : (
                    <Text className="text-muted text-xs italic">Data torsi tidak tersedia.</Text>
                  )}
                </View>

                {/* Maintenance Data */}
                <View className={isDesktop ? 'flex-1' : ''}>
                  <Text className="text-muted text-xs font-bold uppercase mb-3">🛢️ Fluids & Maintenance</Text>
                  {Array.isArray(data.maintenance_data) && data.maintenance_data.map((item, i) => (
                    <View key={i} className="flex-row justify-between items-center bg-background p-2 rounded mb-1 border border-border">
                      <View className="flex-1">
                        <Text className="text-foreground text-xs font-bold">{item.item}</Text>
                        <Text className="text-[10px] text-muted">{item.spec}</Text>
                      </View>
                      <Text className="text-purple font-mono text-xs font-bold">{item.value}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {activeTab === 'parts' && (
              <View className={isDesktop ? 'flex-row gap-8' : ''}>
                {/* Tools */}
                <View className={isDesktop ? 'flex-1' : 'mb-6'}>
                  <Text className="text-muted text-xs font-bold uppercase mb-3">🔧 Required Tools (SST)</Text>
                  <View className="flex-row flex-wrap">
                    {Array.isArray(data.tools_list) && data.tools_list.map((tool, i) => (
                      <TouchableOpacity
                        key={i}
                        onPress={() => openSearch(tool, 'tool')}
                        className="bg-background border border-border rounded px-2 py-1.5 m-0.5 active:border-emerald/50"
                      >
                        <Text className="text-muted text-xs">{tool}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Parts */}
                <View className={isDesktop ? 'flex-1' : ''}>
                  <Text className="text-muted text-xs font-bold uppercase mb-3">🛒 Parts Suggestion</Text>
                  {Array.isArray(data.maintenance_data) && data.maintenance_data.some(i => Array.isArray(i.aftermarket_parts) && i.aftermarket_parts.length > 0) ? (
                    data.maintenance_data.map((item, i) => (
                      Array.isArray(item.aftermarket_parts) && item.aftermarket_parts.length > 0 && (
                        <View key={i} className="mb-3">
                          <Text className="text-[10px] text-muted font-bold uppercase border-b border-border pb-1 mb-2">{item.item}</Text>
                          {item.aftermarket_parts.map((part, j) => (
                            <View key={`${i}-${j}`} className="flex-row justify-between items-center bg-background p-2 rounded border border-border mb-1">
                              <View>
                                <Text className="text-foreground text-xs font-bold">{part.brand}</Text>
                                <Text className="text-[9px] text-muted font-mono">{part.part_number}</Text>
                              </View>
                              <Text className="text-emerald text-xs font-bold">{part.estimated_price}</Text>
                            </View>
                          ))}
                        </View>
                      )
                    ))
                  ) : (
                    <Text className="text-muted text-xs italic">Data aftermarket tidak tersedia.</Text>
                  )}
                </View>
              </View>
            )}

            {activeTab === 'wiring' && (
              <View className="items-center py-6">
                <Text className="text-4xl mb-3">🔌</Text>
                <Text className="text-foreground font-bold mb-2">Wiring Diagram Reference</Text>
                <Text className="text-muted text-sm text-center mb-4 max-w-sm">
                  Karena diagram kelistrikan OEM dilindungi hak cipta, kami mengarahkan Anda ke pencarian spesifik.
                </Text>
                <TouchableOpacity
                  onPress={() => openSearch(`${cleanVehicleName} ${data.component_name}`, 'diagram')}
                  className="bg-primary px-6 py-3 rounded-lg"
                >
                  <Text className="text-white font-bold">🔍 Cari Diagram di Google</Text>
                </TouchableOpacity>
                {data.wiring_diagram_desc && (
                  <View className="mt-4 bg-background p-4 rounded-lg border border-amber/20 w-full">
                    <Text className="text-amber text-xs font-bold uppercase mb-2">System Description</Text>
                    <Text className="text-muted text-sm">{data.wiring_diagram_desc}</Text>
                  </View>
                )}
              </View>
            )}

            {activeTab === 'videos' && (
              <View>
                {Array.isArray(data.video_tutorials) && data.video_tutorials.length > 0 ? (
                  data.video_tutorials.map((vid, idx) => (
                    <TouchableOpacity
                      key={idx}
                      onPress={() => Linking.openURL(vid.url)}
                      className="flex-row gap-3 bg-background p-3 rounded-lg border border-border mb-2 active:border-rose"
                    >
                      <View className="w-24 h-16 bg-black rounded items-center justify-center">
                        <Text className="text-2xl">▶️</Text>
                      </View>
                      <View className="flex-1">
                        <Text className="text-foreground text-sm font-bold" numberOfLines={2}>{vid.title}</Text>
                        <Text className="text-xs text-muted mt-1">YouTube • Watch Tutorial ↗</Text>
                      </View>
                    </TouchableOpacity>
                  ))
                ) : (
                  <View className="items-center py-8">
                    <Text className="text-4xl mb-2">📹</Text>
                    <Text className="text-muted text-sm">Tidak ada video tutorial spesifik.</Text>
                  </View>
                )}
              </View>
            )}
          </View>
        </View>

        {/* SOP Steps */}
        <View className="mb-6">
          <Text className="text-sky font-bold uppercase tracking-wide text-xs mb-4">
            📝 Repair Procedure (SOP)
          </Text>
          <View className="border-l-2 border-border ml-3">
            {Array.isArray(data.sop_steps) && data.sop_steps.length > 0 ? data.sop_steps.map((step, idx) => (
              <View key={idx} className="pl-6 pb-4 relative">
                <View className="absolute -left-3 top-0 w-6 h-6 rounded-full bg-background border border-border items-center justify-center">
                  <Text className="text-sky font-bold text-xs">{idx + 1}</Text>
                </View>
                <Text className="text-muted text-sm leading-relaxed">{step}</Text>
              </View>
            )) : typeof data.sop_steps === 'string' && (data.sop_steps as any).trim() !== '' ? (
              <View className="pl-6 pb-4 relative">
                <View className="absolute -left-3 top-0 w-6 h-6 rounded-full bg-background border border-border items-center justify-center">
                  <Text className="text-sky font-bold text-xs">1</Text>
                </View>
                <Text className="text-muted text-sm leading-relaxed">{data.sop_steps as any}</Text>
              </View>
            ) : (
              <Text className="text-muted text-xs italic ml-3">Prosedur perbaikan belum tersedia.</Text>
            )}
          </View>
        </View>

        {/* Engineering Mode */}
        {Array.isArray(data.obd_hex_commands) && data.obd_hex_commands.length > 0 && (
          <View className="bg-surface border border-indigo/50 rounded-xl p-4 mb-6">
            <View className="flex-row items-center mb-4">
              <Text className="text-indigo font-bold text-lg">💻 Engineering Mode</Text>
            </View>
            
            {/* Safety Instructions */}
            <View className="bg-indigo/10 border border-indigo/30 rounded-lg p-4 mb-4">
              <Text className="text-indigo font-bold text-sm mb-2">Prosedur Eksekusi Aman:</Text>
              <Text className="text-muted text-sm">1. Pastikan Kunci Kontak ON (Mesin Mati)</Text>
              <Text className="text-muted text-sm">2. Pastikan scanner vLinker MC+ terkoneksi stabil</Text>
              <Text className="text-muted text-sm">3. Pilih command di bawah, klik LOAD</Text>
              <Text className="text-muted text-sm">4. Tunggu respon terminal</Text>
            </View>

            {/* Safety Checkbox */}
            <TouchableOpacity
              onPress={() => setSafetyConfirmed(!safetyConfirmed)}
              className="flex-row items-center bg-background p-3 rounded-lg border border-border mb-4"
            >
              <View className={`w-5 h-5 rounded border mr-3 items-center justify-center ${safetyConfirmed ? 'bg-indigo border-indigo' : 'border-muted'}`}>
                {safetyConfirmed && <Text className="text-white text-xs">✓</Text>}
              </View>
              <Text className="text-foreground text-sm font-bold flex-1">
                Saya mengerti risiko (ECU Programming) dan telah memastikan kondisi aman.
              </Text>
            </TouchableOpacity>

            {/* HEX Commands */}
            <View style={{ opacity: safetyConfirmed ? 1 : 0.5 }} pointerEvents={safetyConfirmed ? 'auto' : 'none'}>
              {data.obd_hex_commands.map((cmd, idx) => (
                <View key={idx} className="bg-black/50 border border-border rounded-lg p-4 mb-2">
                  <View className="flex-row items-center gap-2 mb-2">
                    <Text className="text-emerald font-mono text-xl font-bold">{cmd.hex_command}</Text>
                    <View className={`px-2 py-0.5 rounded ${cmd.risk_level === 'HIGH' ? 'bg-error/20 border border-error/50' : 'bg-surface'}`}>
                      <Text className={`text-[10px] font-bold ${cmd.risk_level === 'HIGH' ? 'text-error' : 'text-muted'}`}>
                        {cmd.risk_level} RISK
                      </Text>
                    </View>
                  </View>
                  <Text className="text-foreground font-bold mb-1">{cmd.description}</Text>
                  <Text className="text-muted text-xs">Pre-condition: {cmd.notes}</Text>
                  <TouchableOpacity
                    onPress={() => onLoadHex?.(cmd.hex_command)}
                    className="bg-indigo mt-3 py-2 rounded-lg items-center"
                  >
                    <Text className="text-white font-bold text-sm">LOAD TO TERMINAL →</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Footer */}
        <View className="flex-row justify-between items-center border-t border-border pt-4 pb-8">
          <Text className="text-xs text-muted font-mono">SMART REPAIR MANUAL v4.1</Text>
          <View className="flex-row items-center">
            <View className="w-2 h-2 bg-emerald rounded-full mr-1.5" />
            <Text className="text-xs text-emerald font-bold">OEM VERIFIED</Text>
          </View>
        </View>
      </View>

      {/* DTC Detail Modal */}
      {selectedDtc && (
        <View className="absolute inset-0 bg-black/80 justify-center items-center p-4">
          <View className="bg-surface border border-border rounded-2xl max-w-lg w-full p-6">
            <View className="flex-row justify-between items-start mb-4">
              <View>
                <Text className="text-error font-bold font-mono text-xl">{selectedDtc.code}</Text>
                <Text className="text-foreground font-bold mt-1">{selectedDtc.definition}</Text>
              </View>
              <TouchableOpacity onPress={() => setSelectedDtc(null)} className="p-2">
                <Text className="text-muted text-lg">✕</Text>
              </TouchableOpacity>
            </View>
            
            <View className="space-y-3">
              <View>
                <Text className="text-xs text-muted uppercase font-bold mb-1">Possible Cause</Text>
                <Text className="text-foreground text-sm">{selectedDtc.possible_cause}</Text>
              </View>
              <View>
                <Text className="text-xs text-muted uppercase font-bold mb-1">Related Components</Text>
                <Text className="text-foreground text-sm">{selectedDtc.related_components}</Text>
              </View>
              <View>
                <Text className="text-xs text-muted uppercase font-bold mb-1">Symptoms</Text>
                <Text className="text-foreground text-sm">{selectedDtc.symptoms}</Text>
              </View>
              <View>
                <Text className="text-xs text-muted uppercase font-bold mb-1">Fix Suggestion</Text>
                <Text className="text-emerald text-sm font-bold">{selectedDtc.fix_suggestion}</Text>
              </View>
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  );
}
