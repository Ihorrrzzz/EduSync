import {
  BookOpenCheck,
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

export type FormSectionConfig = {
  title: string;
  description: string;
  submitLabel: string;
  fields: FormField[];
  statusMessage?: string;
};

export type FeedbackSectionConfig = FormSectionConfig & {
  badgeLabel: string;
  summaryTitle: string;
  summaryDescription: string;
  highlights: string[];
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
  formStatusMessage?: string;
  fields: FormField[];
  groupSearchForm?: FormSectionConfig;
  feedbackForm?: FeedbackSectionConfig;
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
      { icon: FileText, label: "Активні запити", value: "3", color: "#2563ff", border: "#bfd8ff" },
      { icon: ClipboardList, label: "У очікуванні", value: "1", color: "#9333ea", border: "#ead5ff" },
      { icon: UserRound, label: "Отримано відповідей", value: "2", color: "#16a34a", border: "#bbf7d0" },
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
    formStatusMessage:
      "Чернетку запиту збережено. Після підключення API її можна буде надіслати до школи.",
    fields: [
      {
        name: "childName",
        label: "Учень",
        placeholder: "Оберіть дитину",
        type: "select",
        options: [
          { value: "anna-petrova", label: "Анна Петрова, 9-Б" },
          { value: "maksym-petrov", label: "Максим Петров, 6-А" },
        ],
      },
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
    groupSearchForm: {
      title: "Обрати групу",
      description:
        "Оберіть дитину, напрям і формат занять, щоб надалі шукати в системі групи, які співпрацюють зі школою, де навчається учень.",
      submitLabel: "Підібрати групи",
      statusMessage:
        "Критерії збережено. Наступним кроком тут можна буде виконати пошук партнерських груп у системі.",
      fields: [
        {
          name: "groupChild",
          label: "Дитина",
          placeholder: "Оберіть дитину",
          type: "select",
          options: [
            { value: "anna-petrova", label: "Анна Петрова, 9-Б" },
            { value: "maksym-petrov", label: "Максим Петров, 6-А" },
          ],
        },
        {
          name: "direction",
          label: "Напрям",
          placeholder: "Оберіть напрям",
          type: "select",
          options: [
            { value: "english", label: "Англійська мова" },
            { value: "music", label: "Музика / фортепіано" },
            { value: "swimming", label: "Плавання" },
            { value: "robotics", label: "Робототехніка" },
          ],
        },
        {
          name: "format",
          label: "Формат занять",
          placeholder: "Оберіть формат",
          type: "select",
          options: [
            { value: "offline", label: "Очні заняття" },
            { value: "online", label: "Онлайн" },
            { value: "hybrid", label: "Змішаний формат" },
          ],
        },
      ],
    },
    feedbackForm: {
      title: "Надіслати відгук",
      description:
        "Поділіться враженнями від роботи кабінету батьків, пошуку груп і подання заявок, щоб ми точніше пріоритезували покращення.",
      submitLabel: "Надіслати відгук",
      statusMessage:
        "Відгук збережено як демонстраційний запис. Його можна буде передати команді продукту після підключення API.",
      badgeLabel: "Parent Feedback",
      summaryTitle: "Які сигнали ми збираємо від родин",
      summaryDescription:
        "Найцінніші відгуки для батьківського кабінету показують, де процес можна зробити коротшим, зрозумілішим і менш стресовим для родини.",
      highlights: [
        "Наскільки просто знайти відповідну групу та зібрати заявку без зайвих кроків.",
        "Чи достатньо зрозумілі статуси погодження школи та наступні дії після подання.",
        "Яких сповіщень, підказок або даних про прогрес дитини бракує в щоденному сценарії.",
      ],
      fields: [
        {
          name: "feedbackArea",
          label: "Тема відгуку",
          placeholder: "Оберіть тему",
          type: "select",
          options: [
            { value: "groups", label: "Пошук груп і програм" },
            { value: "requests", label: "Подання та відстеження заявок" },
            { value: "reports", label: "Звіти та прогрес дитини" },
            { value: "notifications", label: "Сповіщення та комунікація" },
          ],
        },
        {
          name: "feedbackType",
          label: "Тип відгуку",
          placeholder: "Оберіть варіант",
          type: "select",
          options: [
            { value: "praise", label: "Що подобається" },
            { value: "improvement", label: "Що варто покращити" },
            { value: "issue", label: "Що заважає користуванню" },
          ],
        },
        {
          name: "rating",
          label: "Оцінка досвіду",
          placeholder: "Оберіть оцінку",
          type: "select",
          options: [
            { value: "5", label: "5 / 5" },
            { value: "4", label: "4 / 5" },
            { value: "3", label: "3 / 5" },
            { value: "2", label: "2 / 5" },
            { value: "1", label: "1 / 5" },
          ],
        },
        {
          name: "message",
          label: "Коментар",
          type: "textarea",
          placeholder: "Опишіть, що спрацювало добре або який крок варто зробити простішим.",
          span: "full",
        },
      ],
    },
    insights: [],
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
    formStatusMessage:
      "Рішення збережено в чернетці. Після підключення API його можна буде передати батькам і партнерському гуртку.",
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
    feedbackForm: {
      title: "Зворотний зв'язок від школи",
      description:
        "Зафіксуйте, де в шкільному кабінеті є зайві ручні кроки, чого бракує для швидкого погодження та як покращити координацію з родинами і гуртками.",
      submitLabel: "Передати відгук",
      statusMessage:
        "Відгук школи збережено як демонстраційний запис. Його можна буде передати команді продукту після підключення API.",
      badgeLabel: "School Feedback",
      summaryTitle: "На що орієнтуємося у відгуках шкіл",
      summaryDescription:
        "Для адміністраторів і координаторів важливо зменшувати час на погодження, підписи, перевірку програм та обмін коментарями з учасниками процесу.",
      highlights: [
        "Де черга заявок, рішення або документи потребують більше контексту прямо в інтерфейсі.",
        "Яких статусів, фільтрів чи узгоджувальних кроків не вистачає для адміністративної команди.",
        "Які сценарії перевірки програм і партнерств варто автоматизувати насамперед.",
      ],
      fields: [
        {
          name: "feedbackArea",
          label: "Напрям відгуку",
          placeholder: "Оберіть напрям",
          type: "select",
          options: [
            { value: "approvals", label: "Погодження заявок" },
            { value: "documents", label: "Документи та підписи" },
            { value: "partners", label: "Партнерства з гуртками" },
            { value: "reporting", label: "Звіти та перенесення результатів" },
          ],
        },
        {
          name: "impact",
          label: "Рівень впливу",
          placeholder: "Оберіть вплив",
          type: "select",
          options: [
            { value: "critical", label: "Критично для роботи" },
            { value: "noticeable", label: "Помітно уповільнює процес" },
            { value: "minor", label: "Невелике покращення" },
          ],
        },
        {
          name: "audience",
          label: "Кого стосується",
          placeholder: "Оберіть роль",
          type: "select",
          options: [
            { value: "admin", label: "Адміністрація школи" },
            { value: "teachers", label: "Педагоги та координатори" },
            { value: "all", label: "Усі учасники процесу" },
          ],
        },
        {
          name: "message",
          label: "Опис відгуку",
          type: "textarea",
          placeholder: "Опишіть, на якому кроці виникає затримка або яке покращення заощадить час команді школи.",
          span: "full",
        },
      ],
    },
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
    formStatusMessage:
      "Чернетку пакета збережено. Після підключення API її можна буде відправити школі або оновити в системі.",
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
    feedbackForm: {
      title: "Відгук від гуртка",
      description:
        "Розкажіть, що варто покращити в роботі з програмами, партнерськими школами та цифровими звітами, щоб кабінет економив час команди гуртка.",
      submitLabel: "Надіслати відгук",
      statusMessage:
        "Відгук гуртка збережено як демонстраційний запис. Його можна буде передати команді продукту після підключення API.",
      badgeLabel: "Club Feedback",
      summaryTitle: "Що важливо чути від гуртків",
      summaryDescription:
        "Для позашкільних провайдерів критично, щоб подання програм, передавання результатів і робота з партнерами не вимагали дублювання даних у різних системах.",
      highlights: [
        "Які дані про програму або групу варто підтягувати автоматично замість повторного введення.",
        "Де координація зі школами та родинами потребує швидших статусів або шаблонів комунікації.",
        "Яких інструментів бракує для масового надсилання звітів, відвідуваності та результатів навчання.",
      ],
      fields: [
        {
          name: "feedbackArea",
          label: "Тема відгуку",
          placeholder: "Оберіть тему",
          type: "select",
          options: [
            { value: "programs", label: "Подання програм" },
            { value: "schools", label: "Співпраця зі школами" },
            { value: "reports", label: "Звіти та оцінювання" },
            { value: "operations", label: "Щоденні операції команди" },
          ],
        },
        {
          name: "effect",
          label: "Очікуваний ефект",
          placeholder: "Оберіть результат",
          type: "select",
          options: [
            { value: "save-time", label: "Заощадити час команди" },
            { value: "reduce-errors", label: "Зменшити помилки" },
            { value: "expand-scale", label: "Підтримати більше партнерств" },
          ],
        },
        {
          name: "priority",
          label: "Пріоритет",
          placeholder: "Оберіть пріоритет",
          type: "select",
          options: [
            { value: "now", label: "Потрібно зараз" },
            { value: "next", label: "Варто зробити наступним етапом" },
            { value: "later", label: "Можна запланувати пізніше" },
          ],
        },
        {
          name: "message",
          label: "Деталі",
          type: "textarea",
          placeholder: "Опишіть, який сценарій потрібно прискорити або автоматизувати в кабінеті гуртка.",
          span: "full",
        },
      ],
    },
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
