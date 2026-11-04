// Server-only transport: imported exclusively by the server page and photo route.
import { parseCatalogCards } from './catalog-data.ts'
export class CatalogUnavailable extends Error {}
export async function catalogRequest(path: string, fetchImpl: typeof fetch = fetch): Promise<Response> {
  const base = new URL(process.env.OLNOO_CATALOG_URL || 'https://admin.olnoo.com')
  const token = process.env.OLNOO_CATALOG_TOKEN
  const basic = process.env.OLNOO_CATALOG_BASIC_AUTH
  if (base.protocol !== 'https:' || base.username || base.password || !token || token.length < 32 || !basic || !basic.includes(':')) throw new CatalogUnavailable('Catalog connection is not configured')
  try {
    const res = await fetchImpl(new URL(`/api/catalog/export${path}`, base), { cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(10000), headers: { Authorization: `Basic ${Buffer.from(basic).toString('base64')}`, 'X-Olnoo-Catalog-Token': token } })
    if (!res.ok || res.headers.get('x-olnoo-catalog-project') !== 'istraart') throw new Error('upstream failure')
    return res
  } catch { throw new CatalogUnavailable('Catalog is temporarily unavailable') }
}
export async function catalogBytes(res: Response, limit: number): Promise<Uint8Array> {
  if (!res.body) throw new CatalogUnavailable('Empty catalog response')
  const reader = res.body.getReader(); const chunks: Uint8Array[] = []; let size = 0
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      size += value.length
      if (size > limit) throw new CatalogUnavailable('Catalog response too large')
      chunks.push(value)
    }
  } finally { await reader.cancel().catch(() => {}) }
  return new Uint8Array(Buffer.concat(chunks))
}
export async function loadCatalog(fetchImpl: typeof fetch = fetch) {
  const res = await catalogRequest('', fetchImpl)
  try { return parseCatalogCards(JSON.parse(new TextDecoder().decode(await catalogBytes(res, 2_000_000)))) }
  catch { throw new CatalogUnavailable('Catalog response is invalid') }
}
