import type { EventItem, MaterialItem, MaterialType } from "./types";

export type MaterialFilter = {
  query: string;
  section: string | "all";
  type: MaterialType | "all";
};

export function filterMaterials(
  materials: MaterialItem[],
  filter: MaterialFilter,
): MaterialItem[] {
  const q = filter.query.trim().toLowerCase();
  return materials.filter((m) => {
    if (filter.section !== "all" && m.section !== filter.section) return false;
    if (filter.type !== "all" && (m.type ?? "other") !== filter.type) return false;
    if (!q) return true;
    const haystack = [m.title, m.section, m.description, m.url, ...(m.tags ?? [])]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return haystack.includes(q);
  });
}

export function uniqueSections(materials: MaterialItem[]): string[] {
  const set = new Set<string>();
  materials.forEach((m) => set.add(m.section));
  return Array.from(set).sort((a, b) => a.localeCompare(b, "ru"));
}

export function attachMaterialId(
  event: EventItem,
  materialId: string,
): EventItem {
  const ids = new Set(event.relatedMaterialIds ?? []);
  ids.add(materialId);
  return { ...event, relatedMaterialIds: Array.from(ids) };
}

export function detachMaterialId(
  event: EventItem,
  materialId: string,
): EventItem {
  return {
    ...event,
    relatedMaterialIds: (event.relatedMaterialIds ?? []).filter(
      (id) => id !== materialId,
    ),
  };
}

export function materialsForEvent(
  event: EventItem,
  materials: MaterialItem[],
): MaterialItem[] {
  if (!event.relatedMaterialIds?.length) return [];
  const map = new Map(materials.map((m) => [m.id, m]));
  return event.relatedMaterialIds
    .map((id) => map.get(id))
    .filter((m): m is MaterialItem => Boolean(m));
}
