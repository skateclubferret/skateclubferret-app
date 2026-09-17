import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import { colors, fonts, radii, spacing } from "@/constants/theme";

type Tile = {
  href:
    | "/espace/carte"
    | "/espace/avantages"
    | "/espace/cartes"
    | "/espace/reservations"
    | "/espace/enfants"
    | "/espace/achat"
    | "/espace/compte"
    | "/espace/messagerie";
  glyph: string;
  label: string;
  color: string;
};

// Mêmes 8 rubriques, dans le même ordre, que les tuiles de mon-espace.html
// sur le site — pour que l'adhérent retrouve les mêmes repères dans l'app.
const TILES: Tile[] = [
  { href: "/espace/carte", glyph: "🪪", label: "Ma Carte Membre", color: colors.navy },
  { href: "/espace/avantages", glyph: "🎁", label: "Mes avantages partenaires", color: colors.coralDark },
  { href: "/espace/cartes", glyph: "🎫", label: "Carte cours à l'année", color: colors.teal },
  { href: "/espace/reservations", glyph: "📅", label: "Mes réservations stages vacances", color: colors.tealDark },
  { href: "/espace/enfants", glyph: "👧", label: "Mes enfants et moi", color: colors.coral },
  { href: "/espace/achat", glyph: "🛒", label: "Ajouter à mon compte", color: colors.yellow },
  { href: "/espace/compte", glyph: "👤", label: "Mes informations adhérent", color: colors.navy2 },
  { href: "/espace/messagerie", glyph: "💬", label: "Ma messagerie", color: colors.coralDark },
];

export default function EspaceScreen() {
  const router = useRouter();

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.eyebrow}>ESPACE ADHÉRENT</Text>
      <Text style={styles.title}>Skate Club Ferret</Text>

      <View style={styles.grid}>
        {TILES.map((tile) => (
          <TouchableOpacity key={tile.href} style={styles.tile} onPress={() => router.push(tile.href)}>
            <View style={[styles.tileIcon, { backgroundColor: tile.color }]}>
              <Text style={styles.tileGlyph}>{tile.glyph}</Text>
            </View>
            <Text style={styles.tileLabel}>{tile.label}</Text>
          </TouchableOpacity>
        ))}
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
    marginBottom: spacing(2),
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing(3),
  },
  tile: {
    width: "47%",
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    padding: spacing(4),
    gap: spacing(2.5),
    minHeight: 120,
  },
  tileIcon: {
    width: 40,
    height: 40,
    borderRadius: radii.md,
    alignItems: "center",
    justifyContent: "center",
  },
  tileGlyph: {
    fontSize: 19,
  },
  tileLabel: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 13.5,
    lineHeight: 18,
    color: colors.navy,
  },
});
