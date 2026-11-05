import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import ts from 'typescript'
import * as data from './catalog-data.ts'
import { catalogRequest, catalogBytes } from './olnoo-catalog.ts'

const raw = { id: '00000000-0000-4000-8000-000000000001', slug: 'material', title: 'Материал', description: 'Подтверждено владельцем', lengthCm: 30, diameterCm: null, updatedAt: '2026-11-04', offers: { raw: { title: 'Материал', description: 'Описание материала', priceRub: 1500, available: true, imageIndexes: [0] } } }
const product = { ...raw, id: '00000000-0000-4000-8000-000000000002', slug: 'lamp', title: 'Светильник', offers: { finished: { ...raw.offers.raw, title: 'Светильник', priceRub: 2500 } } }
const guide = { ...raw, id: '00000000-0000-4000-8000-000000000003', slug: 'lamp-guide', title: 'Гайд', offers: { guide: { ...raw.offers.raw, title: 'Гайд', priceRub: 500 } } }
const ref = (card: typeof raw | typeof product | typeof guide, type: data.OfferKind) => ({ id: card.id, slug: card.slug, title: card.title, type })
const snapshot = () => data.parseCatalogCards({ project: 'istraart', cards: [
  { ...raw, relatedCards: [ref(product, 'finished')] },
  { ...product, relatedCards: [ref(raw, 'raw'), ref(guide, 'guide')] },
  { ...guide, relatedCards: [ref(raw, 'raw'), ref(product, 'finished')] },
] })
const require = createRequire(import.meta.url)
// Real page/component/route code, isolated server boundary, no upstream writes or secrets.
function load(file: string, modules: Record<string, unknown>) {
  const compiled = ts.transpileModule(readFileSync(new URL(file, import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText
  const exports: Record<string, any> = {}
  new Function('require', 'exports', compiled)((name: string) => {
    if (name in modules) return modules[name]
    if (['react', 'react/jsx-runtime'].includes(name)) return require(name)
    throw new Error(`Unexpected test import ${name}`)
  }, exports)
  return exports
}
const components = () => ({
  '@/lib/catalog-data': data,
  '@/lib/products': { formatPrice: (n: number) => `${n} ₽` },
  '@/components/catalog-photo': { CatalogPhoto: ({ src, alt }: { src: string; alt: string }) => createElement('img', { src, alt }) },
  'next/link': { __esModule: true, default: ({ href, children }: { href: string; children: any }) => createElement('a', { href }, children) },
  'lucide-react': { MessageCircle: () => null, ArrowUpRight: () => null },
})

test('RU catalog contract resolves only published snapshot members and keeps legacy data', () => {
  const cards = snapshot()
  assert.deepEqual(cards[0].relatedCards, [ref(product, 'finished')])
  assert.deepEqual(cards[1].relatedCards, [ref(raw, 'raw'), ref(guide, 'guide')])
  assert.deepEqual(cards[2].relatedCards, [ref(raw, 'raw'), ref(product, 'finished')])
  assert.equal(data.cardHref(cards[1]), '/catalog/lamp')
  assert.equal(data.findCatalogCard(cards, 'lamp')?.id, product.id)
  for (const slug of ['private-draft', '../lamp', 'https://other.example', 'a'.repeat(101)]) assert.equal(data.findCatalogCard(cards, slug), null)
  const withoutGuide = data.parseCatalogCards({ project: 'istraart', cards: [{ ...product, relatedCards: [ref(guide, 'guide')] }] })
  assert.equal(withoutGuide[0].relatedCards, undefined)
  const forged = data.parseCatalogCards({ project: 'istraart', cards: [{ ...product, relatedCards: [ref(raw, 'raw'), { ...ref(raw, 'raw'), slug: 'other-project' }, ref(product, 'finished')] }, raw] })
  assert.deepEqual(forged[0].relatedCards, [ref(raw, 'raw')])
  assert.equal(data.parseCatalogCards({ project: 'istraart', cards: [{ ...product, relatedCards: [ref(raw, 'guide')] }, raw] })[0].relatedCards, undefined)
  assert.throws(() => data.parseCatalogCards({ project: 'istraart', cards: [{ ...product, relatedCards: [{ ...ref(raw, 'raw'), type: 'unknown' }] }, raw] }))
  assert.throws(() => data.parseCatalogCards({ project: 'foreign', cards: [raw] }))
  assert.throws(() => data.parseCatalogCards({ project: 'istraart', cards: [{ ...raw, relatedCards: [{ ...ref(product, 'finished'), slug: 'https://foreign.example' }] }] }))
  for (const offer of [{ ...raw.offers.raw, priceRub: 0 }, { ...raw.offers.raw, priceRub: 10_000_001 }, { ...raw.offers.raw, imageIndexes: [] }]) assert.throws(() => data.parseCatalogCards({ project: 'istraart', cards: [{ ...raw, offers: { raw: offer } }] }))
  assert.throws(() => data.parseCatalogCards({ project: 'istraart', cards: [raw, { ...product, slug: raw.slug }] }))
  const legacy = data.parseCatalogCards({ project: 'istraart', cards: [{ ...raw, offers: { raw: raw.offers.raw, guide: guide.offers.guide } }] })[0]
  assert.deepEqual(Object.keys(legacy.offers), ['raw', 'guide'])
})

test('catalog and product pages render separate URLs, confirmed prices and published related links', () => {
  const modules = components()
  const { Catalog } = load('../components/catalog.tsx', modules)
  const { CatalogProduct } = load('../components/catalog-product.tsx', modules)
  const cards = snapshot()
  const grid = renderToStaticMarkup(createElement(Catalog, { cards }))
  for (const card of cards) assert.ok(grid.includes(`href="${data.cardHref(card)}"`))
  for (const card of cards) {
    const html = renderToStaticMarkup(createElement(CatalogProduct, { card }))
    assert.match(html, /<h1/)
    for (const related of card.relatedCards ?? []) assert.ok(html.includes(`href="${data.cardHref(related)}"`))
    assert.ok(html.includes('href="https://t.me/istraarte?text='))
    assert.ok(html.includes(`/api/catalog/photos/${card.id}/0`))
    assert.equal(html.includes('admin.olnoo.com'), false)
    assert.equal(html.includes('.pdf'), false)
  }
  assert.ok(renderToStaticMarkup(createElement(CatalogProduct, { card: cards[2] })).includes('Обсудить заказ'))
  const unavailable = { ...cards[1], offers: { finished: { ...cards[1].offers.finished!, available: false } } }
  const html = renderToStaticMarkup(createElement(CatalogProduct, { card: unavailable }))
  assert.ok(html.includes('Сейчас недоступно'))
  assert.equal(html.includes('Обсудить заказ'), false)
})

test('slug page does not serve unexported products; upstream errors are not disguised as missing products', async () => {
  let calls = 0, fail = false, visible = snapshot()
  const { CatalogProduct } = load('../components/catalog-product.tsx', components())
  const modules = {
    '@/lib/catalog-data': data,
    '@/lib/olnoo-catalog': { loadCatalog: async () => { calls++; if (fail) throw new Error('upstream unavailable'); return visible } },
    '@/components/catalog-product': { CatalogProduct },
    '@/components/site-header': { SiteHeader: () => null },
    '@/components/site-footer': { SiteFooter: () => null },
    'next/navigation': { notFound: () => { throw new Error('NOT_FOUND') } },
  }
  const page = load('../app/catalog/[slug]/page.tsx', modules)
  const params = (slug: string) => ({ params: Promise.resolve({ slug }) })
  assert.ok(renderToStaticMarkup(await page.default(params('lamp'))).includes('Светильник'))
  const metadata = await page.generateMetadata(params('lamp'))
  assert.equal(metadata.alternates.canonical, 'https://istraart.ru/catalog/lamp')
  await assert.rejects(() => page.default(params('private-draft')), /NOT_FOUND/)
  visible = visible.filter((card) => card.id !== product.id)
  await assert.rejects(() => page.default(params('lamp')), /NOT_FOUND/)
  const beforeInvalid = calls
  await assert.rejects(() => page.default(params('../lamp')), /NOT_FOUND/)
  assert.equal(calls, beforeInvalid)
  fail = true
  await assert.rejects(() => page.default(params('lamp')), /upstream unavailable/)
})

test('photo route preserves protected requests and rejects unpublished, foreign, absent and invalid media', async () => {
  const previous = [process.env.OLNOO_CATALOG_TOKEN, process.env.OLNOO_CATALOG_BASIC_AUTH]
  process.env.OLNOO_CATALOG_TOKEN = 'test-site-token-'.repeat(3)
  process.env.OLNOO_CATALOG_BASIC_AUTH = 'reader:test-password'
  try {
    let calls = 0
    const route = load('../app/api/catalog/photos/[id]/[index]/route.ts', {
      '@/lib/catalog-data': data,
      '@/lib/olnoo-catalog': { catalogBytes, catalogRequest: (path: string) => catalogRequest(path, async (_url, init) => {
        calls++
        const headers = new Headers(init?.headers)
        assert.equal(headers.get('x-olnoo-catalog-token'), 'test-site-token-'.repeat(3))
        assert.equal(headers.get('authorization'), `Basic ${Buffer.from('reader:test-password').toString('base64')}`)
        assert.equal(init?.redirect, 'error')
        const mime = path.endsWith('/2') ? 'application/pdf' : 'image/jpeg'
        const status = path === `/${product.id}/photos/0` || path === `/${product.id}/photos/2` || path === `/${product.id}/photos/3` ? 200 : 404
        return new Response(new Uint8Array([1, 2, 3]), { status, headers: { 'Content-Type': mime, 'X-Olnoo-Catalog-Project': path.endsWith('/3') ? 'other' : 'istraart' } })
      }) },
    })
    const get = (id: string, index: string) => route.GET(new Request('https://istraart.test/api/catalog/photos/x/0?project=other'), { params: Promise.resolve({ id, index }) })
    const photo = await get(product.id, '0')
    assert.equal(photo.status, 200)
    assert.equal(photo.headers.get('Cache-Control'), 'no-store')
    assert.equal(photo.headers.get('Content-Type'), 'image/jpeg')
    assert.deepEqual(new Uint8Array(await photo.arrayBuffer()), new Uint8Array([1, 2, 3]))
    for (const [id, index] of [[raw.id, '0'], [product.id, '1'], [product.id, '2'], [product.id, '3']]) assert.equal((await get(id, index)).status, 404)
    const beforeInvalid = calls
    assert.equal((await get('../private', '0')).status, 404)
    assert.equal((await get(product.id, '10')).status, 404)
    assert.equal(calls, beforeInvalid)
  } finally {
    for (const [index, name] of ['OLNOO_CATALOG_TOKEN', 'OLNOO_CATALOG_BASIC_AUTH'].entries()) {
      if (previous[index] === undefined) delete process.env[name]; else process.env[name] = previous[index]
    }
  }
})

test('sitemap includes only current exported slugs and robots excludes the photo API', async () => {
  const modules = { '@/lib/catalog-data': data, '@/lib/olnoo-catalog': { loadCatalog: async () => snapshot().filter((card) => card.id !== guide.id) } }
  const sitemap = load('../app/sitemap.ts', modules)
  const urls = (await sitemap.default()).map((entry: { url: string }) => entry.url)
  assert.deepEqual(urls, ['https://istraart.ru/', 'https://istraart.ru/catalog/material', 'https://istraart.ru/catalog/lamp'])
  assert.equal(urls.some((url: string) => url.includes('lamp-guide')), false)
  const robots = load('../app/robots.ts', {})
  assert.equal(robots.default().rules.disallow, '/api/')
})

test('product descriptions appear once when equal after trim and both when different', () => {
  const { CatalogProduct } = load('../components/catalog-product.tsx', components())
  for (const [description, offerDescription, expected] of [
    ['Единое описание', 'Единое описание', ['Единое описание']],
    ['  Единое описание\n', '\nЕдиное описание  ', ['  Единое описание\n']],
    ['Общее описание', 'Описание изделия', ['Общее описание', 'Описание изделия']],
    ['Два слова', 'Два  слова', ['Два слова', 'Два  слова']],
    ['', 'Описание изделия', ['Описание изделия']],
  ] as const) {
    const card = { ...product, description, offers: { finished: { ...product.offers.finished, description: offerDescription } } }
    const html = renderToStaticMarkup(createElement(CatalogProduct, { card }))
    const descriptions = [...html.matchAll(/<p class="mt-6 whitespace-pre-wrap leading-relaxed text-taupe">([\s\S]*?)<\/p>/g)].map((match) => match[1])
    assert.deepEqual(descriptions, [...expected])
  }
})

test('product gallery switches whole photos, opens/closes native zoom and drafts an order using the existing Telegram contact', () => {
  const card = { ...product, title: 'Светильник «Берег» & дерево', offers: { finished: { ...product.offers.finished, imageIndexes: [0, 2] }, guide: guide.offers.guide } }
  const original = structuredClone(card)
  const states: any[] = ['finished', 0]
  let cursor = 0, open = false, opened = 0, closed = 0
  const ref = { current: { showModal() { open = true; opened++ }, close() { open = false; closed++ } } }
  const { CatalogProduct } = load('../components/catalog-product.tsx', { ...components(), react: {
    useRef: () => ref,
    useState(initial: unknown) { const slot = cursor++; return [states[slot] ?? initial, (value: unknown) => { states[slot] = value }] },
  } })
  const render = () => { cursor = 0; return CatalogProduct({ card }) }
  const walk = (tree: any): any[] => !tree || typeof tree !== 'object' ? [] : Array.isArray(tree) ? tree.flatMap(walk) : [tree, ...walk(tree.props?.children)]
  const find = (tree: any, predicate: (node: any) => boolean) => walk(tree).find(predicate)
  const main = (tree: any) => find(tree, (n) => n.type === 'button' && n.props['aria-label']?.startsWith('Увеличить фото:'))
  let tree = render()
  assert.equal(main(tree).props.children.props.src, data.photoUrl(card, 0))
  find(tree, (n) => n.props?.['aria-label'] === 'Фото 2').props.onClick()
  tree = render()
  assert.equal(main(tree).props.children.props.src, data.photoUrl(card, 2))
  assert.equal(main(tree).props.children.props.className, 'object-contain')
  assert.equal(find(tree, (n) => n.props?.['aria-label'] === 'Фото 2').props['aria-current'], true)
  main(tree).props.onClick()
  assert.equal(open, true); assert.equal(opened, 1)
  const dialog = find(tree, (n) => n.type === 'dialog')
  assert.equal(dialog.props.open, undefined, 'native showModal owns modality, focus and Escape behavior')
  const dialogPhoto = walk(dialog).find((n) => n.props?.src)
  assert.equal(dialogPhoto.props.src, data.photoUrl(card, 2))
  assert.equal(dialogPhoto.props.className, 'object-contain')
  dialog.props.onClick({ target: {}, currentTarget: ref.current })
  assert.equal(open, true, 'clicking the image does not close zoom')
  dialog.props.onClick({ target: ref.current, currentTarget: ref.current })
  assert.equal(open, false)
  main(tree).props.onClick()
  find(tree, (n) => n.type === 'button' && n.props.children === 'Закрыть').props.onClick()
  assert.equal(open, false); assert.equal(closed, 2)
  const order = new URL(find(tree, (n) => n.type === 'a' && n.props.href.startsWith('https://t.me/')).props.href)
  assert.equal(order.origin + order.pathname, 'https://t.me/istraarte')
  assert.ok(order.searchParams.get('text')?.includes(card.title))
  assert.ok(order.searchParams.get('text')?.includes('https://istraart.ru/catalog/lamp'))
  find(tree, (n) => n.type === 'button' && n.props.children === data.offerLabels.guide).props.onClick()
  tree = render()
  assert.equal(states[1], 0, 'switching offers resets selected thumbnail')
  assert.ok(new URL(find(tree, (n) => n.type === 'a' && n.props.href.startsWith('https://t.me/')).props.href).searchParams.get('text')?.includes('покупку гайда'))
  assert.deepEqual(card, original, 'gallery and order preparation never mutate catalog data')
})

test('product characteristics show only confirmed dimensions and do not infer AI photo provenance', () => {
  const { CatalogProduct } = load('../components/catalog-product.tsx', components())
  const html = renderToStaticMarkup(createElement(CatalogProduct, { card: { ...product, diameterCm: 12 } }))
  assert.ok(html.includes('<details'))
  assert.ok(html.includes('Размеры и характеристики'))
  assert.ok(html.includes('30 см')); assert.ok(html.includes('12 см'))
  assert.equal(html.includes('Визуализация будущего изделия'), false, 'current public DTO contains no trusted photo kind')
  const noDimensions = renderToStaticMarkup(createElement(CatalogProduct, { card: { ...product, lengthCm: null, diameterCm: null } }))
  assert.equal(noDimensions.includes('<dt class="text-taupe">Длина</dt>'), false)
  assert.equal(noDimensions.includes('<dt class="text-taupe">Диаметр</dt>'), false)
})
