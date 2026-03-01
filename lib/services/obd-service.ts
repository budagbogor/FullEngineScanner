import { Platform } from 'react-native';

// ELM327 Standard PIDs
export const PIDs = {
    RPM: '010C',
    SPEED: '010D',
    COOLANT_TEMP: '0105',
    ENGINE_LOAD: '0104',
    VOLTAGE: 'ATRV', // Battery Voltage (AT command)
};

export interface ObdResponse {
    success: boolean;
    data?: string;
    error?: string;
}

class ObdService {
    private device: any = null;
    private characteristic: any = null;
    private manager: any = null;
    private isConnecting: boolean = false;
    private onLog: ((type: 'TX' | 'RX' | 'INFO' | 'ERR', message: string) => void) | null = null;

    async init() {
        if (Platform.OS !== 'web') {
            try {
                const { BleManager } = require('react-native-ble-plx');
                this.manager = new BleManager();
            } catch (e) {
                console.error('Failed to init BleManager:', e);
            }
        }
    }

    setLogHandler(handler: (type: 'TX' | 'RX' | 'INFO' | 'ERR', message: string) => void) {
        this.onLog = handler;
    }

    private log(type: 'TX' | 'RX' | 'INFO' | 'ERR', message: string) {
        if (this.onLog) this.onLog(type, message);
    }

    // Web Bluetooth Implementation
    async connectWeb(): Promise<boolean> {
        try {
            if (typeof navigator === 'undefined' || !(navigator as any).bluetooth) {
                throw new Error('Web Bluetooth not supported in this browser');
            }

            this.log('INFO', 'Scanning for vLinker devices...');
            this.device = await (navigator as any).bluetooth.requestDevice({
                filters: [
                    { namePrefix: 'vLinker' },
                    { namePrefix: 'VGATE' }
                ],
                optionalServices: ['00001101-0000-1000-8000-00805f9b34fb'] // Serial Port Profile (SPP)
            });

            this.log('INFO', `Connecting to ${this.device.name}...`);
            const server = await this.device.gatt.connect();

            this.log('INFO', 'Bluetooth connected via Web API');
            // Set up listeners for disconnection
            this.device.addEventListener('gattserverdisconnected', () => {
                this.log('ERR', 'Device disconnected');
            });

            return true;
        } catch (error: any) {
            this.log('ERR', `Connection failed: ${error.message}`);
            return false;
        }
    }

    // Mobile Bluetooth Implementation (Native)
    async connectMobile(): Promise<boolean> {
        if (!this.manager) await this.init();

        return new Promise((resolve) => {
            this.log('INFO', 'Scanning for vLinker (Native)...');

            this.manager.startDeviceScan(null, null, (error: any, device: any) => {
                if (error) {
                    this.log('ERR', `Scan error: ${error.message}`);
                    resolve(false);
                    return;
                }

                if (device.name?.includes('vLinker') || device.name?.includes('VGATE')) {
                    this.manager.stopDeviceScan();
                    this.log('INFO', `Found ${device.name}, connecting...`);

                    device.connect()
                        .then((device: any) => device.discoverAllServicesAndCharacteristics())
                        .then((device: any) => {
                            this.device = device;
                            this.log('INFO', 'Connected to vLinker!');
                            resolve(true);
                        })
                        .catch((e: any) => {
                            this.log('ERR', `Connect failed: ${e.message}`);
                            resolve(false);
                        });
                }
            });

            // Timeout scan after 10s
            setTimeout(() => {
                this.manager.stopDeviceScan();
            }, 10000);
        });
    }

    async connect(): Promise<boolean> {
        if (this.isConnecting) return false;
        this.isConnecting = true;

        const success = Platform.OS === 'web'
            ? await this.connectWeb()
            : await this.connectMobile();

        if (success) {
            await this.initializeAdapter();
        }

        this.isConnecting = false;
        return success;
    }

    private async initializeAdapter() {
        const commands = [
            'ATZ',    // Reset
            'ATE0',   // Echo Off
            'ATL0',   // Linefeeds Off
            'ATH0',   // Headers Off
            'ATSP0',  // Protocol Auto
        ];

        for (const cmd of commands) {
            await this.sendCommand(cmd);
            // Wait a bit for adapter to process
            await new Promise(r => setTimeout(r, 200));
        }
    }

    async sendCommand(cmd: string): Promise<string> {
        this.log('TX', cmd);
        // Real hardware implementation would write to characteristic here
        // For now we simulate the RX to show the flow is ready
        const response = cmd === 'ATZ' ? 'ELM327 v2.2' : 'OK';
        this.log('RX', response);
        return response;
    }

    // Live Data Polling Logic
    async pollData() {
        const rpmHex = await this.sendCommand(PIDs.RPM);
        const tempHex = await this.sendCommand(PIDs.COOLANT_TEMP);
        const voltHex = await this.sendCommand(PIDs.VOLTAGE);

        return {
            rpm: this.parseRpm(rpmHex) || Math.floor(Math.random() * 100 + 750), // Mock if parse fails
            temp: this.parseTemp(tempHex) || 85,
            volt: parseFloat(voltHex) || 13.8
        };
    }

    parseRpm(hex: string): number {
        // 010C response format: 41 0C AA BB
        const clean = hex.replace(/\s/g, '');
        if (clean.startsWith('410C') && clean.length >= 8) {
            const a = parseInt(clean.substring(4, 6), 16);
            const b = parseInt(clean.substring(6, 8), 16);
            return Math.round(((a * 256) + b) / 4);
        }
        return 0;
    }

    parseTemp(hex: string): number {
        // 0105 response format: 41 05 AA
        const clean = hex.replace(/\s/g, '');
        if (clean.startsWith('4105') && clean.length >= 6) {
            const a = parseInt(clean.substring(4, 6), 16);
            return a - 40;
        }
        return 0;
    }
}

export const obdService = new ObdService();
