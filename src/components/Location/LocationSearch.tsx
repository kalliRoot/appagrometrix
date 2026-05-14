import React, { useState } from 'react';
import { useAppStore } from '../../stores/appStore';

interface Props {
  onSelect: (location: any) => void;
  onClose: () => void;
}

export default function LocationSearch({ onSelect, onClose }: Props) {
  const [query, setQuery] = useState('');
  const { searchLocations } = useAppStore();
  const [results, setResults] = useState([]);

  const handleSearch = async (q: string) => {
    setQuery(q);
    if (q.length > 2) {
      const res = await searchLocations(q);
      setResults(res);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-800 p-6 rounded-lg w-96">
        <h2 className="text-xl font-bold mb-4">Buscar Localização</h2>
        <input
          type="text"
          placeholder="Digite a cidade..."
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          className="w-full px-3 py-2 border rounded-lg mb-4"
        />
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {results.map((loc: any) => (
            <button
              key={`${loc.lat}-${loc.lon}`}
              onClick={() => onSelect(loc)}
              className="w-full text-left px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"
            >
              {loc.name}
            </button>
          ))}
        </div>
        <button onClick={onClose} className="mt-4 w-full px-3 py-2 bg-slate-200 rounded">
          Fechar
        </button>
      </div>
    </div>
  );
}
