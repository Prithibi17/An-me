/**
 * Exclusive Local Store & Database Microservice Client
 * Backed by Electron's native persistent storage on disk (anme_local_store.json)
 * and mirrored to local storage with zero-latency memory cache.
 */

declare global {
  interface Window {
    electronAPI?: {
      store?: {
        get: (key: string) => Promise<any>;
        set: (key: string, value: any) => Promise<boolean>;
        delete: (key: string) => Promise<boolean>;
        all: () => Promise<Record<string, any>>;
      };
    };
  }
}

class LocalStoreService {
  private memCache: Map<string, any> = new Map();
  private initialized = false;

  constructor() {
    // Populate from localStorage initially for instantaneous sync access
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith('anme_')) {
          try {
            const raw = localStorage.getItem(k);
            if (raw) this.memCache.set(k, JSON.parse(raw));
          } catch {
            this.memCache.set(k, localStorage.getItem(k));
          }
        }
      }
    } catch (e) {
      console.warn('[LocalStore] localStorage preload note:', e);
    }
  }

  /**
   * Initializes and hydrates from Electron's disk database on app boot.
   */
  async init(): Promise<void> {
    if (this.initialized) return;
    try {
      if (window.electronAPI?.store?.all) {
        const diskData = await window.electronAPI.store.all();
        if (diskData && typeof diskData === 'object') {
          for (const [key, val] of Object.entries(diskData)) {
            this.memCache.set(key, val);
            try {
              localStorage.setItem(key, typeof val === 'string' ? val : JSON.stringify(val));
            } catch {
              // quota or parse protection
            }
          }
          console.log('[LocalStore] Microservice hydrated keys from disk:', Object.keys(diskData));
        }
      }
    } catch (err) {
      console.error('[LocalStore] Disk hydration error:', err);
    } finally {
      this.initialized = true;
    }
  }

  /**
   * Synchronous get (memory first, then localStorage)
   */
  get<T = any>(key: string, fallback: T | null = null): T | null {
    if (this.memCache.has(key)) {
      return this.memCache.get(key) as T;
    }
    try {
      const raw = localStorage.getItem(key);
      if (raw !== null) {
        try {
          const parsed = JSON.parse(raw);
          this.memCache.set(key, parsed);
          return parsed as T;
        } catch {
          this.memCache.set(key, raw);
          return raw as unknown as T;
        }
      }
    } catch {
      // ignore
    }
    return fallback;
  }

  /**
   * Asynchronous set (writes to memory, localStorage, and Electron disk store)
   */
  async set(key: string, value: any): Promise<void> {
    this.memCache.set(key, value);
    try {
      localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
    } catch (e) {
      console.warn('[LocalStore] localStorage save warning:', e);
    }

    try {
      if (window.electronAPI?.store?.set) {
        await window.electronAPI.store.set(key, value);
      }
    } catch (err) {
      console.error('[LocalStore] Native disk write error:', err);
    }
  }

  /**
   * Delete key
   */
  async delete(key: string): Promise<void> {
    this.memCache.delete(key);
    try {
      localStorage.removeItem(key);
    } catch {
      // ignore
    }

    try {
      if (window.electronAPI?.store?.delete) {
        await window.electronAPI.store.delete(key);
      }
    } catch (err) {
      console.error('[LocalStore] Native disk delete error:', err);
    }
  }
}

export const localStore = new LocalStoreService();
