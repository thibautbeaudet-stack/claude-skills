# Module Véhicules — Tohmo Office Hub

Ce dossier contient tout ce qu'il faut pour ajouter le module **Véhicules** à ton Hub Apps Script, dans le même programme que Budget & achats et Tickets déjà en prod.

## Contexte projet (à relire en début de nouvelle conversation)

- **Maquette cible du Hub complet** (vision finale, sidebar + tableau de bord + tous les modules) : https://claude.ai/code/artifact/cd574035-7f3d-4033-965f-161211c1e137
- **Sidebar actuelle** : icônes SVG (pas d'emoji), dans l'ordre — Tableau de bord (bientôt), Tâches (bientôt), **Tickets** (actif), **Budget & achats** (actif), Cartes, Calendrier, Mail, **Véhicules** (actif), Téléphonie, Accès/Badges, Bâtiment/Sites, Assurances, Stock/Matériel, Annuaire, Checklist (tous "bientôt disponible" tant qu'ils ne sont pas construits)
- **Architecture retenue** : un seul programme Apps Script ("HUB"), un seul `index.html` — chaque module est une `<section>` togglée en JS via la sidebar (pas de liens `?page=` en interne, ça casse). Seul le formulaire public Tickets (`formulaire_ticket.html`, accessible par QR code sans compte Google) reste un fichier séparé routé par `doGet(e)` avec `?page=ticket`.
- **URL de prod** : `https://script.google.com/a/macros/zeplug.com/s/AKfycbxglgtjm7BMsFcHa8jE4a83AMIucZNCUtdXhkcCMgz9hHXK3Fj4fpZsgs3gexRqF74A/exec`
- **Sheet Budget** ("Suivi Tohmo Hub") : Sheet lié au projet Apps Script (`SpreadsheetApp.getActive()`). **Véhicules vit dans ce même Sheet** (deux nouveaux onglets), car ce module n'a pas de formulaire public — pas besoin de l'isoler comme Tickets.
- **Sheet Tickets** ("Tohmo Hub - Tickets"), séparé : ID `1upy9uyN-g3afAEkOgpx806plCcEsL_bx75raPnsfTfI`, ouvert via `SpreadsheetApp.openById(SS_TICKETS_ID)`.
- **Charte graphique** : voir les CSS vars en haut de `index.html` (`--bg`, `--ink`, `--lime`, `--blue`, etc.) — rainbow bar (cyan→purple→green→lime), boutons lime, coins arrondis.
- **État actuel** : Budget + Tickets + Véhicules fonctionnels et testés localement (aperçu MOCK). QR code Tickets et ajustements de design encore à faire (reportés par l'utilisateur).

Deux fichiers seulement :
- `Code_ajouts_vehicules.gs` → fonctions serveur à coller dans ton `Code.gs`
- `index.html` → remplace entièrement ton fichier actuel : Budget, Tickets **et** Véhicules sont maintenant trois sections de la même page, affichées/masquées en JavaScript via la sidebar (aucun rechargement, aucun lien entre "pages")

---

## 1. Pourquoi pas de Sheet séparé, contrairement à Tickets

Tickets a besoin d'un Sheet séparé parce qu'un formulaire public (QR code, sans compte Google) doit pouvoir y écrire. Véhicules n'a **aucun accès public** : seule toi, connectée au hub, consultes/modifies le parc. Autant réutiliser directement le Sheet principal déjà lié au projet Apps Script (celui du Budget) — un onglet de plus, pas de nouvel ID à gérer, pas de nouveaux helpers à dupliquer (`getSheet`, `readSheet`, `appendRow`, `updateRowById`, `deleteRowById` déjà existants suffisent).

---

## 2. Étape 1 — Créer les onglets dans le Sheet principal ("Suivi Tohmo Hub")

**Option automatique (recommandée)** : une fois `Code_ajouts_vehicules.gs` collé dans `Code.gs` (étape 3 ci-dessous), lance la fonction `creerOngletsVehicules()` une seule fois depuis l'éditeur Apps Script — elle crée les deux onglets, les en-têtes et les garde-fous (listes déroulantes) toute seule dans le **même Sheet que le Budget** (pas le Sheet Tickets séparé). Sûr à relancer plusieurs fois si besoin.

Comment lancer une fonction depuis l'éditeur Apps Script : ouvre le projet (script.google.com), sélectionne `creerOngletsVehicules` dans le menu déroulant en haut de l'éditeur, clique sur ▶ Exécuter. La première fois, Google demande d'autoriser l'accès au Sheet : accepte.

Le reste de cette section décrit ce que la fonction crée, si tu préfères vérifier ou créer les onglets à la main.

### Onglet `vehicules`

Première ligne = ces en-têtes exactement (copie-colle la ligne) :

| Colonne | Contenu | Exemple |
|---|---|---|
| `id` | identifiant unique | `VEH-20260711-482` |
| `immatriculation` | plaque | `AB-123-CD` |
| `marque` | marque | `Renault` |
| `modele` | modèle | `Kangoo` |
| `type` | type de véhicule | `utilitaire` |
| `statut` | état | `En service` |
| `site` | site de rattachement | `Lyon` |
| `conducteur_nom` | conducteur attitré | `Julie Martin` |
| `conducteur_email` | email du conducteur | `julie.martin@tohmo.fr` |
| `kilometrage` | kilométrage actuel | `48200` |
| `date_ct` | échéance contrôle technique | `12/09/2026` |
| `date_assurance` | échéance assurance | `01/01/2027` |
| `date_entretien` | prochain entretien prévu | `15/08/2026` |
| `notes` | remarques libres | |
| `cree_le` | horodatage création | `11/07/2026 09:12` |
| `cree_par` | email de création | |
| `maj_le` | dernière modification | |

**Garde-fous (listes fermées) à poser avec Données > Validation des données sur toute la colonne :**
- `type` → liste : `citadine, berline, utilitaire, suv, autre`
- `statut` → liste : `En service, En maintenance, Hors service`
- `site` → liste : la même que tes sites Tohmo (voir `SITES_VEHICULES` dans le code)

### Onglet `vehicules_historique`

La "timeline" de chaque véhicule (création, changements de statut, entretiens, commentaires). Une ligne = un évènement.

| Colonne | Contenu | Exemple |
|---|---|---|
| `id` | identifiant unique | `EVT-20260711-118` |
| `vehicule_id` | référence au véhicule | `VEH-20260711-482` |
| `type_evenement` | nature de l'évènement | `creation` / `changement_statut` / `commentaire` |
| `contenu` | texte de l'évènement | `Statut changé en « En maintenance »` |
| `auteur` | qui a fait l'action | `office@tohmo.fr` |
| `cree_le` | horodatage | `11/07/2026 09:12` |

Pas besoin de remplir ces onglets à la main : le code s'en charge (`ajouterEvenementVehicule`).

---

## 3. Étape 2 — Code serveur (`Code.gs`)

1. Colle tout le contenu de `Code_ajouts_vehicules.gs` à la fin de ton `Code.gs`.
2. Personnalise en haut du bloc :
   - `SITES_VEHICULES` → remplace par la vraie liste de vos sites Tohmo (même liste que `SITES_TICKETS`).
3. Sauvegarde, puis lance `creerOngletsVehicules()` une fois (voir étape 2 ci-dessus) pour créer les onglets.
4. Aucun changement à `doGet()` — Véhicules n'a pas de page publique.

---

## 4. Étape 3 — Fichier HTML

1. **Remplace entièrement** le contenu de `index.html` par la nouvelle version (Budget + Tickets + Véhicules fusionnés).
2. Garde `formulaire_ticket` tel quel si tu as déjà le module Tickets — Véhicules n'y touche pas.

---

## 5. Étape 4 — Déployer

`Déployer` → `Gérer les déploiements` → icône crayon ✏️ → `Nouvelle version` → `Déployer`.

---

## 6. Ce que fait chaque fonction serveur (résumé)

| Fonction | Rôle |
|---|---|
| `creerOngletsVehicules()` | installation : crée les onglets + garde-fous (à lancer une fois) |
| `getVehicules()` | liste tous les véhicules, avec alerte d'échéance calculée |
| `getVehicule(id)` | un véhicule + sa timeline |
| `getStatsVehicules()` | chiffres du bandeau stats |
| `addVehicule(data)` | ajouter un véhicule au parc |
| `majStatutVehicule(id, statut, commentaire)` | changer le statut |
| `majVehicule(id, updates)` | modifier kilométrage/dates/conducteur/etc. |
| `addCommentaireVehicule(id, texte)` | ajouter une note dans la timeline |
| `supprimerVehicule(id)` | sortie de parc définitive |

Toutes ces fonctions vivent dans `Code.gs` et sont appelées via `google.script.run` depuis `index.html` (section Véhicules).

---

## 7. Détails techniques pour la suite

- **Alertes d'échéance** : `calculerAlerteVehicule` compare `date_ct`, `date_assurance`, `date_entretien` à aujourd'hui. Moins de 30 jours (ou déjà passé) → badge d'alerte sur la ligne et dans les stats. Seuil réglable via `VEHICULE_SEUIL_ALERTE_JOURS`.
- **Namespacing JS** : tout le code du module Véhicules dans `index.html` est isolé sous l'objet `Vehicules.*` (ex. `Vehicules.render()`, `Vehicules.ouvrirDrawer()`), comme `Tickets.*` et `Budget` (`load()`, `renderAll()`).
- **CSS namespacing** : toutes les classes propres à Véhicules sont préfixées `v-` (`.v-table`, `.v-drawer`, `.v-btn`...), même logique que le préfixe `t-` pour Tickets.
- **Prévisualisation locale** : `index.html` détecte s'il tourne dans Apps Script ou non ; hors Apps Script il bascule sur des données factices (MOCK) pour prévisualiser le rendu visuel.
