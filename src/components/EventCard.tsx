import type { EventItem, MaterialItem } from "../lib/types";
import { materialsForEvent } from "../lib/materials";
import { SparkleIcon } from "./icons";
import { SmartImage } from "./SmartImage";

type Props = {
  event: EventItem;
  materials: MaterialItem[];
  selected?: boolean;
  compact?: boolean;
  onClick?: (e: React.MouseEvent) => void;
  onDragOverMaterial?: (e: React.DragEvent) => void;
  onDropMaterial?: (e: React.DragEvent) => void;
  isExportMode?: boolean;
  // Публичный режим (homepage/embed): без редактирования, с кнопкой Telegram.
  publicMode?: boolean;
  showTelegramLinks?: boolean;
};

// Чёрно-белая editorial-палитра: один тип = одно настроение,
// без кричащих цветов. Светлые типы — белые карточки с чёрной обводкой,
// тёмные — чёрные карточки с белым текстом, нейтральные — серые.
type Variant = "dark" | "soft" | "ivory" | "outline";

const VARIANT_FOR_TYPE: Record<EventItem["type"], Variant> = {
  talk: "dark",
  practice: "soft",
  "ui-circle": "dark",
  chat: "ivory",
  coworking: "outline",
  discussion: "dark",
  offline: "dark",
  breakfast: "ivory",
  portfolio: "soft",
  materials: "outline",
  other: "outline",
};

const VARIANT_BG: Record<Variant, string> = {
  dark: "#000000",
  soft: "#eeeeee",
  ivory: "#f0ebe3",
  outline: "transparent",
};
const VARIANT_INK: Record<Variant, string> = {
  dark: "#ffffff",
  soft: "#000000",
  ivory: "#000000",
  outline: "#000000",
};

// Перцептуальная яркость 0..1 для решения «светлый фон или тёмный».
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

export function EventCard({
  event,
  materials,
  selected,
  compact,
  onClick,
  onDragOverMaterial,
  onDropMaterial,
  isExportMode,
  publicMode,
  showTelegramLinks,
}: Props) {
  const linked = materialsForEvent(event, materials);
  const styleRaw = event.cardStyle ?? "photo";
  // Если у события нет ни заголовка, ни описания, ни материалов —
  // показываем как чистую картинку (без оверлея).
  const isUntitled =
    !event.title?.trim() ||
    event.title.trim().toLowerCase() === "без названия";
  const hasDescription = Boolean(event.description?.trim());
  const style =
    styleRaw === "photo" &&
    event.imageDataUrl &&
    isUntitled &&
    !hasDescription &&
    linked.length === 0
      ? ("raw-image" as const)
      : styleRaw;
  const hasImage = Boolean(event.imageDataUrl) && style !== "text-only";
  const variant = VARIANT_FOR_TYPE[event.type] ?? "outline";
  const baseBg = VARIANT_BG[variant];
  const ink = VARIANT_INK[variant];

  // Текст карточки: заголовок, либо (если его нет) — описание.
  const primaryText = !isUntitled
    ? event.title
    : event.description?.trim() ?? "";

  // Чистая картинка: показываем только image, без оверлея, текстов и скруглений
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
        onDragOver={onDragOverMaterial}
        onDrop={onDropMaterial}
        data-has-image={hasRawImage ? "true" : "false"}
        data-image-bg-mode={hasRawImage ? rawBgMode : "none"}
        className={[
          "relative flex w-full items-center justify-center overflow-hidden text-center transition-transform",
          compact ? "min-h-[58px]" : "min-h-[88px]",
          isExportMode
            ? "cursor-default"
            : "cursor-pointer hover:-translate-y-[1px]",
        ].join(" ")}
        style={{
          padding: 0,
          borderRadius: 0,
          backgroundColor: hasRawImage
            ? event.imageDominantColor ?? "#111111"
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

  // Решаем, нужны ли затемняющие/тёмные оверлеи и какого цвета должен быть текст.
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
  const onImageInk = hasImage
    ? isLightImageBg
      ? "#000000"
      : "#ffffff"
    : ink;

  // ── TEXT CARD ───────────────────────────────────────────────────────────
  // Если у события нет картинки или явно выбран text-only/minimal — рендерим
  // карточку как нормальный flex-блок, без absolute-overlay, чтобы длинный
  // заголовок не обрезался сверху/снизу. Контент: time → title → materials.
  const isTextCard =
    !hasImage ||
    styleRaw === "text-only" ||
    styleRaw === "minimal" ||
    styleRaw === "icon";
  if (isTextCard) {
    return (
      <TextEventCard
        event={event}
        primaryText={primaryText}
        linked={linked}
        variant={variant}
        baseBg={baseBg}
        ink={ink}
        compact={compact}
        selected={selected}
        isExportMode={isExportMode}
        publicMode={publicMode}
        showTelegramLinks={showTelegramLinks}
        onClick={onClick}
        onDragOverMaterial={onDragOverMaterial}
        onDropMaterial={onDropMaterial}
      />
    );
  }

  // ── IMAGE CARD ──────────────────────────────────────────────────────────
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
      onDragOver={onDragOverMaterial}
      onDrop={onDropMaterial}
      data-has-image={hasImage ? "true" : "false"}
      data-image-bg-mode={hasImage ? bgMode : "none"}
      className={[
        "relative w-full overflow-hidden text-left transition-transform",
        compact ? "min-h-[58px]" : "min-h-[88px]",
        isExportMode ? "cursor-default" : "cursor-pointer hover:-translate-y-[1px]",
      ].join(" ")}
      style={{
        borderRadius: 18,
        boxShadow: selected ? "0 6px 22px rgba(0,0,0,0.18)" : "none",
        background: hasImage
          ? event.imageDominantColor ?? "#111111"
          : baseBg,
        color: onImageInk,
      }}
      aria-label={primaryText ? `Событие: ${primaryText}` : "Событие"}
    >
      {hasImage && (
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
      )}
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
      {/* Контент-оверлей: рисуется поверх картинки и НЕ занимает layout-высоту */}
      {(event.time || primaryText || (!compact && linked.length > 0)) && (
        <div
          className="absolute flex flex-col gap-1.5"
          style={{
            zIndex: 2,
            left: compact ? 10 : 12,
            right: compact ? 10 : 12,
            bottom: compact ? 10 : 12,
            top: event.time ? (compact ? 10 : 12) : "auto",
          }}
        >
          {event.time && (
            <div
              className="flex items-center justify-end text-[10px] uppercase tracking-[0.14em]"
              style={{ opacity: 0.78 }}
            >
              <span>{event.time}</span>
            </div>
          )}

          {primaryText && (
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
              {primaryText}
            </div>
          )}

          {!compact && linked.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-1">
              {linked.slice(0, 3).map((m) => (
                <span
                  key={m.id}
                  className="inline-flex max-w-[160px] items-center gap-1 truncate rounded-full px-2 py-[3px] text-[10px]"
                  style={{
                    background: hasImage
                      ? isLightImageBg
                        ? "rgba(0,0,0,0.08)"
                        : "rgba(255,255,255,0.92)"
                      : variant === "dark"
                        ? "rgba(255,255,255,0.16)"
                        : "rgba(0,0,0,0.08)",
                    color:
                      hasImage && !isLightImageBg
                        ? "#000000"
                        : hasImage && isLightImageBg
                          ? "#000000"
                          : variant === "dark"
                            ? "#ffffff"
                            : "#000000",
                  }}
                  title={`${m.section} · ${m.title}`}
                >
                  <SparkleIcon />
                  <span className="truncate">{m.title}</span>
                </span>
              ))}
              {linked.length > 3 && (
                <span
                  className="inline-flex items-center rounded-full px-2 py-[3px] text-[10px]"
                  style={{
                    background: hasImage
                      ? isLightImageBg
                        ? "rgba(0,0,0,0.08)"
                        : "rgba(255,255,255,0.9)"
                      : variant === "dark"
                        ? "rgba(255,255,255,0.16)"
                        : "rgba(0,0,0,0.06)",
                    color:
                      hasImage || variant !== "dark" ? "#000000" : "#ffffff",
                  }}
                >
                  +{linked.length - 3}
                </span>
              )}
            </div>
          )}
        </div>
      )}
      {/* Когда нет ни картинки, ни текста — просто пустая карточка с baseBg */}
      {!hasImage && !primaryText && !event.time && linked.length === 0 && (
        <span style={{ visibility: "hidden" }}>—</span>
      )}
      {showTelegramLinks && event.telegramPostUrl && (
        <TelegramPin
          url={event.telegramPostUrl}
          isLight={hasImage ? isLightImageBg : variant !== "dark"}
          publicMode={publicMode}
        />
      )}
    </div>
  );
}

// ── TEXT CARD ──────────────────────────────────────────────────────────
// Текстовая карточка без изображения: flex-column, normal flow, line-clamp.
// Никаких absolute-слоёв — длинный заголовок переносится по строкам и режется
// многоточием, а не обрезается сверху из-за overflow родителя.
function TextEventCard({
  event,
  primaryText,
  linked,
  variant,
  baseBg,
  ink,
  compact,
  selected,
  isExportMode,
  publicMode,
  showTelegramLinks,
  onClick,
  onDragOverMaterial,
  onDropMaterial,
}: {
  event: EventItem;
  primaryText: string;
  linked: MaterialItem[];
  variant: Variant;
  baseBg: string;
  ink: string;
  compact?: boolean;
  selected?: boolean;
  isExportMode?: boolean;
  publicMode?: boolean;
  showTelegramLinks?: boolean;
  onClick?: (e: React.MouseEvent) => void;
  onDragOverMaterial?: (e: React.DragEvent) => void;
  onDropMaterial?: (e: React.DragEvent) => void;
}) {
  const lineClamp = compact ? 3 : 4;
  // Размеры подобраны так, чтобы 3 строки уверенно влезали в compact-карточку
  // (~58–88px) и не обрезались по верху.
  const titleSize = compact ? 13 : 15;
  const titleLineHeight = 1.18;
  // Fallback на случай, если html-to-image не сохранил -webkit-line-clamp.
  // Ровно столько строк × line-height + страховка 0.05em.
  const titleMaxHeight = `calc(${titleLineHeight}em * ${lineClamp} + 0.06em)`;

  const chipBg =
    variant === "dark" ? "rgba(255,255,255,0.16)" : "rgba(0,0,0,0.08)";
  const chipColor = variant === "dark" ? "#ffffff" : "#000000";

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
      onDragOver={onDragOverMaterial}
      onDrop={onDropMaterial}
      data-card-kind="text"
      className={[
        "relative w-full text-left transition-transform",
        compact ? "min-h-[58px]" : "min-h-[88px]",
        isExportMode
          ? "cursor-default"
          : "cursor-pointer hover:-translate-y-[1px]",
      ].join(" ")}
      style={{
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        gap: compact ? 6 : 8,
        height: "100%",
        padding: compact ? "10px 12px 10px" : "14px 16px 14px",
        overflow: "hidden",
        background: baseBg,
        color: ink,
        borderRadius: 18,
        boxShadow: selected ? "0 6px 22px rgba(0,0,0,0.18)" : "none",
      }}
      aria-label={primaryText ? `Событие: ${primaryText}` : "Событие"}
    >
      {event.time && (
        <div
          style={{
            flex: "0 0 auto",
            display: "flex",
            justifyContent: "flex-end",
            fontSize: 10,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            opacity: 0.78,
            lineHeight: 1,
          }}
        >
          <span>{event.time}</span>
        </div>
      )}

      {primaryText && (
        <div
          style={{
            // textBody: flex-1 + min-height: 0 — ключ к корректному line-clamp
            // внутри flex-контейнера (без min-height: 0 текст вылезает).
            flex: "1 1 auto",
            minWidth: 0,
            minHeight: 0,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              width: "100%",
              minWidth: 0,
              margin: 0,
              fontSize: titleSize,
              lineHeight: titleLineHeight,
              letterSpacing: "-0.01em",
              fontWeight: 500,
              overflow: "hidden",
              display: "-webkit-box",
              WebkitLineClamp: lineClamp,
              WebkitBoxOrient: "vertical",
              textOverflow: "ellipsis",
              overflowWrap: "anywhere",
              wordBreak: "normal",
              maxHeight: titleMaxHeight,
            }}
          >
            {primaryText}
          </div>
        </div>
      )}

      {!compact && linked.length > 0 && (
        <div
          style={{
            flex: "0 0 auto",
            display: "flex",
            flexWrap: "wrap",
            gap: 4,
            paddingTop: 2,
          }}
        >
          {linked.slice(0, 3).map((m) => (
            <span
              key={m.id}
              title={`${m.section} · ${m.title}`}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                maxWidth: 160,
                padding: "3px 8px",
                borderRadius: 999,
                fontSize: 10,
                lineHeight: 1.2,
                background: chipBg,
                color: chipColor,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              <SparkleIcon />
              <span
                style={{
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {m.title}
              </span>
            </span>
          ))}
          {linked.length > 3 && (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                padding: "3px 8px",
                borderRadius: 999,
                fontSize: 10,
                lineHeight: 1.2,
                background: chipBg,
                color: chipColor,
              }}
            >
              +{linked.length - 3}
            </span>
          )}
        </div>
      )}

      {showTelegramLinks && event.telegramPostUrl && (
        <TelegramPin
          url={event.telegramPostUrl}
          isLight={variant !== "dark"}
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
