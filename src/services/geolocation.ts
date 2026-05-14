import { Geolocation } from '@capacitor/geolocation';
import { GeoLocation } from '../types';
import { reverseGeocode } from './api';

/**
 * Detecta se está em Capacitor (app nativo) ou navegador
 */
function isCapacitorApp(): boolean {
  return (
    typeof window !== 'undefined' &&
    (window as any).Capacitor !== undefined &&
    (window as any).Capacitor.isPluginAvailable('Geolocation')
  );
}

/**
 * Solicita permissão de GPS
 */
export async function requestGPSPermission(): Promise<boolean> {
  try {
    if (isCapacitorApp()) {
      const permission = await Geolocation.requestPermissions();
      return permission.location === 'granted' || permission.location === 'prompt';
    }

    // Navegador
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        () => resolve(true),
        () => resolve(false)
      );
    });
  } catch {
    return false;
  }
}

/**
 * Obtém posição atual do GPS
 */
export async function getCurrentLocation(): Promise<GeoLocation | null> {
  try {
    if (isCapacitorApp()) {
      // Usar Capacitor em apps nativos
      const coordinates = await Geolocation.getCurrentPosition();
      const { latitude, longitude, accuracy } = coordinates.coords;

      const name = await reverseGeocode(latitude, longitude);

      return {
        lat: latitude,
        lon: longitude,
        name,
        accuracy,
        altitude: coordinates.coords.altitude || undefined,
        heading: coordinates.coords.heading || undefined,
        timestamp: coordinates.timestamp,
      };
    }

    // Usar Geolocation API em navegadores
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude, accuracy } = position.coords;
          const name = await reverseGeocode(latitude, longitude);

          resolve({
            lat: latitude,
            lon: longitude,
            name,
            accuracy,
            altitude: position.coords.altitude || undefined,
            heading: position.coords.heading || undefined,
            timestamp: position.timestamp,
          });
        },
        (error) => {
          reject(new Error(`GPS error: ${error.message}`));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    });
  } catch (error) {
    console.error('Failed to get location:', error);
    return null;
  }
}

/**
 * Monitora mudanças de posição (para operações contínuas)
 */
export function watchLocation(
  callback: (location: GeoLocation) => void,
  onError?: (error: Error) => void
): () => void {
  let watchId: number | null = null;

  const startWatch = async () => {
    try {
      if (isCapacitorApp()) {
        watchId = await Geolocation.watchPosition(
          {
            enableHighAccuracy: true,
            timeout: 10000,
          },
          async (position) => {
            if (position) {
              const { latitude, longitude, accuracy } = position.coords;
              const name = await reverseGeocode(latitude, longitude);

              callback({
                lat: latitude,
                lon: longitude,
                name,
                accuracy,
                altitude: position.coords.altitude || undefined,
                heading: position.coords.heading || undefined,
                timestamp: position.timestamp,
              });
            }
          }
        );
      } else {
        watchId = navigator.geolocation.watchPosition(
          async (position) => {
            const { latitude, longitude, accuracy } = position.coords;
            const name = await reverseGeocode(latitude, longitude);

            callback({
              lat: latitude,
              lon: longitude,
              name,
              accuracy,
              altitude: position.coords.altitude || undefined,
              heading: position.coords.heading || undefined,
              timestamp: position.timestamp,
            });
          },
          (error) => {
            if (onError) onError(new Error(`GPS watch error: ${error.message}`));
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 5000,
          }
        );
      }
    } catch (error) {
      if (onError) onError(error instanceof Error ? error : new Error('Watch failed'));
    }
  };

  startWatch();

  // Retorna função para parar o watch
  return () => {
    if (watchId !== null) {
      if (isCapacitorApp()) {
        Geolocation.clearWatch({ id: watchId });
      } else {
        navigator.geolocation.clearWatch(watchId);
      }
    }
  };
}
