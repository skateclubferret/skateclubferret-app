import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import { colors, fonts, spacing } from "@/constants/theme";

// En-tête commune aux écrans sous /espace/* : bouton retour + eyebrow/titre,
// même schéma que le reste de l'app (voir app/preinscription.tsx).
export function EspaceHeader({ eyebrow, title }: { eyebrow: string; title: string }) {
  const router = useRouter();
  return (
    <View style={styles.wrap}>
      <TouchableOpacity onPress={() => router.back()}>
        <Text style={styles.backLink}>‹ Retour</Text>
      </TouchableOpacity>
      <Text style={styles.eyebrow}>{eyebrow}</Text>
      <Text style={styles.title}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing(2) },
  backLink: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: colors.coralDark,
    marginBottom: spacing(3),
  },
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
});
