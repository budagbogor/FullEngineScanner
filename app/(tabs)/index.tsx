import React, { useRef, useEffect, useState } from 'react';
import { View, ScrollView, Text, Alert, Platform, TouchableOpacity } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { ScreenContainer } from '@/components/screen-container';
import {
  DisclaimerModal,
  Header,
  ChatMessage,
  ServiceGrid,
  ObdTerminal,
  InputArea,
  JobCard,
  Documentation,
  SettingsModal,
  DiagnosticDashboard,
  DataStreamGraph,
  ModuleList,
  AiCopilotScreen,
  ManualVehicleModal
} from '@/components/mechanic';
import { useMechanicState } from '@/hooks/use-mechanic-state';
import { useResponsive } from '@/hooks/use-responsive';

export default function WorkspaceScreen() {
  const state = useMechanicState();
  const { isDesktop, isMobile } = useResponsive();
  const messagesEndRef = useRef<View>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  // Recording and listening states (simplified for now)
  const [isListening, setIsListening] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  // Scroll to bottom when messages change
  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [state.messages]);

  // Handle image picker
  const handleImagePress = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets[0].base64) {
        state.setSelectedMedia({
          data: `data:image/jpeg;base64,${result.assets[0].base64}`,
          mimeType: 'image/jpeg',
        });
      }
    } catch (error) {
      Alert.alert('Error', 'Tidak dapat mengakses galeri foto.');
    }
  };

  // Handle voice input (placeholder - needs speech recognition)
  const handleVoicePress = () => {
    if (Platform.OS === 'web') {
      Alert.alert('Info', 'Voice input tersedia di aplikasi mobile.');
    } else {
      setIsListening(!isListening);
      // TODO: Implement speech recognition
    }
  };

  // Handle audio recording (placeholder)
  const handleRecordStart = () => {
    setIsRecording(true);
    // TODO: Implement audio recording
  };

  const handleRecordEnd = () => {
    setIsRecording(false);
    // TODO: Stop recording and process audio
  };

  // Handle OBD connect
  const handleObdConnect = async () => {
    if (Platform.OS === 'web' && !(navigator as any).bluetooth) {
      Alert.alert('Info', 'Browser ini tidak mendukung Web Bluetooth. Gunakan Chrome/Edge.');
      return;
    }
    await state.handleObdConnect();
  };

  // Handle terminal command
  const handleSendCommand = async () => {
    if (!state.terminalInput.trim()) return;
    const cmd = state.terminalInput.toUpperCase();
    state.setTerminalInput('');
    await state.handleSendObdCommand(cmd);
  };

  // Handle HEX load from job card
  const handleLoadHex = (hex: string) => {
    state.setTerminalInput(hex);
    state.setShowTerminal(true);
  };

  // Navigation Handler
  const handleMenuSelect = (menuId: string) => {
    switch (menuId) {
      case 'intelligent_diagnose':
        state.handleIntelligentDiagnose();
        break;
      case 'local_diagnose':
        state.setShowManualVehicle(true);
        break;
      case 'active_test':
        state.setShowServiceGrid(true); // Active tests open the Service Grid list
        break;
      case 'special_functions':
        state.setShowServiceGrid(true);
        break;
      case 'data_stream':
        state.setActiveView('data_stream');
        break;
      case 'ai_copilot':
        state.setActiveView('ai_copilot');
        break;
    }
  };

  // Helper string for dashboard
  const vehicleInfoString = state.decodedVehicle
    ? `${state.decodedVehicle.year} ${state.decodedVehicle.make} ${state.decodedVehicle.model}`
    : null;

  // Format live data for Data System Graph
  const livePids = [
    { id: 'rpm', name: 'Engine RPM', value: state.obdState.liveData.rpm, unit: 'RPM', min: 0, max: 8000 },
    { id: 'speed', name: 'Vehicle Speed', value: state.obdState.liveData.speed, unit: 'km/h', min: 0, max: 200 },
    { id: 'coolant', name: 'Coolant Temp', value: state.obdState.liveData.coolantTemp, unit: '°C', min: -40, max: 150 },
    { id: 'voltage', name: 'Battery Voltage', value: state.obdState.liveData.voltage, unit: 'V', min: 9, max: 16 },
    { id: 'load', name: 'Engine Load', value: state.obdState.liveData.load, unit: '%', min: 0, max: 100 }
  ];

  // Clear history with confirmation
  const handleClearHistory = () => {
    if (Platform.OS === 'web') {
      if (window.confirm('Hapus semua riwayat diagnosa dan reset workspace?')) {
        state.clearHistory();
      }
      return;
    }
    
    Alert.alert(
      'Hapus Riwayat',
      'Hapus semua riwayat diagnosa dan reset workspace?',
      [
        { text: 'Batal', style: 'cancel' },
        { text: 'Hapus', style: 'destructive', onPress: state.clearHistory },
      ]
    );
  };

  // Desktop layout with sidebar
  if (isDesktop) {
    return (
      <ScreenContainer containerClassName="bg-background">
        <DisclaimerModal
          visible={state.showDisclaimer}
          onAccept={state.acceptDisclaimer}
        />

        <View className="flex-1 flex-row">
          {/* Sidebar */}
          <View className="w-[400px] border-r border-border bg-surface flex-col shadow-2xl z-20">
            <Header
              isConnected={state.obdState.isConnected}
              hasHistory={state.messages.length > 0 || state.currentJob !== null}
              hasApiKey={!!state.appSettings.geminiApiKey || !!state.appSettings.sumopodApiKey}
              onClearHistory={handleClearHistory}
              onOpenSettings={() => state.setShowSettings(true)}
            />

            {/* Chat Messages */}
            <ScrollView
              ref={scrollViewRef}
              className="flex-1 p-4"
              showsVerticalScrollIndicator={false}
            >
              {state.messages.length === 0 && (
                <View className="flex-1 items-center justify-center py-20">
                  <Text className="text-6xl mb-4 opacity-30">🎤</Text>
                  <Text className="text-sm text-muted text-center max-w-[200px]">
                    Support: ECU Coding, Active Test, 37+ Resets (via AI + vLinker MC+)
                  </Text>
                </View>
              )}

              {state.messages.map((msg) => (
                <ChatMessage
                  key={msg.id}
                  message={msg}
                  onLoadHex={handleLoadHex}
                />
              ))}

              {state.isLoading && (
                <Text className="text-muted text-xs p-4">AI Engineer is analyzing protocol...</Text>
              )}

              <View ref={messagesEndRef} />
            </ScrollView>

            {/* Input Area */}
            <InputArea
              input={state.input}
              onInputChange={state.setInput}
              selectedMedia={state.selectedMedia}
              onClearMedia={() => state.setSelectedMedia(null)}
              decodedVehicle={state.decodedVehicle}
              onClearVehicle={() => state.setDecodedVehicle(null)}
              isLoading={state.isLoading}
              isListening={isListening}
              isRecording={isRecording}
              obdState={state.obdState}
              onSubmit={state.handleSubmit}
              onVoicePress={handleVoicePress}
              onRecordStart={handleRecordStart}
              onRecordEnd={handleRecordEnd}
              onImagePress={handleImagePress}
              onServicePress={() => state.setShowServiceGrid(true)}
              onObdConnect={handleObdConnect}
            />

            {/* OBD Terminal */}
            <View className="px-4 pb-4">
              <ObdTerminal
                obdState={state.obdState}
                terminalInput={state.terminalInput}
                showTerminal={state.showTerminal}
                onTerminalInputChange={state.setTerminalInput}
                onToggleTerminal={() => state.setShowTerminal(!state.showTerminal)}
                onSendCommand={handleSendCommand}
                onConnect={handleObdConnect}
              />
            </View>

            {/* Navigation */}
            <View className="p-4 border-t border-border flex-row gap-2">
              <TouchableOpacity
                className={`flex-1 py-2 rounded items-center ${state.activeView === 'dashboard' ? 'bg-primary' : 'bg-surface'}`}
                onPress={() => state.setActiveView('dashboard')}
                activeOpacity={0.7}
              >
                <Text className={`text-xs font-bold ${state.activeView === 'dashboard' ? 'text-white' : 'text-muted'}`}>
                  Dashboard
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                className={`flex-1 py-2 rounded items-center ${state.activeView === 'docs' ? 'bg-surface border border-border' : 'bg-surface'}`}
                onPress={() => state.setActiveView('docs')}
                activeOpacity={0.7}
              >
                <Text className={`text-xs font-bold ${state.activeView === 'docs' ? 'text-foreground' : 'text-muted'}`}>
                  Knowledge Base
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Main Content */}
          <View className="flex-1 bg-background">
            {/* Background Pattern */}
            <View className="absolute inset-0 opacity-5" style={{
              backgroundImage: 'radial-gradient(circle at 1px 1px, #3b82f6 1px, transparent 0)',
              backgroundSize: '40px 40px'
            }} />

            {state.activeView === 'docs' ? (
              <Documentation />
            ) : state.activeView === 'dashboard' ? (
              <DiagnosticDashboard
                onMenuSelect={handleMenuSelect}
                isConnected={state.obdState.isConnected}
                vehicleInfo={vehicleInfoString}
                onConnect={handleObdConnect}
              />
            ) : state.currentJob ? (
              <JobCard data={state.currentJob} onLoadHex={handleLoadHex} />
            ) : state.activeView === 'module_list' ? (
              <ModuleList
                modules={state.scannedModules}
                isScanning={state.isScanningModules}
                scanProgress={state.scanProgress}
                onAnalyzeDtc={(dtc) => {
                  const prompt = `Tolong analisa Fault Code ini: ${dtc.code} - ${dtc.description}. Apa penyebab dan solusinya? Buatkan wiring diagram keyword dan torque specs jika ada parts yang harus diganti.`;
                  state.setInput(prompt);
                  state.setActiveView('ai_copilot');
                }}
                onGenerateReport={() => {
                  const faultyModules = state.scannedModules.filter(m => m.dtcCount > 0);
                  const prompt = `Tolong buatkan Executive Diagnostic Report berdasarkan hasil scan All-System. Jumlah modul bermasalah: ${faultyModules.length}. Berikan plan perbaikan secara menyeluruh.`;
                  state.setInput(prompt);
                  state.setActiveView('ai_copilot');
                }}
                onBack={() => state.setActiveView('dashboard')}
                onStartScan={state.handleIntelligentDiagnose}
              />
            ) : state.activeView === 'ai_copilot' || state.activeView === 'data_stream' ? (
              <View className="flex-1 items-center justify-center p-8">
                <Text className="text-xl font-bold text-foreground mb-4">
                  {state.activeView === 'ai_copilot' ? 'AI Co-Pilot Workspace' : 'Data Stream Studio'}
                </Text>
                <Text className="text-muted text-center max-w-md">
                  Gunakan menu Dashboard di sebelah kiri untuk navigasi fitur AI UDS/CAN.
                </Text>
              </View>
            ) : (
              <View className="flex-1 items-center justify-center">
                <View className="w-24 h-24 rounded-full bg-surface border border-border items-center justify-center mb-6">
                  <Text className="text-4xl opacity-50">🔧</Text>
                </View>
                <Text className="text-2xl font-bold text-muted mb-2">Mechanic Co-Pilot</Text>
                <Text className="text-sm text-muted max-w-md text-center">
                  AI-Powered Engineering Tool. Support UDS, SW-CAN, MS-CAN.
                </Text>
              </View>
            )}
          </View>
        </View>

        <ServiceGrid
          visible={state.showServiceGrid}
          onClose={() => state.setShowServiceGrid(false)}
          onSelect={state.handleServiceClick}
        />

        <SettingsModal
          visible={state.showSettings}
          onClose={() => state.setShowSettings(false)}
          onSettingsChange={state.setAppSettings}
          currentSettings={state.appSettings}
        />

        <ManualVehicleModal
          visible={state.showManualVehicle}
          onClose={() => state.setShowManualVehicle(false)}
          onSelect={state.handleManualVehicleSelect}
        />
      </ScreenContainer>
    );
  }

  // Mobile layout
  return (
    <ScreenContainer containerClassName="bg-background" edges={['top', 'left', 'right']}>
      <DisclaimerModal
        visible={state.showDisclaimer}
        onAccept={state.acceptDisclaimer}
      />

      {/* Show Job Card or Chat */}
      {state.currentJob && String(state.activeView) === 'dashboard' ? (
        <View className="flex-1">
          {/* Back Button */}
          <View className="p-4 border-b border-border bg-surface flex-row items-center">
            <View
              className="flex-row items-center"
              onTouchEnd={() => state.setCurrentJob(null)}
            >
              <Text className="text-muted mr-1">←</Text>
              <Text className="text-muted">Back</Text>
            </View>
          </View>
          <JobCard data={state.currentJob} onLoadHex={handleLoadHex} />
        </View>
      ) : String(state.activeView) === 'docs' ? (
        <View className="flex-1">
          {/* Back Button */}
          <View className="p-4 border-b border-border bg-surface flex-row items-center">
            <View
              className="flex-row items-center"
              onTouchEnd={() => state.setActiveView('dashboard')}
            >
              <Text className="text-muted mr-1">←</Text>
              <Text className="text-muted">Back</Text>
            </View>
          </View>
          <Documentation />
        </View>
      ) : (
        <View className="flex-1">
          <Header
            isConnected={state.obdState.isConnected}
            hasHistory={state.messages.length > 0 || state.currentJob !== null}
            hasApiKey={!!state.appSettings.geminiApiKey || !!state.appSettings.sumopodApiKey}
            onClearHistory={handleClearHistory}
            onOpenSettings={() => state.setShowSettings(true)}
          />

          {/* Main Workspace Area (Mobile) */}
          {state.activeView === 'dashboard' ? (
            <DiagnosticDashboard
              onMenuSelect={handleMenuSelect}
              isConnected={state.obdState.isConnected}
              vehicleInfo={vehicleInfoString}
              onConnect={handleObdConnect}
            />
          ) : state.activeView === 'ai_copilot' ? (
            <AiCopilotScreen
              messages={state.messages}
              isLoading={state.isLoading}
              onBack={() => state.setActiveView('dashboard')}
              onLoadHex={handleLoadHex}
              messagesEndRef={messagesEndRef}
              scrollViewRef={scrollViewRef}
            />
          ) : state.activeView === 'data_stream' ? (
            <DataStreamGraph
              pids={livePids}
              isRecording={isRecording}
              onToggleRecord={handleRecordStart} // Basic stub
              onBack={() => state.setActiveView('dashboard')}
            />
          ) : state.activeView === 'module_list' ? (
            <ModuleList
              modules={state.scannedModules}
              isScanning={state.isScanningModules}
              scanProgress={state.scanProgress}
              onAnalyzeDtc={(dtc) => {
                const prompt = `Tolong analisa Fault Code ini: ${dtc.code} - ${dtc.description}. Apa penyebab dan solusinya?`;
                state.setInput(prompt);
                state.setActiveView('ai_copilot');
              }}
              onGenerateReport={() => {
                const faultyModules = state.scannedModules.filter(m => m.dtcCount > 0);
                const prompt = `Tolong buatkan Executive Diagnostic Report berdasarkan hasil scan All-System. Jumlah modul bermasalah: ${faultyModules.length}. Berikan plan perbaikan secara menyeluruh.`;
                state.setInput(prompt);
                state.setActiveView('ai_copilot');
              }}
              onBack={() => state.setActiveView('dashboard')}
              onStartScan={state.handleIntelligentDiagnose}
            />
          ) : (
            <View className="flex-1 items-center justify-center p-8">
              <Text className="text-xl font-bold text-foreground mb-4">
                Unknown View
              </Text>
            </View>
          )}

          {/* Input Area (Only shown in Copilot or diagnostic modes) */}
          {(state.activeView === 'ai_copilot') && (
            <InputArea
              input={state.input}
              onInputChange={state.setInput}
              selectedMedia={state.selectedMedia}
              onClearMedia={() => state.setSelectedMedia(null)}
              decodedVehicle={state.decodedVehicle}
              onClearVehicle={() => state.setDecodedVehicle(null)}
              isLoading={state.isLoading}
              isListening={isListening}
              isRecording={isRecording}
              obdState={state.obdState}
              onSubmit={state.handleSubmit}
              onVoicePress={handleVoicePress}
              onRecordStart={handleRecordStart}
              onRecordEnd={handleRecordEnd}
              onImagePress={handleImagePress}
              onServicePress={() => state.setShowServiceGrid(true)}
              onObdConnect={handleObdConnect}
            />
          )}

          {/* OBD Terminal */}
          <View className="px-4 pb-2">
            <ObdTerminal
              obdState={state.obdState}
              terminalInput={state.terminalInput}
              showTerminal={state.showTerminal}
              onTerminalInputChange={state.setTerminalInput}
              onToggleTerminal={() => state.setShowTerminal(!state.showTerminal)}
              onSendCommand={handleSendCommand}
              onConnect={handleObdConnect}
            />
          </View>

          {/* Navigation */}
          <View className="p-4 border-t border-border flex-row gap-2">
            <TouchableOpacity
              className={`flex-1 py-2 rounded items-center ${state.activeView === 'dashboard' ? 'bg-primary' : 'bg-surface'}`}
              onPress={() => state.setActiveView('dashboard')}
              activeOpacity={0.7}
            >
              <Text className={`text-xs font-bold ${state.activeView === 'dashboard' ? 'text-white' : 'text-muted'}`}>
                Dashboard
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className={`flex-1 py-2 rounded items-center ${state.activeView === 'docs' ? 'bg-surface border border-border' : 'bg-surface'}`}
              onPress={() => state.setActiveView('docs')}
              activeOpacity={0.7}
            >
              <Text className={`text-xs font-bold ${state.activeView === 'docs' ? 'text-foreground' : 'text-muted'}`}>
                Knowledge Base
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <ServiceGrid
        visible={state.showServiceGrid}
        onClose={() => state.setShowServiceGrid(false)}
        onSelect={state.handleServiceClick}
      />

      <SettingsModal
        visible={state.showSettings}
        onClose={() => state.setShowSettings(false)}
        onSettingsChange={state.setAppSettings}
        currentSettings={state.appSettings}
      />

      <ManualVehicleModal
        visible={state.showManualVehicle}
        onClose={() => state.setShowManualVehicle(false)}
        onSelect={state.handleManualVehicleSelect}
      />
    </ScreenContainer>
  );
}
