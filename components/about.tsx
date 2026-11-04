import Image from 'next/image'

const stats = [
  { value: '8 лет', label: 'работаем с деревом' },
  { value: '600+', label: 'изделий в домах клиентов' },
  { value: '100%', label: 'ручная работа' },
]

const steps = [
  { title: 'Находка', text: 'Собираем коряги и спилы на берегах и в лесах Подмосковья.' },
  { title: 'Сушка', text: 'Дерево сохнет месяцами, чтобы не трескаться в вашем доме.' },
  { title: 'Работа', text: 'Шлифуем вручную до шелковистой фактуры, сохраняя форму.' },
  { title: 'Масло', text: 'Покрываем маслом и воском — только натуральные составы.' },
]

export function About() {
  return (
    <section id="about" className="mx-auto max-w-7xl scroll-mt-20 px-5 py-20 md:px-8 md:py-28" aria-labelledby="about-title">
      <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-20">
        <div className="relative lg:col-span-5">
          <div className="relative aspect-[4/5] overflow-hidden rounded-3xl bg-sand">
            <Image
              src="/images/workshop.jpg"
              alt="Руки мастера шлифуют корень в мастерской"
              fill
              sizes="(min-width: 1024px) 40vw, 100vw"
              className="object-cover"
            />
          </div>
        </div>

        <div className="lg:col-span-7">
          <p className="mb-4 text-xs uppercase tracking-[0.25em] text-wood">О мастерской</p>
          <h2 id="about-title" className="font-serif text-4xl font-light leading-tight text-balance md:text-6xl">
            Мы не создаём форму — <em className="text-wood-deep">мы её находим</em>
          </h2>
          <p className="mt-8 max-w-2xl text-lg leading-relaxed text-taupe">
            IstraArt — небольшая семейная мастерская в Истре. Мы работаем с
            деревом, которое уже прожило свою историю: корни, коряги,
            спилы. Нам важно сохранить его характер и дать вещи вторую жизнь
            в вашем доме.
          </p>

          <dl className="mt-12 grid grid-cols-3 gap-4 border-y border-sand-deep py-8">
            {stats.map((s) => (
              <div key={s.label}>
                <dt className="sr-only">{s.label}</dt>
                <dd className="font-serif text-3xl text-wood-deep md:text-5xl">{s.value}</dd>
                <p className="mt-1 text-xs leading-snug text-taupe md:text-sm">{s.label}</p>
              </div>
            ))}
          </dl>

          <ol className="mt-10 grid gap-x-10 gap-y-7 sm:grid-cols-2">
            {steps.map((step, i) => (
              <li key={step.title} className="flex gap-4">
                <span className="font-serif text-2xl italic text-wood">0{i + 1}</span>
                <div>
                  <h3 className="font-medium">{step.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-taupe">{step.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  )
}
