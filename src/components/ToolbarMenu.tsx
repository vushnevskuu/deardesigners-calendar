import { useEffect, useRef, useState } from "react";

export type ToolbarMenuItem =
  | {
      id: string;
      label: string;
      onClick: () => void;
      kind?: "button";
      hint?: string;
      tone?: "default" | "danger";
    }
  | {
      id: string;
      label: string;
      href: string;
      kind: "link";
      hint?: string;
    }
  | {
      id: string;
      kind: "separator";
    };

type Props = {
  items: ToolbarMenuItem[];
  ariaLabel?: string;
};

// Универсальный «···» dropdown для свертки кнопок toolbar.
// Закрывается по Escape, клику вне и по выбору пункта.
export function ToolbarMenu({ items, ariaLabel }: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        className="dd-icon-btn"
        style={{ width: 38, height: 38 }}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={ariaLabel ?? "Меню действий"}
      >
        <span
          aria-hidden
          style={{
            display: "inline-flex",
            gap: 3,
            alignItems: "center",
          }}
        >
          <Dot />
          <Dot />
          <Dot />
        </span>
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-2 flex flex-col py-2"
          style={{
            width: 260,
            background: "var(--dd-surface)",
            borderRadius: 18,
            boxShadow: "0 14px 40px rgba(0,0,0,0.16)",
          }}
        >
          {items.map((item) => {
            if (item.kind === "separator") {
              return (
                <div
                  key={item.id}
                  aria-hidden
                  style={{
                    height: 1,
                    margin: "6px 12px",
                    background: "var(--dd-surface-soft)",
                  }}
                />
              );
            }
            if (item.kind === "link") {
              return (
                <a
                  key={item.id}
                  href={item.href}
                  target="_blank"
                  rel="noreferrer"
                  role="menuitem"
                  className="flex flex-col gap-0.5 px-4 py-2.5 text-left text-[13px]"
                  style={{
                    color: "var(--dd-ink)",
                    textDecoration: "none",
                  }}
                  onClick={() => setOpen(false)}
                >
                  <span style={{ fontWeight: 500 }}>{item.label}</span>
                  {item.hint && (
                    <span
                      style={{
                        color: "var(--dd-ink-soft)",
                        fontSize: 11,
                        lineHeight: 1.3,
                      }}
                    >
                      {item.hint}
                    </span>
                  )}
                </a>
              );
            }
            return (
              <button
                key={item.id}
                type="button"
                role="menuitem"
                onClick={() => {
                  setOpen(false);
                  item.onClick();
                }}
                className="flex flex-col gap-0.5 px-4 py-2.5 text-left text-[13px]"
                style={{
                  color:
                    item.tone === "danger"
                      ? "var(--dd-ink-soft)"
                      : "var(--dd-ink)",
                  background: "transparent",
                  border: 0,
                  cursor: "pointer",
                }}
              >
                <span style={{ fontWeight: 500 }}>{item.label}</span>
                {item.hint && (
                  <span
                    style={{
                      color: "var(--dd-ink-soft)",
                      fontSize: 11,
                      lineHeight: 1.3,
                    }}
                  >
                    {item.hint}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Dot() {
  return (
    <span
      style={{
        display: "inline-block",
        width: 4,
        height: 4,
        borderRadius: 999,
        background: "currentColor",
      }}
    />
  );
}
