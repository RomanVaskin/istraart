import test from 'node:test'
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
