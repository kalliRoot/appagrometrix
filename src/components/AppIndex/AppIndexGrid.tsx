import { AppIndex } from '../../types';
import { classifyIndex, getIndexColor } from '../../lib/calculations';

interface Props {
  appIndex: AppIndex;
}

export default function AppIndexGrid({ appIndex }: Props) {
  const items = [
    { label: 'Fungicida', value: appIndex.fungicide },
    { label: 'Herbicida', value: appIndex.herbicide },
    { label: 'Inseticida', value: appIndex.insecticide },
    { label: 'Adubo Foliar', value: appIndex.foliarFertilizer },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {items.map((item) => (
        <div
          key={item.label}
          className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow"
          style={{ borderLeft: `4px solid ${getIndexColor(item.value)}` }}
        >
          <h3 className="text-lg font-semibold mb-2">{item.label}</h3>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-4xl font-bold">{item.value}</p>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {classifyIndex(item.value)}
              </p>
            </div>
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center">
              <span className="text-sm font-bold">{item.value}%</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
