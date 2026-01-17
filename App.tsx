import React, { useState, useRef, useEffect } from 'react';
import { getMechanicAdvice, MediaInput } from './services/geminiService';
import { decodeVin, VinData } from './services/vinService';
import { MechanicResponse, Message, LiveData, ObdScannerState, ConsoleLog } from './types';
import { ObdService } from './services/obdService';
import JobCard from './components/JobCard';
import Documentation from './components/Documentation';

// Extend Window interface for Web Speech API
declare global {
  interface Window {
    webkitSpeechRecognition: any;
  }
}

const DEMO_PROMPT = "Mitsubishi Pajero Sport 2021, rem bunyi berdecit dan pedal agak dalam.";
const STORAGE_KEY_MESSAGES = "mechanic_app_messages";
const STORAGE_KEY_JOB = "mechanic_app_current_job";
const STORAGE_KEY_DISCLAIMER = "mechanic_app_disclaimer_accepted";

// --- SERVICE FUNCTIONS WITH DESCRIPTIONS ---
const SERVICE_FUNCTIONS = [
  { id: 'oil', label: 'Oil Reset', icon: '🛢️', desc: 'Reset interval oli dashboard' },
  { id: 'epb', label: 'EPB Reset', icon: '🅿️', desc: 'Buka/Tutup Kaliper Rem Parkir' },
  { id: 'sas', label: 'SAS Reset', icon: 'steering', desc: 'Kalibrasi Sudut Setir (0°)' },
  { id: 'dpf', label: 'DPF Regen', icon: '💨', desc: 'Regenerasi Filter Partikulat' },
  { id: 'bms', label: 'BMS Match', icon: '🔋', desc: 'Registrasi Aki Baru' },
  { id: 'throttle', label: 'Throttle', icon: '🦋', desc: 'Learning Posisi Idle Gas' },
  { id: 'injector', label: 'Injector', icon: '💉', desc: 'Coding Nomor Injektor' },
  { id: 'abs', label: 'ABS Bleed', icon: '🛑', desc: 'Buang Angin Rem ABS' },
  { id: 'gear', label: 'Gear Learn', icon: '⚙️', desc: 'Learning Sensor Kruk As' },
  { id: 'immo', label: 'IMMO Key', icon: '🔑', desc: 'Program Kunci Immobilizer' },
  { id: 'tpms', label: 'TPMS Reset', icon: '🛞', desc: 'Reset Sensor Tekanan Ban' },
  { id: 'suspension', label: 'Suspension', icon: '🏗️', desc: 'Kalibrasi Tinggi Suspensi' },
  { id: 'afs', label: 'AFS Headlamp', icon: '💡', desc: 'Setting Lampu Adaptif' },
  { id: 'gearbox', label: 'Gearbox', icon: '🕹️', desc: 'Reset Adaptasi Transmisi' },
  { id: 'sunroof', label: 'Sunroof', icon: '☀️', desc: 'Inisialisasi Posisi Sunroof' },
  { id: 'egr', label: 'EGR Adapt', icon: '♻️', desc: 'Learning Katup EGR' },
];

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<'workspace' | 'docs'>('workspace');
  const [showDisclaimer, setShowDisclaimer] = useState(true);
  
  const [input, setInput] = useState(DEMO_PROMPT);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentJob, setCurrentJob] = useState<MechanicResponse | null>(null);
  
  // VIN Decoder State
  const [vinInput, setVinInput] = useState('');
  const [isDecoding, setIsDecoding] = useState(false);
  const [decodedVehicle, setDecodedVehicle] = useState<VinData | null>(null);

  // Media State
  const [selectedMedia, setSelectedMedia] = useState<MediaInput | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isListening, setIsListening] = useState(false);
  
  // OBD & Terminal State
  const [obdState, setObdState] = useState<ObdScannerState>({
    isConnected: false,
    isConnecting: false,
    deviceName: null,
    liveData: { rpm: 0, speed: 0, coolantTemp: 0, voltage: 0, load: 0 },
    dtcCodes: [],
    logs: []
  });
  const [terminalInput, setTerminalInput] = useState('');
  const [showTerminal, setShowTerminal] = useState(false);
  const [showServiceGrid, setShowServiceGrid] = useState(false); // Toggle for 37+ Grid

  const obdServiceRef = useRef<ObdService>(new ObdService());
  const obdIntervalRef = useRef<number | null>(null);
  const terminalScrollRef = useRef<HTMLDivElement>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recognitionRef = useRef<any>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  
  // --- PERSISTENCE & INIT EFFECT ---
  useEffect(() => {
      // Load Disclaimer Status
      const accepted = localStorage.getItem(STORAGE_KEY_DISCLAIMER);
      if (accepted === 'true') setShowDisclaimer(false);

      // Load Messages
      const savedMessages = localStorage.getItem(STORAGE_KEY_MESSAGES);
      if (savedMessages) {
          try { setMessages(JSON.parse(savedMessages)); } catch (e) {}
      }

      // Load Current Job
      const savedJob = localStorage.getItem(STORAGE_KEY_JOB);
      if (savedJob) {
          try { setCurrentJob(JSON.parse(savedJob)); } catch (e) {}
      }

      // Setup OBD Disconnect Listener
      obdServiceRef.current.setOnDisconnect(() => {
          if (obdIntervalRef.current) window.clearInterval(obdIntervalRef.current);
          setObdState(prev => ({
              ...prev,
              isConnected: false,
              isConnecting: false,
              deviceName: null,
              logs: [...prev.logs, { type: 'ERR', message: 'Device Disconnected', timestamp: Date.now() }]
          }));
          alert("Koneksi OBD Terputus. Silakan sambungkan ulang.");
      });
  }, []);

  // Save state on change
  useEffect(() => {
      if(messages.length > 0) localStorage.setItem(STORAGE_KEY_MESSAGES, JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
      if(currentJob) localStorage.setItem(STORAGE_KEY_JOB, JSON.stringify(currentJob));
  }, [currentJob]);

  useEffect(() => scrollToBottom(), [messages]);
  
  useEffect(() => {
    if (showTerminal && terminalScrollRef.current) {
        terminalScrollRef.current.scrollTop = terminalScrollRef.current.scrollHeight;
    }
  }, [obdState.logs, showTerminal]);

  useEffect(() => {
    if ('webkitSpeechRecognition' in window) {
      const recognition = new window.webkitSpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'id-ID'; 
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(prev => {
          const separator = prev && prev !== DEMO_PROMPT ? " " : "";
          return (prev === DEMO_PROMPT ? "" : prev) + separator + transcript;
        });
        setIsListening(false);
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);
      recognitionRef.current = recognition;
    }
    return () => {
        if (obdIntervalRef.current) window.clearInterval(obdIntervalRef.current);
        obdServiceRef.current.disconnect();
    }
  }, []);

  const handleAcceptDisclaimer = () => {
      localStorage.setItem(STORAGE_KEY_DISCLAIMER, 'true');
      setShowDisclaimer(false);
  };

  const clearHistory = () => {
      if(confirm("Hapus semua riwayat diagnosa?")) {
          setMessages([]);
          setCurrentJob(null);
          localStorage.removeItem(STORAGE_KEY_MESSAGES);
          localStorage.removeItem(STORAGE_KEY_JOB);
      }
  };

  const addLog = (type: 'TX' | 'RX' | 'INFO' | 'ERR', message: string) => {
      setObdState(prev => ({
          ...prev,
          logs: [...prev.logs, { type, message, timestamp: Date.now() }].slice(-50)
      }));
  };

  // --- OBD CONNECTION ---
  const connectObd = async () => {
    setObdState(prev => ({ ...prev, isConnecting: true }));
    addLog('INFO', 'Connecting to vLinker MC+...');
    try {
        const name = await obdServiceRef.current.connect();
        setObdState(prev => ({ ...prev, isConnected: true, deviceName: name, isConnecting: false }));
        addLog('INFO', `Connected to ${name}`);
        startLivePolling();
    } catch (e) {
        addLog('ERR', 'Connection Failed');
        alert("Gagal koneksi OBD. Pastikan Bluetooth aktif.");
        setObdState(prev => ({ ...prev, isConnecting: false }));
    }
  };

  const startLivePolling = () => {
    if (obdIntervalRef.current) window.clearInterval(obdIntervalRef.current);
    obdIntervalRef.current = window.setInterval(async () => {
        if (showTerminal && document.activeElement === document.getElementById('terminal-input')) return;
        const service = obdServiceRef.current;
        try {
            const rpmRaw = await service.sendCommand("010C");
            const speedRaw = await service.sendCommand("010D");
            const tempRaw = await service.sendCommand("0105");
            const voltRaw = await service.sendCommand("0142");
            const loadRaw = await service.sendCommand("0104");
            setObdState(prev => ({
                ...prev,
                liveData: {
                    rpm: service.parseRPM(rpmRaw),
                    speed: service.parseSpeed(speedRaw),
                    coolantTemp: service.parseTemp(tempRaw),
                    voltage: service.parseVoltage(voltRaw),
                    load: service.parseLoad(loadRaw)
                }
            }));
        } catch (e) {}
    }, 1500);
  };

  const sendTerminalCommand = async (cmdOverride?: string) => {
      const cmd = cmdOverride || terminalInput.toUpperCase();
      if (!cmd.trim()) return;
      if (!obdState.isConnected) {
          alert("Connect OBD first.");
          return;
      }
      
      addLog('TX', cmd);
      if(!cmdOverride) setTerminalInput('');

      if (obdIntervalRef.current) window.clearInterval(obdIntervalRef.current);

      try {
          const resp = await obdServiceRef.current.sendRaw(cmd);
          addLog('RX', resp);
      } catch (err: any) {
          addLog('ERR', err.message || "Command failed");
      }
      setTimeout(() => startLivePolling(), 2000);
  };

  const handleVinDecode = async () => {
    if (!vinInput.trim()) return;
    setIsDecoding(true);
    setDecodedVehicle(null);
    try {
      const data: VinData | null = await decodeVin(vinInput);
      if (data) {
        setDecodedVehicle(data);
        const vehicleString = `Kendaraan: ${data.year} ${data.make} ${data.model} ${data.engine ? `(${data.engine})` : ''}`;
        setInput(prev => {
           if (prev.includes(data.model)) return prev;
           if (prev === DEMO_PROMPT) return `${vehicleString}, `;
           return `${vehicleString}\n${prev}`;
        });
      } else { alert("VIN tidak ditemukan."); }
    } catch (e) { console.error(e); } finally { setIsDecoding(false); }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedMedia({ data: reader.result as string, mimeType: file.type });
      };
      reader.readAsDataURL(file);
    }
  };

  // --- AUDIO RECORDING ---
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = () => {
          setSelectedMedia({ data: reader.result as string, mimeType: 'audio/webm' });
        };
        reader.readAsDataURL(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };
      recorder.start();
      setIsRecording(true);
    } catch (err) { alert("Tidak dapat mengakses mikrofon."); }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const toggleListening = () => {
    if (!recognitionRef.current) { alert("Voice Input tidak didukung browser ini."); return; }
    if (isListening) { recognitionRef.current.stop(); } else { recognitionRef.current.start(); setIsListening(true); }
  };

  // --- SERVICE FUNCTION CLICK HANDLER ---
  const handleServiceClick = (serviceLabel: string) => {
      const vehicleCtx = decodedVehicle 
         ? `${decodedVehicle.year} ${decodedVehicle.make} ${decodedVehicle.model}`
         : (input !== DEMO_PROMPT ? input.split(',')[0] : "mobil ini");
      
      const prompt = `Lakukan prosedur ${serviceLabel} untuk ${vehicleCtx}. Berikan Command HEX UDS/ELM327 jika ada (vLinker MC+), atau langkah manual.`;
      setInput(prompt);
      setShowServiceGrid(false);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if(e) e.preventDefault();
    if (!input.trim() && !selectedMedia) return;
    if (isLoading) return;

    const userText = input.trim();
    const mediaType = selectedMedia ? (selectedMedia.mimeType.startsWith('image') ? 'image' : 'audio') : undefined;
    
    let liveDataCtx = "";
    if (obdState.isConnected) {
        liveDataCtx = `\n[LIVE OBD DATA]: RPM=${obdState.liveData.rpm}, Temp=${obdState.liveData.coolantTemp}C, Load=${obdState.liveData.load}%, Volt=${obdState.liveData.voltage}V.`;
    }

    // UPDATED PROMPT: Request EVERYTHING by default, smart trigger for HEX commands.
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
      const result = await getMechanicAdvice(compositePrompt, tempMedia);
      setCurrentJob(result);
      setActiveView('workspace'); // Auto switch to workspace on result
      
      if(result.obd_hex_commands && result.obd_hex_commands.length > 0) {
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
    } catch (error) {
      console.error(error);
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "Error analisis AI. Coba lagi.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-slate-950 text-slate-200 overflow-hidden selection:bg-blue-500/30 relative">
      
      {/* DISCLAIMER MODAL */}
      {showDisclaimer && (
          <div className="absolute inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl animate-fade-in">
                  <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-red-900/50 rounded-full flex items-center justify-center border border-red-500/50">
                          <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                      </div>
                      <h2 className="text-xl font-bold text-white">Professional Liability Agreement</h2>
                  </div>
                  <div className="bg-slate-800 rounded p-4 text-sm text-slate-300 mb-6 max-h-60 overflow-y-auto custom-scrollbar">
                      <p className="mb-2"><strong>1. Alat Bantu, Bukan Pengganti:</strong> Aplikasi ini adalah alat bantu Artificial Intelligence (AI). Hasil diagnosa, wiring diagram, dan spesifikasi torsi mungkin memiliki ketidakakuratan. Selalu verifikasi dengan Manual Servis Resmi (Factory Service Manual).</p>
                      <p className="mb-2"><strong>2. Risiko Engineering Mode:</strong> Penggunaan fitur manipulasi ECU (Reset/Coding/UDS) memiliki risiko kerusakan permanen pada modul kendaraan jika tidak dilakukan dengan benar. Pengguna bertanggung jawab penuh atas segala dampak yang timbul.</p>
                      <p className="mb-2"><strong>3. Pembebasan Tanggung Jawab:</strong> Pengembang aplikasi tidak bertanggung jawab atas kerusakan kendaraan, cedera pribadi, atau kerugian finansial yang diakibatkan oleh penggunaan saran dari aplikasi ini.</p>
                      <p><strong>4. Keselamatan Kerja:</strong> Selalu gunakan APD dan prosedur keselamatan bengkel (Safety Stand, Wheel Chock, Battery Disconnect) saat bekerja.</p>
                  </div>
                  <button onClick={handleAcceptDisclaimer} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg transition-colors">
                      SAYA MENGERTI & SETUJU
                  </button>
              </div>
          </div>
      )}

      {/* Sidebar */}
      <div className={`flex flex-col w-full md:w-[400px] lg:w-[450px] border-r border-slate-800 bg-slate-900 flex-shrink-0 ${currentJob || activeView === 'docs' ? 'hidden md:flex' : 'flex'}`}>
        <header className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900 sticky top-0 z-10">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-lg flex items-center justify-center shadow-lg shadow-blue-900/20">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <h1 className="font-bold text-white leading-tight">Mechanic Co-Pilot</h1>
              <div className="flex items-center space-x-1">
                 <span className="text-[9px] text-white font-bold bg-indigo-600 px-1.5 py-0.5 rounded">Pro Scanner</span>
                 {obdState.isConnected && <span className="text-[9px] text-emerald-400 bg-emerald-900/30 px-1.5 py-0.5 rounded animate-pulse">CONNECTED</span>}
              </div>
            </div>
          </div>
          {/* Clear History Button */}
          {(messages.length > 0 || currentJob) && (
              <button onClick={clearHistory} className="text-slate-500 hover:text-red-400" title="Clear History">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              </button>
          )}
        </header>

        {/* Chat */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-slate-500 opacity-60">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
              <p className="text-sm text-center max-w-[200px]">
                Support: ECU Coding, Active Test, 37+ Resets (via AI + vLinker MC+)
              </p>
            </div>
          )}
          
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-2xl p-4 ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-slate-800 text-slate-200 border border-slate-700 rounded-bl-none'}`}>
                {/* Render Media if exists */}
                {msg.media && msg.mediaType === 'image' && (
                    <div className="mb-2">
                         <img src={msg.media} alt="Uploaded attachment" className="rounded-lg max-h-48 border border-white/20" />
                    </div>
                )}
                {msg.media && msg.mediaType === 'audio' && (
                    <div className="mb-2 flex items-center space-x-2 bg-white/20 p-2 rounded-lg">
                        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>
                        <span className="text-xs font-bold">Audio Clip Attached</span>
                    </div>
                )}

                <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>

                {/* AI HEX SUGGESTIONS IN CHAT */}
                {msg.role === 'assistant' && msg.data?.obd_hex_commands && (
                    <div className="mt-3 bg-slate-900 rounded p-2 border border-indigo-500/30">
                        <div className="text-[10px] text-indigo-400 font-bold uppercase mb-2">AI Generated UDS Commands</div>
                        {msg.data.obd_hex_commands.map((cmd, i) => (
                            <div key={i} className="flex justify-between items-center bg-black/40 p-2 rounded mb-1">
                                <div>
                                    <div className="text-xs text-slate-300 font-mono">{cmd.hex_command}</div>
                                    <div className="text-[10px] text-slate-500">{cmd.description}</div>
                                </div>
                                <button 
                                    onClick={() => {
                                        setTerminalInput(cmd.hex_command);
                                        setShowTerminal(true);
                                    }}
                                    className="text-[10px] bg-indigo-600 hover:bg-indigo-500 text-white px-2 py-1 rounded"
                                >
                                    USE
                                </button>
                            </div>
                        ))}
                    </div>
                )}
              </div>
            </div>
          ))}
          {isLoading && <div className="p-4 text-slate-500 text-xs animate-pulse">AI Engineer is analyzing protocol...</div>}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area (RESTRUCTURED & RESTORED) */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/90 backdrop-blur-sm">
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            
            {/* 1. Context Badges (Restored & Improved) */}
            {(decodedVehicle || selectedMedia) && (
              <div className="flex gap-2 flex-wrap mb-1 animate-fade-in">
                {decodedVehicle && (
                  <div className="flex items-center bg-emerald-900/40 border border-emerald-500/30 text-emerald-300 text-[10px] font-bold px-2 py-1 rounded-lg">
                      <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                      {decodedVehicle.year} {decodedVehicle.model}
                      <button onClick={() => setDecodedVehicle(null)} type="button" className="ml-2 hover:text-emerald-100 border-l border-emerald-700/50 pl-2">✕</button>
                  </div>
                )}
                {selectedMedia && (
                  <div className={`flex items-center border rounded-lg overflow-hidden ${selectedMedia.mimeType.startsWith('image') ? 'bg-blue-900/40 border-blue-500/30 text-blue-300' : 'bg-rose-900/40 border-rose-500/30 text-rose-300'}`}>
                      {selectedMedia.mimeType.startsWith('image') ? (
                          <div className="relative group">
                              <img src={selectedMedia.data} alt="Preview" className="h-10 w-10 object-cover" />
                              <button onClick={() => setSelectedMedia(null)} type="button" className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white text-xs">✕</button>
                          </div>
                      ) : (
                          <div className="flex items-center px-2 py-1 text-[10px] font-bold">
                              <span>🔊 Audio Ready</span>
                              <button onClick={() => setSelectedMedia(null)} type="button" className="ml-2 hover:text-white border-l border-white/20 pl-2">✕</button>
                          </div>
                      )}
                  </div>
                )}
              </div>
            )}

            {/* 2. Main Input (Reduced Size) */}
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={isListening ? "Mendengarkan..." : "Deskripsikan keluhan, suara mesin, atau masukkan VIN..."}
              className={`w-full bg-slate-950 text-white placeholder-slate-500 rounded-xl border p-4 text-sm resize-none custom-scrollbar transition-all shadow-inner focus:shadow-lg focus:shadow-blue-900/10 ${isListening ? 'border-emerald-500 ring-1 ring-emerald-500' : 'border-slate-700 focus:border-blue-500'}`}
              style={{ height: '80px' }} 
              onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { handleSubmit(e); } }}
            />

            {/* 3. Primary Toolbar (Restored Multimodal Buttons) */}
            <div className="flex items-center justify-between gap-2">
                <div className="flex gap-2">
                    {/* Voice Input */}
                    <button type="button" onClick={toggleListening} className={`p-2.5 rounded-lg border transition-all ${isListening ? 'bg-emerald-600 border-emerald-500 text-white animate-pulse' : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-emerald-400 hover:border-emerald-500/50'}`} title="Dikte Suara">
                       <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                    </button>
                    
                    {/* Audio Record */}
                    <button type="button" onMouseDown={startRecording} onMouseUp={stopRecording} onTouchStart={startRecording} onTouchEnd={stopRecording} className={`p-2.5 rounded-lg border transition-all ${isRecording ? 'bg-rose-600 border-rose-500 text-white scale-105 shadow-lg shadow-rose-900/50' : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-rose-400 hover:border-rose-500/50'}`} title="Tahan Rekam">
                       <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" /></svg>
                    </button>
                    
                    {/* Image Upload */}
                    <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageUpload} hidden />
                    <button type="button" onClick={() => fileInputRef.current?.click()} className={`p-2.5 rounded-lg border transition-all ${selectedMedia?.mimeType.startsWith('image') ? 'bg-blue-900/30 border-blue-500 text-blue-400' : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-blue-400 hover:border-blue-500/50'}`} title="Upload Foto">
                       <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    </button>

                    {/* OBD Connect (If not connected) */}
                    {!obdState.isConnected && (
                        <button type="button" onClick={connectObd} disabled={obdState.isConnecting} className={`p-2.5 rounded-lg border transition-all ${obdState.isConnecting ? 'bg-purple-900/30 border-purple-500' : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-purple-400 hover:border-purple-500/50'}`} title="Connect OBD">
                            {obdState.isConnecting ? <span className="animate-spin text-purple-400">↻</span> : <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
                        </button>
                    )}
                </div>

                {/* Submit Button */}
                <button type="submit" disabled={isLoading || (!input.trim() && !selectedMedia)} className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-lg font-bold shadow-lg shadow-blue-900/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
                  <span>Analisa</span>
                  <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg>
                </button>
            </div>

            {/* 4. Secondary Options (Chips Removed, Service Func Kept) */}
            <div className="flex flex-wrap gap-2 items-center pt-2 border-t border-slate-800/50 mt-1">
                <button
                    type="button"
                    onClick={() => setShowServiceGrid(!showServiceGrid)}
                    className={`text-[10px] md:text-xs font-bold px-3 py-1.5 rounded-full border transition-all flex items-center ${showServiceGrid ? 'bg-amber-600 border-amber-500 text-white' : 'bg-slate-800 border-slate-600 text-amber-500'}`}
                >
                    <span className="mr-1">🛠️</span> Service Func
                </button>
                {/* Output Options Filter Chips Removed */}
            </div>

            {/* SERVICE GRID OVERLAY (Positioned relative to container) */}
            {showServiceGrid && (
                <div className="bg-slate-900 border border-slate-700 rounded-xl p-3 grid grid-cols-4 gap-2 animate-fade-in shadow-2xl absolute bottom-full left-0 right-0 mb-2 z-50 mx-4">
                    <div className="col-span-4 flex justify-between items-center mb-1 pb-2 border-b border-slate-700">
                        <span className="text-xs font-bold text-amber-500">37+ Special Functions</span>
                        <button type="button" onClick={() => setShowServiceGrid(false)} className="text-slate-400 hover:text-white">✕</button>
                    </div>
                    {SERVICE_FUNCTIONS.map(svc => (
                        <button 
                            key={svc.id}
                            type="button"
                            onClick={() => handleServiceClick(svc.label)}
                            className="flex flex-col items-center justify-center p-2 bg-slate-800 rounded hover:bg-slate-700 border border-slate-700 hover:border-amber-500/50 transition-all group relative"
                        >
                            <span className="text-xl mb-1">{svc.icon}</span>
                            <span className="text-[9px] text-slate-300 text-center leading-tight">{svc.label}</span>
                            <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black text-white text-[9px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                                {svc.desc}
                            </div>
                        </button>
                    ))}
                </div>
            )}

            {/* Terminal */}
            {(obdState.isConnected || showTerminal) && (
                <div className="bg-slate-950 border border-emerald-500/30 rounded-xl p-3 shadow-lg relative overflow-hidden mt-2">
                    <div className="flex justify-between items-center mb-2">
                        <div className="text-[10px] text-emerald-400 font-bold uppercase flex items-center">
                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-2 animate-pulse"></span>
                            {obdState.isConnected ? 'vLinker Online' : 'Terminal Offline'}
                        </div>
                        <button type="button" onClick={() => setShowTerminal(!showTerminal)} className="text-[9px] text-slate-400 border border-slate-700 px-2 rounded hover:text-white">
                           {showTerminal ? 'Hide' : 'Show'}
                        </button>
                    </div>

                    {!showTerminal && obdState.isConnected ? (
                        <div className="grid grid-cols-4 gap-2 text-center">
                             <div className="bg-slate-900/80 rounded p-1"><div className="text-[8px] text-slate-500">RPM</div><div className="text-white font-mono text-xs">{obdState.liveData.rpm}</div></div>
                             <div className="bg-slate-900/80 rounded p-1"><div className="text-[8px] text-slate-500">TEMP</div><div className="text-white font-mono text-xs">{obdState.liveData.coolantTemp}</div></div>
                             <div className="bg-slate-900/80 rounded p-1"><div className="text-[8px] text-slate-500">VOLT</div><div className="text-white font-mono text-xs">{obdState.liveData.voltage}</div></div>
                             <button type="button" onClick={connectObd} className="bg-emerald-900/30 text-emerald-400 text-[9px] rounded border border-emerald-500/30">RECONNECT</button>
                        </div>
                    ) : (
                        <div className="flex flex-col h-32">
                            <div ref={terminalScrollRef} className="flex-1 bg-black rounded border border-slate-700 overflow-y-auto p-2 font-mono text-[9px] space-y-0.5 mb-2 custom-scrollbar">
                                {obdState.logs.map((log, i) => (
                                    <div key={i} className={`flex ${log.type === 'TX' ? 'text-blue-400' : log.type === 'RX' ? 'text-green-400' : log.type === 'ERR' ? 'text-red-400' : 'text-slate-400'}`}>
                                        <span className="w-6 opacity-50">{log.type}</span><span>{log.message}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="flex gap-1">
                                <input 
                                    id="terminal-input"
                                    type="text" 
                                    value={terminalInput}
                                    onChange={(e) => setTerminalInput(e.target.value)}
                                    placeholder="HEX Command (e.g. 31 01)"
                                    className="flex-1 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-[10px] font-mono text-white focus:border-emerald-500 outline-none"
                                    onKeyDown={(e) => e.key === 'Enter' && sendTerminalCommand()}
                                />
                                <button onClick={() => sendTerminalCommand()} className="bg-emerald-900/30 text-emerald-400 border border-emerald-500/30 rounded px-2 text-[10px] font-bold">SEND</button>
                            </div>
                        </div>
                    )}
                </div>
            )}
          </form>

          {/* SIDEBAR FOOTER: NAVIGATION */}
          <div className="mt-4 pt-2 border-t border-slate-800 grid grid-cols-2 gap-2">
              <button 
                  onClick={() => setActiveView('workspace')} 
                  className={`py-2 rounded text-xs font-bold transition-all ${activeView === 'workspace' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-500 hover:text-slate-300'}`}
              >
                  Workspace
              </button>
              <button 
                  onClick={() => setActiveView('docs')} 
                  className={`py-2 rounded text-xs font-bold transition-all ${activeView === 'docs' ? 'bg-slate-700 text-white' : 'bg-slate-800 text-slate-500 hover:text-slate-300'}`}
              >
                  Knowledge Base
              </button>
          </div>

        </div>
      </div>

      {/* Main Content (Job Card OR Documentation) */}
      <main className={`flex-1 flex flex-col h-full bg-slate-950 overflow-hidden relative ${!currentJob && activeView !== 'docs' ? 'hidden md:flex' : 'flex'}`}>
        <div className="absolute inset-0 z-0 opacity-10 pointer-events-none" style={{backgroundImage: `radial-gradient(circle at 1px 1px, #3b82f6 1px, transparent 0)`, backgroundSize: '40px 40px'}}></div>

        <div className="md:hidden p-4 border-b border-slate-800 flex items-center bg-slate-900 z-10">
           <button onClick={() => { setCurrentJob(null); setActiveView('workspace'); }} className="text-slate-400 flex items-center">
             <svg className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
             Back
           </button>
        </div>

        {activeView === 'docs' ? (
             <Documentation />
        ) : currentJob ? (
          <div className="flex-1 overflow-y-auto p-4 md:p-6 z-10 custom-scrollbar">
            <JobCard 
                data={currentJob} 
                onLoadHex={(hex) => {
                    setTerminalInput(hex);
                    setShowTerminal(true);
                }} 
            />
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center z-10 text-slate-600 p-8 text-center">
            <div className="w-24 h-24 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center mb-6 shadow-2xl relative">
               <div className="absolute inset-0 bg-blue-500/10 rounded-full animate-ping"></div>
               <svg className="h-10 w-10 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5.5 3v4a6.5 6.5 0 0013 0V3 M12 13.5v1.5 M12 15a4 4 0 100 8 4 4 0 000-8z" />
               </svg>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-slate-500 mb-2">Mechanic Co-Pilot</h2>
            <p className="max-w-md mx-auto mb-6 text-sm">AI-Powered Engineering Tool. Support UDS, SW-CAN, MS-CAN.</p>
          </div>
        )}
      </main>

    </div>
  );
};

export default App;