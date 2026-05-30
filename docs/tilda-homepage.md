# Tilda · Homepage Embed

Этот документ — узкий сценарий: **поставить календарь первым блоком главной**
страницы `deardesigners.club` через Tilda. Если нужен общий обзор всех режимов
встраивания (embed / homepage / digest / admin) и таблица всех query-параметров —
смотри [`tilda-embed.md`](./tilda-embed.md).

## Идея

Пользователь заходит на сайт и сразу видит:

- текущий месяц клуба;
- ближайшие события;
- что уже прошло;
- фотки/обложки событий;
- темы обсуждений и материалы месяца;
- кнопки перехода в Telegram-посты;
- CTA «Вступить в клуб».

Технически это **внешний фронтенд** этого репозитория, развёрнутый, например,
на `https://deardesigners-calendar.vercel.app`, и встроенный в Tilda через `<iframe>`.

## Режимы (краткая шпаргалка)

URL приложения определяет режим:

- `/?mode=admin` (или `/`) — админ-панель команды клуба (редактор, autofill, экспорт).
- `/homepage` или `/?mode=homepage` — публичная главная с hero, CTA, навигацией и архивом.
- `/embed` или `/?mode=embed` — компактный виджет без обвязки.
- `/digest` или `/?mode=digest` — отдельный режим дайджеста прошедшего месяца.

Дополнительные параметры:

- `?month=2026-06` — открыть конкретный месяц (`YYYY-MM`).
- `?presentation=monthly-digest` — открыть homepage как отчёт за месяц.
- `?presentation=upcoming` — открыть homepage как программу.

Полный список query — в [`tilda-embed.md`](./tilda-embed.md#все-поддерживаемые-query-параметры).

## Tilda — встроить как первый блок

В Tilda добавьте блок **T123 / T126** (HTML-блок) и вставьте код:

```html
<iframe
  src="https://deardesigners-calendar.vercel.app/homepage"
  style="width:100%;min-height:1200px;border:0;border-radius:0;overflow:hidden;display:block;"
  loading="lazy"
  title="Календарь Дорогих дизайнеров"
></iframe>
```

Чтобы зафиксировать конкретный месяц как digest:

```html
<iframe
  src="https://deardesigners-calendar.vercel.app/digest?month=2026-06"
  style="width:100%;min-height:1000px;border:0;display:block;"
  loading="lazy"
></iframe>
```

Чтобы вставить компактный виджет внутри отдельной страницы (а не как первый блок):

```html
<iframe
  src="https://deardesigners-calendar.vercel.app/embed?compact=true&showPast=true"
  style="width:100%;min-height:760px;border:0;display:block;"
  loading="lazy"
></iframe>
```

### Высота iframe

- Не используйте `height: 100vh` для homepage: контент часто длиннее одного экрана.
- Используйте `min-height` (1100–1300 px), а ширину растягивайте на 100%.
- Для embed-виджета 700–900 px достаточно.

### Параметры из Tilda

В Tilda удобно держать несколько HTML-блоков под разные сценарии:

- блок «Программа месяца» — `/homepage`,
- блок «Архив прошедшего месяца» — `/digest?month=YYYY-MM`,
- внутри статьи — `/embed?month=YYYY-MM`.

## Конфигурация в admin

Команда клуба настраивает homepage внутри admin-режима:

- `Дефолтный месяц` — current / previous / specific (`YYYY-MM`).
- `Presentation mode` — upcoming / monthly-digest / archive.
- Заголовок hero, subtitle, CTA-лейбл и URL.
- Видимость Telegram-ссылок и подсказок «Доступно участникам клуба».

URL-параметры (`?month=`, `?presentation=`) перекрывают эти настройки только для
конкретного iframe — на самом проекте они не сохраняются.

## Безопасность и приватность

- Telegram-токены **не используются** на фронтенде. Парсер сообщений
  работает на уже сохранённых данных, импортированных через бэкенд или
  загруженных вручную.
- На homepage показываются только события с `publishStatus = "published"`
  и `visibility !== "private"`.
- При `visibility = "members_hint"` на главной видны только дата, тип и
  кнопка Telegram. Описание и материалы скрываются и показываются только
  участникам клуба после открытия Telegram-поста.
- Картинки и материалы можно отключить из homepage целиком через
  `publishSettings.showImagesInPublicHomepage` и
  `publishSettings.showMaterialsInPublicHomepage`.
- Автособранные события из Telegram создаются **как draft** и не попадают
  на homepage до явного подтверждения командой клуба.

## Чек-лист перед запуском главной

1. В admin создан и настроен месяц, заголовок, subtitle и CTA.
2. Все события с `published = true` проверены вручную.
3. У событий, которые ведут в закрытый Telegram, выставлено
   `visibility = "members_hint"`.
4. На Tilda вставлен iframe-блок первым на странице с подходящим `min-height`.
5. Проверено в новом окне в режиме инкогнито: нет ничего, что не должно
   быть публичным.
