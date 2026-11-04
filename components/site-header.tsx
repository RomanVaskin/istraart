'use client'

import { Menu, X } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

const links = [
  { href: '#catalog', label: 'Каталог' },
  { href: '#about', label: 'О мастерской' },
  { href: '#custom', label: 'На заказ' },
  { href: '#gallery', label: 'Галерея' },
  { href: '#contacts', label: 'Контакты' },
]

export function Logo({ light = false }: { light?: boolean }) {
  return (
    <Link
      href="#top"
      className="flex items-center gap-2.5"
      aria-label="IstraArt — на главную"
    >
      <svg
        width="26"
        height="26"
        viewBox="0 0 26 26"
        fill="none"
        aria-hidden="true"
        className={light ? 'text-sand' : 'text-wood'}
      >
        <circle cx="13" cy="13" r="12" stroke="currentColor" strokeWidth="1.2" />
        <circle cx="13" cy="13" r="8" stroke="currentColor" strokeWidth="1.2" />
        <circle cx="13" cy="13" r="4" stroke="currentColor" strokeWidth="1.2" />
        <circle cx="13" cy="13" r="1" fill="currentColor" />
      </svg>
      <span className="font-serif text-2xl font-medium tracking-wide">
        Istra<span className="italic">Art</span>
      </span>
    </Link>
  )
}

export function SiteHeader() {
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 border-b border-sand-deep/40 bg-milk/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 md:h-20 md:px-8">
        <Logo />
        <nav aria-label="Основная навигация" className="hidden md:block">
          <ul className="flex items-center gap-9">
            {links.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-sm text-taupe transition-colors hover:text-graphite"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <Link
          href="#custom"
          className="hidden rounded-full border border-graphite px-5 py-2.5 text-sm transition-colors hover:bg-graphite hover:text-milk md:inline-block"
        >
          Заказать изделие
        </Link>
        <button
          type="button"
          className="-mr-2 p-2 md:hidden"
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? 'Закрыть меню' : 'Открыть меню'}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="size-6" /> : <Menu className="size-6" />}
        </button>
      </div>
      {open && (
        <nav
          id="mobile-menu"
          aria-label="Мобильная навигация"
          className="border-t border-sand-deep/40 bg-milk px-5 pb-6 pt-2 md:hidden"
        >
          <ul>
            {links.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="block border-b border-sand-deep/30 py-4 font-serif text-2xl"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
          <Link
            href="#custom"
            onClick={() => setOpen(false)}
            className="mt-6 block rounded-full bg-graphite py-3.5 text-center text-sm text-milk"
          >
            Заказать изделие
          </Link>
        </nav>
      )}
    </header>
  )
}
