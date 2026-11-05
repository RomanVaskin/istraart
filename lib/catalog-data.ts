export type OfferKind = 'raw' | 'finished'
export const offerKinds: OfferKind[] = ['raw', 'finished']
export const offerLabels: Record<OfferKind, string> = { raw: 'Исходный материал', finished: 'Готовое изделие' }
export type CatalogOffer = { title: string; description: string; priceRub: number; available: boolean; imageIndexes: number[] }
export type RelatedCatalogCard = { id: string; slug: string; title: string; type: OfferKind }
export type CatalogCard = { id: string; slug: string; title: string; description: string; lengthCm: number | null; diameterCm: number | null; offers: Partial<Record<OfferKind, CatalogOffer>>; updatedAt: string; relatedCards?: RelatedCatalogCard[] }
export const isCardId = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
export const cardHref = (card: Pick<CatalogCard, 'slug'>) => `/catalog/${encodeURIComponent(card.slug)}`
export const isCardSlug = (slug: string) => slug.length <= 100 && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)
export const findCatalogCard = (cards: CatalogCard[], slug: string) => isCardSlug(slug) ? cards.find((card) => card.slug === slug) ?? null : null
export const photoUrl = (card: CatalogCard, index: number) => `/api/catalog/photos/${card.id}/${index}?v=${encodeURIComponent(card.updatedAt)}`
/** Treat the export as a strict public DTO; no source text, file paths or PDF data reaches the client. */
export function parseCatalogCards(value: unknown): CatalogCard[] {
  if (!value || typeof value !== 'object' || (value as { project?: unknown }).project !== 'istraart' || !Array.isArray((value as { cards?: unknown }).cards)) throw new Error('Invalid catalog response')
  const cards = (value as { cards: unknown[] }).cards.map((raw): CatalogCard | null => {
    if (!raw || typeof raw !== 'object') throw new Error('Invalid catalog card')
    const c = raw as Record<string, unknown>
    if (c.offers && typeof c.offers === 'object' && !Array.isArray(c.offers) && Object.keys(c.offers).length && Object.keys(c.offers).every((kind) => kind === 'guide')) return null
    if (typeof c.id !== 'string' || !isCardId(c.id) || typeof c.slug !== 'string' || !isCardSlug(c.slug) || typeof c.title !== 'string' || !c.title.trim() || typeof c.description !== 'string' || typeof c.updatedAt !== 'string' || ![c.lengthCm, c.diameterCm].every((n) => n === null || (typeof n === 'number' && Number.isFinite(n) && n > 0)) || !c.offers || typeof c.offers !== 'object' || Array.isArray(c.offers)) throw new Error('Invalid catalog card')
    const offers: CatalogCard['offers'] = {}
    for (const [kind, rawOffer] of Object.entries(c.offers)) {
      if (kind === 'guide') continue
      if (!offerKinds.includes(kind as OfferKind) || !rawOffer || typeof rawOffer !== 'object') throw new Error('Invalid offer')
      const o = rawOffer as Record<string, unknown>
      if (typeof o.title !== 'string' || !o.title.trim() || typeof o.description !== 'string' || !o.description.trim() || !Number.isSafeInteger(o.priceRub) || Number(o.priceRub) <= 0 || Number(o.priceRub) > 10_000_000 || typeof o.available !== 'boolean' || !Array.isArray(o.imageIndexes) || !o.imageIndexes.length || new Set(o.imageIndexes).size !== o.imageIndexes.length || o.imageIndexes.length > 10 || !o.imageIndexes.every((n) => Number.isSafeInteger(n) && n >= 0 && n < 10)) throw new Error('Invalid offer')
      offers[kind as OfferKind] = { title: o.title, description: o.description, priceRub: Number(o.priceRub), available: o.available, imageIndexes: o.imageIndexes as number[] }
    }
    if (!Object.keys(offers).length) throw new Error('Empty catalog card')
    let relatedCards: RelatedCatalogCard[] | undefined
    if (c.relatedCards !== undefined) {
      if (!Array.isArray(c.relatedCards)) throw new Error('Invalid catalog relations')
      relatedCards = c.relatedCards.flatMap((raw) => {
        if (!raw || typeof raw !== 'object') throw new Error('Invalid catalog relation')
        const r = raw as Record<string, unknown>
        if (r.type === 'guide') return []
        if (typeof r.id !== 'string' || !isCardId(r.id) || typeof r.slug !== 'string' || !isCardSlug(r.slug) || typeof r.title !== 'string' || !r.title.trim() || !offerKinds.includes(r.type as OfferKind)) throw new Error('Invalid catalog relation')
        return [{ id: r.id, slug: r.slug, title: r.title, type: r.type as OfferKind }]
      })
    }
    return { ...(relatedCards ? { relatedCards } : {}), id: c.id, slug: c.slug, title: c.title, description: c.description, lengthCm: c.lengthCm as number | null, diameterCm: c.diameterCm as number | null, updatedAt: c.updatedAt, offers }
  }).filter((card): card is CatalogCard => card !== null).filter((card, index, cards) => cards.findIndex((c) => c.id === card.id) === index)
  if (new Set(cards.map((c) => c.slug)).size !== cards.length) throw new Error('Ambiguous catalog slug')
  const byId = new Map(cards.map((card) => [card.id, card]))
  return cards.map((card) => {
    const kinds = offerKinds.filter((kind) => card.offers[kind])
    const relatedCards = (card.relatedCards ?? []).filter((ref, index, refs) => {
      const target = byId.get(ref.id)
      const allowed = kinds.length === 1 && (kinds[0] === 'raw' ? ref.type === 'finished' : ref.type === 'raw')
      return allowed && ref.id !== card.id && target?.slug === ref.slug && Object.keys(target.offers).length === 1 && !!target.offers[ref.type] && refs.findIndex((r) => r.id === ref.id) === index
    }).map((ref) => ({ id: ref.id, slug: byId.get(ref.id)!.slug, title: byId.get(ref.id)!.title, type: ref.type }))
    const { relatedCards: _untrusted, ...publicCard } = card
    return relatedCards.length ? { ...publicCard, relatedCards } : publicCard
  })
}
