import { useEffect } from "react";
import { CloseIcon } from "./icons";

type Props = {
  open: boolean;
  onClose: () => void;
  side?: "left" | "right";
  width?: number;
  title?: string;
  ariaLabel?: string;
  children: React.ReactNode;
};

export function Drawer({
  open,
  onClose,
  side = "right",
  width = 480,
  title,
  ariaLabel,
  children,
}: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60]" aria-modal="true" role="dialog" aria-label={ariaLabel ?? title}>
      <div
        className="dd-overlay-anim absolute inset-0"
        style={{ background: "rgba(20,18,16,0.32)" }}
        onClick={onClose}
      />
      <aside
        className={[
          "absolute top-0 bottom-0 flex flex-col overflow-hidden",
          side === "right"
            ? "right-0 dd-drawer-anim rounded-l-3xl"
            : "left-0 dd-drawer-anim-left rounded-r-3xl",
        ].join(" ")}
        style={{
          width: `min(96vw, ${width}px)`,
          background: "var(--dd-surface)",
          boxShadow: "0 18px 60px rgba(0,0,0,0.18)",
        }}
      >
        <header className="flex items-center justify-between gap-3 px-5 py-4">
          <div className="text-[18px] font-medium tracking-tight">
            {title}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Закрыть"
            className="dd-icon-btn dd-icon-btn-sm"
          >
            <CloseIcon />
          </button>
        </header>
        <div className="dd-scroll flex-1 overflow-y-auto">{children}</div>
      </aside>
    </div>
  );
}
