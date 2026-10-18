# Préparation au lancement — 18 octobre 2026

## Réalisé

- 13 pages générées et liées, plus l’espace d’administration existant.
- Coordonnées fournies intégrées : +221 77 421 24 84, MAFOSHOLDING@gmail.com.
- Catalogue Supabase, prix sur demande, filtres, favoris et fiches partageables.
- Formulaire connecté avec consentement, vérification des réponses HTTP, délais d’attente et messages d’erreur sans faux succès.
- Scène WebGL corrigée, commandes clavier et tactiles, solution de remplacement sans 3D.
- Métadonnées, canonical, sitemap, robots.txt et page 404. Indexation volontairement désactivée pendant la démonstration.
- 14 tests automatisés réussis. Contrôle HTTP réel : 9 annonces publiées, toutes fictives ; les prix privés ne figurent pas dans la réponse publique. La lecture anonyme des demandes, des prix internes et des comptes admin renvoie 401.

## Informations à fournir par l’entreprise

1. Nom de domaine et accès à sa configuration DNS, si un domaine propre doit être utilisé.
2. Biens réels, disponibilités et photographies avec autorisation ; les neuf exemples actuels restent signalés fictifs.
3. Adresse du siège, RCCM, NINEA, responsable de publication et autres mentions propres à l’entreprise.
4. Durée de conservation des demandes et contact responsable de leur traitement.

Ces données ne sont pas remplacées par des valeurs inventées. Les pages Mentions légales et Confidentialité indiquent les éléments encore à compléter.

## Dernière recette commerciale

Se connecter avec un compte administrateur autorisé et vérifier la publication d’un premier bien réel. Faire une demande de contact identifiée comme test depuis le navigateur, la retrouver dans l’administration puis la supprimer. Aucun faux message client n’a été inséré pendant les contrôles automatisés ; l’insertion réelle et la gestion en session admin n’ont donc pas été testées de bout en bout dans cette intervention.

La base stocke les demandes ; aucune notification automatique par e-mail n’est affirmée. L’équipe doit consulter l’administration. Les liens WhatsApp et e-mail ouvrent le service choisi sans envoyer de message automatiquement.

## Reproduction

`node scripts/build-pages.mjs`

`node --test tests/*.test.mjs`

`npm run check`

Contrôle distant en lecture seule : `node scripts/check-live.mjs`.

Pour publier avec le helper Sites sous Windows, ajouter les dossiers `Git/bin` et `Git/usr/bin` au PATH du processus, et `TAR_OPTIONS=--force-local`. Cela permet au packager officiel de traiter les chemins `C:\...` sans les interpréter comme des destinations distantes. Ne pas enregistrer le jeton Git temporaire sur disque.
