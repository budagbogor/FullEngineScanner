import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';

export interface EcuModule {
    id: string; // e.g. "0x07E0"
    name: string; // e.g. "Engine Control Module (ECM)"
    status: 'scanning' | 'clean' | 'faulty' | 'unknown';
    dtcCount: number;
}

interface ModuleListProps {
    modules: EcuModule[];
    isScanning: boolean;
    scanProgress?: number; // 0-100
    onAnalyzeDtc?: (dtc: any) => void;
    onGenerateReport?: () => void;
    onBack?: () => void;
    onStartScan?: () => void;
}

export function ModuleList({ modules, isScanning, scanProgress, onAnalyzeDtc, onGenerateReport, onBack, onStartScan }: ModuleListProps) {

    const totalFaults = modules.reduce((sum, mod) => sum + mod.dtcCount, 0);

    return (
        <View className="flex-1 bg-background">
            {/* Header */}
            <View className="flex-row items-center justify-between p-4 border-b border-border bg-surface">
                <TouchableOpacity onPress={onBack} className="flex-row items-center">
                    <Text className="text-muted mr-2">←</Text>
                    <Text className="text-foreground font-bold">Intelligent Diagnose</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={onStartScan}
                    disabled={isScanning}
                    className={`px-4 py-2 rounded-full ${isScanning ? 'bg-muted/20' : 'bg-primary'}`}
                >
                    <Text className={`font-bold ${isScanning ? 'text-muted' : 'text-white'}`}>
                        {isScanning ? 'SCANNING...' : 'START SCAN'}
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Progress Bar */}
            {isScanning && scanProgress !== undefined && (
                <View className="h-1 bg-border w-full">
                    <View className="h-full bg-primary" style={{ width: `${scanProgress}%` }} />
                </View>
            )}

            {/* Summary Card */}
            <View className="p-4 mx-4 mt-4 bg-surface rounded-xl border border-border shadow-sm flex-row items-center justify-between">
                <View>
                    <Text className="text-muted text-xs uppercase font-bold">System Status</Text>
                    <Text className="text-2xl font-bold text-foreground">
                        {isScanning ? 'Analyzing...' : `${modules.length} Modules`}
                    </Text>
                </View>
                <View className={`px-4 py-3 rounded-xl items-center justify-center ${totalFaults > 0 ? 'bg-destructive/10' : 'bg-green-500/10'}`}>
                    <Text className={`text-xl font-bold ${totalFaults > 0 ? 'text-destructive' : 'text-green-500'}`}>
                        {totalFaults}
                    </Text>
                    <Text className={`text-[10px] font-bold uppercase ${totalFaults > 0 ? 'text-destructive' : 'text-green-500'}`}>
                        Faults Found
                    </Text>
                </View>
            </View>

            <ScrollView className="flex-1 mt-4 px-4 hidden-scrollbar" contentContainerStyle={{ paddingBottom: 100 }}>
                {modules.map((mod) => (
                    <TouchableOpacity
                        key={mod.id}
                        onPress={() => {
                            if (onAnalyzeDtc && mod.dtcCount > 0) {
                                // Simplified Mock, real scenario would use specific DTC obj
                                onAnalyzeDtc({ code: 'P0100', description: 'Mass Air Flow Sensor Circuit Malfunction' });
                            }
                        }}
                        activeOpacity={0.7}
                        className="flex-row items-center p-4 mb-3 bg-surface border border-border rounded-xl"
                    >
                        {/* Status Icon Area */}
                        <View className={`w-10 h-10 rounded-full items-center justify-center mr-4
               ${mod.status === 'scanning' ? 'bg-primary/20' :
                                mod.status === 'faulty' ? 'bg-destructive/20' :
                                    mod.status === 'clean' ? 'bg-green-500/20' : 'bg-muted/20'}`}
                        >
                            {mod.status === 'scanning' ? (
                                <ActivityIndicator size="small" color="#3b82f6" />
                            ) : mod.status === 'faulty' ? (
                                <Text className="text-destructive font-bold">!</Text>
                            ) : mod.status === 'clean' ? (
                                <Text className="text-green-500 font-bold">✓</Text>
                            ) : (
                                <Text className="text-muted font-bold">?</Text>
                            )}
                        </View>

                        {/* Title / Description */}
                        <View className="flex-1">
                            <Text className="text-base font-bold text-foreground">{mod.name}</Text>
                            <Text className="text-xs text-muted">ID: {mod.id}</Text>
                        </View>

                        {/* Fault Count Badge */}
                        {mod.dtcCount > 0 && (
                            <View className="bg-destructive px-2 py-1 rounded-full items-center justify-center min-w-[30px]">
                                <Text className="text-white text-xs font-bold">{mod.dtcCount}</Text>
                            </View>
                        )}
                        {mod.dtcCount === 0 && mod.status === 'clean' && (
                            <Text className="text-green-500 text-xs font-bold">PASS</Text>
                        )}
                        <Text className="text-muted ml-3 opacity-50">→</Text>
                    </TouchableOpacity>
                ))}

                {modules.length === 0 && !isScanning && (
                    <View className="items-center justify-center py-20 px-8">
                        <Text className="text-4xl opacity-20 mb-4">🚗</Text>
                        <Text className="text-center text-muted">
                            Connect to a vehicle API or OBD VCI and tap Start Scan to discover topology.
                        </Text>
                    </View>
                )}
            </ScrollView>

            {/* Action Button - Global Report */}
            {modules.length > 0 && !isScanning && (
                <View className="absolute bottom-4 left-4 right-4">
                    <TouchableOpacity
                        className="bg-primary py-4 rounded-xl items-center justify-center shadow-lg"
                        activeOpacity={0.8}
                        onPress={onGenerateReport}
                    >
                        <Text className="text-white font-bold text-base">Generate AI Diagnostic Report</Text>
                    </TouchableOpacity>
                </View>
            )}

        </View>
    );
}
