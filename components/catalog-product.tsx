'use client'
import { useState } from 'react'
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
  return <section className="bg-cream py-12 md:py-20">
    <div className="mx-auto max-w-7xl px-5 md:px-8">
      <Link href="/#catalog" className="text-sm text-wood-deep underline underline-offset-4">← В каталог</Link>
      {kinds.length > 1 && <div className="mt-8 flex flex-wrap gap-2" role="group" aria-label="Предложения находки">{kinds.map((k) => <button key={k} type="button" onClick={() => { setKind(k); setThumb(0) }} aria-pressed={kind === k} className={`rounded-full border px-4 py-2 text-sm transition-colors ${kind === k ? 'border-graphite bg-graphite text-milk' : 'border-sand-deep text-taupe hover:border-graphite hover:text-graphite'}`}>{offerLabels[k]}</button>)}</div>}
      <div className="mt-10 grid gap-10 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-7">
          <div className="relative aspect-[5/4] overflow-hidden rounded-3xl bg-sand"><CatalogPhoto key={gallery[thumb] || gallery[0]} src={gallery[thumb] || gallery[0]} alt={offer.title || card.title} fill sizes="(min-width: 1024px) 58vw, 100vw" className="object-cover" /></div>
          <div className="mt-3 grid grid-cols-3 gap-3">{gallery.map((src, i) => <button key={src} type="button" onClick={() => setThumb(i)} aria-label={`Фото ${i + 1}`} aria-current={thumb === i} className={`relative aspect-[4/3] overflow-hidden rounded-xl bg-sand ring-offset-2 ring-offset-cream transition ${thumb === i ? 'ring-2 ring-wood' : 'opacity-70 hover:opacity-100'}`}><CatalogPhoto src={src} alt="" fill sizes="200px" className="object-cover" /></button>)}</div>
        </div>
        <div className="lg:col-span-5 lg:pt-4">
          <p className="text-xs uppercase tracking-[0.25em] text-wood">{offerLabels[kind]}</p>
          <h1 className="mt-3 font-serif text-4xl font-light leading-tight md:text-5xl">{card.title}</h1>
          {card.description && <p className="mt-6 whitespace-pre-wrap leading-relaxed text-taupe">{card.description}</p>}
          {offer.title !== card.title && <h2 className="mt-6 font-serif text-2xl">{offer.title}</h2>}
          <p className="mt-5 font-serif text-3xl text-wood-deep">{formatPrice(offer.priceRub)}</p>
          <p className="mt-6 whitespace-pre-wrap leading-relaxed text-taupe">{offer.description}</p>
          <dl className="mt-8 divide-y divide-sand-deep border-y border-sand-deep text-sm">
            {card.lengthCm != null && <div className="flex justify-between gap-6 py-4"><dt className="text-taupe">Длина</dt><dd>{card.lengthCm} см</dd></div>}
            {card.diameterCm != null && <div className="flex justify-between gap-6 py-4"><dt className="text-taupe">Диаметр</dt><dd>{card.diameterCm} см</dd></div>}
            <div className="flex justify-between gap-6 py-4"><dt className="text-taupe">Доступность</dt><dd>{offer.available ? 'Доступно для заказа' : 'Сейчас недоступно'}</dd></div>
          </dl>
          {offer.available ? <a href="/#contacts" className="mt-9 inline-flex w-full items-center justify-center gap-2 rounded-full bg-graphite px-8 py-4 text-sm text-milk transition-colors hover:bg-wood-deep sm:w-auto"><MessageCircle className="size-4" aria-hidden="true" />{kind === 'guide' ? 'Запросить покупку гайда' : 'Заказать через мастерскую'}</a> : <p className="mt-9 text-sm text-taupe">Это предложение сейчас недоступно.</p>}
          {!!card.relatedCards?.length && <nav aria-label="Связанные карточки" className="mt-10 border-t border-sand-deep pt-6">
            <h2 className="font-serif text-2xl">Связанные работы</h2>
            <ul className="mt-4 flex flex-col gap-3">{card.relatedCards.map((related) => <li key={related.id}><Link href={cardHref(related)} prefetch={false} className="text-sm text-wood-deep underline underline-offset-4">{offerLabels[related.type]} · {related.title}</Link></li>)}</ul>
          </nav>}
        </div>
      </div>
    </div>
  </section>
}
