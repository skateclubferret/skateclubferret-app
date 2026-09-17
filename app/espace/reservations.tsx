import { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useFamily, type CreneauModele } from "@/lib/family-context";
import { supabase } from "@/lib/supabase";
import { colors, fonts, radii, spacing } from "@/constants/theme";
import { EspaceHeader } from "@/components/EspaceHeader";
import { dateLabel, groupeLabel, heureLabel, lieuLabel } from "@/lib/creneaux-format";

type Creneau = {
  id: string;
  modele_id: string | null;
  date: string;
  heure_debut: string;
  heure_fin: string;
  lieu: string;
  niveau: string | null;
  capacite_max: number;
  places_reservees: number;
};

type Reservation = { id: string; creneau_id: string; adherent_id: string | null; enfant_id: string | null };

const NIVEAUX = ["Découverte", "Initiation", "Initiation avancé", "Début perfectionnement", "Perfectionnement"];

function toISODate(d: Date) {
  return d.toISOString().slice(0, 10);
}

// Même contenu que la tuile « Mes réservations stages vacances » de
// mon-espace.html : réservation d'un stage (participant + carte + niveau,
// écriture dans `reservations` — capacité et débit de séance gérés côté
// base par les mêmes triggers que le site) + consultation des prochains
// cours à l'année de la famille.
export default function ReservationsScreen() {
  const { adherent, enfants, cartes, inscriptionsAnnee, modelesAnnee, loading: familyLoading, reload } = useFamily();

  const [stages, setStages] = useState<{ modele: CreneauModele; creneaux: Creneau[] }[]>([]);
  const [mesReservations, setMesReservations] = useState<Record<string, { id: string; label: string }[]>>({});
  const [coursAnneeCreneaux, setCoursAnneeCreneaux] = useState<Creneau[]>([]);
  const [loadingLocal, setLoadingLocal] = useState(true);

  const [openId, setOpenId] = useState<string | null>(null);
  const [participant, setParticipant] = useState<string>("adherent");
  const [carteId, setCarteId] = useState<string | null>(null);
  const [niveau, setNiveau] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const cartesUsables = cartes.filter((c) => (c.seances_totales || 0) - (c.seances_utilisees || 0) > 0);

  async function loadAll() {
    setLoadingLocal(true);
    const todayIso = toISODate(new Date());

    const { data: modelesStage } = await supabase
      .from("creneaux_modeles")
      .select("*")
      .eq("categorie", "stage")
      .eq("actif", true)
      .eq("ouvert_reservations", true);

    const modeles = (modelesStage as CreneauModele[]) || [];

    if (modeles.length === 0) {
      setStages([]);
      setMesReservations({});
    } else {
      const { data: creneauxStage } = await supabase
        .from("creneaux")
        .select("*")
        .eq("categorie", "stage")
        .eq("statut", "actif")
        .in(
          "modele_id",
          modeles.map((m) => m.id)
        )
        .gte("date", todayIso)
        .order("date", { ascending: true })
        .order("heure_debut", { ascending: true });

      const list = (creneauxStage as Creneau[]) || [];
      setStages(
        modeles
          .map((modele) => ({ modele, creneaux: list.filter((c) => c.modele_id === modele.id) }))
          .filter((g) => g.creneaux.length > 0)
      );

      const ids = list.map((c) => c.id);
      const byCreneau: Record<string, { id: string; label: string }[]> = {};
      if (ids.length > 0) {
        const { data: reservations } = await supabase
          .from("reservations")
          .select("id, creneau_id, adherent_id, enfant_id")
          .in("creneau_id", ids)
          .eq("statut", "confirmee");
        ((reservations as Reservation[] | null) || []).forEach((r) => {
          const label = r.enfant_id
            ? enfants.find((e) => e.id === r.enfant_id)?.prenom || "Enfant"
            : adherent?.prenom || "Moi";
          if (!byCreneau[r.creneau_id]) byCreneau[r.creneau_id] = [];
          byCreneau[r.creneau_id].push({ id: r.id, label });
        });
      }
      setMesReservations(byCreneau);
    }

    const modeleAnneeIds = [...new Set(inscriptionsAnnee.map((i) => i.modele_id))];
    if (modeleAnneeIds.length > 0) {
      const { data: creneauxAnnee } = await supabase
        .from("creneaux")
        .select("*")
        .eq("categorie", "annee")
        .eq("statut", "actif")
        .in("modele_id", modeleAnneeIds)
        .gte("date", todayIso)
        .order("date", { ascending: true })
        .order("heure_debut", { ascending: true });
      setCoursAnneeCreneaux((creneauxAnnee as Creneau[]) || []);
    } else {
      setCoursAnneeCreneaux([]);
    }

    setLoadingLocal(false);
  }

  useEffect(() => {
    if (!familyLoading) loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [familyLoading]);

  function participantOptions() {
    const opts = [{ value: "adherent", label: adherent?.prenom || "Moi" }];
    enfants.forEach((e) => opts.push({ value: `enfant:${e.id}`, label: e.prenom }));
    return opts;
  }

  function openForm(creneauId: string) {
    setOpenId(openId === creneauId ? null : creneauId);
    setParticipant("adherent");
    setCarteId(cartesUsables[0]?.id || null);
    setNiveau(null);
    setFormError(null);
  }

  async function handleReserver(creneauId: string) {
    setFormError(null);
    if (!carteId) {
      setFormError("Vous n'avez aucune carte de cours avec des séances disponibles.");
      return;
    }
    if (!niveau) {
      setFormError("Merci de préciser le niveau de la personne inscrite.");
      return;
    }

    let santeOk = false;
    let dobOk = true;
    if (participant === "adherent") {
      santeOk = !!adherent?.sante_rempli;
    } else {
      const enfant = enfants.find((e) => `enfant:${e.id}` === participant);
      santeOk = !!enfant?.sante_rempli;
      dobOk = !!enfant?.date_naissance;
    }
    if (!santeOk) {
      setFormError(
        "Le questionnaire de santé n'est pas encore rempli pour cette personne — complétez-le sur le site avant de réserver."
      );
      return;
    }
    if (!dobOk) {
      setFormError("La date de naissance de cet enfant n'est pas renseignée. Complétez sa fiche dans « Mes enfants et moi » avant de réserver.");
      return;
    }

    setSubmitting(true);
    const payload: Record<string, unknown> = {
      creneau_id: creneauId,
      carte_cours_id: carteId,
      statut: "confirmee",
      niveau,
    };
    if (participant === "adherent") {
      payload.adherent_id = adherent!.id;
    } else {
      payload.enfant_id = participant.split(":")[1];
    }

    const { error } = await supabase.from("reservations").insert(payload);
    setSubmitting(false);

    if (error) {
      setFormError(
        error.message.includes("complet")
          ? "Ce créneau est complet."
          : error.message.includes("annule")
            ? "Ce créneau a été annulé."
            : "Erreur : " + error.message
      );
      return;
    }

    setOpenId(null);
    await loadAll();
    reload();
  }

  async function handleAnnuler(resaId: string) {
    await supabase.from("reservations").update({ statut: "annulee" }).eq("id", resaId);
    await loadAll();
    reload();
  }

  const loading = familyLoading || loadingLocal;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <EspaceHeader eyebrow="ESPACE ADHÉRENT" title="Mes réservations stages vacances" />

      {loading && <ActivityIndicator color={colors.navy} style={{ marginTop: spacing(4) }} />}

      {!loading && (
        <>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Réserver un stage vacances</Text>
            <Text style={styles.sectionSubtitle}>
              Choisissez un créneau disponible pour vous-même ou l'un de vos enfants. Les cours à l'année sont
              attribués directement par le club selon votre pré-inscription.
            </Text>

            {stages.length === 0 && (
              <Text style={styles.subtitle}>Aucun stage ouvert aux réservations pour l'instant.</Text>
            )}

            {stages.map(({ modele, creneaux }) => (
              <View key={modele.id} style={styles.card}>
                <Text style={styles.cardTitle}>{modele.nom}</Text>
                <Text style={styles.cardMeta}>
                  {lieuLabel(modele.lieu)}
                  {modele.niveau ? ` · ${modele.niveau}` : ""}
                </Text>

                {creneaux.map((c) => {
                  const restantes = c.capacite_max - c.places_reservees;
                  const complet = restantes <= 0;
                  const mine = mesReservations[c.id] || [];
                  const isOpen = openId === c.id;

                  return (
                    <View key={c.id} style={styles.creneauRow}>
                      <View style={styles.creneauHeader}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.creneauDate}>
                            {dateLabel(c.date)} · {heureLabel(c.heure_debut)}–{heureLabel(c.heure_fin)}
                          </Text>
                          {c.niveau && <Text style={styles.creneauNiveau}>{c.niveau}</Text>}
                        </View>
                        <Text style={[styles.placesBadge, complet ? styles.placesFull : styles.placesOk]}>
                          {complet ? "Complet" : `${restantes} place${restantes > 1 ? "s" : ""}`}
                        </Text>
                      </View>

                      {mine.map((r) => (
                        <View key={r.id} style={styles.mineRow}>
                          <Text style={styles.mineLabel}>✓ {r.label}</Text>
                          <TouchableOpacity onPress={() => handleAnnuler(r.id)}>
                            <Text style={styles.cancelLink}>Annuler</Text>
                          </TouchableOpacity>
                        </View>
                      ))}

                      {!complet && (
                        <TouchableOpacity onPress={() => openForm(c.id)}>
                          <Text style={styles.toggleLink}>{isOpen ? "Fermer" : "Réserver →"}</Text>
                        </TouchableOpacity>
                      )}

                      {isOpen && (
                        <View style={styles.form}>
                          <Text style={styles.formLabel}>Pour qui ?</Text>
                          <View style={styles.chipRow}>
                            {participantOptions().map((opt) => (
                              <TouchableOpacity
                                key={opt.value}
                                style={[styles.chip, participant === opt.value && styles.chipActive]}
                                onPress={() => setParticipant(opt.value)}
                              >
                                <Text style={[styles.chipText, participant === opt.value && styles.chipTextActive]}>
                                  {opt.label}
                                </Text>
                              </TouchableOpacity>
                            ))}
                          </View>

                          <Text style={styles.formLabel}>Carte de cours</Text>
                          {cartesUsables.length === 0 ? (
                            <Text style={styles.smallNote}>Aucune carte de cours avec des séances disponibles.</Text>
                          ) : (
                            <View style={styles.chipRow}>
                              {cartesUsables.map((carte) => {
                                const restantesCarte = (carte.seances_totales || 0) - (carte.seances_utilisees || 0);
                                return (
                                  <TouchableOpacity
                                    key={carte.id}
                                    style={[styles.chip, carteId === carte.id && styles.chipActive]}
                                    onPress={() => setCarteId(carte.id)}
                                  >
                                    <Text style={[styles.chipText, carteId === carte.id && styles.chipTextActive]}>
                                      {carte.type_carte} — {restantesCarte} séance{restantesCarte > 1 ? "s" : ""}
                                    </Text>
                                  </TouchableOpacity>
                                );
                              })}
                            </View>
                          )}

                          <Text style={styles.formLabel}>Niveau</Text>
                          <View style={styles.chipRow}>
                            {NIVEAUX.map((n) => (
                              <TouchableOpacity
                                key={n}
                                style={[styles.chip, niveau === n && styles.chipActive]}
                                onPress={() => setNiveau(n)}
                              >
                                <Text style={[styles.chipText, niveau === n && styles.chipTextActive]}>{n}</Text>
                              </TouchableOpacity>
                            ))}
                          </View>

                          {formError && <Text style={styles.error}>{formError}</Text>}

                          <TouchableOpacity
                            style={[styles.confirmButton, submitting && { opacity: 0.7 }]}
                            onPress={() => handleReserver(c.id)}
                            disabled={submitting}
                          >
                            {submitting ? (
                              <ActivityIndicator color={colors.white} />
                            ) : (
                              <Text style={styles.confirmButtonText}>Confirmer</Text>
                            )}
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            ))}
          </View>

          {adherent && inscriptionsAnnee.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Mes prochains cours</Text>
              {inscriptionsAnnee.map((inscr) => {
                const modele = modelesAnnee.find((m) => m.id === inscr.modele_id);
                const participantLabel = inscr.enfant_id
                  ? enfants.find((e) => e.id === inscr.enfant_id)?.prenom || "Enfant"
                  : adherent.prenom || "Moi";
                const prochains = coursAnneeCreneaux.filter((c) => c.modele_id === inscr.modele_id).slice(0, 3);
                return (
                  <View key={inscr.id} style={styles.card}>
                    <Text style={styles.cardTitle}>{groupeLabel(modele)}</Text>
                    <Text style={styles.cardMeta}>{participantLabel}</Text>
                    {prochains.length === 0 ? (
                      <Text style={styles.smallNote}>Aucune séance programmée pour l'instant.</Text>
                    ) : (
                      prochains.map((c) => (
                        <Text key={c.id} style={styles.creneauDate}>
                          {dateLabel(c.date)} · {heureLabel(c.heure_debut)}–{heureLabel(c.heure_fin)}
                        </Text>
                      ))
                    )}
                  </View>
                );
              })}
            </View>
          )}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.sand },
  content: { padding: spacing(6), gap: spacing(3) },
  section: { gap: spacing(2.5) },
  sectionTitle: {
    fontFamily: fonts.headingMedium,
    fontSize: 16,
    color: colors.navy,
  },
  sectionSubtitle: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.ink,
    opacity: 0.65,
    lineHeight: 19,
  },
  subtitle: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.ink,
    opacity: 0.65,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    padding: spacing(5),
    gap: spacing(2.5),
  },
  cardTitle: {
    fontFamily: fonts.headingMedium,
    fontSize: 15,
    color: colors.navy,
  },
  cardMeta: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12.5,
    color: colors.coralDark,
    marginTop: -spacing(1.5),
  },
  creneauRow: {
    borderTopWidth: 1,
    borderTopColor: "rgba(11,18,32,.08)",
    paddingTop: spacing(2.5),
    gap: spacing(1.5),
  },
  creneauHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing(2),
  },
  creneauDate: {
    fontFamily: fonts.body,
    fontSize: 13.5,
    color: colors.ink,
  },
  creneauNiveau: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.ink,
    opacity: 0.6,
    marginTop: spacing(0.5),
  },
  placesBadge: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 11,
    paddingHorizontal: spacing(2.5),
    paddingVertical: spacing(1),
    borderRadius: radii.pill,
    overflow: "hidden",
  },
  placesOk: {
    backgroundColor: "rgba(10,168,150,.14)",
    color: colors.tealDark,
  },
  placesFull: {
    backgroundColor: "rgba(11,18,32,.08)",
    color: colors.ink,
  },
  mineRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  mineLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    color: colors.tealDark,
  },
  cancelLink: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12.5,
    color: colors.coralDark,
  },
  toggleLink: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 13,
    color: colors.coralDark,
  },
  form: {
    marginTop: spacing(1),
    paddingTop: spacing(2.5),
    borderTopWidth: 1,
    borderTopColor: "rgba(11,18,32,.08)",
    gap: spacing(2.5),
  },
  formLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12.5,
    color: colors.ink,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing(2),
  },
  chip: {
    borderWidth: 1,
    borderColor: "rgba(11,18,32,.15)",
    borderRadius: radii.pill,
    paddingHorizontal: spacing(3.5),
    paddingVertical: spacing(2),
  },
  chipActive: {
    backgroundColor: colors.navy,
    borderColor: colors.navy,
  },
  chipText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12.5,
    color: colors.ink,
  },
  chipTextActive: {
    color: colors.white,
  },
  smallNote: {
    fontFamily: fonts.body,
    fontSize: 12.5,
    color: colors.ink,
    opacity: 0.6,
  },
  error: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.coralDark,
  },
  confirmButton: {
    backgroundColor: colors.coral,
    borderRadius: radii.pill,
    paddingVertical: spacing(3),
    alignItems: "center",
  },
  confirmButtonText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 14,
    color: colors.white,
  },
});
