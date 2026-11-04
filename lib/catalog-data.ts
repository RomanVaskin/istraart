export type OfferKind = 'raw' | 'finished' | 'guide'
export const offerKinds: OfferKind[] = ['raw', 'finished', 'guide']
export const offerLabels: Record<OfferKind, string> = { raw: 'Материал', finished: 'Готовое изделие', guide: 'Гайд' }
export type CatalogOffer = { title: string; description: string; priceRub: number; available: boolean; imageIndexes: number[] }
export type CatalogCard = { id: string; slug: string; title: string; description: string; lengthCm: number | null; diameterCm: number | null; offers: Partial<Record<OfferKind, CatalogOffer>>; updatedAt: string }
export const isCardId = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
export const photoUrl = (card: CatalogCard, index: number) => `/api/catalog/photos/${card.id}/${index}?v=${encodeURIComponent(card.updatedAt)}`
/** Treat the export as a strict public DTO; no source text, file paths or PDF data reaches the client. */
export function parseCatalogCards(value: unknown): CatalogCard[] {
  if (!value || typeof value !== 'object' || (value as { project?: unknown }).project !== 'istraart' || !Array.isArray((value as { cards?: unknown }).cards)) throw new Error('Invalid catalog response')
  return (value as { cards: unknown[] }).cards.map((raw) => {
    if (!raw || typeof raw !== 'object') throw new Error('Invalid catalog card')
    const c = raw as Record<string, unknown>
    if (typeof c.id !== 'string' || !isCardId(c.id) || typeof c.slug !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(c.slug) || typeof c.title !== 'string' || !c.title.trim() || typeof c.description !== 'string' || typeof c.updatedAt !== 'string' || ![c.lengthCm, c.diameterCm].every((n) => n === null || (typeof n === 'number' && Number.isFinite(n) && n > 0)) || !c.offers || typeof c.offers !== 'object' || Array.isArray(c.offers)) throw new Error('Invalid catalog card')
    const offers: CatalogCard['offers'] = {}
    for (const [kind, rawOffer] of Object.entries(c.offers)) {
      if (!offerKinds.includes(kind as OfferKind) || !rawOffer || typeof rawOffer !== 'object') throw new Error('Invalid offer')
      const o = rawOffer as Record<string, unknown>
      if (typeof o.title !== 'string' || !o.title.trim() || typeof o.description !== 'string' || !o.description.trim() || !Number.isSafeInteger(o.priceRub) || Number(o.priceRub) <= 0 || typeof o.available !== 'boolean' || !Array.isArray(o.imageIndexes) || !o.imageIndexes.length || o.imageIndexes.length > 10 || !o.imageIndexes.every((n) => Number.isSafeInteger(n) && n >= 0 && n < 10)) throw new Error('Invalid offer')
      offers[kind as OfferKind] = { title: o.title, description: o.description, priceRub: Number(o.priceRub), available: o.available, imageIndexes: o.imageIndexes as number[] }
    }
    if (!Object.keys(offers).length) throw new Error('Empty catalog card')
    return { id: c.id, slug: c.slug, title: c.title, description: c.description, lengthCm: c.lengthCm as number | null, diameterCm: c.diameterCm as number | null, updatedAt: c.updatedAt, offers }
  }).filter((card, index, cards) => cards.findIndex((c) => c.id === card.id) === index)
}
