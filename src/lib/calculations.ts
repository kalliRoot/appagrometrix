import { WeatherData, AppIndex } from '../types';

/**
 * Calcula o índice de aplicação para cada tipo de produto agrícola
 * Baseado na lógica original do Agrometrix
 */
export function calculateAppIndex(weather: WeatherData): AppIndex {
  const { windSpeed, windGust, humidity, precipitation, temp } = weather;

  // Fungicida (Penalizado por: vento >10, rajada >15, baixa umidade, chuva)
  let fungicide = 100;
  if (windSpeed > 10) fungicide -= 20;
  if (windGust > 15) fungicide -= 15;
  if (humidity < 60) fungicide -= 15;
  if (precipitation > 0.5) fungicide -= 25;
  fungicide = Math.max(0, Math.min(100, fungicide));

  // Herbicida (Penalizado por: vento >8, chuva >0.2mm, umidade >90%)
  let herbicide = 100;
  if (windSpeed > 8) herbicide -= 15;
  if (precipitation > 0.2) herbicide -= 20;
  if (humidity > 90) herbicide -= 10;
  if (windGust > 15) herbicide -= 15;
  herbicide = Math.max(0, Math.min(100, herbicide));

  // Inseticida (Penalizado por: vento >15, chuva >0.5mm, temp alta >35)
  let insecticide = 100;
  if (windSpeed > 15) insecticide -= 20;
  if (precipitation > 0.5) insecticide -= 25;
  if (temp > 35) insecticide -= 15;
  if (windGust > 20) insecticide -= 15;
  insecticide = Math.max(0, Math.min(100, insecticide));

  // Adubo Foliar (Penalizado por: vento >12, umidade extrema, chuva >0.3mm)
  let foliarFertilizer = 100;
  if (windSpeed > 12) foliarFertilizer -= 15;
  if (humidity > 95 || humidity < 40) foliarFertilizer -= 10;
  if (precipitation > 0.3) foliarFertilizer -= 20;
  if (windGust > 18) foliarFertilizer -= 15;
  foliarFertilizer = Math.max(0, Math.min(100, foliarFertilizer));

  return {
    fungicide: Math.round(fungicide),
    herbicide: Math.round(herbicide),
    insecticide: Math.round(insecticide),
    foliarFertilizer: Math.round(foliarFertilizer),
  };
}

/**
 * Classifica o índice em categorias
 */
export function classifyIndex(value: number): 'Favorável' | 'Moderado' | 'Desfavorável' {
  if (value >= 70) return 'Favorável';
  if (value >= 40) return 'Moderado';
  return 'Desfavorável';
}

/**
 * Retorna cor para visualização
 */
export function getIndexColor(value: number): string {
  const classification = classifyIndex(value);
  switch (classification) {
    case 'Favorável':
      return '#22c55e'; // green
    case 'Moderado':
      return '#eab308'; // yellow
    case 'Desfavorável':
      return '#ef4444'; // red
  }
}

/**
 * Formata temperatura com precisão
 */
export function formatTemp(temp: number): string {
  return `${temp.toFixed(1)}°C`;
}

/**
 * Formata velocidade do vento
 */
export function formatWind(speed: number): string {
  const ms = (speed / 3.6).toFixed(1);
  return `${speed.toFixed(1)} km/h (${ms} m/s)`;
}

/**
 * Formata umidade
 */
export function formatHumidity(humidity: number): string {
  let status = '';
  if (humidity > 90) status = ' (Muito Úmido)';
  else if (humidity > 70) status = ' (Úmido)';
  else if (humidity < 40) status = ' (Seco)';
  return `${humidity.toFixed(1)}%${status}`;
}

/**
 * Calcula delta-T (para secagem)
 */
export function calculateDeltaT(temp: number, humidity: number): number {
  // Fórmula simplificada
  const dewPoint = temp - (100 - humidity) / 5;
  return temp - dewPoint;
}

/**
 * Formata data/hora
 */
export function formatDateTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleString('pt-BR');
}

/**
 * Gera UUID v4
 */
export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Formata número para moeda/valores
 */
export function formatNumber(value: number, decimals = 2): string {
  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}
