import { localDb, SyncQueueItem } from './dexieDb';

export interface SyncEngineState {
  isOnline: boolean;
  isSyncing: boolean;
  pendingCount: number;
  lastSyncTime: Date | null;
  lastError: string | null;
}

type SyncListener = (state: SyncEngineState) => void;

class SyncEngine {
  private state: SyncEngineState = {
    isOnline: typeof window !== 'undefined' ? navigator.onLine : true,
    isSyncing: false,
    pendingCount: 0,
    lastSyncTime: null,
    lastError: null,
  };

  private listeners = new Set<SyncListener>();
  private initialized = false;
  private intervalId: NodeJS.Timeout | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.init();
    }
  }

  private init() {
    if (this.initialized) return;
    this.initialized = true;

    this.state.isOnline = navigator.onLine;

    window.addEventListener('online', () => {
      this.state.isOnline = true;
      this.notifyListeners();
      this.processSyncQueue();
    });

    window.addEventListener('offline', () => {
      this.state.isOnline = false;
      this.notifyListeners();
    });

    // Check pending count immediately
    this.updatePendingCount();

    // Periodic check for unsynced changes (every 30 seconds)
    this.intervalId = setInterval(() => {
      if (this.state.isOnline && !this.state.isSyncing) {
        this.processSyncQueue();
      }
    }, 30000);
  }

  public subscribe(listener: SyncListener): () => void {
    this.listeners.add(listener);
    listener({ ...this.state });
    return () => {
      this.listeners.delete(listener);
    };
  }

  public getState(): SyncEngineState {
    return { ...this.state };
  }

  private notifyListeners() {
    const currentState = { ...this.state };
    this.listeners.forEach((listener) => {
      try {
        listener(currentState);
      } catch (e) {
        console.error('[SyncEngine] Listener error:', e);
      }
    });
  }

  public async updatePendingCount(): Promise<number> {
    try {
      const count = await localDb.syncQueue
        .where('status')
        .anyOf(['PENDING', 'FAILED'])
        .count();
      this.state.pendingCount = count;
      this.notifyListeners();
      return count;
    } catch {
      return 0;
    }
  }

  /**
   * Enqueue a mutation into IndexedDB syncQueue for background replay
   */
  public async enqueueMutation(params: {
    endpoint: string;
    method: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    payload: any;
    entityType: string;
    entityId?: string;
  }): Promise<SyncQueueItem> {
    const item: SyncQueueItem = {
      clientMutationId: `mut-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      endpoint: params.endpoint,
      method: params.method,
      payload: params.payload,
      entityType: params.entityType,
      entityId: params.entityId,
      status: 'PENDING',
      retryCount: 0,
      createdAt: new Date().toISOString(),
    };

    const id = await localDb.syncQueue.add(item);
    item.id = id;

    await this.updatePendingCount();

    // If online, process right away in background
    if (this.state.isOnline) {
      this.processSyncQueue();
    }

    return item;
  }

  /**
   * Execute or Queue a Mutation:
   * 1. If online, attempts direct API call.
   * 2. If online fetch fails (or device is offline), safely queues to IndexedDB.
   */
  public async executeOrQueueMutation<T = any>(params: {
    endpoint: string;
    method: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    payload: any;
    entityType: string;
    entityId?: string;
  }): Promise<{ success: boolean; queued: boolean; data?: T; message?: string }> {
    if (this.state.isOnline) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);

        const res = await fetch(params.endpoint, {
          method: params.method,
          headers: {
            'Content-Type': 'application/json',
          },
          body: params.payload ? JSON.stringify(params.payload) : undefined,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (res.ok) {
          const data = await res.json().catch(() => null);
          return { success: true, queued: false, data };
        }

        // If server returns an error other than network failure (e.g. validation 400), don't queue if fatal
        if (res.status >= 400 && res.status < 500 && res.status !== 408) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || `Server responded with ${res.status}`);
        }
      } catch (err: any) {
        console.warn(`[SyncEngine] Direct network mutation failed for ${params.endpoint}, queueing offline:`, err.message);
      }
    }

    // Fallback: Queue offline into IndexedDB
    await this.enqueueMutation(params);
    return {
      success: true,
      queued: true,
      message: 'Offline mode active: record saved locally and queued for server synchronization.',
    };
  }

  /**
   * Process all pending mutations in sequential FIFO order
   */
  public async processSyncQueue(): Promise<{ processed: number; succeeded: number; failed: number }> {
    if (this.state.isSyncing) {
      return { processed: 0, succeeded: 0, failed: 0 };
    }

    this.state.isSyncing = true;
    this.state.lastError = null;
    this.notifyListeners();

    let processed = 0;
    let succeeded = 0;
    let failed = 0;

    try {
      const pendingItems = await localDb.syncQueue
        .where('status')
        .anyOf(['PENDING', 'FAILED'])
        .sortBy('id');

      for (const item of pendingItems) {
        if (!navigator.onLine) {
          this.state.isOnline = false;
          break;
        }

        processed++;

        // Mark as SYNCING
        await localDb.syncQueue.update(item.id!, { status: 'SYNCING' });

        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 10000);

          const res = await fetch(item.endpoint, {
            method: item.method,
            headers: {
              'Content-Type': 'application/json',
            },
            body: item.payload ? JSON.stringify(item.payload) : undefined,
            signal: controller.signal,
          });

          clearTimeout(timeoutId);

          if (res.ok) {
            // Remove successfully synced item from queue
            await localDb.syncQueue.delete(item.id!);
            succeeded++;
          } else {
            const errJson = await res.json().catch(() => ({}));
            const errMsg = errJson.error || `HTTP ${res.status}`;
            const retryCount = (item.retryCount || 0) + 1;
            const newStatus = retryCount > 5 ? 'FAILED' : 'PENDING';

            await localDb.syncQueue.update(item.id!, {
              status: newStatus,
              retryCount,
              lastError: errMsg,
            });
            failed++;
          }
        } catch (netErr: any) {
          const retryCount = (item.retryCount || 0) + 1;
          await localDb.syncQueue.update(item.id!, {
            status: 'PENDING',
            retryCount,
            lastError: netErr.message || 'Network error',
          });
          failed++;
          // Network dropped mid-replay
          break;
        }
      }

      this.state.lastSyncTime = new Date();
    } catch (e: any) {
      this.state.lastError = e.message || 'Sync error';
    } finally {
      this.state.isSyncing = false;
      await this.updatePendingCount();
    }

    return { processed, succeeded, failed };
  }

  /**
   * Pull all authoritative records from PostgreSQL backend and hydrate Dexie IndexedDB
   */
  public async pullAllEntities(): Promise<{ success: boolean }> {
    if (!navigator.onLine) return { success: false };

    try {
      const endpoints: { key: keyof typeof localDb; url: string; dataKey: string }[] = [
        { key: 'users', url: '/api/users', dataKey: 'users' },
        { key: 'students', url: '/api/students', dataKey: 'students' },
        { key: 'teachers', url: '/api/teachers', dataKey: 'teachers' },
        { key: 'parents', url: '/api/parents', dataKey: 'parents' },
        { key: 'classes', url: '/api/classes', dataKey: 'classes' },
        { key: 'programmes', url: '/api/programmes', dataKey: 'programmes' },
        { key: 'subjects', url: '/api/subjects', dataKey: 'subjects' },
        { key: 'attendance', url: '/api/attendance', dataKey: 'data' },
        { key: 'tahfizRecords', url: '/api/tahfiz', dataKey: 'data' },
        { key: 'announcements', url: '/api/announcements', dataKey: 'announcements' },
        { key: 'sessions', url: '/api/sessions', dataKey: 'sessions' },
        { key: 'timetablePeriods', url: '/api/timetable', dataKey: 'timetablePeriods' },
        { key: 'directMessages', url: '/api/messages', dataKey: 'data' },
        { key: 'grades', url: '/api/results', dataKey: 'grades' },
      ];

      await Promise.allSettled(
        endpoints.map(async ({ key, url, dataKey }) => {
          try {
            const res = await fetch(url);
            if (!res.ok) return;
            const json = await res.json();
            const items = json[dataKey] || json.data || (Array.isArray(json) ? json : null);
            if (Array.isArray(items) && items.length > 0) {
              const table = localDb[key] as any;
              if (table && typeof table.bulkPut === 'function') {
                await table.bulkPut(items);
              }
            }
          } catch {
            // Ignore individual entity pull failures when network is flaky
          }
        })
      );

      this.state.lastSyncTime = new Date();
      this.notifyListeners();
      return { success: true };
    } catch {
      return { success: false };
    }
  }
}

export const syncEngine = new SyncEngine();
