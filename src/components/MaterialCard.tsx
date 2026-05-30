import type { MaterialItem } from "../lib/types";
import { MATERIAL_TYPE_LABEL } from "../lib/types";
import { ArrowRight } from "./icons";

const DD_MATERIAL_MIME = "application/x-dd-material";

type Props = {
  material: MaterialItem;
  attachedTo?: number;
  onEdit?: () => void;
  onRemove?: () => void;
};

export function MaterialCard({ material, attachedTo, onEdit, onRemove }: Props) {
  return (
    <article
      draggable
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = "copy";
        e.dataTransfer.setData(DD_MATERIAL_MIME, material.id);
        e.dataTransfer.setData("text/plain", material.title);
      }}
      className="group relative flex flex-col gap-1.5 rounded-[22px] p-4 text-left transition hover:-translate-y-[1px]"
      style={{
        background: "var(--dd-surface-soft)",
        cursor: "grab",
      }}
      aria-label={`Фишка: ${material.title}`}
    >
      <div
        className="flex items-center justify-between gap-2 text-[10px] uppercase tracking-[0.14em]"
        style={{ color: "var(--dd-muted)" }}
      >
        <span className="truncate" title={material.section}>
          {material.section}
        </span>
        {material.type && <span>{MATERIAL_TYPE_LABEL[material.type]}</span>}
      </div>
      <h3
        className="text-[15px] font-medium leading-tight"
        style={{ letterSpacing: "-0.01em" }}
      >
        {material.title}
      </h3>
      {material.description && (
        <p
          className="line-clamp-2 text-[12.5px]"
          style={{ color: "var(--dd-muted)" }}
        >
          {material.description}
        </p>
      )}
      <div className="mt-1 flex flex-wrap items-center gap-1.5">
        {material.url && (
          <a
            href={material.url}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
            onDragStart={(e) => e.preventDefault()}
            className="inline-flex items-center gap-1.5 rounded-dd-pill px-3 py-1 text-[11px]"
            style={{
              background: "var(--dd-ink)",
              color: "#ffffff",
            }}
          >
            <span>Открыть</span>
            <ArrowRight size={10} />
          </a>
        )}
        {typeof attachedTo === "number" && attachedTo > 0 && (
          <span className="dd-chip-soft">К событиям: {attachedTo}</span>
        )}
        {material.tags?.map((t) => (
          <span key={t} className="dd-chip-soft">
            #{t}
          </span>
        ))}
      </div>
      <div className="mt-1 flex items-center justify-end gap-1 opacity-0 transition group-hover:opacity-100">
        {onEdit && (
          <button
            type="button"
            onClick={onEdit}
            className="dd-btn dd-btn-ghost dd-btn-sm"
            aria-label="Редактировать фишку"
          >
            Редактировать
          </button>
        )}
        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="dd-btn dd-btn-ghost dd-btn-sm"
            aria-label="Удалить фишку"
          >
            Удалить
          </button>
        )}
      </div>
    </article>
  );
}
