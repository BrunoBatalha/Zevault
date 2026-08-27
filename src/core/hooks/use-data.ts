/**
 * Hook para buscar dados reativos do IndexedDB
 */

import { useEffect, useState } from 'react';
import { db } from '@/core/database';
import type { StoreName } from '@/core/database/types';

/**
 * Hook customizado que retorna dados de um store do IndexedDB
 * e automaticamente se re-renderiza quando os dados mudam
 * 
 * @param storeName - Nome do store do IndexedDB
 * @returns Array com os dados do store
 * 
 * @example
 * const accounts = useData('accounts');
 * const transactions = useData('transactions');
 */
export const useData = <T = unknown>(storeName: StoreName): T[] => {
  const [data, setData] = useState<T[]>([]);

  useEffect(() => {
    let mounted = true;

    const fetchData = async () => {
      const result = await db.getAll<T>(storeName);
      if (mounted) setData(result);
    };

    // Buscar dados inicialmente
    fetchData();

    // Subscrever a mudanças no banco de dados
    const unsubscribe = db.subscribe(fetchData);

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [storeName]);

  return data;
};
