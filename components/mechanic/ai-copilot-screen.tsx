import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { ChatMessage } from './chat-message';
import { Message } from '@/shared/mechanic-types';

interface AiCopilotScreenProps {
    messages: Message[];
    isLoading: boolean;
    onBack: () => void;
    onLoadHex: (hex: string) => void;
    messagesEndRef: React.RefObject<View | null>;
    scrollViewRef: React.RefObject<ScrollView | null>;
}

export function AiCopilotScreen({
    messages,
    isLoading,
    onBack,
    onLoadHex,
    messagesEndRef,
    scrollViewRef
}: AiCopilotScreenProps) {
    return (
        <View className="flex-1 bg-background">
            {/* Header */}
            <View className="flex-row items-center justify-between p-4 border-b border-border bg-surface shadow-sm z-10">
                <TouchableOpacity onPress={onBack} className="flex-row items-center">
                    <Text className="text-muted mr-2">←</Text>
                    <Text className="text-foreground font-bold text-lg">AI Engineering Co-Pilot</Text>
                </TouchableOpacity>
                <View className="bg-primary/10 px-3 py-1 rounded-full">
                    <Text className="text-primary text-xs font-bold">EXPERT MODE</Text>
                </View>
            </View>

            <ScrollView
                ref={scrollViewRef}
                className="flex-1 p-4"
                showsVerticalScrollIndicator={false}
            >
                {messages.length === 0 && (
                    <View className="flex-1 items-center justify-center py-20">
                        <View className="w-20 h-20 bg-primary/10 rounded-full items-center justify-center mb-6 border border-primary/20">
                            <Text className="text-4xl">🤖</Text>
                        </View>
                        <Text className="text-xl font-bold text-foreground mb-2">Master Technician AI</Text>
                        <Text className="text-sm text-muted text-center max-w-[280px] leading-relaxed">
                            Ask about DTCs, request diagnostic procedures, or generate a repair report. I analyze live data and OE manuals to assist you.
                        </Text>
                    </View>
                )}

                {/* Existing Chat Message List */}
                {messages.map((msg) => (
                    <ChatMessage
                        key={msg.id}
                        message={msg}
                        onLoadHex={onLoadHex}
                    />
                ))}

                {isLoading && (
                    <View className="flex-row items-center justify-center p-4 my-2 bg-surface/50 border border-border rounded-xl self-start">
                        <Text className="text-primary mr-2 animate-pulse">●</Text>
                        <Text className="text-muted text-sm font-medium">AI Engineer is analyzing OE data...</Text>
                    </View>
                )}

                <View ref={messagesEndRef} className="h-4" />
            </ScrollView>

        </View>
    );
}
