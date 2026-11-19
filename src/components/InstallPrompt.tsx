"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISS_KEY = "aimora-install-dismissed";
const DISMISS_DAYS = 14;

function readEnv(): string {
  const standalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true;
  const ua = navigator.userAgent;
  const ios =
    /iphone|ipad|ipod/i.test(ua) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  let dismissed = false;
  try {
    const at = Number(localStorage.getItem(DISMISS_KEY) ?? 0);
    dismissed = Date.now() - at < DISMISS_DAYS * 86_400_000;
  } catch {
    /* stockage indisponible : on affiche quand même */
  }
  return `${standalone ? "installed" : ios ? "ios" : "other"}|${dismissed ? "d" : "v"}`;
}

const subscribe = () => () => {};

export function InstallPrompt() {
  const env = useSyncExternalStore(subscribe, readEnv, () => "server|d");
  const [event, setEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setEvent(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => setHidden(true);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const [mode, dismissed] = env.split("|");
  if (hidden || dismissed === "d" || mode === "installed" || mode === "server") {
    return null;
  }
  // Hors iOS, on n'affiche le bandeau que si le navigateur propose l'installation.
  if (mode !== "ios" && !event) return null;

  function dismiss() {
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      /* ignore */
    }
    setHidden(true);
  }

  async function install() {
    if (!event) return;
    await event.prompt();
    await event.userChoice;
    setEvent(null);
    setHidden(true);
  }

  return (
    <aside
      aria-label="Installer l'application"
      className="card-panel flex flex-col gap-3 border-brand-orange/40 sm:flex-row sm:items-center sm:justify-between"
    >
      <div>
        <p className="font-display text-lg font-semibold text-brand-navy">
          Installe Aimora sur ton téléphone
        </p>
        <p className="mt-1 text-sm text-muted">
          {mode === "ios"
            ? "Touche le bouton Partager de Safari, puis « Sur l'écran d'accueil ». C'est nécessaire pour recevoir les rappels du matin sur iPhone."
            : "Accès en un geste depuis l'écran d'accueil, et rappels du matin même quand l'app est fermée."}
        </p>
      </div>
      <div className="flex shrink-0 gap-2">
        {mode !== "ios" ? (
          <button type="button" className="btn-primary" onClick={install}>
            Installer
          </button>
        ) : null}
        <button type="button" className="btn-secondary" onClick={dismiss}>
          Plus tard
        </button>
      </div>
    </aside>
  );
}
