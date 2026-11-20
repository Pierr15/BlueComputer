"use client";

import { Moon, Sun } from "lucide-react";
import { useSyncExternalStore } from "react";

const THEME_EVENT = "bluecomputer-theme-change";
const getTheme = () => typeof window !== "undefined" && (window.localStorage.getItem("bluecomputer-theme") === "dark" || (!window.localStorage.getItem("bluecomputer-theme") && window.matchMedia("(prefers-color-scheme: dark)").matches));
const subscribe = (callback: () => void) => {
  window.addEventListener(THEME_EVENT, callback);
  return () => window.removeEventListener(THEME_EVENT, callback);
};

export function ThemeToggle() {
  const dark = useSyncExternalStore(subscribe, getTheme, () => false);

  function toggle() {
    const next = !dark;
    document.documentElement.dataset.theme = next ? "dark" : "light";
    window.localStorage.setItem("bluecomputer-theme", next ? "dark" : "light");
    window.dispatchEvent(new Event(THEME_EVENT));
  }

  return (
    <button className="theme-toggle" onClick={toggle} aria-label={dark ? "Gunakan mode terang" : "Gunakan mode gelap"}>
      <span className="theme-toggle__thumb" aria-hidden="true">{dark ? <Moon size={14} /> : <Sun size={14} />}</span>
      <span className="sr-only">Ganti tema</span>
    </button>
  );
}
