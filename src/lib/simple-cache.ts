// src/lib/simple-cache.ts
type CacheEntry<T> = {
  data: T;
  expiry: number;
};

class SimpleCache {
  private cache = new Map<string, CacheEntry<any>>();
  private defaultTTL = 5 * 60 * 1000; // 5 minutes

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const now = Date.now();
    if (now > entry.expiry) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  set<T>(key: string, data: T, ttlMs?: number): void {
    const ttl = ttlMs || this.defaultTTL;
    this.cache.set(key, {
      data,
      expiry: Date.now() + ttl,
    });

    // Auto-cleanup after TTL
    setTimeout(() => {
      this.cache.delete(key);
    }, ttl);
  }

  clear(): void {
    this.cache.clear();
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    
    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }
}

export const cache = new SimpleCache();

// Wrapper function for caching expensive operations
export async function withCache<T>(
  key: string,
  fn: () => Promise<T>,
  ttlMs?: number
): Promise<T> {
  const cached = cache.get<T>(key);
  if (cached !== null) {
    console.log(`Cache HIT: ${key}`);
    return cached;
  }

  console.log(`Cache MISS: ${key}`);
  const result = await fn();
  cache.set(key, result, ttlMs);
  return result;
}