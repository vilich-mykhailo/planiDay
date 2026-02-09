export const studios = [
  {
    slug: 'massage-kyiv',
    name: 'Massage Kyiv',
    category: 'Масаж',
    city: 'Київ',
    priceFrom: 800,
    services: [
      { id: 1, name: 'Класичний масаж', duration: 60, price: 800 },
      { id: 2, name: 'Релакс масаж', duration: 90, price: 1200 },
      { id: 3, name: 'Стрижка', duration: 90, price: 500 },
    ],
    schedule: {
      mon: { enabled: true, start: '10:00', end: '18:00' },
      tue: { enabled: true, start: '10:00', end: '18:00' },
      wed: { enabled: true, start: '10:00', end: '18:00' },
      thu: { enabled: true, start: '10:00', end: '18:00' },
      fri: { enabled: true, start: '10:00', end: '18:00' },
      sat: { enabled: true, start: '10:00', end: '14:00' },
      sun: { enabled: false, start: '10:00', end: '14:00' },
    },
  },
]
