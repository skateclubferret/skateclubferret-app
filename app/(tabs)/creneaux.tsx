import { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import { useFamily, type CreneauModele } from "@/lib/family-context";
import { supabase } from "@/lib/supabase";
import { colors, fonts, radii, spacing } from "@/constants/theme";
import { dateLabel, groupeLabel, heureLabel, lieuLabel } from "@/lib/creneaux-format";

type Creneau = {
  id: string;
  modele_id: string | null;
  date: string;
  heure_debut: string;
  heure_fin: string;
  lieu: string;
  categorie: string;
  niveau: string | null;
  capacite_max: number;
  places_reservees: number;
  statut: string;
};

function toISODate(d: Date) {
  return d.toISOString().slice(0, 10);
}

// Consultation des créneaux à venir : cours à l'année de la famille (à partir
// des inscriptions actives) + stages vacances ouverts, en lecture seule
// (réservation prévue en phase suivante). Mêmes filtres/tri que
// loadCoursAnneeData() dans mon-espace.html.
export default function CreneauxScreen() {
  const { adherent, enfants, inscriptionsAnnee, modelesAnnee, loading: familyLoading } = useFamily();
  const [creneauxAnnee, setCreneauxAnnee] = useState<Creneau[]>([]);
  const [stages, setStages] = useState<{ modele: CreneauModele; creneaux: Creneau[] }[]>([]);
  const [loadingCreneaux, setLoadingCreneaux] = useState(true);

  useEffect(() => {
    if (familyLoading) return;
    let cancelled = false;
    const todayIso = toISODate(new Date());

    (async () => {
      setLoadingCreneaux(true);
      const modeleIds = [...new Set(inscriptionsAnnee.map((i) => i.modele_id))];

      const [anneeResult, modelesStageResult] = await Promise.all([
        modeleIds.length > 0
          ? supabase
              .from("creneaux")
              .select("*")
              .eq("categorie", "annee")
              .eq("statut", "actif")
              .in("modele_id", modeleIds)
              .gte("date", todayIso)
              .order("date", { ascending: true })
              .order("heure_debut", { ascending: true })
          : Promise.resolve({ data: [] as Creneau[] }),
        supabase
          .from("creneaux_modeles")
          .select("*")
          .eq("categorie", "stage")
          .eq("actif", true)
          .eq("ouvert_reservations", true),
      ]);
      if (cancelled) return;

      setCreneauxAnnee(anneeResult.data || []);

      const modelesStage = (modelesStageResult.data as CreneauModele[] | null) || [];
      if (modelesStage.length === 0) {
        setStages([]);
        setLoadingCreneaux(false);
        return;
      }

      const { data: creneauxStage } = await supabase
        .from("creneaux")
        .select("*")
        .eq("categorie", "stage")
        .eq("statut", "actif")
        .in(
          "modele_id",
          modelesStage.map((m) => m.id)
        )
        .gte("date", todayIso)
        .order("date", { ascending: true })
        .order("heure_debut", { ascending: true });
      if (cancelled) return;

      const grouped = modelesStage
        .map((modele) => ({
          modele,
          creneaux: (creneauxStage || []).filter((c) => c.modele_id === modele.id),
        }))
        .filter((g) => g.creneaux.length > 0);

      setStages(grouped);
      setLoadingCreneaux(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [familyLoading, inscriptionsAnnee, modelesAnnee]);

  const loading = familyLoading || loadingCreneaux;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.eyebrow}>PLANNING</Text>
      <Text style={styles.title}>Créneaux</Text>

      {loading && <ActivityIndicator color={colors.navy} style={{ marginTop: spacing(4) }} />}

      {!loading && (
        <>
          {adherent && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Mes cours à l'année</Text>
              {inscriptionsAnnee.length === 0 && (
                <Text style={styles.subtitle}>
                  Pas encore d'inscription à un cours à l'année — le club attribue le groupe après le cours d'essai.
                </Text>
              )}
              {inscriptionsAnnee.map((inscr) => {
                const modele = modelesAnnee.find((m) => m.id === inscr.modele_id);
                const participant = inscr.enfant_id
                  ? enfants.find((e) => e.id === inscr.enfant_id)?.prenom || "Enfant"
                  : adherent.prenom || "Moi";
                const prochains = creneauxAnnee.filter((c) => c.modele_id === inscr.modele_id).slice(0, 3);

                return (
                  <View key={inscr.id} style={styles.card}>
                    <Text style={styles.cardTitle}>{groupeLabel(modele)}</Text>
                    <Text style={styles.participant}>{participant}</Text>
                    {prochains.length === 0 ? (
                      <Text style={styles.smallNote}>Aucune séance programmée pour l'instant.</Text>
                    ) : (
                      prochains.map((c) => (
                        <Text key={c.id} style={styles.creneauRow}>
                          {dateLabel(c.date)} · {heureLabel(c.heure_debut)}–{heureLabel(c.heure_fin)}
                        </Text>
                      ))
                    )}
                  </View>
                );
              })}
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Stages vacances</Text>
            {stages.length === 0 && (
              <Text style={styles.subtitle}>Aucun stage ouvert aux réservations pour l'instant.</Text>
            )}
            {stages.map(({ modele, creneaux: creneauxDuStage }) => (
              <View key={modele.id} style={styles.card}>
                <Text style={styles.cardTitle}>{modele.nom}</Text>
                <Text style={styles.participant}>
                  {lieuLabel(modele.lieu)}
                  {modele.niveau ? ` · ${modele.niveau}` : ""}
                </Text>
                {creneauxDuStage.map((c) => {
                  const placesRestantes = c.capacite_max - c.places_reservees;
                  return (
                    <View key={c.id} style={styles.creneauRowWithBadge}>
                      <Text style={styles.creneauRow}>
                        {dateLabel(c.date)} · {heureLabel(c.heure_debut)}–{heureLabel(c.heure_fin)}
                      </Text>
                      <Text
                        style={[styles.placesBadge, placesRestantes > 0 ? styles.placesOk : styles.placesFull]}
                      >
                        {placesRestantes > 0 ? `${placesRestantes} place${placesRestantes > 1 ? "s" : ""}` : "Complet"}
                      </Text>
                    </View>
                  );
                })}
              </View>
            ))}
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.sand },
  content: { padding: spacing(6), gap: spacing(3) },
  eyebrow: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 12,
    letterSpacing: 2,
    color: colors.coralDark,
  },
  title: {
    fontFamily: fonts.heading,
    fontSize: 26,
    color: colors.navy,
    marginBottom: spacing(1),
  },
  subtitle: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.ink,
    opacity: 0.65,
  },
  section: {
    marginTop: spacing(3),
    gap: spacing(2),
  },
  sectionTitle: {
    fontFamily: fonts.headingMedium,
    fontSize: 16,
    color: colors.navy,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    padding: spacing(5),
    gap: spacing(1),
  },
  cardTitle: {
    fontFamily: fonts.headingMedium,
    fontSize: 15,
    color: colors.navy,
  },
  participant: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12.5,
    color: colors.coralDark,
    marginBottom: spacing(1),
  },
  smallNote: {
    fontFamily: fonts.body,
    fontSize: 12.5,
    color: colors.ink,
    opacity: 0.6,
  },
  creneauRow: {
    fontFamily: fonts.body,
    fontSize: 13.5,
    color: colors.ink,
    opacity: 0.8,
  },
  creneauRowWithBadge: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: spacing(2),
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
});
