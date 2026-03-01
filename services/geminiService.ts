import { GoogleGenAI, Type, Schema } from "@google/genai";
import { MechanicResponse } from "../shared/mechanic-types";

// Unified Schema - LOCKED FOR STABILITY
const mechanicResponseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    vehicle_info: { type: Type.STRING },
    component_id: { type: Type.STRING },
    component_name: { type: Type.STRING },
    diagnosis: { type: Type.ARRAY, items: { type: Type.STRING } },
    dtc_list: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          code: { type: Type.STRING },
          definition: { type: Type.STRING },
          possible_cause: { type: Type.STRING },
          related_components: { type: Type.STRING },
          symptoms: { type: Type.STRING },
          fix_suggestion: { type: Type.STRING }
        },
        required: ["code", "definition", "fix_suggestion"]
      }
    },
    tsb_list: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: { id: { type: Type.STRING }, summary: { type: Type.STRING } }
      }
    },
    manual_summary: { type: Type.STRING },
    wiring_diagram_desc: { type: Type.STRING },
    wiring_search_keywords: { type: Type.STRING, description: "Keyword spesifik untuk pencarian Google Image Diagram" },
    maintenance_data: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          item: { type: Type.STRING, description: "Nama komponen atau cairan" },
          spec: { type: Type.STRING, description: "Spesifikasi (cth: SAE 5W-30 atau 'Ceramic')" },
          value: { type: Type.STRING, description: "Kapasitas/Jumlah" },
          oem_part_number: { type: Type.STRING },
          oem_brand: { type: Type.STRING },
          aftermarket_parts: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                brand: { type: Type.STRING },
                part_number: { type: Type.STRING },
                estimated_price: { type: Type.STRING, description: "Harga dalam Rupiah (Rp)" }
              }
            }
          }
        },
        required: ["item", "spec", "value"]
      },
      description: "Daftar sparepart yang harus diganti dan data maintenance cairan."
    },
    torque_specs: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          part: { type: Type.STRING, description: "Nama baut spesifik (cth: Cylinder Head Bolt, Drain Plug)" },
          value: { type: Type.STRING, description: "Nilai Newton Meter & ft-lb" },
          size: { type: Type.STRING, description: "Ukuran Kepala Baut (cth: 14mm, 17mm)" }
        }
      }
    },
    tools_list: { type: Type.ARRAY, items: { type: Type.STRING } },
    safety_warning: { type: Type.ARRAY, items: { type: Type.STRING } },
    sop_steps: { type: Type.ARRAY, items: { type: Type.STRING } },
    video_tutorials: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: { title: { type: Type.STRING }, url: { type: Type.STRING } }
      }
    },
    estimated_work_time: { type: Type.STRING },
    cost_estimation: {
      type: Type.OBJECT,
      properties: { parts_total: { type: Type.STRING }, labor_cost: { type: Type.STRING }, hourly_rate: { type: Type.STRING }, total_estimate: { type: Type.STRING } }
    },
    // NEW FIELD FOR HEX COMMANDS
    obd_hex_commands: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          description: { type: Type.STRING, description: "Penjelasan command (cth: 'Reset Fuel Trim' atau 'Active Test Fan ON')" },
          hex_command: { type: Type.STRING, description: "Raw Hex String (cth: '04', '31 01', '2F ...')" },
          risk_level: { type: Type.STRING, enum: ["LOW", "MEDIUM", "HIGH"] },
          notes: { type: Type.STRING, description: "Pre-condition (cth: Mesin harus mati)" }
        },
        required: ["description", "hex_command", "risk_level"]
      },
      description: "Daftar command HEX UDS/ELM327 untuk dieksekusi di terminal."
    }
  },
  required: [
    "vehicle_info", "diagnosis", "sop_steps", "cost_estimation", "maintenance_data", "torque_specs", "tools_list"
  ],
};

const SYSTEM_INSTRUCTION = `
Role:
Anda adalah "Master AI Mechanic" & "UDS/CAN Protocol Engineer" definitif untuk pasar otomotif Indonesia.
Anda adalah Backend Logic untuk aplikasi "Mechanic Co-Pilot".

MANDATORY OUTPUT RULES (STRICT & CONSISTENT):

1. **BAHASA & TONE:**
   - Gunakan Bahasa Indonesia teknis bengkel yang baku (campuran istilah teknis Inggris + Indonesia).
   - Tone: Profesional, Padat, Langsung ke inti masalah (No chit-chat).

2. **TORQUE SPECS & DIAGRAMS (OPTIMALKAN UNTUK PENCARIAN):**
   - Pada field 'torque_specs', nama 'part' harus sangat spesifik agar saat dicari di Google Images langsung muncul diagram manualnya.
     - BENAR: "Cylinder Head Bolt No.1-10", "Oil Pan Drain Plug", "Crankshaft Pulley Bolt".
     - SALAH: "Baut", "Mur".
   - Field 'wiring_search_keywords' WAJIB diisi dengan format: "[Merk Model] [Komponen] wiring diagram pinout".

3. **PARTS & PRICING (LOKALISASI INDONESIA):**
   - 'aftermarket_parts' TIDAK BOLEH KOSONG.
   - Berikan 2-3 opsi brand yang eksis di Indonesia (Denso, Bosch, Aisin, 555, KYB, Aspira, Akebono).
   - Harga WAJIB estimasi Rupiah (Rp) yang logis.

4. **ENGINEERING MODE (HEX COMMANDS):**
   - Jika diagnosa melibatkan Reset (Throttle/Oil/SAS/Brake), Adaptasi, atau Coding, WAJIB sertakan 'obd_hex_commands'.
   - Gunakan UDS Protocol (Service 31, 2F, 2E) atau Standard OBD ($04 Clear DTC).
   - Contoh Reset: "31 01 00 01".

5. **FORMAT KONSISTEN:**
   - Jangan mengubah struktur JSON.
   - Pastikan 'vehicle_info' selalu mencakup Tahun, Merk, Model, dan Mesin.

Output format:
JSON ONLY.
`;

export interface MediaInput {
  data: string; // Base64 string
  mimeType: string; // e.g., 'image/jpeg' or 'audio/wav'
}

export const getMechanicAdvice = async (
  input: string,
  media?: MediaInput | null,
  providedApiKey?: string | null
): Promise<MechanicResponse> => {
  const apiKey = providedApiKey || process.env.EXPO_PUBLIC_GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("API Key is missing. Please configure it in Settings.");
  }

  const ai = new GoogleGenAI({ apiKey });

  try {
    const parts: any[] = [{ text: input }];

    if (media) {
      const cleanData = media.data.replace(/^data:(image|audio)\/[a-z0-9.-]+;base64,/, "");
      parts.push({
        inlineData: {
          mimeType: media.mimeType,
          data: cleanData
        }
      });
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: { parts: parts },
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: mechanicResponseSchema,
        temperature: 0.1 // LOW TEMPERATURE FOR MAXIMUM STABILITY & CONSISTENCY
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    return JSON.parse(text) as MechanicResponse;

  } catch (error) {
    console.error("Error fetching mechanic advice:", error);
    throw error;
  }
};