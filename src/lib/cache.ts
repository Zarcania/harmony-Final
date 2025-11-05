// Petit cache en mémoire avec TTL simple
// Usage:
//   const data = await cache.wrap('key', () => fetcher(), 5 * 60_000)

type Entry<T> = { value: T; expiresAt: number }

class MemoryCache {
  private store = new Map<string, Entry<unknown>>()

  get<T>(key: string): T | undefined {
    const e = this.store.get(key)
    if (!e) return undefined
    if (Date.now() > e.expiresAt) {
      this.store.delete(key)
      return undefined
    }
    return e.value as T
  }

  set<T>(key: string, value: T, ttlMs: number): void {
    this.store.set(key, { value, expiresAt: Date.now() + ttlMs })
  }

  del(prefixOrKey: string): void {
    if (!prefixOrKey.endsWith(':*')) {
      this.store.delete(prefixOrKey)
      return
    }
    const prefix = prefixOrKey.slice(0, -2)
    for (const k of this.store.keys()) {
      if (k.startsWith(prefix)) this.store.delete(k)
    }
  }

  clear(): void {
    this.store.clear()
  }

  async wrap<T>(key: string, fetcher: () => Promise<T>, ttlMs: number): Promise<T> {
    const hit = this.get<T>(key)
    if (hit !== undefined) return hit
    const v = await fetcher()
    this.set(key, v, ttlMs)
    return v
  }
}

export const cache = new MemoryCache()
