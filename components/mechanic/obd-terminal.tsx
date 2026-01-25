import React, { useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import type { ObdScannerState, ConsoleLog } from '@/shared/mechanic-types';

interface ObdTerminalProps {
  obdState: ObdScannerState;
  terminalInput: string;
  showTerminal: boolean;
  onTerminalInputChange: (text: string) => void;
  onToggleTerminal: () => void;
  onSendCommand: () => void;
  onConnect: () => void;
}

function LogEntry({ log }: { log: ConsoleLog }) {
  const colorClass = {
    TX: 'text-primary',
    RX: 'text-emerald',
    INFO: 'text-muted',
    ERR: 'text-error',
  }[log.type];

  return (
    <View className="flex-row">
      <Text className={`w-8 opacity-50 text-[9px] font-mono ${colorClass}`}>
        {log.type}
      </Text>
      <Text className={`text-[9px] font-mono flex-1 ${colorClass}`}>
        {log.message}
      </Text>
    </View>
  );
}

export function ObdTerminal({
  obdState,
  terminalInput,
  showTerminal,
  onTerminalInputChange,
  onToggleTerminal,
  onSendCommand,
  onConnect,
}: ObdTerminalProps) {
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (showTerminal) {
      scrollRef.current?.scrollToEnd({ animated: true });
    }
  }, [obdState.logs, showTerminal]);

  if (!obdState.isConnected && !showTerminal) {
    return null;
  }

  return (
    <View className="bg-background border border-emerald/30 rounded-xl p-3 mt-2">
      {/* Header */}
      <View className="flex-row justify-between items-center mb-2">
        <View className="flex-row items-center">
          <View className={`w-1.5 h-1.5 rounded-full mr-2 ${obdState.isConnected ? 'bg-emerald' : 'bg-muted'}`} />
          <Text className="text-[10px] text-emerald font-bold uppercase">
            {obdState.isConnected ? 'vLinker Online' : 'Terminal Offline'}
          </Text>
        </View>
        <TouchableOpacity 
          onPress={onToggleTerminal}
          className="border border-border px-2 py-1 rounded"
        >
          <Text className="text-[9px] text-muted">
            {showTerminal ? 'Hide' : 'Show'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Collapsed View - Live Data */}
      {!showTerminal && obdState.isConnected && (
        <View className="flex-row gap-2">
          <View className="flex-1 bg-surface rounded p-2 items-center">
            <Text className="text-[8px] text-muted">RPM</Text>
            <Text className="text-white font-mono text-xs">{obdState.liveData.rpm}</Text>
          </View>
          <View className="flex-1 bg-surface rounded p-2 items-center">
            <Text className="text-[8px] text-muted">TEMP</Text>
            <Text className="text-white font-mono text-xs">{obdState.liveData.coolantTemp}°</Text>
          </View>
          <View className="flex-1 bg-surface rounded p-2 items-center">
            <Text className="text-[8px] text-muted">VOLT</Text>
            <Text className="text-white font-mono text-xs">{obdState.liveData.voltage}V</Text>
          </View>
          <TouchableOpacity 
            onPress={onConnect}
            className="flex-1 bg-emerald/20 rounded p-2 items-center justify-center border border-emerald/30"
          >
            <Text className="text-[9px] text-emerald font-bold">RECONNECT</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Expanded View - Terminal */}
      {showTerminal && (
        <View>
          {/* Log Area */}
          <ScrollView 
            ref={scrollRef}
            className="bg-black rounded border border-border h-32 p-2 mb-2"
            showsVerticalScrollIndicator={true}
          >
            {obdState.logs.map((log, i) => (
              <LogEntry key={i} log={log} />
            ))}
          </ScrollView>

          {/* Input Area */}
          <View className="flex-row gap-1">
            <TextInput
              value={terminalInput}
              onChangeText={onTerminalInputChange}
              placeholder="HEX Command (e.g. 31 01)"
              placeholderTextColor="#64748b"
              className="flex-1 bg-surface border border-border rounded px-2 py-2 text-[10px] font-mono text-white"
              autoCapitalize="characters"
              onSubmitEditing={onSendCommand}
            />
            <TouchableOpacity 
              onPress={onSendCommand}
              className="bg-emerald/20 border border-emerald/30 rounded px-3 justify-center"
            >
              <Text className="text-[10px] text-emerald font-bold">SEND</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}
