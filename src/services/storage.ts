import Dexie, { Table } from 'dexie';
import { OperationLog, Report } from '../types';

/**
 * Database schema com Dexie
 */
export class AgrometrixDB extends Dexie {
  operations!: Table<OperationLog>;
  reports!: Table<Report>;
  cacheData!: Table<any>;

  constructor() {
    super('AgrometrixDB');
    this.version(1).stores({
      // Operações/logs de aplicação
      operations: '++id, timestamp, location.lat, location.lon',
      // Relatórios exportados
      reports: '++id, generatedAt',
      // Cache de dados de API
      cacheData: 'key, timestamp',
    });
  }
}

export const db = new AgrometrixDB();

/**
 * Salva operação localmente
 */
export async function saveOperation(operation: Omit<OperationLog, 'id'>): Promise<string> {
  const id = await db.operations.add({
    ...operation,
    id: crypto.randomUUID(),
  } as OperationLog);

  return id.toString();
}

/**
 * Recupera todas as operações
 */
export async function getAllOperations(): Promise<OperationLog[]> {
  return db.operations.toArray();
}

/**
 * Recupera operações de um período
 */
export async function getOperationsByDateRange(
  startDate: Date,
  endDate: Date
): Promise<OperationLog[]> {
  const startISO = startDate.toISOString();
  const endISO = endDate.toISOString();

  return db.operations
    .where('timestamp')
    .between(startISO, endISO, true, true)
    .toArray();
}

/**
 * Recupera operações por localização (GPS)
 */
export async function getOperationsByLocation(
  lat: number,
  lon: number,
  radiusKm: number = 5
): Promise<OperationLog[]> {
  const ops = await db.operations.toArray();

  return ops.filter((op) => {
    const distance = calculateDistance(lat, lon, op.location.lat, op.location.lon);
    return distance <= radiusKm;
  });
}

/**
 * Deleta operação
 */
export async function deleteOperation(id: string): Promise<void> {
  await db.operations.delete(id);
}

/**
 * Salva relatório
 */
export async function saveReport(report: Omit<Report, 'id'>): Promise<string> {
  const id = await db.reports.add({
    ...report,
    id: crypto.randomUUID(),
  } as Report);

  return id.toString();
}

/**
 * Recupera relatórios
 */
export async function getReports(): Promise<Report[]> {
  return db.reports.toArray();
}

/**
 * Cache de dados de API com TTL
 */
export async function getCachedData(key: string): Promise<any | null> {
  const cached = await db.cacheData.where('key').equals(key).first();

  if (!cached) return null;

  // Verifica se expirou
  const now = Date.now();
  if (now - cached.timestamp > cached.ttl) {
    await db.cacheData.delete(key);
    return null;
  }

  return cached.data;
}

/**
 * Salva dados em cache
 */
export async function setCachedData(
  key: string,
  data: any,
  ttlMs: number = 3600000 // 1 hora padrão
): Promise<void> {
  await db.cacheData.put({
    key,
    data,
    timestamp: Date.now(),
    ttl: ttlMs,
  });
}

/**
 * Limpa cache expirado
 */
export async function cleanExpiredCache(): Promise<number> {
  const allCache = await db.cacheData.toArray();
  const now = Date.now();
  let deleted = 0;

  for (const item of allCache) {
    if (now - item.timestamp > item.ttl) {
      await db.cacheData.delete(item.key);
      deleted++;
    }
  }

  return deleted;
}

/**
 * Limpa todo o banco de dados (deve ser usado com cuidado)
 */
export async function clearDatabase(): Promise<void> {
  await db.delete();
}

/**
 * Exporta todos os dados como JSON
 */
export async function exportDataAsJSON() {
  const operations = await db.operations.toArray();
  const reports = await db.reports.toArray();

  return {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    data: {
      operations,
      reports,
    },
  };
}

/**
 * Importa dados de JSON
 */
export async function importDataFromJSON(jsonData: any): Promise<boolean> {
  try {
    if (!jsonData.data || !jsonData.data.operations) {
      throw new Error('Invalid JSON format');
    }

    // Limpa dados existentes
    await db.operations.clear();
    await db.reports.clear();

    // Importa operações
    if (jsonData.data.operations && jsonData.data.operations.length > 0) {
      await db.operations.bulkAdd(jsonData.data.operations);
    }

    // Importa relatórios
    if (jsonData.data.reports && jsonData.data.reports.length > 0) {
      await db.reports.bulkAdd(jsonData.data.reports);
    }

    return true;
  } catch (error) {
    console.error('Import failed:', error);
    return false;
  }
}

/**
 * Calcula distância entre dois pontos GPS (Haversine formula)
 */
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Raio da Terra em km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Auto-limpeza de cache a cada 1 hora
setInterval(() => {
  cleanExpiredCache().catch(console.error);
}, 3600000);
