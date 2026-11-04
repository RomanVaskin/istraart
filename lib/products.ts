export const categories = [
  { name: 'Светильники', count: 0, image: '/images/p1.jpg' },
  { name: 'Подсвечники', count: 0, image: '/images/p9.jpg' },
  { name: 'Подставки', count: 0, image: '/images/p3.jpg' },
  { name: 'Декор', count: 0, image: '/images/p4.jpg' },
  { name: 'Арт-объекты', count: 0, image: '/images/p5.jpg' },
  { name: 'Изделия на заказ', count: 0, image: '/images/custom.jpg' },
]

export const formatPrice = (price: number) =>
  `${new Intl.NumberFormat('ru-RU').format(price)} ₽`
