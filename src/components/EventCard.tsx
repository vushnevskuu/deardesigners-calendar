import type { EventItem } from "../lib/types";
import { SmartImage } from "./SmartImage";

type Props = {
  event: EventItem;
  selected?: boolean;
  compact?: boolean;
  onClick?: (e: React.MouseEvent) => void;
  isExportMode?: boolean;
  // Публичный режим (homepage/embed): без редактирования, с кнопкой Telegram.
  publicMode?: boolean;
  showTelegramLinks?: boolean;
};

// Перцептуальная яркость 0..1 для решения «светлый фон или тёмный»
// у пользовательской картинки (нужно для контраста overlay-текста).
function bgLuminance(hex: string | undefined): number {
  if (!hex) return 0;
  const m = /^#?([a-fA-F0-9]{6})$/.exec(hex.trim());
  if (!m) return 0;
  const v = parseInt(m[1], 16);
  const r = ((v >> 16) & 255) / 255;
  const g = ((v >> 8) & 255) / 255;
  const b = (v & 255) / 255;
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

// Карточка события. Один цельный фрейм без вложенных подкарточек, чипов
// и цветных тем по типу события. Только: дата ячейки (рисуется в ячейке
// календаря), title, опционально time, description и картинка.
export function EventCard({
  event,
  selected,
  compact,
  onClick,
  isExportMode,
  publicMode,
  showTelegramLinks,
}: Props) {
  const styleRaw = event.cardStyle ?? "photo";
  const isUntitled =
    !event.title?.trim() ||
    event.title.trim().toLowerCase() === "без названия";
  const hasDescription = Boolean(event.description?.trim());
  // Чистая картинка-постер: используется только если у события вообще нет
  // текстового контента. Иначе — image-card с overlay или text-card.
  const style =
    styleRaw === "photo" &&
    event.imageDataUrl &&
    isUntitled &&
    !hasDescription
      ? ("raw-image" as const)
      : styleRaw;
  const hasImage = Boolean(event.imageDataUrl) && style !== "text-only";

  // ── RAW IMAGE ───────────────────────────────────────────────────────────
  if (style === "raw-image") {
    const hasRawImage = Boolean(event.imageDataUrl);
    const rawBgMode = event.imageBackgroundMode ?? "blurred-fill";
    return (
      <div
        role="button"
        tabIndex={0}
        onClick={onClick}
        onKeyDown={(e) => {
          if (onClick && (e.key === "Enter" || e.key === " ")) {
            e.preventDefault();
            onClick(e as unknown as React.MouseEvent);
          }
        }}
        data-has-image={hasRawImage ? "true" : "false"}
        data-image-bg-mode={hasRawImage ? rawBgMode : "none"}
        className={[
          "relative flex w-full items-center justify-center overflow-hidden text-center transition-transform",
          isExportMode
            ? "cursor-default"
            : "cursor-pointer hover:-translate-y-[1px]",
        ].join(" ")}
        style={{
          flex: "1 1 auto",
          minHeight: 0,
          padding: 0,
          borderRadius: 0,
          backgroundColor: hasRawImage
            ? event.imageDominantColor ?? "var(--dd-surface-soft)"
            : "var(--dd-surface-soft)",
          color: "var(--dd-muted)",
          fontSize: 11,
          boxShadow: selected ? "0 6px 22px rgba(0,0,0,0.18)" : "none",
        }}
        aria-label={
          hasRawImage
            ? event.title
              ? `Картинка: ${event.title}`
              : "Картинка"
            : "Картинка не загрузилась — добавьте новую"
        }
      >
        {hasRawImage ? (
          <div className="absolute inset-0">
            <SmartImage
              src={event.imageDataUrl as string}
              alt={event.title}
              fit={event.imageFit ?? "smart"}
              backgroundMode={event.imageBackgroundMode}
              dominantColor={event.imageDominantColor}
              objectPosition={event.imagePosition ?? "center center"}
            />
          </div>
        ) : (
          <span className="px-2 leading-tight">
            Картинка не загрузилась.
            <br />
            Открой и перезагрузи.
          </span>
        )}
        {showTelegramLinks && event.telegramPostUrl && (
          <TelegramPin
            url={event.telegramPostUrl}
            isLight={
              hasRawImage &&
              (event.imageIsMostlyWhite ||
                event.imageLooksLikeScreenshot ||
                bgLuminance(event.imageDominantColor) > 0.7)
            }
            publicMode={publicMode}
          />
        )}
      </div>
    );
  }

  // ── TEXT CARD ───────────────────────────────────────────────────────────
  // Без картинки или явный text-only/minimal/icon. Чистый белый фрейм,
  // никаких цветных подложек по типу события.
  const isTextCard =
    !hasImage ||
    styleRaw === "text-only" ||
    styleRaw === "minimal" ||
    styleRaw === "icon";
  if (isTextCard) {
    return (
      <TextEventCard
        event={event}
        compact={compact}
        selected={selected}
        isExportMode={isExportMode}
        publicMode={publicMode}
        showTelegramLinks={showTelegramLinks}
        onClick={onClick}
      />
    );
  }

  // ── IMAGE CARD ──────────────────────────────────────────────────────────
  // С картинкой: SmartImage заполняет весь фрейм, текст рисуется поверх.
  // Никаких цветных тем по типу события — фон формирует сама картинка.
  const bgMode = event.imageBackgroundMode ?? "blurred-fill";
  const isSolidBg = hasImage && bgMode === "solid";
  const isLightImageBg =
    hasImage &&
    (event.imageIsMostlyWhite ||
      event.imageLooksLikeScreenshot ||
      isSolidBg ||
      bgLuminance(event.imageDominantColor) > 0.7);
  const overlayGradient = hasImage && !isSolidBg && !isLightImageBg;
  const useTextShadow = hasImage && !isSolidBg && !isLightImageBg;
  const onImageInk = isLightImageBg ? "#000000" : "#ffffff";

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (onClick && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onClick(e as unknown as React.MouseEvent);
        }
      }}
      data-has-image="true"
      data-image-bg-mode={bgMode}
      className={[
        "relative w-full overflow-hidden text-left transition-transform",
        isExportMode ? "cursor-default" : "cursor-pointer hover:-translate-y-[1px]",
      ].join(" ")}
      style={{
        flex: "1 1 auto",
        minHeight: 0,
        borderRadius: 18,
        boxShadow: selected ? "0 6px 22px rgba(0,0,0,0.18)" : "none",
        background: event.imageDominantColor ?? "var(--dd-surface)",
        color: onImageInk,
      }}
      aria-label={event.title ? `Событие: ${event.title}` : "Событие"}
    >
      <div className="absolute inset-0" style={{ zIndex: 0 }}>
        <SmartImage
          src={event.imageDataUrl as string}
          alt={event.title}
          fit={event.imageFit ?? "smart"}
          backgroundMode={event.imageBackgroundMode}
          dominantColor={event.imageDominantColor}
          objectPosition={event.imagePosition ?? "center center"}
        />
      </div>
      {overlayGradient && (
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            zIndex: 1,
            background:
              "linear-gradient(180deg, rgba(0,0,0,0.0) 0%, rgba(0,0,0,0.58) 100%)",
          }}
        />
      )}
      {(event.title || event.description) && (
        <div
          className="absolute flex flex-col gap-1.5"
          style={{
            zIndex: 2,
            left: compact ? 10 : 12,
            right: compact ? 10 : 12,
            bottom: compact ? 10 : 12,
            top: "auto",
          }}
        >
          {event.title && (
            <div
              className={[
                "font-medium leading-tight",
                compact ? "text-[12.5px]" : "text-[14px]",
              ].join(" ")}
              style={{
                marginTop: "auto",
                letterSpacing: "-0.01em",
                textShadow: useTextShadow
                  ? "0 1px 6px rgba(0,0,0,0.45)"
                  : undefined,
              }}
            >
              {event.title}
            </div>
          )}
          {!compact && event.description && (
            <div
              className="text-[12px] leading-snug"
              style={{
                opacity: 0.85,
                overflow: "hidden",
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                textOverflow: "ellipsis",
                textShadow: useTextShadow
                  ? "0 1px 6px rgba(0,0,0,0.45)"
                  : undefined,
              }}
            >
              {event.description}
            </div>
          )}
        </div>
      )}
      {showTelegramLinks && event.telegramPostUrl && (
        <TelegramPin
          url={event.telegramPostUrl}
          isLight={isLightImageBg}
          publicMode={publicMode}
        />
      )}
    </div>
  );
}

// ── TEXT CARD ──────────────────────────────────────────────────────────
// Текстовая карточка без изображения: один белый фрейм, без чипов, без
// плашек, без цветных подкарточек. Структура: time → title → description.
function TextEventCard({
  event,
  compact,
  selected,
  isExportMode,
  publicMode,
  showTelegramLinks,
  onClick,
}: {
  event: EventItem;
  compact?: boolean;
  selected?: boolean;
  isExportMode?: boolean;
  publicMode?: boolean;
  showTelegramLinks?: boolean;
  onClick?: (e: React.MouseEvent) => void;
}) {
  const titleClamp = compact ? 3 : 4;
  const descClamp = compact ? 2 : 3;
  const titleSize = compact ? 12.5 : 13.5;
  const descSize = compact ? 11 : 12;
  const titleLineHeight = 1.2;
  const descLineHeight = 1.3;
  const titleMaxHeight = `calc(${titleLineHeight}em * ${titleClamp} + 0.06em)`;
  const descMaxHeight = `calc(${descLineHeight}em * ${descClamp} + 0.06em)`;

  const title = event.title?.trim() ?? "";
  const description = event.description?.trim() ?? "";
  const showDescription = Boolean(description) && (!compact || !title);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (onClick && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onClick(e as unknown as React.MouseEvent);
        }
      }}
      data-card-kind="text"
      className={[
        "relative w-full text-left transition-transform",
        isExportMode
          ? "cursor-default"
          : "cursor-pointer hover:-translate-y-[1px]",
      ].join(" ")}
      style={{
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        flex: "1 1 auto",
        gap: compact ? 4 : 5,
        minHeight: 0,
        minWidth: 0,
        padding: compact ? "10px 12px" : "11px 13px",
        overflow: "hidden",
        background: "var(--dd-surface)",
        color: "var(--dd-ink)",
        borderRadius: 18,
        boxShadow: selected ? "0 6px 22px rgba(0,0,0,0.18)" : "none",
      }}
      aria-label={title || description ? `Событие: ${title || description}` : "Событие"}
    >
      {title && (
        <div
          style={{
            flex: "0 0 auto",
            minWidth: 0,
            width: "100%",
            margin: 0,
            fontSize: titleSize,
            lineHeight: titleLineHeight,
            letterSpacing: "-0.01em",
            fontWeight: 500,
            overflow: "hidden",
            display: "-webkit-box",
            WebkitLineClamp: titleClamp,
            WebkitBoxOrient: "vertical",
            textOverflow: "ellipsis",
            overflowWrap: "break-word",
            wordBreak: "normal",
            hyphens: "auto",
            maxHeight: titleMaxHeight,
          }}
        >
          {title}
        </div>
      )}

      {showDescription && (
        <p
          style={{
            flex: "1 1 auto",
            minWidth: 0,
            margin: 0,
            fontSize: descSize,
            lineHeight: descLineHeight,
            color: "var(--dd-muted)",
            overflow: "hidden",
            display: "-webkit-box",
            WebkitLineClamp: descClamp,
            WebkitBoxOrient: "vertical",
            textOverflow: "ellipsis",
            overflowWrap: "break-word",
            wordBreak: "normal",
            hyphens: "auto",
            maxHeight: descMaxHeight,
          }}
        >
          {description}
        </p>
      )}

      {showTelegramLinks && event.telegramPostUrl && (
        <TelegramPin
          url={event.telegramPostUrl}
          isLight
          publicMode={publicMode}
        />
      )}
    </div>
  );
}

// Маленькая «приколка» с ссылкой на Telegram-пост в углу карточки.
// Не вкладываем <a> в <button> — корневой элемент карточки уже div role=button.
function TelegramPin({
  url,
  isLight,
  publicMode,
}: {
  url: string;
  isLight: boolean;
  publicMode?: boolean;
}) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      onClick={(e) => e.stopPropagation()}
      className="absolute z-10 inline-flex items-center gap-1 rounded-full text-[10px] font-medium tracking-tight"
      style={{
        top: 8,
        right: 8,
        padding: "4px 9px",
        background: isLight ? "rgba(0,0,0,0.78)" : "rgba(255,255,255,0.94)",
        color: isLight ? "#ffffff" : "#000000",
        textDecoration: "none",
        boxShadow: "0 2px 6px rgba(0,0,0,0.18)",
      }}
      aria-label={publicMode ? "Открыть пост в Telegram" : "Перейти к источнику в Telegram"}
      title={publicMode ? "Доступно участникам клуба" : "Источник: Telegram"}
    >
      <span aria-hidden style={{ fontSize: 11, lineHeight: 1 }}>↗</span>
      <span>Telegram</span>
    </a>
  );
}
