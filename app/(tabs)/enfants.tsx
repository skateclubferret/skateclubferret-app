import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import { useFamily } from "@/lib/family-context";
import { colors, fonts, radii, spacing } from "@/constants/theme";
import { enfantAge, groupeLabel } from "@/lib/creneaux-format";

const GENRE_LABELS: Record<string, string> = { F: "Fille", H: "Garçon" };
const DROIT_IMAGE_QUALITE_LABELS: Record<string, string> = {
  mere: "la mère",
  pere: "le père",
  tuteur: "le tuteur légal",
};

// Liste des enfants rattachés à l'adhérent connecté, avec leurs cartes de
// cours, leur groupe cours à l'année et l'état santé / droit à l'image — en
// lecture seule (modifications à venir en phase suivante).
export default function EnfantsScreen() {
  const { adherent, enfants, cartes, inscriptionsAnnee, modelesAnnee, loading, error } = useFamily();

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.eyebrow}>MA FAMILLE</Text>
      <Text style={styles.title}>Mes enfants</Text>

      {loading && <ActivityIndicator color={colors.navy} style={{ marginTop: spacing(4) }} />}
      {error && <Text style={styles.error}>Erreur : {error}</Text>}

      {!loading && !error && adherent && enfants.length === 0 && (
        <Text style={styles.subtitle}>Aucun enfant rattaché à votre fiche pour l'instant.</Text>
      )}

      {enfants.map((enfant) => {
        const age = enfantAge(enfant.date_naissance);
        const licence = cartes.find(
          (c) => c.enfant_id === enfant.id && (c.type_carte || "").toLowerCase().startsWith("licence")
        );
        const autresCartes = cartes.filter(
          (c) => c.enfant_id === enfant.id && c.id !== licence?.id
        );
        const groupes = inscriptionsAnnee.filter((i) => i.enfant_id === enfant.id);
        const genreLabel = enfant.genre ? GENRE_LABELS[enfant.genre] : null;

        return (
          <View key={enfant.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>
                {enfant.prenom} {enfant.nom}
              </Text>
              {age !== null && <Text style={styles.age}>{age} ans</Text>}
            </View>
            {genreLabel && <Text style={styles.cardBody}>{genreLabel}</Text>}

            <View style={styles.badgeRow}>
              <Text style={[styles.badge, enfant.sante_rempli ? styles.badgeActive : styles.badgeWarn]}>
                {enfant.sante_rempli ? "✓ Questionnaire santé" : "Questionnaire santé à faire"}
              </Text>
              {enfant.sante_rempli && enfant.sante_certificat_requis && (
                <Text style={[styles.badge, enfant.certificat_path ? styles.badgeActive : styles.badgeWarn]}>
                  {enfant.certificat_path ? "✓ Certificat transmis" : "Certificat médical requis"}
                </Text>
              )}
              {enfant.droit_image !== null && (
                <Text style={[styles.badge, enfant.droit_image ? styles.badgeActive : styles.badgeNeutral]}>
                  {enfant.droit_image ? "✓ Droit à l'image autorisé" : "Droit à l'image non autorisé"}
                </Text>
              )}
            </View>

            {enfant.droit_image !== null && enfant.droit_image_signataire && (
              <Text style={styles.smallNote}>
                Signé par {enfant.droit_image_signataire}
                {enfant.droit_image_qualite ? ` (${DROIT_IMAGE_QUALITE_LABELS[enfant.droit_image_qualite] || ""})` : ""}
                {enfant.droit_image_date ? `, le ${new Date(enfant.droit_image_date).toLocaleDateString("fr-FR")}` : ""}.
              </Text>
            )}

            <View style={styles.divider} />

            <Text style={styles.blockLabel}>Licence</Text>
            <Text style={licence ? styles.licenceOk : styles.licenceMissing}>
              {licence ? `✓ ${licence.type_carte}` : "Aucune licence rattachée"}
            </Text>

            {autresCartes.length > 0 && (
              <>
                <Text style={[styles.blockLabel, { marginTop: spacing(2) }]}>Cartes de cours</Text>
                {autresCartes.map((c) => {
                  const hasSeances = (c.seances_totales || 0) > 0;
                  const restantes = (c.seances_totales || 0) - (c.seances_utilisees || 0);
                  return (
                    <Text key={c.id} style={styles.cardBody}>
                      {c.type_carte}
                      {hasSeances ? ` — ${restantes} séance${restantes > 1 ? "s" : ""} restante${restantes > 1 ? "s" : ""}` : " — ✓ réglé"}
                    </Text>
                  );
                })}
              </>
            )}

            <Text style={[styles.blockLabel, { marginTop: spacing(2) }]}>Cours à l'année</Text>
            {groupes.length === 0 && (
              <Text style={styles.smallNote}>
                Pas encore inscrit à un cours à l'année — le club attribue le groupe après le cours d'essai.
              </Text>
            )}
            {groupes.map((g) => (
              <Text key={g.id} style={styles.cardBody}>
                {groupeLabel(modelesAnnee.find((m) => m.id === g.modele_id))}
              </Text>
            ))}
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.sand },
  content: { padding: spacing(6), gap: spacing(4) },
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
  error: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.coralDark,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    padding: spacing(5),
    gap: spacing(1.5),
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardTitle: {
    fontFamily: fonts.headingMedium,
    fontSize: 18,
    color: colors.navy,
  },
  age: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    color: colors.ink,
    opacity: 0.6,
  },
  cardBody: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.ink,
    opacity: 0.8,
  },
  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing(2),
    marginTop: spacing(1),
  },
  badge: {
    alignSelf: "flex-start",
    fontFamily: fonts.bodySemiBold,
    fontSize: 11.5,
    paddingHorizontal: spacing(3),
    paddingVertical: spacing(1.5),
    borderRadius: radii.pill,
    overflow: "hidden",
  },
  badgeActive: {
    backgroundColor: "rgba(10,168,150,.14)",
    color: colors.tealDark,
  },
  badgeWarn: {
    backgroundColor: "rgba(224,69,31,.12)",
    color: colors.coralDark,
  },
  badgeNeutral: {
    backgroundColor: "rgba(11,18,32,.08)",
    color: colors.ink,
  },
  smallNote: {
    fontFamily: fonts.body,
    fontSize: 12.5,
    color: colors.ink,
    opacity: 0.6,
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(11,18,32,.08)",
    marginVertical: spacing(1),
  },
  blockLabel: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 12,
    color: colors.navy,
    opacity: 0.7,
  },
  licenceOk: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: colors.tealDark,
  },
  licenceMissing: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: colors.coralDark,
  },
});
