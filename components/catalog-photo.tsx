'use client'
import Image from 'next/image'
import { useState } from 'react'

export function CatalogPhoto(props: { src: string; alt: string; fill?: boolean; sizes?: string; className?: string }) {
  const [failed, setFailed] = useState('')
  if (failed === props.src) return <span role="img" aria-label={props.alt} className="flex h-full min-h-24 items-center justify-center p-4 text-center text-sm text-taupe">Фото временно недоступно</span>
  return <Image {...props} onError={() => setFailed(props.src)} />
}
