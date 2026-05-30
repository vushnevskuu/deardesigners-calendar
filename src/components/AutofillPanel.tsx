import { useMemo, useState } from "react";
import { useCalendarStore } from "../state/calendarStore";
import { monthTitleRu, shiftMonth } from "../lib/calendar";
import { EVENT_TYPE_LABEL } from "../lib/types";
import type { AutoDetectedEvent } from "../lib/types";
import { Drawer } from "./Drawer";

type Props = {
  open: boolean;
  onClose: () => void;
};

// Панель автосбора месяца из Telegram-сообщений.
// Вся работа админская: ничего не публикуется без явного действия команды.
export function AutofillPanel({ open, onClose }: Props) {
  const project = useCalendarStore((s) => s.project);
  const generate = useCalendarStore((s) => s.generateAutofillDraft);
  const clear = useCalendarStore((s) => s.clearAutofillDraft);
  const approve = useCalendarStore((s) => s.approveAutofillEvent);
  const reject = useCalendarStore((s) => s.rejectAutofillEvent);
  const importAll = useCalendarStore((s) => s.importAllAutofill);

  const previousMonth = useMemo(() => shiftMonth(project.month, -1), [project.month]);
  const [targetMonth, setTargetMonth] = useState<string>(previousMonth);

  const draft = project.autofillDraft;
  const drafts = (draft?.detectedEvents ?? []).filter(
    (d) => d.status !== "rejected",
  );

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Автосбор месяца из Telegram"
      width={560}
    >
      <div className="flex flex-col gap-5 p-5">
        <p className="text-sm" style={{ color: "var(--dd-ink-soft)" }}>
          Парсер пробежит по сохранённым сообщениям чата клуба и предложит
          события-черновики. Ничего не публикуется автоматически — каждый
          черновик нужно проверить и подтвердить.
        </p>

        <div className="dd-card flex flex-col gap-3 p-4">
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 text-sm">
              <span className="dd-label">Месяц</span>
              <input
                type="month"
                className="dd-input"
                style={{ height: 34 }}
                value={targetMonth}
                onChange={(e) => setTargetMonth(e.target.value)}
              />
            </label>
            <button
              type="button"
              className="dd-btn dd-btn-sm"
              onClick={() => setTargetMonth(previousMonth)}
            >
              Прошлый месяц
            </button>
            <button
              type="button"
              className="dd-btn dd-btn-sm"
              onClick={() => setTargetMonth(project.month)}
            >
              Текущий
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="dd-cta dd-cta--filled"
              style={{ height: 36, paddingLeft: 14 }}
              onClick={() => generate(targetMonth)}
            >
              Собрать {monthTitleRu(targetMonth).toLowerCase()}
            </button>
            {draft && (
              <button
                type="button"
                className="dd-btn dd-btn-ghost dd-btn-sm"
                onClick={() => clear()}
              >
                Очистить черновик
              </button>
            )}
            {draft && drafts.length > 0 && (
              <button
                type="button"
                className="dd-btn dd-btn-sm"
                onClick={() => {
                  const n = importAll(draft.month);
                  if (n === 0) {
                    // Сообщение пушнется внутри approveAutofillEvent.
                  }
                }}
              >
                Импортировать все ({drafts.filter((d) => d.status === "draft").length})
              </button>
            )}
          </div>
        </div>

        {draft && drafts.length === 0 && (
          <div className="dd-card p-4 text-sm" style={{ color: "var(--dd-ink-soft)" }}>
            Парсер пробежал по сообщениям, но ничего нового не нашёл. Возможно,
            события на этот месяц ещё не публиковались в чате клуба.
          </div>
        )}

        {draft && drafts.length > 0 && (
          <div className="flex flex-col gap-3">
            <div
              className="text-xs uppercase tracking-wide"
              style={{ color: "var(--dd-ink-soft)" }}
            >
              Найдено событий: {drafts.length}
            </div>
            {drafts.map((d) => (
              <DetectedEventCard
                key={d.id}
                event={d}
                onApprove={() => approve(d.id)}
                onReject={() => reject(d.id)}
              />
            ))}
          </div>
        )}

        {draft && draft.unresolvedMessages.length > 0 && (
          <div className="dd-card p-4 text-sm" style={{ color: "var(--dd-ink-soft)" }}>
            <div className="dd-label mb-2">
              Сообщения, в которых не нашли дату ({draft.unresolvedMessages.length})
            </div>
            <ul className="flex flex-col gap-1.5">
              {draft.unresolvedMessages.slice(0, 5).map((m) => (
                <li key={m.id} className="line-clamp-2">
                  «{(m.text ?? m.caption ?? "").slice(0, 120)}»
                </li>
              ))}
              {draft.unresolvedMessages.length > 5 && (
                <li>… и ещё {draft.unresolvedMessages.length - 5}</li>
              )}
            </ul>
          </div>
        )}

        <div className="dd-card p-4 text-xs" style={{ color: "var(--dd-ink-soft)" }}>
          <strong style={{ color: "var(--dd-ink)" }}>Безопасность.</strong>{" "}
          Парсер работает локально на сохранённых сообщениях. Telegram-токены не
          хранятся в браузере. Импортированные события создаются как{" "}
          <code>draft</code> со статусом доступа{" "}
          <code>members_hint</code> — на homepage будут видны только после
          ручного подтверждения.
        </div>
      </div>
    </Drawer>
  );
}

function DetectedEventCard({
  event,
  onApprove,
  onReject,
}: {
  event: AutoDetectedEvent;
  onApprove: () => void;
  onReject: () => void;
}) {
  const isApproved = event.status === "approved";
  return (
    <article
      className="dd-card flex flex-col gap-2 p-4"
      style={{
        opacity: isApproved ? 0.55 : 1,
      }}
    >
      <div className="flex flex-wrap items-center gap-2 text-xs" style={{ color: "var(--dd-ink-soft)" }}>
        <span className="dd-chip">{EVENT_TYPE_LABEL[event.type] ?? "Событие"}</span>
        <span>{event.date}{event.time ? ` · ${event.time}` : ""}</span>
        <span>уверенность: {Math.round(event.confidence * 100)}%</span>
        {isApproved && <span style={{ color: "var(--dd-success, #1f7a3a)" }}>добавлено</span>}
      </div>
      <div className="text-base font-medium">{event.title}</div>
      {event.description && (
        <div className="text-sm" style={{ color: "var(--dd-ink-soft)" }}>
          {event.description}
        </div>
      )}
      {event.telegramPostUrl && (
        <a
          href={event.telegramPostUrl}
          target="_blank"
          rel="noreferrer"
          className="text-xs underline"
          style={{ color: "var(--dd-ink-soft)" }}
        >
          Источник в Telegram →
        </a>
      )}
      {!isApproved && (
        <div className="mt-1 flex flex-wrap gap-2">
          <button type="button" className="dd-btn dd-btn-sm" onClick={onApprove}>
            Добавить как черновик
          </button>
          <button type="button" className="dd-btn dd-btn-ghost dd-btn-sm" onClick={onReject}>
            Пропустить
          </button>
        </div>
      )}
    </article>
  );
}
