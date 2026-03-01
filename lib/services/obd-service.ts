import { Platform, PermissionsAndroid } from 'react-native';

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

// vLinker specific ST commands for CAN Network Switching
export const CAN_NETWORKS = {
    HS_CAN: 'STP 33',     // ISO 15765-4 CAN (11 bit ID, 500 kbaud)
    MS_CAN: 'STP 51',     // MS-CAN (11 bit ID, 125 kbaud) - Ford/Mazda
    SW_CAN: 'STP 33',     // SW-CAN (11 bit ID, 33.3 kbaud) - GM (Requires STSN command)
};

export const UDS_SERVICES = {
    DIAGNOSTIC_SESSION_CONTROL: '10',
    ECU_RESET: '11',
    SECURITY_ACCESS: '27',
    TESTER_PRESENT: '3E',
    READ_DTC: '19',
    READ_DATA_BY_IDENTIFIER: '22',
    ROUTINE_CONTROL: '31',
    IO_CONTROL: '2F',
};

class ObdService {
    private device: any = null;
    private characteristic: any = null;
    private manager: any = null;
    private isConnecting: boolean = false;
    private onLog: ((type: 'TX' | 'RX' | 'INFO' | 'ERR', message: string) => void) | null = null;
    private pollingInterval: ReturnType<typeof setInterval> | null = null;

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

    private async requestPermissions(): Promise<boolean> {
        if (Platform.OS !== 'android') return true;

        try {
            if (Platform.Version >= 31) {
                const result = await PermissionsAndroid.requestMultiple([
                    PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
                    PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
                    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
                ]);

                return (
                    result['android.permission.BLUETOOTH_CONNECT'] === PermissionsAndroid.RESULTS.GRANTED &&
                    result['android.permission.BLUETOOTH_SCAN'] === PermissionsAndroid.RESULTS.GRANTED &&
                    result['android.permission.ACCESS_FINE_LOCATION'] === PermissionsAndroid.RESULTS.GRANTED
                );
            } else {
                const result = await PermissionsAndroid.request(
                    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
                );
                return result === PermissionsAndroid.RESULTS.GRANTED;
            }
        } catch (e) {
            console.error('Permission request error', e);
            return false;
        }
    }

    // Mobile Bluetooth Implementation (Native)
    async connectMobile(): Promise<boolean> {
        if (!this.manager) await this.init();

        const hasPermissions = await this.requestPermissions();
        if (!hasPermissions) {
            this.log('ERR', 'Bluetooth permissions denied');
            return false;
        }

        return new Promise((resolve) => {
            let timeoutId: any;
            let resolved = false;

            this.log('INFO', 'Scanning for vLinker (Native)...');

            this.manager.startDeviceScan(null, null, (error: any, device: any) => {
                if (error) {
                    if (!resolved) {
                        resolved = true;
                        clearTimeout(timeoutId);
                        this.log('ERR', `Scan error: ${error.message}`);
                        resolve(false);
                    }
                    return;
                }

                const name = device?.name || device?.localName || '';
                if (name.includes('vLinker') || name.includes('VGATE')) {
                    if (!resolved) {
                        resolved = true;
                        clearTimeout(timeoutId);
                        this.manager.stopDeviceScan();
                        this.log('INFO', `Found ${name}, connecting...`);

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
                }
            });

            // Timeout scan after 10s
            timeoutId = setTimeout(() => {
                if (!resolved) {
                    resolved = true;
                    this.manager.stopDeviceScan();
                    this.log('ERR', 'Scan timeout - no device found');
                    resolve(false);
                }
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

    /**
     * Send UDS Command and handle ISO-TP Multi-frame responses
     */
    async sendUdsCommand(cmd: string, timeoutMs: number = 3000): Promise<string> {
        this.log('TX', cmd);

        // Simulating the delay
        await new Promise(r => setTimeout(r, 200));

        // Mock UDS Multi-frame response (e.g., Reading VIN 09 02)
        if (cmd.includes('09 02') || cmd.includes('22 F1 90')) {
            const mockIsoTp = [
                "014 49 02 01 31 48 47", // Frame 0 (Length 014, Data)
                "021 43 4D 38 32 36 33", // Frame 1
                "022 34 31 38 38 32 37"  // Frame 2
            ].join('\r\n');
            this.log('RX', mockIsoTp);
            return this.parseIsoTp(mockIsoTp);
        }

        const response = '7F 22 11'; // Mock negative response
        this.log('RX', response);
        return response;
    }

    /**
     * Parse ISO 15765-2 (ISO-TP) Multi-frame CAN messages
     */
    private parseIsoTp(raw: string): string {
        const lines = raw.split('\n').map(l => l.trim()).filter(l => l && !l.includes('>'));

        if (lines.length === 0) return '';
        if (lines.length === 1 && !lines[0].match(/^[0-3]/)) {
            // Single frame or standard response
            return lines[0];
        }

        let fullData = '';
        let expectedLen = 0;

        for (const line of lines) {
            const parts = line.split(' ');
            if (parts.length < 2) continue;

            const pci = parts[0];

            // Frame type is high nibble of first byte
            const frameType = pci.charAt(0);

            if (frameType === '0') {
                // Single Frame: 0[len] [data]...
                fullData += parts.slice(1).join('');
            } else if (frameType === '1') {
                // First Frame: 1[len_high] [len_low] [data]...
                // We ignore length for this simple parser and just grab data
                fullData += parts.slice(2).join('');
            } else if (frameType === '2') {
                // Consecutive Frame: 2[seq] [data]...
                fullData += parts.slice(1).join('');
            }
        }

        return fullData;
    }

    async sendCommand(cmd: string, timeoutMs: number = 2000): Promise<string> {
        this.log('TX', cmd);
        // Real hardware implementation would write to characteristic here
        // Then wait for RX notification.
        // For now we simulate the RX to show the flow is ready

        // Simulating delay for hardware response
        await new Promise(r => setTimeout(r, 100));

        let response = 'OK';

        // Mock responses for UI testing
        if (cmd === 'ATZ') response = 'ELM327 v2.2\r\n\r\n>';
        if (cmd.startsWith('STP')) response = 'OK\r\n>';

        // Mock RPM
        if (cmd === PIDs.RPM) {
            const mockRpmHex = (Math.floor(Math.random() * 500 + 800) * 4).toString(16).padStart(4, '0').toUpperCase();
            response = `41 0C ${mockRpmHex.substring(0, 2)} ${mockRpmHex.substring(2, 4)}\r\n>`;
        }

        this.log('RX', response);
        return response;
    }

    /**
     * VLinker Specific Switch Network Command
     */
    async switchNetwork(network: string): Promise<boolean> {
        this.log('INFO', `Switching to CAN Network: ${network}`);
        const res = await this.sendCommand(network);
        return res.includes('OK');
    }

    /**
     * UDS: Read DTCs from current module
     */
    async readUdsDtcs(): Promise<string[]> {
        // Service 19, Subfunction 02 (Report DTC by Status Mask), Mask 08 (Confirmed)
        const cmd = `${UDS_SERVICES.READ_DTC} 02 08`;
        const res = await this.sendCommand(cmd);

        // Parsing mock
        if (res.includes('7F') || res.includes('NO DATA')) {
            return [];
        }

        // Mocking found DTCs
        return ['P0100', 'U0100'];
    }

    /**
     * UDS: Clear DTCs
     */
    async clearUdsDtcs(): Promise<boolean> {
        // Service 14, Group FF FF FF (All DTCs)
        const cmd = '14 FF FF FF';
        const res = await this.sendCommand(cmd);
        return res.includes('54'); // 14 + 40 = 54
    }

    // Live Data Polling Logic
    async pollData() {
        const rpmHex = await this.sendCommand(PIDs.RPM);
        const tempHex = await this.sendCommand(PIDs.COOLANT_TEMP);
        const voltHex = await this.sendCommand(PIDs.VOLTAGE);
        const speedHex = await this.sendCommand(PIDs.SPEED);
        const loadHex = await this.sendCommand(PIDs.ENGINE_LOAD);

        return {
            rpm: this.parseRpm(rpmHex) || Math.floor(Math.random() * 100 + 750), // Mock if parse fails
            temp: this.parseTemp(tempHex) || 85,
            volt: parseFloat(voltHex) || 13.8,
            speed: this.parseSpeed(speedHex) || 0,
            load: this.parseLoad(loadHex) || Math.floor(Math.random() * 15 + 10)
        };
    }

    startPolling(onData: (data: any) => void, intervalMs = 2000) {
        if (this.pollingInterval) this.stopPolling();

        this.pollingInterval = setInterval(async () => {
            const data = await this.pollData();
            onData(data);
        }, intervalMs);
    }

    stopPolling() {
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
            this.pollingInterval = null;
        }
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

    parseSpeed(hex: string): number {
        const clean = hex.replace(/\s/g, '');
        if (clean.startsWith('410D') && clean.length >= 6) {
            return parseInt(clean.substring(4, 6), 16);
        }
        return 0;
    }

    parseLoad(hex: string): number {
        const clean = hex.replace(/\s/g, '');
        if (clean.startsWith('4104') && clean.length >= 6) {
            const a = parseInt(clean.substring(4, 6), 16);
            return Math.round((a * 100) / 255);
        }
        return 0;
    }
}

export const obdService = new ObdService();
