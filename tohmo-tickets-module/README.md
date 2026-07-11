# Module Tickets — Tohmo Office Hub

Ce dossier contient tout ce qu'il faut pour ajouter le module **Tickets** à ton projet Apps Script "HUB" existant, dans le même programme que le module Budget & Achats déjà en prod.

Deux fichiers seulement :
- `Code_ajouts_tickets.gs` → fonctions serveur à coller dans ton `Code.gs`
- `index.html` → remplace entièrement ton fichier actuel : Budget **et** Tickets sont maintenant deux sections de la même page, affichées/masquées en JavaScript via la sidebar (aucun rechargement, aucun lien entre "pages")
- `formulaire_ticket.html` → le formulaire public (les collaborateurs, sans compte Google, via QR code) — reste un fichier séparé exprès, car il doit s'ouvrir sans passer par le Hub

---

## 1. Pourquoi ce choix d'architecture (et ce qui a changé)

Première version : Tickets était un fichier HTML séparé, ouvert via un lien `?page=tickets`. Ça semblait plus simple, mais Apps Script sert chaque page depuis une adresse technique cachée (un domaine `googleusercontent.com`), et les liens internes (`<a href="?page=tickets">`) se sont résolus contre cette adresse cachée au lieu de la vraie URL — d'où les pages blanches qu'on a rencontrées, de façon peu fiable.

**La solution robuste : un seul programme, une seule page.** Budget et Tickets sont maintenant deux sections (`<section>`) dans le même `index.html`. La sidebar ne contient plus de liens (`<a href>`) mais des boutons JavaScript qui affichent une section et masquent l'autre — exactement comme fonctionnent déjà tes onglets internes du Budget (Budget / Mensuel / Cartes / Factures...). Aucune navigation entre "pages" côté Apps Script, donc plus aucun risque de ce bug.

Le formulaire public (`formulaire_ticket.html`) reste un fichier séparé car il doit être ouvrable directement par un lien/QR code, sans passer par le Hub — ça reste géré par `doGet(e)` avec `?page=ticket`.

---

## 2. Étape 1 — Créer les onglets dans le Google Sheet

Dans le Sheet **Tickets séparé** que tu as créé (`Tohmo Hub - Tickets`), crée deux onglets.

### Onglet `tickets`

Première ligne = ces en-têtes exactement (copie-colle la ligne) :

| Colonne | Contenu | Exemple |
|---|---|---|
| `id` | identifiant unique | `TIK-20260711-482` |
| `type` | type de demande | `badge` |
| `statut` | avancement | `Nouveau` |
| `priorite` | urgence | `Normale` |
| `objet` | titre court | `Demande de badge — Julie Martin` |
| `description` | texte libre | `Nouvelle arrivée, besoin d'un badge.` |
| `demandeur_nom` | nom du demandeur | `Julie Martin` |
| `demandeur_email` | email du demandeur | `julie.martin@tohmo.fr` |
| `site` | site concerné | `Lyon` |
| `localisation` | précision lieu (panne/propreté) | `Salle Zeplug, 3e étage` |
| `donnees_specifiques` | champs propres au type, en JSON | `{"motif":"Nouvelle arrivée"}` |
| `commentaire_om` | (réservé, non utilisé — voir onglet historique) | |
| `date_resolution` | horodatage auto quand Résolu/Fermé | `12/07/2026 10:00` |
| `source` | qui a créé le ticket | `qr` / `hub` / `make` |
| `statut_validation` | validation humaine | `valide` / `a_valider` |
| `cree_le` | horodatage création | `11/07/2026 09:12` |
| `cree_par` | email ou "formulaire_public" | |
| `maj_le` | dernière modification | |

**Garde-fous (listes fermées) à poser avec Données > Validation des données sur toute la colonne :**
- `type` → liste : `badge, courrier, panne_casse, casier, proprete, autre`
- `statut` → liste : `Nouveau, En cours, Résolu, Fermé`
- `priorite` → liste : `Basse, Normale, Haute, Urgente`
- `source` → liste : `qr, hub, make`
- `statut_validation` → liste : `valide, a_valider`

### Onglet `tickets_historique`

C'est la "timeline" de chaque ticket (création, changements de statut, commentaires). Une ligne = un évènement.

| Colonne | Contenu | Exemple |
|---|---|---|
| `id` | identifiant unique | `EVT-20260711-118` |
| `ticket_id` | référence au ticket | `TIK-20260711-482` |
| `type_evenement` | nature de l'évènement | `creation` / `changement_statut` / `commentaire` |
| `contenu` | texte de l'évènement | `Statut changé en « En cours »` |
| `auteur` | qui a fait l'action | `office@tohmo.fr` |
| `cree_le` | horodatage | `11/07/2026 09:12` |

Pas besoin de remplir ces onglets à la main : le code s'en charge (`appendRowTickets`).

---

## 3. Étape 2 — Code serveur (`Code.gs`)

1. Colle tout le contenu de `Code_ajouts_tickets.gs` à la fin de ton `Code.gs`.
2. Personnalise en haut du bloc :
   - `SS_TICKETS_ID` → déjà rempli avec l'ID de ton Sheet Tickets.
   - `SITES_TICKETS` → remplace par la vraie liste de vos sites Tohmo.
   - `DOSSIER_PHOTOS_TICKETS` → ID du dossier Drive pour les photos de panne/casse (optionnel, seulement si le formulaire de panne/casse est utilisé avec photo).
3. Simplifie ta fonction `doGet()` : elle n'a plus besoin de gérer qu'**une seule page en plus** (le formulaire public) :

```javascript
function doGet(e) {
  var page = (e && e.parameter && e.parameter.page) || '';
  if (page === 'ticket') {
    return HtmlService.createHtmlOutputFromFile('formulaire_ticket').setTitle('Nouvelle demande — Tohmo');
  }
  return HtmlService.createHtmlOutputFromFile('index').setTitle('Tohmo — Budget & achats').addMetaTag('viewport','width=device-width, initial-scale=1');
}
```

---

## 4. Étape 3 — Fichiers HTML

1. **Remplace entièrement** le contenu de `index.html` par la nouvelle version (Budget + Tickets fusionnés).
2. Si tu as un fichier `tickets` (ou `ticket`) créé lors de la première tentative, **supprime-le** du projet Apps Script (clic droit sur le fichier → Supprimer) — il n'est plus utilisé et sert seulement à créer de la confusion.
3. Garde `formulaire_ticket` tel quel (juste les icônes ont changé, plus d'emoji).

---

## 5. Étape 4 — Déployer

`Déployer` → `Gérer les déploiements` → icône crayon ✏️ → `Nouvelle version` → `Déployer`.

---

## 6. Étape 5 — Récupérer le lien du QR code

Une fois déployé, ton URL de base est du type `https://script.google.com/a/macros/zeplug.com/s/XXXXX/exec`.

- **Le Hub complet (Budget + Tickets)** : cette URL telle quelle. Tickets est accessible via l'icône dans la sidebar, sans rechargement.
- **Lien public (QR code)** : la même URL + `?page=ticket` — accessible sans compte, c'est celui à transformer en QR code à imprimer/afficher dans les bureaux.

---

## 7. Vérifier que l'accès public fonctionne bien

Le formulaire public doit être accessible **sans connexion Google**. Vérifie dans `Déployer > Gérer les déploiements` que "Qui a accès" correspond à ce que tu veux (Tout le monde vs Tout le monde dans l'organisation) — voir la discussion complète dans l'historique de conversation si besoin de rappel sur ce point.

---

## 8. Ce que fait chaque fonction serveur (résumé)

| Fonction | Rôle |
|---|---|
| `getTickets()` | liste tous les tickets |
| `getTicket(id)` | un ticket + sa timeline |
| `getStatsTickets()` | chiffres du bandeau stats |
| `addTicket(data)` | créer un ticket depuis le hub |
| `addTicketPublic(data)` | créer un ticket depuis le QR |
| `majStatutTicket(id, statut, commentaire)` | changer le statut |
| `majTicket(id, updates)` | modifier priorité/site/etc. |
| `addCommentaire(id, texte)` | ajouter une réponse/note |
| `uploadPhotoTicket(base64, nom, mime)` | stocker une photo panne/casse dans Drive |

Toutes ces fonctions vivent dans `Code.gs` et sont appelées via `google.script.run` depuis `index.html` (section Tickets) ou `formulaire_ticket.html`.

---

## 9. Détails techniques pour la suite

- **Namespacing JS** : tout le code du module Tickets dans `index.html` est isolé sous l'objet `Tickets.*` (ex. `Tickets.render()`, `Tickets.ouvrirDrawer()`) pour ne jamais entrer en conflit avec les fonctions du Budget qui restent inchangées (`load()`, `renderAll()`, etc.).
- **CSS namespacing** : toutes les classes propres à Tickets sont préfixées `t-` (`.t-table`, `.t-drawer`, `.t-btn`...) pour ne jamais écraser le style du Budget.
- **Icônes** : tous les émojis ont été remplacés par des icônes SVG monochromes (trait fin, cohérentes avec la charte). Les modules non construits sont grisés dans la sidebar avec l'infobulle "bientôt disponible".
- **Prévisualisation locale** : `index.html` et `formulaire_ticket.html` détectent s'ils tournent dans Apps Script ou non ; hors Apps Script ils basculent sur des données factices (MOCK) pour prévisualiser le rendu visuel.
