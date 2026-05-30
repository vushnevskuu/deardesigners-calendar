import { useEffect } from "react";
import { useCalendarStore } from "../state/calendarStore";
import { clipboardItemToDataUrl } from "../lib/image";
import { Toolbar } from "./Toolbar";
import { CalendarGrid } from "./CalendarGrid";
import { PastEventsStrip } from "./PastEventsStrip";
import { EventEditor } from "./EventEditor";
import { MaterialsPanel } from "./MaterialsPanel";
import { ExportPanel } from "./ExportPanel";
import { ToastStack } from "./Toast";

export function CalendarApp() {
  const bootstrap = useCalendarStore((s) => s.bootstrap);
  const pasteImage = useCalendarStore((s) => s.pasteImage);
  const pushToast = useCalendarStore((s) => s.pushToast);

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  useEffect(() => {
    const onPaste = async (e: ClipboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target) {
        const tag = target.tagName;
        if (
          tag === "INPUT" ||
          tag === "TEXTAREA" ||
          target.isContentEditable
        ) {
          return;
        }
      }
      const dataUrl = await clipboardItemToDataUrl(e.clipboardData?.items);
      if (!dataUrl) return;
      e.preventDefault();
      pasteImage(dataUrl);
    };
    document.addEventListener("paste", onPaste);
    return () => document.removeEventListener("paste", onPaste);
  }, [pasteImage]);

  useEffect(() => {
    const onDragOverWindow = (e: DragEvent) => {
      // Не даём браузеру открыть картинку, если её отпустили мимо ячейки
      if (e.dataTransfer?.types?.includes("Files")) {
        e.preventDefault();
      }
    };
    const onDropWindow = (e: DragEvent) => {
      if (e.dataTransfer?.types?.includes("Files")) {
        const target = e.target as HTMLElement | null;
        if (!target?.closest('[role="gridcell"]')) {
          e.preventDefault();
          pushToast("Перетащи картинку прямо на ячейку даты", "info");
        }
      }
    };
    window.addEventListener("dragover", onDragOverWindow);
    window.addEventListener("drop", onDropWindow);
    return () => {
      window.removeEventListener("dragover", onDragOverWindow);
      window.removeEventListener("drop", onDropWindow);
    };
  }, [pushToast]);

  return (
    <div
      className="dd-paper relative min-h-screen"
      style={{
        color: "var(--dd-ink)",
      }}
    >
      <Toolbar />
      <main>
        <CalendarGrid />
        <PastEventsStrip />
      </main>

      <EventEditor />
      <MaterialsPanel />
      <ExportPanel />
      <ToastStack />
    </div>
  );
}
