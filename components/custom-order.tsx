import { ArrowRight } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

const options = [
  'Люстры и торшеры под ваш интерьер',
  'Подарочные и корпоративные наборы',
  'Декор для ресторанов, отелей и кафе',
  'Изделия по вашему эскизу или фото',
]

export function CustomOrder() {
  return (
    <section id="custom" className="scroll-mt-20 bg-graphite text-milk" aria-labelledby="custom-title">
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 py-20 md:px-8 md:py-28 lg:grid-cols-2 lg:gap-20">
        <div>
          <p className="mb-4 text-xs uppercase tracking-[0.25em] text-sand-deep">Индивидуальный заказ</p>
          <h2 id="custom-title" className="font-serif text-4xl font-light leading-tight text-balance md:text-6xl">
            Создадим вещь <em className="text-sand">специально для вас</em>
          </h2>
          <p className="mt-6 max-w-lg leading-relaxed text-milk/70">
            Расскажите, где будет стоять предмет и какое настроение вы хотите
            получить. Мы подберём дерево, предложим эскиз и согласуем детали
            до начала работы.
          </p>
          <ul className="mt-8 space-y-4">
            {options.map((o) => (
              <li key={o} className="flex items-start gap-4 border-b border-milk/15 pb-4 text-milk/90">
                <span className="mt-2.5 h-px w-6 shrink-0 bg-sand-deep" aria-hidden="true" />
                {o}
              </li>
            ))}
          </ul>
          <Link
            href="#contacts"
            className="group mt-10 inline-flex items-center gap-2 rounded-full bg-milk px-8 py-4 text-sm text-graphite transition-colors hover:bg-sand"
          >
            Обсудить проект
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
        <div className="relative aspect-[4/3] overflow-hidden rounded-3xl bg-wood-deep">
          <Image
            src="/images/custom.jpg"
            alt="Люстра из коряг над обеденным столом"
            fill
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="object-cover"
          />
        </div>
      </div>
    </section>
  )
}
