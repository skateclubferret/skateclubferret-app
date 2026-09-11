import { Redirect, Tabs } from "expo-router";
import { Text } from "react-native";
import { useAuth } from "@/lib/auth-context";
import { colors, fonts } from "@/constants/theme";

// Icônes texte simples pour ce squelette (Phase 0) — à remplacer par de vraies
// icônes (ex. @expo/vector-icons) une fois le projet installable.
function TabIcon({ glyph, color }: { glyph: string; color: string }) {
  return <Text style={{ fontSize: 20, color }}>{glyph}</Text>;
}

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
        name="creneaux"
        options={{
          title: "Créneaux",
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
        name="compte"
        options={{
          title: "Mon compte",
          tabBarIcon: ({ color }) => <TabIcon glyph="👤" color={color} />,
        }}
      />
    </Tabs>
  );
}
