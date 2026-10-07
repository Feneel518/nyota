"use client";

import { useState } from "react";
import { useUiLanguage } from "@/components/owner-language";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { WordingTemplate } from "@/content/invitation-templates";
import type { Language } from "@/lib/content";

export function WordingTemplates({
  kind,
  templates,
  language,
  onApply,
}: {
  kind: "families" | "wording";
  templates: WordingTemplate[];
  language: Language;
  onApply: (text: WordingTemplate["text"], both: boolean) => void;
}) {
  const { t } = useUiLanguage();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(templates[0].id);
  const template =
    templates.find((item) => item.id === selected) || templates[0];
  return (
    <>
      <Button
        className="self-start"
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
      >
        {t("Browse 6 templates")}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85dvh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>
              {t(
                kind === "families"
                  ? "Family line templates"
                  : "Invitation wording templates",
              )}
            </DialogTitle>
            <DialogDescription>
              {t(
                "Choose a starting point. You can edit every word after applying it.",
              )}
            </DialogDescription>
          </DialogHeader>
          <Select value={selected} onValueChange={setSelected}>
            <SelectTrigger aria-label={t("Wording style")} className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {templates.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.label[language]}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          <div className="template-preview">
            <div lang="en">
              <strong>English</strong>
              <p>{template.text.en}</p>
            </div>
            <div lang="gu">
              <strong>ગુજરાતી</strong>
              <p>{template.text.gu}</p>
            </div>
          </div>
          <p className="small-note">
            {t(
              "Applying a template replaces the wording in the languages you choose.",
            )}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => {
                onApply(template.text, true);
                setOpen(false);
              }}
            >
              {t("Use English & Gujarati")}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                onApply(template.text, false);
                setOpen(false);
              }}
            >
              {t(language === "gu" ? "Use Gujarati only" : "Use English only")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
