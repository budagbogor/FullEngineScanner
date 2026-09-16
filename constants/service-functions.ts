import type { ServiceFunction } from '@/shared/mechanic-types';

export const SERVICE_FUNCTIONS: ServiceFunction[] = [
  { id: 'oil', label: 'Oil Reset', icon: '🛢️', desc: 'Reset interval oli dashboard' },
  { id: 'epb', label: 'EPB Reset', icon: '🅿️', desc: 'Buka/Tutup Kaliper Rem Parkir' },
  { id: 'sas', label: 'SAS Reset', icon: '☸️', desc: 'Kalibrasi Sudut Setir (0°)' },
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
  { id: 'odo', label: 'Odometer', icon: '🔢', desc: 'Cek/Kalibrasi Kilometer' },
  { id: 'airbag', label: 'Airbag', icon: '🎈', desc: 'Reset Modul Airbag Crash' },
  { id: 'seat', label: 'Seat Match', icon: '💺', desc: 'Kalibrasi Memori Kursi' },
  { id: 'lang', label: 'Language', icon: '🗣️', desc: 'Ganti Bahasa Cluster' },
  { id: 'win', label: 'Window', icon: '🪟', desc: 'Reset Power Window' },
  { id: 'nox', label: 'NOx Reset', icon: '🧪', desc: 'Reset Sensor NOx Diesel' },
  { id: 'adblue', label: 'AdBlue', icon: '💧', desc: 'Reset Level AdBlue/DEF' },
  { id: 'stopstart', label: 'Stop/Start', icon: '🛑', desc: 'Setting Auto Start-Stop' },
  { id: 'transport', label: 'Transport', icon: '🚚', desc: 'Hapus Mode Transport' },
  { id: 'tire', label: 'Tire Size', icon: '📏', desc: 'Setting Ukuran Ban Baru' },
  { id: 'ac', label: 'A/C Relearn', icon: '❄️', desc: 'Kalibrasi Kompresor AC' },
  { id: 'clutch', label: 'Clutch', icon: '🦶', desc: 'Adaptasi Kopling' },
  { id: 'turbo', label: 'Turbo', icon: '🐌', desc: 'Learning VGT Turbo' },
  { id: 'cyl', label: 'Cylinder', icon: '🔋', desc: 'Power Balance Test' },
];

export const DEMO_PROMPT = "Mitsubishi Pajero Sport 2021, rem bunyi berdecit dan pedal agak dalam.";

export const STORAGE_KEYS = {
  MESSAGES: "mechanic_app_messages",
  JOB: "mechanic_app_current_job",
  DISCLAIMER: "mechanic_app_disclaimer_accepted",
  API_KEY: "mechanic_app_gemini_api_key",
  SETTINGS: "mechanic_app_settings",
};
