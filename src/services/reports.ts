import { OperationLog } from '../types';
import { getAllOperations } from './storage';

/**
 * Gera CSV a partir de operações
 */
export function generateCSV(operations: OperationLog[]): string {
  if (operations.length === 0) return '';

  // Headers
  const headers = [
    'ID',
    'Data/Hora',
    'Local',
    'Latitude',
    'Longitude',
    'Temperatura',
    'Umidade',
    'Vento (km/h)',
    'Chuva (mm)',
    'Fungicida',
    'Herbicida',
    'Inseticida',
    'Adubo Foliar',
    'Precisão GPS',
    'Altitude',
    'Notas',
  ];

  // Dados
  const rows = operations.map((op) => [
    op.id,
    new Date(op.timestamp).toLocaleString('pt-BR'),
    op.location.name,
    op.location.lat.toFixed(6),
    op.location.lon.toFixed(6),
    op.weather.temp.toFixed(1),
    op.weather.humidity.toFixed(1),
    op.weather.windSpeed.toFixed(1),
    op.weather.precipitation.toFixed(2),
    op.appIndex.fungicide,
    op.appIndex.herbicide,
    op.appIndex.insecticide,
    op.appIndex.foliarFertilizer,
    op.gps.accuracy.toFixed(2),
    op.gps.altitude.toFixed(2),
    `"${op.notes?.replace(/"/g, '""') || ''}"`,
  ]);

  // Monta CSV
  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.join(',')),
  ].join('\n');

  return csvContent;
}

/**
 * Gera TXT formatado
 */
export function generateTXT(operations: OperationLog[]): string {
  if (operations.length === 0) return 'Nenhuma operação registrada.';

  let txt = '='.repeat(80) + '\n';
  txt += 'RELATÓRIO DE OPERAÇÕES AGRÍCOLAS - AGROMETRIX\n';
  txt += '='.repeat(80) + '\n\n';

  txt += `Gerado em: ${new Date().toLocaleString('pt-BR')}\n`;
  txt += `Total de operações: ${operations.length}\n`;
  txt += `Período: ${operations[0].timestamp} a ${operations[operations.length - 1].timestamp}\n`;
  txt += '\n' + '='.repeat(80) + '\n\n';

  operations.forEach((op, index) => {
    txt += `OPERAÇÃO #${index + 1}\n`;
    txt += '-'.repeat(80) + '\n';
    txt += `Data/Hora: ${new Date(op.timestamp).toLocaleString('pt-BR')}\n`;
    txt += `Localização: ${op.location.name}\n`;
    txt += `  Latitude: ${op.location.lat.toFixed(6)}\n`;
    txt += `  Longitude: ${op.location.lon.toFixed(6)}\n`;
    txt += `  Precisão: ${op.gps.accuracy.toFixed(2)}m\n`;
    txt += `  Altitude: ${op.gps.altitude.toFixed(2)}m\n\n`;

    txt += 'DADOS METEOROLÓGICOS:\n';
    txt += `  Temperatura: ${op.weather.temp.toFixed(1)}°C\n`;
    txt += `  Umidade: ${op.weather.humidity.toFixed(1)}%\n`;
    txt += `  Vento: ${op.weather.windSpeed.toFixed(1)} km/h\n`;
    txt += `  Rajada: ${op.weather.windGust.toFixed(1)} km/h\n`;
    txt += `  Chuva: ${op.weather.precipitation.toFixed(2)}mm\n`;
    txt += `  Pressão: ${op.weather.pressure.toFixed(0)} hPa\n`;
    txt += `  Cobertura de nuvens: ${op.weather.cloudCover.toFixed(0)}%\n\n`;

    txt += 'ÍNDICES DE APLICAÇÃO:\n';
    txt += `  Fungicida: ${op.appIndex.fungicide}/100 (${classifyIndex(op.appIndex.fungicide)})\n`;
    txt += `  Herbicida: ${op.appIndex.herbicide}/100 (${classifyIndex(op.appIndex.herbicide)})\n`;
    txt += `  Inseticida: ${op.appIndex.insecticide}/100 (${classifyIndex(op.appIndex.insecticide)})\n`;
    txt += `  Adubo Foliar: ${op.appIndex.foliarFertilizer}/100 (${classifyIndex(op.appIndex.foliarFertilizer)})\n`;

    if (op.notes) {
      txt += `\nNotas: ${op.notes}\n`;
    }

    txt += '\n' + '-'.repeat(80) + '\n\n';
  });

  txt += '='.repeat(80) + '\n';
  txt += 'Fim do Relatório\n';
  txt += '='.repeat(80) + '\n';

  return txt;
}

/**
 * Exporta relatório em CSV
 */
export async function exportAsCSV(filename?: string): Promise<void> {
  const operations = await getAllOperations();
  const csv = generateCSV(operations);

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  downloadFile(blob, filename || `agrometrix-relatorio-${new Date().toISOString().split('T')[0]}.csv`);
}

/**
 * Exporta relatório em TXT
 */
export async function exportAsTXT(filename?: string): Promise<void> {
  const operations = await getAllOperations();
  const txt = generateTXT(operations);

  const blob = new Blob([txt], { type: 'text/plain;charset=utf-8;' });
  downloadFile(blob, filename || `agrometrix-relatorio-${new Date().toISOString().split('T')[0]}.txt`);
}

/**
 * Utilitário para baixar arquivo
 */
function downloadFile(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Classifica índice (reusável)
 */
function classifyIndex(value: number): string {
  if (value >= 70) return 'Favorável';
  if (value >= 40) return 'Moderado';
  return 'Desfavorável';
}
