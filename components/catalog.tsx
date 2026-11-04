'use client'
import { ArrowUpRight } from 'lucide-react'
import Link from 'next/link'
import { CatalogPhoto } from '@/components/catalog-photo'
import { useState } from 'react'
import { formatPrice } from '@/lib/products'
import { offerKinds, offerLabels, photoUrl, cardHref, type CatalogCard, type OfferKind } from '@/lib/catalog-data'

export function Catalog({ cards, unavailable = false }: { cards: CatalogCard[]; unavailable?: boolean }) {
  const [filter, setFilter] = useState<OfferKind | 'all'>('all')
  const visible = cards.filter((card) => filter === 'all' || !!card.offers[filter])
  return <section id="catalog" className="bg-cream py-20 md:py-28" aria-labelledby="catalog-title">
    <div className="mx-auto max-w-7xl px-5 md:px-8">
      <div className="mb-10 flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div><p className="mb-4 text-xs uppercase tracking-[0.25em] text-wood">Каталог</p><h2 id="catalog-title" className="font-serif text-4xl font-light md:text-6xl">Избранные работы</h2></div>
        <div className="-mx-5 overflow-x-auto px-5 md:mx-0 md:px-0" role="group" aria-label="Фильтр по предложениям"><div className="flex gap-2">{(['all', ...offerKinds] as const).map((f) => <button key={f} type="button" aria-pressed={filter === f} onClick={() => setFilter(f)} className={`shrink-0 rounded-full border px-4 py-2 text-sm transition-colors ${filter === f ? 'border-graphite bg-graphite text-milk' : 'border-sand-deep text-taupe hover:border-graphite hover:text-graphite'}`}>{f === 'all' ? 'Все' : offerLabels[f]}</button>)}</div></div>
      </div>
      {!visible.length && <p className="py-8 text-taupe" role="status">{unavailable ? 'Каталог временно недоступен. Свяжитесь с мастерской через контакты ниже.' : cards.length ? 'В этом разделе пока нет предложений.' : 'В каталоге пока нет опубликованных работ. Новые находки появятся здесь после оформления.'}</p>}
      <ul className="grid grid-cols-2 gap-x-3 gap-y-10 md:grid-cols-3 md:gap-x-6 lg:grid-cols-4">{visible.map((card) => {
        const firstKind = filter !== 'all' ? filter : offerKinds.find((k) => card.offers[k])!
        const first = card.offers[firstKind]!
        return <li key={card.id}><Link href={cardHref(card)} prefetch={false} className="group block w-full text-left" aria-label={`${card.title}. Подробнее`}>
          <div className="relative aspect-square overflow-hidden rounded-2xl bg-sand"><CatalogPhoto src={photoUrl(card, first.imageIndexes[0])} alt={card.title} fill sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw" className="object-cover transition-transform duration-700 group-hover:scale-105" /><span className="absolute bottom-3 right-3 flex size-10 items-center justify-center rounded-full bg-milk opacity-0 transition-opacity group-hover:opacity-100" aria-hidden="true"><ArrowUpRight className="size-4" /></span></div>
          <p className="mt-4 text-[11px] uppercase tracking-[0.2em] text-taupe">{offerKinds.filter((k) => card.offers[k]).map((k) => offerLabels[k]).join(' · ')}</p><h3 className="mt-1 font-serif text-xl leading-tight md:text-2xl">{card.title}</h3><p className="mt-1.5 text-sm text-wood-deep">{offerLabels[firstKind]} · {formatPrice(first.priceRub)}</p>
        </Link></li>
      })}</ul>
    </div>
  </section>
}
