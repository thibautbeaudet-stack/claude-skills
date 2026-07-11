/**
 * MODULE TICKETS — code à ajouter dans le Code.gs du projet Apps Script "HUB"
 *
 * COMMENT L'INSTALLER :
 * 1. Ouvre le projet Apps Script "HUB" (script.google.com, ou depuis le Sheet : Extensions > Apps Script)
 * 2. Ouvre ton fichier Code.gs existant
 * 3. Colle TOUT le contenu de ce fichier À LA SUITE de ton code existant (à la fin du fichier)
 * 4. Modifie ensuite ta fonction doGet() existante — voir les instructions dans README.md
 * 5. Renseigne SITES_TICKETS et DOSSIER_PHOTOS_TICKETS ci-dessous avec tes vraies valeurs
 * 6. N'oublie pas : Déployer > Gérer les déploiements > Nouvelle version (sinon rien ne change en prod)
 *
 * Ce fichier réutilise tel quel les helpers déjà présents dans ton Code.gs :
 * getSheet, readSheet, appendRow, updateRowById, deleteRowById, cellVal, uid, nowStr, today, who
 * Il ne les redéfinit pas — ne les copie pas deux fois.
 */

// ============================================================
// CONFIGURATION — à adapter à Tohmo avant de déployer
// ============================================================

// Liste des sites Tohmo proposés dans les formulaires (badge, etc.)
// -> Remplace par la vraie liste de vos sites/bureaux
var SITES_TICKETS = ['Paris', 'Lyon', 'Marseille', 'Bordeaux'];

// ID du dossier Google Drive où seront rangées les photos de panne/casse envoyées
// depuis le formulaire public. Même principe que DOSSIER_FACTURES déjà utilisé.
// Comment récupérer l'ID : ouvre le dossier Drive dans ton navigateur, l'ID est
// la suite de lettres/chiffres dans l'URL après "folders/".
var DOSSIER_PHOTOS_TICKETS = 'COLLEZ_ICI_ID_DU_DOSSIER_DRIVE_PHOTOS';

// Valeurs fermées (doivent correspondre EXACTEMENT aux validations de données du Sheet)
var TICKET_TYPES     = ['badge', 'courrier', 'panne_casse', 'casier', 'proprete', 'autre'];
var TICKET_STATUTS   = ['Nouveau', 'En cours', 'Résolu', 'Fermé'];
var TICKET_PRIORITES = ['Basse', 'Normale', 'Haute', 'Urgente'];

// ============================================================
// LECTURE
// ============================================================

/**
 * Retourne tous les tickets, triés du plus récent au plus ancien.
 * Le champ "donnees_specifiques" (JSON stocké en texte dans le Sheet)
 * est automatiquement parsé dans un champ .donnees pour être utilisé facilement côté écran.
 */
function getTickets() {
  var rows = readSheet('tickets');
  rows.forEach(function (t) {
    try { t.donnees = t.donnees_specifiques ? JSON.parse(t.donnees_specifiques) : {}; }
    catch (e) { t.donnees = {}; }
  });
  rows.sort(function (a, b) { return String(b.cree_le).localeCompare(String(a.cree_le)); });
  return rows;
}

/** Retourne un ticket précis + son historique (timeline), pour la fiche détail. */
function getTicket(id) {
  var t = getTickets().filter(function (r) { return String(r.id) === String(id); })[0];
  if (!t) throw new Error('Ticket introuvable : ' + id);
  t.historique = getHistoriqueTicket(id);
  return t;
}

/** Timeline d'un ticket : création, changements de statut, commentaires — triés du plus ancien au plus récent. */
function getHistoriqueTicket(id) {
  var rows = readSheet('tickets_historique').filter(function (r) { return String(r.ticket_id) === String(id); });
  rows.sort(function (a, b) { return String(a.cree_le).localeCompare(String(b.cree_le)); });
  return rows;
}

/** Chiffres pour le bandeau de stats du module (tickets ouverts, temps moyen de résolution, répartition par type). */
function getStatsTickets() {
  var rows = getTickets();
  var ouverts = rows.filter(function (t) { return t.statut === 'Nouveau' || t.statut === 'En cours'; });
  var resolus = rows.filter(function (t) { return !!t.date_resolution; });

  var totalJours = 0, nbCalcul = 0;
  resolus.forEach(function (t) {
    var d1 = parseDateFrTickets(t.cree_le), d2 = parseDateFrTickets(t.date_resolution);
    if (d1 && d2) { totalJours += (d2 - d1) / 86400000; nbCalcul++; }
  });

  var parType = {};
  TICKET_TYPES.forEach(function (ty) {
    parType[ty] = rows.filter(function (t) { return t.type === ty; }).length;
  });

  return {
    total: rows.length,
    ouverts: ouverts.length,
    resolus: resolus.length,
    tempsMoyenJours: nbCalcul ? Math.round((totalJours / nbCalcul) * 10) / 10 : null,
    parType: parType
  };
}

/** Convertit une date au format "dd/MM/yyyy HH:mm" (celui que renvoie cellVal/nowStr) en objet Date JS. */
function parseDateFrTickets(s) {
  if (!s) return null;
  var m = String(s).match(/(\d{2})\/(\d{2})\/(\d{4})(?:\s+(\d{2}):(\d{2}))?/);
  if (!m) return null;
  return new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]), Number(m[4] || 0), Number(m[5] || 0));
}

// ============================================================
// ÉCRITURE — création
// ============================================================

/**
 * Création d'un ticket DEPUIS LE HUB (toi, en tant qu'office manager, connectée avec ton compte Google).
 * data = { type, priorite, objet, description, demandeur_nom, demandeur_email, site, localisation, donnees }
 */
function addTicket(data) {
  var id = uid('TIK');
  appendRow('tickets', {
    id: id,
    type: data.type,
    statut: 'Nouveau',
    priorite: data.priorite || 'Normale',
    objet: data.objet || '',
    description: data.description || '',
    demandeur_nom: data.demandeur_nom || '',
    demandeur_email: data.demandeur_email || '',
    site: data.site || '',
    localisation: data.localisation || '',
    donnees_specifiques: JSON.stringify(data.donnees || {}),
    commentaire_om: '',
    date_resolution: '',
    source: 'hub',
    statut_validation: 'valide',
    cree_le: nowStr(),
    cree_par: who(),
    maj_le: nowStr()
  });
  ajouterEvenementTicket(id, 'creation', 'Ticket créé depuis le hub', who());
  return id;
}

/**
 * Création d'un ticket DEPUIS LE FORMULAIRE PUBLIC (aucun compte Google requis, accès via QR code).
 * Mêmes champs que addTicket, mais source='qr' et statut_validation='a_valider' (à valider par toi dans le hub).
 */
function addTicketPublic(data) {
  var id = uid('TIK');
  appendRow('tickets', {
    id: id,
    type: data.type,
    statut: 'Nouveau',
    priorite: data.priorite || 'Normale',
    objet: data.objet || '',
    description: data.description || '',
    demandeur_nom: data.demandeur_nom || '',
    demandeur_email: data.demandeur_email || '',
    site: data.site || '',
    localisation: data.localisation || '',
    donnees_specifiques: JSON.stringify(data.donnees || {}),
    commentaire_om: '',
    date_resolution: '',
    source: 'qr',
    statut_validation: 'a_valider',
    cree_le: nowStr(),
    cree_par: data.demandeur_email || 'formulaire_public',
    maj_le: nowStr()
  });
  ajouterEvenementTicket(id, 'creation', 'Demande soumise via le formulaire public', data.demandeur_nom || 'Anonyme');
  return id;
}

// ============================================================
// ÉCRITURE — mise à jour (hub uniquement)
// ============================================================

/** Change le statut d'un ticket. Si Résolu/Fermé, horodate automatiquement date_resolution. */
function majStatutTicket(id, statut, commentaire) {
  if (TICKET_STATUTS.indexOf(statut) === -1) throw new Error('Statut inconnu : ' + statut);
  var updates = { statut: statut, maj_le: nowStr() };
  if (statut === 'Résolu' || statut === 'Fermé') updates.date_resolution = nowStr();
  updateRowById('tickets', id, updates);
  ajouterEvenementTicket(id, 'changement_statut', 'Statut changé en « ' + statut + ' »' + (commentaire ? ' — ' + commentaire : ''), who());
  return true;
}

/** Mise à jour libre d'un ticket (priorité, site, etc.) : updates = objet {colonne: valeur}. */
function majTicket(id, updates) {
  updates.maj_le = nowStr();
  updateRowById('tickets', id, updates);
  return true;
}

/** Ajoute un commentaire de l'office manager dans la timeline du ticket. */
function addCommentaire(id, texte) {
  if (!texte || !texte.trim()) throw new Error('Commentaire vide');
  updateRowById('tickets', id, { maj_le: nowStr() });
  ajouterEvenementTicket(id, 'commentaire', texte.trim(), who());
  return true;
}

/** Suppression d'un ticket (rare — corrections d'erreur de saisie). */
function supprimerTicket(id) {
  return deleteRowById('tickets', id);
}

/** Ajoute une ligne dans l'onglet tickets_historique (utilisé par toutes les fonctions ci-dessus). */
function ajouterEvenementTicket(ticketId, type, contenu, auteur) {
  appendRow('tickets_historique', {
    id: uid('EVT'),
    ticket_id: ticketId,
    type_evenement: type,
    contenu: contenu,
    auteur: auteur || '',
    cree_le: nowStr()
  });
}

// ============================================================
// PHOTO (panne / casse) — appelé depuis le formulaire public
// ============================================================

/**
 * Enregistre une photo envoyée depuis le formulaire public dans le Drive et retourne son URL.
 * base64Data : contenu du fichier encodé en base64 (sans le préfixe "data:image/...;base64,")
 * Utilisée pour remplir donnees.photo_url avant l'appel à addTicketPublic.
 */
function uploadPhotoTicket(base64Data, nomFichier, mimeType) {
  var dossier = DriveApp.getFolderById(DOSSIER_PHOTOS_TICKETS);
  var blob = Utilities.newBlob(Utilities.base64Decode(base64Data), mimeType, nomFichier);
  var fichier = dossier.createFile(blob);
  fichier.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  return fichier.getUrl();
}

// ============================================================
// LISTES (envoyées au formulaire public / au hub pour remplir les <select>)
// ============================================================

function getListesTickets() {
  return {
    sites: SITES_TICKETS,
    types: TICKET_TYPES,
    statuts: TICKET_STATUTS,
    priorites: TICKET_PRIORITES
  };
}
