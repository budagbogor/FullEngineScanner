import React, { useState } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity } from 'react-native';

interface ManualVehicleModalProps {
    visible: boolean;
    onClose: () => void;
    onSelect: (vehicle: { make: string; model: string; year: string }) => void;
}

export function ManualVehicleModal({ visible, onClose, onSelect }: ManualVehicleModalProps) {
    const [make, setMake] = useState('');
    const [model, setModel] = useState('');
    const [year, setYear] = useState('');

    const handleSubmit = () => {
        if (!make || !model || !year) return;
        onSelect({ make, model, year });
        setMake('');
        setModel('');
        setYear('');
    };

    return (
        <Modal visible={visible} transparent animationType="fade">
            <View className="flex-1 bg-black/60 justify-center items-center p-4">
                <View className="bg-surface w-full max-w-sm rounded-2xl border border-border overflow-hidden">
                    <View className="p-4 border-b border-border flex-row justify-between items-center bg-muted/10">
                        <Text className="text-lg font-bold text-foreground">Manual Vehicle Selection</Text>
                        <TouchableOpacity onPress={onClose} className="w-8 h-8 items-center justify-center">
                            <Text className="text-muted text-lg">×</Text>
                        </TouchableOpacity>
                    </View>

                    <View className="p-4 gap-4">
                        <View>
                            <Text className="text-sm font-bold text-muted mb-1">Make / Brand</Text>
                            <TextInput
                                className="bg-background border border-border rounded-lg px-3 py-2 text-foreground"
                                placeholder="e.g. Toyota"
                                placeholderTextColor="#64748b"
                                value={make}
                                onChangeText={setMake}
                            />
                        </View>
                        <View>
                            <Text className="text-sm font-bold text-muted mb-1">Model</Text>
                            <TextInput
                                className="bg-background border border-border rounded-lg px-3 py-2 text-foreground"
                                placeholder="e.g. Avanza"
                                placeholderTextColor="#64748b"
                                value={model}
                                onChangeText={setModel}
                            />
                        </View>
                        <View>
                            <Text className="text-sm font-bold text-muted mb-1">Year</Text>
                            <TextInput
                                className="bg-background border border-border rounded-lg px-3 py-2 text-foreground"
                                placeholder="e.g. 2018"
                                placeholderTextColor="#64748b"
                                keyboardType="number-pad"
                                value={year}
                                onChangeText={setYear}
                            />
                        </View>
                    </View>

                    <View className="p-4 border-t border-border flex-row justify-end space-x-3 gap-2">
                        <TouchableOpacity
                            onPress={onClose}
                            className="px-4 py-2 rounded-lg bg-surface border border-border"
                        >
                            <Text className="text-foreground">Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={handleSubmit}
                            className="px-4 py-2 rounded-lg bg-primary"
                            disabled={!make || !model || !year}
                        >
                            <Text className="text-white font-bold">Select Vehicle</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}
