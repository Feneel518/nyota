"use client";
import { createContext, useContext } from "react";
import type { Language } from "@/lib/content";
export const UiLanguage = createContext({
  language: "en" as Language,
  t: (text: string) => text,
});
export function useUiLanguage() {
  return useContext(UiLanguage);
}
