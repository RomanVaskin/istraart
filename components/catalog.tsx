'use client'

import { ArrowUpRight, Check, MessageCircle } from 'lucide-react'
import Image from 'next/image'
import { useState } from 'react'
import { formatPrice, products, type Product } from '@/lib/products'

const filters = ['Все', 'Светильники', 'Подсвечники', 'Подставки', 'Декор', 'Арт-объекты']

export function Catalog() {
  const [filter, setFilter] = useState('Все')
  const [selected, setSelected] = useState<Product>(products[0])
  const [thumb, setThumb] = useState(0)

  const visible =
    filter === 'Все' ? products : products.filter((p) => p.category === filter)

  const gallery = [selected.image, '/images/t1.jpg', '/images/t2.jpg']

  const select = (product: Product) => {
    setSelected(product)
    setThumb(0)
    document.getElementById('product')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <section id="catalog" className="bg-cream py-20 md:py-28" aria-labelledby="catalog-title">
      <div className="mx-auto max-w-7xl px-5 md:px-8">
        <div className="mb-10 flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <p className="mb-4 text-xs uppercase tracking-[0.25em] text-wood">Каталог</p>
            <h2 id="catalog-title" className="font-serif text-4xl font-light md:text-6xl">
              Избранные работы
            </h2>
          </div>
          <div className="-mx-5 overflow-x-auto px-5 md:mx-0 md:px-0" role="group" aria-label="Фильтр по категориям">
            <div className="flex gap-2">
              {filters.map((f) => (
                <button
                  key={f}
                  type="button"
                  aria-pressed={filter === f}
                  onClick={() => setFilter(f)}
                  className={`shrink-0 rounded-full border px-4 py-2 text-sm transition-colors ${
                    filter === f
                      ? 'border-graphite bg-graphite text-milk'
                      : 'border-sand-deep text-taupe hover:border-graphite hover:text-graphite'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
        </div>

        <ul className="grid grid-cols-2 gap-x-3 gap-y-10 md:grid-cols-3 md:gap-x-6 lg:grid-cols-4">
          {visible.map((product) => (
            <li key={product.id}>
              <button
                type="button"
                onClick={() => select(product)}
                className="group block w-full text-left"
                aria-label={`${product.name}, ${formatPrice(product.price)}. Подробнее`}
              >
                <div className="relative aspect-square overflow-hidden rounded-2xl bg-sand">
                  <Image
                    src={product.image}
                    alt={product.short}
                    fill
                    sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  {product.badge && (
                    <span className="absolute left-3 top-3 rounded-full bg-milk/90 px-3 py-1 text-[11px] text-graphite backdrop-blur">
                      {product.badge}
                    </span>
                  )}
                  <span
                    className="absolute bottom-3 right-3 flex size-10 items-center justify-center rounded-full bg-milk opacity-0 transition-opacity group-hover:opacity-100"
                    aria-hidden="true"
                  >
                    <ArrowUpRight className="size-4" />
                  </span>
                </div>
                <p className="mt-4 text-[11px] uppercase tracking-[0.2em] text-taupe">
                  {product.category}
                </p>
                <h3 className="mt-1 font-serif text-xl leading-tight md:text-2xl">
                  {product.name}
                </h3>
                <p className="mt-1.5 text-sm text-wood-deep">{formatPrice(product.price)}</p>
              </button>
            </li>
          ))}
        </ul>

        <div id="product" className="mt-24 scroll-mt-24 border-t border-sand-deep pt-16 md:mt-32 md:pt-20">
          <div className="grid gap-10 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-7">
              <div className="relative aspect-[5/4] overflow-hidden rounded-3xl bg-sand">
                <Image
                  key={gallery[thumb]}
                  src={gallery[thumb]}
                  alt={thumb === 0 ? selected.name : `Фактура дерева, ${selected.name}`}
                  fill
                  sizes="(min-width: 1024px) 58vw, 100vw"
                  className="object-cover"
                />
              </div>
              <div className="mt-3 grid grid-cols-3 gap-3">
                {gallery.map((src, i) => (
                  <button
                    key={src}
                    type="button"
                    onClick={() => setThumb(i)}
                    aria-label={`Фото ${i + 1}`}
                    aria-current={thumb === i}
                    className={`relative aspect-[4/3] overflow-hidden rounded-xl bg-sand ring-offset-2 ring-offset-cream transition ${
                      thumb === i ? 'ring-2 ring-wood' : 'opacity-70 hover:opacity-100'
                    }`}
                  >
                    <Image src={src} alt="" fill sizes="200px" className="object-cover" />
                  </button>
                ))}
              </div>
            </div>

            <div className="lg:col-span-5 lg:pt-4">
              <p className="text-xs uppercase tracking-[0.25em] text-wood">{selected.category}</p>
              <h3 className="mt-3 font-serif text-4xl font-light leading-tight md:text-5xl">
                {selected.name}
              </h3>
              <p className="mt-5 font-serif text-3xl text-wood-deep">
                {formatPrice(selected.price)}
              </p>
              <p className="mt-6 leading-relaxed text-taupe">{selected.description}</p>

              <dl className="mt-8 divide-y divide-sand-deep border-y border-sand-deep text-sm">
                <div className="flex justify-between gap-6 py-4">
                  <dt className="text-taupe">Размер</dt>
                  <dd className="text-right">{selected.size}</dd>
                </div>
                <div className="flex justify-between gap-6 py-4">
                  <dt className="text-taupe">Материал</dt>
                  <dd className="text-right">{selected.material}</dd>
                </div>
                <div className="flex justify-between gap-6 py-4">
                  <dt className="text-taupe">Срок</dt>
                  <dd className="text-right">В наличии / до 7 дней</dd>
                </div>
              </dl>

              <ul className="mt-6 space-y-2 text-sm text-taupe">
                {['Ручная работа, без конвейера', 'Покрытие натуральным маслом и воском', 'Бережная упаковка и доставка'].map(
                  (item) => (
                    <li key={item} className="flex items-center gap-2.5">
                      <Check className="size-4 text-wood" aria-hidden="true" />
                      {item}
                    </li>
                  ),
                )}
              </ul>

              <a
                href="#contacts"
                className="mt-9 inline-flex w-full items-center justify-center gap-2 rounded-full bg-graphite px-8 py-4 text-sm text-milk transition-colors hover:bg-wood-deep sm:w-auto"
              >
                <MessageCircle className="size-4" aria-hidden="true" />
                Заказать это изделие
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
