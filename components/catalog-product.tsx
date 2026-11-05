'use client'
import { useRef, useState } from 'react'
import Link from 'next/link'
import { MessageCircle } from 'lucide-react'
import { CatalogPhoto } from '@/components/catalog-photo'
import { cardHref, offerKinds, offerLabels, photoUrl, type CatalogCard } from '@/lib/catalog-data'
import { formatPrice } from '@/lib/products'

export function CatalogProduct({ card }: { card: CatalogCard }) {
  const kinds = offerKinds.filter((kind) => card.offers[kind])
  const [kind, setKind] = useState(kinds[0])
  const [thumb, setThumb] = useState(0)
  const offer = card.offers[kind]!
  const gallery = offer.imageIndexes.map((index) => photoUrl(card, index))
  const selectedPhoto = gallery[thumb] || gallery[0]
  const zoom = useRef<HTMLDialogElement>(null)
  const orderMessage = `Здравствуйте! Хочу обсудить заказ «${card.title}». https://istraart.ru${cardHref(card)}`
  const orderHref = `https://t.me/istraarte?text=${encodeURIComponent(orderMessage)}`
  return <section className="bg-cream py-12 md:py-20">
    <div className="mx-auto max-w-7xl px-5 md:px-8">
      <Link href="/#catalog" className="text-sm text-wood-deep underline underline-offset-4">← В каталог</Link>
      {kinds.length > 1 && <div className="mt-8 flex flex-wrap gap-2" role="group" aria-label="Предложения находки">{kinds.map((k) => <button key={k} type="button" onClick={() => { setKind(k); setThumb(0) }} aria-pressed={kind === k} className={`rounded-full border px-4 py-2 text-sm transition-colors ${kind === k ? 'border-graphite bg-graphite text-milk' : 'border-sand-deep text-taupe hover:border-graphite hover:text-graphite'}`}>{offerLabels[k]}</button>)}</div>}
      <div className="mt-10 grid gap-10 lg:grid-cols-12 lg:gap-16">
        <div className="min-w-0 lg:col-span-7">
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-[72px_minmax(0,1fr)] lg:items-start">
            <button type="button" onClick={() => zoom.current?.showModal()} aria-label={`Увеличить фото: ${offer.title || card.title}`} className="relative mx-auto block aspect-[4/5] w-full max-w-[560px] max-h-[700px] cursor-zoom-in overflow-hidden rounded-3xl bg-sand focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-wood lg:col-start-2 lg:row-start-1">
              <CatalogPhoto key={selectedPhoto} src={selectedPhoto} alt={offer.title || card.title} fill sizes="(min-width: 600px) 560px, 100vw" className="object-contain" />
            </button>
            <div role="group" aria-label="Фотографии товара" className="flex gap-3 overflow-x-auto px-1 py-2 lg:col-start-1 lg:row-start-1 lg:max-h-[700px] lg:flex-col lg:overflow-x-hidden lg:overflow-y-auto">
              {gallery.map((src, i) => <button key={src} type="button" onClick={() => setThumb(i)} aria-label={`Фото ${i + 1}`} aria-current={thumb === i} className={`relative aspect-[4/5] w-20 shrink-0 overflow-hidden rounded-xl bg-sand ring-offset-2 ring-offset-cream transition lg:w-full ${thumb === i ? 'ring-2 ring-wood' : 'opacity-70 hover:opacity-100'}`}><CatalogPhoto src={src} alt="" fill sizes="80px" className="object-contain" /></button>)}
            </div>
          </div>
          <dialog ref={zoom} aria-label={`Увеличенное фото: ${offer.title || card.title}`} onClick={(event) => { if (event.target === event.currentTarget) zoom.current?.close() }} className="m-auto max-h-[95dvh] w-[92vw] max-w-5xl rounded-3xl border border-sand-deep bg-cream p-4 text-graphite backdrop:bg-graphite/70 sm:p-6">
            <div className="mb-3 flex justify-end"><button type="button" autoFocus onClick={() => zoom.current?.close()} className="rounded-full border border-sand-deep px-4 py-2 text-sm hover:bg-sand">Закрыть</button></div>
            <div className="relative mx-auto aspect-[4/5] w-full max-w-[64dvh]"><CatalogPhoto key={selectedPhoto} src={selectedPhoto} alt={offer.title || card.title} fill sizes="(min-width: 800px) 800px, 92vw" className="object-contain" /></div>
          </dialog>
        </div>
        <div className="lg:col-span-5 lg:pt-4">
          <p className="text-xs uppercase tracking-[0.25em] text-wood">{offerLabels[kind]}</p>
          <h1 className="mt-3 font-serif text-4xl font-light leading-tight md:text-5xl">{card.title}</h1>
          {card.description && <p className="mt-6 whitespace-pre-wrap leading-relaxed text-taupe">{card.description}</p>}
          {offer.title !== card.title && <h2 className="mt-6 font-serif text-2xl">{offer.title}</h2>}
          <p className="mt-5 font-serif text-3xl text-wood-deep">{formatPrice(offer.priceRub)}</p>
          {card.description.trim() !== offer.description.trim() && <p className="mt-6 whitespace-pre-wrap leading-relaxed text-taupe">{offer.description}</p>}
          <p className="mt-6 text-sm text-taupe">{offer.available ? 'Доступно для заказа' : 'Сейчас недоступно'}</p>
          <details className="mt-6 border-y border-sand-deep py-4 text-sm">
            <summary className="cursor-pointer text-wood-deep">Размеры и характеристики</summary>
            <dl className="mt-3 divide-y divide-sand-deep">
              <div className="flex justify-between gap-6 py-3"><dt className="text-taupe">Тип</dt><dd>{offerLabels[kind]}</dd></div>
              {card.lengthCm != null && <div className="flex justify-between gap-6 py-3"><dt className="text-taupe">Длина</dt><dd>{card.lengthCm} см</dd></div>}
              {card.diameterCm != null && <div className="flex justify-between gap-6 py-3"><dt className="text-taupe">Диаметр</dt><dd>{card.diameterCm} см</dd></div>}
            </dl>
          </details>
          {offer.available ? <a href={orderHref} className="mt-9 inline-flex w-full items-center justify-center gap-2 rounded-full bg-graphite px-8 py-4 text-sm text-milk transition-colors hover:bg-wood-deep sm:w-auto"><MessageCircle className="size-4" aria-hidden="true" />Обсудить заказ</a> : <p className="mt-9 text-sm text-taupe">Это предложение сейчас недоступно.</p>}
          {!!card.relatedCards?.length && <nav aria-label="Связанные карточки" className="mt-10 border-t border-sand-deep pt-6">
            <h2 className="font-serif text-2xl">Связанные работы</h2>
            <ul className="mt-4 flex flex-col gap-3">{card.relatedCards.map((related) => <li key={related.id}><Link href={cardHref(related)} prefetch={false} className="text-sm text-wood-deep underline underline-offset-4">{offerLabels[related.type]} · {related.title}</Link></li>)}</ul>
          </nav>}
        </div>
      </div>
    </div>
  </section>
}
