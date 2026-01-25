import type { VinData } from '@/shared/mechanic-types';

export const decodeVin = async (vin: string): Promise<VinData | null> => {
  const cleanVin = vin.trim().toUpperCase();
  
  if (cleanVin.length < 5) return null;

  try {
    const response = await fetch(
      `https://vpic.nhtsa.dot.gov/api/vehicles/decodevinvalues/${cleanVin}?format=json`
    );
    
    if (!response.ok) {
      throw new Error("Network response was not ok");
    }

    const data = await response.json();
    
    if (data && data.Results && data.Results.length > 0) {
      const item = data.Results[0];

      if (!item.Make && !item.Model && !item.ModelYear) {
        return null;
      }

      const engineParts = [
        item.DisplacementL ? `${item.DisplacementL}L` : '',
        item.EngineCylinders ? `V${item.EngineCylinders}` : '',
        item.FuelTypePrimary || ''
      ].filter(Boolean).join(' ');

      return {
        make: item.Make || '',
        model: item.Model || '',
        year: item.ModelYear || '',
        bodyClass: item.BodyClass || '',
        engine: engineParts,
        fuel: item.FuelTypePrimary || '',
        raw: item
      };
    }
    
    return null;

  } catch (error) {
    console.error("VIN Decode Error:", error);
    return null;
  }
};
