# MAFOSS Immobilier — prototype Sénégal

Site en français, sans dépendance npm de production, connecté à Supabase. Démarrer avec `npm start`, puis ouvrir http://127.0.0.1:4173 (administration : http://127.0.0.1:4173/admin/). Génération des pages : `npm run build`. Vérification : `npm test` et `npm run check`. Le dossier publié est `dist/`.

## Pages et sources

13 pages publiques préparées : accueil, catalogue, sélection, fiche d’un bien, services, agence, adresses, expérience 3D, contact, FAQ, confidentialité, mentions légales et 404. L’administration existante est conservée séparément.

- `src/home.html` : source de l’accueil et des éléments communs (en-tête, pied de page, dialogues).
- `scripts/build-pages.mjs` : contenu et génération des pages secondaires. Ne pas éditer directement les fichiers HTML générés dans `dist/`.
- `dist/app.js` : catalogue, recherche, favoris, aperçu rapide et accueil animé.
- `dist/shared.js` : navigation commune, contacts et formulaire connecté.
- `dist/interior.js` : fiches partageables, FAQ et pages éditoriales.
- `dist/pages.css` : styles des pages secondaires.
- `dist/config.js` : coordonnées officielles fournies et configuration publique Supabase.

Le numéro +221 77 421 24 84 et l’adresse MAFOSHOLDING@gmail.com sont intégrés. Une fiche est accessible par `bien.html?id=<identifiant>`. Les liens `biens.html?transaction=Location` et `biens.html?place=Saly` préfiltrent le catalogue. Les favoris restent locaux et fonctionnent entre les pages.

## Fonctionnalités

- Filtres combinables : région, ville, quartier, transaction, type et superficie min/max en m². Tri par sélection ou surface, état vide. Prix sur demande (WhatsApp, téléphone, e-mail).
- Catalogue chargé depuis Supabase, détail accessible en fenêtre modale, sélection conservée localement. Les neuf fiches de départ sont fictives (`demo = true`) et affichent les mentions « fictif » ; les vraies annonces non.
- Résidence 3D WebGL avec profondeur : rotation, inclinaison, zoom, toiture et lumière. Chargement différé et rendu uniquement sur interaction ; résolution limitée à 2×. Illustration de remplacement si WebGL est indisponible.
- Formulaire de contact enregistré dans Supabase (nom, e-mail ou téléphone, projet, consentement), avec champ piège anti-robots.
- Espace admin (`dist/admin/`) : connexion Supabase Auth, ajout / modification / suppression d’annonces avec envoi de photos, suivi des demandes de contact (nouvelle, en cours, traitée).
- Responsive, clavier, liens d’évitement, focus visible, fenêtres modales natives, préférence de mouvements réduits.

## Backend Supabase

Projet `mafos-immobilier` (`wjmnowofonfpbpclkeuk`, région Paris eu-west-3). Connexion dans `dist/config.js` : URL et clé *publishable*, publiques par conception. Ne jamais y mettre une clé secrète.

- `properties` : annonces. Lecture publique des annonces publiées ; écriture réservée aux admins.
- `property_prices` : prix internes, lisibles et modifiables par les seuls admins. Le site affiche « Prix sur demande » ; les prix se communiquent par WhatsApp, téléphone ou e-mail (coordonnées dans `CONTACT`, fichier `dist/config.js` ; un canal vide n’est pas affiché).
- `contact_requests` : demandes du formulaire. Le public peut seulement insérer les champs du formulaire ; lecture, statut et suppression réservés aux admins.
- `admin_users` : comptes Supabase Auth autorisés à administrer. Vérification par `private.is_admin()` (schéma non exposé par l’API).
- Stockage `property-images` : photos publiques, 5 Mo max., WebP / JPEG / PNG ; envoi réservé aux admins.

Les droits sont accordés explicitement (pas d’accès automatique aux nouvelles tables) et toutes les tables ont la RLS activée.

**Ajouter un administrateur** : créer le compte dans le tableau de bord Supabase (*Authentication › Users › Add user*, avec confirmation automatique), puis exécuter dans l’éditeur SQL :

```sql
insert into public.admin_users (user_id) select id from auth.users where email = 'adresse@exemple.com';
```

Recommandé : désactiver les inscriptions publiques (*Authentication › Sign In / Providers › Allow new users to sign up*). Un compte inscrit sans être dans `admin_users` n’a de toute façon aucun droit supplémentaire.

## Hébergement Vercel

Site en ligne : https://mafosholding.vercel.app (projet Vercel `lelegance-ancree-au-senegal`, équipe SNDEV). Le projet est relié au dépôt GitHub `Souhaibu/mafoss-immobilier` : chaque envoi sur `main` déploie la production.

`vercel.json` fixe la configuration : build `npm run build`, dossier publié `dist`, adresses en `.html` conservées (`cleanUrls: false`), redirection `/admin` → `/admin/`, en-têtes de sécurité (CSP limitée au site, à Supabase et à jsDelivr pour l’admin ; interdiction d’intégration en iframe ; `nosniff` ; `Referrer-Policy` ; `Permissions-Policy`), cache de 7 jours pour `/assets/`, admin en `noindex` et `no-store`.

Si un nouveau service externe est ajouté (police, statistiques, carte…), ajouter son domaine à la CSP de `vercel.json`, sinon le navigateur le bloquera. L’adresse du site (canonical, sitemap) est définie par `base` dans `scripts/build-pages.mjs`.

## Éléments à fournir avant exploitation commerciale

Le logo MAFOS Holding et la palette existante sont conservés (voir `ASSETS.md`). Le cahier des charges initial n’a pas été fourni ; sa conformité complète n’est pas affirmée. Restent à fournir : vraies annonces avec photos autorisées, adresse du siège, RCCM/NINEA et responsable de publication, durée de conservation des demandes et domaine final. Voir `LANCEMENT.md`. Les pages de démonstration sont volontairement marquées `noindex` ; enlever cette directive dans le générateur seulement lorsque les contenus réels et les mentions sont prêts. Le formulaire dispose d’un champ piège mais pas d’une limite de fréquence côté serveur.

## Version anglaise future

Les données sont séparées (table Supabase `properties`, fonctions dans `dist/catalogue.js`), le formatage utilise `Intl.NumberFormat`, les libellés du catalogue sont dans `dist/locales/fr.js`. Ajouter `en.js` pour les libellés dynamiques et une page `/en/` traduite depuis le HTML français. Les identifiants `demo-*` restent indépendants de la langue. Prévoir les routes de langue, `lang`, titres et `hreflang` avant d’activer un sélecteur. La version anglaise n’est pas encore implémentée.

## Visuels et attribution

Voir `ASSETS.md`. Les images conceptuelles, personnes, programmes, prix et surfaces ne documentent aucun bien réel ni réalisation de MAFOSS. La photo de Dakar est documentaire et ancienne, avec crédit visible et lien de licence. Les fichiers PNG maîtres sont conservés dans `source-assets/`, hors du dossier publié ; seuls les WebP optimisés sont servis.
