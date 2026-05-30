import type { ImageBackgroundMode, ImageFit } from "../lib/types";

type Props = {
  src: string;
  alt?: string;
  fit?: ImageFit;
  backgroundMode?: ImageBackgroundMode;
  dominantColor?: string;
  objectPosition?: string;
  className?: string;
  style?: React.CSSProperties;
};

// Универсальный рендер картинки в карточке/ячейке.
// Поведение:
// — fit="cover"   → классический cover (картинка обрезается).
// — fit="contain" → contain + backdrop из backgroundMode.
// — fit="smart"   → contain + backgroundMode (по умолчанию blurred-fill).
// — backgroundMode="solid" → чистый цветной фон (например белый для скриншотов),
//   без blur-дымки. Тонкая обводка отделяет светлую картинку от светлого фона.
// CSS использует только свойства, которые корректно сериализуются html-to-image
// (filter: blur() — да, backdrop-filter — нет, поэтому не используем).
export function SmartImage({
  src,
  alt,
  fit = "smart",
  backgroundMode,
  dominantColor,
  objectPosition = "center center",
  className,
  style,
}: Props) {
  const baseBg = dominantColor ?? "#111111";

  if (fit === "cover") {
    return (
      <div
        className={className}
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          overflow: "hidden",
          backgroundColor: baseBg,
          ...style,
        }}
      >
        <img
          src={src}
          alt={alt ?? ""}
          draggable={false}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition,
            display: "block",
          }}
        />
      </div>
    );
  }

  const effectiveMode: ImageBackgroundMode =
    backgroundMode ?? (fit === "smart" ? "blurred-fill" : "blurred-fill");

  const showBlur = effectiveMode === "blurred-fill";
  const isSolid =
    effectiveMode === "solid" || effectiveMode === "dominant-color";

  // Если фон контейнера светлый — добавляем очень тонкую обводку, чтобы
  // светлая картинка не сливалась с фоном (например белый скриншот на белом).
  const lightLuminance = bgLuminance(baseBg);
  const needsHairline =
    effectiveMode === "solid" && lightLuminance > 0.86;

  return (
    <div
      className={className}
      data-bg-mode={effectiveMode}
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        overflow: "hidden",
        backgroundColor: isSolid || showBlur ? baseBg : "transparent",
        boxShadow: needsHairline
          ? "inset 0 0 0 1px rgba(0,0,0,0.06)"
          : undefined,
        ...style,
      }}
    >
      {showBlur && (
        <>
          <img
            src={src}
            alt=""
            aria-hidden
            draggable={false}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              objectPosition: "center center",
              filter: "blur(22px)",
              transform: "scale(1.18)",
              opacity: 0.78,
              display: "block",
            }}
          />
          <div
            aria-hidden
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(0, 0, 0, 0.18)",
            }}
          />
        </>
      )}
      <img
        src={src}
        alt={alt ?? ""}
        draggable={false}
        style={{
          position: "relative",
          zIndex: 1,
          width: "100%",
          height: "100%",
          objectFit: "contain",
          objectPosition,
          display: "block",
        }}
      />
    </div>
  );
}

// Грубая «светлота» цвета 0..1 для решения о тонкой обводке.
function bgLuminance(hex: string): number {
  const m = /^#?([a-fA-F0-9]{6})$/.exec(hex.trim());
  if (!m) return 0;
  const v = parseInt(m[1], 16);
  const r = ((v >> 16) & 255) / 255;
  const g = ((v >> 8) & 255) / 255;
  const b = (v & 255) / 255;
  return 0.299 * r + 0.587 * g + 0.114 * b;
}
