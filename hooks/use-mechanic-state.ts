import { useState, useEffect, useCallback } from 'react';
import type { 
  Message, 
  MechanicResponse, 
  VinData, 
  MediaInput,
  ObdScannerState,
  LiveData 
} from '@/shared/mechanic-types';
import { StorageService } from '@/lib/services/storage-service';
import { getMechanicAdvice } from '@/lib/services/gemini-service';
import { decodeVin } from '@/lib/services/vin-service';
import { DEMO_PROMPT } from '@/constants/service-functions';

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
  const [activeView, setActiveView] = useState<'workspace' | 'docs'>('workspace');
  const [showServiceGrid, setShowServiceGrid] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [apiKey, setApiKey] = useState('');

  // Load persisted data on mount
  useEffect(() => {
    const loadData = async () => {
      const [disclaimerAccepted, savedMessages, savedJob, savedApiKey] = await Promise.all([
        StorageService.isDisclaimerAccepted(),
        StorageService.getMessages(),
        StorageService.getCurrentJob(),
        StorageService.getApiKey(),
      ]);
      
      setShowDisclaimer(!disclaimerAccepted);
      if (savedMessages.length > 0) setMessages(savedMessages);
      if (savedJob) setCurrentJob(savedJob);
      if (savedApiKey) setApiKey(savedApiKey);
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
    setActiveView('workspace');
    
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
      if (!apiKey) {
        throw new Error('API_KEY_MISSING');
      }
      const result = await getMechanicAdvice(compositePrompt, tempMedia, apiKey);
      setCurrentJob(result);
      setActiveView('workspace');
      
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
  }, [input, selectedMedia, isLoading, obdState, apiKey]);

  // Add OBD log
  const addLog = useCallback((type: 'TX' | 'RX' | 'INFO' | 'ERR', message: string) => {
    setObdState(prev => ({
      ...prev,
      logs: [...prev.logs, { type, message, timestamp: Date.now() }].slice(-50)
    }));
  }, []);

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
    apiKey,
    
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
    setApiKey,
    
    // Actions
    acceptDisclaimer,
    clearHistory,
    handleVinDecode,
    handleServiceClick,
    handleSubmit,
    addLog,
  };
}
