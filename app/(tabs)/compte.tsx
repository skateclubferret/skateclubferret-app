import { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import { colors, fonts, radii, spacing } from "@/constants/theme";

type Adherent = {
  id: string;
  prenom: string | null;
  nom: string | null;
  email: string;
  adhesion_active: boolean;
};

// Lit la fiche adhérent de la personne connectée — même requête et même
// politique RLS ("adherents can view own row") que mon-espace.html sur le site.
export default function CompteScreen() {
  const { session } = useAuth();
  const [adherent, setAdherent] = useState<Adherent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session?.user.email) return;
    let cancelled = false;

    supabase
      .from("adherents")
      .select("id, prenom, nom, email, adhesion_active")
      .eq("email", session.user.email)
      .maybeSingle()
      .then(({ data, error: fetchError }) => {
        if (cancelled) return;
        if (fetchError) setError(fetchError.message);
        setAdherent(data);
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [session?.user.email]);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.eyebrow}>MON COMPTE</Text>
      <Text style={styles.title}>Espace adhérent</Text>

      {loading && <ActivityIndicator color={colors.navy} style={{ marginTop: spacing(4) }} />}

      {error && <Text style={styles.error}>Erreur : {error}</Text>}

      {!loading && !error && !adherent && (
        <Text style={styles.subtitle}>
          Aucune fiche adhérent associée à cet email pour l'instant.
        </Text>
      )}

      {adherent && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            {adherent.prenom} {adherent.nom}
          </Text>
          <Text style={styles.cardBody}>{adherent.email}</Text>
          <Text style={[styles.badge, adherent.adhesion_active ? styles.badgeActive : styles.badgeInactive]}>
            {adherent.adhesion_active ? "Adhésion active" : "Adhésion en attente"}
          </Text>
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
  badge: {
    alignSelf: "flex-start",
    fontFamily: fonts.bodySemiBold,
    fontSize: 12,
    paddingHorizontal: spacing(3),
    paddingVertical: spacing(1.5),
    borderRadius: radii.pill,
    marginTop: spacing(1),
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
