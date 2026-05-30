import { useMemo, useRef, useState } from "react";
import { useCalendarStore } from "../state/calendarStore";
import {
  filterMaterials,
  uniqueSections,
} from "../lib/materials";
import {
  MATERIAL_TYPE_LABEL,
  MATERIAL_TYPES,
  type MaterialItem,
  type MaterialType,
} from "../lib/types";
import { Drawer } from "./Drawer";
import { MaterialCard } from "./MaterialCard";
import {
  exportMaterialsJson,
  readJsonFile,
  validateMaterials,
} from "../lib/export";

type EditDraft = Partial<MaterialItem> | null;

export function MaterialsPanel() {
  const open = useCalendarStore((s) => s.materialsOpen);
  const close = useCalendarStore((s) => s.closeMaterials);
  const project = useCalendarStore((s) => s.project);
  const addMaterial = useCalendarStore((s) => s.addMaterial);
  const updateMaterial = useCalendarStore((s) => s.updateMaterial);
  const removeMaterial = useCalendarStore((s) => s.removeMaterial);
  const importMaterials = useCalendarStore((s) => s.importMaterials);
  const pushToast = useCalendarStore((s) => s.pushToast);

  const [query, setQuery] = useState("");
  const [section, setSection] = useState<string | "all">("all");
  const [type, setType] = useState<MaterialType | "all">("all");
  const [editDraft, setEditDraft] = useState<EditDraft>(null);
  const importRef = useRef<HTMLInputElement | null>(null);

  const sections = useMemo(() => uniqueSections(project.materials), [project.materials]);
  const filtered = useMemo(
    () => filterMaterials(project.materials, { query, section, type }),
    [project.materials, query, section, type],
  );

  const attachCount = useMemo(() => {
    const map = new Map<string, number>();
    project.events.forEach((e) => {
      (e.relatedMaterialIds ?? []).forEach((id) => {
        map.set(id, (map.get(id) ?? 0) + 1);
      });
    });
    return map;
  }, [project.events]);

  const onAddNew = () => {
    setEditDraft({
      id: "",
      title: "",
      section: section === "all" ? sections[0] ?? "Без раздела" : section,
      type: "other",
    });
  };

  const onSaveDraft = () => {
    if (!editDraft) return;
    const title = (editDraft.title ?? "").trim();
    if (!title) {
      pushToast("Нужен заголовок фишки", "error");
      return;
    }
    if (editDraft.id) {
      updateMaterial(editDraft.id, {
        title,
        section: (editDraft.section ?? "Без раздела").trim(),
        description: editDraft.description?.trim() || undefined,
        url: editDraft.url?.trim() || undefined,
        type: editDraft.type ?? "other",
        tags: editDraft.tags ?? [],
      });
      pushToast("Фишка обновлена", "success");
    } else {
      addMaterial({
        title,
        section: (editDraft.section ?? "Без раздела").trim(),
        description: editDraft.description?.trim() || undefined,
        url: editDraft.url?.trim() || undefined,
        type: editDraft.type ?? "other",
        tags: editDraft.tags ?? [],
      });
      pushToast("Фишка добавлена", "success");
    }
    setEditDraft(null);
  };

  const onImportClick = () => importRef.current?.click();
  const onImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      const data = await readJsonFile<unknown>(file);
      if (!validateMaterials(data)) {
        pushToast("Не похоже на JSON фишек", "error");
        return;
      }
      importMaterials(data);
    } catch (err) {
      pushToast(err instanceof Error ? err.message : "Не удалось", "error");
    }
  };

  return (
    <Drawer
      open={open}
      onClose={close}
      side="left"
      width={520}
      title="Фишки и материалы"
      ariaLabel="Фишки и материалы"
    >
      <div className="flex flex-col gap-4 px-5 py-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="text-[12px]" style={{ color: "var(--dd-muted)" }}>
            Внутренний архив клуба. Перетаскивай фишки прямо на даты.
          </div>
          <div className="flex items-center gap-2">
            <button type="button" className="dd-btn dd-btn-sm" onClick={onImportClick}>
              Импорт
            </button>
            <button
              type="button"
              className="dd-btn dd-btn-sm"
              onClick={() => exportMaterialsJson(project.materials)}
            >
              Экспорт
            </button>
            <button
              type="button"
              className="dd-btn dd-btn-primary dd-btn-sm"
              onClick={onAddNew}
            >
              Новая фишка
            </button>
            <input
              ref={importRef}
              type="file"
              accept="application/json"
              hidden
              onChange={onImportFile}
            />
          </div>
        </div>

        <input
          className="dd-input"
          placeholder="Поиск по названию, описанию, тэгам"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />

        <div className="grid grid-cols-2 gap-2">
          <select
            className="dd-input dd-select"
            value={section}
            onChange={(e) => setSection(e.target.value)}
            aria-label="Фильтр по разделу"
          >
            <option value="all">Все разделы</option>
            {sections.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <select
            className="dd-input dd-select"
            value={type}
            onChange={(e) => setType(e.target.value as MaterialType | "all")}
            aria-label="Фильтр по типу"
          >
            <option value="all">Все типы</option>
            {MATERIAL_TYPES.map((t) => (
              <option key={t} value={t}>
                {MATERIAL_TYPE_LABEL[t]}
              </option>
            ))}
          </select>
        </div>

        <div className="text-[11px]" style={{ color: "var(--dd-muted)" }}>
          Найдено: {filtered.length} из {project.materials.length}
        </div>

        {editDraft && (
          <div
            className="rounded-[22px] p-4"
            style={{ background: "var(--dd-surface-soft)" }}
          >
            <div className="dd-label mb-2">
              {editDraft.id ? "Редактирование фишки" : "Новая фишка"}
            </div>
            <div className="flex flex-col gap-3">
              <input
                className="dd-input"
                placeholder="Заголовок"
                value={editDraft.title ?? ""}
                onChange={(e) =>
                  setEditDraft((d) => (d ? { ...d, title: e.target.value } : d))
                }
                autoFocus
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  className="dd-input"
                  placeholder="Раздел"
                  list="dd-sections-datalist"
                  value={editDraft.section ?? ""}
                  onChange={(e) =>
                    setEditDraft((d) => (d ? { ...d, section: e.target.value } : d))
                  }
                />
                <select
                  className="dd-input dd-select"
                  value={editDraft.type ?? "other"}
                  onChange={(e) =>
                    setEditDraft((d) =>
                      d ? { ...d, type: e.target.value as MaterialType } : d,
                    )
                  }
                >
                  {MATERIAL_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {MATERIAL_TYPE_LABEL[t]}
                    </option>
                  ))}
                </select>
              </div>
              <input
                className="dd-input"
                placeholder="Ссылка (необязательно)"
                value={editDraft.url ?? ""}
                onChange={(e) =>
                  setEditDraft((d) => (d ? { ...d, url: e.target.value } : d))
                }
              />
              <textarea
                className="dd-input-area"
                placeholder="Короткое описание"
                value={editDraft.description ?? ""}
                onChange={(e) =>
                  setEditDraft((d) =>
                    d ? { ...d, description: e.target.value } : d,
                  )
                }
              />
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  className="dd-btn dd-btn-sm"
                  onClick={() => setEditDraft(null)}
                >
                  Отмена
                </button>
                <button
                  type="button"
                  className="dd-btn dd-btn-primary dd-btn-sm"
                  onClick={onSaveDraft}
                >
                  Сохранить
                </button>
              </div>
            </div>
            <datalist id="dd-sections-datalist">
              {sections.map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
          </div>
        )}

        {filtered.length === 0 ? (
          <div
            className="rounded-2xl p-6 text-center text-sm"
            style={{
              background: "var(--dd-surface-soft)",
              color: "var(--dd-muted)",
            }}
          >
            Ничего не нашли. Попробуй сменить фильтры или добавь новую фишку.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {filtered.map((m) => (
              <MaterialCard
                key={m.id}
                material={m}
                attachedTo={attachCount.get(m.id) ?? 0}
                onEdit={() => setEditDraft({ ...m })}
                onRemove={() => {
                  if (confirm(`Удалить фишку «${m.title}»?`)) {
                    removeMaterial(m.id);
                    pushToast("Фишка удалена", "info");
                  }
                }}
              />
            ))}
          </div>
        )}
      </div>
    </Drawer>
  );
}
