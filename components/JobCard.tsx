import React, { useState } from 'react';
import { MechanicResponse, DTCItem, TSBItem } from '../types';

interface JobCardProps {
  data: MechanicResponse;
  onLoadHex?: (hex: string) => void;
}

const JobCard: React.FC<JobCardProps> = ({ data, onLoadHex }) => {
  const [imgError, setImgError] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [safetyConfirmed, setSafetyConfirmed] = useState(false);
  
  // Navigation Tabs
  const [activeTab, setActiveTab] = useState<'specs' | 'parts' | 'wiring' | 'videos'>('specs');
  
  // Modals / Selection State
  const [selectedDtc, setSelectedDtc] = useState<DTCItem | null>(null);
  const [selectedTsb, setSelectedTsb] = useState<TSBItem | null>(null);

  // Helper to clean vehicle info for search queries
  const getSearchableVehicle = () => {
    if (!data.vehicle_info) return "Unknown Vehicle";
    let info = "";
    if (typeof data.vehicle_info === 'string') {
      info = data.vehicle_info;
    } else if (typeof data.vehicle_info === 'object') {
      info = Object.values(data.vehicle_info).filter(v => typeof v === 'string' || typeof v === 'number').join(' ');
    } else {
      info = String(data.vehicle_info);
    }
    return info.split(' ').slice(0, 3).join(' ');
  };

  const getDisplayVehicle = () => {
    if (!data.vehicle_info) return "Unknown Vehicle";
    if (typeof data.vehicle_info === 'string') return data.vehicle_info;
    if (typeof data.vehicle_info === 'object') {
      return Object.values(data.vehicle_info).filter(v => typeof v === 'string' || typeof v === 'number').join(' ');
    }
    return String(data.vehicle_info);
  };

  const cleanVehicleName = getSearchableVehicle();

  // Stable seed for consistent header image (Decorative only)
  const stringToSeed = (str: string) => {
    let hash = 0;
    if (str.length === 0) return hash;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  };

  const seed = stringToSeed(cleanVehicleName);
  // Keep header image as decorative
  const vehicleImageUrl = `https://image.pollinations.ai/prompt/realistic%20automotive%20photography%20of%20${encodeURIComponent(cleanVehicleName)}%20car%20studio%20lighting%20side%20profile%20on%20dark%20background?width=320&height=180&nologo=true&seed=${seed}`;

  // Helper to open Google Image Search with Type Specificity
  const openSearch = (query: string, type: 'diagram' | 'photo' | 'tool') => {
      let suffix = "";
      
      if (type === 'diagram') {
          // Force Google to look for technical drawings/schematics
          // "exploded view", "diagram", "location", "service manual" help filter for line drawings
          suffix = " diagram mounting location exploded view service manual";
      } else if (type === 'tool') {
          suffix = " automotive tool";
      }

      const finalQuery = `${query}${suffix}`;
      const url = `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(finalQuery)}`;
      window.open(url, '_blank');
  };

  // --- TEXT TO SPEECH ---
  const handleSpeak = () => {
    if ('speechSynthesis' in window) {
      if (isSpeaking) {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
        return;
      }

      const textToRead = `Diagnosa untuk ${data.vehicle_info}. Masalah: ${data.component_name}. ${data.diagnosis.join('. ')}.`;
      const utterance = new SpeechSynthesisUtterance(textToRead);
      utterance.lang = 'id-ID';
      utterance.rate = 1.0;
      utterance.onend = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
      setIsSpeaking(true);
    } else {
      alert("Browser tidak mendukung Text-to-Speech.");
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-lg shadow-2xl overflow-hidden font-sans text-sm md:text-base animate-fade-in pb-10 relative">
      
      {/* 1. HEADER: Vehicle Identity & Quick Stats */}
      <div className="relative bg-blue-950/40 border-b border-blue-800/50 p-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-900/90 to-blue-900/20 z-0"></div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-4">
             <div className="flex-shrink-0 w-24 h-16 bg-slate-800 rounded-md border border-slate-600 overflow-hidden shadow-lg relative group">
                {!imgError ? (
                  <img src={vehicleImageUrl} alt={cleanVehicleName} className="w-full h-full object-cover" onError={() => setImgError(true)} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-slate-800 text-slate-500">
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 19H5V5h14v14z" /></svg>
                  </div>
                )}
             </div>
             <div>
                <h2 className="text-blue-400 text-[10px] font-bold uppercase tracking-widest mb-0.5">Vehicle Identification</h2>
                <h1 className="text-lg md:text-2xl font-bold text-white tracking-tight leading-none">{getDisplayVehicle()}</h1>
                <div className="flex gap-2 mt-1">
                   <span className="bg-slate-800 border border-slate-700 rounded px-1.5 py-0.5 text-[10px] text-slate-300 font-mono">{data.component_id}</span>
                   {data.estimated_work_time && <span className="bg-slate-800 border border-slate-700 rounded px-1.5 py-0.5 text-[10px] text-green-400 font-bold">⏱ {data.estimated_work_time}</span>}
                </div>
             </div>
          </div>
          
          <button onClick={handleSpeak} className={`hidden md:flex items-center px-3 py-1.5 rounded-full text-xs font-bold transition-all ${isSpeaking ? 'bg-emerald-600 text-white animate-pulse' : 'bg-slate-800 text-slate-400 hover:text-emerald-400'}`}>
            {isSpeaking ? 'Stop Audio' : '🔊 Baca Hasil'}
          </button>
        </div>
      </div>

      <div className="p-4 md:p-6 space-y-8">
        
        {/* 2. ESTIMATION & SUMMARY (Commercial Data) */}
        {(data.cost_estimation) && (
          <section className="bg-slate-800/50 rounded-lg border border-slate-700 p-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                    <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">Total Estimate</div>
                    <div className="text-emerald-400 font-mono font-bold text-lg">{data.cost_estimation.total_estimate}</div>
                </div>
                <div>
                    <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">Parts Cost</div>
                    <div className="text-white font-mono font-bold">{data.cost_estimation.parts_total}</div>
                </div>
                <div>
                    <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">Labor Cost</div>
                    <div className="text-white font-mono font-bold">{data.cost_estimation.labor_cost}</div>
                </div>
                <div>
                    <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">Rate/Hour</div>
                    <div className="text-slate-400 font-mono font-bold">{data.cost_estimation.hourly_rate}</div>
                </div>
          </section>
        )}

        {/* 3. DIAGNOSIS & DTC (Interactive) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
           {/* Diagnosis List */}
           <section>
              <h3 className="flex items-center text-amber-400 font-bold mb-3 uppercase tracking-wide text-xs border-b border-amber-500/20 pb-2">
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                Expert Diagnosis
              </h3>
              <ul className="space-y-2">
                {Array.isArray(data.diagnosis) && data.diagnosis.length > 0 ? data.diagnosis.map((diag, idx) => (
                    <li key={idx} className="flex items-start text-slate-300 text-sm bg-slate-800/30 p-2 rounded">
                        <span className="text-blue-500 mr-2">•</span> {diag}
                    </li>
                )) : typeof data.diagnosis === 'string' && (data.diagnosis as any).trim() !== '' ? (
                    <li className="flex items-start text-slate-300 text-sm bg-slate-800/30 p-2 rounded">
                        <span className="text-blue-500 mr-2">•</span> {data.diagnosis as any}
                    </li>
                ) : (
                    <li className="text-slate-500 text-xs italic">Data diagnosa belum tersedia.</li>
                )}
              </ul>
              <p className="mt-3 text-slate-400 italic text-sm border-l-2 border-blue-500 pl-3">"{data.manual_summary}"</p>
           </section>

           {/* DTC & TSB Table (INTERACTIVE) */}
           <section>
              <h3 className="flex items-center text-red-400 font-bold mb-3 uppercase tracking-wide text-xs border-b border-red-500/20 pb-2">
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                DTC & TSB Analysis (Click to View)
              </h3>
              
              {Array.isArray(data.dtc_list) && data.dtc_list.length > 0 ? (
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
                      {data.dtc_list.map((dtc, idx) => (
                          <div 
                            key={idx} 
                            onClick={() => setSelectedDtc(dtc)}
                            className="bg-slate-800 border border-slate-700 hover:border-red-500/50 hover:bg-slate-700/50 cursor-pointer rounded p-2 transition-all group"
                          >
                              <div className="flex justify-between items-center mb-1">
                                  <span className="text-red-400 font-bold font-mono text-sm group-hover:text-red-300 transition-colors">
                                    {dtc.code} <span className="text-[10px] font-normal text-slate-500 ml-2">↗ Detail</span>
                                  </span>
                                  <span className="text-[10px] bg-slate-700 px-1.5 rounded text-slate-300">Code</span>
                              </div>
                              <div className="text-xs text-white font-bold mb-1 truncate">{dtc.definition}</div>
                          </div>
                      ))}
                  </div>
              ) : <div className="text-xs text-slate-500 italic">Tidak ada kode DTC spesifik.</div>}

              {Array.isArray(data.tsb_list) && data.tsb_list.length > 0 && (
                  <div className="mt-4">
                      <div className="text-[10px] font-bold text-slate-500 mb-1 uppercase">Related TSBs</div>
                      {data.tsb_list.map((tsb, idx) => (
                          <div 
                            key={idx} 
                            onClick={() => setSelectedTsb(tsb)}
                            className="flex gap-2 items-start text-xs text-slate-300 mb-1 cursor-pointer hover:bg-slate-800 p-1 rounded transition-colors"
                          >
                              <span className="text-amber-500 font-mono whitespace-nowrap border-b border-dashed border-amber-500/30">{tsb.id}</span>
                              <span className="truncate">{tsb.summary}</span>
                          </div>
                      ))}
                  </div>
              )}
           </section>
        </div>

        {/* 4. TECHNICAL TABS */}
        <section className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <div className="flex border-b border-slate-800 bg-slate-950/50 overflow-x-auto">
                <button 
                    onClick={() => setActiveTab('specs')}
                    className={`flex-1 min-w-[100px] py-3 text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${activeTab === 'specs' ? 'bg-slate-800 text-blue-400 border-b-2 border-blue-500' : 'text-slate-500 hover:text-slate-300'}`}
                >
                    Specs & Torsi
                </button>
                <button 
                    onClick={() => setActiveTab('parts')}
                    className={`flex-1 min-w-[100px] py-3 text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${activeTab === 'parts' ? 'bg-slate-800 text-emerald-400 border-b-2 border-emerald-500' : 'text-slate-500 hover:text-slate-300'}`}
                >
                    Parts & Tools
                </button>
                <button 
                    onClick={() => setActiveTab('wiring')}
                    className={`flex-1 min-w-[100px] py-3 text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${activeTab === 'wiring' ? 'bg-slate-800 text-amber-400 border-b-2 border-amber-500' : 'text-slate-500 hover:text-slate-300'}`}
                >
                    Wiring
                </button>
                <button 
                    onClick={() => setActiveTab('videos')}
                    className={`flex-1 min-w-[100px] py-3 text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${activeTab === 'videos' ? 'bg-slate-800 text-rose-400 border-b-2 border-rose-500' : 'text-slate-500 hover:text-slate-300'}`}
                >
                    Tutorials
                </button>
            </div>

            <div className="p-4 bg-slate-900/50 min-h-[200px]">
                {/* TAB: SPECS & TORQUE */}
                {activeTab === 'specs' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-fade-in">
                        <div>
                            <h4 className="text-slate-400 text-xs font-bold uppercase mb-3 flex items-center justify-between">
                                <span className="flex items-center"><span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span> Torque Specifications</span>
                                <span className="text-[9px] text-slate-500 italic font-normal">Klik untuk lihat Diagram Manual</span>
                            </h4>
                            {Array.isArray(data.torque_specs) && data.torque_specs.length > 0 ? (
                                <table className="w-full text-left text-xs text-slate-300">
                                    <thead>
                                        <tr className="border-b border-slate-700 text-slate-500">
                                            <th className="py-2 font-normal">Component</th>
                                            <th className="py-2 font-normal">Torque (Nm/ft-lb)</th>
                                            <th className="py-2 font-normal">Size</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800">
                                        {data.torque_specs.map((spec, i) => (
                                            <tr 
                                                key={i}
                                                // Updated Logic: Search for DIAGRAM/EXPLODED VIEW context
                                                onClick={() => openSearch(`${cleanVehicleName} ${spec.part}`, 'diagram')}
                                                className="hover:bg-slate-800 cursor-pointer transition-colors group"
                                                title="Lihat Diagram Posisi/Exploded View"
                                            >
                                                <td className="py-2 font-medium text-white group-hover:text-blue-400 flex items-center">
                                                    {spec.part}
                                                    <span className="ml-2 opacity-0 group-hover:opacity-100 text-[10px] text-blue-400 transition-opacity flex items-center bg-blue-900/30 px-1 rounded border border-blue-500/30">
                                                        <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>
                                                        Diagram
                                                    </span>
                                                </td>
                                                <td className="py-2 text-cyan-400 font-mono">{spec.value}</td>
                                                <td className="py-2 text-slate-500">{spec.size || "-"}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : <p className="text-slate-500 text-xs italic">Data torsi tidak tersedia.</p>}
                        </div>
                        <div>
                            <h4 className="text-slate-400 text-xs font-bold uppercase mb-3 flex items-center">
                                <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span> Fluids & Maintenance
                            </h4>
                            <div className="space-y-2">
                                {Array.isArray(data.maintenance_data) && data.maintenance_data.map((item, i) => (
                                    <div key={i} className="flex justify-between items-center bg-slate-800 p-2 rounded border border-slate-700">
                                        <div>
                                            <div className="text-xs text-slate-300 font-bold">{item.item}</div>
                                            <div className="text-[10px] text-slate-500">{item.spec}</div>
                                        </div>
                                        <div className="text-xs font-mono text-purple-300 font-bold">{item.value}</div>
                                    </div>
                                ))}
                                {(!Array.isArray(data.maintenance_data) || data.maintenance_data.length === 0) && <p className="text-slate-500 text-xs italic">Data maintenance tidak tersedia.</p>}
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB: PARTS & TOOLS */}
                {activeTab === 'parts' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-fade-in">
                        <div>
                             <h4 className="text-slate-400 text-xs font-bold uppercase mb-3 flex justify-between">
                                 <span>Required Tools (SST)</span>
                                 <span className="text-[9px] text-slate-500 italic font-normal">Klik untuk cari alat</span>
                             </h4>
                             <ul className="grid grid-cols-2 gap-2">
                                 {Array.isArray(data.tools_list) && data.tools_list.map((tool, i) => (
                                     <li 
                                        key={i} 
                                        onClick={() => openSearch(tool, 'tool')}
                                        className="flex items-center text-xs text-slate-300 bg-slate-800 p-2 rounded cursor-pointer hover:bg-slate-700 hover:text-white border border-transparent hover:border-slate-600 transition-colors group"
                                        title="Cari bentuk alat di Google"
                                     >
                                        <svg className="w-3 h-3 mr-2 text-slate-500 group-hover:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /></svg>
                                        <span className="truncate">{tool}</span>
                                        <span className="ml-auto opacity-0 group-hover:opacity-100 text-[9px] text-blue-400">🔍</span>
                                     </li>
                                 ))}
                             </ul>
                        </div>
                        <div>
                            <h4 className="text-slate-400 text-xs font-bold uppercase mb-3">Parts Suggestion</h4>
                            <div className="space-y-2">
                                {Array.isArray(data.maintenance_data) && data.maintenance_data.some(i => Array.isArray(i.aftermarket_parts) && i.aftermarket_parts.length > 0) ? (
                                    data.maintenance_data.map((item, i) => (
                                        Array.isArray(item.aftermarket_parts) && item.aftermarket_parts.length > 0 && (
                                            <div key={i} className="mb-2">
                                                 <div className="text-[10px] text-slate-500 font-bold mb-1 uppercase tracking-wide border-b border-slate-800 pb-0.5">{item.item}</div>
                                                 {item.aftermarket_parts.map((part, j) => (
                                                    <div key={`${i}-${j}`} className="flex justify-between items-center bg-slate-800 p-2 rounded border border-slate-700/50 mb-1 last:mb-0">
                                                        <div className="flex flex-col">
                                                            <div className="text-xs text-white font-bold">{part.brand}</div>
                                                            <div className="text-[9px] text-slate-500 font-mono">{part.part_number}</div>
                                                        </div>
                                                        <div className="text-xs text-emerald-400 font-bold">{part.estimated_price}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        )
                                    ))
                                ) : (
                                    <div className="bg-slate-800/50 p-4 rounded text-center border border-slate-800 border-dashed">
                                        <p className="text-slate-500 text-xs italic mb-2">Data spesifik aftermarket tidak ditemukan.</p>
                                        <p className="text-[10px] text-slate-600">Saran: Cek katalog online Denso/Bosch/Tokopedia dengan keyword: "{data.component_name} {cleanVehicleName}"</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB: WIRING (DIRECT SEARCH) */}
                {activeTab === 'wiring' && (
                    <div className="animate-fade-in space-y-4">
                        <div className="bg-slate-800 p-4 rounded border border-amber-500/20">
                            <h4 className="text-amber-500 text-xs font-bold uppercase mb-2">System Description</h4>
                            <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap font-mono">
                                {data.wiring_diagram_desc || "Wiring information not available for this component."}
                            </p>
                        </div>
                        
                        {/* Real Wiring Search Button */}
                        <div className="bg-slate-800/50 p-6 rounded-lg border border-slate-700 text-center flex flex-col items-center">
                            <svg className="w-12 h-12 text-slate-600 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" /></svg>
                            <h4 className="text-white font-bold mb-2">Wiring Diagram Reference</h4>
                            <p className="text-slate-400 text-sm mb-4 max-w-sm">
                                Karena diagram kelistrikan OEM dilindungi hak cipta, kami mengarahkan Anda ke pencarian spesifik untuk model ini.
                            </p>
                            <button 
                                onClick={() => openSearch(`${cleanVehicleName} ${data.component_name}`, 'diagram')}
                                className="inline-flex items-center bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 px-6 rounded-lg transition-colors shadow-lg shadow-blue-900/20"
                            >
                                <span className="mr-2">🔍</span> Cari Diagram Asli di Google
                            </button>
                            <p className="text-[10px] text-slate-500 mt-2">Membuka tab baru: Google Images</p>
                        </div>

                        {data.wiring_search_keywords && (
                            <div className="text-xs text-slate-500 text-center">
                                <span>Keywords: </span>
                                <span className="text-slate-300 italic">{data.wiring_search_keywords}</span>
                            </div>
                        )}
                    </div>
                )}

                {/* TAB: VIDEOS (RESTORED) */}
                {activeTab === 'videos' && (
                    <div className="animate-fade-in grid gap-4">
                        {Array.isArray(data.video_tutorials) && data.video_tutorials.length > 0 ? (
                            data.video_tutorials.map((vid, idx) => (
                                <a 
                                    key={idx}
                                    href={vid.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex gap-3 bg-slate-800 p-3 rounded border border-slate-700 hover:border-rose-500 hover:bg-slate-700 transition-all group"
                                >
                                    <div className="flex-shrink-0 w-24 h-16 bg-black rounded flex items-center justify-center relative overflow-hidden">
                                        <div className="absolute inset-0 bg-red-600/20 group-hover:bg-red-600/40 transition-colors"></div>
                                        <svg className="w-8 h-8 text-white z-10 opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg>
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="text-sm font-bold text-white group-hover:text-rose-400 transition-colors line-clamp-2">{vid.title}</h4>
                                        <div className="text-xs text-slate-500 mt-1 flex items-center">
                                            <span>YouTube</span>
                                            <span className="mx-1">•</span>
                                            <span className="text-blue-400">Watch Tutorial ↗</span>
                                        </div>
                                    </div>
                                </a>
                            ))
                        ) : (
                            <div className="text-center py-8">
                                <svg className="w-12 h-12 text-slate-700 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                                <p className="text-slate-500 text-sm">Tidak ada video tutorial spesifik.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </section>

        {/* 5. SOP STEPS */}
        <section>
          <h3 className="flex items-center text-sky-400 font-bold mb-4 uppercase tracking-wide text-xs">
             Repair Procedure (SOP)
          </h3>
          <div className="relative border-l border-slate-700 ml-3 space-y-6">
            {Array.isArray(data.sop_steps) && data.sop_steps.length > 0 ? data.sop_steps.map((instruction, idx) => (
                <div key={idx} className="pl-6 relative group">
                  <div className="absolute -left-[13px] top-0 w-6 h-6 rounded-full bg-slate-900 border border-slate-600 flex items-center justify-center text-sky-500 font-bold text-xs group-hover:border-sky-500 group-hover:bg-sky-950 transition-colors">
                    {idx + 1}
                  </div>
                  <div className="pt-0.5">
                     <p className="text-slate-300 text-sm md:text-base leading-relaxed">{instruction}</p>
                  </div>
                </div>
            )) : typeof data.sop_steps === 'string' && (data.sop_steps as any).trim() !== '' ? (
                <div className="pl-6 relative group">
                  <div className="absolute -left-[13px] top-0 w-6 h-6 rounded-full bg-slate-900 border border-slate-600 flex items-center justify-center text-sky-500 font-bold text-xs group-hover:border-sky-500 group-hover:bg-sky-950 transition-colors">
                    1
                  </div>
                  <div className="pt-0.5">
                     <p className="text-slate-300 text-sm md:text-base leading-relaxed">{data.sop_steps as any}</p>
                  </div>
                </div>
            ) : (
                <p className="text-slate-500 text-xs italic ml-3">Prosedur perbaikan belum tersedia.</p>
            )}
          </div>
        </section>

        {/* 6. ENGINEERING MODE */}
        {Array.isArray(data.obd_hex_commands) && data.obd_hex_commands.length > 0 && (
            <div className="mt-10 pt-10 border-t-2 border-slate-800">
                <div className="bg-slate-900 border border-indigo-500/50 rounded-lg p-6 animate-fade-in relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-2 opacity-10">
                        <svg className="w-32 h-32 text-indigo-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zm0 9l2.5-1.25L12 8.5l-2.5 1.25L12 11zm0 2.5l-5-2.5-5 2.5L12 22l10-8.5-5-2.5-5 2.5z"/></svg>
                    </div>
                    
                    <h3 className="text-indigo-400 font-bold text-lg mb-2 flex items-center relative z-10">
                        <svg className="w-6 h-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
                        Engineering Mode: Advanced Functions
                    </h3>
                    
                    <div className="relative z-10 bg-indigo-900/20 border border-indigo-500/30 rounded p-4 mb-6">
                        <h4 className="text-indigo-300 font-bold text-sm mb-2 uppercase">Prosedur Eksekusi Aman:</h4>
                        <ol className="list-decimal list-inside text-sm text-slate-300 space-y-1">
                            <li>Pastikan Kunci Kontak <strong>ON</strong> (Mesin Mati).</li>
                            <li>Pastikan scanner <strong>vLinker MC+</strong> terkoneksi stabil.</li>
                            <li>Pilih command di bawah. Klik tombol <strong>LOAD</strong>.</li>
                            <li>Tunggu respon terminal. Jika sukses, indikator akan kembali normal.</li>
                        </ol>
                    </div>

                    <div className="mb-4 bg-slate-800 p-3 rounded border border-slate-600 relative z-10">
                        <label className="flex items-center space-x-3 cursor-pointer">
                            <input 
                                type="checkbox" 
                                checked={safetyConfirmed} 
                                onChange={(e) => setSafetyConfirmed(e.target.checked)}
                                className="w-5 h-5 rounded border-slate-500 text-indigo-600 focus:ring-indigo-500 bg-slate-700"
                            />
                            <span className="text-sm font-bold text-slate-200">
                                Saya mengerti risiko (ECU Programming) dan telah memastikan kondisi aman.
                            </span>
                        </label>
                    </div>

                    <div className={`grid gap-4 relative z-10 transition-opacity duration-300 ${safetyConfirmed ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
                        {data.obd_hex_commands.map((cmd, idx) => (
                            <div key={idx} className="bg-black/50 border border-slate-700 rounded p-4 flex flex-col md:flex-row justify-between items-center gap-4 group hover:border-indigo-500 transition-colors">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                         <div className="font-mono text-xl text-green-400 font-bold tracking-wider">{cmd.hex_command}</div>
                                         <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${cmd.risk_level === 'HIGH' ? 'bg-red-900 text-red-200 border border-red-700' : 'bg-slate-700 text-slate-300'}`}>
                                            {cmd.risk_level} RISK
                                         </span>
                                    </div>
                                    <div className="text-slate-200 font-bold">{cmd.description}</div>
                                    <div className="text-xs text-slate-500 mt-1 flex items-center">
                                        <svg className="w-3 h-3 mr-1 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                        <span className="text-indigo-300 mr-1">Pre-condition:</span> {cmd.notes}
                                    </div>
                                </div>
                                <div className="w-full md:w-auto">
                                    <button 
                                        onClick={() => onLoadHex && onLoadHex(cmd.hex_command)}
                                        disabled={!safetyConfirmed}
                                        className="w-full md:w-auto bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 disabled:from-slate-700 disabled:to-slate-700 disabled:text-slate-500 text-white text-xs font-bold py-3 px-6 rounded shadow-lg shadow-indigo-900/30 transition-all flex items-center justify-center transform active:scale-95"
                                    >
                                        LOAD TO TERMINAL
                                        <svg className="w-4 h-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" /></svg>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        )}

      </div>
      
      {/* Footer */}
      <div className="bg-slate-950 p-3 flex justify-between items-center border-t border-slate-800 px-6 mt-4">
        <span className="text-xs text-slate-500 font-mono">SMART REPAIR MANUAL v4.1 (Full Spec)</span>
        <span className="text-xs text-emerald-500 font-bold flex items-center">
          <span className="w-2 h-2 bg-emerald-500 rounded-full mr-1.5 animate-pulse"></span>
          OEM VERIFIED
        </span>
      </div>

      {/* --- POPUP MODALS --- */}
      
      {/* DTC MODAL */}
      {selectedDtc && (
        <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-slate-900 border border-red-500/50 rounded-xl shadow-2xl max-w-2xl w-full flex flex-col max-h-[90vh]">
                <div className="flex justify-between items-center p-4 border-b border-slate-800 bg-red-900/20">
                    <h2 className="text-xl font-bold text-white flex items-center">
                        <span className="bg-red-600 text-white text-xs px-2 py-1 rounded mr-3 font-mono">{selectedDtc.code}</span>
                        Diagnostic Trouble Code
                    </h2>
                    <button onClick={() => setSelectedDtc(null)} className="text-slate-400 hover:text-white bg-slate-800 rounded-full p-1">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
                <div className="p-6 overflow-y-auto space-y-6">
                    <div>
                        <div className="text-xs uppercase text-slate-500 font-bold mb-1">Definition</div>
                        <p className="text-lg text-white font-medium">{selectedDtc.definition}</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-slate-800 p-4 rounded border-l-4 border-amber-500">
                            <div className="text-xs uppercase text-amber-500 font-bold mb-2">Possible Causes</div>
                            <p className="text-sm text-slate-300 leading-relaxed">{selectedDtc.possible_cause}</p>
                        </div>
                         <div className="bg-slate-800 p-4 rounded border-l-4 border-blue-500">
                            <div className="text-xs uppercase text-blue-500 font-bold mb-2">Components to Check</div>
                            <p className="text-sm text-slate-300 leading-relaxed">{selectedDtc.related_components}</p>
                        </div>
                    </div>
                    <div>
                        <div className="text-xs uppercase text-green-500 font-bold mb-2">Suggested Fix</div>
                        <p className="text-sm text-slate-300 bg-green-900/20 p-4 rounded border border-green-500/30">
                            {selectedDtc.fix_suggestion}
                        </p>
                    </div>
                    <div>
                        <div className="text-xs uppercase text-slate-500 font-bold mb-1">Symptoms</div>
                        <p className="text-sm text-slate-400 italic">"{selectedDtc.symptoms}"</p>
                    </div>
                </div>
                <div className="p-4 border-t border-slate-800 bg-slate-950 flex justify-end">
                    <button onClick={() => setSelectedDtc(null)} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded text-sm text-white font-bold">Close Detail</button>
                </div>
            </div>
        </div>
      )}

      {/* TSB MODAL */}
      {selectedTsb && (
        <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
             <div className="bg-slate-900 border border-amber-500/50 rounded-xl shadow-2xl max-w-lg w-full flex flex-col">
                <div className="flex justify-between items-center p-4 border-b border-slate-800 bg-amber-900/20">
                    <h2 className="text-lg font-bold text-white flex items-center">
                        <span className="text-amber-500 mr-2">⚠️</span> Service Bulletin
                    </h2>
                    <button onClick={() => setSelectedTsb(null)} className="text-slate-400 hover:text-white">✕</button>
                </div>
                <div className="p-6">
                    <div className="text-2xl font-mono text-amber-400 font-bold mb-2">{selectedTsb.id}</div>
                    <div className="text-sm text-slate-300 leading-relaxed bg-slate-800 p-4 rounded">
                        {selectedTsb.summary}
                    </div>
                    <p className="mt-4 text-xs text-slate-500 italic text-center">
                        Bulletin ini dikeluarkan resmi oleh pabrikan. Cek software update ECU jika relevan.
                    </p>
                </div>
             </div>
        </div>
      )}

    </div>
  );
};

export default JobCard;