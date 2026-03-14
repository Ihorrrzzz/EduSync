import {
  BookOpenCheck,
  BrainCircuit,
  ClipboardList,
  FileText,
  GraduationCap,
  LibraryBig,
  type LucideIcon,
  School,
  UserRound,
  UsersRound,
} from "lucide-react";
import type { ProfileRole } from "./api";

export type BadgeTone = "pending" | "approved" | "reviewing" | "active";

export type DashboardMetric = {
  icon: LucideIcon;
  label: string;
  value: string;
  color: string;
  border: string;
};

export type DashboardRow = {
  title: string;
  description: string;
  badge: string;
  tone: BadgeTone;
};

export type InsightCard = {
  title: string;
  description: string;
  tone: string;
};

export type AiAnalysisConfig = {
  title: string;
  description: string;
  submitLabel: string;
  summaryTitle: string;
  summaryText: string;
  bullets: string[];
};

export type FormField = {
  name: string;
  label: string;
  placeholder?: string;
  type?: "text" | "textarea" | "select";
  options?: Array<{ label: string; value: string }>;
  span?: "full" | "half";
};

export type DashboardConfig = {
  roleLabel: string;
  heroTitle: string;
  heroDescription: string;
  heroNotes: string[];
  metrics: DashboardMetric[];
  rowsTitle: string;
  rowsDescription: string;
  rows: DashboardRow[];
  formTitle: string;
  formDescription: string;
  formSubmitLabel: string;
  fields: FormField[];
  aiAnalysis?: AiAnalysisConfig;
  insights: InsightCard[];
};

export const dashboardConfigs: Record<ProfileRole, DashboardConfig> = {
  parent: {
    roleLabel: "Батьківський кабінет",
    heroTitle: "Контролюйте освітній маршрут дитини без розриву між школою та гуртком.",
    heroDescription:
      "У цьому кабінеті ви відстежуєте активні маршрути, погодження школи, AI-збіги програм та швидко створюєте нові запити на заміну предметів.",
    heroNotes: [
      "AI-збіги програм і пояснення прогалин",
      "Статуси погодження школи в реальному часі",
      "Прогрес, відвідуваність і цифрові документи в одному місці",
    ],
    metrics: [
      { icon: UserRound, label: "Підключені діти", value: "2", color: "#2563ff", border: "#bfd8ff" },
      { icon: BrainCircuit, label: "AI-збіги", value: "14", color: "#9333ea", border: "#ead5ff" },
      { icon: FileText, label: "Активні запити", value: "3", color: "#16a34a", border: "#bbf7d0" },
    ],
    rowsTitle: "Активні маршрути та заявки",
    rowsDescription: "Поточні рішення школи та останні синхронізовані маршрути.",
    rows: [
      {
        title: "Запит на заміну англійської",
        description: "Рівень відповідності 92% · школа ще розглядає заявку",
        badge: "У розгляді",
        tone: "reviewing",
      },
      {
        title: "Маршрут з фортепіано",
        description: "Відвідуваність 100% · доступний новий місячний звіт",
        badge: "Активно",
        tone: "approved",
      },
      {
        title: "Програма з плавання",
        description: "Угоду підписано · перенесення оцінок готове",
        badge: "Синхронізовано",
        tone: "active",
      },
    ],
    formTitle: "Новий запит на зарахування",
    formDescription:
      "Підготуйте короткий запит для школи з даними про програму та предмет, який потрібно замінити.",
    formSubmitLabel: "Надіслати запит",
    fields: [
      { name: "childName", label: "Учень", placeholder: "Ім'я дитини" },
      { name: "subject", label: "Шкільний предмет", placeholder: "Наприклад, Англійська мова" },
      { name: "provider", label: "Заклад / гурток", placeholder: "Назва провайдера" },
      {
        name: "requestType",
        label: "Формат заявки",
        type: "select",
        options: [
          { value: "full", label: "Повна заміна предмета" },
          { value: "partial", label: "Часткове зарахування" },
        ],
      },
      {
        name: "note",
        label: "Коментар для школи",
        type: "textarea",
        placeholder: "Коротко опишіть очікування або додаткові деталі",
        span: "full",
      },
    ],
    insights: [
      {
        title: "Найкращий AI-збіг",
        description: "English Intensive Program покриває 92% програми 9 класу.",
        tone: "bg-blue-50 border-blue-100 text-blue-900",
      },
      {
        title: "Що варто додати",
        description: "Для повної заміни бракує лише модуля з письма та есе.",
        tone: "bg-amber-50 border-amber-100 text-amber-900",
      },
    ],
  },
  school: {
    roleLabel: "Шкільний кабінет",
    heroTitle: "Керуйте погодженнями, партнерствами та мережевим навчанням у єдиному дашборді.",
    heroDescription:
      "Шкільний інтерфейс фокусується на перевірці заявок, рішенні щодо замін предметів і координації з позашкільними закладами.",
    heroNotes: [
      "Оперативний список заявок від батьків",
      "Контроль перенесення оцінок і звітів",
      "Партнерські гуртки та цифрові домовленості",
    ],
    metrics: [
      { icon: UsersRound, label: "Активні учні", value: "847", color: "#2563ff", border: "#bfd8ff" },
      { icon: ClipboardList, label: "Запити на розгляді", value: "24", color: "#9333ea", border: "#ead5ff" },
      { icon: GraduationCap, label: "Партнерські гуртки", value: "12", color: "#16a34a", border: "#bbf7d0" },
    ],
    rowsTitle: "Черга заявок та погоджень",
    rowsDescription: "Останні запити, які потребують рішення або фінального підпису.",
    rows: [
      {
        title: "Анна Петрова",
        description: "Англійська мова → Мовний центр International",
        badge: "Очікує",
        tone: "pending",
      },
      {
        title: "Іван Сидоров",
        description: "Музичне мистецтво → City Music Academy",
        badge: "Схвалено",
        tone: "approved",
      },
      {
        title: "Марія Іванова",
        description: "Фізична культура → Sports Complex Olymp",
        badge: "Розгляд",
        tone: "reviewing",
      },
    ],
    formTitle: "Форма рішення школи",
    formDescription:
      "Зафіксуйте рішення щодо заявки та додайте коментар для батьків і гуртка.",
    formSubmitLabel: "Зберегти рішення",
    fields: [
      { name: "student", label: "Учень", placeholder: "ПІБ учня" },
      { name: "subject", label: "Предмет", placeholder: "Який предмет розглядається" },
      { name: "provider", label: "Освітній провайдер", placeholder: "Назва гуртка або центру" },
      {
        name: "decision",
        label: "Рішення",
        type: "select",
        options: [
          { value: "approve", label: "Схвалити" },
          { value: "review", label: "Повернути на доопрацювання" },
          { value: "reject", label: "Відхилити" },
        ],
      },
      {
        name: "note",
        label: "Коментар школи",
        type: "textarea",
        placeholder: "Поясніть рішення або зафіксуйте, чого бракує для затвердження",
        span: "full",
      },
    ],
    aiAnalysis: {
      title: "Аналізувати програму гуртка за допомогою AI",
      description:
        "Додайте опис програми гуртка, щоб швидко побачити її сумісність зі шкільним предметом до ухвалення рішення.",
      submitLabel: "Запустити AI-аналіз",
      summaryTitle: "Попередній висновок для школи",
      summaryText:
        "AI показує, що програма достатньо близька до очікуваних результатів навчання і може бути винесена на погодження після короткої ручної перевірки.",
      bullets: [
        "Орієнтовний збіг із предметом: 91%",
        "Добре покриті: тематичні модулі, практичні вправи, регулярність занять",
        "Потребує перевірки: критерії оцінювання та фінальний формат звітності",
      ],
    },
    insights: [
      {
        title: "Швидкий пріоритет",
        description: "7 запитів цього тижня мають AI-збіг вище 90% і готові до підпису.",
        tone: "bg-emerald-50 border-emerald-100 text-emerald-900",
      },
      {
        title: "Зона ризику",
        description: "3 нові програми потребують ручної перевірки навчальних модулів.",
        tone: "bg-amber-50 border-amber-100 text-amber-900",
      },
    ],
  },
  club: {
    roleLabel: "Кабінет гуртка",
    heroTitle: "Публікуйте програми, працюйте зі школами та надсилайте звіти без зайвої ручної роботи.",
    heroDescription:
      "У кабінеті гуртка зібрано керування програмами, партнерськими школами, відвідуваністю, оцінками та щомісячними звітами.",
    heroNotes: [
      "Публікація та оновлення освітніх програм",
      "Оперативні запити від шкіл та батьків",
      "Передавання звітів і результатів у стандартизованому форматі",
    ],
    metrics: [
      { icon: BookOpenCheck, label: "Опубліковані програми", value: "18", color: "#2563ff", border: "#bfd8ff" },
      { icon: School, label: "Партнерські школи", value: "15", color: "#9333ea", border: "#ead5ff" },
      { icon: LibraryBig, label: "Звітів цього місяця", value: "41", color: "#16a34a", border: "#bbf7d0" },
    ],
    rowsTitle: "Програми та активні взаємодії",
    rowsDescription: "Стан навчальних програм, угод і щотижневих відправлень у школи.",
    rows: [
      {
        title: "Програма English Intensive",
        description: "Відповідність 92% · готова до подання в школу",
        badge: "Перевірено",
        tone: "approved",
      },
      {
        title: "Нова угода зі школою №127",
        description: "Потрібен підпис директора та активація співпраці",
        badge: "Очікує",
        tone: "pending",
      },
      {
        title: "Звіт з відвідуваності",
        description: "Група англійської для 9 класу · надіслано цього тижня",
        badge: "Надіслано",
        tone: "active",
      },
    ],
    formTitle: "Подання програми або звіту",
    formDescription:
      "Заповніть форму для нової програми, синхронізації зі школою або відправлення звітного пакета.",
    formSubmitLabel: "Підготувати пакет",
    fields: [
      { name: "program", label: "Програма", placeholder: "Назва програми або групи" },
      { name: "school", label: "Школа", placeholder: "Партнерська школа" },
      { name: "subject", label: "Предметна відповідність", placeholder: "Наприклад, Англійська мова" },
      {
        name: "packageType",
        label: "Тип пакета",
        type: "select",
        options: [
          { value: "program", label: "Нова програма" },
          { value: "report", label: "Щомісячний звіт" },
          { value: "grades", label: "Пакет оцінок" },
        ],
      },
      {
        name: "note",
        label: "Опис або супровідний коментар",
        type: "textarea",
        placeholder: "Вкажіть результат, прогрес групи або короткий коментар для школи",
        span: "full",
      },
    ],
    aiAnalysis: {
      title: "Аналізувати програму гуртка за допомогою AI",
      description:
        "Перевірте, як ваша програма виглядає відносно шкільного предмета, перш ніж надсилати її на перевірку або узгодження.",
      submitLabel: "Перевірити програму",
      summaryTitle: "Попередній висновок для гуртка",
      summaryText:
        "AI визначає, що програма має сильну предметну основу і підходить для подання до школи як кандидат на часткове або повне зарахування.",
      bullets: [
        "Орієнтовний збіг зі шкільною програмою: 90%",
        "Сильні сторони: практичні модулі, регулярні оцінювання, читання і speaking",
        "Що підсилити: опис навчальних результатів і деталізацію підсумкових робіт",
      ],
    },
    insights: [
      {
        title: "Найсильніша програма",
        description: "English Intensive стабільно зберігає рівень відповідності понад 90%.",
        tone: "bg-blue-50 border-blue-100 text-blue-900",
      },
      {
        title: "Наступний крок",
        description: "Школа №127 очікує оновлений тематичний план для активації договору.",
        tone: "bg-violet-50 border-violet-100 text-violet-900",
      },
    ],
  },
};

export const badgeClasses: Record<BadgeTone, string> = {
  pending: "bg-amber-100 text-amber-800",
  approved: "bg-emerald-100 text-emerald-800",
  reviewing: "bg-blue-100 text-blue-800",
  active: "bg-violet-100 text-violet-800",
};
