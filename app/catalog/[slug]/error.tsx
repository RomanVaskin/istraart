'use client'
import Link from 'next/link'
export default function CatalogError({ reset }: { reset: () => void }) {
  return <main className="min-h-[60vh] bg-cream px-5 py-20 text-center">
    <h1 className="font-serif text-4xl">Каталог временно недоступен</h1>
    <p className="mt-6 text-taupe">Не удалось загрузить карточку. Попробуйте позже или свяжитесь с мастерской.</p>
    <div className="mt-8 flex justify-center gap-6 text-sm text-wood-deep"><button onClick={reset} className="underline">Повторить</button><Link href="/#contacts" className="underline">Контакты</Link></div>
  </main>
}
