import Image from 'next/image'

const shots = [
  { src: '/images/t4.jpg', alt: 'Деревянный ночник на прикроватной тумбе', className: 'md:col-span-2 md:row-span-2' },
  { src: '/images/t1.jpg', alt: 'Фактура дуба крупным планом', className: '' },
  { src: '/images/t2.jpg', alt: 'Годовые кольца на спиле', className: '' },
  { src: '/images/t3.jpg', alt: 'Гладкая серебристая коряга', className: '' },
  { src: '/images/p7.jpg', alt: 'Бра из ветви на стене', className: '' },
]

export function Gallery() {
  return (
    <section id="gallery" className="mx-auto max-w-7xl scroll-mt-20 px-5 py-20 md:px-8 md:py-28" aria-labelledby="gallery-title">
      <div className="mb-12 text-center">
        <p className="mb-4 text-xs uppercase tracking-[0.25em] text-wood">Галерея</p>
        <h2 id="gallery-title" className="font-serif text-4xl font-light md:text-6xl">
          Фактура и свет
        </h2>
      </div>
      <ul className="grid grid-cols-2 gap-3 md:grid-cols-4 md:grid-rows-2 md:gap-5">
        {shots.map((shot) => (
          <li
            key={shot.src}
            className={`relative aspect-square overflow-hidden rounded-2xl bg-sand ${shot.className}`}
          >
            <Image
              src={shot.src}
              alt={shot.alt}
              fill
              sizes="(min-width: 768px) 25vw, 50vw"
              className="object-cover transition-transform duration-700 hover:scale-105"
            />
          </li>
        ))}
      </ul>
    </section>
  )
}
