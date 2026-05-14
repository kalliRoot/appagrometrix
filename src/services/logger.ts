import { OperationLog, WeatherData, GeoLocation, AppIndex } from '../types';
import { saveOperation } from './storage';
import { generateUUID } from '../lib/calculations';

/**
 * Estrutura de contexto do logger
 */
interface LogContext {
  location: GeoLocation;
  weather: WeatherData;
  appIndex: AppIndex;
  gps: {
    accuracy: number;
    altitude: number;
    heading: number;
  };
  notes?: string;
}

/**
 * Logger de operações agrícolas
 * Registra cada recomendação/ação com dados completos
 */
export class AgrometrixLogger {
  private static instance: AgrometrixLogger;

  private constructor() {}

  static getInstance(): AgrometrixLogger {
    if (!AgrometrixLogger.instance) {
      AgrometrixLogger.instance = new AgrometrixLogger();
    }
    return AgrometrixLogger.instance;
  }

  /**
   * Log completo de uma operação
   */
  async logOperation(context: LogContext): Promise<string> {
    const operation: Omit<OperationLog, 'id'> = {
      timestamp: new Date().toISOString(),
      location: context.location,
      weather: context.weather,
      appIndex: context.appIndex,
      gps: context.gps,
      notes: context.notes,
    };

    const id = await saveOperation(operation);
    console.log(`[Agrometrix] Operation logged: ${id}`);

    return id;
  }

  /**
   * Log simples (sem salvar em BD, só console/analytics)
   */
  logEvent(event: string, data?: any): void {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${event}`, data);

    // Aqui você poderia enviar para analytics
    // e.g., analytics.logEvent(event, { ...data, timestamp })
  }

  /**
   * Log de erro
   */
  logError(error: string | Error, context?: any): void {
    const timestamp = new Date().toISOString();
    const message = error instanceof Error ? error.message : error;
    console.error(`[${timestamp}] ERROR: ${message}`, context);
  }

  /**
   * Log de GPS
   */
  logGPS(location: GeoLocation, accuracy?: number): void {
    this.logEvent('GPS_UPDATE', {
      lat: location.lat,
      lon: location.lon,
      name: location.name,
      accuracy,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Log de conexão
   */
  logConnectivity(isOnline: boolean): void {
    this.logEvent(isOnline ? 'ONLINE' : 'OFFLINE', {
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Log de clima atualizado
   */
  logWeatherUpdate(weather: WeatherData, location: GeoLocation): void {
    this.logEvent('WEATHER_UPDATE', {
      location: location.name,
      temp: weather.temp,
      humidity: weather.humidity,
      windSpeed: weather.windSpeed,
      precipitation: weather.precipitation,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Log de recomendação gerada
   */
  logRecommendation(appIndex: AppIndex, location: GeoLocation): void {
    this.logEvent('RECOMMENDATION', {
      location: location.name,
      fungicide: appIndex.fungicide,
      herbicide: appIndex.herbicide,
      insecticide: appIndex.insecticide,
      foliarFertilizer: appIndex.foliarFertilizer,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Log de relatório exportado
   */
  logReportExport(format: 'pdf' | 'csv' | 'txt', operationCount: number): void {
    this.logEvent('REPORT_EXPORTED', {
      format,
      operationCount,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Log de sincronização
   */
  logSync(status: 'start' | 'success' | 'failed', details?: any): void {
    this.logEvent(`SYNC_${status.toUpperCase()}`, {
      ...details,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Log de instalação do app
   */
  logInstall(platform: 'web' | 'android' | 'ios'): void {
    this.logEvent('APP_INSTALL', {
      platform,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
    });
  }
}

// Export singleton
export const logger = AgrometrixLogger.getInstance();
