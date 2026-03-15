import {
  ArrowLeftRight,
  BadgeCheck,
  Blocks,
  BookOpenCheck,
  BrainCircuit,
  Building2,
  CircleCheck,
  ClipboardList,
  FilePenLine,
  FileText,
  GraduationCap,
  HeartHandshake,
  LibraryBig,
  LockKeyhole,
  School,
  ShieldCheck,
  Sparkles,
  TriangleAlert,
  UserRound,
  Users,
  UsersRound,
} from "lucide-react";

export const navLinks = [
  { href: "#how", label: "Як це працює" },
  { href: "#ai", label: "AI-порівняння" },
  { href: "#users", label: "Для користувачів" },
  { href: "#dashboards", label: "Огляд платформи" },
  { href: "#trust", label: "Прозорість" },
];

export const heroStats = [
  { value: "підключені школи", label: "" },
  { value: "підключені батьки", label: "" },
  { value: "підключені гуртки", label: "" },
];

export const processSteps = [
  {
    number: "01",
    icon: School,
    title: "Школа відкриває процес розгляду",
    description:
      "Шкільний кабінет приймає запит на врахування, бачить структуровані докази та залишає фінальне рішення.",
    highlight: "Старт школи",
  },
  {
    number: "02",
    icon: UsersRound,
    title: "Родина подає запит на врахування",
    description:
      "Батьки обирають дитину, школу, програму гуртка і додають короткий контекст для шкільного розгляду.",
    highlight: "Запит родини",
  },
  {
    number: "03",
    icon: GraduationCap,
    title: "Гурток описує програму",
    description:
      "Гурток публікує модулі, результати навчання, спосіб оцінювання і за потреби додає підсумок доказів.",
    highlight: "Дані гуртка",
  },
  {
    number: "04",
    icon: BrainCircuit,
    title: "AI формує рекомендаційний рівень",
    description:
      "Система порівнює програму гуртка з обраним шкільним предметом і показує обережну рекомендацію з поясненням.",
    highlight: "Підтримка рішення",
  },
  {
    number: "05",
    icon: FilePenLine,
    title: "Школа переглядає доказовий пакет",
    description:
      "Адміністрація бачить покриті результати, прогалини та рекомендовані докази, але приймає рішення самостійно.",
    highlight: "Розгляд школи",
  },
  {
    number: "06",
    icon: ClipboardList,
    title: "Фіксується фінальне рішення",
    description:
      "Школа зберігає погодження, часткове погодження, запит на зміни або відхилення і додає коментар для всіх учасників.",
    highlight: "Фінальний крок",
  },
];

export const aiFeatures = [
  {
    icon: CircleCheck,
    color: "#22c55e",
    title: "Оцінка сумісності",
    description: "Обережна оцінка сумісності без точного перенесення шкільних балів.",
  },
  {
    icon: Blocks,
    color: "#c084fc",
    title: "Покриті результати",
    description: "Які модулі та результати навчання виглядають релевантними для предмета.",
  },
  {
    icon: TriangleAlert,
    color: "#f2b318",
    title: "Прогалини і докази",
    description: "Що школа може попросити додати перед фінальним рішенням.",
  },
  {
    icon: Sparkles,
    color: "#60a5fa",
    title: "Рекомендована дія школи",
    description:
      "Кандидат на повне врахування, кандидат на часткове врахування або ручний розгляд як дорадчий висновок.",
  },
];

export const userCards = [
  {
    icon: Building2,
    badge: "Шкільний кабінет",
    cardClass: "school-role",
    title: "Для шкіл",
    description:
      "Прозора черга розгляду для тих, хто має ухвалити фінальне рішення щодо врахування позашкільної програми.",
    features: [
      "Перегляд вхідних запитів на врахування",
      "AI-рекомендація і пояснення прогалин",
      "Рішення: погодити / частково погодити / зміни / відхилити",
      "Коментар школи та визнані теми",
      "Єдиний пакет доказів по кожному запиту",
    ],
    note: "Школа приймає фінальне рішення, а не AI.",
  },
  {
    icon: HeartHandshake,
    badge: "Кабінет родини",
    cardClass: "parent-role",
    title: "Для батьків",
    description:
      "Родина додає дитину, обирає програму гуртка і відстежує статус запиту до школи.",
    features: [
      "Діти та прив'язка до школи",
      "Пошук програм з фільтрами",
      "Створення запиту на врахування",
      "Перегляд AI-підсумку і статусу школи",
      "Огляд фінального коментаря школи",
    ],
    note: "Платформа допомагає підготувати запит, але не гарантує його погодження.",
  },
  {
    icon: GraduationCap,
    badge: "Кабінет гуртка",
    cardClass: "provider-role",
    title: "Для гуртків",
    description:
      "Гурток структурує програму, запускає AI-попередній аналіз і додає доказовий пакет до конкретного запиту.",
    features: [
      "Програми з модулями та результатами навчання",
      "AI-аналіз для предмета і класу",
      "Підсумок доказів, відвідуваність, зовнішній рівень",
      "Перегляд пов'язаних запитів від родин",
      "Оновлення стану опубліковано / чернетка",
    ],
    note: "Гурток надає докази, а не автоматичне шкільне рішення.",
  },
];

export const trustGroups = [
  {
    title: "Продуктова чесність",
    description:
      "EduSync не обіцяє автоматичну заміну предмета, офіційні інтеграції чи юридично гарантовану еквівалентність.",
    cards: [
      {
        icon: BadgeCheck,
        title: "AI лише радить",
        description:
          "Рекомендаційний рівень показує аргументи і прогалини, але не підміняє шкільну комісію або адміністрацію.",
      },
      {
        icon: FileText,
        title: "Структурований пакет доказів",
        description:
          "Програма, результати навчання, спосіб оцінювання і короткі докази гуртка зберігаються в одному процесі.",
      },
      {
        icon: Users,
        title: "Чіткі ролі",
        description:
          "Родина створює запит, гурток додає докази, школа залишає фінальне рішення.",
      },
    ],
  },
  {
    title: "Безпечна MVP-архітектура",
    description:
      "Хакатонний MVP працює на рольовому доступі, збереженні даних у PostgreSQL і server-side AI викликах з fallback-логікою.",
    cards: [
      {
        icon: ArrowLeftRight,
        title: "Постійне збереження даних",
        description:
          "Діти, програми, запити, AI-аналіз і рішення школи зберігаються через Prisma та PostgreSQL.",
      },
      {
        icon: ShieldCheck,
        title: "Рольовий доступ",
        description:
          "Батьки, гуртки і школи бачать тільки власні сутності та пов'язані з ними запити.",
      },
      {
        icon: LockKeyhole,
        title: "Fallback для демо-режиму",
        description:
          "Якщо OpenAI ключ відсутній, рекомендаційний рівень формується детермінованою серверною евристикою.",
      },
    ],
  },
];

export const footerColumns = [
  {
    title: "Платформа",
    links: [
      { href: "#how", label: "Як це працює" },
      { href: "#ai", label: "AI-порівняння" },
      { href: "#dashboards", label: "Огляд платформи" },
      { href: "#trust", label: "Прозорість" },
    ],
  },
  {
    title: "Для користувачів",
    links: [
      { href: "#users", label: "Для шкіл" },
      { href: "#users", label: "Для батьків" },
      { href: "#users", label: "Для гуртків" },
      { href: "#cta", label: "Почати" },
    ],
  },
  {
    title: "Примітка",
    links: [
      { href: "#trust", label: "AI не ухвалює рішення" },
      { href: "#trust", label: "Немає автоматичного зарахування" },
      { href: "#trust", label: "Фінальне слово за школою" },
      { href: "#footer", label: "Контакти" },
    ],
  },
  {
    title: "Юридичне",
    links: [
      { href: "#footer", label: "Політика конфіденційності" },
      { href: "#footer", label: "Умови використання" },
      { href: "#footer", label: "Документи" },
      { href: "#footer", label: "Відповідність вимогам" },
    ],
  },
];

export const registerRoles = [
  {
    role: "school",
    tone: "blue",
    icon: School,
    eyebrow: "Шкільний профіль",
    title: "Для шкіл",
    description: "Черга розгляду, AI-панель і фінальне рішення школи в одному кабінеті.",
    features: [
      "Вхідні запити на врахування",
      "AI-рекомендація",
      "Покриті результати та прогалини",
      "Коментар школи і статус рішення",
    ],
    actionLabel: "Продовжити як школа",
    guestLabel: "Подивитися демо",
    note: "Підійде адміністрації та командам, що відповідають за розгляд запитів.",
  },
  {
    role: "parent",
    tone: "purple",
    icon: UsersRound,
    eyebrow: "Профіль родини",
    title: "Для батьків та учнів",
    description:
      "Діти, каталог програм і запити до школи без фейкових обіцянок щодо автоматичного зарахування.",
    features: [
      "Додавання дітей",
      "Пошук програм з фільтрами",
      "Створення запиту на врахування",
      "AI-підсумок і статус школи",
    ],
    actionLabel: "Продовжити як родина",
    guestLabel: "Подивитися демо",
    note: "Для родин, яким потрібен зрозумілий і документований процес.",
  },
  {
    role: "club",
    tone: "green",
    icon: GraduationCap,
    eyebrow: "Профіль гуртка",
    title: "Для гуртків",
    description:
      "Програми, AI-попередній аналіз та підсумок доказів для шкільного розгляду у межах одного MVP.",
    features: [
      "Структуровані програми",
      "AI-аналіз для предмета і класу",
      "Підсумок доказів та відвідуваність",
      "Перегляд запитів до програм",
    ],
    actionLabel: "Продовжити як гурток",
    guestLabel: "Подивитися демо",
    note: "Для провайдерів, які хочуть показати програму школі зрозуміло і структуровано.",
  },
];

export const dashboardData = {
  school: {
    title: "Шкільний кабінет",
    description: "Приклад того, що школа бачить у черзі розгляду.",
    chips: ["4 демо-запити", "AI-рекомендація з поясненням"],
    metrics: [
      {
        icon: UsersRound,
        label: "У черзі",
        value: "4",
        color: "#2563ff",
        border: "#bfd8ff",
      },
      {
        icon: ClipboardList,
        label: "Готові до рішення",
        value: "2",
        color: "#9333ea",
        border: "#ead5ff",
      },
      {
        icon: GraduationCap,
        label: "Уже вирішені",
        value: "2",
        color: "#16a34a",
        border: "#bbf7d0",
      },
    ],
    rows: [
      {
        title: "Марта Коваль",
        description: "Англійська мова → English Intensive for Teens",
        badge: "AI готовий",
        badgeClass: "reviewing",
      },
      {
        title: "Софія Мельник",
        description: "Мистецтво → Фортепіано та музична практика",
        badge: "Погоджено",
        badgeClass: "approved",
      },
      {
        title: "Денис Коваль",
        description: "Інформатика → Robotics Lab Junior",
        badge: "Потрібні зміни",
        badgeClass: "pending",
      },
    ],
  },
  parent: {
    title: "Батьківський кабінет",
    description: "Приклад реального шляху батьків у межах MVP.",
    chips: ["2 дитини", "AI-підсумок збережено в запиті"],
    metrics: [
      {
        icon: UserRound,
        label: "Діти",
        value: "2",
        color: "#2563ff",
        border: "#bfd8ff",
      },
      {
        icon: BrainCircuit,
        label: "Активні запити",
        value: "2",
        color: "#9333ea",
        border: "#ead5ff",
      },
      {
        icon: FileText,
        label: "Фінальні рішення",
        value: "2",
        color: "#16a34a",
        border: "#bbf7d0",
      },
    ],
    rows: [
      {
        title: "English Intensive for Teens",
        description: "AI-підсумок збережено · школа ще розглядає запит",
        badge: "AI готовий",
        badgeClass: "reviewing",
      },
      {
        title: "Swimming Focus",
        description: "Школа погодила часткове врахування з власним коментарем",
        badge: "Частково погоджено",
        badgeClass: "approved",
      },
      {
        title: "Robotics Lab Junior",
        description: "Школа попросила додаткові критерії оцінювання",
        badge: "Потрібні зміни",
        badgeClass: "pending",
      },
    ],
  },
  club: {
    title: "Кабінет гуртка",
    description: "Приклад інтерфейсу для керування програмами, AI-попереднього аналізу та додавання доказів.",
    chips: ["5 демо-програм", "1 запит без доказів"],
    metrics: [
      {
        icon: BookOpenCheck,
        label: "Програми",
        value: "5",
        color: "#2563ff",
        border: "#bfd8ff",
      },
      {
        icon: School,
        label: "Запити до програм",
        value: "4",
        color: "#9333ea",
        border: "#ead5ff",
      },
      {
        icon: LibraryBig,
        label: "Потрібні докази",
        value: "1",
        color: "#16a34a",
        border: "#bbf7d0",
      },
    ],
    rows: [
      {
        title: "English Intensive for Teens",
        description: "Сильна AI-рекомендація для предмета «Англійська мова»",
        badge: "AI-аналіз",
        badgeClass: "approved",
      },
      {
        title: "Robotics Lab Junior",
        description: "Школа просить уточнити індивідуальні критерії оцінювання",
        badge: "Оновити докази",
        badgeClass: "pending",
      },
      {
        title: "Swimming Focus",
        description: "Є часткове рішення школи та коментар щодо нормативів",
        badge: "Рішення збережено",
        badgeClass: "active",
      },
    ],
  },
} as const;

export type DashboardTab = keyof typeof dashboardData;
