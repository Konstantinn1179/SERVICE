
export interface CarMake {
  id: string;
  name: string;
  models: string[];
}

export const POPULAR_CARS: CarMake[] = [
  {
    id: 'toyota',
    name: 'Toyota',
    models: ['Camry', 'Corolla', 'RAV4', 'Land Cruiser', 'Highlander', 'Prius']
  },
  {
    id: 'mercedes',
    name: 'Mercedes-Benz',
    models: ['C-Class', 'E-Class', 'S-Class', 'ML / GLE', 'GL / GLS', 'G-Class', 'GLC', 'CLA']
  },
  {
    id: 'kia',
    name: 'Kia',
    models: ['Rio', 'Sportage', 'Sorento', 'Optima', 'K5', 'Ceed', 'Soul']
  },
  {
    id: 'hyundai',
    name: 'Hyundai',
    models: ['Solaris', 'Creta', 'Tucson', 'Santa Fe', 'Sonata', 'Elantra']
  },
  {
    id: 'bmw',
    name: 'BMW',
    models: ['X5', 'X6', 'X3', '3 Series', '5 Series', '7 Series']
  },
  {
    id: 'vag',
    name: 'Volkswagen',
    models: ['Polo', 'Tiguan', 'Touareg', 'Passat', 'Golf', 'Jetta']
  },
  {
    id: 'skoda',
    name: 'Skoda',
    models: ['Octavia', 'Rapid', 'Kodiaq', 'Superb', 'Yeti']
  },
  {
    id: 'nissan',
    name: 'Nissan',
    models: ['Qashqai', 'X-Trail', 'Juke', 'Murano', 'Terrano']
  },
  {
    id: 'ford',
    name: 'Ford',
    models: ['Focus', 'Mondeo', 'Kuga', 'Explorer', 'Fiesta']
  },
  {
    id: 'mazda',
    name: 'Mazda',
    models: ['CX-5', '6', '3', 'CX-9', 'CX-7']
  },
  {
    id: 'renault',
    name: 'Renault',
    models: ['Logan', 'Duster', 'Sandero', 'Kaptur', 'Arkana']
  },
  {
    id: 'lada',
    name: 'LADA',
    models: ['Vesta', 'Granta', 'XRAY']
  }
];

export const YEARS = Array.from({ length: 25 }, (_, i) => (new Date().getFullYear() - i).toString());

export const COMMON_SYMPTOMS = [
  "Пинки при переключении",
  "Вибрация по кузову",
  "Посторонний шум / гул",
  "Задержка при трогании",
  "Не включается передача",
  "Аварийный режим (ошибка)",
  "Течь масла",
  "Удары при остановке",
  "Пробуксовка передач",
  "Нет заднего хода"
];

export const MAINTENANCE_TYPES = [
  "Замена масла (Частичная)",
  "Полная замена масла",
  "Замена фильтров",
  "Адаптация КПП",
  "Диагностика (Профилактика)",
  "Промывка гидроблока"
];

// Removed "Узнать цены" as it is now a top-level category
export const CONSULT_TOPICS = [
  "Сроки ремонта",
  "Гарантия на работы",
  "Записаться на осмотр",
  "Где находитесь?",
  "Эвакуатор"
];

export interface PriceItem {
  title: string;
  price: string;
}

export const PRICE_ITEMS: PriceItem[] = [
  { title: "Входная диагностика", price: "Бесплатно*" },
  { title: "Замена масла (работа)", price: "от 2 000 ₽" },
  { title: "Адаптация АКПП", price: "1 500 ₽" },
  { title: "Снятие / Установка", price: "от 8 000 ₽" },
  { title: "Ремонт гидротрансформатора", price: "от 5 000 ₽" },
  { title: "Капремонт АКПП", price: "от 15 000 ₽" }
];
