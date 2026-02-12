import { useSyncStatus } from '../../store/SyncContext';

export function SyncIndicator() {
  const { status, error } = useSyncStatus();

  if (status === 'idle') return null;

  return (
    <div className="flex items-center gap-1.5">
      {status === 'syncing' && (
        <>
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
          <span className="text-xs text-blue-600">Syncing...</span>
        </>
      )}
      {status === 'error' && (
        <>
          <div className="w-2 h-2 bg-red-500 rounded-full" />
          <span className="text-xs text-red-600" title={error || undefined}>Sync error</span>
        </>
      )}
    </div>
  );
}
