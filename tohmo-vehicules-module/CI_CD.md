# Pipeline CI/CD — Véhicules

Ce module a maintenant des tests automatiques (Jest) et un pipeline de déploiement vers Apps Script via GitHub Actions et `clasp` (l'outil CLI officiel de Google pour Apps Script).

## Ce qui est déjà en place (rien à faire)

- **`package.json` + `test/`** : des tests Jest qui chargent le *vrai* `Code_ajouts_vehicules.gs` (via le module `vm` de Node, pas une copie) et vérifient sa logique — calcul des alertes d'échéance (CT/assurance/entretien/fin de contrat), normalisation d'immatriculation, parsing de dates, et la gestion des colonnes du Sheet (`ajouterColonnesManquantes` / `indexColonneVehicules` / `poserValidationColonne`) avec un Sheet factice en mémoire. 13 tests, tous passants.
- **`.github/workflows/vehicules-ci-cd.yml`** : deux jobs.
  - `test` : tourne à chaque push ou pull request qui touche `tohmo-vehicules-module/` — installe les dépendances, lance `npm test`. Aucune configuration requise, ça fonctionne déjà.
  - `deploy` : pousse le code vers ton projet Apps Script réel via `clasp push` puis met à jour ta déploiement de prod via `clasp deploy -i <deploymentId>` (pour que ton URL de prod existante pointe vers le nouveau code, pas une nouvelle URL). **Ce job ne se déclenche pas tout seul pour l'instant** — uniquement à la demande (`workflow_dispatch`), voir pourquoi plus bas.

## Ce qu'il reste à faire — et qui ne peut être fait que par toi

Trois informations sensibles ou propres à ton compte Google, que ni moi ni GitHub Actions ne peuvent deviner :

### 1. Le jeton d'authentification `clasp` (secret `CLASP_CREDENTIALS`)

Sur une machine avec Node.js installé :
```
npm install -g @google/clasp
clasp login
```
Ça ouvre ton navigateur pour autoriser l'accès à ton compte Google (celui qui a accès au projet Apps Script "HUB"). Une fois fait, un fichier `~/.clasprc.json` est créé sur ta machine — ouvre-le, copie tout son contenu.

### 2. Le Script ID du projet Apps Script (variable `APPS_SCRIPT_ID`)

Dans l'éditeur Apps Script (script.google.com, projet "HUB") : icône ⚙️ **Paramètres du projet** → section **IDs** → **Script ID**. Copie cette valeur.

### 3. L'ID de déploiement de prod (variable `APPS_SCRIPT_DEPLOYMENT_ID`)

C'est le segment après `/s/` dans ton URL de prod actuelle :
```
https://script.google.com/a/macros/zeplug.com/s/AKfycbxglgtjm7BMsFcHa8jE4a83AMIucZNCUtdXhkcCMgz9hHXK3Fj4fpZsgs3gexRqF74A/exec
```
→ `AKfycbxglgtjm7BMsFcHa8jE4a83AMIucZNCUtdXhkcCMgz9hHXK3Fj4fpZsgs3gexRqF74A`

### Où mettre ces trois valeurs

Sur GitHub (github.com), dans ce repo : **Settings → Secrets and variables → Actions**.
- Onglet **Secrets** → **New repository secret** → nom `CLASP_CREDENTIALS`, valeur = le contenu de `~/.clasprc.json` (étape 1).
- Onglet **Variables** → **New repository variable** → `APPS_SCRIPT_ID` (étape 2) et `APPS_SCRIPT_DEPLOYMENT_ID` (étape 3).

C'est un point de passage obligé par l'interface web de GitHub (aucun outil ici ne peut créer un secret de dépôt à ta place) — mais c'est un aller-retour de deux minutes, pas besoin de savoir utiliser `git`.

### Avant le tout premier déploiement automatique : vérifier qu'il n'y a pas de dérive

Tu travailles directement dans l'éditeur Apps Script. Ce repo ne contient qu'une reconstruction du code (`Code_complet.gs`, `index.html`) pensée pour un copier-coller manuel — si tu as fait des ajustements directement dans Apps Script qui n'ont jamais été recopiés ici, un `clasp push` automatique les écraserait. Avant d'activer le déploiement automatique :
1. Dans un dossier vide sur ta machine : `clasp clone <ton Script ID>` (récupère le code réellement en prod, plus le vrai `appsscript.json`).
2. Compare avec `Code_complet.gs` / `index.html` de ce repo — dis-moi s'il y a des écarts, je les intègre.
3. Copie le vrai `appsscript.json` récupéré dans `tohmo-vehicules-module/appsscript.json` (le `.example` fourni ici n'est qu'un gabarit de départ, pas à utiliser tel quel).

## Une fois les secrets en place

Je peux déclencher le déploiement moi-même (sans que tu touches à GitHub) via l'outil `actions_run_trigger` sur ce workflow — dis-moi simplement "déploie" après une modification, et je lance le job.

Le déclenchement reste manuel pour l'instant (pas automatique à chaque push) : le temps de vérifier que la mécanique fonctionne bien sur quelques déploiements, avant d'envisager un déclenchement automatique (par exemple sur push vers une branche `main` dédiée qu'on créerait à ce moment-là).
