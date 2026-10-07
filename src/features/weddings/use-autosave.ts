"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { type InvitationContent } from "@/lib/content";
import { api, ApiError, errorMessage } from "@/lib/api";
export function useAutosave(
  id: string,
  initial: InvitationContent,
  initialSlug: string,
  initialVersion: number,
) {
  const [content, setContent] = useState(initial),
    [slug, setSlug] = useState(initialSlug),
    [savedSlug, setSavedSlug] = useState(initialSlug),
    [status, setStatus] = useState("Saved"),
    [error, setError] = useState("");
  const version = useRef(initialVersion),
    saved = useRef(JSON.stringify({ content: initial, slug: initialSlug })),
    latest = useRef({ content: initial, slug: initialSlug }),
    inFlight = useRef<Promise<boolean> | null>(null),
    blocked = useRef(false);
  const pending = useRef<{
    content: InvitationContent;
    slug: string;
    version: number;
    mutation: string;
  } | null>(null);
  const flush = useCallback(
    async function flushLatest(): Promise<boolean> {
      if (inFlight.current) {
        const ok = await inFlight.current;
        if (!ok || blocked.current) return false;
        return flushLatest();
      }
      if (blocked.current) return false;
      if (saved.current === JSON.stringify(latest.current)) {
        setStatus("Saved");
        setError("");
        return true;
      }
      const task = async () => {
        setStatus("Saving…");
        setError("");
        pending.current ||= {
          ...structuredClone(latest.current),
          version: version.current,
          mutation: crypto.randomUUID(),
        };
        const request = pending.current;
        try {
          const result = await api<{ version: number }>(
            `/api/weddings/${id}/draft`,
            request,
          );
          version.current = result.version;
          setSavedSlug(request.slug);
          saved.current = JSON.stringify({
            content: request.content,
            slug: request.slug,
          });
          pending.current = null;
          setStatus(
            saved.current === JSON.stringify(latest.current)
              ? "Saved"
              : "Unsaved changes",
          );
          return true;
        } catch (e) {
          // These requests were rejected without saving. Corrected input must
          // not keep replaying the rejected mutation or become a tab conflict.
          if (e instanceof ApiError && [400, 422].includes(e.status)) {
            pending.current = null;
            latest.current = {
              ...latest.current,
              slug: JSON.parse(saved.current).slug,
            };
            setSlug(latest.current.slug);
          }
          if (e instanceof ApiError && e.status === 409) blocked.current = true;
          setStatus(
            e instanceof ApiError && e.status === 409
              ? "Conflict"
              : "Not saved",
          );
          setError(errorMessage(e));
          return false;
        }
      };
      inFlight.current = task();
      const ok = await inFlight.current;
      inFlight.current = null;
      if (ok && saved.current !== JSON.stringify(latest.current))
        return flushLatest();
      return ok;
    },
    [id],
  );
  const update = useCallback((next: InvitationContent) => {
    latest.current = { ...latest.current, content: next };
    setContent(next);
    setStatus("Unsaved changes");
  }, []);
  const updateSlug = useCallback((next: string) => {
    latest.current = { ...latest.current, slug: next };
    setSlug(next);
    setStatus("Unsaved changes");
  }, []);
  useEffect(() => {
    const timer = setTimeout(() => {
      void flush();
    }, 700);
    return () => clearTimeout(timer);
  }, [content, slug, flush]);
  useEffect(() => {
    const unload = (e: BeforeUnloadEvent) => {
      if (saved.current !== JSON.stringify(latest.current)) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", unload);
    return () => window.removeEventListener("beforeunload", unload);
  }, []);
  function resolve(
    remoteVersion: number,
    remote?: { content: InvitationContent; slug: string },
  ) {
    version.current = remoteVersion;
    pending.current = null;
    blocked.current = false;
    setError("");
    if (remote) {
      saved.current = JSON.stringify(remote);
      latest.current = remote;
      setContent(remote.content);
      setSlug(remote.slug);
      setSavedSlug(remote.slug);
      setStatus("Saved");
    } else {
      void flush();
    }
  }
  return {
    content,
    slug,
    savedSlug,
    update,
    updateSlug,
    status,
    error,
    flush,
    version,
    resolve,
  };
}
