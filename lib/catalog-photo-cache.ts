import { createHash } from 'node:crypto'
type Photo = { bytes: Uint8Array; mime: string }
/** Bounded process cache, never an authorization cache or a new media store. */
export function createCatalogPhotoCache(maxBytes = 32 * 1024 * 1024, ttlMs = 5 * 60_000, now = Date.now) {
  const entries = new Map<string, Photo & { etag: string; expires: number }>()
  const pending = new Map<string, Promise<Photo & { etag: string }>>()
  let size = 0
  function remove(key: string) { const value = entries.get(key); if (value) size -= value.bytes.length; entries.delete(key) }
  return async (key: string, load: () => Promise<Photo>) => {
    for (const [name, value] of entries) if (value.expires <= now()) remove(name)
    const hit = entries.get(key)
    if (hit) { entries.delete(key); entries.set(key, hit); return hit }
    const waiting = pending.get(key)
    if (waiting) return waiting
    const request = (async () => {
      const photo = await load()
      const etag = `"${createHash('sha256').update(key).update(photo.mime).update(photo.bytes).digest('hex')}"`
      if (photo.bytes.length <= maxBytes) {
        while (entries.size >= 32 || size + photo.bytes.length > maxBytes) remove(entries.keys().next().value!)
        remove(key)
        entries.set(key, { ...photo, etag, expires: now() + ttlMs }); size += photo.bytes.length
      }
      return { ...photo, etag }
    })()
    if (pending.size < 32) pending.set(key, request)
    try { return await request } finally { if (pending.get(key) === request) pending.delete(key) }
  }
}
