import type { MetadataRoute } from 'next'
import { loadCatalog } from '@/lib/olnoo-catalog'
import { cardHref } from '@/lib/catalog-data'
export const dynamic = 'force-dynamic'
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const cards = await loadCatalog()
  return [{ url: 'https://istraart.ru/' }, ...cards.map((card) => ({ url: `https://istraart.ru${cardHref(card)}` }))]
}
