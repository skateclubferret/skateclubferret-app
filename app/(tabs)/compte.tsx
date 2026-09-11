import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useFamily } from "@/lib/family-context";
import { supabase } from "@/lib/supabase";
import { colors, fonts, radii, spacing } from "@/constants/theme";

// Fiche adhérent + cartes de cours non rattachées à un enfant — même lecture
// RLS ("adherents/cartes_cours can view own row(s)") que mon-espace.html.
export default function CompteScreen() {
  const { adherent, cartes, loading, error } = useFamily();
  const mesCartes = cartes.filter((c) => !c.enfant_id);
  const adresseLigne = [adherent?.code_postal, adherent?.ville].filter(Boolean).join(" ");

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.eyebrow}>MON COMPTE</Text>
      <Text style={styles.title}>Espace adhérent</Text>

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
            <Text style={styles.cardBody}>
              {[adherent.adresse, adresseLigne].filter(Boolean).join(", ")}
            </Text>
          )}
          <View style={styles.badgeRow}>
            <Text style={[styles.badge, adherent.adhesion_active ? styles.badgeActive : styles.badgeInactive]}>
              {adherent.adhesion_active ? "Adhésion active" : "Adhésion en attente"}
            </Text>
            {adherent.licence_ffrs_valide && <Text style={[styles.badge, styles.badgeActive]}>Licence FFRS</Text>}
          </View>
        </View>
      )}

      {adherent && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mes cartes de cours</Text>
          {mesCartes.length === 0 && <Text style={styles.subtitle}>Aucune carte de cours pour l'instant.</Text>}
          {mesCartes.map((c) => {
            const hasSeances = (c.seances_totales || 0) > 0;
            const restantes = (c.seances_totales || 0) - (c.seances_utilisees || 0);
            const date = c.date_achat ? new Date(c.date_achat).toLocaleDateString("fr-FR") : "";
            return (
              <View key={c.id} style={styles.carteItem}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.carteType}>{c.type_carte}</Text>
                  <Text style={styles.carteDate}>Achetée le {date}</Text>
                </View>
                {hasSeances ? (
                  <Text style={styles.carteReste}>
                    {restantes} séance{restantes > 1 ? "s" : ""}
                  </Text>
                ) : (
                  <Text style={[styles.badge, styles.badgeActive]}>✓ Réglé</Text>
                )}
              </View>
            );
          })}
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
    marginBottom: spacing(3),
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
  section: {
    marginTop: spacing(2),
    gap: spacing(2),
  },
  sectionTitle: {
    fontFamily: fonts.headingMedium,
    fontSize: 16,
    color: colors.navy,
  },
  carteItem: {
    backgroundColor: colors.white,
    borderRadius: radii.md,
    padding: spacing(4),
    flexDirection: "row",
    alignItems: "center",
    gap: spacing(2),
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
  carteReste: {
    fontFamily: fonts.headingMedium,
    fontSize: 16,
    color: colors.tealDark,
  },
  signOut: {
    marginTop: spacing(6),
    alignItems: "center",
    paddingVertical: spacing(3),
  },
  signOutText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: colors.coralDark,
  },
});
