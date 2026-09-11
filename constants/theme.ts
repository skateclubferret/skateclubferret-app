// Charte graphique reprise telle quelle du site (styles.css) — ne pas en créer
// une nouvelle pour l'app. Voir le plan, section 0.
export const colors = {
  ink: "#0b1220",
  navy: "#12244a",
  navy2: "#1b3566",
  sand: "#faf4e8",
  coral: "#ff5a3c",
  coralDark: "#e0451f",
  teal: "#0aa896",
  tealDark: "#08806f",
  yellow: "#ffc93c",
  white: "#ffffff",
} as const;

// Space Grotesk pour les titres/boutons, Inter pour le texte courant — chargées
// via @expo-google-fonts dans app/_layout.tsx.
export const fonts = {
  heading: "SpaceGrotesk_700Bold",
  headingMedium: "SpaceGrotesk_500Medium",
  body: "Inter_400Regular",
  bodyMedium: "Inter_500Medium",
  bodySemiBold: "Inter_600SemiBold",
} as const;

export const radii = {
  sm: 8,
  md: 14,
  lg: 20,
  pill: 999,
} as const;

export const spacing = (n: number) => n * 4;
