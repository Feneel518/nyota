"use client";
import { useCallback, useState } from "react";
import { usePathname } from "next/navigation";
import { UiLanguage, useUiLanguage } from "./ui-language-context";
export { useUiLanguage } from "./ui-language-context";
import type { Language } from "@/lib/content";
import { ownerGujarati } from "@/content/owner-gu";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
export function OwnerLanguage({
  initial,
  children,
}: {
  initial: Language;
  children: React.ReactNode;
}) {
  const [language, setLanguage] = useState(initial);
  const pathname = usePathname();
  const isPreview = pathname.endsWith("/preview");
  const t = useCallback(
    (text: string) => (language === "gu" ? ownerGujarati[text] || text : text),
    [language],
  );
  return (
    <UiLanguage.Provider value={{ language, t }}>
      <div
        lang={language}
        data-owner-surface={
          pathname === "/sign-in/verify"
            ? "auth-verify"
            : pathname.startsWith("/sign-in")
              ? "auth"
              : "workspace"
        }
      >
        {!isPreview && (
          <div className="owner-language-bar">
            <span>
              {language === "gu" ? "કાર્યસ્થળની ભાષા" : "Workspace language"}
            </span>
            <ToggleGroup
              type="single"
              value={language}
              aria-label="Workspace language"
              onValueChange={(value) => {
                if (value !== "en" && value !== "gu") return;
                setLanguage(value);
                document.cookie = `owner-language=${value}; Path=/; Max-Age=31536000; SameSite=Lax${location.protocol === "https:" ? "; Secure" : ""}`;
              }}
            >
              <ToggleGroupItem value="en" aria-label="English workspace">
                English
              </ToggleGroupItem>
              <ToggleGroupItem value="gu" aria-label="ગુજરાતી કાર્યસ્થળ">
                ગુજરાતી
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
        )}
        {children}
      </div>
    </UiLanguage.Provider>
  );
}
export function OwnerText({ children }: { children: string }) {
  const { t } = useUiLanguage();
  return t(children);
}
