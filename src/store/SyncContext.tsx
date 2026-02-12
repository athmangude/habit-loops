import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { syncQueue } from '../services/syncQueue';

type SyncStatus = 'idle' | 'syncing' | 'error';

interface SyncState {
  status: SyncStatus;
  error: string | null;
}

const SyncContext = createContext<SyncState>({ status: 'idle', error: null });

export function SyncProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<SyncStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    syncQueue.setListener((newStatus, errorMsg) => {
      setStatus(newStatus);
      setError(errorMsg || null);
    });
  }, []);

  return (
    <SyncContext.Provider value={{ status, error }}>
      {children}
    </SyncContext.Provider>
  );
}

export function useSyncStatus() {
  return useContext(SyncContext);
}
