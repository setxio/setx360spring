export interface WeatherData {
  current: {
    temp: number;
    condition: string;
    humidity: number;
    wind: number;
    high: number;
    low: number;
    isDay: boolean;
  };
  hourly: {
    time: Date;
    temp: number;
    condition: string;
    isDay: boolean;
  }[];
  daily: {
    date: Date;
    high: number;
    low: number;
    condition: string;
  }[];
  locationName: string;
}

const BEAUMONT_COORDS = { lat: 30.0802, lon: -94.1266 };

// Helper to map WMO weather codes to human readable conditions
function getWeatherCondition(code: number, isDay: boolean): string {
  if (code === 0) return 'Clear';
  if (code === 1) return 'Mostly Clear';
  if (code === 2) return 'Partly Cloudy';
  if (code === 3) return 'Cloudy';
  if ([45, 48].includes(code)) return 'Foggy';
  if ([51, 53, 55, 56, 57].includes(code)) return 'Drizzle';
  if ([61, 63, 65, 66, 67].includes(code)) return 'Rain';
  if ([71, 73, 75, 77].includes(code)) return 'Snow';
  if ([80, 81, 82].includes(code)) return 'Showers';
  if ([85, 86].includes(code)) return 'Snow Showers';
  if ([95, 96, 99].includes(code)) return 'Thunderstorm';
  return 'Unknown';
}

export async function getUserLocation(): Promise<{lat: number; lon: number}> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(BEAUMONT_COORDS);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lon: position.coords.longitude
        });
      },
      (error) => {
        console.warn("Geolocation denied or failed. Defaulting to Beaumont, TX.", error);
        resolve(BEAUMONT_COORDS);
      },
      { timeout: 10000, maximumAge: 60000 }
    );
  });
}

export async function getLocationNameFromCoords(lat: number, lon: number): Promise<string> {
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10`);
    if (!res.ok) return 'Local Area';
    const data = await res.json();
    return data.address.city || data.address.town || data.address.village || data.address.county || 'Local Area';
  } catch (error) {
    console.error("Failed to reverse geocode:", error);
    return 'Local Area';
  }
}

export async function getWeatherFromCoords(lat: number, lon: number, locationName: string = 'Local'): Promise<WeatherData> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,is_day,weather_code,wind_speed_10m&hourly=temperature_2m,weather_code,is_day&daily=weather_code,temperature_2m_max,temperature_2m_min&temperature_unit=fahrenheit&wind_speed_unit=mph&precipitation_unit=inch&timezone=America%2FChicago`;
  
  const response = await fetch(url);
  if (!response.ok) throw new Error("Failed to fetch weather data");
  
  const data = await response.json();
  
  // Parse Hourly Data (next 24 hours)
  const hourly = [];
  const now = new Date();
  
  // Find current hour index
  let startIndex = 0;
  for (let i = 0; i < data.hourly.time.length; i++) {
    const time = new Date(data.hourly.time[i]);
    if (time >= now) {
      startIndex = i;
      break;
    }
  }

  for (let i = startIndex; i < startIndex + 24 && i < data.hourly.time.length; i++) {
    hourly.push({
      time: new Date(data.hourly.time[i]),
      temp: Math.round(data.hourly.temperature_2m[i]),
      condition: getWeatherCondition(data.hourly.weather_code[i], data.hourly.is_day[i] === 1),
      isDay: data.hourly.is_day[i] === 1
    });
  }

  // Parse Daily Data (next 10 days)
  const daily = [];
  for (let i = 0; i < data.daily.time.length; i++) {
    // Append T12:00:00 to avoid UTC timezone offset shifting the day back to yesterday
    daily.push({
      date: new Date(data.daily.time[i] + 'T12:00:00'),
      high: Math.round(data.daily.temperature_2m_max[i]),
      low: Math.round(data.daily.temperature_2m_min[i]),
      condition: getWeatherCondition(data.daily.weather_code[i], true)
    });
  }

  return {
    locationName,
    current: {
      temp: Math.round(data.current.temperature_2m),
      condition: getWeatherCondition(data.current.weather_code, data.current.is_day === 1),
      humidity: Math.round(data.current.relative_humidity_2m),
      wind: Math.round(data.current.wind_speed_10m),
      high: daily[0]?.high || Math.round(data.current.temperature_2m),
      low: daily[0]?.low || Math.round(data.current.temperature_2m),
      isDay: data.current.is_day === 1
    },
    hourly,
    daily
  };
}

export async function getPreviewWeather(): Promise<WeatherData> {
  let coords = BEAUMONT_COORDS;
  try {
    if (navigator.permissions) {
      const permission = await navigator.permissions.query({ name: 'geolocation' });
      if (permission.state === 'granted') {
        const position: any = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
        });
        coords = { lat: position.coords.latitude, lon: position.coords.longitude };
      }
    }
  } catch (e) {
    console.warn("Could not get preview location permission silently", e);
  }
  
  const locationName = await getLocationNameFromCoords(coords.lat, coords.lon);
  return await getWeatherFromCoords(coords.lat, coords.lon, locationName);
}
