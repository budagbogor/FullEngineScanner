import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { Search, CarFront, Settings, Wrench, Activity, Bot, Cable } from 'lucide-react-native';

export type DashboardMenuItem = {
    id: string;
    title: string;
    icon: React.ReactNode;
    description: string;
    onPress: () => void;
    disabled?: boolean;
};

interface DiagnosticDashboardProps {
    onMenuSelect: (id: string) => void;
    isConnected: boolean;
    vehicleInfo?: string | null;
    onConnect: () => void;
}

export function DiagnosticDashboard({ onMenuSelect, isConnected, vehicleInfo, onConnect }: DiagnosticDashboardProps) {
    const iconSize = 28;
    
    // Determine icon color based on disabled state
    const getIconColor = (disabled?: boolean) => disabled ? '#9CA3AF' : '#2563EB';

    const menuItems: DashboardMenuItem[] = [
        {
            id: 'intelligent_diagnose',
            title: 'Diagnosa Cerdas',
            icon: <Search size={iconSize} color={getIconColor()} />,
            description: 'Auto VIN & Scan Semua Sistem',
            onPress: () => onMenuSelect('intelligent_diagnose'),
        },
        {
            id: 'local_diagnose',
            title: 'Diagnosa Manual',
            icon: <CarFront size={iconSize} color={getIconColor()} />,
            description: 'Pilih Kendaraan Manual',
            onPress: () => onMenuSelect('local_diagnose'),
        },
        {
            id: 'active_test',
            title: 'Active Test',
            icon: <Settings size={iconSize} color={getIconColor(!isConnected)} />,
            description: 'Kontrol Dua Arah',
            onPress: () => onMenuSelect('active_test'),
            disabled: !isConnected,
        },
        {
            id: 'special_functions',
            title: 'Fungsi Khusus',
            icon: <Wrench size={iconSize} color={getIconColor(!isConnected)} />,
            description: '30+ Layanan Reset',
            onPress: () => onMenuSelect('special_functions'),
            disabled: !isConnected,
        },
        {
            id: 'data_stream',
            title: 'Data Stream',
            icon: <Activity size={iconSize} color={getIconColor(!isConnected)} />,
            description: 'Live PID & Grafik',
            onPress: () => onMenuSelect('data_stream'),
            disabled: !isConnected,
        },
        {
            id: 'ai_copilot',
            title: 'AI Co-Pilot',
            icon: <Bot size={iconSize} color={getIconColor()} />,
            description: 'Panduan Perbaikan Ahli',
            onPress: () => onMenuSelect('ai_copilot'),
        },
    ];

    return (
        <ScrollView className="flex-1 bg-background" showsVerticalScrollIndicator={false}>
            {/* Vehicle Info Header */}
            <View className="p-5 bg-surface border-b border-border mb-6">
                <View className="flex-row items-center justify-between mb-3">
                    <Text className="text-xl font-bold text-foreground">Koneksi Kendaraan</Text>
                    <View className="flex-row items-center gap-3">
                        {!isConnected && (
                            <TouchableOpacity onPress={onConnect} className="bg-primary px-4 py-2 rounded-lg">
                                <Text className="text-white text-sm font-semibold">Hubungkan VCI</Text>
                            </TouchableOpacity>
                        )}
                        <View className={`px-3 py-1.5 rounded-full flex-row items-center gap-1.5 ${isConnected ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                            <View className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                            <Text className={`text-xs font-semibold ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
                                {isConnected ? 'TERHUBUNG' : 'TERPUTUS'}
                            </Text>
                        </View>
                    </View>
                </View>
                <Text className="text-muted text-sm leading-relaxed">
                    {vehicleInfo || 'Belum ada kendaraan yang teridentifikasi. Hubungkan VCI dan jalankan Auto VIN.'}
                </Text>
            </View>

            {/* Grid Dashboard */}
            <View className="px-5 flex-row flex-wrap justify-between">
                {menuItems.map((item) => (
                    <TouchableOpacity
                        key={item.id}
                        activeOpacity={0.7}
                        onPress={item.onPress}
                        disabled={item.disabled}
                        className={`w-[48%] bg-surface border rounded-xl mb-4 p-5 flex-col ${item.disabled ? 'border-border/50 opacity-60' : 'border-border'}`}
                        style={Platform.OS === 'web' ? { cursor: item.disabled ? 'not-allowed' : 'pointer' } as any : {}}
                    >
                        <View className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${item.disabled ? 'bg-gray-100' : 'bg-blue-50'}`}>
                            {item.icon}
                        </View>
                        <Text className="text-base font-semibold text-foreground mb-1.5">{item.title}</Text>
                        <Text className="text-xs text-muted leading-relaxed pr-2">{item.description}</Text>

                        {item.disabled && (
                            <View className="absolute top-4 right-4 bg-gray-100 px-2 py-1 rounded-md">
                                <Text className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">Memerlukan VCI</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                ))}
            </View>

            {/* VCI Status Footer */}
            <View className="px-5 pb-8 mt-4">
                <View className="bg-surface border border-border p-5 rounded-xl flex-row items-center">
                    <View className="w-12 h-12 rounded-full bg-gray-50 items-center justify-center mr-4">
                        <Cable size={24} color="#64748B" />
                    </View>
                    <View className="flex-1">
                        <Text className="text-foreground font-semibold mb-1">Adaptor VCI: vLinker MC+</Text>
                        <Text className="text-muted text-xs leading-relaxed">Mendukung: HS-CAN, MS-CAN, SW-CAN, UDS</Text>
                    </View>
                </View>
            </View>
        </ScrollView>
    );
}

