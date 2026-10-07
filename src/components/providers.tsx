"use client";
import { useEffect } from "react";
import { Toaster } from "@/components/ui/sonner";
export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const key = () => {
      document.documentElement.dataset.input = "keyboard";
    };
    const pointer = () => {
      document.documentElement.dataset.input = "pointer";
    };
    window.addEventListener("keydown", key);
    window.addEventListener("pointerdown", pointer);
    return () => {
      window.removeEventListener("keydown", key);
      window.removeEventListener("pointerdown", pointer);
    };
  }, []);
  return (
    <>
      {children}
      <Toaster position="bottom-right" theme="light" />
    </>
  );
}
