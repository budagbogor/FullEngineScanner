import type { MechanicResponse, MediaInput } from '@/shared/mechanic-types';

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

const mechanicResponseSchema = {
  type: "object",
  properties: {
    vehicle_info: { type: "string" },
    component_id: { type: "string" },
    component_name: { type: "string" },
    diagnosis: { type: "array", items: { type: "string" } },
    dtc_list: {
      type: "array",
      items: {
        type: "object",
        properties: {
          code: { type: "string" },
          definition: { type: "string" },
          possible_cause: { type: "string" },
          related_components: { type: "string" },
          symptoms: { type: "string" },
          fix_suggestion: { type: "string" }
        },
        required: ["code", "definition", "fix_suggestion"]
      }
    },
    tsb_list: {
      type: "array",
      items: {
        type: "object",
        properties: { id: { type: "string" }, summary: { type: "string" } }
      }
    },
    manual_summary: { type: "string" },
    wiring_diagram_desc: { type: "string" },
    wiring_search_keywords: { type: "string" },
    maintenance_data: {
      type: "array",
      items: {
        type: "object",
        properties: {
          item: { type: "string" },
          spec: { type: "string" },
          value: { type: "string" },
          oem_part_number: { type: "string" },
          oem_brand: { type: "string" },
          aftermarket_parts: {
            type: "array",
            items: {
              type: "object",
              properties: { 
                brand: { type: "string" }, 
                part_number: { type: "string" }, 
                estimated_price: { type: "string" } 
              }
            }
          }
        },
        required: ["item", "spec", "value"]
      }
    },
    torque_specs: {
      type: "array",
      items: {
        type: "object",
        properties: { 
          part: { type: "string" }, 
          value: { type: "string" }, 
          size: { type: "string" } 
        }
      }
    },
    tools_list: { type: "array", items: { type: "string" } },
    safety_warning: { type: "array", items: { type: "string" } },
    sop_steps: { type: "array", items: { type: "string" } },
    video_tutorials: {
      type: "array",
      items: {
        type: "object",
        properties: { title: { type: "string" }, url: { type: "string" } }
      }
    },
    estimated_work_time: { type: "string" },
    cost_estimation: {
      type: "object",
      properties: { 
        parts_total: { type: "string" }, 
        labor_cost: { type: "string" }, 
        hourly_rate: { type: "string" }, 
        total_estimate: { type: "string" } 
      }
    },
    obd_hex_commands: {
      type: "array",
      items: {
        type: "object",
        properties: {
          description: { type: "string" },
          hex_command: { type: "string" },
          risk_level: { type: "string", enum: ["LOW", "MEDIUM", "HIGH"] },
          notes: { type: "string" }
        },
        required: ["description", "hex_command", "risk_level"]
      }
    }
  },
  required: [
    "vehicle_info", "diagnosis", "sop_steps", "cost_estimation", "maintenance_data", "torque_specs", "tools_list"
  ],
};

export const getMechanicAdvice = async (
  input: string, 
  media?: MediaInput | null,
  apiKey?: string
): Promise<MechanicResponse> => {
  const key = apiKey || process.env.EXPO_PUBLIC_GEMINI_API_KEY;
  
  if (!key) {
    throw new Error("API Key is missing. Please set EXPO_PUBLIC_GEMINI_API_KEY");
  }

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

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{ parts }],
          systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
          generationConfig: {
            responseMimeType: "application/json",
            responseSchema: mechanicResponseSchema,
            temperature: 0.1,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'API request failed');
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!text) throw new Error("No response from AI");
    
    return JSON.parse(text) as MechanicResponse;

  } catch (error) {
    console.error("Error fetching mechanic advice:", error);
    throw error;
  }
};
