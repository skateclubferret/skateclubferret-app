import { Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { colors, fonts, radii, spacing } from "@/constants/theme";
import { EspaceHeader } from "@/components/EspaceHeader";

// Le paiement (adhésion, licence FFRS, carte de cours) se fait par Stripe
// Checkout côté site — le porter en natif (Payment Sheet Stripe) est un gros
// chantier à part (nouveau module natif, nouvelle Edge Function) qui n'est
// pas encore fait ici. En attendant, on renvoie vers l'onglet du site.
export default function AchatScreen() {
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <EspaceHeader eyebrow="ESPACE ADHÉRENT" title="Ajouter à mon compte" />

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Adhésion, licence FFRS, carte de cours</Text>
        <Text style={styles.cardBody}>
          Le paiement en ligne se fait pour l'instant depuis le site du club, dans l'onglet « Ajouter à mon compte »
          de votre espace adhérent — avec le même compte que celui utilisé ici.
        </Text>
        <TouchableOpacity
          style={styles.button}
          onPress={() => Linking.openURL("https://skateclubferret.fr/mon-espace.html")}
        >
          <Text style={styles.buttonText}>Ouvrir sur le site →</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Stages vacances</Text>
        <Text style={styles.cardBody}>
          L'inscription et le paiement des stages vacances se font sur la page dédiée du site (tee-shirt disponible
          au passage) — la réservation d'un créneau se fait ici même, dans « Mes réservations stages vacances ».
        </Text>
        <TouchableOpacity
          style={styles.buttonOutline}
          onPress={() => Linking.openURL("https://skateclubferret.fr/stages-vacances.html")}
        >
          <Text style={styles.buttonOutlineText}>Voir les stages sur le site →</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.sand },
  content: { padding: spacing(6), gap: spacing(3) },
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
    marginTop: spacing(1),
  },
  buttonOutlineText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 14,
    color: colors.navy,
  },
});
