import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import { useFamily } from "@/lib/family-context";
import { colors, fonts, radii, spacing } from "@/constants/theme";

// Même contenu que la tuile « Carte cours à l'année » de mon-espace.html :
// toutes les cartes de l'adhérent, qu'elles soient pour lui-même ou pour un
// enfant (renderCartes côté site) — en lecture seule pour l'instant.
export default function CartesScreen() {
  const { adherent, enfants, cartes, loading, error } = useFamily();

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.eyebrow}>ESPACE ADHÉRENT</Text>
      <Text style={styles.title}>Carte cours à l'année</Text>

      {loading && <ActivityIndicator color={colors.navy} style={{ marginTop: spacing(4) }} />}
      {error && <Text style={styles.error}>Erreur : {error}</Text>}

      {!loading && !error && cartes.length === 0 && (
        <Text style={styles.subtitle}>Aucune carte de cours pour l'instant.</Text>
      )}

      {cartes.map((c) => {
        const hasSeances = (c.seances_totales || 0) > 0;
        const restantes = (c.seances_totales || 0) - (c.seances_utilisees || 0);
        const date = c.date_achat ? new Date(c.date_achat).toLocaleDateString("fr-FR") : "";
        const isEnfantScoped = !(c.type_carte || "").toLowerCase().startsWith("adh");
        const enfant = c.enfant_id ? enfants.find((e) => e.id === c.enfant_id) : null;

        return (
          <View key={c.id} style={styles.carteItem}>
            <View style={{ flex: 1 }}>
              <Text style={styles.carteType}>{c.type_carte}</Text>
              <Text style={styles.carteDate}>Achetée le {date}</Text>
              {isEnfantScoped && (
                <Text style={styles.carteFor}>
                  {enfant ? `Pour ${enfant.prenom}` : adherent && enfants.length > 0 ? "Non attribuée à un enfant" : ""}
                </Text>
              )}
            </View>
            {hasSeances ? (
              <View style={styles.reste}>
                <Text style={styles.resteNombre}>{restantes}</Text>
                <Text style={styles.resteLabel}>
                  séance{restantes > 1 ? "s" : ""} restante{restantes > 1 ? "s" : ""}
                </Text>
              </View>
            ) : (
              <Text style={[styles.badge]}>✓ Réglé</Text>
            )}
          </View>
        );
      })}
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
  error: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.coralDark,
  },
  carteItem: {
    backgroundColor: colors.white,
    borderRadius: radii.md,
    padding: spacing(4),
    flexDirection: "row",
    alignItems: "center",
    gap: spacing(3),
  },
  carteType: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 14,
    color: colors.navy,
  },
  carteDate: {
    fontFamily: fonts.body,
    fontSize: 12.5,
    color: colors.ink,
    opacity: 0.6,
    marginTop: spacing(0.5),
  },
  carteFor: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12.5,
    color: colors.tealDark,
    marginTop: spacing(1),
  },
  reste: { alignItems: "center" },
  resteNombre: {
    fontFamily: fonts.headingMedium,
    fontSize: 20,
    color: colors.tealDark,
  },
  resteLabel: {
    fontFamily: fonts.body,
    fontSize: 10.5,
    color: colors.ink,
    opacity: 0.6,
    textAlign: "center",
  },
  badge: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 12,
    paddingHorizontal: spacing(3),
    paddingVertical: spacing(1.5),
    borderRadius: radii.pill,
    backgroundColor: "rgba(10,168,150,.14)",
    color: colors.tealDark,
    overflow: "hidden",
  },
});
