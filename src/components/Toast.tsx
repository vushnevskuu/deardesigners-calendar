import { useCalendarStore } from "../state/calendarStore";

export function ToastStack() {
  const toasts = useCalendarStore((s) => s.toasts);
  const dismiss = useCalendarStore((s) => s.dismissToast);
  if (!toasts.length) return null;
  return (
    <div
      className="pointer-events-none fixed right-6 top-6 z-[80] flex flex-col gap-2"
      aria-live="polite"
      aria-atomic="false"
    >
      {toasts.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => dismiss(t.id)}
          className="pointer-events-auto dd-anim-in flex max-w-[320px] items-center gap-3 rounded-dd-pill px-5 py-3 text-[13px] font-normal"
          style={{
            background:
              t.tone === "error" ? "var(--dd-ink)" : "var(--dd-surface)",
            color: t.tone === "error" ? "#ffffff" : "var(--dd-ink)",
            boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
          }}
        >
          <span
            aria-hidden
            className="inline-block h-2 w-2 rounded-full"
            style={{
              background:
                t.tone === "error" ? "#ffffff" : "var(--dd-ink)",
            }}
          />
          <span className="text-left">{t.message}</span>
        </button>
      ))}
    </div>
  );
}
