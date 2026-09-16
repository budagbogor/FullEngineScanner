import { useState, useEffect, useCallback } from 'react';
import type {
  Message,
  MechanicResponse,
  VinData,
  MediaInput,
  ObdScannerState,
  LiveData,
  AppSettings
} from '@/shared/mechanic-types';
import { StorageService } from '@/lib/services/storage-service';
import { getMechanicAdvice } from '@/lib/services/gemini-service';
import { decodeVin } from '@/lib/services/vin-service';
import { obdService } from '@/lib/services/obd-service';
import { DEMO_PROMPT } from '@/constants/service-functions';
import { EcuModule } from '@/components/mechanic/module-list';

const initialLiveData: LiveData = {
  rpm: 0,
  speed: 0,
  coolantTemp: 0,
  voltage: 0,
  load: 0,
};

const initialObdState: ObdScannerState = {
  isConnected: false,
  isConnecting: false,
  deviceName: null,
  liveData: initialLiveData,
  dtcCodes: [],
  logs: [],
};

export function useMechanicState() {
  // Core state
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentJob, setCurrentJob] = useState<MechanicResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showDisclaimer, setShowDisclaimer] = useState(true);

  // Input state
  const [input, setInput] = useState(DEMO_PROMPT);
  const [selectedMedia, setSelectedMedia] = useState<MediaInput | null>(null);

  // VIN state
  const [vinInput, setVinInput] = useState('');
  const [isDecoding, setIsDecoding] = useState(false);
  const [decodedVehicle, setDecodedVehicle] = useState<VinData | null>(null);

  // OBD state
  const [obdState, setObdState] = useState<ObdScannerState>(initialObdState);
  const [terminalInput, setTerminalInput] = useState('');
  const [showTerminal, setShowTerminal] = useState(false);

  // UI state
  const [activeView, setActiveView] = useState<'dashboard' | 'ai_copilot' | 'data_stream' | 'docs' | 'module_list'>('dashboard');
  const [showServiceGrid, setShowServiceGrid] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showManualVehicle, setShowManualVehicle] = useState(false);
  const [appSettings, setAppSettings] = useState<AppSettings>({
    provider: 'gemini',
    geminiApiKey: '',
    sumopodApiKey: '',
    sumopodBaseUrl: '',
    sumopodModel: 'llama-3.1-8b',
    saveScope: 'global',
  });

  // Diagnostic State (Topology)
  const [scannedModules, setScannedModules] = useState<EcuModule[]>([]);
  const [isScanningModules, setIsScanningModules] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);

  // Data Stream State
  const [isRecording, setIsRecording] = useState(false);

  // Load persisted data on mount
  useEffect(() => {
    const loadData = async () => {
      const [disclaimerAccepted, savedMessages, savedJob, savedSettings] = await Promise.all([
        StorageService.isDisclaimerAccepted(),
        StorageService.getMessages(),
        StorageService.getCurrentJob(),
        StorageService.getSettings(),
      ]);

      setShowDisclaimer(!disclaimerAccepted);
      if (savedMessages.length > 0) setMessages(savedMessages);
      if (savedJob) setCurrentJob(savedJob);
      if (savedSettings) setAppSettings(savedSettings);
    };

    loadData();
  }, []);

  // Persist messages when they change
  useEffect(() => {
    if (messages.length > 0) {
      StorageService.saveMessages(messages);
    }
  }, [messages]);

  // Persist current job when it changes
  useEffect(() => {
    if (currentJob) {
      StorageService.saveCurrentJob(currentJob);
    }
  }, [currentJob]);

  // OBD Logging Implementation
  const addLog = useCallback((type: 'TX' | 'RX' | 'INFO' | 'ERR', message: string) => {
    setObdState(prev => ({
      ...prev,
      logs: [...prev.logs, { type, message, timestamp: Date.now() }].slice(-50)
    }));
  }, []);

  useEffect(() => {
    obdService.setLogHandler(addLog);
  }, [addLog]);

  // Handle OBD Polling
  const handleRecordStart = useCallback(() => {
    if (isRecording) {
      obdService.stopPolling();
      setIsRecording(false);
      addLog('INFO', 'Data Stream polling stopped.');
    } else {
      setIsRecording(true);
      addLog('INFO', 'Data Stream polling started.');
      obdService.startPolling((data) => {
        setObdState(prev => ({
          ...prev,
          liveData: {
            ...prev.liveData,
            rpm: data.rpm,
            coolantTemp: data.temp,
            voltage: data.volt,
            speed: data.speed,
            load: data.load
          }
        }));
      }, 1000); // 1 second intervals
    }
  }, [isRecording, addLog]);

  const handleRecordEnd = useCallback(() => {
    if (isRecording) {
      obdService.stopPolling();
      setIsRecording(false);
      addLog('INFO', 'Data Stream polling stopped.');
    }
  }, [isRecording, addLog]);

  // OBD Connection Actions
  const handleObdConnect = useCallback(async () => {
    setObdState(prev => ({ ...prev, isConnecting: true }));
    try {
      const success = await obdService.connect();
      setObdState(prev => ({
        ...prev,
        isConnected: success,
        isConnecting: false,
        deviceName: success ? (obdService as any).device?.name || 'vLinker MC+' : null
      }));
    } catch (error) {
      addLog('ERR', 'Bluetooth connection failed');
      setObdState(prev => ({ ...prev, isConnecting: false }));
    }
  }, [addLog]);

  const handleSendObdCommand = useCallback(async (cmd: string) => {
    if (!obdState.isConnected) return;
    await obdService.sendCommand(cmd);
  }, [obdState.isConnected]);

  // Accept disclaimer
  const acceptDisclaimer = useCallback(async () => {
    await StorageService.acceptDisclaimer();
    setShowDisclaimer(false);
  }, []);

  // Clear history
  const clearHistory = useCallback(async () => {
    setMessages([]);
    setCurrentJob(null);
    setDecodedVehicle(null);
    setSelectedMedia(null);
    setObdState(prev => ({ ...prev, logs: [] }));
    setShowTerminal(false);
    setTerminalInput('');
    setShowServiceGrid(false);
    setInput(DEMO_PROMPT);
    setActiveView('dashboard');

    await StorageService.clearAll();
  }, []);

  // Handle VIN decode
  const handleVinDecode = useCallback(async () => {
    if (!vinInput.trim()) return;

    setIsDecoding(true);
    setDecodedVehicle(null);

    try {
      const data = await decodeVin(vinInput);
      if (data) {
        setDecodedVehicle(data);
        const vehicleString = `Kendaraan: ${data.year} ${data.make} ${data.model} ${data.engine ? `(${data.engine})` : ''}`;
        setInput(prev => {
          if (prev.includes(data.model)) return prev;
          if (prev === DEMO_PROMPT) return `${vehicleString}, `;
          return `${vehicleString}\n${prev}`;
        });
      }
    } catch (error) {
      console.error('VIN decode error:', error);
    } finally {
      setIsDecoding(false);
    }
  }, [vinInput]);

  // Handle service function click
  const handleServiceClick = useCallback((serviceLabel: string) => {
    const vehicleCtx = decodedVehicle
      ? `${decodedVehicle.year} ${decodedVehicle.make} ${decodedVehicle.model}`
      : (input !== DEMO_PROMPT ? input.split(',')[0] : "mobil ini");

    const prompt = `Lakukan prosedur ${serviceLabel} untuk ${vehicleCtx}. Berikan Command HEX UDS/ELM327 jika ada (vLinker MC+), atau langkah manual.`;
    setInput(prompt);
    setShowServiceGrid(false);
  }, [decodedVehicle, input]);

  // Handle Intelligent Diagnose
  const handleIntelligentDiagnose = useCallback(async () => {
    setActiveView('module_list');
    setIsScanningModules(true);
    setScanProgress(0);
    setScannedModules([]);

    // Mock scan sequence mapping standard UDS addresses
    const targetModules = [
      { id: '0x07E0', name: 'Engine Control Module (ECM)' },
      { id: '0x07E1', name: 'Transmission Control Module (TCM)' },
      { id: '0x07E2', name: 'Anti-lock Braking System (ABS)' },
      { id: '0x07E3', name: 'Supplemental Restraint System (SRS)' },
      { id: '0x07E4', name: 'Body Control Module (BCM)' }
    ];

    try {
      // Switch network if OBD is connected
      if (obdState.isConnected) {
        addLog('INFO', 'Starting All-System Topology Scan...');
        await obdService.switchNetwork('STP 33'); // HS-CAN
      }

      for (let i = 0; i < targetModules.length; i++) {
        const mod = targetModules[i];
        setScannedModules(prev => [...prev, { ...mod, status: 'scanning', dtcCount: 0 }]);

        // Mock delay for pinging ECU
        await new Promise(r => setTimeout(r, 1200));

        let dtcCount = 0;
        let status: 'clean' | 'faulty' | 'unknown' = 'unknown';

        // If connected, do real UDS read (simulated real in service)
        if (obdState.isConnected) {
          const dtcs = await obdService.readUdsDtcs(); // Requires modifying target address in real life
          dtcCount = dtcs.length;
          status = dtcCount > 0 ? 'faulty' : 'clean';
        } else {
          // Complete Mock for UI
          const isFaulty = Math.random() > 0.7; // 30% chance of fault
          dtcCount = isFaulty ? Math.floor(Math.random() * 3) + 1 : 0;
          status = dtcCount > 0 ? 'faulty' : 'clean';
        }

        setScannedModules(prev =>
          prev.map(p => p.id === mod.id ? { ...p, status, dtcCount } : p)
        );

        setScanProgress(((i + 1) / targetModules.length) * 100);
      }
    } catch (e) {
      console.error('Scan failed', e);
      addLog('ERR', 'Topology scan aborted');
    } finally {
      setIsScanningModules(false);
      setScanProgress(100);
      if (obdState.isConnected) {
        addLog('INFO', 'Topology Scan Complete');
      }
    }
  }, [obdState.isConnected, addLog]);

  // Submit query
  const handleSubmit = useCallback(async () => {
    if (!input.trim() && !selectedMedia) return;
    if (isLoading) return;

    const userText = input.trim();
    const mediaType = selectedMedia
      ? (selectedMedia.mimeType.startsWith('image') ? 'image' : 'audio')
      : undefined;

    let liveDataCtx = "";
    if (obdState.isConnected) {
      liveDataCtx = `\n[LIVE OBD DATA]: RPM=${obdState.liveData.rpm}, Temp=${obdState.liveData.coolantTemp}C, Load=${obdState.liveData.load}%, Volt=${obdState.liveData.voltage}V.`;
    }

    const compositePrompt = `${userText}\n${liveDataCtx}\n\n[USER REQUEST] Berikan diagnosa lengkap, wiring diagram, SOP, spesifikasi parts, dan estimasi biaya. Saya menggunakan vLinker MC+ (Support SW-CAN/MS-CAN/UDS). Jika perbaikan ini membutuhkan Reset/Coding/Active Test, WAJIB sertakan HEX Command spesifik.`;

    setInput('');
    const tempMedia = selectedMedia;
    setSelectedMedia(null);

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: userText,
      media: tempMedia?.data,
      mediaType: mediaType,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const provider = appSettings.provider;
      const key = provider === 'gemini' ? appSettings.geminiApiKey : appSettings.sumopodApiKey;
      if (!key) {
        throw new Error('API_KEY_MISSING');
      }
      const result = await getMechanicAdvice(compositePrompt, tempMedia, appSettings);
      setCurrentJob(result);
      setActiveView('ai_copilot');

      if (result.obd_hex_commands && result.obd_hex_commands.length > 0) {
        setShowTerminal(true);
      }

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Analisis Selesai.`,
        data: result,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMsg]);
    } catch (error: any) {
      console.error('Submit error:', error);
      let errorContent = "Error analisis AI. Coba lagi.";
      if (error.message === 'API_KEY_MISSING') {
        errorContent = "⚠️ API Key belum diatur. Klik tombol ⚙️ di header untuk memasukkan Gemini API Key.";
      } else if (error.message?.includes('API key')) {
        errorContent = "⚠️ API Key tidak valid. Periksa kembali API Key Anda di Pengaturan.";
      }
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: errorContent,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  }, [input, selectedMedia, isLoading, obdState, appSettings]);

  const handleManualVehicleSelect = (vehicle: { make: string; model: string; year: string }) => {
    setDecodedVehicle({
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year,
      bodyClass: 'Unknown',
      engine: 'Unknown',
      fuel: 'Unknown'
    });
    setShowManualVehicle(false);
    addLog('INFO', `Manual Vehicle Selected: ${vehicle.year} ${vehicle.make} ${vehicle.model}`);
    setActiveView('dashboard');
  };

  return {
    // State
    messages,
    currentJob,
    isLoading,
    showDisclaimer,
    input,
    selectedMedia,
    vinInput,
    isDecoding,
    decodedVehicle,
    obdState,
    terminalInput,
    showTerminal,
    activeView,
    showServiceGrid,
    showSettings,
    showManualVehicle,
    appSettings,
    scannedModules,
    isScanningModules,
    scanProgress,
    isRecording,

    // Setters
    setInput,
    setSelectedMedia,
    setVinInput,
    setDecodedVehicle,
    setObdState,
    setTerminalInput,
    setShowTerminal,
    setActiveView,
    setShowServiceGrid,
    setCurrentJob,
    setShowSettings,
    setShowManualVehicle,
    setAppSettings,

    // Actions
    acceptDisclaimer,
    clearHistory,
    handleVinDecode,
    handleManualVehicleSelect,
    handleServiceClick,
    handleIntelligentDiagnose,
    handleSubmit,
    addLog,
    handleRecordStart,
    handleRecordEnd,
    handleObdConnect,
    handleSendObdCommand,
  };
}
