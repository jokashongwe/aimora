/** Traduit les erreurs Supabase Auth (en anglais) en messages français clairs. */
export function frenchAuthError(err: unknown): string {
  const raw =
    err instanceof Error
      ? err.message
      : typeof err === "object" && err && "message" in err
        ? String((err as { message: unknown }).message)
        : "";
  const m = raw.toLowerCase();

  if (m.includes("invalid login credentials"))
    return "E-mail ou mot de passe incorrect.";
  if (m.includes("email not confirmed"))
    return "Confirme d'abord ton adresse e-mail : un lien t'a été envoyé par mail.";
  if (m.includes("already registered") || m.includes("already been registered"))
    return "Un compte existe déjà avec cet e-mail. Essaie de te connecter.";
  if (m.includes("password should be at least") || m.includes("weak password"))
    return "Mot de passe trop faible : utilise au moins 8 caractères.";
  if (m.includes("different from the old password"))
    return "Choisis un mot de passe différent de l'ancien.";
  if (m.includes("rate limit") || m.includes("too many"))
    return "Trop de tentatives. Réessaie dans quelques minutes.";
  if (m.includes("invalid email") || m.includes("unable to validate email"))
    return "Cette adresse e-mail ne semble pas valide.";
  if (m.includes("failed to fetch") || m.includes("network"))
    return "Connexion impossible. Vérifie ton réseau et réessaie.";
  if (m.includes("session") && m.includes("missing"))
    return "Le lien a expiré. Demande un nouveau lien de réinitialisation.";
  return "Une erreur est survenue. Réessaie dans un instant.";
}
