import { Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { colors, fonts, radii, spacing } from "@/constants/theme";

// La messagerie temps réel adhérent ↔ association (plan, section 4.8) n'est
// pas encore construite (nouvelle brique : table de messages, Realtime,
// côté admin) — en attendant, on redirige vers les moyens de contact actuels
// du club, repris du site (index.html).
export default function MessagerieScreen() {
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.eyebrow}>ESPACE ADHÉRENT</Text>
      <Text style={styles.title}>Ma messagerie</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Bientôt disponible</Text>
        <Text style={styles.cardBody}>
          La messagerie directe avec l'association arrive dans une prochaine version de l'app. En attendant, vous
          pouvez contacter le club directement :
        </Text>
        <TouchableOpacity style={styles.button} onPress={() => Linking.openURL("mailto:contact@skateclubferret.fr")}>
          <Text style={styles.buttonText}>contact@skateclubferret.fr</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.buttonOutline} onPress={() => Linking.openURL("tel:0675114634")}>
          <Text style={styles.buttonOutlineText}>06 75 11 46 34</Text>
        </TouchableOpacity>
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
    marginBottom: spacing(1),
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    padding: spacing(5),
    gap: spacing(2.5),
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
  button: {
    backgroundColor: colors.coral,
    borderRadius: radii.pill,
    paddingVertical: spacing(3),
    alignItems: "center",
    marginTop: spacing(1),
  },
  buttonText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 14,
    color: colors.white,
  },
  buttonOutline: {
    borderWidth: 1,
    borderColor: colors.navy,
    borderRadius: radii.pill,
    paddingVertical: spacing(3),
    alignItems: "center",
  },
  buttonOutlineText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 14,
    color: colors.navy,
  },
});
