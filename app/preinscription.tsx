import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { useFamily } from "@/lib/family-context";
import { supabase } from "@/lib/supabase";
import { colors, fonts, radii, spacing } from "@/constants/theme";
import { enfantAge } from "@/lib/creneaux-format";

type Saison = { id: string; libelle: string };
type ModeleAnnee = {
  id: string;
  nom: string;
  lieu: string;
  jours_semaine: number[];
  heure_debut: string;
};

const JOURS_ABBR = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
const LIEUX = [
  { value: "cassieu", label: "Lège-Bourg" },
  { value: "mimbeau", label: "Cap Ferret" },
];
const PORTES_OUVERTES = [
  { value: "non", label: "Non" },
  { value: "lege_mercredi", label: "Lège-Bourg — mercredi 9 septembre" },
  { value: "cap_ferret_samedi", label: "Cap Ferret — samedi 12 septembre" },
];

function modeleLabel(m: ModeleAnnee) {
  const jours = [...(m.jours_semaine || [])]
    .sort()
    .map((j) => JOURS_ABBR[j])
    .join(", ");
  const horaire = m.heure_debut ? m.heure_debut.slice(0, 5) : "";
  return [jours, horaire, m.nom].filter(Boolean).join(" — ");
}

// Formulaire de pré-inscription cours à l'année — mêmes champs, même table
// (`preinscriptions`) et même Edge Function de confirmation
// (`confirm-preinscription`) que cours-a-l-annee.html sur le site.
export default function PreinscriptionScreen() {
  const router = useRouter();
  const { adherent } = useFamily();

  const [loadingSaison, setLoadingSaison] = useState(true);
  const [saison, setSaison] = useState<Saison | null>(null);
  const [modelesAnnee, setModelesAnnee] = useState<ModeleAnnee[]>([]);

  const [prenom, setPrenom] = useState("");
  const [nom, setNom] = useState("");
  const [email, setEmail] = useState("");
  const [telephone, setTelephone] = useState("");
  const [dateNaissance, setDateNaissance] = useState("");
  const [lieu, setLieu] = useState<string | null>(null);
  const [creneauxIds, setCreneauxIds] = useState<string[]>([]);
  const [portesOuvertes, setPortesOuvertes] = useState("non");
  const [message, setMessage] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [{ data: saisonRow }, { data: modelesRows }] = await Promise.all([
        supabase
          .from("preinscription_saisons")
          .select("id, libelle")
          .eq("published", true)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase.from("creneaux_modeles").select("*").eq("categorie", "annee").eq("actif", true),
      ]);
      if (cancelled) return;
      setSaison(saisonRow);
      setModelesAnnee(modelesRows || []);
      setLoadingSaison(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!adherent) return;
    setPrenom((v) => v || adherent.prenom || "");
    setNom((v) => v || adherent.nom || "");
    setEmail((v) => v || adherent.email || "");
    setTelephone((v) => v || adherent.telephone || "");
  }, [adherent]);

  function toggleCreneau(id: string) {
    setCreneauxIds((ids) => (ids.includes(id) ? ids.filter((i) => i !== id) : [...ids, id]));
  }

  function selectLieu(value: string) {
    setLieu((current) => (current === value ? null : value));
    setCreneauxIds([]);
  }

  const age = enfantAge(/^\d{4}-\d{2}-\d{2}$/.test(dateNaissance) ? dateNaissance : null);
  const modelesDuLieu = modelesAnnee.filter((m) => m.lieu === lieu);

  async function handleSubmit() {
    setError(null);
    if (!prenom.trim() || !nom.trim() || !email.trim()) {
      setError("Merci de renseigner le prénom, le nom et l'email du/de la participant(e).");
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateNaissance)) {
      setError("Merci de renseigner la date de naissance au format AAAA-MM-JJ.");
      return;
    }
    if (!saison) return;

    setSubmitting(true);
    const payload = {
      saison_id: saison.id,
      adherent_id: adherent?.id ?? null,
      deja_adherent: !!adherent,
      prenom_parent: prenom.trim(),
      nom_parent: nom.trim(),
      email: email.trim(),
      telephone: telephone.trim() || null,
      date_naissance: dateNaissance,
      lieu_prefere: lieu,
      creneaux_souhaites_ids: creneauxIds,
      portes_ouvertes: portesOuvertes,
      message: message.trim() || null,
    };

    const { data: inserted, error: insertError } = await supabase
      .from("preinscriptions")
      .insert(payload)
      .select("id")
      .single();

    if (insertError) {
      setError("Impossible d'envoyer votre pré-inscription pour le moment. Réessayez dans un instant ou contactez le club.");
      setSubmitting(false);
      return;
    }

    try {
      await supabase.functions.invoke("confirm-preinscription", { body: { id: inserted.id } });
    } catch {
      // L'email de confirmation est facultatif — la pré-inscription est déjà enregistrée.
    }

    setSubmitting(false);
    setSent(true);
  }

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={styles.content}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backLink}>
          <Text style={styles.backLinkText}>‹ Retour</Text>
        </TouchableOpacity>

        <Text style={styles.eyebrow}>SAISON PROCHAINE</Text>
        <Text style={styles.title}>Pré-inscription</Text>

        {loadingSaison && <ActivityIndicator color={colors.navy} style={{ marginTop: spacing(4) }} />}

        {!loadingSaison && !saison && (
          <Text style={styles.subtitle}>Aucune pré-inscription ouverte pour le moment.</Text>
        )}

        {!loadingSaison && saison && !sent && (
          <View style={styles.form}>
            <Text style={styles.saisonLabel}>Les pré-inscriptions {saison.libelle} sont ouvertes !</Text>
            <Text style={styles.subtitle}>
              Dès que votre formulaire est rempli, l'association vous recontacte pour organiser un cours d'essai.
            </Text>

            <View style={styles.fieldRow}>
              <View style={[styles.field, { flex: 1 }]}>
                <Text style={styles.label}>Prénom du/de la participant(e)</Text>
                <TextInput style={styles.input} value={prenom} onChangeText={setPrenom} placeholderTextColor="rgba(11,18,32,.35)" />
              </View>
              <View style={[styles.field, { flex: 1 }]}>
                <Text style={styles.label}>Nom</Text>
                <TextInput style={styles.input} value={nom} onChangeText={setNom} placeholderTextColor="rgba(11,18,32,.35)" />
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                placeholderTextColor="rgba(11,18,32,.35)"
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Numéro de téléphone</Text>
              <TextInput
                style={styles.input}
                value={telephone}
                onChangeText={setTelephone}
                keyboardType="phone-pad"
                placeholderTextColor="rgba(11,18,32,.35)"
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Date de naissance du/de la participant(e)</Text>
              <View style={{ flexDirection: "row", alignItems: "center", gap: spacing(3) }}>
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  value={dateNaissance}
                  onChangeText={setDateNaissance}
                  placeholder="AAAA-MM-JJ"
                  placeholderTextColor="rgba(11,18,32,.35)"
                  keyboardType="numbers-and-punctuation"
                  maxLength={10}
                />
                {age !== null && <Text style={styles.ageHint}>{age} ans</Text>}
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Site de préférence</Text>
              <View style={styles.chipRow}>
                {LIEUX.map((l) => (
                  <TouchableOpacity
                    key={l.value}
                    style={[styles.chip, lieu === l.value && styles.chipActive]}
                    onPress={() => selectLieu(l.value)}
                  >
                    <Text style={[styles.chipText, lieu === l.value && styles.chipTextActive]}>{l.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {lieu && (
              <View style={styles.field}>
                <Text style={styles.label}>Créneaux qui vous intéressent</Text>
                {modelesDuLieu.length === 0 ? (
                  <Text style={styles.smallNote}>Aucun créneau pour ce site pour le moment.</Text>
                ) : (
                  modelesDuLieu.map((m) => {
                    const checked = creneauxIds.includes(m.id);
                    return (
                      <TouchableOpacity key={m.id} style={styles.checkRow} onPress={() => toggleCreneau(m.id)}>
                        <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
                          {checked && <Text style={styles.checkboxMark}>✓</Text>}
                        </View>
                        <Text style={styles.checkRowText}>{modeleLabel(m)}</Text>
                      </TouchableOpacity>
                    );
                  })
                )}
              </View>
            )}

            <View style={styles.field}>
              <Text style={styles.label}>Participation à la journée portes ouvertes</Text>
              <View style={styles.chipRow}>
                {PORTES_OUVERTES.map((p) => (
                  <TouchableOpacity
                    key={p.value}
                    style={[styles.chip, portesOuvertes === p.value && styles.chipActive]}
                    onPress={() => setPortesOuvertes(p.value)}
                  >
                    <Text style={[styles.chipText, portesOuvertes === p.value && styles.chipTextActive]}>{p.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Votre message (facultatif)</Text>
              <TextInput
                style={[styles.input, styles.textarea]}
                value={message}
                onChangeText={setMessage}
                multiline
                numberOfLines={3}
                placeholderTextColor="rgba(11,18,32,.35)"
              />
            </View>

            {error && <Text style={styles.error}>{error}</Text>}

            <TouchableOpacity
              style={[styles.button, submitting && { opacity: 0.7 }]}
              onPress={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text style={styles.buttonText}>Envoyer ma pré-inscription</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {sent && (
          <View style={styles.form}>
            <Text style={styles.saisonLabel}>Merci, votre pré-inscription est envoyée !</Text>
            <Text style={styles.subtitle}>
              Le Skate Club Ferret reviendra vers vous rapidement pour organiser un cours d'essai. Une confirmation
              vous a été envoyée par email.
            </Text>
            <TouchableOpacity style={styles.button} onPress={() => router.back()}>
              <Text style={styles.buttonText}>Retour à l'accueil</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.sand },
  content: { padding: spacing(6), gap: spacing(3) },
  backLink: { marginBottom: spacing(2) },
  backLinkText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: colors.coralDark,
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
    marginBottom: spacing(2),
  },
  subtitle: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.ink,
    opacity: 0.65,
  },
  saisonLabel: {
    fontFamily: fonts.headingMedium,
    fontSize: 17,
    color: colors.navy,
  },
  form: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    padding: spacing(5),
    gap: spacing(4),
    marginTop: spacing(2),
  },
  fieldRow: {
    flexDirection: "row",
    gap: spacing(3),
  },
  field: {
    gap: spacing(1.5),
  },
  label: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    color: colors.ink,
  },
  input: {
    borderWidth: 1,
    borderColor: "rgba(11,18,32,.15)",
    borderRadius: radii.sm,
    paddingHorizontal: spacing(3.5),
    paddingVertical: spacing(3),
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.ink,
  },
  textarea: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  ageHint: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 13,
    color: colors.tealDark,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing(2),
  },
  chip: {
    borderWidth: 1,
    borderColor: "rgba(11,18,32,.15)",
    borderRadius: radii.pill,
    paddingHorizontal: spacing(4),
    paddingVertical: spacing(2),
  },
  chipActive: {
    backgroundColor: colors.navy,
    borderColor: colors.navy,
  },
  chipText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    color: colors.ink,
  },
  chipTextActive: {
    color: colors.white,
  },
  smallNote: {
    fontFamily: fonts.body,
    fontSize: 12.5,
    color: colors.ink,
    opacity: 0.6,
  },
  checkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing(2.5),
    paddingVertical: spacing(1.5),
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: "rgba(11,18,32,.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxChecked: {
    backgroundColor: colors.teal,
    borderColor: colors.teal,
  },
  checkboxMark: {
    color: colors.white,
    fontSize: 13,
    fontFamily: fonts.bodySemiBold,
  },
  checkRowText: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.ink,
    flexShrink: 1,
  },
  error: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.coralDark,
  },
  button: {
    backgroundColor: colors.coral,
    borderRadius: radii.pill,
    paddingVertical: spacing(3.5),
    alignItems: "center",
  },
  buttonText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 15,
    color: colors.white,
  },
});
