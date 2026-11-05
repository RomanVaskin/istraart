import { isCardId } from '@/lib/catalog-data'
import { catalogRequest, catalogBytes, loadCatalog } from '@/lib/olnoo-catalog'
import { createCatalogPhotoCache } from '@/lib/catalog-photo-cache'
export const dynamic = 'force-dynamic'
const cachedPhoto = createCatalogPhotoCache()
export async function GET(req: Request, { params }: { params: Promise<{ id: string; index: string }> }) {
  const { id, index } = await params
  const headers = { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' }
  if (!isCardId(id) || !/^[0-9]$/.test(index)) return new Response(null, { status: 404, headers })
  try {
    // Always check the live, project-bound export BEFORE touching cached bytes or ETags.
    const card = (await loadCatalog()).find((card) => card.id === id)
    const version = new URL(req.url).searchParams.get('v')
    if (!card || !Object.values(card.offers).some((offer) => offer.imageIndexes.includes(Number(index))) || (version !== null && version !== card.updatedAt)) return new Response(null, { status: 404, headers })
    const load = async () => {
      const res = await catalogRequest(`/${id}/photos/${index}`)
      const mime = res.headers.get('content-type')?.split(';')[0]
      if (!mime || !['image/jpeg', 'image/png', 'image/webp'].includes(mime)) throw new Error('Invalid image response')
      return { bytes: await catalogBytes(res, 10 * 1024 * 1024), mime }
    }
    // Legacy URLs without a version keep their old no-store behavior.
    if (version === null) { const photo = await load(); return new Response(photo.bytes, { headers: { ...headers, 'Content-Type': photo.mime } }) }
    const photo = await cachedPhoto(`${id}/${index}/${version}`, load)
    const responseHeaders = { ...headers, 'Cache-Control': 'private, no-cache, max-age=0, must-revalidate', ETag: photo.etag, 'Content-Type': photo.mime }
    const matches = req.headers.get('if-none-match')?.split(',').some((value) => value.trim() === '*' || value.trim().replace(/^W\//, '') === photo.etag)
    return new Response(matches ? null : photo.bytes, { status: matches ? 304 : 200, headers: responseHeaders })
  } catch { return new Response(null, { status: 404, headers }) }
}
