import Link from 'next/link'
export default function ProductNotFound() {
  return <main className="min-h-[60vh] bg-cream px-5 py-20 text-center">
    <h1 className="font-serif text-4xl">Карточка не найдена</h1>
    <p className="mt-6 text-taupe">Возможно, работа ещё не опубликована или снята с публикации.</p>
    <Link href="/#catalog" className="mt-8 inline-block text-sm text-wood-deep underline">Вернуться в каталог</Link>
  </main>
}
