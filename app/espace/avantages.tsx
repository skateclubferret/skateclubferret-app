import { useEffect, useState } from "react";
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, View } from "react-native";
import { supabase } from "@/lib/supabase";
import { colors, fonts, radii, spacing } from "@/constants/theme";
import { EspaceHeader } from "@/components/EspaceHeader";

type Perk = { id: string; nom: string; avantage: string; logo_url: string | null };

// Même contenu que la tuile « Mes avantages partenaires » de mon-espace.html —
// lecture publique de partenaires_avantages (actif=true), triée par ordre.
export default function AvantagesScreen() {
  const [perks, setPerks] = useState<Perk[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    supabase
      .from("partenaires_avantages")
      .select("id, nom, avantage, logo_url")
      .eq("actif", true)
      .order("ordre", { ascending: true })
      .then(({ data }) => {
        if (!cancelled) {
          setPerks(data || []);
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <EspaceHeader eyebrow="ESPACE ADHÉRENT" title="Mes avantages partenaires" />

      {loading && <ActivityIndicator color={colors.navy} style={{ marginTop: spacing(4) }} />}

      {!loading && perks.length === 0 && (
        <Text style={styles.subtitle}>Aucun avantage partenaire pour l'instant.</Text>
      )}

      {perks.map((p) => (
        <View key={p.id} style={styles.card}>
          {p.logo_url ? (
            <Image source={{ uri: p.logo_url }} style={styles.logo} resizeMode="contain" />
          ) : (
            <View style={styles.logoPlaceholder} />
          )}
          <View style={{ flex: 1 }}>
            <Text style={styles.nom}>{p.nom}</Text>
            <Text style={styles.avantage}>{p.avantage}</Text>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.sand },
  content: { padding: spacing(6), gap: spacing(3) },
  subtitle: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.ink,
    opacity: 0.65,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    padding: spacing(4),
    flexDirection: "row",
    alignItems: "center",
    gap: spacing(3),
  },
  logo: { width: 44, height: 44, borderRadius: radii.sm },
  logoPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: radii.sm,
    backgroundColor: "rgba(11,18,32,.06)",
  },
  nom: {
    fontFamily: fonts.headingMedium,
    fontSize: 15,
    color: colors.navy,
  },
  avantage: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.ink,
    opacity: 0.75,
    marginTop: spacing(0.5),
  },
});
