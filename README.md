# Календарь Дорогих Дизайнеров — MVP

Веб-инструмент для сборки красивого календаря событий сообщества **deardesigners.club**: события-постеры, drag&drop изображений, внутренний архив «Фишки и материалы», экспорт в PNG/JSON под соцсети и веб.

## Стек

- React 18 + TypeScript (strict) + Vite 5
- Tailwind CSS 3 (всё на CSS-переменных `--dd-*`)
- Zustand для состояния, авто-persist в `localStorage`
- `html-to-image` — экспорт PNG из выделенного `ExportCanvas`
- `date-fns` — навигация по месяцам
- Никаких UI-китов. Дизайн — кастомный editorial.

## Запуск

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # tsc --noEmit + vite build
npm run preview  # предпросмотр прод-сборки
```

Папка проекта может быть в любом пути, в т.ч. с кириллицей.

## Что вошло в MVP

### Календарь
- Сетка 7 колонок ПН–ВС, крупные округлые ячейки, демо за **июнь 2026** с 15 событиями.
- Каждое событие — мини-постер с типом, временем, заголовком и чипами прикреплённых фишек.
- 4 стиля карточки: `photo`, `minimal`, `icon`, `text-only`.
- Подсветка `сегодня`, выделение выбранной даты, hover-кнопка «+» в каждой ячейке.

### Drag & Drop
- Файл-картинка на ячейку → создаётся событие или обновляется существующее (с `cardStyle: photo`).
- Ctrl/Cmd+V — глобально: вставка из буфера обмена в выбранную дату/событие.
- Перетаскивание материала на ячейку или на конкретную карточку события (DnD MIME `application/x-dd-material`):
  - на пустую дату → создаётся событие типа `materials` с этим материалом;
  - на одиночное событие → материал добавляется в `relatedMaterialIds`;
  - на дату с несколькими событиями → создаётся отдельное событие, либо материал прикрепляется к выбранному.
- Картинки автоматически нормализуются до 1600px по большой стороне и пережимаются в JPEG, чтобы не раздувать `localStorage`.

### Редактор события
- Drawer справа, закрытие по Escape. Все поля из спеки (`title`, `date`, `time`, `type`, `description`, `image`, `link`, `tags`, `cardStyle`, `relatedMaterialIds`, `isPast`).
- Замена / очистка картинки, удаление события, прикрепление и отвязка материалов через поиск.

### Фишки и материалы
- Drawer слева. Внутренний архив клуба — НЕ Notion-копия.
- Поиск, фильтр по разделу и типу. Инлайн-редактор фишки.
- 10 разделов из спеки (Цены и ценность, Переговоры, Зумки и обсуждения, Разборы и ОС, Референсы, Люди и индустрия, Глупые вопросы, Загадки, Рекомендации, Я вам покажу!) и ~38 фишек в seed.
- Импорт/экспорт фишек отдельным JSON.

### Что уже было (PastEventsStrip)
- Горизонтальный скролл с editorial-карточками прошедших событий месяца.
- Чипы прикреплённых материалов: в веб-версии — кликабельны (если есть `url`), в PNG — обычный текст.

### Экспорт
- Drawer экспорта с пресетами: Instagram 1:1, 4:5, Stories 9:16, Telegram 16:9, Web 16:9, A4 портрет.
- Тогглы: шапка, заголовок месяца, картинки, прошедшие события, фишки, компактный режим. Слайдер чёткости PNG (×1–×3).
- 4 стиля фона: бумага, чистый, точки, постер.
- PNG рендерится из изолированного off-screen `ExportCanvas` фиксированного размера — никаких кнопок и drawer'ов на картинке.
- В PNG ссылки не интерактивные, материалы показываются как короткие текстовые чипы.
- JSON-экспорт проекта целиком и материалов отдельно. Импорт автоматически распознаёт формат.

### UX / Accessibility
- aria-label у всех кнопок, role/aria для сетки и модалок.
- Escape закрывает drawers.
- Toast-стек справа сверху для подтверждения действий.
- Авто-сохранение в `localStorage` ключ `dd-calendar-project-v1`.
- «Сбросить демо» возвращает seed.

### Site-ready: четыре режима для Tilda

Один и тот же фронтенд работает как универсальный embeddable-блок и
встраивается в любую страницу `deardesigners.club` на Tilda через `<iframe>`.

| Режим | Путь | Когда использовать |
| --- | --- | --- |
| **Admin** | `/?mode=admin` | Закрытая админка команды клуба: редактор, autofill, экспорт. |
| **Homepage** | `/homepage` | Hero + CTA + календарь + архив. Подходит как первый блок главной. |
| **Embed** | `/embed` | Компактный виджет без обвязки. На странице «Календарь», в статье, в середине лендинга. |
| **Digest** | `/digest` | Дайджест прошедшего месяца. Архивные страницы или monthly recap. |

Все публичные режимы:

- показывают только события с `publishStatus = "published"`;
- скрывают `visibility = "private"`;
- для `visibility = "members_hint"` оставляют только дату, тип и кнопку
  «Пост в Telegram» с подсказкой «Доступно участникам клуба»;
- адаптивны по ширине контейнера, без горизонтального скролла.

#### Готовые iframe-снипеты

Компактный виджет внутри страницы:

```html
<iframe
  src="https://calendar.deardesigners.club/embed?month=2026-06&compact=true&showPast=true"
  style="width:100%;min-height:760px;border:0;border-radius:32px;overflow:hidden;"
  loading="lazy"
></iframe>
```

Большой блок на главной:

```html
<iframe
  src="https://calendar.deardesigners.club/homepage?month=2026-06"
  style="width:100%;min-height:1100px;border:0;border-radius:0;overflow:hidden;"
  loading="lazy"
></iframe>
```

Дайджест прошедшего месяца:

```html
<iframe
  src="https://calendar.deardesigners.club/digest?month=2026-05&showTelegramLinks=true"
  style="width:100%;min-height:980px;border:0;border-radius:32px;overflow:hidden;"
  loading="lazy"
></iframe>
```

#### Поддерживаемые query-параметры

`mode`, `month=YYYY-MM`, `view=calendar|digest|compact`, `compact=true|false`,
`showPast=true|false`, `showMaterials=true|false`, `showTelegramLinks=true|false`,
`theme=light|clean|paper`, `height=auto|fixed`,
`presentation=upcoming|monthly-digest|archive`.

Полная таблица — в [`docs/tilda-embed.md`](./docs/tilda-embed.md).

### Публикация и видимость
- У каждого события появилось поле `publishStatus`:
  `draft | review | published | hidden`.
- И `visibility`: `public | members_hint | private`.
- На homepage показываются только `publishStatus = "published"` и
  `visibility !== "private"`. Для `members_hint` видны только дата, тип
  и кнопка Telegram; описание и материалы скрываются.
- В редакторе события есть отдельный блок «Публикация» с переключателями.

### Telegram Autofill (admin)
- Кнопка «Собрать месяц из Telegram» в Toolbar открывает `AutofillPanel`.
- Парсер `lib/chatParser.ts` — rule-based: ищет даты в формате
  `5 мая в 19:00`, `12.05`, `завтра в 20:00` и определяет тип события
  по ключевым словам (`лекция`, `ui-кружок`, `болталка`, `оффлайн`, …).
- Сообщения для парсера приходят в проект через
  `project.rawTelegramMessages` (в demo есть мок).
- Найденные события создаются как `draft` со статусом `members_hint` —
  на homepage они не появляются, пока команда не подтвердит вручную.
- Telegram-токены в браузере **не хранятся**. Получение реальных сообщений
  предполагается через бэкенд/webhook вне scope MVP.

### Public API
- `lib/publicApi.ts` отдаёт `PublicCalendarResponse` — безопасный снимок
  проекта для embed/homepage. Скрывает приватные поля и подмешивает
  лейбл `Доступно участникам клуба` к Telegram-ссылкам.

## Структура

```
src/
├── App.tsx
├── main.tsx
├── index.css
├── components/
│   ├── CalendarApp.tsx          ← admin layout, paste-handler
│   ├── App.tsx                  ← (в src/) роутер по AppMode
│   ├── HomepageCalendar.tsx     ← публичная главная (hero+grid+CTA+archive)
│   ├── HomepageHero.tsx         ← заголовок и subtitle
│   ├── HomepageMonthSwitch.tsx  ← переключатель Этот / Прошлый / Архив
│   ├── HomepageCTA.tsx          ← CTA-кнопка
│   ├── HomepageEventModal.tsx   ← публичная модалка события
│   ├── HomepageArchiveStrip.tsx ← блок «Что было в клубе»
│   ├── EmbedCalendar.tsx        ← компактный embed-виджет
│   ├── DigestCalendar.tsx       ← дайджест прошедшего месяца
│   ├── PublicCalendarGrid.tsx   ← публичная сетка (homepage/embed/digest)
│   ├── AutofillPanel.tsx        ← Drawer автосбора месяца из Telegram
│   ├── Toolbar.tsx              ← шапка admin
│   ├── CalendarGrid.tsx         ← сетка 7×N (admin)
│   ├── CalendarCell.tsx         ← ячейка даты + DnD файлов и материалов
│   ├── EventCard.tsx            ← карточка события (admin/public/export)
│   ├── EventEditor.tsx          ← drawer редактора + блок «Публикация»
│   ├── MaterialsPanel.tsx       ← drawer «Фишки и материалы»
│   ├── MaterialCard.tsx         ← draggable чип материала
│   ├── PastEventsStrip.tsx      ← «Что уже было» (admin)
│   ├── ExportPanel.tsx          ← drawer экспорта
│   ├── ExportCanvas.tsx         ← чистый шаблон под пресет (источник PNG)
│   ├── Drawer.tsx               ← общий компонент-шторка
│   └── Toast.tsx                ← стек уведомлений
├── lib/
│   ├── types.ts                 ← Event/Material/Theme/Export/Project + Telegram*+Public*+AppMode+EmbedQuerySettings
│   ├── appMode.ts               ← detectAppMode() — режим и query-настройки по URL
│   ├── embedTheme.ts            ← маппинг theme/height query-параметров на стили
│   ├── publicApi.ts             ← toPublicCalendar / isEventPublic
│   ├── chatParser.ts            ← rule-based парсер сообщений Telegram
│   ├── calendar.ts              ← buildMonthGrid, monthTitleRu, isoIsPast и пр.
│   ├── storage.ts               ← localStorage + migrateProject
│   ├── image.ts                 ← file → dataURL + ресайз + analyzeImageDataUrl
│   ├── materials.ts             ← фильтры, attach/detach, materialsForEvent
│   ├── export.ts                ← html-to-image, JSON, валидация
│   └── demoData.ts              ← seed: события + 10 разделов фишек + mock Telegram
└── state/
    └── calendarStore.ts         ← Zustand store + autofill/publish actions
```

## Дизайн-токены (`src/index.css`)

```
--dd-bg, --dd-surface, --dd-surface-soft
--dd-ink, --dd-muted, --dd-border
--dd-accent, --dd-accent-soft
--dd-radius-card, --dd-radius-pill
--dd-shadow-soft, --dd-grid-dot
```

Базовая палитра: тёплый off-white фон + графитовый ink + один тёплый акцент (#d94a1f). Серифный заголовок (Georgia), системный sans для интерфейса, мягкие радиусы 22px, точечная сетка как «бумажная» подложка.

## Что улучшить дальше

- Полировка `ExportCanvas` под Stories 9:16 и A4 (динамический баланс высоты сетки и нижнего блока «Что уже было»).
- Embeddable HTML-snapshot одной страницей (сейчас не реализован, заявлен как опциональный в спеке).
- Адаптивный мобильный layout — сейчас работает, но крупные карточки сжимают заголовки на узком экране.
- Темы (`ThemeSettings.radius`, `density`) — структура есть, переключатель в UI пока ограничен `backgroundStyle`.
- Несколько проектов / сохранённых месяцев в `localStorage`.
- Real-time коллаборация и backend-синк.

## Запуск проверок

```bash
npm run typecheck   # tsc --noEmit, всё чисто
npm run build       # vite build, ~250 KB JS, ~17 KB CSS
```

Оба проходят без ошибок и предупреждений.
