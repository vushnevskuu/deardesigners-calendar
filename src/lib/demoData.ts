import type {
  CalendarProject,
  CalendarPublishSettings,
  EventItem,
  ExportSettings,
  HomepageSettings,
  MaterialItem,
  RawTelegramMessage,
  ThemeSettings,
} from "./types";

const NOW_ISO = new Date().toISOString();

function mkMaterial(
  id: string,
  section: string,
  title: string,
  type: MaterialItem["type"] = "other",
  url?: string,
  description?: string,
): MaterialItem {
  return {
    id,
    section,
    title,
    type,
    url,
    description,
    createdAt: NOW_ISO,
    updatedAt: NOW_ISO,
  };
}

export const DEMO_MATERIALS: MaterialItem[] = [
  // 1. Цены и ценность
  mkMaterial("m-price-1", "Цены и ценность", "Сколько теперь стоит право на ошибку", "discussion"),
  mkMaterial("m-price-2", "Цены и ценность", "Как поднять цену и не потерять клиентов", "lecture"),
  mkMaterial("m-price-3", "Цены и ценность", "Коммерческое предложение: смета или презентация", "case"),
  mkMaterial("m-price-4", "Цены и ценность", "Дизайн спорной формы", "discussion"),

  // 2. Переговоры
  mkMaterial("m-neg-1", "Переговоры", "Как отвечать, когда спрашивают про цену", "practice"),
  mkMaterial("m-neg-2", "Переговоры", "Как реагировать на мутный фидбек", "practice"),
  mkMaterial("m-neg-3", "Переговоры", "Как не слить дизайн-интент", "lecture"),
  mkMaterial("m-neg-4", "Переговоры", "Когда говорить «нет» проекту", "discussion"),

  // 3. Зумки и обсуждения
  mkMaterial("m-zoom-1", "Зумки и обсуждения", "Ворман: онлайн-болталка по средам", "discussion"),
  mkMaterial("m-zoom-2", "Зумки и обсуждения", "Закрытый чат клуба", "link", "https://t.me/+deardesigners"),
  mkMaterial("m-zoom-3", "Зумки и обсуждения", "Конспекты прошлых зумок", "reference"),

  // 4. Разборы и ОС
  mkMaterial("m-rev-1", "Разборы и ОС", "Портфолио-ревью: смотрим прогресс и даём ОС", "case"),
  mkMaterial("m-rev-2", "Разборы и ОС", "Как одна вставка в макет всё меняет", "case"),
  mkMaterial("m-rev-3", "Разборы и ОС", "Детали, которые меняют восприятие", "case"),
  mkMaterial("m-rev-4", "Разборы и ОС", "Ошибки как ступени роста", "discussion"),

  // 5. Референсы
  mkMaterial("m-ref-1", "Референсы", "Как выйти из пузыря Pinterest", "lecture"),
  mkMaterial("m-ref-2", "Референсы", "Подборка постеров", "reference", "https://www.are.na/dear-designers/posters"),
  mkMaterial("m-ref-3", "Референсы", "Флаеры с безумной типографикой", "reference"),
  mkMaterial("m-ref-4", "Референсы", "Обложки Грамми", "reference"),
  mkMaterial("m-ref-5", "Референсы", "Стили театра", "reference"),

  // 6. Люди и индустрия
  mkMaterial("m-ppl-1", "Люди и индустрия", "Студия Principal", "portfolio", "https://principal.studio"),
  mkMaterial("m-ppl-2", "Люди и индустрия", "Проект GIRL", "portfolio"),
  mkMaterial("m-ppl-3", "Люди и индустрия", "Лого I ♥ NY", "case"),
  mkMaterial("m-ppl-4", "Люди и индустрия", "Новые иконки Google", "discussion"),

  // 7. Глупые вопросы
  mkMaterial("m-q-1", "Глупые вопросы", "Что такое дизайн-система на самом деле", "discussion"),
  mkMaterial("m-q-2", "Глупые вопросы", "Как объяснить маме, чем ты занимаешься", "discussion"),
  mkMaterial("m-q-3", "Глупые вопросы", "Почему проект всегда падает в последний день", "discussion"),

  // 8. Загадки
  mkMaterial("m-rid-1", "Загадки", "Клон брендо-подростков", "case"),
  mkMaterial("m-rid-2", "Загадки", "Угадай студию по логотипу", "exercise"),
  mkMaterial("m-rid-3", "Загадки", "Дизайн-ребус месяца", "exercise"),

  // 9. Рекомендации
  mkMaterial("m-rec-1", "Рекомендации", "Книги о ремесле дизайнера", "recommendation"),
  mkMaterial("m-rec-2", "Рекомендации", "Подкасты для дороги", "recommendation"),
  mkMaterial("m-rec-3", "Рекомендации", "Лонгриды месяца", "recommendation"),
  mkMaterial("m-rec-4", "Рекомендации", "Туториалы по After Effects", "recommendation", "https://motiondesign.school"),

  // 10. Я вам покажу!
  mkMaterial("m-show-1", "Я вам покажу!", "Свежие работы участников", "portfolio"),
  mkMaterial("m-show-2", "Я вам покажу!", "Проекты, которые делаются в фоне", "portfolio"),
  mkMaterial("m-show-3", "Я вам покажу!", "Скетчи и черновики", "portfolio"),
  mkMaterial("m-show-4", "Я вам покажу!", "Эксперименты с анимацией", "portfolio"),
];

const MONTH = "2026-06";
const ID = (n: number) => `e-2026-06-${String(n).padStart(2, "0")}`;

export const DEMO_EVENTS: EventItem[] = [
  {
    id: ID(1),
    date: "2026-06-01",
    time: "20:00",
    type: "chat",
    title: "Ворман: онлайн-болталка",
    cardStyle: "minimal",
    description: "Свободный созвон сообщества. Темы рождаются на месте.",
  },
  {
    id: ID(2),
    date: "2026-06-02",
    time: "19:30",
    type: "ui-circle",
    title: "UI-кружок: копирование",
    cardStyle: "photo",
    description: "Учимся видеть детали, копируя кусок интерфейса по референсу.",
  },
  {
    id: ID(3),
    date: "2026-06-04",
    time: "19:00",
    type: "talk",
    title: "Лекция по работе с референсами",
    cardStyle: "photo",
    description: "Как искать, систематизировать и не превращаться в копию пинтереста.",
  },
  {
    id: ID(4),
    date: "2026-06-08",
    time: "20:00",
    type: "chat",
    title: "Ворман: онлайн-болталка",
    cardStyle: "minimal",
    description: "Свободный созвон сообщества по средам.",
  },
  {
    id: ID(5),
    date: "2026-06-09",
    time: "19:00",
    type: "practice",
    title: "Практика по работе с референсами",
    cardStyle: "photo",
    description: "Разбираем референсы, стили театра и обложки Грамми. Собираем мудборд и защищаем выбор перед клубом.",
  },
  {
    id: ID(6),
    date: "2026-06-11",
    time: "11:00",
    type: "coworking",
    title: "Онлайн-коворкинг под LoFi",
    cardStyle: "icon",
    description: "Тихая совместная работа с lofi-подкладкой и парой кофе-брейков.",
  },
  {
    id: ID(7),
    date: "2026-06-13",
    time: "18:00",
    type: "offline",
    title: "Оффлайн-встреча клуба",
    cardStyle: "photo",
    description: "Встречаемся вживую: показы, разговоры, портвейн.",
  },
  {
    id: ID(8),
    date: "2026-06-15",
    time: "20:00",
    type: "chat",
    title: "Ворман: онлайн-болталка",
    cardStyle: "minimal",
    description: "Свободный созвон сообщества по средам.",
  },
  {
    id: ID(9),
    date: "2026-06-16",
    time: "19:30",
    type: "ui-circle",
    title: "UI-кружок: редизайн",
    cardStyle: "photo",
    description: "Берём знакомый продукт и аккуратно его переосмысляем.",
  },
  {
    id: ID(10),
    date: "2026-06-18",
    time: "19:00",
    type: "talk",
    title: "Поиск IKIGAI: что вам подходит в дизайне и жизни",
    cardStyle: "text-only",
    description: "Лекция-разговор о том, как сверяться с собой и не выгорать.",
  },
  {
    id: ID(11),
    date: "2026-06-23",
    time: "19:00",
    type: "talk",
    title: "Как примерять вайбкодинг на работе",
    cardStyle: "text-only",
    description: "Когда AI-ассистенты помогают, а когда мешают думать дизайнеру.",
  },
  {
    id: ID(12),
    date: "2026-06-25",
    time: "20:00",
    type: "discussion",
    title: "Онлайн-дискуссия",
    cardStyle: "minimal",
    description: "Тема набирается голосованием в чате клуба.",
  },
  {
    id: ID(13),
    date: "2026-06-26",
    time: "11:00",
    type: "breakfast",
    title: "Завтрак на веранде",
    cardStyle: "photo",
    description: "Тёплое утро, сырники, разговоры без повестки.",
  },
  {
    id: ID(14),
    date: "2026-06-29",
    time: "20:00",
    type: "chat",
    title: "Ворман: онлайн-болталка",
    cardStyle: "minimal",
    description: "Свободный созвон сообщества по средам.",
  },
  {
    id: ID(15),
    date: "2026-06-30",
    time: "19:30",
    type: "portfolio",
    title: "Портфолио-ревью: смотрим прогресс и даём ОС",
    cardStyle: "photo",
    description: "Каждый показывает, что собрано за месяц. Тёплая обратная связь.",
  },
];

const DEFAULT_THEME: ThemeSettings = {
  name: "Off-white editorial",
  backgroundStyle: "paper",
  accentColor: "#d94a1f",
  radius: "round",
  density: "normal",
};

const DEFAULT_EXPORT: ExportSettings = {
  preset: "instagram-portrait",
  showPastEvents: true,
  showMaterials: true,
  showEventImages: true,
  compactMode: false,
  includeHeader: true,
  includeMonthTitle: true,
  scale: 2,
};

export const DEFAULT_HOMEPAGE_SETTINGS: HomepageSettings = {
  defaultMonthMode: "current",
  presentationMode: "upcoming",
  showHeroText: true,
  showCTA: true,
  ctaLabel: "Вступить в клуб",
  ctaUrl: "https://t.me/+deardesigners",
  showTelegramLinks: true,
  showPastEventsStrip: true,
  showMaterials: true,
  showArchiveToggle: true,
  headline: "Месяц в Дорогих дизайнерах",
  subtitle:
    "Встречи, разборы, болталки, практики и материалы из закрытого сообщества.",
};

export const DEFAULT_PUBLISH_SETTINGS: CalendarPublishSettings = {
  visibility: "public",
  showTelegramLinks: true,
  showPrivateContentHints: true,
  showImagesInPublicHomepage: true,
  showMaterialsInPublicHomepage: true,
  requireManualApprovalBeforePublish: true,
};

// Mock-сообщения из Telegram-чата клуба, на которых работает rule-based parser.
// На проде сюда будут приходить настоящие данные из Telegram webhook.
const DEMO_TELEGRAM_MESSAGES: RawTelegramMessage[] = [
  {
    id: "tg-1",
    chatId: "-1001234567890",
    messageId: "1041",
    date: "2026-05-04T10:12:00",
    authorName: "Аня",
    text:
      "Команда! 5 мая в 19:00 проведём лекцию по работе с референсами. Пинтерест ушёл, шкаф остался.",
    telegramPostUrl: "https://t.me/c/1234567890/1041",
  },
  {
    id: "tg-2",
    chatId: "-1001234567890",
    messageId: "1102",
    date: "2026-05-09T18:45:00",
    authorName: "Лёша",
    text:
      "12 мая в 19:30 — UI-кружок: будем перерисовывать одну экран из приложения банка.",
    telegramPostUrl: "https://t.me/c/1234567890/1102",
  },
  {
    id: "tg-3",
    chatId: "-1001234567890",
    messageId: "1144",
    date: "2026-05-11T20:01:00",
    authorName: "Маша",
    text: "Завтра в 20:00 болталка-ворман как обычно.",
    telegramPostUrl: "https://t.me/c/1234567890/1144",
  },
  {
    id: "tg-4",
    chatId: "-1001234567890",
    messageId: "1203",
    date: "2026-05-18T11:30:00",
    authorName: "Денис",
    text:
      "20.05 в 18:00 встретимся оффлайн — портвейн, постеры, разговоры. Локация в закрытом чате.",
    telegramPostUrl: "https://t.me/c/1234567890/1203",
  },
  {
    id: "tg-5",
    chatId: "-1001234567890",
    messageId: "1280",
    date: "2026-05-25T09:05:00",
    authorName: "Наташа",
    text:
      "30 мая в 19:30 — портфолио-ревью. Кто хочет показать прогресс — пишите в треде.",
    telegramPostUrl: "https://t.me/c/1234567890/1280",
  },
];

export function buildDemoProject(): CalendarProject {
  // Мок-данные считаем уже опубликованными командой клуба, чтобы homepage
  // сразу выглядел как настоящая главная страница, а не пустая заготовка.
  const events = DEMO_EVENTS.map(
    (e): EventItem => ({
      ...e,
      source: "manual",
      publishStatus: "published",
      published: true,
      visibility: "public",
      telegramPostUrl:
        e.id === "e-2026-06-03"
          ? "https://t.me/c/1234567890/1280"
          : e.id === "e-2026-06-07"
            ? "https://t.me/c/1234567890/1203"
            : e.id === "e-2026-06-15"
              ? "https://t.me/c/1234567890/1280"
              : undefined,
    }),
  );

  return {
    id: "dd-demo-2026-06",
    title: "Календарь Дорогих",
    month: MONTH,
    events,
    materials: DEMO_MATERIALS.map((m) => ({ ...m })),
    theme: { ...DEFAULT_THEME },
    exportSettings: { ...DEFAULT_EXPORT },
    homepageSettings: { ...DEFAULT_HOMEPAGE_SETTINGS },
    publishSettings: { ...DEFAULT_PUBLISH_SETTINGS },
    rawTelegramMessages: DEMO_TELEGRAM_MESSAGES.map((m) => ({ ...m })),
    autofillDraft: null,
    updatedAt: NOW_ISO,
  };
}

export function buildEmptyProject(monthKey: string): CalendarProject {
  return {
    id: `dd-${monthKey}`,
    title: "Календарь клуба",
    month: monthKey,
    events: [],
    materials: [],
    theme: { ...DEFAULT_THEME },
    exportSettings: { ...DEFAULT_EXPORT },
    homepageSettings: { ...DEFAULT_HOMEPAGE_SETTINGS },
    publishSettings: { ...DEFAULT_PUBLISH_SETTINGS },
    rawTelegramMessages: [],
    autofillDraft: null,
    updatedAt: new Date().toISOString(),
  };
}

export const DEFAULT_THEME_SETTINGS = DEFAULT_THEME;
export const DEFAULT_EXPORT_SETTINGS = DEFAULT_EXPORT;
