import { Redirect, Tabs } from "expo-router";
import { Text } from "react-native";
import { useAuth } from "@/lib/auth-context";
import { colors, fonts } from "@/constants/theme";

// Icônes texte simples pour ce squelette — à remplacer par de vraies icônes
// (ex. @expo/vector-icons) une fois le projet installable.
function TabIcon({ glyph, color }: { glyph: string; color: string }) {
  return <Text style={{ fontSize: 16, color }}>{glyph}</Text>;
}

// Les 8 rubriques de l'espace adhérent (mêmes noms que les tuiles de
// mon-espace.html sur le site) sont ici des onglets à part entière, au lieu
// d'une grille intermédiaire — labels raccourcis pour tenir sur 9 onglets.
export default function TabsLayout() {
  const { session, loading } = useAuth();

  if (!loading && !session) return <Redirect href="/(auth)/login" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.coralDark,
        tabBarInactiveTintColor: "rgba(11,18,32,.45)",
        tabBarStyle: { backgroundColor: colors.white, height: 64, paddingBottom: 8, paddingTop: 6 },
        tabBarLabelStyle: { fontFamily: fonts.bodyMedium, fontSize: 9.5 },
        tabBarItemStyle: { paddingHorizontal: 0 },
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
        name="carte"
        options={{
          title: "Carte",
          tabBarIcon: ({ color }) => <TabIcon glyph="🪪" color={color} />,
        }}
      />
      <Tabs.Screen
        name="avantages"
        options={{
          title: "Avantages",
          tabBarIcon: ({ color }) => <TabIcon glyph="🎁" color={color} />,
        }}
      />
      <Tabs.Screen
        name="cartes"
        options={{
          title: "Cartes cours",
          tabBarIcon: ({ color }) => <TabIcon glyph="🎫" color={color} />,
        }}
      />
      <Tabs.Screen
        name="reservations"
        options={{
          title: "Réservations",
          tabBarIcon: ({ color }) => <TabIcon glyph="📅" color={color} />,
        }}
      />
      <Tabs.Screen
        name="enfants"
        options={{
          title: "Enfants",
          tabBarIcon: ({ color }) => <TabIcon glyph="👧" color={color} />,
        }}
      />
      <Tabs.Screen
        name="achat"
        options={{
          title: "Achat",
          tabBarIcon: ({ color }) => <TabIcon glyph="🛒" color={color} />,
        }}
      />
      <Tabs.Screen
        name="compte"
        options={{
          title: "Compte",
          tabBarIcon: ({ color }) => <TabIcon glyph="👤" color={color} />,
        }}
      />
      <Tabs.Screen
        name="messagerie"
        options={{
          title: "Messages",
          tabBarIcon: ({ color }) => <TabIcon glyph="💬" color={color} />,
        }}
      />
    </Tabs>
  );
}
