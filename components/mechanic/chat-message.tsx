import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import type { Message, ObdCommandSuggestion } from '@/shared/mechanic-types';

interface ChatMessageProps {
  message: Message;
  onLoadHex?: (hex: string) => void;
}

export function ChatMessage({ message, onLoadHex }: ChatMessageProps) {
  const isUser = message.role === 'user';

  return (
    <View className={`flex-row ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <View 
        className={`max-w-[85%] rounded-2xl p-4 ${
          isUser 
            ? 'bg-primary rounded-br-none' 
            : 'bg-surface border border-border rounded-bl-none'
        }`}
      >
        {/* Media Preview */}
        {message.media && message.mediaType === 'image' && (
          <View className="mb-2">
            <Image
              source={{ uri: message.media }}
              style={{ width: 200, height: 150, borderRadius: 8 }}
              contentFit="cover"
            />
          </View>
        )}
        
        {message.media && message.mediaType === 'audio' && (
          <View className="mb-2 flex-row items-center gap-2 bg-white/20 p-2 rounded-lg">
            <Text className="text-white">🔊</Text>
            <Text className="text-xs font-bold text-white">Audio Clip Attached</Text>
          </View>
        )}

        {/* Message Content */}
        <Text className={`text-sm leading-relaxed ${isUser ? 'text-white' : 'text-foreground'}`}>
          {message.content}
        </Text>

        {/* AI HEX Commands */}
        {!isUser && message.data?.obd_hex_commands && message.data.obd_hex_commands.length > 0 && (
          <View className="mt-3 bg-background rounded-lg p-2 border border-indigo/30">
            <Text className="text-[10px] text-indigo font-bold uppercase mb-2">
              AI Generated UDS Commands
            </Text>
            {message.data.obd_hex_commands.map((cmd: ObdCommandSuggestion, i: number) => (
              <View key={i} className="flex-row justify-between items-center bg-black/40 p-2 rounded mb-1">
                <View className="flex-1">
                  <Text className="text-xs text-muted font-mono">{cmd.hex_command}</Text>
                  <Text className="text-[10px] text-muted">{cmd.description}</Text>
                </View>
                <TouchableOpacity 
                  onPress={() => onLoadHex?.(cmd.hex_command)}
                  className="bg-indigo px-2 py-1 rounded ml-2"
                >
                  <Text className="text-[10px] text-white font-bold">USE</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  );
}
