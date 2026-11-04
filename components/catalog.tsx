'use client'
import { ArrowUpRight, MessageCircle } from 'lucide-react'
import Image from 'next/image'
import { useState } from 'react'
import { formatPrice } from '@/lib/products'
import { offerKinds, offerLabels, photoUrl, type CatalogCard, type OfferKind } from '@/lib/catalog-data'

export function Catalog({ cards, unavailable = false }: { cards: CatalogCard[]; unavailable?: boolean }) {
  const [filter, setFilter] = useState<OfferKind | 'all'>('all')
  const [selectedId, setSelectedId] = useState(cards[0]?.id ?? '')
  const [kind, setKind] = useState<OfferKind>(() => offerKinds.find((k) => cards[0]?.offers[k]) || 'raw')
  const [thumb, setThumb] = useState(0)
  const visible = cards.filter((card) => filter === 'all' || !!card.offers[filter])
  const selected = cards.find((card) => card.id === selectedId) ?? cards[0]
  const offer = selected?.offers[kind]
  const gallery = selected && offer ? offer.imageIndexes.map((index) => photoUrl(selected, index)) : []
  function select(card: CatalogCard) {
    setSelectedId(card.id); setThumb(0)
    setKind(filter !== 'all' && card.offers[filter] ? filter : offerKinds.find((k) => card.offers[k]) || 'raw')
    document.getElementById('product')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
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
        return <li key={card.id}><button type="button" onClick={() => select(card)} className="group block w-full text-left" aria-label={`${card.title}. Подробнее`}>
          <div className="relative aspect-square overflow-hidden rounded-2xl bg-sand"><Image src={photoUrl(card, first.imageIndexes[0])} alt={card.title} fill sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw" className="object-cover transition-transform duration-700 group-hover:scale-105" /><span className="absolute bottom-3 right-3 flex size-10 items-center justify-center rounded-full bg-milk opacity-0 transition-opacity group-hover:opacity-100" aria-hidden="true"><ArrowUpRight className="size-4" /></span></div>
          <p className="mt-4 text-[11px] uppercase tracking-[0.2em] text-taupe">{offerKinds.filter((k) => card.offers[k]).map((k) => offerLabels[k]).join(' · ')}</p><h3 className="mt-1 font-serif text-xl leading-tight md:text-2xl">{card.title}</h3><p className="mt-1.5 text-sm text-wood-deep">{offerLabels[firstKind]} · {formatPrice(first.priceRub)}</p>
        </button></li>
      })}</ul>
      {selected && <div id="product" className="mt-24 scroll-mt-24 border-t border-sand-deep pt-16 md:mt-32 md:pt-20">
        <div className="mb-8 flex flex-wrap gap-2" role="group" aria-label="Предложения находки">{offerKinds.map((k) => <button key={k} type="button" onClick={() => { setKind(k); setThumb(0) }} aria-pressed={kind === k} className={`rounded-full border px-4 py-2 text-sm transition-colors ${kind === k ? 'border-graphite bg-graphite text-milk' : 'border-sand-deep text-taupe hover:border-graphite hover:text-graphite'}`}>{offerLabels[k]}</button>)}</div>
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-7">{!!gallery.length && <><div className="relative aspect-[5/4] overflow-hidden rounded-3xl bg-sand"><Image key={gallery[thumb] || gallery[0]} src={gallery[thumb] || gallery[0]} alt={offer?.title || selected.title} fill sizes="(min-width: 1024px) 58vw, 100vw" className="object-cover" /></div><div className="mt-3 grid grid-cols-3 gap-3">{gallery.map((src, i) => <button key={src} type="button" onClick={() => setThumb(i)} aria-label={`Фото ${i + 1}`} aria-current={thumb === i} className={`relative aspect-[4/3] overflow-hidden rounded-xl bg-sand ring-offset-2 ring-offset-cream transition ${thumb === i ? 'ring-2 ring-wood' : 'opacity-70 hover:opacity-100'}`}><Image src={src} alt="" fill sizes="200px" className="object-cover" /></button>)}</div></>}</div>
          <div className="lg:col-span-5 lg:pt-4"><p className="text-xs uppercase tracking-[0.25em] text-wood">{offerLabels[kind]}</p><h3 className="mt-3 font-serif text-4xl font-light leading-tight md:text-5xl">{selected.title}</h3>{selected.description && <p className="mt-6 whitespace-pre-wrap leading-relaxed text-taupe">{selected.description}</p>}
            {offer ? <><h4 className="mt-6 font-serif text-2xl">{offer.title}</h4><p className="mt-5 font-serif text-3xl text-wood-deep">{formatPrice(offer.priceRub)}</p><p className="mt-6 whitespace-pre-wrap leading-relaxed text-taupe">{offer.description}</p>
              <dl className="mt-8 divide-y divide-sand-deep border-y border-sand-deep text-sm">{selected.lengthCm != null && <div className="flex justify-between gap-6 py-4"><dt className="text-taupe">Длина находки</dt><dd>{selected.lengthCm} см</dd></div>}{selected.diameterCm != null && <div className="flex justify-between gap-6 py-4"><dt className="text-taupe">Диаметр находки</dt><dd>{selected.diameterCm} см</dd></div>}<div className="flex justify-between gap-6 py-4"><dt className="text-taupe">Доступность</dt><dd>{offer.available ? 'Доступно для заказа' : 'Сейчас недоступно'}</dd></div></dl>
              {offer.available ? <a href="#contacts" className="mt-9 inline-flex w-full items-center justify-center gap-2 rounded-full bg-graphite px-8 py-4 text-sm text-milk transition-colors hover:bg-wood-deep sm:w-auto"><MessageCircle className="size-4" aria-hidden="true" />{kind === 'guide' ? 'Запросить покупку гайда' : 'Заказать через мастерскую'}</a> : <p className="mt-9 text-sm text-taupe">Это предложение сейчас недоступно.</p>}
            </> : <p className="mt-6 text-taupe">Это предложение для находки пока не опубликовано.</p>}
          </div>
        </div>
      </div>}
    </div>
  </section>
}
