# Module Véhicules — Tohmo Office Hub

Ce dossier contient tout ce qu'il faut pour ajouter le module **Véhicules** à ton Hub Apps Script, dans le même programme que Budget & achats et Tickets déjà en prod.

## Contexte projet (à relire en début de nouvelle conversation)

- **Maquette cible du Hub complet** (vision finale, sidebar + tableau de bord + tous les modules) : https://claude.ai/code/artifact/cd574035-7f3d-4033-965f-161211c1e137
- **Sidebar actuelle** : icônes SVG (pas d'emoji), dans l'ordre — Tableau de bord (bientôt), Tâches (bientôt), **Tickets** (actif), **Budget & achats** (actif), Cartes, Calendrier, Mail, **Véhicules** (actif), Téléphonie, Accès/Badges, Bâtiment/Sites, Assurances, Stock/Matériel, Annuaire, Checklist (tous "bientôt disponible" tant qu'ils ne sont pas construits)
- **Architecture retenue** : un seul programme Apps Script ("HUB"), un seul `index.html` — chaque module est une `<section>` togglée en JS via la sidebar (pas de liens `?page=` en interne, ça casse). Seul le formulaire public Tickets (`formulaire_ticket.html`, accessible par QR code sans compte Google) reste un fichier séparé routé par `doGet(e)` avec `?page=ticket`.
- **URL de prod** : `https://script.google.com/a/macros/zeplug.com/s/AKfycbxglgtjm7BMsFcHa8jE4a83AMIucZNCUtdXhkcCMgz9hHXK3Fj4fpZsgs3gexRqF74A/exec`
- **Sheet Budget** ("Suivi Tohmo Hub") : Sheet lié au projet Apps Script (`SpreadsheetApp.getActive()`).
- **Sheet Tickets** ("Tohmo Hub - Tickets"), séparé : ID `1upy9uyN-g3afAEkOgpx806plCcEsL_bx75raPnsfTfI`, ouvert via `SpreadsheetApp.openById(SS_TICKETS_ID)`.
- **Sheet Véhicules**, séparé (celui fourni par l'utilisateur comme base de données du module) : ID `19mNkzcSMTwrl5Nx4QzApZDNTQLB2bntWl_76lRVzCYU` (`https://docs.google.com/spreadsheets/d/19mNkzcSMTwrl5Nx4QzApZDNTQLB2bntWl_76lRVzCYU/edit`), ouvert via `SpreadsheetApp.openById(SS_VEHICULES_ID)`. **Important** : cette session Claude n'a pas de connecteur Google Sheets — impossible de créer les onglets/en-têtes directement dans ce fichier depuis la conversation. La fonction `creerOngletsVehicules()` (voir étape 2) le fait à ta place, une fois collée et exécutée dans Apps Script.
- **Dossier Drive Véhicules**, séparé (celui fourni par l'utilisateur comme dossier parent des documents véhicules) : ID `1QuMgPpvDdO0HZE2cPRznU99rFTTQm7-r` (`https://drive.google.com/drive/folders/1QuMgPpvDdO0HZE2cPRznU99rFTTQm7-r`), un sous-dossier par véhicule (nommé d'après l'immatriculation). **Important** : Claude n'a pas non plus de connecteur Google Drive — impossible de parcourir ce dossier ou de lier les sous-dossiers depuis la conversation. À la place, `addVehicule()` retrouve (ou crée) automatiquement le bon sous-dossier via `DriveApp` quand tu ajoutes un véhicule ; `synchroniserDossiersDriveVehicules()` fait le même travail rétroactivement pour les véhicules déjà créés.
- **Charte graphique** : voir les CSS vars en haut de `index.html` (`--bg`, `--ink`, `--lime`, `--blue`, etc.) — rainbow bar (cyan→purple→green→lime), boutons lime, coins arrondis.
- **État actuel** : Budget + Tickets + Véhicules fonctionnels et testés localement (aperçu MOCK). QR code Tickets et ajustements de design encore à faire (reportés par l'utilisateur).

Deux fichiers seulement :
- `Code_ajouts_vehicules.gs` → fonctions serveur à coller dans ton `Code.gs`
- `index.html` → remplace entièrement ton fichier actuel : Budget, Tickets **et** Véhicules sont maintenant trois sections de la même page, affichées/masquées en JavaScript via la sidebar (aucun rechargement, aucun lien entre "pages")

---

## 1. Pourquoi un Sheet séparé pour Véhicules

Au départ ce module vivait dans le Sheet du Budget. Tu as ensuite fourni un Sheet dédié à utiliser comme base — le module a donc été basculé dessus, avec ses propres helpers (`getSheetVehicules`, `readSheetVehicules`, `appendRowVehicules`, `updateRowByIdVehicules`, `deleteRowByIdVehicules`), exactement sur le même principe que Tickets (qui a aussi son propre Sheet séparé).

---

## 2. Étape 1 — Créer les onglets dans le Sheet Véhicules dédié

**Cette étape est obligatoire et se fait UNE FOIS, depuis Apps Script** — lance la fonction `creerOngletsVehicules()` (voir étape 3 ci-dessous pour coller le code d'abord). Elle crée les deux onglets, les en-têtes et les garde-fous (listes déroulantes) automatiquement dans le Sheet dédié (`SS_VEHICULES_ID`, déjà renseigné avec ton lien).

Comment lancer une fonction depuis l'éditeur Apps Script : ouvre le projet (script.google.com), sélectionne `creerOngletsVehicules` dans le menu déroulant en haut de l'éditeur, clique sur ▶ Exécuter. La première fois, Google demande d'autoriser l'accès aux deux Sheets (celui du Hub + celui de Véhicules) : accepte.

Le reste de cette section décrit ce que la fonction crée, si tu préfères vérifier ou créer les onglets à la main.

### Onglet `vehicules`

Première ligne = ces en-têtes exactement (dans cet ordre) :

| Colonne | Contenu | Exemple |
|---|---|---|
| `id` | identifiant unique | `VEH-20260711-482` |
| `immatriculation` | plaque | `AB-123-CD` |
| `marque` | marque | `Renault` |
| `modele` | modèle | `Kangoo` |
| `type` | type de véhicule | `utilitaire` |
| `categorie` | Pool (partagé) ou Fonction (attribué nominativement) | `Fonction` |
| `statut` | état | `En service` |
| `ville` | ville où se trouve le véhicule | `Lyon` |
| `conducteur_nom` | conducteur attitré | `Julie Martin` |
| `conducteur_email` | email du conducteur | `julie.martin@tohmo.fr` |
| `proprietaire` | collaborateur à qui le véhicule est attribué (véhicules de fonction) | `Marc Petit` |
| `kilometrage` | kilométrage actuel (odomètre) | `48200` |
| `km_contrat` | kilométrage contractuel (forfait LLD) | `60000` |
| `duree_contrat_annees` | durée du contrat, en années | `4` |
| `loyer_mensuel` | loyer mensuel du contrat (€) | `320` |
| `date_fin_contrat` | date de fin de contrat | `01/06/2028` |
| `date_ct` | échéance contrôle technique | `12/09/2026` |
| `date_assurance` | échéance assurance | `01/01/2027` |
| `date_entretien` | prochain entretien prévu | `15/08/2026` |
| `lien_drive` | URL du dossier Drive dédié au véhicule | `https://drive.google.com/drive/folders/...` |
| `notes` | remarques libres | |
| `cree_le` | horodatage création | `11/07/2026 09:12` |
| `cree_par` | email de création | |
| `maj_le` | dernière modification | |

**Garde-fous (listes fermées) posés automatiquement par `creerOngletsVehicules()` :**
- `type` → liste : `citadine, berline, utilitaire, suv, autre`
- `categorie` → liste : `Pool, Fonction`
- `statut` → liste : `En service, En maintenance, Hors service`
- `ville` → liste : voir `VILLES_VEHICULES` dans le code (à adapter à vos vraies villes Tohmo)

**Pool vs Fonction** : un véhicule Pool est partagé entre plusieurs collaborateurs (pas de `proprietaire`) ; un véhicule de Fonction est attribué nominativement, `proprietaire` porte alors le nom du collaborateur attributaire. `conducteur_nom`/`conducteur_email` restent utiles dans les deux cas (qui conduit actuellement), `proprietaire` répond à une question différente (à qui appartient l'usage du véhicule).

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
   - `SS_VEHICULES_ID` → déjà rempli avec l'ID de ton Sheet Véhicules.
   - `DOSSIER_VEHICULES_ID` → déjà rempli avec l'ID de ton dossier Drive Véhicules.
   - `VILLES_VEHICULES` → remplace par la vraie liste de vos villes Tohmo.
3. Sauvegarde, puis lance `creerOngletsVehicules()` une fois (voir étape 2 ci-dessus) pour créer les onglets dans le Sheet dédié.
4. Si tu avais déjà des véhicules créés avant cette mise à jour, lance aussi une fois `synchroniserDossiersDriveVehicules()` pour leur associer rétroactivement leur dossier Drive (créé au passage s'il n'existe pas encore).
5. Aucun changement à `doGet()` — Véhicules n'a pas de page publique.

---

## 4. Étape 3 — Fichier HTML

1. **Remplace entièrement** le contenu de `index.html` par la nouvelle version (Budget + Tickets + Véhicules fusionnés).
2. Garde `formulaire_ticket` tel quel si tu as déjà le module Tickets — Véhicules n'y touche pas.

---

## 5. Étape 4 — Déployer

`Déployer` → `Gérer les déploiements` → icône crayon ✏️ → `Nouvelle version` → `Déployer`.

---

## 6. Ce que permet le module (interface)

- **Tableau filtrable** : par catégorie (Pool / Fonction), statut, type, ville, plus une recherche libre (immatriculation, conducteur, ville, propriétaire).
- **Colonnes affichées** : immatriculation, véhicule (marque/modèle/type), catégorie (badge Pool/Fonction), ville, conducteur, propriétaire, kilométrage actuel, loyer mensuel, date de fin de contrat, échéance la plus proche (CT/assurance/entretien/fin de contrat, avec code couleur), statut, et un lien direct vers le **dossier Drive dédié** du véhicule (ouvre un nouvel onglet, ne déclenche pas la fiche détail).
- **Fiche détail (clic sur une ligne)** : tous les champs sont éditables (catégorie, statut, ville, conducteur, propriétaire, kilométrage, kilométrage contractuel, durée du contrat, loyer, dates d'échéance, lien Drive) avec un bouton **Enregistrer les modifications**, plus un bouton **Supprimer le véhicule** (retrait définitif du parc, avec confirmation), la timeline complète, et l'ajout de commentaires.
- **+ Nouveau véhicule** : formulaire de création avec les mêmes champs. Le lien Drive est **facultatif** : si tu ne le renseignes pas, le sous-dossier correspondant à l'immatriculation est retrouvé (ou créé s'il n'existe pas) automatiquement dans `DOSSIER_VEHICULES_ID`.

## 7. Ce que fait chaque fonction serveur (résumé)

| Fonction | Rôle |
|---|---|
| `creerOngletsVehicules()` | installation : crée les onglets + garde-fous dans le Sheet dédié (à lancer une fois) |
| `synchroniserDossiersDriveVehicules()` | rattrapage : relie chaque véhicule sans lien Drive à son sous-dossier (créé si besoin) (à lancer une fois si besoin) |
| `getVehicules()` | liste tous les véhicules, avec alerte d'échéance calculée |
| `getVehicule(id)` | un véhicule + sa timeline |
| `getStatsVehicules()` | chiffres du bandeau stats (dont le loyer total mensuel du parc) |
| `addVehicule(data)` | ajouter un véhicule au parc (lie/crée son dossier Drive si non fourni) |
| `majStatutVehicule(id, statut, commentaire)` | changer le statut |
| `majVehicule(id, updates)` | modifier n'importe quel champ (kilométrage, loyer, dates, conducteur, lien Drive, etc.) |
| `addCommentaireVehicule(id, texte)` | ajouter une note dans la timeline |
| `supprimerVehicule(id)` | sortie de parc définitive |
| `obtenirOuCreerDossierDriveVehicule(immatriculation)` | retrouve ou crée le sous-dossier Drive d'un véhicule, retourne son URL |

Toutes ces fonctions vivent dans `Code.gs` et sont appelées via `google.script.run` depuis `index.html` (section Véhicules).

---

## 8. Détails techniques pour la suite

- **Alertes d'échéance** : `calculerAlerteVehicule` compare `date_ct`, `date_assurance`, `date_entretien` et `date_fin_contrat` à aujourd'hui. Moins de 30 jours (ou déjà passé) → badge d'alerte sur la ligne et dans les stats. Seuil réglable via `VEHICULE_SEUIL_ALERTE_JOURS`.
- **Namespacing JS** : tout le code du module Véhicules dans `index.html` est isolé sous l'objet `Vehicules.*` (ex. `Vehicules.render()`, `Vehicules.ouvrirDrawer()`), comme `Tickets.*` et `Budget` (`load()`, `renderAll()`).
- **CSS namespacing** : toutes les classes propres à Véhicules sont préfixées `v-` (`.v-table`, `.v-drawer`, `.v-btn`...), même logique que le préfixe `t-` pour Tickets.
- **Prévisualisation locale** : `index.html` détecte s'il tourne dans Apps Script ou non ; hors Apps Script il bascule sur des données factices (MOCK) pour prévisualiser le rendu visuel.
