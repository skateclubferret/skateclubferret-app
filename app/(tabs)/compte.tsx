import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useFamily } from "@/lib/family-context";
import { supabase } from "@/lib/supabase";
import { colors, fonts, radii, spacing } from "@/constants/theme";

// Même contenu que la tuile « Mes informations adhérent » (ex « Mon compte »)
// de mon-espace.html : fiche adhérent en lecture. Les cartes de cours ont
// leur propre tuile « Carte cours à l'année ». La modification des champs
// (bulletin d'adhésion, contact d'urgence...) reste à faire.
export default function CompteScreen() {
  const { adherent, loading, error } = useFamily();
  const adresseLigne = [adherent?.code_postal, adherent?.ville].filter(Boolean).join(" ");

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.eyebrow}>ESPACE ADHÉRENT</Text>
      <Text style={styles.title}>Mes informations adhérent</Text>

      {loading && <ActivityIndicator color={colors.navy} style={{ marginTop: spacing(4) }} />}
      {error && <Text style={styles.error}>Erreur : {error}</Text>}

      {!loading && !error && !adherent && (
        <Text style={styles.subtitle}>Aucune fiche adhérent associée à cet email pour l'instant.</Text>
      )}

      {adherent && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            {adherent.prenom} {adherent.nom}
          </Text>
          <Text style={styles.cardBody}>{adherent.email}</Text>
          {adherent.telephone && <Text style={styles.cardBody}>{adherent.telephone}</Text>}
          {(adherent.adresse || adresseLigne) && (
            <Text style={styles.cardBody}>{[adherent.adresse, adresseLigne].filter(Boolean).join(", ")}</Text>
          )}
          <View style={styles.badgeRow}>
            <Text style={[styles.badge, adherent.adhesion_active ? styles.badgeActive : styles.badgeInactive]}>
              {adherent.adhesion_active ? "Adhésion active" : "Adhésion en attente"}
            </Text>
            {adherent.licence_ffrs_valide && <Text style={[styles.badge, styles.badgeActive]}>Licence FFRS</Text>}
          </View>
        </View>
      )}

      <TouchableOpacity style={styles.signOut} onPress={() => supabase.auth.signOut()}>
        <Text style={styles.signOutText}>Se déconnecter</Text>
      </TouchableOpacity>
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
  card: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    padding: spacing(5),
    gap: spacing(2),
  },
  cardTitle: {
    fontFamily: fonts.headingMedium,
    fontSize: 18,
    color: colors.navy,
  },
  cardBody: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.ink,
    opacity: 0.7,
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
    fontSize: 12,
    paddingHorizontal: spacing(3),
    paddingVertical: spacing(1.5),
    borderRadius: radii.pill,
    overflow: "hidden",
  },
  badgeActive: {
    backgroundColor: "rgba(10,168,150,.14)",
    color: colors.tealDark,
  },
  badgeInactive: {
    backgroundColor: "rgba(224,69,31,.12)",
    color: colors.coralDark,
  },
  signOut: {
    marginTop: spacing(4),
    alignItems: "center",
    paddingVertical: spacing(3),
  },
  signOutText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: colors.coralDark,
  },
});
