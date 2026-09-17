import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@/lib/auth-context";
import { useFamily } from "@/lib/family-context";
import { supabase } from "@/lib/supabase";
import { colors, fonts, radii, spacing } from "@/constants/theme";

type Saison = { id: string; libelle: string };
type StatutPreinscription = "en_attente" | "validee" | "refusee";

const STATUT_MESSAGES: Record<StatutPreinscription, string> = {
  en_attente: "Votre pré-inscription est en attente de validation par le club (cours d'essai à venir).",
  validee: "Votre pré-inscription est validée — le club va vous recontacter pour la suite.",
  refusee: "Votre pré-inscription n'a pas été retenue pour l'instant — contactez le club pour en savoir plus.",
};

// Affiche la bannière de pré-inscription (si une saison est publiée) et le
// statut de la dernière demande de l'adhérent — même logique que la section
// "achat" de mon-espace.html sur le site.
export default function HomeScreen() {
  const { session } = useAuth();
  const { adherent } = useFamily();
  const router = useRouter();

  const [saison, setSaison] = useState<Saison | null>(null);
  const [statut, setStatut] = useState<StatutPreinscription | null>(null);

  useEffect(() => {
    let cancelled = false;
    supabase
      .from("preinscription_saisons")
      .select("id, libelle")
      .eq("published", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelled) setSaison(data);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!adherent) {
      setStatut(null);
      return;
    }
    let cancelled = false;
    supabase
      .from("preinscriptions")
      .select("statut")
      .eq("adherent_id", adherent.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelled) setStatut((data?.statut as StatutPreinscription) || null);
      });
    return () => {
      cancelled = true;
    };
  }, [adherent]);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.eyebrow}>SKATE CLUB FERRET</Text>
      <Text style={styles.title}>Bienvenue{session?.user.email ? " !" : ""}</Text>
      <Text style={styles.subtitle}>Connecté à la même base que skateclubferret.fr.</Text>

      {saison && (
        <View style={styles.ctaCard}>
          <Text style={styles.ctaTitle}>Les pré-inscriptions {saison.libelle} sont ouvertes !</Text>
          <Text style={styles.ctaBody}>
            Nouvelle famille ou renouvellement, places limitées : ne tardez pas. L'association vous recontacte pour
            organiser un cours d'essai.
          </Text>
          {statut && <Text style={styles.ctaStatus}>{STATUT_MESSAGES[statut]}</Text>}
          <TouchableOpacity style={styles.ctaButton} onPress={() => router.push("/preinscription")}>
            <Text style={styles.ctaButtonText}>Je remplis le formulaire →</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Espace adhérent (lecture)</Text>
        <Text style={styles.cardBody}>
          Ton profil, tes enfants, tes cartes de cours et les créneaux à venir (cours à l'année + stages) sont
          consultables dans les onglets ci-dessous. La réservation et le paiement arrivent en phase suivante.
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
    marginBottom: spacing(2),
  },
  ctaCard: {
    backgroundColor: colors.navy,
    borderRadius: radii.lg,
    padding: spacing(5),
    gap: spacing(2),
  },
  ctaTitle: {
    fontFamily: fonts.headingMedium,
    fontSize: 17,
    color: colors.white,
  },
  ctaBody: {
    fontFamily: fonts.body,
    fontSize: 13.5,
    lineHeight: 19,
    color: "rgba(255,255,255,.8)",
  },
  ctaStatus: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12.5,
    color: colors.yellow,
  },
  ctaButton: {
    backgroundColor: colors.coral,
    borderRadius: radii.pill,
    paddingVertical: spacing(3),
    alignItems: "center",
    marginTop: spacing(1),
  },
  ctaButtonText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 14,
    color: colors.white,
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
