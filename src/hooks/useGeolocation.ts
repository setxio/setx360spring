import { useEffect } from 'react';
import { useApp } from '../context/AppContext';

// Maps of Texas regions by county name
const COUNTY_TO_REGION: Record<string, string> = {
  // SETX — Southeast Texas
  'Jefferson': 'SETX', 'Orange': 'SETX', 'Hardin': 'SETX', 'Jasper': 'SETX',
  'Newton': 'SETX', 'Sabine': 'SETX', 'San Augustine': 'SETX', 'Shelby': 'SETX',
  'Polk': 'SETX', 'Tyler': 'SETX',
  // CTX — Central Texas
  'Travis': 'CTX', 'Williamson': 'CTX', 'Hays': 'CTX', 'Bastrop': 'CTX',
  'Burnet': 'CTX', 'Bell': 'CTX', 'McLennan': 'CTX',
  // NTX — North Texas
  'Dallas': 'NTX', 'Tarrant': 'NTX', 'Collin': 'NTX', 'Denton': 'NTX',
  'Ellis': 'NTX', 'Rockwall': 'NTX', 'Parker': 'NTX', 'Johnson': 'NTX',
  // STX — South Texas
  'Bexar': 'STX', 'Hidalgo': 'STX', 'Cameron': 'STX', 'Webb': 'STX',
  'Nueces': 'STX', 'Victoria': 'STX', 'El Paso': 'STX',
  // ETX — East Texas
  'Harrison': 'ETX', 'Gregg': 'ETX', 'Smith': 'ETX', 'Cherokee': 'ETX',
  'Nacogdoches': 'ETX', 'Rusk': 'ETX', 'Angelina': 'ETX', 'Panola': 'ETX',
  // WTX — West Texas
  'Midland': 'WTX', 'Ector': 'WTX', 'Tom Green': 'WTX', 'Lubbock': 'WTX',
  'Potter': 'WTX', 'Randall': 'WTX', 'Taylor': 'WTX',
  // HTX — Houston / Greater Houston
  'Harris': 'HTX', 'Fort Bend': 'HTX', 'Montgomery': 'HTX', 'Galveston': 'HTX',
  'Brazoria': 'HTX', 'Chambers': 'HTX', 'Liberty': 'HTX', 'Waller': 'HTX',
};

interface ReverseGeoResult {
  city: string | null;
  county: string | null;
  region: string | null;
}

async function reverseGeocode(lat: number, lon: number): Promise<ReverseGeoResult> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`,
      { headers: { 'Accept-Language': 'en-US,en' } }
    );
    const data = await res.json();
    const addr = data.address || {};

    const city = addr.city || addr.town || addr.village || addr.hamlet || null;
    // Nominatim returns county with " County" suffix in the US
    const rawCounty = addr.county || null;
    const county = rawCounty ? rawCounty.replace(/ County$/, '') : null;
    const region = county ? (COUNTY_TO_REGION[county] || null) : null;

    return { city, county, region };
  } catch {
    return { city: null, county: null, region: null };
  }
}

/**
 * useGeolocation — requests the device's physical GPS coordinates and
 * reverse-geocodes them into city/county/region. Populates AppContext's
 * `physicalCity`, `physicalCounty`, `physicalRegion` state on first load.
 *
 * Falls back silently if the user denies permission.
 */
export function useGeolocation() {
  const { setPhysicalLocation, physicalCity } = useApp();

  useEffect(() => {
    // Only run once per session; if we already have physical location, skip
    if (physicalCity) return;
    if (typeof navigator === 'undefined' || !navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { city, county, region } = await reverseGeocode(
          pos.coords.latitude,
          pos.coords.longitude
        );
        setPhysicalLocation(city, county, region);
      },
      () => {
        // Silently fail — user denied permission or timed out
        setPhysicalLocation(null, null, null);
      },
      { timeout: 8000, maximumAge: 5 * 60 * 1000 } // cache for 5 mins
    );
  }, []);
}
