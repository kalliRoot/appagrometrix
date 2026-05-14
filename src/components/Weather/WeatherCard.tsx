import { WeatherData } from '../../types';

interface Props {
  weather: WeatherData;
  onRefresh: () => void;
}

export default function WeatherCard({ weather, onRefresh }: Props) {
  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow">
      <div className="flex justify-between items-start mb-4">
        <h2 className="text-2xl font-bold">Clima Atual</h2>
        <button onClick={onRefresh} className="px-3 py-1 bg-green-600 text-white rounded text-sm">
          Atualizar
        </button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <p className="text-sm text-slate-600 dark:text-slate-400">Temperatura</p>
          <p className="text-2xl font-bold">{weather.temp.toFixed(1)}°C</p>
        </div>
        <div>
          <p className="text-sm text-slate-600 dark:text-slate-400">Umidade</p>
          <p className="text-2xl font-bold">{weather.humidity.toFixed(1)}%</p>
        </div>
        <div>
          <p className="text-sm text-slate-600 dark:text-slate-400">Vento</p>
          <p className="text-2xl font-bold">{weather.windSpeed.toFixed(1)} km/h</p>
        </div>
        <div>
          <p className="text-sm text-slate-600 dark:text-slate-400">Chuva</p>
          <p className="text-2xl font-bold">{weather.precipitation.toFixed(1)} mm</p>
        </div>
      </div>
    </div>
  );
}
