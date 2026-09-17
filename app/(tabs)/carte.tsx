import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, View } from "react-native";
import { useFamily } from "@/lib/family-context";
import { supabase } from "@/lib/supabase";
import { colors, fonts, radii, spacing } from "@/constants/theme";

// Même contenu que la tuile « Ma Carte Membre » de mon-espace.html —
// changer la photo de la carte reste à faire sur le site pour l'instant
// (nécessite un module natif de sélection d'image, pas encore ajouté ici).
export default function CarteScreen() {
  const { adherent, loading } = useFamily();
  const nomComplet = adherent ? [adherent.prenom, adherent.nom].filter(Boolean).join(" ") || "Adhérent" : "";
  const photoUrl = adherent?.photo_path
    ? supabase.storage.from("member-photos").getPublicUrl(adherent.photo_path).data.publicUrl
    : null;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.eyebrow}>ESPACE ADHÉRENT</Text>
      <Text style={styles.title}>Ma Carte Membre</Text>

      {loading && <ActivityIndicator color={colors.navy} style={{ marginTop: spacing(4) }} />}

      {!loading && adherent && (
        <View style={styles.card}>
          <View style={styles.cardTop}>
            <Text style={styles.tag}>Carte Membre</Text>
            <Text style={styles.name}>{nomComplet}</Text>
            <Text style={styles.club}>Skate Club Ferret</Text>
            <Text style={styles.numLabel}>Numéro</Text>
            <Text style={styles.num}>{adherent.numero_carte}</Text>
          </View>
          <View style={styles.photoWrap}>
            {photoUrl ? (
              <Image source={{ uri: photoUrl }} style={styles.photo} />
            ) : (
              <Image source={require("../../assets/images/icon.png")} style={styles.photo} />
            )}
          </View>
        </View>
      )}

      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>🛹 LA CARTE MEMBRE</Text>
        <Text style={styles.infoBody}>
          La Carte Membre du Skate Club Ferret permet à tous nos adhérents de profiter d'offres et d'avantages
          exclusifs auprès des partenaires du club.
        </Text>
        <Text style={styles.infoBody}>
          Réductions, offres spéciales et bons plans : il suffit de présenter votre carte chez les partenaires
          participants pour bénéficier des avantages réservés aux membres.
        </Text>
        <Text style={styles.infoBody}>
          Une carte pensée pour récompenser nos adhérents tout en créant un lien privilégié avec ceux qui soutiennent
          le Skate Club Ferret. 🛹❤️
        </Text>
      </View>
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
  card: {
    backgroundColor: colors.navy,
    borderRadius: radii.lg,
    padding: spacing(5),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing(3),
  },
  cardTop: { flex: 1, gap: spacing(0.5) },
  tag: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 11,
    letterSpacing: 1.5,
    color: colors.yellow,
    textTransform: "uppercase",
  },
  name: {
    fontFamily: fonts.headingMedium,
    fontSize: 19,
    color: colors.white,
    marginTop: spacing(1),
  },
  club: {
    fontFamily: fonts.body,
    fontSize: 12.5,
    color: "rgba(255,255,255,.7)",
  },
  numLabel: {
    fontFamily: fonts.body,
    fontSize: 10.5,
    color: "rgba(255,255,255,.5)",
    marginTop: spacing(3),
  },
  num: {
    fontFamily: fonts.headingMedium,
    fontSize: 15,
    color: colors.white,
    letterSpacing: 1,
  },
  photoWrap: {
    width: 64,
    height: 64,
    borderRadius: radii.md,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,.1)",
  },
  photo: { width: "100%", height: "100%" },
  infoCard: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    padding: spacing(5),
    gap: spacing(2.5),
  },
  infoTitle: {
    fontFamily: fonts.headingMedium,
    fontSize: 16,
    color: colors.navy,
  },
  infoBody: {
    fontFamily: fonts.body,
    fontSize: 13.5,
    lineHeight: 20,
    color: colors.ink,
    opacity: 0.75,
  },
});
