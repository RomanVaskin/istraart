import { loadCatalog } from '@/lib/olnoo-catalog'
import { About } from '@/components/about'
import { Catalog } from '@/components/catalog'
import { Categories } from '@/components/categories'
import { Contacts } from '@/components/contacts'
import { CustomOrder } from '@/components/custom-order'
import { Editorial } from '@/components/editorial'
import { Gallery } from '@/components/gallery'
import { Hero } from '@/components/hero'
import { SiteFooter } from '@/components/site-footer'
import { SiteHeader } from '@/components/site-header'

export const dynamic = 'force-dynamic'
export default async function Page() {
  let cards: Awaited<ReturnType<typeof loadCatalog>> = []
  let catalogUnavailable = false
  try { cards = await loadCatalog() } catch { catalogUnavailable = true }
  return (
    <>
      <SiteHeader />
      <main>
        <Hero />
        <Categories />
        <Catalog cards={cards} unavailable={catalogUnavailable} />
        <Editorial />
        <About />
        <CustomOrder />
        <Gallery />
        <Contacts />
      </main>
      <SiteFooter />
    </>
  )
}
