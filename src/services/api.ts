import { WeatherData, GeoLocation, OpenMeteoResponse, NominatimResponse } from '../types';
import { calculateAppIndex } from '../lib/calculations';

const OPEN_METEO_BASE = 'https://api.open-meteo.com/v1/forecast';
const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org';

/**
 * Busca dados de clima de Open-Meteo
 */
export async function fetchWeather(lat: number, lon: number): Promise<WeatherData> {
  const params = new URLSearchParams({
    latitude: lat.toString(),
    longitude: lon.toString(),
    current: 'temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m,wind_direction_10m,wind_gust_10m,precipitation,precipitation_probability,cloud_cover,visibility,uv_index,pressure_msl,dew_point_2m',
    timezone: 'auto',
  });

  const response = await fetch(`${OPEN_METEO_BASE}?${params}`);
  if (!response.ok) throw new Error('Failed to fetch weather');

  const data: OpenMeteoResponse = await response.json();
  const current = data.current;

  return {
    temp: current.temperature2m,
    apparentTemp: current.apparentTemperature,
    dewPoint: current.dewPoint2m,
    humidity: current.relativeHumidity2m,
    windSpeed: current.windSpeed10m,
    windDirection: current.windDirection10m,
    windGust: current.windGust10m,
    precipitation: current.precipitation,
    precipitationProbability: current.precipitationProbability,
    cloudCover: current.cloudCover,
    visibility: current.visibility,
    uvIndex: current.uvIndex,
    pressure: current.pressure,
    relativeHumidity: current.relativeHumidity2m,
  };
}

/**
 * Busca dados de previsão (hourly + daily)
 */
export async function fetchForecast(lat: number, lon: number) {
  const params = new URLSearchParams({
    latitude: lat.toString(),
    longitude: lon.toString(),
    hourly: 'temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,wind_gust_10m,precipitation,cloud_cover',
    daily: 'weather_code,temperature_2m_max,temperature_2m_min,wind_speed_10m_max,wind_gust_10m_max,precipitation_sum,precipitation_probability_max',
    timezone: 'auto',
    forecast_days: '14',
  });

  const response = await fetch(`${OPEN_METEO_BASE}?${params}`);
  if (!response.ok) throw new Error('Failed to fetch forecast');

  return await response.json();
}

/**
 * Reverse geocoding - encontra nome da localização via coordenadas
 */
export async function reverseGeocode(lat: number, lon: number): Promise<string> {
  const params = new URLSearchParams({
    lat: lat.toString(),
    lon: lon.toString(),
    format: 'json',
    zoom: '10',
    addressdetails: '1',
  });

  try {
    const response = await fetch(`${NOMINATIM_BASE}/reverse?${params}`);
    if (!response.ok) return `${lat.toFixed(4)}, ${lon.toFixed(4)}`;

    const data: NominatimResponse = await response.json();
    const address = data.address;

    if (address) {
      return (
        address.city ||
        address.town ||
        address.village ||
        address.municipality ||
        `${lat.toFixed(4)}, ${lon.toFixed(4)}`
      );
    }
    return `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
  } catch {
    return `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
  }
}

/**
 * Busca coordenadas via nome da cidade/município
 */
export async function searchLocation(query: string): Promise<GeoLocation[]> {
  const params = new URLSearchParams({
    q: query,
    format: 'json',
    countrycodes: 'br', // Foco em Brasil
    limit: '5',
  });

  try {
    const response = await fetch(`${NOMINATIM_BASE}/search?${params}`);
    if (!response.ok) throw new Error('Search failed');

    const data = await response.json();
    return data.map((item: any) => ({
      lat: parseFloat(item.lat),
      lon: parseFloat(item.lon),
      name: item.display_name.split(',')[0],
    }));
  } catch {
    return [];
  }
}

/**
 * Busca índice geomagnético (Kp)
 */
export async function fetchKpIndex(): Promise<number> {
  try {
    const response = await fetch('https://services.swpc.noaa.gov/json/planetary_k_index_1m.json');
    if (!response.ok) throw new Error('Failed to fetch Kp');

    const data = await response.json();
    if (data && data[0] && data[0].kp !== undefined) {
      return data[0].kp;
    }
    return 0;
  } catch {
    return 0;
  }
}

/**
 * Função utilitária para fazer requisições com retry
 */
export async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  retries = 3
): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, options);
      if (response.ok) return response;
      if (response.status === 429) {
        // Rate limited, espera um pouco
        await new Promise((r) => setTimeout(r, 1000 * Math.pow(2, i)));
        continue;
      }
      if (i === retries - 1) throw new Error(`Request failed: ${response.status}`);
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise((r) => setTimeout(r, 1000 * Math.pow(2, i)));
    }
  }
  throw new Error('Fetch failed after retries');
}
