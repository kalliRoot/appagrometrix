import React, { useEffect, useState } from 'react';
import { useAppStore } from './stores/appStore';
import { getCurrentLocation, requestGPSPermission } from './services/geolocation';
import { logger } from './services/logger';
import { useServiceWorker } from './hooks/useServiceWorker';
import './App.css';

function App() {
  const { location, weather, isLoading, error, setLocation, fetchWeatherData, clearError } =
    useAppStore();

  const [showLocationSearch, setShowLocationSearch] = useState(!location);

  // Registra service worker
  useServiceWorker();

  useEffect(() => {
    const hasLogged = sessionStorage.getItem('install-logged');
    if (!hasLogged) {
      logger.logInstall('web');
      sessionStorage.setItem('install-logged', 'true');
    }
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      const hasPermission = await requestGPSPermission();
      if (!hasPermission) {
        logger.logEvent('GPS_PERMISSION_DENIED');
        return;
      }

      const currentLoc = await getCurrentLocation();
      if (currentLoc) {
        setLocation(currentLoc);
        logger.logGPS(currentLoc);
        await fetchWeatherData(currentLoc.lat, currentLoc.lon);
      }
    } catch (err) {
      logger.logError(err as Error, { context: 'initializeApp' });
    }
  };

  const handleLocationSelect = async (selectedLocation: any) => {
    setLocation(selectedLocation);
    setShowLocationSearch(false);
    await fetchWeatherData(selectedLocation.lat, selectedLocation.lon);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-3xl font-bold text-green-600">Agrometrix</h1>
          {location && (
            <div className="mt-3 flex justify-between">
              <p className="text-lg font-semibold">{location.name}</p>
              <button onClick={() => setShowLocationSearch(true)} className="px-3 py-1 bg-slate-200 rounded">
                Mudar
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex justify-between">
            <p className="text-red-800">{error}</p>
            <button onClick={clearError} className="text-red-600">✕</button>
          </div>
        )}

        {isLoading && <div className="text-center py-12">Carregando...</div>}

        {weather && location && !isLoading && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg">
              <h2 className="text-2xl font-bold mb-4">Clima Atual</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-slate-600">Temperatura</p>
                  <p className="text-2xl font-bold">{weather.temp.toFixed(1)}°C</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Umidade</p>
                  <p className="text-2xl font-bold">{weather.humidity.toFixed(1)}%</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Vento</p>
                  <p className="text-2xl font-bold">{weather.windSpeed.toFixed(1)} km/h</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Chuva</p>
                  <p className="text-2xl font-bold">{weather.precipitation.toFixed(1)} mm</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {!location && !showLocationSearch && (
          <div className="text-center py-12">
            <p className="mb-4 text-slate-600">Selecione uma localização para começar</p>
            <button
              onClick={initializeApp}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Usar Localização Atual
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

export default App
