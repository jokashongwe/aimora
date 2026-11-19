"use client";

import { useEffect } from "react";

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    // En prod, @ducanh2912/next-pwa enregistre /sw.js (+ worker push).
    // En dev le PWA est désactivé : on enregistre le SW push dédié.
    if (process.env.NODE_ENV === "development") {
      navigator.serviceWorker
        .register("/airoma-sw.js")
        .catch((err) => console.warn("SW registration failed", err));
    }
  }, []);

  return null;
}