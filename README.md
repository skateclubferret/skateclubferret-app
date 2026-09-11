# Skate Club Ferret — app mobile

Squelette **Phase 0** (voir `planappmobileskateclubferret.md` dans le repo du site) : Expo + TypeScript + Expo Router, connecté à la **même base Supabase** que [skateclubferret.fr](https://skateclubferret.fr) (projet `ugqhdjpnxroqcfbmngsc`) — mêmes comptes adhérent, mêmes tables, même RLS.

Ce dépôt est volontairement séparé de `skateclubferret/skateclubferret-2026` (le site) : cycles de déploiement indépendants (App Store / Play Store vs Vercel).

## État actuel

- ✅ Connexion (`app/(auth)/login.tsx`) avec les identifiants Supabase existants
- ✅ Client Supabase configuré (`lib/supabase.ts`, clé publique dans `app.json`)
- ✅ Navigation par onglets (`app/(tabs)/`) : Accueil, Mon compte (lit la fiche adhérent en RLS)
- ✅ Charte graphique reprise du site (`constants/theme.ts`) + polices Space Grotesk / Inter
- ⬜ Tout le reste du plan (créneaux, réservations, paiements Stripe natifs, notifications push, console admin, boutique, événements/photos, messagerie) — phases 1 à 7

**Vérifié** : `npm install`, `npx expo install --fix` (SDK 52.0.0), `tsc --noEmit` propre, et `expo export --platform ios` compile un bundle complet (993 modules) sans erreur. Pas encore testé sur un vrai appareil/simulateur (à faire via `npx expo start` + Dev Build).

**Icônes/splash** : `assets/images/*.png` sont pour l'instant une copie du logo du club (`logo-icon.png`, 2315×2315) — à remplacer par de vraies déclinaisons (icône 1024×1024 sans transparence, adaptive icon Android avec marge de sécurité, splash) avant une vraie soumission store.

## Prérequis

Node.js et les dépendances sont déjà installés dans ce dépôt (voir ci-dessus). Pour repartir d'une machine neuve :

1. **Installer Node.js LTS** — [nodejs.org](https://nodejs.org) (ou `winget install OpenJS.NodeJS.LTS` sous Windows).
2. Depuis ce dossier :
   ```bash
   npm install
   npx expo install --fix
   ```
3. **Compte Expo** (gratuit) : `npx expo login` — nécessaire pour EAS Build.

## Lancer en dev

```bash
npx expo start
```

- Si aucun module natif custom n'est requis, l'app **Expo Go** (App Store / Play Store) suffit : scanner le QR code.
- Dès qu'on ajoute Stripe natif ou les notifications push (Phase 2-3 du plan), il faudra un **Dev Build** (`eas build --profile development --platform ios|android`, installé une fois sur le téléphone, puis reconnexion à `expo start` à chaque session).

## Distribuer un build de test

- **Android, le plus rapide** : `eas build --platform android --profile preview` → un `.apk` téléchargeable et installable directement, sans compte Google Play.
- **iOS (TestFlight)** : nécessite le compte **Apple Developer Program** (99 $/an) — voir section 3 du plan. Puis `eas build --platform ios --profile preview` + `eas submit -p ios`.
- **Android (Play Internal Testing)** : nécessite le compte **Google Play Console** (25 $ une fois).

Il faudra un fichier `eas.json` (profils `development` / `preview` / `production`) — généré automatiquement par `eas build:configure` la première fois, une fois `eas-cli` installé (`npm install -g eas-cli`).

## Structure

```
app/
  _layout.tsx          racine : polices, StatusBar, AuthProvider
  index.tsx             redirige vers (tabs) ou (auth)/login selon la session
  (auth)/
    _layout.tsx
    login.tsx
  (tabs)/
    _layout.tsx          barre d'onglets
    index.tsx             Accueil
    compte.tsx             Mon compte (lit adherents en RLS)
lib/
  supabase.ts            client supabase-js (URL + clé publique)
  auth-context.tsx        contexte React de la session Supabase
constants/
  theme.ts                couleurs, polices, espacements repris du site
```

## Ne pas dupliquer

- Pas de nouveau projet Supabase — toujours `ugqhdjpnxroqcfbmngsc`.
- Pas de nouveau système d'auth — comptes Supabase partagés avec le site.
- Toute nouvelle table (`push_tokens`, `evenement_photos`, `produits_boutique`, `messages`, `commandes_boutique` — voir section 5 du plan) doit être créée dans **ce même projet Supabase**, avec RLS, pas ailleurs.
