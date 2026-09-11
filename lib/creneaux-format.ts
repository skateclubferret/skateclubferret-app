import type { CreneauModele } from "./family-context";

// Mêmes libellés que mon-espace.html (LIEU_LABELS_ESPACE / JOURS_LABELS_ESPACE)
// — à garder synchronisés si le site ajoute un lieu.
export const LIEU_LABELS: Record<string, string> = {
  cassieu: "Cassieu — Lège",
  mimbeau: "Mimbeau — Cap Ferret",
};

export const JOURS_LABELS = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];

export function lieuLabel(lieu: string) {
  return LIEU_LABELS[lieu] || lieu;
}

export function heureLabel(heure: string | null | undefined) {
  return (heure || "").slice(0, 5);
}

export function dateLabel(iso: string) {
  return new Date(iso + "T00:00:00").toLocaleDateString("fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export function groupeLabel(modele: CreneauModele | undefined | null) {
  if (!modele) return "Groupe";
  const jours = [...(modele.jours_semaine || [])]
    .sort()
    .map((j) => JOURS_LABELS[j])
    .filter(Boolean)
    .join(", ");
  const horaire = modele.heure_debut
    ? `${heureLabel(modele.heure_debut)}${modele.heure_fin ? "–" + heureLabel(modele.heure_fin) : ""}`
    : "";
  const lieu = lieuLabel(modele.lieu);
  return [jours, horaire, lieu].filter(Boolean).join(" · ") || modele.nom || "Groupe";
}

export function enfantAge(dateNaissance: string | null) {
  if (!dateNaissance) return null;
  const dob = new Date(dateNaissance);
  if (Number.isNaN(dob.getTime())) return null;
  const years = Math.floor((Date.now() - dob.getTime()) / (365.25 * 24 * 3600 * 1000));
  return years < 0 ? null : years;
}
