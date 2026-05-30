import type { CSSProperties } from "react";
import type { EmbedQuerySettings, EmbedTheme } from "./types";

// Возвращает className для root-элемента iframe-режима.
// Все темы базируются на dd-paper (тёплый фон проекта); inline-style ниже
// при необходимости перекрашивает фон в более светлый/чистый.
export function applyEmbedTheme(
  baseClass: string,
  _theme: EmbedTheme | undefined,
): string {
  return `${baseClass} dd-paper`;
}

// Стиль для root-элемента iframe-режима.
// theme: paper — дефолтный тёплый фон; light — чуть холоднее; clean — белый.
// height=fixed — растягиваем контент на всю высоту окна (для iframe со 100vh);
// height=auto (или undefined) — естественная высота, лучше для Tilda.
export function embedRootStyle(
  theme: EmbedTheme | undefined,
  height: EmbedQuerySettings["height"],
): CSSProperties {
  const style: CSSProperties = {};
  if (height === "fixed") {
    style.minHeight = "100vh";
  }
  if (theme === "light") {
    style.background = "#fafaf6";
  } else if (theme === "clean") {
    style.background = "#ffffff";
  }
  return style;
}
