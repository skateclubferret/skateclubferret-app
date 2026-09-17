import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "./supabase";
import { useAuth } from "./auth-context";

export type Adherent = {
  id: string;
  prenom: string | null;
  nom: string;
  email: string;
  telephone: string | null;
  adresse: string | null;
  ville: string | null;
  code_postal: string | null;
  adhesion_active: boolean | null;
  licence_ffrs_valide: boolean | null;
  numero_carte: string;
  photo_path: string | null;
  sante_rempli: boolean | null;
};

export type Enfant = {
  id: string;
  adherent_id: string;
  prenom: string;
  nom: string | null;
  date_naissance: string | null;
  genre: string | null;
  sante_rempli: boolean;
  sante_certificat_requis: boolean;
  sante_date: string | null;
  certificat_path: string | null;
  droit_image: boolean | null;
  droit_image_date: string | null;
  droit_image_qualite: string | null;
  droit_image_signataire: string | null;
  droit_image_lieu: string | null;
};

export type CarteCours = {
  id: string;
  adherent_id: string | null;
  enfant_id: string | null;
  type_carte: string;
  seances_totales: number;
  seances_utilisees: number | null;
  date_achat: string | null;
};

export type InscriptionAnnee = {
  id: string;
  modele_id: string;
  adherent_id: string;
  enfant_id: string | null;
  actif: boolean;
};

export type CreneauModele = {
  id: string;
  nom: string;
  lieu: string;
  categorie: string;
  heure_debut: string;
  heure_fin: string;
  capacite_max: number;
  niveau: string | null;
  moniteur: string | null;
  jours_semaine: number[];
  actif: boolean;
  ouvert_reservations: boolean;
};

type FamilyContextValue = {
  adherent: Adherent | null;
  enfants: Enfant[];
  cartes: CarteCours[];
  inscriptionsAnnee: InscriptionAnnee[];
  modelesAnnee: CreneauModele[];
  loading: boolean;
  error: string | null;
  reload: () => void;
};

const FamilyContext = createContext<FamilyContextValue>({
  adherent: null,
  enfants: [],
  cartes: [],
  inscriptionsAnnee: [],
  modelesAnnee: [],
  loading: true,
  error: null,
  reload: () => {},
});

// Charge une fois la fiche adhérent + tout ce qui en dépend (enfants, cartes,
// inscriptions cours à l'année) — même lecture RLS que mon-espace.html sur le
// site, partagée entre les écrans Mon compte / Enfants / Créneaux plutôt que
// refaite à chaque écran.
export function FamilyProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const [adherent, setAdherent] = useState<Adherent | null>(null);
  const [enfants, setEnfants] = useState<Enfant[]>([]);
  const [cartes, setCartes] = useState<CarteCours[]>([]);
  const [inscriptionsAnnee, setInscriptionsAnnee] = useState<InscriptionAnnee[]>([]);
  const [modelesAnnee, setModelesAnnee] = useState<CreneauModele[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const reload = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    const email = session?.user.email;
    if (!email) {
      setAdherent(null);
      setEnfants([]);
      setCartes([]);
      setInscriptionsAnnee([]);
      setModelesAnnee([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    (async () => {
      const { data: adherentRow, error: adherentError } = await supabase
        .from("adherents")
        .select(
          "id, prenom, nom, email, telephone, adresse, ville, code_postal, adhesion_active, licence_ffrs_valide, numero_carte, photo_path, sante_rempli"
        )
        .eq("email", email)
        .maybeSingle();

      if (cancelled) return;
      if (adherentError) {
        setError(adherentError.message);
        setLoading(false);
        return;
      }
      setAdherent(adherentRow);

      if (!adherentRow) {
        setEnfants([]);
        setCartes([]);
        setInscriptionsAnnee([]);
        setModelesAnnee([]);
        setLoading(false);
        return;
      }

      const [{ data: enfantsRows }, { data: cartesRows }, { data: inscriptionsRows }] = await Promise.all([
        supabase.from("enfants").select("*").eq("adherent_id", adherentRow.id).is("archive_le", null),
        supabase.from("cartes_cours").select("*").eq("adherent_id", adherentRow.id),
        supabase.from("inscriptions_cours_annee").select("*").eq("actif", true),
      ]);
      if (cancelled) return;

      setEnfants(enfantsRows || []);
      setCartes(cartesRows || []);
      setInscriptionsAnnee(inscriptionsRows || []);

      const modeleIds = [...new Set((inscriptionsRows || []).map((i) => i.modele_id))];
      if (modeleIds.length > 0) {
        const { data: modelesRows } = await supabase.from("creneaux_modeles").select("*").in("id", modeleIds);
        if (!cancelled) setModelesAnnee(modelesRows || []);
      } else {
        setModelesAnnee([]);
      }

      if (!cancelled) setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [session?.user.email, tick]);

  return (
    <FamilyContext.Provider
      value={{ adherent, enfants, cartes, inscriptionsAnnee, modelesAnnee, loading, error, reload }}
    >
      {children}
    </FamilyContext.Provider>
  );
}

export function useFamily() {
  return useContext(FamilyContext);
}
