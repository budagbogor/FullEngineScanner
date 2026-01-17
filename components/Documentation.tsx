import React, { useState } from 'react';

const Documentation: React.FC = () => {
  const [activeSection, setActiveSection] = useState<'workflow' | 'guide' | 'tips'>('workflow');

  return (
    <div className="bg-slate-900 h-full overflow-y-auto custom-scrollbar p-6 md:p-10 animate-fade-in text-slate-300">
      
      {/* Header */}
      <div className="max-w-4xl mx-auto mb-8 border-b border-slate-700 pb-6">
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Mechanic Co-Pilot Manual</h1>
        <p className="text-slate-400 text-lg">
          Panduan sistematis penggunaan Super App untuk efisiensi diagnosa dan akurasi perbaikan.
        </p>
      </div>

      {/* Tabs */}
      <div className="max-w-4xl mx-auto flex gap-4 mb-8 overflow-x-auto pb-2">
        {[
            { id: 'workflow', label: '⚡ Workflow Mekanik' },
            { id: 'guide', label: '📖 Cara Penggunaan' },
            { id: 'tips', label: '🛠️ Engineering Master Class' }
        ].map((tab) => (
            <button
                key={tab.id}
                onClick={() => setActiveSection(tab.id as any)}
                className={`px-4 py-2 rounded-lg font-bold text-sm transition-all whitespace-nowrap ${
                    activeSection === tab.id 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' 
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
            >
                {tab.label}
            </button>
        ))}
      </div>

      <div className="max-w-4xl mx-auto">
        
        {/* SECTION 1: WORKFLOW */}
        {activeSection === 'workflow' && (
            <div className="space-y-8 animate-fade-in">
                
                <section>
                    <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                        <span className="w-8 h-8 rounded bg-emerald-500/20 text-emerald-400 flex items-center justify-center mr-3 text-sm border border-emerald-500/50">01</span>
                        Alur Kerja Ideal (The Perfect Loop)
                    </h2>

                    {/* Visual Icon Flow instead of Image */}
                    <div className="bg-slate-950 border border-slate-800 rounded-xl p-6 mb-8 flex flex-col md:flex-row justify-between items-center gap-4 relative overflow-hidden">
                         <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-800 -z-0 hidden md:block"></div>
                         
                         {/* Step 1 */}
                         <div className="relative z-10 bg-slate-900 border border-slate-700 p-4 rounded-xl flex flex-col items-center w-full md:w-auto text-center shadow-lg">
                            <div className="w-12 h-12 bg-blue-900/30 rounded-full flex items-center justify-center text-blue-400 mb-2">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                            </div>
                            <span className="text-xs font-bold text-slate-300">1. Scan & Input</span>
                         </div>

                         {/* Arrow */}
                         <div className="z-10 text-slate-600 transform rotate-90 md:rotate-0">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                         </div>

                         {/* Step 2 */}
                         <div className="relative z-10 bg-slate-900 border border-slate-700 p-4 rounded-xl flex flex-col items-center w-full md:w-auto text-center shadow-lg">
                            <div className="w-12 h-12 bg-amber-900/30 rounded-full flex items-center justify-center text-amber-400 mb-2">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                            </div>
                            <span className="text-xs font-bold text-slate-300">2. AI Analysis</span>
                         </div>

                         {/* Arrow */}
                         <div className="z-10 text-slate-600 transform rotate-90 md:rotate-0">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                         </div>

                         {/* Step 3 */}
                         <div className="relative z-10 bg-slate-900 border border-slate-700 p-4 rounded-xl flex flex-col items-center w-full md:w-auto text-center shadow-lg">
                            <div className="w-12 h-12 bg-purple-900/30 rounded-full flex items-center justify-center text-purple-400 mb-2">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /></svg>
                            </div>
                            <span className="text-xs font-bold text-slate-300">3. Execution</span>
                         </div>

                         {/* Arrow */}
                         <div className="z-10 text-slate-600 transform rotate-90 md:rotate-0">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                         </div>

                         {/* Step 4 */}
                         <div className="relative z-10 bg-slate-900 border border-slate-700 p-4 rounded-xl flex flex-col items-center w-full md:w-auto text-center shadow-lg">
                            <div className="w-12 h-12 bg-emerald-900/30 rounded-full flex items-center justify-center text-emerald-400 mb-2">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            </div>
                            <span className="text-xs font-bold text-slate-300">4. Reset & QC</span>
                         </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-slate-800 p-4 rounded-lg border-l-4 border-blue-500">
                            <h3 className="font-bold text-white mb-2">1. Initial Scan (Pra-Diagnosa)</h3>
                            <p className="text-sm text-slate-400">Hubungkan OBD. Baca DTC Code. Masukkan keluhan pelanggan dan foto STNK/Fisik mobil ke aplikasi.</p>
                        </div>
                        <div className="bg-slate-800 p-4 rounded-lg border-l-4 border-amber-500">
                            <h3 className="font-bold text-white mb-2">2. AI Analysis & Verification</h3>
                            <p className="text-sm text-slate-400">Biarkan AI menganalisa hubungan antara DTC + Keluhan. Verifikasi Wiring Diagram dan TSB yang muncul.</p>
                        </div>
                        <div className="bg-slate-800 p-4 rounded-lg border-l-4 border-purple-500">
                            <h3 className="font-bold text-white mb-2">3. Execution (SOP & Parts)</h3>
                            <p className="text-sm text-slate-400">Ikuti SOP langkah demi langkah. Cek Torsi baut. Pesan sparepart sesuai rekomendasi Part Number.</p>
                        </div>
                        <div className="bg-slate-800 p-4 rounded-lg border-l-4 border-emerald-500">
                            <h3 className="font-bold text-white mb-2">4. Final QC & Reset</h3>
                            <p className="text-sm text-slate-400">Gunakan fitur "Service Func" untuk Reset Oli/SAS/Throttle. Hapus DTC. Test drive.</p>
                        </div>
                    </div>
                </section>
            </div>
        )}

        {/* SECTION 2: USER GUIDE */}
        {activeSection === 'guide' && (
            <div className="space-y-8 animate-fade-in">
                
                <div className="bg-blue-900/20 border border-blue-500/30 p-6 rounded-xl">
                    <h3 className="text-xl font-bold text-blue-400 mb-2">Fitur Utama: Multimodal Input</h3>
                    <p className="text-sm mb-4">Aplikasi ini bisa "Melihat" dan "Mendengar". Jangan hanya mengetik.</p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="text-center">
                            <div className="text-4xl mb-2">📸</div>
                            <div className="font-bold text-white text-sm">Visual Diagnosis</div>
                            <p className="text-xs text-slate-500 mt-1">Foto komponen rembes, kabel putus, atau STNK untuk auto-detect mobil.</p>
                        </div>
                        <div className="text-center">
                            <div className="text-4xl mb-2">🎙️</div>
                            <div className="font-bold text-white text-sm">Voice Command</div>
                            <p className="text-xs text-slate-500 mt-1">Tekan mic saat tangan kotor. "Carikan torsi cylinder head Innova Diesel".</p>
                        </div>
                        <div className="text-center">
                            <div className="text-4xl mb-2">🔊</div>
                            <div className="font-bold text-white text-sm">Sound Analysis</div>
                            <p className="text-xs text-slate-500 mt-1">Rekam suara mesin kasar. AI akan menganalisa pola suara (knocking/hissing).</p>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="flex gap-4 items-start">
                        <div className="w-16 h-16 bg-slate-800 rounded-xl flex-shrink-0 flex items-center justify-center border border-slate-700">
                            <svg className="w-8 h-8 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                        </div>
                        <div>
                            <h4 className="text-lg font-bold text-white">Langkah 1: Koneksi OBD (vLinker MC+)</h4>
                            <ul className="list-disc list-inside text-sm text-slate-400 mt-2 space-y-1">
                                <li>Pastikan Bluetooth HP aktif.</li>
                                <li>Colok vLinker ke port OBD-II mobil (biasanya di bawah setir).</li>
                                <li>Tekan tombol <span className="text-purple-400 font-mono text-xs border border-purple-500/50 px-1 rounded">Connect OBD</span> di sidebar.</li>
                                <li>Tunggu hingga status berubah menjadi <span className="text-emerald-400">CONNECTED</span>. Data RPM/Suhu akan muncul live.</li>
                            </ul>
                        </div>
                    </div>

                    <div className="flex gap-4 items-start">
                        <div className="w-16 h-16 bg-slate-800 rounded-xl flex-shrink-0 flex items-center justify-center border border-slate-700">
                            <svg className="w-8 h-8 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                        </div>
                        <div>
                            <h4 className="text-lg font-bold text-white">Langkah 2: Input Masalah</h4>
                            <ul className="list-disc list-inside text-sm text-slate-400 mt-2 space-y-1">
                                <li>Ketik keluhan: "Mesin brebet saat AC nyala".</li>
                                <li>Atau upload foto DTC dari scanner lain jika tidak connect OBD.</li>
                                <li>Pilih output yang diinginkan: <span className="text-blue-400">Diagnosis, Wiring, SOP</span>.</li>
                            </ul>
                        </div>
                    </div>

                    <div className="flex gap-4 items-start">
                        <div className="w-16 h-16 bg-slate-800 rounded-xl flex-shrink-0 flex items-center justify-center border border-slate-700">
                             <svg className="w-8 h-8 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                        </div>
                        <div>
                            <h4 className="text-lg font-bold text-white">Langkah 3: Akses Data Teknis</h4>
                            <ul className="list-disc list-inside text-sm text-slate-400 mt-2 space-y-1">
                                <li>Buka tab <span className="text-amber-400">Specs & Torsi</span> untuk melihat momen pengencangan.</li>
                                <li>Buka tab <span className="text-emerald-400">Parts & Tools</span> untuk melihat nomor sparepart dan estimasi harga.</li>
                                <li>Buka tab <span className="text-cyan-400">Wiring</span> untuk deskripsi jalur kelistrikan.</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* SECTION 3: PRO TIPS (ENHANCED ENGINEERING MODE) */}
        {activeSection === 'tips' && (
            <div className="space-y-8 animate-fade-in">
                
                {/* Intro Warning */}
                <div className="bg-red-900/20 border border-red-500/50 p-6 rounded-xl flex gap-4 items-start">
                    <div className="bg-red-900/50 p-3 rounded-full flex-shrink-0">
                        <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-red-400 mb-1">WARNING: Engineering Mode (UDS Protocol)</h3>
                        <p className="text-slate-300 text-sm">
                            Fitur ini mengakses ECU secara langsung menggunakan protokol UDS (Unified Diagnostic Services). Kesalahan command dapat menyebabkan malfungsi ECU. Gunakan hanya jika Anda mengerti alur kerjanya.
                        </p>
                    </div>
                </div>

                {/* Step-by-Step Guide */}
                <div>
                    <h3 className="text-xl font-bold text-white mb-6">Cara Menggunakan Fitur Engineering Mode</h3>
                    
                    <div className="relative border-l-2 border-indigo-900 ml-4 space-y-8">
                        
                        {/* Step 1 */}
                        <div className="relative pl-8">
                            <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-indigo-500 ring-4 ring-slate-900"></div>
                            <h4 className="text-lg font-bold text-indigo-400 mb-2">Langkah 1: Persiapan Kendaraan</h4>
                            <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
                                <ul className="space-y-2 text-sm text-slate-300">
                                    <li className="flex items-center">✅ <strong>Ignition ON:</strong> Kunci kontak di posisi ON (Indikator nyala).</li>
                                    <li className="flex items-center">❌ <strong>Engine OFF:</strong> Mesin harus dalam keadaan mati.</li>
                                    <li className="flex items-center">✅ <strong>Stable Voltage:</strong> Pastikan aki sehat (>11.5V).</li>
                                </ul>
                            </div>
                        </div>

                        {/* Step 2 */}
                        <div className="relative pl-8">
                            <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-indigo-500 ring-4 ring-slate-900"></div>
                            <h4 className="text-lg font-bold text-indigo-400 mb-2">Langkah 2: Memahami Struktur Hex</h4>
                            <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
                                <p className="text-sm text-slate-400 mb-3">
                                    Command UDS biasanya terdiri dari 2 digit Service ID + Parameters.
                                </p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="bg-black/40 p-3 rounded border border-slate-600">
                                        <span className="text-xs font-mono text-purple-400 block mb-1">SERVICE $10 (Session Control)</span>
                                        <div className="text-sm text-white font-mono">10 03</div>
                                        <p className="text-[10px] text-slate-500 mt-1">Mengubah sesi ke "Extended Diagnostic Session" agar ECU mau menerima perintah khusus.</p>
                                    </div>
                                    <div className="bg-black/40 p-3 rounded border border-slate-600">
                                        <span className="text-xs font-mono text-purple-400 block mb-1">SERVICE $2F (IO Control)</span>
                                        <div className="text-sm text-white font-mono">2F [ID] [CTRL] ...</div>
                                        <p className="text-[10px] text-slate-500 mt-1">Mengontrol komponen secara paksa (misal: Menyalakan kipas radiator).</p>
                                    </div>
                                    <div className="bg-black/40 p-3 rounded border border-slate-600">
                                        <span className="text-xs font-mono text-purple-400 block mb-1">SERVICE $31 (Routine Control)</span>
                                        <div className="text-sm text-white font-mono">31 01 [ROUTINE ID]</div>
                                        <p className="text-[10px] text-slate-500 mt-1">Menjalankan prosedur internal ECU (misal: Learning Throttle, Reset Fuel Trim).</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Step 3 */}
                        <div className="relative pl-8">
                            <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-indigo-500 ring-4 ring-slate-900"></div>
                            <h4 className="text-lg font-bold text-indigo-400 mb-2">Langkah 3: Eksekusi di Terminal</h4>
                            <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
                                <p className="text-sm text-slate-300 mb-2">
                                    Gunakan tombol <span className="bg-indigo-600 text-white px-2 py-0.5 rounded text-xs">LOAD TO TERMINAL</span> di halaman Job Card.
                                </p>
                                <p className="text-sm text-slate-300">
                                    Perhatikan respon ECU (RX). Jika sukses, respon biasanya adalah <strong>(Service ID + 40)</strong>.
                                </p>
                                <div className="mt-3 bg-black p-3 rounded font-mono text-xs">
                                    <div className="text-blue-400">TX: 31 01 00 01 <span className="text-slate-500">// Request Reset</span></div>
                                    <div className="text-green-400">RX: 71 01 00 01 <span className="text-slate-500">// Success (31 + 40 = 71)</span></div>
                                    <div className="text-red-400 border-t border-slate-800 mt-1 pt-1">RX: 7F 31 22 <span className="text-slate-500">// Error (7F = Failed, 22 = Conditions Not Correct)</span></div>
                                </div>
                            </div>
                        </div>
                        
                    </div>
                </div>

            </div>
        )}

      </div>
    </div>
  );
};

export default Documentation;