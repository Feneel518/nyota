"use client";
import { useEffect, useState } from "react";
import { contentSchema, type InvitationContent } from "@/lib/content";
import { Guest } from "@/features/invitations/guest";
export function Preview({ initial }: { initial: InvitationContent }) {
  const [content, setContent] = useState(initial);
  useEffect(() => {
    const receive = (e: MessageEvent) => {
      if (
        e.origin !== location.origin ||
        e.source !== parent ||
        e.data?.type !== "invitation-preview"
      )
        return;
      const parsed = contentSchema.safeParse(e.data.content);
      if (parsed.success) setContent(parsed.data);
    };
    window.addEventListener("message", receive);
    parent.postMessage({ type: "preview-ready" }, location.origin);
    return () => window.removeEventListener("message", receive);
  }, []);
  return <Guest content={content} mode="preview" />;
}
