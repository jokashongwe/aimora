import * as webpush from "web-push";

export function configureWebPush() {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || "mailto:airoma@example.com";

  if (!publicKey || !privateKey) {
    throw new Error("Missing VAPID keys");
  }

  webpush.setVapidDetails(subject, publicKey, privateKey);
  return webpush;
}

export type PushPayload = {
  title: string;
  body: string;
  url?: string;
};