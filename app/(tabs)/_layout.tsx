import { Redirect, Tabs } from "expo-router";
import { Text } from "react-native";
import { useAuth } from "@/lib/auth-context";
import { colors, fonts } from "@/constants/theme";

// Icônes texte simples pour ce squelette — à remplacer par de vraies icônes
// (ex. @expo/vector-icons) une fois le projet installable.
function TabIcon({ glyph, color }: { glyph: string; color: string }) {
  return <Text style={{ fontSize: 20, color }}>{glyph}</Text>;
}

// Seuls Accueil et Espace adhérent restent des onglets — les 8 rubriques de
// l'espace adhérent (mêmes noms que les tuiles de mon-espace.html sur le
// site) vivent sous /espace/* en écrans empilés, ouverts depuis (tabs)/espace.tsx.
export default function TabsLayout() {
  const { session, loading } = useAuth();

  if (!loading && !session) return <Redirect href="/(auth)/login" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.coralDark,
        tabBarInactiveTintColor: "rgba(11,18,32,.45)",
        tabBarStyle: { backgroundColor: colors.white },
        tabBarLabelStyle: { fontFamily: fonts.bodyMedium, fontSize: 11 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Accueil",
          tabBarIcon: ({ color }) => <TabIcon glyph="🛹" color={color} />,
        }}
      />
      <Tabs.Screen
        name="espace"
        options={{
          title: "Espace adhérent",
          tabBarIcon: ({ color }) => <TabIcon glyph="🪪" color={color} />,
        }}
      />
    </Tabs>
  );
}
