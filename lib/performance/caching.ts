/**
 * Caching Strategy for Performance
 * Multi-level caching: memory cache → localStorage → server-side cache
 */

/**
 * Memory cache with TTL
 * Fast in-memory storage for client-side data
 */
export class MemoryCache<T = any> {
  private store = new Map<string, { value: T; expiresAt: number }>();
  private defaultTTL: number;

  constructor(defaultTTLMs: number = 5 * 60 * 1000) {
    this.defaultTTL = defaultTTLMs;
  }

  set(key: string, value: T, ttlMs?: number): void {
    const expiresAt = Date.now() + (ttlMs || this.defaultTTL);
    this.store.set(key, { value, expiresAt });
  }

  get(key: string): T | null {
    const item = this.store.get(key);
    if (!item) return null;

    if (Date.now() > item.expiresAt) {
      this.store.delete(key);
      return null;
    }

    return item.value;
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  delete(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }

  invalidatePattern(pattern: string): void {
    const keysToDelete: string[] = [];
    this.store.forEach((_, key) => {
      if (key.includes(pattern)) {
        keysToDelete.push(key);
      }
    });
    keysToDelete.forEach(key => this.store.delete(key));
  }

  size(): number {
    return this.store.size;
  }
}

/**
 * LocalStorage cache for persistent client-side caching
 * Survives page reloads
 */
export class LocalStorageCache<T = any> {
  private prefix: string;
  private defaultTTL: number;

  constructor(prefix: string = 'cache_', defaultTTLMs: number = 24 * 60 * 60 * 1000) {
    this.prefix = prefix;
    this.defaultTTL = defaultTTLMs;
  }

  set(key: string, value: T, ttlMs?: number): void {
    try {
      const expiresAt = Date.now() + (ttlMs || this.defaultTTL);
      const item = JSON.stringify({ value, expiresAt });
      localStorage.setItem(this.prefix + key, item);
    } catch (error) {
      console.warn('LocalStorage set failed:', error);
    }
  }

  get(key: string): T | null {
    try {
      const item = localStorage.getItem(this.prefix + key);
      if (!item) return null;

      const { value, expiresAt } = JSON.parse(item);

      if (Date.now() > expiresAt) {
        this.delete(key);
        return null;
      }

      return value as T;
    } catch (error) {
      console.warn('LocalStorage get failed:', error);
      return null;
    }
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  delete(key: string): void {
    try {
      localStorage.removeItem(this.prefix + key);
    } catch (error) {
      console.warn('LocalStorage delete failed:', error);
    }
  }

  clear(): void {
    try {
      const keys: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(this.prefix)) {
          keys.push(key);
        }
      }
      keys.forEach(key => localStorage.removeItem(key));
    } catch (error) {
      console.warn('LocalStorage clear failed:', error);
    }
  }
}

/**
 * Multilevel cache strategy
 * Combines memory and localStorage for optimal performance
 */
export class HybridCache<T = any> {
  private memory: MemoryCache<T>;
  private storage: LocalStorageCache<T>;
  private isClient: boolean;

  constructor(prefix: string = 'hybrid_', memoryTTL: number = 5 * 60 * 1000) {
    this.memory = new MemoryCache<T>(memoryTTL);
    this.storage = new LocalStorageCache<T>(prefix);
    this.isClient = typeof window !== 'undefined';
  }

  set(key: string, value: T, ttlMs?: number): void {
    this.memory.set(key, value, ttlMs);
    if (this.isClient) {
      this.storage.set(key, value, ttlMs);
    }
  }

  get(key: string): T | null {
    // Try memory first (faster)
    let value = this.memory.get(key);
    if (value !== null) return value;

    // Try localStorage
    if (this.isClient) {
      value = this.storage.get(key);
      if (value !== null) {
        // Restore to memory cache
        this.memory.set(key, value);
        return value;
      }
    }

    return null;
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  delete(key: string): void {
    this.memory.delete(key);
    if (this.isClient) {
      this.storage.delete(key);
    }
  }

  clear(): void {
    this.memory.clear();
    if (this.isClient) {
      this.storage.clear();
    }
  }

  invalidatePattern(pattern: string): void {
    this.memory.invalidatePattern(pattern);
    if (this.isClient) {
      this.storage.clear(); // Clear storage pattern matching
    }
  }
}

/**
 * Translation cache for bilingual content
 * Prevents repeated loading of same language data
 */
export class TranslationCache {
  private cache = new HybridCache<any>();

  getCourses(language: 'en' | 'km'): any | null {
    return this.cache.get(`courses_${language}`);
  }

  setCourses(language: 'en' | 'km', data: any): void {
    this.cache.set(`courses_${language}`, data, 30 * 60 * 1000); // 30 min
  }

  getInstitutions(language: 'en' | 'km'): any | null {
    return this.cache.get(`institutions_${language}`);
  }

  setInstitutions(language: 'en' | 'km', data: any): void {
    this.cache.set(`institutions_${language}`, data, 30 * 60 * 1000);
  }

  invalidateLanguage(language: 'en' | 'km'): void {
    this.cache.invalidatePattern(`_${language}`);
  }

  invalidateAll(): void {
    this.cache.clear();
  }
}

/**
 * User session cache
 * Cache user profile and permissions to avoid repeated queries
 */
export class SessionCache {
  private cache = new HybridCache<any>();

  getProfile(userId: string): any | null {
    return this.cache.get(`profile_${userId}`);
  }

  setProfile(userId: string, profile: any): void {
    this.cache.set(`profile_${userId}`, profile, 60 * 60 * 1000); // 1 hour
  }

  getPermissions(userId: string): string[] | null {
    return this.cache.get(`permissions_${userId}`);
  }

  setPermissions(userId: string, permissions: string[]): void {
    this.cache.set(`permissions_${userId}`, permissions, 60 * 60 * 1000);
  }

  clearUser(userId: string): void {
    this.cache.invalidatePattern(userId);
  }

  clearAll(): void {
    this.cache.clear();
  }
}

/**
 * API response cache with stale-while-revalidate pattern
 * Serve stale data while fetching fresh data in background
 */
export class APICache {
  private cache = new HybridCache<{ data: any; timestamp: number }>();
  private refreshCallbacks = new Map<string, () => Promise<any>>();

  async get<T>(
    key: string,
    fetcher: () => Promise<T>,
    maxAge: number = 5 * 60 * 1000
  ): Promise<T> {
    const cached = this.cache.get(key);

    if (cached) {
      const age = Date.now() - cached.timestamp;

      if (age < maxAge) {
        // Data is fresh
        return cached.data;
      }

      // Data is stale, revalidate in background
      this.revalidate(key, fetcher, maxAge).catch(console.error);
      return cached.data;
    }

    // No cached data, fetch immediately
    const data = await fetcher();
    this.cache.set(key, { data, timestamp: Date.now() }, maxAge * 2);
    return data;
  }

  private async revalidate<T>(
    key: string,
    fetcher: () => Promise<T>,
    maxAge: number
  ): Promise<void> {
    try {
      const data = await fetcher();
      this.cache.set(key, { data, timestamp: Date.now() }, maxAge * 2);
    } catch (error) {
      console.error(`Failed to revalidate cache key ${key}:`, error);
    }
  }

  invalidate(key: string): void {
    this.cache.delete(key);
  }

  invalidatePattern(pattern: string): void {
    this.cache.invalidatePattern(pattern);
  }

  clear(): void {
    this.cache.clear();
  }
}

// Export singleton instances
export const translationCache = new TranslationCache();
export const sessionCache = new SessionCache();
export const apiCache = new APICache();
