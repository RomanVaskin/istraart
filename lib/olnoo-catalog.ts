// Server-only transport: imported exclusively by the server page and photo route.
import https from 'node:https'
import { Readable } from 'node:stream'
import { parseCatalogCards } from './catalog-data.ts'
export class CatalogUnavailable extends Error {}

// Catalog-only equivalent of curl --resolve; never changes global DNS/HTTPS agents.
const catalogFetch: typeof fetch = async (input, init) => {
  const url = new URL(String(input))
  if (url.origin !== 'https://admin.olnoo.com') return fetch(input, init)
  return new Promise<Response>((resolve, reject) => {
    const req = https.request(url, {
      method: 'GET',
      agent: false,
      servername: 'admin.olnoo.com',
      rejectUnauthorized: true,
      lookup: (_hostname, options, callback) => callback(null, options.all
        ? [{ address: '213.155.29.140', family: 4 }] : '213.155.29.140', 4),
      headers: { ...Object.fromEntries(new Headers(init?.headers)), host: url.host },
      signal: init?.signal ?? undefined,
    }, (res) => {
      const headers = new Headers()
      for (const [name, value] of Object.entries(res.headers)) {
        if (Array.isArray(value)) value.forEach((entry) => headers.append(name, entry))
        else if (value !== undefined) headers.set(name, value)
      }
      // Native HTTPS does not follow redirects, so credentials cannot leave this origin.
      const status = res.statusCode ?? 502
      if ([204, 205, 304].includes(status)) { res.resume(); resolve(new Response(null, { status, headers })); return }
      resolve(new Response(Readable.toWeb(res) as ReadableStream<Uint8Array>, { status, headers }))
    })
    req.once('error', reject)
    req.end()
  })
}

export async function catalogRequest(path: string, fetchImpl: typeof fetch = catalogFetch): Promise<Response> {
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
export async function loadCatalog(fetchImpl: typeof fetch = catalogFetch) {
  const res = await catalogRequest('', fetchImpl)
  try { return parseCatalogCards(JSON.parse(new TextDecoder().decode(await catalogBytes(res, 2_000_000)))) }
  catch { throw new CatalogUnavailable('Catalog response is invalid') }
}
