import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useAuth } from "@/lib/auth-context";
import { colors, fonts, radii, spacing } from "@/constants/theme";

export default function HomeScreen() {
  const { session } = useAuth();

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.eyebrow}>SKATE CLUB FERRET</Text>
      <Text style={styles.title}>Bienvenue{session?.user.email ? " !" : ""}</Text>
      <Text style={styles.subtitle}>
        Squelette Phase 0 — connecté à la même base que skateclubferret.fr.
      </Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Prochaine étape</Text>
        <Text style={styles.cardBody}>
          Cet écran est un point de départ. Les prochains ajouts (Phase 1 du
          plan) : profil, enfants, cartes de cours et créneaux, lus depuis
          Supabase comme sur mon-espace.html.
        </Text>
      </View>
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
  },
  subtitle: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.ink,
    opacity: 0.65,
    marginBottom: spacing(4),
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    padding: spacing(5),
    gap: spacing(2),
  },
  cardTitle: {
    fontFamily: fonts.headingMedium,
    fontSize: 16,
    color: colors.navy,
  },
  cardBody: {
    fontFamily: fonts.body,
    fontSize: 13.5,
    lineHeight: 20,
    color: colors.ink,
    opacity: 0.75,
  },
});
