// Weather Data Types
export interface WeatherData {
  temp: number;
  apparentTemp: number;
  dewPoint: number;
  humidity: number;
  windSpeed: number;
  windDirection: number;
  windGust: number;
  precipitation: number;
  precipitationProbability: number;
  cloudCover: number;
  visibility: number;
  uvIndex: number;
  pressure: number;
  relativeHumidity: number;
}

// Application Index (recomendações agrícolas)
export interface AppIndex {
  fungicide: number;
  herbicide: number;
  insecticide: number;
  foliarFertilizer: number;
}

// GPS Location
export interface GeoLocation {
  lat: number;
  lon: number;
  name: string;
  accuracy?: number;
  altitude?: number;
  heading?: number;
  timestamp?: number;
}

// Operation Log (cada ação/recomendação registrada)
export interface OperationLog {
  id: string;
  timestamp: string; // ISO
  location: GeoLocation;
  weather: WeatherData;
  appIndex: AppIndex;
  gps: {
    accuracy: number;
    altitude: number;
    heading: number;
  };
  notes?: string;
  exportedAt?: string;
}

// Report (relatório exportado)
export interface Report {
  id: string;
  operationIds: string[];
  generatedAt: string;
  format: 'pdf' | 'csv' | 'txt';
  exported: boolean;
  exportedAt?: string;
}

// API Response Types
export interface OpenMeteoResponse {
  latitude: number;
  longitude: number;
  current: {
    time: string;
    temperature2m: number;
    apparentTemperature: number;
    dewPoint2m: number;
    relativeHumidity2m: number;
    weatherCode: number;
    windSpeed10m: number;
    windDirection10m: number;
    windGust10m: number;
    precipitation: number;
    precipitationProbability: number;
    cloudCover: number;
    visibility: number;
    uvIndex: number;
    pressure: number;
  };
  hourly: {
    time: string[];
    temperature2m: number[];
    relativeHumidity2m: number[];
    windSpeed10m: number[];
    windGust10m: number[];
    precipitation: number[];
    weatherCode: number[];
    cloudCover: number[];
  };
  daily: {
    time: string[];
    weatherCode: number[];
    temperatureMax: number[];
    temperatureMin: number[];
    windSpeedMax: number[];
    windGustMax: number[];
    precipitationSum: number[];
    precipitation?: number[];
    precipitationProbabilityMax?: number[];
  };
  timezoneOffset?: number;
}

// Nominatim Reverse Geocoding
export interface NominatimResponse {
  name?: string;
  address?: {
    city?: string;
    town?: string;
    village?: string;
    municipality?: string;
    county?: string;
    state?: string;
    country?: string;
  };
}

export interface AppState {
  location: GeoLocation | null;
  weather: WeatherData | null;
  appIndex: AppIndex | null;
  isLoading: boolean;
  error: string | null;
  isOnline: boolean;
  operations: OperationLog[];
}
