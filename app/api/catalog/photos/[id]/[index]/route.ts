import { isCardId } from '@/lib/catalog-data'
import { catalogRequest, catalogBytes } from '@/lib/olnoo-catalog'
export const dynamic = 'force-dynamic'
export async function GET(_req: Request, { params }: { params: Promise<{ id: string; index: string }> }) {
  const { id, index } = await params
  const headers = { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' }
  if (!isCardId(id) || !/^[0-9]$/.test(index)) return new Response(null, { status: 404, headers })
  try {
    const res = await catalogRequest(`/${id}/photos/${index}`)
    const mime = res.headers.get('content-type')?.split(';')[0]
    if (!mime || !['image/jpeg', 'image/png', 'image/webp'].includes(mime)) return new Response(null, { status: 404, headers })
    const bytes = await catalogBytes(res, 10 * 1024 * 1024)
    return new Response(bytes, { headers: { ...headers, 'Content-Type': mime } })
  } catch { return new Response(null, { status: 404, headers }) }
}
