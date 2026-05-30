import { forwardRef, useMemo } from "react";
import {
  buildMonthGrid,
  formatHumanDate,
  isoIsPast,
  monthTitleRu,
  WEEKDAYS_RU_SHORT,
} from "../lib/calendar";
import { materialsForEvent } from "../lib/materials";
import {
  EVENT_TYPE_LABEL,
  type CalendarProject,
  type ExportSettings,
  type EventItem,
} from "../lib/types";
import { presetSize } from "../lib/export";
import { SmartImage } from "./SmartImage";

type Props = {
  project: CalendarProject;
  settings: ExportSettings;
};

// editorial ч/б палитра в духе deardesigners.club
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

const FONT_STACK =
  '"Onest", ui-sans-serif, -apple-system, BlinkMacSystemFont, Inter, "Segoe UI", Arial, sans-serif';

function luminance(hex: string | undefined): number {
  if (!hex) return 0;
  const m = /^#?([a-fA-F0-9]{6})$/.exec(hex.trim());
  if (!m) return 0;
  const v = parseInt(m[1], 16);
  const r = ((v >> 16) & 255) / 255;
  const g = ((v >> 8) & 255) / 255;
  const b = (v & 255) / 255;
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

function backgroundFor(theme: CalendarProject["theme"]): React.CSSProperties {
  const beige = "#f0ebe3";
  switch (theme.backgroundStyle) {
    case "clean":
      return { background: "#ffffff" };
    case "dots":
      return {
        background: `radial-gradient(rgba(0,0,0,0.12) 1px, transparent 1.4px) 0 0 / 22px 22px, ${beige}`,
      };
    case "poster":
      return {
        background: `radial-gradient(circle at 12% 0%, #eeeeee 0, transparent 40%), radial-gradient(circle at 100% 100%, #ffffff 0, transparent 50%), ${beige}`,
      };
    case "paper":
    default:
      return { background: beige };
  }
}

export const ExportCanvas = forwardRef<HTMLDivElement, Props>(function ExportCanvas(
  { project, settings },
  ref,
) {
  const { width, height } = presetSize(settings.preset);
  const isStories = settings.preset === "stories";
  const isWide = (height ?? width) <= width;

  const cells = useMemo(() => buildMonthGrid(project.month), [project.month]);
  const eventsByDate = useMemo(() => {
    const map = new Map<string, EventItem[]>();
    project.events.forEach((e) => {
      const arr = map.get(e.date) ?? [];
      arr.push(e);
      map.set(e.date, arr);
    });
    map.forEach((arr) => arr.sort((a, b) => (a.time ?? "").localeCompare(b.time ?? "")));
    return map;
  }, [project.events]);

  const past = useMemo(
    () =>
      project.events
        .filter((e) => e.date.startsWith(project.month))
        .filter((e) => e.isPast || isoIsPast(e.date))
        .sort((a, b) => a.date.localeCompare(b.date)),
    [project.events, project.month],
  );

  const padding = isStories ? 56 : isWide ? 44 : 56;
  const titleSize = isStories ? 132 : isWide ? 92 : 116;
  const compact = settings.compactMode;

  return (
    <div
      ref={ref}
      className="dd-export-canvas"
      style={{
        width,
        height: height ?? "auto",
        padding,
        boxSizing: "border-box",
        color: "#000000",
        fontFamily: FONT_STACK,
        display: "flex",
        flexDirection: "column",
        gap: isStories ? 36 : 28,
        ...backgroundFor(project.theme),
      }}
    >
      {settings.includeHeader && (
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 24,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 999,
                background: "#000000",
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: FONT_STACK,
                fontWeight: 500,
                fontSize: 18,
              }}
            >
              D
            </div>
            <div>
              <div
                style={{
                  fontSize: 11,
                  textTransform: "uppercase",
                  letterSpacing: "0.16em",
                  color: "#6e6e6e",
                }}
              >
                Дорогие дизайнеры
              </div>
              <div
                style={{
                  fontFamily: FONT_STACK,
                  fontSize: 20,
                  fontWeight: 500,
                  letterSpacing: "-0.01em",
                  marginTop: 2,
                }}
              >
                {project.title}
              </div>
            </div>
          </div>
          <div
            style={{
              fontSize: 11,
              textTransform: "uppercase",
              letterSpacing: "0.18em",
              color: "#6e6e6e",
            }}
          >
            deardesigners.club
          </div>
        </header>
      )}

      {settings.includeMonthTitle && (
        <h1
          style={{
            fontFamily: FONT_STACK,
            fontWeight: 600,
            fontSize: titleSize,
            lineHeight: 0.94,
            letterSpacing: "-0.04em",
            margin: 0,
            color: "#000000",
          }}
        >
          {monthTitleRu(project.month)}
        </h1>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          gap: compact ? 6 : 10,
          fontSize: 11,
          textTransform: "uppercase",
          letterSpacing: "0.16em",
          color: "#6e6e6e",
        }}
      >
        {WEEKDAYS_RU_SHORT.map((d) => (
          <div key={d} style={{ paddingLeft: 10 }}>
            {d}
          </div>
        ))}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          gap: compact ? 6 : 10,
        }}
      >
        {cells.map((cell) => {
          const events = eventsByDate.get(cell.iso) ?? [];
          if (!cell.inMonth) {
            return (
              <div
                key={cell.iso}
                style={{
                  borderRadius: 22,
                  background: "transparent",
                  aspectRatio: "1 / 1",
                }}
              />
            );
          }

          // Полноразмерная картинка: одна raw-image на дату → занимает всю ячейку.
          const candidate = events.length === 1 ? events[0] : null;
          const candidateUntitled = candidate
            ? !candidate.title?.trim() ||
              candidate.title.trim().toLowerCase() === "без названия"
            : true;
          const candidateNoText =
            candidate &&
            candidateUntitled &&
            !candidate.description?.trim() &&
            !(candidate.relatedMaterialIds ?? []).length;
          const fullRaw =
            candidate &&
            candidate.cardStyle === "raw-image" &&
            Boolean(candidate.imageDataUrl) &&
            candidateNoText &&
            settings.showEventImages
              ? candidate
              : null;

          if (fullRaw) {
            const rawBgMode = fullRaw.imageBackgroundMode ?? "blurred-fill";
            const rawIsSolid = rawBgMode === "solid";
            const rawIsLight =
              fullRaw.imageIsMostlyWhite ||
              fullRaw.imageLooksLikeScreenshot ||
              rawIsSolid ||
              luminance(fullRaw.imageDominantColor) > 0.7;
            const dayColor = rawIsLight ? "#000000" : "#ffffff";
            const dayShadow = rawIsLight
              ? "none"
              : "0 1px 6px rgba(0,0,0,0.45)";
            return (
              <div
                key={cell.iso}
                data-has-image="true"
                data-image-bg-mode={rawBgMode}
                style={{
                  position: "relative",
                  borderRadius: 22,
                  overflow: "hidden",
                  aspectRatio: "1 / 1",
                  backgroundColor: fullRaw.imageDominantColor ?? "#000000",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    zIndex: 0,
                  }}
                >
                  <SmartImage
                    src={fullRaw.imageDataUrl as string}
                    alt={fullRaw.title}
                    fit={fullRaw.imageFit ?? "smart"}
                    backgroundMode={fullRaw.imageBackgroundMode}
                    dominantColor={fullRaw.imageDominantColor}
                    objectPosition={fullRaw.imagePosition ?? "center center"}
                  />
                </div>
                {!rawIsLight && (
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      zIndex: 1,
                      background:
                        "linear-gradient(180deg, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0) 38%)",
                      pointerEvents: "none",
                    }}
                  />
                )}
                <div
                  style={{
                    position: "absolute",
                    top: compact ? 10 : 12,
                    left: compact ? 10 : 12,
                    zIndex: 2,
                    fontFamily: FONT_STACK,
                    fontWeight: 500,
                    fontSize: compact ? 18 : 22,
                    lineHeight: 1,
                    letterSpacing: "-0.02em",
                    color: dayColor,
                    textShadow: dayShadow,
                  }}
                >
                  {cell.day}
                </div>
              </div>
            );
          }

          const visible = events.slice(0, compact ? 1 : 2);
          const overflow = events.length - visible.length;
          return (
            <div
              key={cell.iso}
              style={{
                borderRadius: 22,
                background: "#ffffff",
                padding: compact ? 10 : 12,
                display: "flex",
                flexDirection: "column",
                gap: 6,
                aspectRatio: "1 / 1",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  fontFamily: FONT_STACK,
                  fontWeight: 500,
                  fontSize: compact ? 18 : 22,
                  lineHeight: 1,
                  letterSpacing: "-0.02em",
                  color: "#000000",
                }}
              >
                {cell.day}
              </div>

              {visible.map((ev) => (
                <ExportEventCard
                  key={ev.id}
                  event={ev}
                  materials={materialsForEvent(ev, project.materials)}
                  showImage={settings.showEventImages}
                  showMaterials={settings.showMaterials}
                  compact={compact}
                />
              ))}
              {overflow > 0 && (
                <div
                  style={{
                    fontSize: 10,
                    color: "#000000",
                    background: "rgba(0,0,0,0.08)",
                    borderRadius: 999,
                    padding: "2px 8px",
                    width: "fit-content",
                  }}
                >
                  +{overflow} ещё
                </div>
              )}
            </div>
          );
        })}
      </div>

      {settings.showPastEvents && past.length > 0 && (
        <section style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              justifyContent: "space-between",
            }}
          >
            <h2
              style={{
                fontFamily: FONT_STACK,
                fontWeight: 600,
                fontSize: 32,
                letterSpacing: "-0.02em",
                margin: 0,
              }}
            >
              Что уже было
            </h2>
            <span
              style={{
                fontSize: 11,
                textTransform: "uppercase",
                letterSpacing: "0.18em",
                color: "#6e6e6e",
              }}
            >
              Архив месяца
            </span>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: 10,
            }}
          >
            {past.slice(0, isStories ? 4 : 8).map((ev) => {
              const linked = materialsForEvent(ev, project.materials);
              return (
                <div
                  key={ev.id}
                  style={{
                    borderRadius: 22,
                    background: "#ffffff",
                    padding: 14,
                    display: "flex",
                    flexDirection: "column",
                    gap: 6,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: 10,
                      textTransform: "uppercase",
                      letterSpacing: "0.14em",
                      color: "#6e6e6e",
                    }}
                  >
                    <span>{formatHumanDate(ev.date)}</span>
                    <span>{EVENT_TYPE_LABEL[ev.type]}</span>
                  </div>
                  <div
                    style={{
                      fontFamily: FONT_STACK,
                      fontWeight: 500,
                      fontSize: 15,
                      lineHeight: 1.18,
                      letterSpacing: "-0.01em",
                    }}
                  >
                    {ev.title}
                  </div>
                  {settings.showMaterials && linked.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                      {linked.slice(0, 4).map((m) => (
                        <span
                          key={m.id}
                          style={{
                            fontSize: 10,
                            padding: "3px 9px",
                            borderRadius: 999,
                            background: "#eeeeee",
                            color: "#000000",
                          }}
                        >
                          ✦ {m.title}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      <footer
        style={{
          marginTop: "auto",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: 11,
          textTransform: "uppercase",
          letterSpacing: "0.18em",
          color: "#6e6e6e",
        }}
      >
        <span>deardesigners.club</span>
        <span>{monthTitleRu(project.month)}</span>
      </footer>
    </div>
  );
});

type ExportEventCardProps = {
  event: EventItem;
  materials: ReturnType<typeof materialsForEvent>;
  showImage: boolean;
  showMaterials: boolean;
  compact: boolean;
};

function ExportEventCard({
  event,
  materials,
  showImage,
  showMaterials,
  compact,
}: ExportEventCardProps) {
  const styleRaw = event.cardStyle ?? "photo";
  const isUntitled =
    !event.title?.trim() ||
    event.title.trim().toLowerCase() === "без названия";
  const hasDescription = Boolean(event.description?.trim());
  const style =
    styleRaw === "photo" &&
    event.imageDataUrl &&
    showImage &&
    isUntitled &&
    !hasDescription &&
    materials.length === 0
      ? ("raw-image" as const)
      : styleRaw;
  const hasImage = Boolean(event.imageDataUrl) && showImage && style !== "text-only";
  const variant = VARIANT_FOR_TYPE[event.type] ?? "outline";
  const baseBg = VARIANT_BG[variant];
  const ink = VARIANT_INK[variant];

  const primaryText = !isUntitled
    ? event.title
    : event.description?.trim() ?? "";

  // Чистая картинка: без оверлея, текстов, скруглений
  if (style === "raw-image" && event.imageDataUrl && showImage) {
    return (
      <div
        style={{
          position: "relative",
          padding: 0,
          borderRadius: 0,
          overflow: "hidden",
          flex: 1,
          minHeight: compact ? 40 : 58,
          backgroundColor: event.imageDominantColor ?? "#111111",
        }}
      >
        <div style={{ position: "absolute", inset: 0 }}>
          <SmartImage
            src={event.imageDataUrl}
            alt={event.title}
            fit={event.imageFit ?? "smart"}
            backgroundMode={event.imageBackgroundMode}
            dominantColor={event.imageDominantColor}
            objectPosition={event.imagePosition ?? "center center"}
          />
        </div>
      </div>
    );
  }

  const bgMode = event.imageBackgroundMode ?? "blurred-fill";
  const isSolidBg = hasImage && bgMode === "solid";
  const isLightImageBg =
    hasImage &&
    (event.imageIsMostlyWhite ||
      event.imageLooksLikeScreenshot ||
      isSolidBg ||
      luminance(event.imageDominantColor) > 0.7);
  const overlayGradient = hasImage && !isSolidBg && !isLightImageBg;
  const useTextShadow = hasImage && !isSolidBg && !isLightImageBg;
  const onImageInk = hasImage
    ? isLightImageBg
      ? "#000000"
      : "#ffffff"
    : ink;

  // Текстовая карточка для PNG-экспорта: без absolute, flex column,
  // line-clamp + max-height fallback (html-to-image не всегда сохраняет
  // -webkit-line-clamp, поэтому страхуемся фиксированной max-height).
  const isTextCard =
    !hasImage ||
    styleRaw === "text-only" ||
    styleRaw === "minimal" ||
    styleRaw === "icon";
  if (isTextCard) {
    const lineClamp = compact ? 3 : 4;
    const titleSize = compact ? 11.5 : 13;
    const titleLineHeight = 1.18;
    const titleMaxHeight = `calc(${titleLineHeight}em * ${lineClamp} + 0.06em)`;
    const chipBg =
      variant === "dark" ? "rgba(255,255,255,0.18)" : "rgba(0,0,0,0.06)";
    const chipFg = variant === "dark" ? "#ffffff" : "#000000";
    return (
      <div
        data-card-kind="text"
        style={{
          position: "relative",
          borderRadius: 14,
          overflow: "hidden",
          boxSizing: "border-box",
          padding: compact ? "9px 10px" : "12px 13px",
          flex: 1,
          minHeight: compact ? 40 : 58,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          gap: compact ? 5 : 7,
          background: baseBg,
          color: ink,
        }}
      >
        {event.time && (
          <div
            style={{
              flex: "0 0 auto",
              display: "flex",
              justifyContent: "flex-end",
              fontSize: 9,
              textTransform: "uppercase",
              letterSpacing: "0.14em",
              opacity: 0.8,
              lineHeight: 1,
            }}
          >
            <span>{event.time}</span>
          </div>
        )}

        {primaryText && (
          <div
            style={{
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
                fontFamily: FONT_STACK,
                fontWeight: 500,
                fontSize: titleSize,
                lineHeight: titleLineHeight,
                letterSpacing: "-0.01em",
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

        {!compact && showMaterials && materials.length > 0 && (
          <div
            style={{
              flex: "0 0 auto",
              display: "flex",
              flexWrap: "wrap",
              gap: 3,
              marginTop: 2,
            }}
          >
            {materials.slice(0, 2).map((m) => (
              <span
                key={m.id}
                style={{
                  fontSize: 9,
                  padding: "2px 7px",
                  borderRadius: 999,
                  background: chipBg,
                  color: chipFg,
                  maxWidth: 140,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  lineHeight: 1.2,
                }}
              >
                {m.title}
              </span>
            ))}
            {materials.length > 2 && (
              <span
                style={{
                  fontSize: 9,
                  padding: "2px 7px",
                  borderRadius: 999,
                  background: chipBg,
                  color: chipFg,
                  lineHeight: 1.2,
                }}
              >
                +{materials.length - 2}
              </span>
            )}
          </div>
        )}
      </div>
    );
  }

  const containerStyle: React.CSSProperties = hasImage
    ? {
        backgroundColor: event.imageDominantColor ?? "#111111",
        color: onImageInk,
      }
    : {
        background: baseBg,
        color: ink,
      };

  return (
    <div
      data-has-image={hasImage ? "true" : "false"}
      data-image-bg-mode={hasImage ? bgMode : "none"}
      style={{
        position: "relative",
        borderRadius: 14,
        overflow: "hidden",
        padding: compact ? 7 : 9,
        flex: 1,
        minHeight: compact ? 40 : 58,
        display: "flex",
        flexDirection: "column",
        gap: 3,
        ...containerStyle,
      }}
    >
      {hasImage && (
        <div style={{ position: "absolute", inset: 0, zIndex: 0 }}>
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
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 1,
            background:
              "linear-gradient(180deg, rgba(0,0,0,0.0) 0%, rgba(0,0,0,0.55) 100%)",
          }}
        />
      )}
      {event.time && (
        <div
          style={{
            position: "relative",
            zIndex: 2,
            display: "flex",
            justifyContent: "flex-end",
            fontSize: 9,
            textTransform: "uppercase",
            letterSpacing: "0.14em",
            opacity: 0.8,
          }}
        >
          <span>{event.time}</span>
        </div>
      )}
      {primaryText && (
        <div
          style={{
            position: "relative",
            zIndex: 2,
            fontFamily: FONT_STACK,
            fontWeight: 500,
            fontSize: compact ? 11 : 12.5,
            lineHeight: 1.18,
            letterSpacing: "-0.01em",
            textShadow: useTextShadow
              ? "0 1px 6px rgba(0,0,0,0.45)"
              : undefined,
          }}
        >
          {primaryText}
        </div>
      )}
      {!compact && showMaterials && materials.length > 0 && (
        <div
          style={{
            position: "relative",
            zIndex: 2,
            display: "flex",
            flexWrap: "wrap",
            gap: 3,
            marginTop: 2,
          }}
        >
          {materials.slice(0, 2).map((m) => {
            const chipBg = hasImage
              ? isLightImageBg
                ? "rgba(0,0,0,0.08)"
                : "rgba(255,255,255,0.9)"
              : variant === "dark"
                ? "rgba(255,255,255,0.18)"
                : "rgba(0,0,0,0.06)";
            const chipFg =
              hasImage || variant !== "dark" ? "#000000" : "#ffffff";
            return (
              <span
                key={m.id}
                style={{
                  fontSize: 9,
                  padding: "2px 7px",
                  borderRadius: 999,
                  background: chipBg,
                  color: chipFg,
                  maxWidth: 140,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                ✦ {m.title}
              </span>
            );
          })}
          {materials.length > 2 && (
            <span
              style={{
                fontSize: 9,
                padding: "2px 7px",
                borderRadius: 999,
                background: hasImage
                  ? isLightImageBg
                    ? "rgba(0,0,0,0.08)"
                    : "rgba(255,255,255,0.9)"
                  : variant === "dark"
                    ? "rgba(255,255,255,0.18)"
                    : "rgba(0,0,0,0.06)",
                color: hasImage || variant !== "dark" ? "#000000" : "#ffffff",
              }}
            >
              +{materials.length - 2}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
