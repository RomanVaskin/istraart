import type { Metadata } from 'next'
import { cache } from 'react'
import { notFound } from 'next/navigation'
import { loadCatalog } from '@/lib/olnoo-catalog'
import { cardHref, findCatalogCard, isCardSlug, offerKinds } from '@/lib/catalog-data'
import { CatalogProduct } from '@/components/catalog-product'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'

export const dynamic = 'force-dynamic'
// React cache deduplicates metadata/page reads within one render, never across requests.
const currentCatalog = cache(() => loadCatalog())
type Props = { params: Promise<{ slug: string }> }
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  if (!isCardSlug(slug)) return { title: 'Карточка не найдена — IstraArt', robots: { index: false } }
  try {
    const card = findCatalogCard(await currentCatalog(), slug)
    if (!card) return { title: 'Карточка не найдена — IstraArt', robots: { index: false } }
    const offer = card.offers[offerKinds.find((kind) => card.offers[kind])!]!
    return { title: `${card.title} — IstraArt`, description: (card.description || offer.description).slice(0, 160), alternates: { canonical: `https://istraart.ru${cardHref(card)}` } }
  } catch { return { title: 'Каталог временно недоступен — IstraArt', robots: { index: false } } }
}
export default async function ProductPage({ params }: Props) {
  const { slug } = await params
  if (!isCardSlug(slug)) notFound()
  const card = findCatalogCard(await currentCatalog(), slug)
  if (!card) notFound()
  return <><SiteHeader /><main><CatalogProduct key={card.id} card={card} /></main><SiteFooter /></>
}
