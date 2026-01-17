
export interface TorqueSpec {
  part: string;
  value: string;
  size?: string;
}

export interface MaintenanceItem {
  item: string;
  spec: string;
  value: string;
  oem_part_number?: string;
  oem_brand?: string;
  aftermarket_parts?: {
    brand: string;
    part_number: string;
    estimated_price: string;
  }[];
}

export interface VideoTutorial {
  title: string;
  url: string;
}

export interface DTCItem {
  code: string;
  definition: string;
  possible_cause: string;
  related_components: string;
  symptoms: string;
  fix_suggestion: string;
}

export interface TSBItem {
  id: string;
  summary: string;
}

export interface CostEstimation {
  parts_total: string;
  labor_cost: string;
  hourly_rate: string;
  total_estimate: string;
}

// NEW: Structure for AI-Generated HEX Commands
export interface ObdCommandSuggestion {
  description: string; // e.g., "Reset Throttle Position (Service $31)"
  hex_command: string; // e.g., "31 01 02 03"
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH';
  notes: string;
}

export interface MechanicResponse {
  vehicle_info: string;
  component_id: string; 
  component_name: string; 
  diagnosis: string[];
  dtc_list: DTCItem[]; 
  tsb_list: TSBItem[]; 
  manual_summary: string;
  wiring_diagram_desc: string; 
  wiring_search_keywords: string;
  maintenance_data: MaintenanceItem[]; 
  torque_specs: TorqueSpec[]; 
  tools_list: string[];
  safety_warning: string[];
  sop_steps: string[]; 
  video_tutorials: VideoTutorial[];
  estimated_work_time: string;
  cost_estimation: CostEstimation;
  // NEW: Field for Special Functions
  obd_hex_commands?: ObdCommandSuggestion[]; 
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  data?: MechanicResponse | null;
  media?: string; // Base64 Data
  mediaType?: 'image' | 'audio';
  timestamp: Date;
}

export interface LiveData {
  rpm: number;
  speed: number;
  coolantTemp: number;
  voltage: number;
  load: number;
}

export interface ConsoleLog {
  type: 'TX' | 'RX' | 'INFO' | 'ERR';
  message: string;
  timestamp: number;
}

export interface ObdScannerState {
  isConnected: boolean;
  isConnecting: boolean;
  deviceName: string | null;
  liveData: LiveData;
  dtcCodes: string[]; 
  logs: ConsoleLog[];
}