import Image from 'next/image'
import Link from 'next/link'
import { categories } from '@/lib/products'

export function Categories() {
  return (
    <section className="mx-auto max-w-7xl px-5 py-20 md:px-8 md:py-28" aria-labelledby="categories-title">
      <div className="mb-12 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="mb-4 text-xs uppercase tracking-[0.25em] text-wood">Разделы</p>
          <h2 id="categories-title" className="font-serif text-4xl font-light md:text-6xl">
            Коллекции мастерской
          </h2>
        </div>
        <p className="max-w-sm text-taupe">
          От небольших вещей для стола до крупных скульптур, которые задают
          характер всей комнате.
        </p>
      </div>

      <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-5">
        {categories.map((category, i) => (
          <li key={category.name} className={i === 0 ? 'row-span-1' : ''}>
            <Link
              href={category.name === 'Изделия на заказ' ? '#custom' : '#catalog'}
              className="group relative block aspect-[4/5] overflow-hidden rounded-2xl bg-sand md:aspect-[5/6]"
            >
              <Image
                src={category.image}
                alt=""
                fill
                sizes="(min-width: 768px) 33vw, 50vw"
                className="object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div
                className="absolute inset-0 bg-gradient-to-t from-graphite/70 via-graphite/5 to-transparent"
                aria-hidden="true"
              />
              <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-4 text-milk md:p-6">
                <h3 className="font-serif text-2xl leading-tight md:text-3xl">
                  {category.name}
                </h3>
                {category.count > 0 && (
                  <span className="text-xs tracking-widest text-milk/80">
                    {String(category.count).padStart(2, '0')}
                  </span>
                )}
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
