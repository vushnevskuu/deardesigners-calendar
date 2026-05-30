import { forwardRef, useMemo } from "react";
import {
  buildMonthGrid,
  formatHumanDate,
  isoIsPast,
  monthTitleRu,
  WEEKDAYS_RU_SHORT,
} from "../lib/calendar";
import {
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
                fontSize: 14,
                letterSpacing: "0.04em",
              }}
            >
              ДД
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
          gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
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
          gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
          gap: compact ? 6 : 10,
          alignItems: "start",
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
            !candidate.description?.trim();
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
                  backgroundColor: fullRaw.imageDominantColor ?? "#ffffff",
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
                position: "relative",
                borderRadius: 22,
                background: "#ffffff",
                aspectRatio: "1 / 1",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                  padding: compact ? 10 : 12,
                  minWidth: 0,
                  minHeight: 0,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    flex: "0 0 auto",
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

                <div
                  style={{
                    flex: "1 1 auto",
                    minHeight: 0,
                    minWidth: 0,
                    display: "flex",
                    flexDirection: "column",
                    gap: 6,
                    overflow: "hidden",
                  }}
                >
                  {visible.map((ev) => (
                    <ExportEventCard
                      key={ev.id}
                      event={ev}
                      showImage={settings.showEventImages}
                      compact={compact}
                    />
                  ))}
                  {overflow > 0 && (
                    <div
                      style={{
                        flex: "0 0 auto",
                        alignSelf: "flex-start",
                        fontSize: 10,
                        color: "#000000",
                        background: "rgba(0,0,0,0.08)",
                        borderRadius: 999,
                        padding: "2px 8px",
                      }}
                    >
                      +{overflow} ещё
                    </div>
                  )}
                </div>
              </div>
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
            {past.slice(0, isStories ? 4 : 8).map((ev) => (
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
                {ev.description && (
                  <div
                    style={{
                      fontSize: 12,
                      lineHeight: 1.35,
                      color: "#6e6e6e",
                      overflow: "hidden",
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      textOverflow: "ellipsis",
                      maxHeight: "calc(1.35em * 2 + 0.06em)",
                    }}
                  >
                    {ev.description}
                  </div>
                )}
              </div>
            ))}
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
  showImage: boolean;
  compact: boolean;
};

function ExportEventCard({ event, showImage, compact }: ExportEventCardProps) {
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
    !hasDescription
      ? ("raw-image" as const)
      : styleRaw;
  const hasImage = Boolean(event.imageDataUrl) && showImage && style !== "text-only";

  // Чистая картинка
  if (style === "raw-image" && event.imageDataUrl && showImage) {
    return (
      <div
        style={{
          position: "relative",
          padding: 0,
          borderRadius: 0,
          overflow: "hidden",
          flex: "1 1 auto",
          minHeight: 0,
          backgroundColor: event.imageDominantColor ?? "#ffffff",
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
  const onImageInk = isLightImageBg ? "#000000" : "#ffffff";

  // Текстовая карточка для PNG-экспорта: белый фрейм без чипов и без
  // цветных тем по типу события. Title + description через line-clamp
  // с max-height fallback (html-to-image не всегда сохраняет WebkitLineClamp).
  const isTextCard =
    !hasImage ||
    styleRaw === "text-only" ||
    styleRaw === "minimal" ||
    styleRaw === "icon";
  if (isTextCard) {
    const title = event.title?.trim() ?? "";
    const description = event.description?.trim() ?? "";
    const titleClamp = compact ? 3 : 4;
    const descClamp = compact ? 2 : 3;
    const titleSize = compact ? 11 : 12;
    const descSize = compact ? 10 : 11;
    const titleLineHeight = 1.2;
    const descLineHeight = 1.3;
    const titleMaxHeight = `calc(${titleLineHeight}em * ${titleClamp} + 0.06em)`;
    const descMaxHeight = `calc(${descLineHeight}em * ${descClamp} + 0.06em)`;
    const showDescription = Boolean(description) && (!compact || !title);
    return (
      <div
        data-card-kind="text"
        style={{
          position: "relative",
          borderRadius: 14,
          overflow: "hidden",
          boxSizing: "border-box",
          padding: compact ? "8px 10px" : "10px 12px",
          flex: "1 1 auto",
          minHeight: 0,
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
          gap: compact ? 3 : 5,
          background: "#ffffff",
          color: "#000000",
        }}
      >
        {title && (
          <div
            style={{
              flex: "0 0 auto",
              minWidth: 0,
              width: "100%",
              margin: 0,
              fontFamily: FONT_STACK,
              fontWeight: 500,
              fontSize: titleSize,
              lineHeight: titleLineHeight,
              letterSpacing: "-0.01em",
              color: "#000000",
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
              fontFamily: FONT_STACK,
              fontSize: descSize,
              lineHeight: descLineHeight,
              color: "#6e6e6e",
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
      </div>
    );
  }

  // Image-card: текст рисуется поверх картинки. Никаких цветных подложек
  // от типа события — фон формирует сама картинка.
  return (
    <div
      data-has-image="true"
      data-image-bg-mode={bgMode}
      style={{
        position: "relative",
        borderRadius: 14,
        overflow: "hidden",
        padding: compact ? 9 : 11,
        flex: "1 1 auto",
        minHeight: 0,
        minWidth: 0,
        display: "flex",
        flexDirection: "column",
        gap: 4,
        backgroundColor: event.imageDominantColor ?? "#ffffff",
        color: onImageInk,
      }}
    >
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
      {event.title && (
        <div
          style={{
            position: "relative",
            zIndex: 2,
            marginTop: "auto",
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
          {event.title}
        </div>
      )}
      {!compact && event.description && (
        <div
          style={{
            position: "relative",
            zIndex: 2,
            fontSize: 10.5,
            lineHeight: 1.3,
            opacity: 0.9,
            overflow: "hidden",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            textOverflow: "ellipsis",
            maxHeight: "calc(1.3em * 2 + 0.06em)",
            textShadow: useTextShadow
              ? "0 1px 6px rgba(0,0,0,0.45)"
              : undefined,
          }}
        >
          {event.description}
        </div>
      )}
    </div>
  );
}
