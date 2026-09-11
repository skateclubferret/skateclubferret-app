import { ActivityIndicator, View } from "react-native";
import { Redirect } from "expo-router";
import { useAuth } from "@/lib/auth-context";
import { colors } from "@/constants/theme";

// Porte d'entrée : redirige vers l'espace connecté ou l'écran de connexion selon
// la session Supabase (mêmes comptes que mon-espace.html sur le site).
export default function Index() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.sand }}>
        <ActivityIndicator color={colors.navy} />
      </View>
    );
  }

  return <Redirect href={session ? "/(tabs)" : "/(auth)/login"} />;
}
