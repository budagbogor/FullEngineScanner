import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';

export interface DataStreamPid {
    id: string;
    name: string;
    value: string | number;
    unit: string;
    min?: number;
    max?: number;
}

interface DataStreamGraphProps {
    pids: DataStreamPid[];
    isRecording: boolean;
    onToggleRecord: () => void;
    onBack: () => void;
}

export function DataStreamGraph({ pids, isRecording, onToggleRecord, onBack }: DataStreamGraphProps) {
    const [selectedPids, setSelectedPids] = useState<Set<string>>(new Set());

    const togglePid = (id: string) => {
        const newSet = new Set(selectedPids);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            if (newSet.size < 4) newSet.add(id); // Limit to 4 for graphing
        }
        setSelectedPids(newSet);
    };

    return (
        <View className="flex-1 bg-background">
            {/* Header */}
            <View className="flex-row items-center justify-between p-4 border-b border-border bg-surface">
                <TouchableOpacity onPress={onBack} className="flex-row items-center">
                    <Text className="text-muted mr-2">←</Text>
                    <Text className="text-foreground font-bold">Data Stream</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={onToggleRecord}
                    className={`px-4 py-2 rounded-full flex-row items-center ${isRecording ? 'bg-red-500/20' : 'bg-primary/20'}`}
                >
                    {isRecording ? <ActivityIndicator size="small" color="#ef4444" className="mr-2" /> : null}
                    <Text className={`font-bold ${isRecording ? 'text-red-500' : 'text-primary'}`}>
                        {isRecording ? 'RECORDING REC' : 'START RECORD'}
                    </Text>
                </TouchableOpacity>
            </View>

            <ScrollView className="flex-1">
                {/* Selected Graph Area - Placeholder for actual LineChart */}
                {selectedPids.size > 0 && (
                    <View className="p-4 bg-surface m-4 border border-border rounded-xl shadow-sm min-h-[200px] items-center justify-center">
                        <Text className="text-4xl opacity-20 mb-2">📈</Text>
                        <Text className="text-muted text-sm text-center">
                            Graphing {selectedPids.size} PIDs (Chart.js integration pending for web/native)
                        </Text>
                    </View>
                )}

                {/* PID List */}
                <View className="px-4 pb-4">
                    <Text className="text-muted text-sm mb-2 font-bold uppercase">Available Parameters</Text>
                    {pids.map((pid) => {
                        const isSelected = selectedPids.has(pid.id);
                        // Simple bar calculation
                        const barWidth = pid.min !== undefined && pid.max !== undefined && typeof pid.value === 'number'
                            ? Math.min(100, Math.max(0, ((pid.value - pid.min) / (pid.max - pid.min)) * 100))
                            : 0;

                        return (
                            <TouchableOpacity
                                key={pid.id}
                                onPress={() => togglePid(pid.id)}
                                activeOpacity={0.7}
                                className={`p-3 mb-2 rounded-xl flex-row items-center justify-between border ${isSelected ? 'border-primary bg-primary/10' : 'border-border bg-surface'}`}
                            >
                                <View className="flex-1 mr-4">
                                    <Text className={`font-bold ${isSelected ? 'text-primary' : 'text-foreground'}`}>{pid.name}</Text>

                                    {/* Visual Bar */}
                                    {pid.min !== undefined && pid.max !== undefined && (
                                        <View className="h-1 bg-border rounded-full mt-2 overflow-hidden flex-row">
                                            <View className="h-full bg-primary" style={{ width: `${barWidth}%` }} />
                                        </View>
                                    )}
                                </View>

                                <View className="items-end min-w-[80px]">
                                    <Text className="text-xl font-bold font-mono text-foreground">{pid.value}</Text>
                                    <Text className="text-xs text-muted">{pid.unit}</Text>
                                </View>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </ScrollView>
        </View>
    );
}
