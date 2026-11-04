import { ArrowRight } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

const facts = [
  'Натуральное дерево',
  'Ручная работа',
  'Единственный экземпляр',
  'Доставка по России',
]

export function Hero() {
  return (
    <section id="top" className="relative">
      <div className="mx-auto grid max-w-7xl items-center gap-10 px-5 pb-16 pt-10 md:px-8 lg:grid-cols-12 lg:gap-12 lg:pb-24 lg:pt-16">
        <div className="lg:col-span-6">
          <p className="mb-6 flex items-center gap-3 text-xs uppercase tracking-[0.25em] text-wood">
            <span className="h-px w-10 bg-wood" aria-hidden="true" />
            Мастерская на Истре
          </p>
          <h1 className="font-serif text-5xl font-light leading-[1.02] text-balance md:text-7xl xl:text-[5.5rem]">
            Дерево, которое
            <br />
            <span className="italic text-wood-deep">хранит тепло</span>
            <br />
            вашего дома
          </h1>
          <p className="mt-8 max-w-md text-base leading-relaxed text-taupe md:text-lg">
            Светильники, подсвечники и арт-объекты из коряг, спилов и
            массива. Каждая вещь вырастает из формы самого дерева — без
            конвейера и копий.
          </p>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <Link
              href="#catalog"
              className="group inline-flex items-center justify-center gap-2 rounded-full bg-graphite px-8 py-4 text-sm text-milk transition-colors hover:bg-wood-deep"
            >
              Смотреть каталог
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              href="#custom"
              className="inline-flex items-center justify-center rounded-full border border-graphite/70 px-8 py-4 text-sm transition-colors hover:bg-sand"
            >
              Изделие на заказ
            </Link>
          </div>
        </div>

        <div className="relative lg:col-span-6">
          <div className="relative aspect-[4/5] overflow-hidden rounded-t-[999px] rounded-b-3xl bg-sand md:ml-auto md:max-w-xl">
            <Image
              src="/images/hero.jpg"
              alt="Скульптурный торшер из коряги в светлом интерьере"
              fill
              priority
              sizes="(min-width: 1024px) 560px, 100vw"
              className="object-cover"
            />
          </div>
          <div className="absolute -bottom-6 left-2 max-w-[15rem] rounded-2xl bg-cream p-5 shadow-[0_20px_50px_-20px_rgba(43,41,38,0.35)] md:left-0">
            <p className="font-serif text-4xl text-wood-deep">1 из 1</p>
            <p className="mt-1 text-sm leading-snug text-taupe">
              Каждое изделие существует в единственном экземпляре
            </p>
          </div>
        </div>
      </div>

      <div className="border-y border-sand-deep/50 bg-cream">
        <ul className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-10 gap-y-3 px-5 py-5 text-xs uppercase tracking-[0.2em] text-taupe md:justify-between md:px-8">
          {facts.map((fact) => (
            <li key={fact} className="flex items-center gap-3">
              <span className="size-1.5 rounded-full bg-wood" aria-hidden="true" />
              {fact}
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
