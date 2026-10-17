# MAFOSS Immobilier — prototype Sénégal

Site statique en français, sans dépendance de production. Démarrer avec `npm start`, puis ouvrir http://127.0.0.1:4173. Vérification : `npm test` et `npm run check`. Le dossier publié est `dist/`.

## Fonctionnalités

- Filtres combinables : région, ville, quartier, transaction, type, budget min/max en FCFA et superficie min/max en m². Tri et état vide.
- Neuf fiches entièrement fictives, détail accessible en fenêtre modale, sélection conservée localement.
- Résidence 3D par projection orthographique de géométrie : rotation, inclinaison, zoom, toiture et lumière. Chargement différé et rendu uniquement sur interaction ; résolution limitée à 2×.
- Résumé de projet téléchargeable, sans serveur de contact ni envoi de données.
- Responsive, clavier, liens d’évitement, focus visible, fenêtres modales natives, préférence de mouvements réduits.

## Éléments à fournir avant exploitation commerciale

Le dossier initial était vide. Le logo officiel, les valeurs colorimétriques et le cahier des charges initial n’ont pas été fournis ; le monogramme et la palette restent provisoires. Aucun respect du cahier des charges absent n’est affirmé. Intégrer des biens vérifiés, photos autorisées par leurs titulaires, coordonnées et mentions légales validées, ainsi qu’un vrai service de contact avant lancement commercial.

## Version anglaise future

Les données sont séparées (`dist/catalogue.js`), le formatage utilise `Intl.NumberFormat`, les libellés du catalogue sont dans `dist/locales/fr.js`. Ajouter `en.js` pour les libellés dynamiques et une page `/en/` traduite depuis le HTML français. Les identifiants `demo-*` restent indépendants de la langue. Prévoir les routes de langue, `lang`, titres et `hreflang` avant d’activer un sélecteur. La version anglaise n’est pas encore implémentée.

## Visuels et attribution

Voir `ASSETS.md`. Les images conceptuelles, personnes, programmes, prix et surfaces ne documentent aucun bien réel ni réalisation de MAFOSS. La photo de Dakar est documentaire et ancienne, avec crédit visible et lien de licence. Les fichiers PNG maîtres sont conservés dans `source-assets/`, hors du dossier publié ; seuls les WebP optimisés sont servis.
