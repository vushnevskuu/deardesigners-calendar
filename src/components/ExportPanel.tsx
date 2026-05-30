import { useMemo, useRef, useState } from "react";
import { useCalendarStore } from "../state/calendarStore";
import {
  EXPORT_PRESETS,
  type ExportPreset,
} from "../lib/types";
import {
  exportNodeToPng,
  exportProjectJson,
  exportMaterialsJson,
  presetSize,
  readJsonFile,
  validateMaterials,
  validateProject,
} from "../lib/export";
import { Drawer } from "./Drawer";
import { ExportCanvas } from "./ExportCanvas";

const BG_LABELS: Record<"paper" | "clean" | "dots" | "poster", string> = {
  paper: "Бумага",
  clean: "Чистый",
  dots: "Точки",
  poster: "Постер",
};

export function ExportPanel() {
  const open = useCalendarStore((s) => s.exportOpen);
  const close = useCalendarStore((s) => s.closeExport);
  const project = useCalendarStore((s) => s.project);
  const setExportSettings = useCalendarStore((s) => s.setExportSettings);
  const setTheme = useCalendarStore((s) => s.setTheme);
  const importProject = useCalendarStore((s) => s.importProject);
  const importMaterials = useCalendarStore((s) => s.importMaterials);
  const pushToast = useCalendarStore((s) => s.pushToast);

  const canvasRef = useRef<HTMLDivElement | null>(null);
  const importRef = useRef<HTMLInputElement | null>(null);
  const [busy, setBusy] = useState(false);

  const settings = project.exportSettings;
  const { width, height } = useMemo(
    () => presetSize(settings.preset),
    [settings.preset],
  );

  const previewScale = useMemo(() => {
    const maxW = 420;
    const maxH = 600;
    const wScale = maxW / width;
    const hScale = height ? maxH / height : 1;
    return Math.min(wScale, hScale, 0.5);
  }, [width, height]);

  const onPng = async () => {
    if (!canvasRef.current) return;
    try {
      setBusy(true);
      await exportNodeToPng(
        canvasRef.current,
        settings,
        `${project.title || "calendar"}-${project.month}-${settings.preset}`,
      );
      pushToast("PNG скачивается", "success");
    } catch (err) {
      pushToast(err instanceof Error ? err.message : "Не удалось", "error");
    } finally {
      setBusy(false);
    }
  };

  const onProjectJson = () => {
    exportProjectJson(project);
    pushToast("Проект экспортирован", "success");
  };

  const onMaterialsJson = () => {
    exportMaterialsJson(project.materials);
    pushToast("Фишки экспортированы", "success");
  };

  const onImportClick = () => importRef.current?.click();
  const onImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      const data = await readJsonFile<unknown>(file);
      if (validateProject(data)) {
        importProject(data);
        return;
      }
      if (validateMaterials(data)) {
        importMaterials(data);
        return;
      }
      pushToast("Не похоже на проект или фишки", "error");
    } catch (err) {
      pushToast(err instanceof Error ? err.message : "Не валидный JSON", "error");
    }
  };

  return (
    <Drawer
      open={open}
      onClose={close}
      side="right"
      width={580}
      title="Экспорт календаря"
      ariaLabel="Экспорт"
    >
      <div className="flex flex-col gap-5 px-5 py-5">
        <div>
          <span className="dd-label">Пресет</span>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {EXPORT_PRESETS.map((p) => {
              const active = settings.preset === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setExportSettings({ preset: p.id as ExportPreset })}
                  className="rounded-[18px] px-3 py-2 text-left text-[13px] transition"
                  style={{
                    background: active ? "var(--dd-ink)" : "var(--dd-surface-soft)",
                    color: active ? "#fff" : "var(--dd-ink)",
                  }}
                >
                  <div className="font-medium">{p.label}</div>
                  <div
                    className="text-[11px]"
                    style={{
                      color: active ? "rgba(255,255,255,0.7)" : "var(--dd-muted)",
                    }}
                  >
                    {p.w} × {p.h ?? "auto"}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <span className="dd-label">Фон</span>
          <div className="mt-2 grid grid-cols-4 gap-2">
            {(Object.keys(BG_LABELS) as Array<keyof typeof BG_LABELS>).map((bg) => {
              const active = project.theme.backgroundStyle === bg;
              return (
                <button
                  key={bg}
                  type="button"
                  onClick={() => setTheme({ backgroundStyle: bg })}
                  className="rounded-dd-pill px-3 py-2 text-[13px]"
                  style={{
                    background: active ? "var(--dd-ink)" : "var(--dd-surface-soft)",
                    color: active ? "#fff" : "var(--dd-ink)",
                  }}
                >
                  {BG_LABELS[bg]}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Toggle
            label="Шапка"
            value={settings.includeHeader}
            onChange={(v) => setExportSettings({ includeHeader: v })}
          />
          <Toggle
            label="Название месяца"
            value={settings.includeMonthTitle}
            onChange={(v) => setExportSettings({ includeMonthTitle: v })}
          />
          <Toggle
            label="Картинки событий"
            value={settings.showEventImages}
            onChange={(v) => setExportSettings({ showEventImages: v })}
          />
          <Toggle
            label="Прошедшие события"
            value={settings.showPastEvents}
            onChange={(v) => setExportSettings({ showPastEvents: v })}
          />
          <Toggle
            label="Фишки и материалы"
            value={settings.showMaterials}
            onChange={(v) => setExportSettings({ showMaterials: v })}
          />
          <Toggle
            label="Компактные карточки"
            value={settings.compactMode}
            onChange={(v) => setExportSettings({ compactMode: v })}
          />
        </div>

        <div>
          <div className="flex items-center justify-between">
            <span className="dd-label">Чёткость PNG</span>
            <span className="text-[12px]" style={{ color: "var(--dd-muted)" }}>
              ×{settings.scale.toFixed(1)}
            </span>
          </div>
          <input
            type="range"
            min={1}
            max={3}
            step={0.5}
            value={settings.scale}
            onChange={(e) =>
              setExportSettings({ scale: Number(e.target.value) || 2 })
            }
            className="mt-2 w-full accent-[color:var(--dd-accent)]"
          />
        </div>

        <div>
          <span className="dd-label">Превью</span>
          <div
            className="mt-2 overflow-hidden rounded-3xl"
            style={{ background: "var(--dd-surface-soft)" }}
          >
            <div
              className="dd-scroll relative flex items-center justify-center overflow-hidden p-4"
              style={{ minHeight: 260 }}
            >
              <div
                style={{
                  width: width * previewScale,
                  height: (height ?? width * 0.75) * previewScale,
                }}
                className="overflow-hidden rounded-2xl"
              >
                <div
                  style={{
                    transform: `scale(${previewScale})`,
                    transformOrigin: "top left",
                  }}
                >
                  <ExportCanvas project={project} settings={settings} />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={onPng}
            className="dd-btn dd-btn-primary"
          >
            {busy ? "Готовим PNG..." : "Скачать PNG"}
          </button>
          <button type="button" className="dd-btn dd-btn-sm" onClick={onProjectJson}>
            Экспорт JSON проекта
          </button>
          <button type="button" className="dd-btn dd-btn-sm" onClick={onMaterialsJson}>
            Экспорт JSON фишек
          </button>
          <button type="button" className="dd-btn dd-btn-sm" onClick={onImportClick}>
            Импорт JSON
          </button>
          <input
            ref={importRef}
            type="file"
            accept="application/json"
            hidden
            onChange={onImportFile}
          />
        </div>

        <div className="text-[11px]" style={{ color: "var(--dd-muted)" }}>
          В PNG ссылки фишек не интерактивные — это просто текстовые чипы.
        </div>
      </div>

      {/* Полноразмерный экспорт-узел: вне видимой области, чтобы PNG получился точно нужного размера */}
      <div
        aria-hidden
        style={{
          position: "fixed",
          left: -100000,
          top: 0,
          pointerEvents: "none",
        }}
      >
        <ExportCanvas
          ref={canvasRef}
          project={project}
          settings={settings}
        />
      </div>
    </Drawer>
  );
}

function Toggle({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className="flex items-center justify-between rounded-dd-pill px-4 py-2 text-[13px] transition"
      style={{
        background: value ? "var(--dd-ink)" : "var(--dd-surface-soft)",
        color: value ? "#fff" : "var(--dd-ink)",
      }}
      role="switch"
      aria-checked={value}
    >
      <span>{label}</span>
      <span
        aria-hidden
        className="flex h-5 w-9 items-center rounded-full p-[2px] transition"
        style={{
          background: value ? "rgba(255,255,255,0.85)" : "rgba(0,0,0,0.18)",
        }}
      >
        <span
          className="h-3 w-3 rounded-full transition"
          style={{
            background: "var(--dd-ink)",
            transform: value ? "translateX(16px)" : "translateX(0)",
          }}
        />
      </span>
    </button>
  );
}
