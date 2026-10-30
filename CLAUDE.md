# Krinkels Plan

Application web (PWA) en un seul fichier `index.html`, publiée par GitHub Pages depuis la branche `claude/github-sur-cjesdk` :
https://nicolas06061997.github.io/Krinkels-plan/

L'utilisateur parle français et n'est pas développeur : réponses courtes, en français, étape par étape.

## À chaque modification de l'appli
1. Changer `APPV` en bas de `index.html` **et** `v` dans `version.json` (même valeur, format `AAAA-MM-JJ.n`, différente à chaque fois).
   Mettre dans `notes` de `version.json` une phrase courte sur la nouveauté : elle s'affiche dans le message « Nouvelle mise à jour disponible ».
   Le service worker est enregistré en `sw.js?v=APPV` : son cache (`krinkels-<version>`) change tout seul, rien à modifier dans `sw.js`.
2. Commit + push sur `claude/github-sur-cjesdk` ; GitHub Pages publie en 2-3 minutes.

## Stations Total
`stations.json` est généré chaque semaine par `.github/workflows/stations.yml` (`scripts/stations.py`, Overpass).
L'appli garde les stations à moins de 50 km (`RAY`), avec Overpass en direct en secours.
