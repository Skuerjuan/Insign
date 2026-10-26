"use client";

import { useLayoutEffect } from "react";

export default function ThemeInitializer() {
  useLayoutEffect(() => {
    try {
      const savedTheme = window.localStorage.getItem("insign-theme");
      document.documentElement.dataset.theme = savedTheme === "oscuro" ? "dark" : "light";
    } catch {
      document.documentElement.dataset.theme = "light";
    }
  }, []);

  return null;
}
