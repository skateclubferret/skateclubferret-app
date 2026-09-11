# Skate Club Ferret — Application mobile (iOS + Android)

> Ce document est un brief de conception à coller directement dans Claude Code. Il part de l'existant réel (repo GitHub + base Supabase déjà en production) pour cadrer une application mobile complémentaire au site web, pas un remplacement.

## 0. Contexte — ce qui existe déjà

- **Site web** : repo GitHub `skateclubferret/skateclubferret-2026`, déployé sur Vercel (skateclubferret.fr). Pages clés : `index.html`, `le-club.html`, `cours-a-l-annee.html`, `stages-vacances.html`, `mon-espace.html` (espace adhérent), `espace-admin.html` (console admin), `contact.html`.
- **Backend** : projet Supabase `ugqhdjpnxroqcfbmngsc` (nom : skate-club-ferret), Postgres avec RLS activé sur toutes les tables. Client web : `@supabase/supabase-js` (voir `supabase-config.js`).
- **Tables principales déjà en place** (à réutiliser telles quelles, ne pas dupliquer) :
  - `adherents`, `enfants` — profils, santé, droit à l'image, contact urgence
  - `cartes_cours` — achats (adhésion, cartes de séances, licence FFRS), avec `stripe_payment_id`, `mode_paiement`, `paiement_confirme`, `montant`
  - `creneaux_modeles`, `creneaux` — trames horaires et séances datées (lieu `cassieu`/`mimbeau`, catégorie `annee`/`stage`)
  - `reservations`, `inscriptions_cours_annee` — réservations de séances
  - `preinscriptions`, `preinscription_saisons` — pré-inscriptions saisonnières
  - `evenements`, `evenement_inscriptions` — événements du club et inscriptions
  - `convocations_envoyees` — convocations déjà envoyées (probablement par email aujourd'hui) pour un créneau
  - `admin_accounts` — comptes ayant accès à la console admin
  - `horaires_publics`, `partenaires_avantages`, `newsletter_subscribers`, `demandes_suppression`
- **Edge Functions existantes** : `stripe-webhook`, `create-checkout-session`, `confirm-preinscription`, `send-convocations`, `repondre-convocation`, `calendrier-cours-annee`, `generate-login-link`, `invite-adherent`, `dynamic-api`.
- **Paiements** : Stripe déjà intégré côté web (Checkout Session). À adapter côté mobile (voir section 4).
- **Charte graphique** existante à réutiliser (ne pas réinventer) :
  - Couleurs : `--ink:#0b1220` `--navy:#12244a` `--navy-2:#1b3566` `--sand:#faf4e8` `--coral:#ff5a3c` `--coral-dark:#e0451f` `--teal:#0aa896` `--teal-dark:#08806f` `--yellow:#ffc93c` `--white:#ffffff`
  - Polices : **Space Grotesk** (titres, boutons) + **Inter** (texte courant)
  - Logo : `assets/logo-icon.png`, `assets/logo-skateclubferret.png`

**Principe directeur : l'app mobile est un nouveau client qui parle à la même base Supabase.** Pas de nouvelle base, pas de doublon de logique métier — seulement les ajouts strictement nécessaires (notifications, photos d'événements) décrits en section 5.

## 1. Objectif de l'application

Une app mobile (iOS + Android, un seul codebase) qui devient l'usage quotidien de l'association pour :
- les **adhérents** : consulter/gérer leur compte, réserver et payer des cours/stages, être notifiés en temps réel, acheter à la boutique du club, participer aux événements et partager des photos ;
- **François et Maxime (admins)** : avoir l'intégralité de la console admin dans leur poche, y compris l'envoi de notifications.

Le site web reste la vitrine publique (présentation, SEO, pré-inscription pour les non-adhérents). L'app est l'espace opérationnel réservé aux membres.

## 2. Stack technique recommandée

- **React Native + Expo (TypeScript)** — un seul codebase pour iOS et Android.
  - Cohérent avec l'existant : le site utilise déjà `supabase-js` en JavaScript, donc même écosystème, même client Supabase, courbe d'apprentissage minimale.
  - **EAS Build** (Expo Application Services) permet de compiler l'app iOS *et* Android depuis le cloud, sans que François (Android) ait besoin d'un Mac ni que Maxime doive gérer Android Studio. Chacun teste sur sa plateforme (TestFlight pour iOS, Google Play Internal Testing pour Android) depuis le même repo.
  - **Expo Notifications** pour les push, avec un point d'entrée unique qui gère APNs (Apple) et FCM (Android).
  - **`@supabase/supabase-js`** (même lib que le site) + Realtime pour les mises à jour en direct (dispo créneaux, nouvelles photos d'événement).
  - **`@stripe/stripe-react-native`** pour le paiement natif (Payment Sheet), voir section 4.
  - **React Navigation** (ou Expo Router) pour la structure des écrans.
- **Repo séparé** (ex. `skateclubferret/skateclubferret-app`), pas un monorepo avec le site — cycles de déploiement indépendants (App Store / Play Store vs Vercel).
- **Authentification** : Supabase Auth existant, **mêmes comptes** que le site (un adhérent qui a un compte sur `mon-espace.html` se connecte avec les mêmes identifiants dans l'app). Ne pas créer un système d'auth parallèle.

## 3. Comptes développeur nécessaires (logistique, à anticiper)

- **Apple Developer Program** (99 $/an) — au nom de l'association si possible, sinon celui de Maxime — nécessaire pour publier sur l'App Store et utiliser TestFlight.
- **Google Play Console** (25 $ une fois) — celui de François — nécessaire pour Android.
- Les deux comptes doivent être ajoutés comme utilisateurs sur le projet **Expo (EAS)** partagé, pour que les deux puissent déclencher des builds et accéder aux tests internes.
- Prévoir une **politique de confidentialité** publique (obligatoire pour la publication, d'autant plus qu'on gère des données de mineurs et de santé) — peut être une page simple sur le site existant.

## 4. Fonctionnalités détaillées

### 4.1 Authentification & espace adhérent
- Connexion avec les identifiants Supabase existants (email + mot de passe, ou lien magique).
- Un compte peut être rattaché à plusieurs `enfants`.
- Écran profil : infos adhérent, enfants, fiches santé, droit à l'image, licence FFRS — lecture et mise à jour.

### 4.2 Cours à l'année & stages vacances
- Consultation des créneaux (`creneaux_modeles` + `creneaux`), filtrés par lieu et catégorie.
- Réservation d'un créneau → écriture dans `reservations` / `inscriptions_cours_annee`.
- Achat de cartes de cours, adhésion, licence FFRS → voir 4.3.
- Pré-inscription à la nouvelle saison directement depuis l'app (`preinscriptions`).

### 4.3 Paiements (réutilise l'architecture Stripe existante)
- **Attention technique** : le site utilise Stripe Checkout (redirection web). En mobile, utiliser plutôt le **Payment Sheet natif** de `@stripe/stripe-react-native`.
- Créer une nouvelle Edge Function (ou adapter `create-checkout-session`) qui renvoie un `PaymentIntent` (client secret) au lieu d'une URL de redirection, pour que le paiement se fasse dans l'app sans sortir vers un navigateur.
- Le webhook Stripe existant (`stripe-webhook`) continue de faire foi pour confirmer les paiements et écrire dans `cartes_cours` — aucun changement côté confirmation.

### 4.4 Notifications push (nouvelle brique)
- Nouvelle table `push_tokens` (voir section 5) qui enregistre le token Expo de chaque appareil à la connexion.
- Cas d'usage prioritaire : **François annule un créneau** → une Edge Function repère tous les adhérents/enfants inscrits sur ce créneau (via `reservations`/`inscriptions_cours_annee`) → envoie un push à chacun via l'API Expo Push.
- Autres déclencheurs à brancher sur le même mécanisme : nouvelle convocation (`convocations_envoyees`), réponse à une pré-inscription, rappel de créneau à venir, nouvelle photo ajoutée à un événement auquel on participe.
- Écran de préférences : activer/désactiver par type de notification.

### 4.5 Console admin mobile (François & Maxime)
- Accès réservé aux comptes présents dans `admin_accounts`.
- Reprend les fonctions de `espace-admin.html` : gestion des adhérents/enfants, validation des cartes de cours en espèces/virement (`paiement_confirme`), gestion des créneaux (création, annulation → déclenche 4.4), traitement des préinscriptions, envoi de convocations et d'annonces manuelles.
- **Priorisation réaliste** : viser d'abord les actions du quotidien (annuler un créneau, valider un paiement, répondre à une préinscription, envoyer une annonce) ; les tâches plus rares/complexes de la console web peuvent rester sur le web dans un premier temps.

### 4.6 Boutique en ligne du club
- Nouvelle table `produits_boutique` (catalogue simple : nom, description, prix, image, tailles/variantes, stock).
- Achat via le même flux Payment Sheet que 4.3.
- Départ pragmatique : reprendre le produit déjà existant sur le site (tee-shirt du club) comme premier article du catalogue.
- Suivi des commandes côté admin (nouvelle table `commandes_boutique`).

### 4.7 Événements + galerie photo partagée
- Création/gestion d'événements (réutilise `evenements`), inscription (réutilise `evenement_inscriptions`).
- **Fonctionnalité clé demandée** : pendant/après un événement, chaque participant inscrit peut uploader des photos depuis l'app ; toutes les photos partagées sur cet événement sont visibles par tous les autres participants inscrits (galerie collective par événement).
- Nécessite : nouvelle table `evenement_photos` + un bucket **Supabase Storage** dédié, avec règles RLS limitant la visibilité aux personnes inscrites à l'événement (ou public si le club préfère une galerie ouverte à tous les adhérents — à trancher).
- Notification push automatique quand une nouvelle photo est ajoutée à un événement auquel on participe (branché sur 4.4).

### 4.8 Chat direct adhérent ↔ association
Un fil de discussion en temps réel entre chaque adhérent (famille) et l'association (François/Maxime côté admin) — pas un chat ouvert entre adhérents entre eux, ce qui évite le sujet sensible de modération d'un chat public sur un club à public majoritairement mineur (dès 4 ans), tout en donnant un vrai canal direct et instantané.

- **Un fil par adhérent** avec l'association (pas un chat de groupe) : la famille écrit, un membre du bureau répond — visible des deux côtés en temps réel via Supabase Realtime.
- Côté app adhérent : un onglet « Messages », historique complet, envoi de texte (et photo si utile, ex. justificatif).
- Côté app admin (François & Maxime) : une boîte de réception listant tous les fils, avec compteur de non-lus, pour répondre à n'importe où.
- Branché sur les notifications push (4.4) : l'adhérent est notifié quand le club répond, le bureau est notifié quand une famille écrit.
- Hors périmètre volontaire pour cette première version : messagerie adhérent-à-adhérent (peer-to-peer). Si le besoin apparaît plus tard, ce sera une décision à prendre avec le bureau vu l'enjeu de modération, distincte du chat adhérent ↔ association décrit ici.

## 5. Nouvelles tables Supabase à créer

```sql
-- Tokens push par appareil
create table push_tokens (
  id uuid primary key default gen_random_uuid(),
  adherent_id uuid references adherents(id) on delete cascade,
  expo_push_token text not null unique,
  platform text check (platform in ('ios','android')),
  created_at timestamptz default now(),
  last_active_at timestamptz default now()
);

-- Photos partagées par événement
create table evenement_photos (
  id uuid primary key default gen_random_uuid(),
  evenement_id uuid references evenements(id) on delete cascade,
  adherent_id uuid references adherents(id),
  storage_path text not null,
  created_at timestamptz default now()
);

-- Catalogue boutique
create table produits_boutique (
  id uuid primary key default gen_random_uuid(),
  nom text not null,
  description text,
  prix numeric not null,
  image_url text,
  variantes jsonb,
  stock integer,
  actif boolean default true,
  created_at timestamptz default now()
);

-- Messagerie adhérent <-> association (un fil par adhérent)
create table messages (
  id uuid primary key default gen_random_uuid(),
  adherent_id uuid references adherents(id) on delete cascade,
  expediteur text check (expediteur in ('adherent','admin')) not null,
  admin_id uuid references admin_accounts(email), -- rempli si expediteur = 'admin'
  contenu text not null,
  photo_url text,
  lu boolean default false,
  created_at timestamptz default now()
);

-- Commandes boutique
create table commandes_boutique (
  id uuid primary key default gen_random_uuid(),
  adherent_id uuid references adherents(id),
  produit_id uuid references produits_boutique(id),
  variante text,
  quantite integer default 1,
  montant numeric,
  stripe_payment_id text,
  statut text default 'en_attente',
  created_at timestamptz default now()
);
```

(Penser RLS sur chacune, cohérent avec le reste du schéma : un adhérent ne voit que ses propres données, sauf pour les tables ouvertes comme les photos d'un événement partagé.)

## 6. Plan de développement par phases

| Phase | Contenu | Dépend de |
|---|---|---|
| **0 — Fondations** | Repo Expo/TS, connexion à la même base Supabase, auth réutilisée, navigation de base, charte graphique | — |
| **1 — Espace adhérent (lecture)** | Profil, enfants, cartes de cours, consultation des créneaux | Phase 0 |
| **2 — Réservations & paiements** | Réservation de créneaux, achat via Payment Sheet Stripe, pré-inscription | Phase 1 |
| **3 — Notifications push** | Table `push_tokens`, Edge Function d'envoi, déclenchée sur annulation de créneau | Phase 2 |
| **4 — Console admin mobile** | Actions du quotidien pour François & Maxime | Phase 1 |
| **5 — Boutique** | Catalogue + achat + suivi commandes | Phase 2 |
| **6 — Événements & photos** | Création d'événements, upload photo, galerie collective, notif sur nouvelle photo | Phase 3 |
| **7 — Chat adhérent ↔ association** | Table `messages`, fil temps réel par adhérent, boîte de réception admin, notifs sur nouveau message | Phase 3 |

## 7. Ce qui ne change pas

- Le site web (skateclubferret.fr) reste en ligne tel quel : vitrine publique, pré-inscriptions pour les non-adhérents, SEO.
- La base Supabase et les Edge Functions existantes ne sont pas dupliquées, seulement complétées.
- Les comptes adhérents et admin sont partagés entre le site et l'app — une seule identité, deux interfaces.
