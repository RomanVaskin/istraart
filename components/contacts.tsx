import { MapPin, MessageCircle, Phone, Send } from 'lucide-react'

const contacts = [
  { icon: Phone, label: 'Телефон', value: '+7 (900) 000-00-00', href: 'tel:+79000000000' },
  { icon: Send, label: 'Telegram', value: '@istraart', href: 'https://t.me/istraart' },
  { icon: MessageCircle, label: 'WhatsApp', value: '+7 (900) 000-00-00', href: 'https://wa.me/79000000000' },
  { icon: MapPin, label: 'Мастерская', value: 'г. Истра, Московская область', href: undefined },
]

export function Contacts() {
  return (
    <section id="contacts" className="scroll-mt-20 bg-sand py-20 md:py-28" aria-labelledby="contacts-title">
      <div className="mx-auto grid max-w-7xl gap-12 px-5 md:px-8 lg:grid-cols-12 lg:gap-20">
        <div className="lg:col-span-5">
          <p className="mb-4 text-xs uppercase tracking-[0.25em] text-wood-deep">Контакты</p>
          <h2 id="contacts-title" className="font-serif text-4xl font-light leading-tight md:text-6xl">
            Давайте <em>поговорим</em> о вашем доме
          </h2>
          <p className="mt-6 max-w-sm text-taupe">
            Ответим в течение дня, подскажем с выбором и рассчитаем стоимость
            индивидуального изделия.
          </p>
        </div>

        <ul className="grid gap-px overflow-hidden rounded-3xl bg-sand-deep sm:grid-cols-2 lg:col-span-7">
          {contacts.map(({ icon: Icon, label, value, href }) => {
            const content = (
              <>
                <Icon className="size-5 text-wood-deep" aria-hidden="true" />
                <p className="mt-6 text-xs uppercase tracking-[0.2em] text-taupe">{label}</p>
                <p className="mt-1 font-serif text-2xl">{value}</p>
              </>
            )
            return (
              <li key={label} className="bg-cream">
                {href ? (
                  <a href={href} className="block p-7 transition-colors hover:bg-milk md:p-9">
                    {content}
                  </a>
                ) : (
                  <div className="p-7 md:p-9">{content}</div>
                )}
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
