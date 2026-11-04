import Link from 'next/link'
import { Logo } from '@/components/site-header'

export function SiteFooter() {
  return (
    <footer className="bg-graphite text-milk">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-5 py-12 md:flex-row md:items-center md:justify-between md:px-8">
        <div>
          <Logo light />
          <p className="mt-3 max-w-xs text-sm text-milk/60">
            Авторские изделия из дерева ручной работы. Истра, Московская область.
          </p>
        </div>
        <nav aria-label="Ссылки в подвале">
          <ul className="flex flex-wrap gap-x-8 gap-y-3 text-sm text-milk/70">
            <li><Link href="#catalog" className="hover:text-milk">Каталог</Link></li>
            <li><Link href="#about" className="hover:text-milk">О мастерской</Link></li>
            <li><Link href="#custom" className="hover:text-milk">На заказ</Link></li>
            <li><Link href="#contacts" className="hover:text-milk">Контакты</Link></li>
          </ul>
        </nav>
      </div>
      <div className="border-t border-milk/10 px-5 py-5 text-center text-xs text-milk/50">
        © {new Date().getFullYear()} IstraArt. Все права защищены.
      </div>
    </footer>
  )
}
