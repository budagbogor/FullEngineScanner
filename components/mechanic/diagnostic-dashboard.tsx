import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Platform } from 'react-native';

export type DashboardMenuItem = {
    id: string;
    title: string;
    icon: string;
    description: string;
    color: string;
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
    const menuItems: DashboardMenuItem[] = [
        {
            id: 'intelligent_diagnose',
            title: 'Intelligent Diagnose',
            icon: '🔍',
            description: 'Auto VIN & All-System Scan',
            color: 'bg-blue-600',
            onPress: () => onMenuSelect('intelligent_diagnose'),
        },
        {
            id: 'local_diagnose',
            title: 'Local Diagnose',
            icon: '🚗',
            description: 'Manual Vehicle Selection',
            color: 'bg-emerald-600',
            onPress: () => onMenuSelect('local_diagnose'),
        },
        {
            id: 'active_test',
            title: 'Active Test',
            icon: '⚙️',
            description: 'Bi-directional Control',
            color: 'bg-amber-600',
            onPress: () => onMenuSelect('active_test'),
            disabled: !isConnected,
        },
        {
            id: 'special_functions',
            title: 'Special Functions',
            icon: '🔧',
            description: '30+ Reset Services',
            color: 'bg-purple-600',
            onPress: () => onMenuSelect('special_functions'),
            disabled: !isConnected,
        },
        {
            id: 'data_stream',
            title: 'Data Stream',
            icon: '📈',
            description: 'Live PIDs & Graphing',
            color: 'bg-cyan-600',
            onPress: () => onMenuSelect('data_stream'),
            disabled: !isConnected,
        },
        {
            id: 'ai_copilot',
            title: 'AI Co-Pilot',
            icon: '🤖',
            description: 'Expert Repair Guidance',
            color: 'bg-indigo-600',
            onPress: () => onMenuSelect('ai_copilot'),
        },
    ];

    return (
        <ScrollView className="flex-1 bg-background" showsVerticalScrollIndicator={false}>
            {/* Vehicle Info Header */}
            <View className="p-4 bg-surface border-b border-border m-4 rounded-xl shadow-sm">
                <View className="flex-row items-center justify-between mb-2">
                    <Text className="text-lg font-bold text-foreground">Vehicle Connection</Text>
                    <View className="flex-row items-center gap-2">
                        {!isConnected && (
                            <TouchableOpacity onPress={onConnect} className="bg-primary px-3 py-1 rounded">
                                <Text className="text-white text-xs font-bold">Connect VCI</Text>
                            </TouchableOpacity>
                        )}
                        <View className={`px-2 py-1 rounded-full ${isConnected ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                            <Text className={`text-xs font-bold ${isConnected ? 'text-green-500' : 'text-red-500'}`}>
                                {isConnected ? 'CONNECTED' : 'DISCONNECTED'}
                            </Text>
                        </View>
                    </View>
                </View>
                <Text className="text-muted text-sm">
                    {vehicleInfo || 'No vehicle identified. Connect VCI and run Auto VIN.'}
                </Text>
            </View>

            {/* Grid Dashboard */}
            <View className="p-4 flex-row flex-wrap justify-between">
                {menuItems.map((item) => (
                    <TouchableOpacity
                        key={item.id}
                        activeOpacity={0.7}
                        onPress={item.onPress}
                        disabled={item.disabled}
                        className={`w-[48%] bg-surface border border-border rounded-2xl mb-4 p-4 ${item.disabled ? 'opacity-50' : ''}`}
                        style={Platform.OS === 'web' ? { cursor: item.disabled ? 'not-allowed' : 'pointer' } as any : {}}
                    >
                        <View className={`w-12 h-12 rounded-full ${item.color} items-center justify-center mb-3`}>
                            <Text className="text-2xl">{item.icon}</Text>
                        </View>
                        <Text className="text-base font-bold text-foreground mb-1">{item.title}</Text>
                        <Text className="text-xs text-muted leading-tight">{item.description}</Text>

                        {item.disabled && (
                            <View className="absolute top-2 right-2 bg-destructive/20 px-1.5 py-0.5 rounded">
                                <Text className="text-[10px] font-bold text-destructive">VCI REQ</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                ))}
            </View>

            {/* VCI Status Footer */}
            <View className="px-4 pb-8">
                <View className="bg-surface/50 border border-border p-4 rounded-xl flex-row items-center">
                    <Text className="text-2xl mr-3">🔌</Text>
                    <View className="flex-1">
                        <Text className="text-foreground font-bold">VCI Adapter: vLinker MC+</Text>
                        <Text className="text-muted text-xs">Supports: HS-CAN, MS-CAN, SW-CAN, UDS</Text>
                    </View>
                </View>
            </View>
        </ScrollView>
    );
}
