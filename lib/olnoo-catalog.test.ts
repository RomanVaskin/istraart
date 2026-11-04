import test from 'node:test'
import https from 'node:https'
import type { IncomingMessage } from 'node:http'
import { once } from 'node:events'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { execFileSync } from 'node:child_process'
import assert from 'node:assert/strict'
import { parseCatalogCards, photoUrl } from './catalog-data.ts'
import { catalogRequest, loadCatalog, catalogBytes } from './olnoo-catalog.ts'
const card = { id: 'e62bad4e-0514-442c-a4df-3d2cf83f8844', slug: 'wood-1', title: 'Находка', description: 'Описание', lengthCm: 30, diameterCm: null, updatedAt: '2026-11-04', offers: { raw: { title: 'Материал', description: 'Заготовка', priceRub: 1500, available: true, imageIndexes: [0] }, guide: { title: 'Гайд', description: 'По запросу после покупки', priceRub: 500, available: false, imageIndexes: [2] } } }
test('one find retains independent offers, prices, availability and photo references without a PDF', () => {
  const parsed = parseCatalogCards({ project: 'istraart', cards: [{ ...card, secret: 'hidden', content_item_id: 'hidden', pdf: 'hidden.pdf' }, card] })
  assert.equal(parsed.length, 1)
  assert.equal(parsed[0].offers.guide?.priceRub, 500)
  assert.equal(parsed[0].offers.guide?.available, false)
  assert.equal(parsed[0].offers.finished, undefined)
  assert.equal(JSON.stringify(parsed).includes('hidden'), false)
  assert.ok(photoUrl(parsed[0], 2).startsWith(`/api/catalog/photos/${card.id}/2?`))
})
test('empty catalog stays empty and malformed/unfilled offers are not turned into demo products', () => {
  assert.deepEqual(parseCatalogCards({ project: 'istraart', cards: [] }), [])
  assert.throws(() => parseCatalogCards({ project: 'other', cards: [card] }))
  assert.throws(() => parseCatalogCards({ project: 'istraart', cards: [{ ...card, offers: {} }] }))
  assert.throws(() => parseCatalogCards({ project: 'istraart', cards: [{ ...card, offers: { raw: { ...card.offers.raw, priceRub: 0 } } }] }))
  assert.throws(() => parseCatalogCards({ project: 'istraart', cards: [{ ...card, offers: { raw: { ...card.offers.raw, imageIndexes: [] } } }] }))
})
test('server transport authenticates both layers, disables caching/redirects, and never serializes credentials', async () => {
  const previous = { token: process.env.OLNOO_CATALOG_TOKEN, basic: process.env.OLNOO_CATALOG_BASIC_AUTH, url: process.env.OLNOO_CATALOG_URL }
  process.env.OLNOO_CATALOG_TOKEN = 'x'.repeat(40); process.env.OLNOO_CATALOG_BASIC_AUTH = 'reader:test-password'; process.env.OLNOO_CATALOG_URL = 'https://admin.example'
  try {
    const result = await loadCatalog(async (input, init) => {
      assert.equal(String(input), 'https://admin.example/api/catalog/export')
      assert.equal(init?.cache, 'no-store'); assert.equal(init?.redirect, 'error')
      const headers = new Headers(init?.headers)
      assert.equal(headers.get('x-olnoo-catalog-token'), 'x'.repeat(40))
      assert.equal(headers.get('authorization'), `Basic ${Buffer.from('reader:test-password').toString('base64')}`)
      return Response.json({ project: 'istraart', cards: [card] }, { headers: { 'X-Olnoo-Catalog-Project': 'istraart' } })
    })
    assert.equal(JSON.stringify(result).includes('test-password'), false)
    await assert.rejects(() => catalogRequest('', async () => new Response('internal details', { status: 401 })), /temporarily unavailable/)
    await assert.rejects(() => catalogRequest('', async () => new Response('', { status: 403 })), /temporarily unavailable/)
    await assert.rejects(() => catalogBytes(new Response('12345'), 4), /too large/)
    await assert.rejects(() => catalogRequest('', async () => new Response('other project', { headers: { 'X-Olnoo-Catalog-Project': 'other' } })), /temporarily unavailable/)
    delete process.env.OLNOO_CATALOG_TOKEN
    await assert.rejects(() => catalogRequest('', async () => { throw new Error('must not fetch') }), /not configured/)
  } finally {
    for (const [key, value] of Object.entries({ OLNOO_CATALOG_TOKEN: previous.token, OLNOO_CATALOG_BASIC_AUTH: previous.basic, OLNOO_CATALOG_URL: previous.url })) { if (value === undefined) delete process.env[key]; else process.env[key] = value }
  }
})

// Local TLS integration: keep the actual HTTPS implementation and certificate
// checks, replacing only the final socket destination with an ephemeral server.
// Keys/certificates are generated test fixtures, never production credentials.
test('fixed catalog address preserves real TLS/SNI/Host, credentials, project checks and photo bytes', async (t) => {
  const dir = mkdtempSync(join(tmpdir(), 'istraart-catalog-tls-'))
  t.after(() => rmSync(dir, { recursive: true, force: true }))
  function certificate(host: string) {
    const key = join(dir, `${host}.key`), cert = join(dir, `${host}.crt`)
    execFileSync('openssl', ['req', '-x509', '-newkey', 'rsa:2048', '-nodes', '-keyout', key, '-out', cert, '-days', '1', '-subj', `/CN=${host}`, '-addext', `subjectAltName=DNS:${host}`], { stdio: 'ignore' })
    return { key: readFileSync(key), cert: readFileSync(cert) }
  }
  const valid = certificate('admin.olnoo.com'), wrongHost = certificate('other.example')
  const previous = Object.fromEntries(['OLNOO_CATALOG_URL', 'OLNOO_CATALOG_TOKEN', 'OLNOO_CATALOG_BASIC_AUTH'].map((name) => [name, process.env[name]]))
  process.env.OLNOO_CATALOG_URL = 'https://admin.olnoo.com'
  process.env.OLNOO_CATALOG_TOKEN = 'test-project-token-'.repeat(3)
  process.env.OLNOO_CATALOG_BASIC_AUTH = 'test-reader:test-password'
  t.after(() => {
    for (const key of ['OLNOO_CATALOG_URL', 'OLNOO_CATALOG_TOKEN', 'OLNOO_CATALOG_BASIC_AUTH']) {
      if (previous[key] === undefined) delete process.env[key]; else process.env[key] = previous[key]
    }
  })
  for (const scenario of ['success', 'untrusted', 'wrong-host'] as const) await t.test(scenario, async (sub) => {
    const tls = scenario === 'wrong-host' ? wrongHost : valid
    let received = 0, status = 200, project = 'istraart', tlsError = ''
    const server = https.createServer(tls, (req, res) => {
      received++
      assert.equal(req.headers.host, 'admin.olnoo.com')
      assert.equal((req.socket as import('node:tls').TLSSocket & { servername?: string }).servername, 'admin.olnoo.com')
      assert.equal(req.headers.authorization, `Basic ${Buffer.from('test-reader:test-password').toString('base64')}`)
      assert.equal(req.headers['x-olnoo-catalog-token'], 'test-project-token-'.repeat(3))
      res.writeHead(status, { ...(status === 302 ? { Location: 'https://other.example/private' } : {}), 'X-Olnoo-Catalog-Project': project, 'Content-Type': req.url!.includes('/photos/') ? 'image/jpeg' : 'application/json' })
      res.end(req.url!.includes('/photos/') ? Buffer.from([0xff, 0xd8, 0xff, 0xd9]) : JSON.stringify({ project: 'istraart', cards: [card] }))
    })
    server.on('tlsClientError', () => {}) // Expected for rejected certificates.
    server.listen(0, '127.0.0.1')
    await once(server, 'listening')
    sub.after(() => new Promise<void>((resolve, reject) => server.close((err) => err ? reject(err) : resolve())))
    const port = (server.address() as import('node:net').AddressInfo).port
    const request = https.request
    const mock = sub.mock.method(https, 'request', (url: URL, options: https.RequestOptions, callback: (res: IncomingMessage) => void) => {
      assert.equal(url.origin, 'https://admin.olnoo.com')
      assert.equal(options.servername, 'admin.olnoo.com')
      assert.equal(options.rejectUnauthorized, true)
      assert.equal(options.agent, false)
      // Verify BOTH resolver signatures used by Node, then route the test socket locally.
      options.lookup!('admin.olnoo.com', { all: false }, (err, address, family) => {
        assert.equal(err, null); assert.equal(address, '213.155.29.140'); assert.equal(family, 4)
      })
      options.lookup!('admin.olnoo.com', { all: true }, (err, addresses) => {
        assert.equal(err, null); assert.deepEqual(addresses, [{ address: '213.155.29.140', family: 4 }])
      })
      const outgoing = request(url, { ...options, port, ...(scenario !== 'untrusted' ? { ca: tls.cert } : {}), lookup: (_host, opts, cb) => cb(null, opts.all ? [{ address: '127.0.0.1', family: 4 }] : '127.0.0.1', 4) }, callback)
      outgoing.on('error', (error: NodeJS.ErrnoException) => { tlsError = error.code ?? '' })
      return outgoing
    })
    if (scenario === 'success') {
      assert.equal((await loadCatalog())[0].id, card.id)
      const photo = await catalogRequest(`/${card.id}/photos/0`)
      assert.deepEqual(await catalogBytes(photo, 100), new Uint8Array([0xff, 0xd8, 0xff, 0xd9]))
      status = 302
      await assert.rejects(() => catalogRequest(''), /temporarily unavailable/)
      status = 200; project = 'other'
      await assert.rejects(() => catalogRequest(''), /temporarily unavailable/)
      assert.equal(received, 4)
    } else {
      await assert.rejects(() => catalogRequest(''), { message: 'Catalog is temporarily unavailable' })
      assert.equal(received, 0, 'TLS must fail before an authenticated HTTP request')
      assert.equal(tlsError, scenario === 'wrong-host' ? 'ERR_TLS_CERT_ALTNAME_INVALID' : 'DEPTH_ZERO_SELF_SIGNED_CERT')
    }
    mock.mock.restore()
  })
})

test('a different catalog origin retains normal fetch without pinning other domains', async (t) => {
  const names = ['OLNOO_CATALOG_URL', 'OLNOO_CATALOG_TOKEN', 'OLNOO_CATALOG_BASIC_AUTH']
  const previous = names.map((name) => process.env[name])
  t.after(() => names.forEach((name, index) => { if (previous[index] === undefined) delete process.env[name]; else process.env[name] = previous[index] }))
  process.env.OLNOO_CATALOG_URL = 'https://admin.example'
  process.env.OLNOO_CATALOG_TOKEN = 'test-token-'.repeat(4)
  process.env.OLNOO_CATALOG_BASIC_AUTH = 'reader:test-password'
  t.mock.method(https, 'request', () => { throw new Error('Other domains must not use pinned HTTPS') })
  const fetchMock = t.mock.method(globalThis, 'fetch', async (url: URL) => {
    assert.equal(url.origin, 'https://admin.example')
    return Response.json({ project: 'istraart', cards: [] }, { headers: { 'X-Olnoo-Catalog-Project': 'istraart' } })
  })
  assert.deepEqual(await loadCatalog(), [])
  assert.equal(fetchMock.mock.calls.length, 1)
})
