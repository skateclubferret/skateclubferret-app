import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import { createClient } from "@supabase/supabase-js";

// Même projet Supabase que le site skateclubferret.fr — mêmes comptes adhérent /
// admin, mêmes tables, même RLS. Ne jamais créer un second projet Supabase pour
// l'app : elle est un client de plus sur la même base (voir le plan, section 0).
const { supabaseUrl, supabaseAnonKey } = Constants.expoConfig?.extra ?? {};

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Configuration Supabase manquante — vérifie app.json (expo.extra.supabaseUrl / supabaseAnonKey)."
  );
}

// AsyncStorage (et non SecureStore) pour la session : c'est ce que le client
// supabase-js attend nativement pour persister/rafraîchir le token. Rien de
// sensible n'y est stocké en clair au-delà de ce que fait déjà le site.
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
