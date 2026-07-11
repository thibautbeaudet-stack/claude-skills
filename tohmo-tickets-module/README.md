# Module Tickets — Tohmo Office Hub

Ce dossier contient tout ce qu'il faut pour ajouter le module **Tickets** à ton projet Apps Script "HUB" existant, à côté du module Budget & Achats déjà en prod.

Trois fichiers :
- `Code_ajouts_tickets.gs` → fonctions serveur à coller dans ton `Code.gs`
- `tickets.html` → l'écran interne de gestion des tickets (toi, connectée avec ton compte Google)
- `formulaire_ticket.html` → le formulaire public (les collaborateurs, sans compte Google, via QR code)

Aucun de ces fichiers ne touche à ton module Budget existant.

---

## 1. Comment ça s'articule avec le Hub existant (et pourquoi)

Ton `doGet()` actuel ne sait servir qu'**une seule page** : `index.html` (le Budget). Il faut lui apprendre à servir 2 pages en plus, selon un paramètre dans l'URL :

- `...exec?page=tickets` → l'écran interne de gestion (nécessite d'être connectée, comme le Budget)
- `...exec?page=ticket` → le formulaire public (accessible à tout le monde, même sans compte Google — c'est celui du QR code)

**Pourquoi des fichiers séparés plutôt que tout fusionner dans `index.html` ?** J'ai hésité entre les deux options. Fusionner donnerait une appli "une seule page" plus fluide (pas de rechargement en changeant d'onglet), mais ça veut dire modifier en profondeur ton `index.html` qui fonctionne déjà en prod — gros risque de casser le Budget pour un gain surtout esthétique. En gardant Tickets dans ses propres fichiers, la seule modification sur ton code existant est **une fonction `doGet()` à remplacer** (3 lignes ajoutées) et **un lien à ajouter** dans ton menu. Le module Budget n'est pas touché. C'est le choix le plus sûr pour toi vu que tu ne codes pas — en cas de souci, il suffit de revenir à l'ancien `doGet()`.

---

## 2. Étape 1 — Créer les onglets dans le Google Sheet

Dans "Suivi Tohmo Hub", crée deux nouveaux onglets.

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

Pas besoin de remplir ces onglets à la main : le code s'en charge (`appendRow`, comme pour le Budget).

---

## 3. Étape 2 — Ajouter le code serveur

1. Apps Script > `Code.gs` > colle tout le contenu de `Code_ajouts_tickets.gs` **à la fin** du fichier.
2. Tout en haut de ce bloc collé, personnalise :
   - `SITES_TICKETS` → remplace par la vraie liste de vos sites Tohmo.
   - `DOSSIER_PHOTOS_TICKETS` → l'ID d'un dossier Drive où seront rangées les photos de panne/casse envoyées depuis le formulaire public (même principe que `DOSSIER_FACTURES` que tu as déjà). Pour trouver l'ID : ouvre le dossier dans Drive, l'ID est le morceau de texte dans l'URL après `folders/`.

   ⚠️ La liste des sites est actuellement recopiée à deux endroits : `SITES_TICKETS` dans `Code_ajouts_tickets.gs` (utilisé nulle part pour l'instant, gardé en réserve) et le tableau `sites` dans `formulaire_ticket.html` (fonction `champsPourType`, cherche `var sites = [...]`). Si tu changes la liste des sites, modifie-la aux deux endroits pour rester cohérent.
3. Repère ta fonction `doGet()` existante :

```javascript
function doGet() { return HtmlService.createHtmlOutputFromFile('index').setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL); }
```

Remplace-la par :

```javascript
function doGet(e) {
  var page = (e && e.parameter && e.parameter.page) || '';
  if (page === 'ticket') {
    return HtmlService.createHtmlOutputFromFile('formulaire_ticket')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
      .setTitle('Nouvelle demande — Tohmo');
  }
  if (page === 'tickets') {
    return HtmlService.createHtmlOutputFromFile('tickets')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
      .setTitle('Tickets — Tohmo Hub');
  }
  return HtmlService.createHtmlOutputFromFile('index').setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}
```

C'est la seule modification sur du code existant. Tout le reste (Budget) continue de fonctionner exactement pareil.

---

## 4. Étape 3 — Ajouter les fichiers HTML

Dans Apps Script, clique sur le **+** à côté de "Fichiers" > **HTML** :
1. Crée un fichier nommé exactement `tickets` → colle le contenu de `tickets.html`
2. Crée un fichier nommé exactement `formulaire_ticket` → colle le contenu de `formulaire_ticket.html`

(Apps Script ajoute l'extension `.html` tout seul, ne la tape pas dans le nom.)

---

## 5. Étape 4 — Ajouter un accès depuis le Hub (Budget)

Dans ton `index.html` existant, ajoute un lien vers le module Tickets, par exemple dans ta barre de navigation :

```html
<a href="?page=tickets">🎫 Tickets</a>
```

Comme l'app est servie sur une URL du type `.../exec`, ce lien pointera automatiquement vers `.../exec?page=tickets`. Mets-le où tu veux dans ton menu actuel — il n'y a rien d'autre à changer.

---

## 6. Étape 5 — Déployer

**Rappel du piège n°1** : Apps Script sert une version figée. Après avoir collé tout ce code :

`Déployer` → `Gérer les déploiements` → icône crayon sur ton déploiement actif → `Nouvelle version` → `Déployer`

Tant que tu ne fais pas ça, tes utilisateurs continuent de voir l'ancienne version, même si le code a changé.

---

## 7. Étape 6 — Récupérer les deux liens utiles

Une fois déployé, ton URL de base ressemble à `https://script.google.com/macros/s/XXXXX/exec`.

- **Lien interne (toi)** : `https://script.google.com/macros/s/XXXXX/exec?page=tickets` — nécessite d'être connectée avec un compte de l'organisation.
- **Lien public (QR code)** : `https://script.google.com/macros/s/XXXXX/exec?page=ticket` — accessible sans compte, c'est celui à transformer en QR code à imprimer/afficher dans les bureaux.

Pour le QR code : n'importe quel générateur de QR code fonctionne avec ce lien. Si tu veux, donne-moi l'URL une fois déployée et je peux t'en générer un directement (j'ai un outil pour ça).

---

## 8. Vérifier que l'accès public fonctionne bien

Le formulaire public doit être accessible **sans connexion Google**. Vérifie dans `Déployer > Gérer les déploiements` que :
- "Exécuter en tant que" = **Moi** (ton compte, celui qui a créé le script)
- "Qui a accès" = **Tout le monde** (pas "Tout le monde dans l'organisation" — sinon le QR code demandera un compte Tohmo, ce qui exclut les visiteurs/prestataires si besoin ; si tu veux limiter aux collaborateurs Tohmo, choisis plutôt "Tout le monde dans l'organisation" pour ce déploiement, mais alors le formulaire demandera une connexion Google)

Si tu veux que le formulaire QR reste réservé aux collaborateurs Tohmo (compte Google Workspace), tu peux garder "Tout le monde dans l'organisation" comme pour le Budget — dans ce cas `cree_par` sera rempli automatiquement avec l'email du collaborateur connecté plutôt que "formulaire_public".

---

## 9. Ce que fait chaque fonction serveur (résumé)

| Fonction | Rôle | Appelée depuis |
|---|---|---|
| `getTickets()` | liste tous les tickets | `tickets.html` |
| `getTicket(id)` | un ticket + sa timeline | `tickets.html` |
| `getStatsTickets()` | chiffres du bandeau stats | `tickets.html` |
| `addTicket(data)` | créer un ticket depuis le hub | `tickets.html` |
| `addTicketPublic(data)` | créer un ticket depuis le QR | `formulaire_ticket.html` |
| `majStatutTicket(id, statut, commentaire)` | changer le statut | `tickets.html` |
| `majTicket(id, updates)` | modifier priorité/site/etc. | `tickets.html` |
| `addCommentaire(id, texte)` | ajouter une réponse/note | `tickets.html` |
| `uploadPhotoTicket(base64, nom, mime)` | stocker une photo panne/casse dans Drive | `formulaire_ticket.html` |
| `getListesTickets()` | listes fermées (sites, types...) — fournie en utilitaire, pas encore appelée | — |

Tous réutilisent tes helpers existants (`readSheet`, `appendRow`, `updateRowById`, `uid`, `nowStr`, `who`, `cellVal`) — rien n'est redéfini en double.

---

## 10. Prévisualiser sans Apps Script

Les deux fichiers HTML détectent automatiquement s'ils tournent dans Apps Script (`google.script.run` disponible) ou pas. Si tu ouvres `tickets.html` ou `formulaire_ticket.html` directement dans un navigateur (double-clic sur le fichier), ils basculent sur des données factices (MOCK) pour que tu puisses voir le rendu visuel avant de tout coller dans Apps Script.
