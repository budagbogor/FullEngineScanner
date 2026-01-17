import { LiveData } from "../types";

// -- WEB BLUETOOTH TYPES START --
interface BluetoothDevice {
  id: string;
  name?: string;
  gatt?: BluetoothRemoteGATTServer;
  addEventListener(type: string, listener: (event: any) => void): void; // Added definition
}

interface BluetoothRemoteGATTServer {
  connected: boolean;
  connect(): Promise<BluetoothRemoteGATTServer>;
  disconnect(): void;
  getPrimaryService(service: string | number): Promise<BluetoothRemoteGATTService>;
  getPrimaryServices(): Promise<BluetoothRemoteGATTService[]>; 
}

interface BluetoothRemoteGATTService {
  uuid: string;
  getCharacteristic(characteristic: string | number): Promise<BluetoothRemoteGATTCharacteristic>;
  getCharacteristics(): Promise<BluetoothRemoteGATTCharacteristic[]>; 
}

interface BluetoothRemoteGATTCharacteristic {
  uuid: string;
  properties: {
    write: boolean;
    writeWithoutResponse: boolean;
    notify: boolean;
    indicate: boolean;
    read: boolean;
  };
  startNotifications(): Promise<BluetoothRemoteGATTCharacteristic>;
  writeValue(value: BufferSource): Promise<void>;
  writeValueWithResponse(value: BufferSource): Promise<void>;
  writeValueWithoutResponse(value: BufferSource): Promise<void>;
  addEventListener(type: string, listener: (event: any) => void): void;
  value?: DataView;
}

declare global {
  interface Navigator {
    bluetooth: {
      requestDevice(options: {
        filters?: Array<{ services?: (string | number)[], name?: string, namePrefix?: string }>;
        optionalServices?: (string | number)[];
        acceptAllDevices?: boolean;
      }): Promise<BluetoothDevice>;
    };
  }
}
// -- WEB BLUETOOTH TYPES END --

// Vgate vLinker usually operates on FFE0
const OBD_SERVICE_UUIDS = [
  '0000fff0-0000-1000-8000-00805f9b34fb', 
  '0000ffe0-0000-1000-8000-00805f9b34fb', // vLinker MC+ common
  '0000bee0-0000-1000-8000-00805f9b34fb',
  '000018f0-0000-1000-8000-00805f9b34fb'  // Some newer Vgate
];

export class ObdService {
  private device: BluetoothDevice | null = null;
  private server: BluetoothRemoteGATTServer | null = null;
  private writeChar: BluetoothRemoteGATTCharacteristic | null = null;
  private onDataCallback: ((data: string) => void) | null = null;
  private onDisconnectCallback: (() => void) | null = null; // New Callback
  private buffer: string = "";

  private wait(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Allow App.tsx to register a disconnect handler
  setOnDisconnect(callback: () => void) {
      this.onDisconnectCallback = callback;
  }

  private handleDisconnect = () => {
      console.log("Device disconnected via GATT Server.");
      if (this.onDisconnectCallback) {
          this.onDisconnectCallback();
      }
      this.server = null;
      this.writeChar = null;
  };

  async connect(): Promise<string> {
    try {
      console.log("Requesting vLinker/ELM327 Device...");
      
      this.device = await navigator.bluetooth.requestDevice({
        filters: OBD_SERVICE_UUIDS.map(uuid => ({ services: [uuid] })),
        optionalServices: OBD_SERVICE_UUIDS,
      });

      if (!this.device) throw new Error("No device selected");

      // Register disconnect listener
      this.device.addEventListener('gattserverdisconnected', this.handleDisconnect);

      this.server = await this.device.gatt?.connect() || null;
      if (!this.server) throw new Error("Could not connect to GATT Server");

      // --- DYNAMIC DISCOVERY STRATEGY FOR vLinker MC+ ---
      let service: BluetoothRemoteGATTService | null = null;
      
      for (const uuid of OBD_SERVICE_UUIDS) {
        try {
          service = await this.server.getPrimaryService(uuid);
          if (service) {
              console.log(`Connected to Service: ${uuid}`);
              break;
          }
        } catch (e) { continue; }
      }
      
      if (!service) throw new Error("OBD Service not found");

      const characteristics = await service.getCharacteristics();
      
      this.writeChar = characteristics.find(c => c.properties.write || c.properties.writeWithoutResponse) || null;
      const notifyChar = characteristics.find(c => c.properties.notify || c.properties.indicate);

      if (!this.writeChar || !notifyChar) {
          throw new Error(`Incompatible Characteristics. Found: ${characteristics.map(c => c.uuid).join(', ')}`);
      }

      await notifyChar.startNotifications();
      notifyChar.addEventListener('characteristicvaluechanged', (e: any) => {
        const value = e.target.value;
        const decoder = new TextDecoder('utf-8');
        const chunk = decoder.decode(value);
        this.buffer += chunk;
        
        if (this.buffer.includes('>')) {
            const fullResponse = this.buffer.replace('>', '').trim();
            this.buffer = "";
            if (this.onDataCallback) {
                this.onDataCallback(fullResponse);
            }
        }
      });

      // Initialize vLinker
      await this.sendCommand("AT Z"); 
      await this.wait(600);
      await this.sendCommand("AT E0"); 
      await this.sendCommand("AT L0"); 
      await this.sendCommand("AT H0");
      await this.sendCommand("AT SP 0"); 
      await this.wait(500);

      try { await this.sendCommand("AT AL"); } catch(e) {}

      return this.device.name || "vLinker MC+";

    } catch (error) {
      console.error("OBD Connection Error:", error);
      throw error;
    }
  }

  async sendCommand(cmd: string): Promise<string> {
    if (!this.server || !this.server.connected || !this.writeChar) throw new Error("Not connected");
    
    return new Promise(async (resolve, reject) => {
        this.onDataCallback = (data) => resolve(data);
        
        const encoder = new TextEncoder();
        const data = encoder.encode(cmd + '\r');
        
        try {
            if (this.writeChar?.properties.write) {
                await this.writeChar.writeValueWithResponse(data);
            } else {
                await this.writeChar?.writeValueWithoutResponse(data);
            }
        } catch (e) {
            reject(e);
        }
    });
  }

  async sendRaw(cmd: string): Promise<string> {
      return this.sendCommand(cmd);
  }

  async clearDTC(): Promise<string> {
      return this.sendCommand("04");
  }

  // --- PARSING (Same as before) ---
  parseRPM(hex: string): number {
    const clean = hex.replace(/ /g, '').replace(/^410C/, '');
    if (clean.length < 4) return 0;
    const A = parseInt(clean.substring(0, 2), 16);
    const B = parseInt(clean.substring(2, 4), 16);
    return Math.round(((A * 256) + B) / 4);
  }

  parseSpeed(hex: string): number {
    const clean = hex.replace(/ /g, '').replace(/^410D/, '');
    if (clean.length < 2) return 0;
    return parseInt(clean.substring(0, 2), 16);
  }

  parseTemp(hex: string): number {
    const clean = hex.replace(/ /g, '').replace(/^4105/, '');
    if (clean.length < 2) return 0;
    return parseInt(clean.substring(0, 2), 16) - 40;
  }
  
  parseVoltage(hex: string): number {
    const clean = hex.replace(/ /g, '').replace(/^4142/, '');
    if (clean.length < 4) return 0;
    const A = parseInt(clean.substring(0, 2), 16);
    const B = parseInt(clean.substring(2, 4), 16);
    return parseFloat((((A * 256) + B) / 1000).toFixed(1));
  }
  
  parseLoad(hex: string): number {
      const clean = hex.replace(/ /g, '').replace(/^4104/, '');
      if (clean.length < 2) return 0;
      const A = parseInt(clean.substring(0, 2), 16);
      return Math.round((A / 2.55));
  }

  parseDTC(hex: string): string[] {
    const clean = hex.replace(/ /g, '').replace(/^43/, '');
    const codes: string[] = [];
    for (let i = 0; i < clean.length; i+=4) {
        if(clean.substring(i, i+4) !== "0000" && clean.length >= i+4) {
             const h = clean.substring(i, i+4);
             codes.push("P" + h); 
        }
    }
    return codes.length > 0 ? codes : [];
  }

  disconnect() {
    if (this.device?.gatt?.connected) {
        this.device.gatt.disconnect();
    }
  }
}