import { db, prepareSyncBackup, type ImportData, type SyncBackupDocument } from '@/core/database';
import { DB_VERSION } from '@/core/utils/constants';

export const createBackupDocument = async (): Promise<SyncBackupDocument> => {
  const data: ImportData = {
    accounts: await db.getAll('accounts'),
    categories: await db.getAll('categories'),
    costCenters: await db.getAll('costCenters'),
    transactions: await db.getAll('transactions'),
    creditCards: await db.getAll('creditCards'),
  };
  return {
    protocolVersion: 1,
    schemaVersion: DB_VERSION,
    createdAt: new Date().toISOString(),
    counts: {
      accounts: data.accounts.length,
      categories: data.categories.length,
      costCenters: data.costCenters.length,
      transactions: data.transactions.length,
      creditCards: data.creditCards.length,
    },
    data,
  };
};

export const serializeBackup = (backup: SyncBackupDocument): Uint8Array =>
  new TextEncoder().encode(JSON.stringify(backup));

export const deserializeBackup = (bytes: ArrayBuffer): SyncBackupDocument =>
  prepareSyncBackup(JSON.parse(new TextDecoder().decode(bytes)));

export const replaceWithBackup = async (backup: SyncBackupDocument): Promise<void> => {
  await db.replaceAllData(backup.data);
};
