import Image from 'next/image'

export function Editorial() {
  return (
    <section className="relative isolate overflow-hidden" aria-label="Философия мастерской">
      <div className="relative min-h-[34rem] md:min-h-[44rem]">
        <Image
          src="/images/editorial.jpg"
          alt="Коряги и деревянные светильники на берегу водохранилища"
          fill
          sizes="100vw"
          className="-z-10 object-cover"
        />
        <div className="absolute inset-0 -z-10 bg-graphite/45" aria-hidden="true" />
        <div className="mx-auto flex min-h-[34rem] max-w-7xl items-end px-5 py-16 md:min-h-[44rem] md:px-8 md:py-24">
          <div className="max-w-3xl text-milk">
            <p className="mb-5 text-xs uppercase tracking-[0.25em] text-sand">Истринское водохранилище</p>
            <blockquote className="font-serif text-4xl font-light leading-[1.1] text-balance md:text-6xl">
              «Лучший дизайнер — время. Мы лишь{' '}
              <em className="text-sand">слушаем дерево</em> и убираем лишнее».
            </blockquote>
          </div>
        </div>
      </div>
    </section>
  )
}
