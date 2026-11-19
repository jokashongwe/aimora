"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { urlBase64ToUint8Array } from "@/lib/push-client";

export function NotificationToggle({
  enabled,
  userId,
}: {
  enabled: boolean;
  userId: string;
}) {
  const [supported, setSupported] = useState(false);
  const [active, setActive] = useState(enabled);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const [ios, setIos] = useState(false);

  useEffect(() => {
    setIos(/iphone|ipad|ipod/i.test(navigator.userAgent));
    setSupported(
      typeof window !== "undefined" &&
        "serviceWorker" in navigator &&
        "PushManager" in window &&
        "Notification" in window,
    );
  }, []);

  async function enableNotifications() {
    setLoading(true);
    setMessage(null);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        throw new Error("Permission de notification refusée");
      }

      let registration = await navigator.serviceWorker.getRegistration();
      if (!registration) {
        registration = await navigator.serviceWorker.register("/airoma-sw.js");
      }
      registration = await navigator.serviceWorker.ready;
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidKey) throw new Error("Clé VAPID publique manquante");

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      });

      const json = subscription.toJSON();
      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint: json.endpoint,
          keys: json.keys,
        }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Échec de l'abonnement");

      const supabase = createClient();
      await supabase
        .from("profiles")
        .update({ notifications_enabled: true })
        .eq("id", userId);

      setActive(true);
      setMessage("Notifications activées. Tu recevras un rappel chaque matin.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Erreur notifications");
    } finally {
      setLoading(false);
    }
  }

  async function disableNotifications() {
    setLoading(true);
    setMessage(null);
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await fetch("/api/push/unsubscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        });
        await subscription.unsubscribe();
      }

      const supabase = createClient();
      await supabase
        .from("profiles")
        .update({ notifications_enabled: false })
        .eq("id", userId);

      setActive(false);
      setMessage("Notifications désactivées.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }

  if (!supported) {
    return (
      <p className="text-sm text-muted">
        {ios
          ? "Sur iPhone, installe d'abord Airoma : touche Partager dans Safari, puis « Sur l'écran d'accueil ». Ouvre ensuite l'app depuis l'icône et reviens ici pour activer les rappels."
          : "Les notifications push ne sont pas supportées sur cet appareil / navigateur."}
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted">
        Reçois chaque matin un message motivationnel lié à tes objectifs
        hebdomadaires, mensuels et semestriels.
      </p>
      <button
        type="button"
        className={active ? "btn-secondary" : "btn-primary"}
        disabled={loading}
        onClick={active ? disableNotifications : enableNotifications}
      >
        {loading
          ? "Patiente…"
          : active
            ? "Désactiver les notifications"
            : "Activer les rappels matinaux"}
      </button>
      {message ? <p className="text-sm text-brand-navy">{message}</p> : null}
    </div>
  );
}