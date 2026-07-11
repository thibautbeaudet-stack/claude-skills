/**
 * MODULE VÉHICULES — code à ajouter dans le Code.gs du projet Apps Script "HUB"
 *
 * COMMENT L'INSTALLER :
 * 1. Ouvre le projet Apps Script "HUB" (script.google.com, ou depuis le Sheet : Extensions > Apps Script)
 * 2. Ouvre ton fichier Code.gs existant
 * 3. Colle TOUT le contenu de ce fichier À LA SUITE de ton code existant (à la fin du fichier)
 * 4. Renseigne VILLES_VEHICULES ci-dessous avec ta vraie liste de villes Tohmo
 * 5. Sauvegarde, puis lance UNE FOIS la fonction creerOngletsVehicules() (voir plus bas)
 * 6. N'oublie pas : Déployer > Gérer les déploiements > Nouvelle version (sinon rien ne change en prod)
 *
 * Les données vivent dans un Sheet DÉDIÉ et SÉPARÉ (celui que tu as partagé) — même logique que
 * Tickets, pas le Sheet principal du Budget. Ce fichier définit donc ses propres helpers
 * (getSheetVehicules, readSheetVehicules, appendRowVehicules, updateRowByIdVehicules,
 * deleteRowByIdVehicules) qui pointent vers SS_VEHICULES_ID, en plus de réutiliser uid/nowStr/who
 * déjà présents dans ton Code.gs (il ne faut pas les redéfinir).
 */

// ============================================================
// CONFIGURATION — à adapter à Tohmo avant de déployer
// ============================================================

// ID du Sheet dédié Véhicules (celui partagé : https://docs.google.com/spreadsheets/d/19mNkzcSMTwrl5Nx4QzApZDNTQLB2bntWl_76lRVzCYU/edit)
var SS_VEHICULES_ID = '19mNkzcSMTwrl5Nx4QzApZDNTQLB2bntWl_76lRVzCYU';

// Liste des villes Tohmo (mêmes valeurs que pour Tickets si le module est déjà installé)
var VILLES_VEHICULES = ['Paris', 'Lyon', 'Marseille', 'Bordeaux'];

// Valeurs fermées (doivent correspondre EXACTEMENT aux validations de données du Sheet)
var VEHICULE_TYPES   = ['citadine', 'berline', 'utilitaire', 'suv', 'autre'];
var VEHICULE_STATUTS = ['En service', 'En maintenance', 'Hors service'];

// Nombre de jours avant échéance (CT, assurance, entretien, fin de contrat) à partir duquel on affiche une alerte "à renouveler"
var VEHICULE_SEUIL_ALERTE_JOURS = 30;

// ============================================================
// HELPERS DÉDIÉS AU SHEET VÉHICULES (équivalents de getSheet/readSheet/appendRow/updateRowById
// mais pointant vers l'autre fichier — même logique que Tickets)
// ============================================================

function getSSVehicules() { return SpreadsheetApp.openById(SS_VEHICULES_ID); }

function getSheetVehicules(name) {
  var sheets = getSSVehicules().getSheets();
  var n = name.trim().toLowerCase();
  for (var i = 0; i < sheets.length; i++) {
    if (sheets[i].getName().trim().toLowerCase() === n) return sheets[i];
  }
  throw new Error('Onglet "' + name + '" introuvable dans le Sheet Véhicules. Onglets existants : ' + sheets.map(function(s){return s.getName();}).join(', '));
}

function readSheetVehicules(name) {
  var sh = getSheetVehicules(name), data = sh.getDataRange().getValues();
  if (data.length < 2) return [];
  var hdr = data[0].map(function(h){return String(h).trim().toLowerCase().replace(/\s+/g,'_');});
  var rows = [];
  for (var r = 1; r < data.length; r++) {
    var obj = {};
    for (var c = 0; c < hdr.length; c++) obj[hdr[c]] = cellVal(data[r][c]);
    rows.push(obj);
  }
  return rows;
}

function appendRowVehicules(sheetName, obj) {
  var sh = getSheetVehicules(sheetName), hdr = sh.getRange(1,1,1,sh.getLastColumn()).getValues()[0].map(function(h){return String(h).trim().toLowerCase().replace(/\s+/g,'_');});
  var row = hdr.map(function(h){return obj[h] !== undefined ? obj[h] : '';});
  sh.appendRow(row);
}

function updateRowByIdVehicules(sheetName, id, updates) {
  var sh = getSheetVehicules(sheetName), data = sh.getDataRange().getValues();
  var hdr = data[0].map(function(h){return String(h).trim().toLowerCase().replace(/\s+/g,'_');});
  var idCol = hdr.indexOf('id');
  for (var r = 1; r < data.length; r++) {
    if (String(data[r][idCol]) === String(id)) {
      for (var key in updates) {
        var ci = hdr.indexOf(key);
        if (ci > -1) sh.getRange(r+1, ci+1).setValue(updates[key]);
      }
      return true;
    }
  }
  return false;
}

function deleteRowByIdVehicules(sheetName, id) {
  var sh = getSheetVehicules(sheetName), data = sh.getDataRange().getValues();
  var hdr = data[0].map(function(h){return String(h).trim().toLowerCase().replace(/\s+/g,'_');});
  var idCol = hdr.indexOf('id');
  for (var r = data.length - 1; r >= 1; r--) {
    if (String(data[r][idCol]) === String(id)) { sh.deleteRow(r+1); return true; }
  }
  return false;
}

// ============================================================
// INSTALLATION — à lancer UNE SEULE FOIS depuis l'éditeur Apps Script
// ============================================================

var VEHICULES_ENTETES = [
  'id','immatriculation','marque','modele','type','statut','ville',
  'conducteur_nom','conducteur_email',
  'kilometrage','km_contrat','duree_contrat_annees','loyer_mensuel','date_fin_contrat',
  'date_ct','date_assurance','date_entretien',
  'lien_drive','notes','cree_le','cree_par','maj_le'
];
var VEHICULES_HISTORIQUE_ENTETES = ['id','vehicule_id','type_evenement','contenu','auteur','cree_le'];

/**
 * Crée les onglets "vehicules" et "vehicules_historique" DANS LE SHEET DÉDIÉ (SS_VEHICULES_ID),
 * avec les en-têtes exactement attendus par le code, plus les garde-fous (listes déroulantes).
 * Ne fait rien si les onglets existent déjà (sûr à relancer plusieurs fois).
 *
 * COMMENT LANCER : dans l'éditeur Apps Script (script.google.com), sélectionne cette fonction
 * dans la barre déroulante en haut ("creerOngletsVehicules"), puis clique sur ▶ Exécuter.
 * La première fois, Google demande d'autoriser le script à accéder au Sheet : accepte.
 */
function creerOngletsVehicules() {
  var ss = getSSVehicules();
  var creees = [];

  var shVeh = ss.getSheetByName('vehicules');
  if (!shVeh) {
    shVeh = ss.insertSheet('vehicules');
    shVeh.getRange(1, 1, 1, VEHICULES_ENTETES.length).setValues([VEHICULES_ENTETES]).setFontWeight('bold');
    shVeh.setFrozenRows(1);
    creees.push('vehicules');
  }

  var shHist = ss.getSheetByName('vehicules_historique');
  if (!shHist) {
    shHist = ss.insertSheet('vehicules_historique');
    shHist.getRange(1, 1, 1, VEHICULES_HISTORIQUE_ENTETES.length).setValues([VEHICULES_HISTORIQUE_ENTETES]).setFontWeight('bold');
    shHist.setFrozenRows(1);
    creees.push('vehicules_historique');
  }

  function dv(list) { return SpreadsheetApp.newDataValidation().requireValueInList(list, true).setAllowInvalid(false).build(); }
  var rows = Math.max(shVeh.getMaxRows() - 1, 200);
  shVeh.getRange(2, VEHICULES_ENTETES.indexOf('type') + 1, rows, 1).setDataValidation(dv(VEHICULE_TYPES));
  shVeh.getRange(2, VEHICULES_ENTETES.indexOf('statut') + 1, rows, 1).setDataValidation(dv(VEHICULE_STATUTS));
  shVeh.getRange(2, VEHICULES_ENTETES.indexOf('ville') + 1, rows, 1).setDataValidation(dv(VILLES_VEHICULES));

  var msg = creees.length
    ? 'Onglets créés dans le Sheet Véhicules : ' + creees.join(', ') + '. Garde-fous (type/statut/ville) posés.'
    : 'Les onglets existaient déjà — garde-fous (type/statut/ville) réappliqués.';
  Logger.log(msg);
  return msg;
}

// ============================================================
// LECTURE
// ============================================================

/**
 * Retourne tous les véhicules, triés par immatriculation.
 * Chaque véhicule reçoit un champ .alerte = { niveau: 'ok'|'attention'|'urgent', libelle: '...' }
 * calculé à partir de la plus proche échéance (contrôle technique, assurance, entretien, fin de contrat).
 */
function getVehicules() {
  var rows = readSheetVehicules('vehicules');
  rows.forEach(function (v) { v.alerte = calculerAlerteVehicule(v); });
  rows.sort(function (a, b) { return String(a.immatriculation).localeCompare(String(b.immatriculation)); });
  return rows;
}

/** Retourne un véhicule précis + son historique (timeline), pour la fiche détail. */
function getVehicule(id) {
  var v = getVehicules().filter(function (r) { return String(r.id) === String(id); })[0];
  if (!v) throw new Error('Véhicule introuvable : ' + id);
  v.historique = getHistoriqueVehicule(id);
  return v;
}

/** Timeline d'un véhicule : création, changements de statut, entretiens, commentaires — triés du plus ancien au plus récent. */
function getHistoriqueVehicule(id) {
  var rows = readSheetVehicules('vehicules_historique').filter(function (r) { return String(r.vehicule_id) === String(id); });
  rows.sort(function (a, b) { return String(a.cree_le).localeCompare(String(b.cree_le)); });
  return rows;
}

/** Chiffres pour le bandeau de stats du module (total, en service, en maintenance, échéances à surveiller, loyer total mensuel). */
function getStatsVehicules() {
  var rows = getVehicules();
  var loyerTotal = 0;
  rows.forEach(function (v) { loyerTotal += Number(v.loyer_mensuel) || 0; });
  return {
    total: rows.length,
    enService: rows.filter(function (v) { return v.statut === 'En service'; }).length,
    enMaintenance: rows.filter(function (v) { return v.statut === 'En maintenance'; }).length,
    alertes: rows.filter(function (v) { return v.alerte.niveau !== 'ok'; }).length,
    loyerTotalMensuel: loyerTotal
  };
}

/**
 * Calcule l'alerte d'échéance d'un véhicule à partir de date_ct, date_assurance, date_entretien, date_fin_contrat.
 * Retourne le pire des quatre : 'urgent' (déjà expiré) > 'attention' (< 30 jours) > 'ok'.
 */
function calculerAlerteVehicule(v) {
  var echeances = [
    { label: 'Contrôle technique', date: v.date_ct },
    { label: 'Assurance', date: v.date_assurance },
    { label: 'Entretien', date: v.date_entretien },
    { label: 'Fin de contrat', date: v.date_fin_contrat }
  ].filter(function (e) { return !!e.date; });

  var pire = { niveau: 'ok', libelle: 'À jour' };
  var maintenant = new Date();

  echeances.forEach(function (e) {
    var d = parseDateFrVehicules(e.date);
    if (!d) return;
    var joursRestants = Math.round((d - maintenant) / 86400000);
    if (joursRestants < 0 && pire.niveau !== 'urgent') {
      pire = { niveau: 'urgent', libelle: e.label + ' expiré' };
    } else if (joursRestants >= 0 && joursRestants <= VEHICULE_SEUIL_ALERTE_JOURS && pire.niveau === 'ok') {
      pire = { niveau: 'attention', libelle: e.label + ' — ' + joursRestants + ' j' };
    }
  });

  return pire;
}

/** Convertit une date au format "dd/MM/yyyy" (celui que renvoie cellVal) en objet Date JS. */
function parseDateFrVehicules(s) {
  if (!s) return null;
  var m = String(s).match(/(\d{2})\/(\d{2})\/(\d{4})/);
  if (!m) return null;
  return new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
}

// ============================================================
// ÉCRITURE
// ============================================================

/**
 * Ajoute un véhicule au parc.
 * data = { immatriculation, marque, modele, type, ville, conducteur_nom, conducteur_email,
 *          kilometrage, km_contrat, duree_contrat_annees, loyer_mensuel, date_fin_contrat,
 *          date_ct, date_assurance, date_entretien, lien_drive }
 */
function addVehicule(data) {
  var id = uid('VEH');
  appendRowVehicules('vehicules', {
    id: id,
    immatriculation: data.immatriculation || '',
    marque: data.marque || '',
    modele: data.modele || '',
    type: data.type || 'autre',
    statut: 'En service',
    ville: data.ville || '',
    conducteur_nom: data.conducteur_nom || '',
    conducteur_email: data.conducteur_email || '',
    kilometrage: data.kilometrage || 0,
    km_contrat: data.km_contrat || 0,
    duree_contrat_annees: data.duree_contrat_annees || '',
    loyer_mensuel: data.loyer_mensuel || 0,
    date_fin_contrat: data.date_fin_contrat || '',
    date_ct: data.date_ct || '',
    date_assurance: data.date_assurance || '',
    date_entretien: data.date_entretien || '',
    lien_drive: data.lien_drive || '',
    notes: '',
    cree_le: nowStr(),
    cree_par: who(),
    maj_le: nowStr()
  });
  ajouterEvenementVehicule(id, 'creation', 'Véhicule ajouté au parc', who());
  return id;
}

/** Change le statut d'un véhicule (En service / En maintenance / Hors service). */
function majStatutVehicule(id, statut, commentaire) {
  if (VEHICULE_STATUTS.indexOf(statut) === -1) throw new Error('Statut inconnu : ' + statut);
  updateRowByIdVehicules('vehicules', id, { statut: statut, maj_le: nowStr() });
  ajouterEvenementVehicule(id, 'changement_statut', 'Statut changé en « ' + statut + ' »' + (commentaire ? ' — ' + commentaire : ''), who());
  return true;
}

/** Mise à jour libre d'un véhicule (n'importe quel champ : kilométrage, loyer, dates, conducteur, lien Drive, etc.) : updates = objet {colonne: valeur}. */
function majVehicule(id, updates) {
  updates.maj_le = nowStr();
  updateRowByIdVehicules('vehicules', id, updates);
  return true;
}

/** Ajoute un commentaire (ex : compte-rendu d'entretien, incident) dans la timeline du véhicule. */
function addCommentaireVehicule(id, texte) {
  if (!texte || !texte.trim()) throw new Error('Commentaire vide');
  updateRowByIdVehicules('vehicules', id, { maj_le: nowStr() });
  ajouterEvenementVehicule(id, 'commentaire', texte.trim(), who());
  return true;
}

/** Suppression d'un véhicule (sortie de parc définitive — retrait du contrat, restitution). */
function supprimerVehicule(id) {
  return deleteRowByIdVehicules('vehicules', id);
}

/** Ajoute une ligne dans l'onglet vehicules_historique (utilisé par toutes les fonctions ci-dessus). */
function ajouterEvenementVehicule(vehiculeId, type, contenu, auteur) {
  appendRowVehicules('vehicules_historique', {
    id: uid('EVT'),
    vehicule_id: vehiculeId,
    type_evenement: type,
    contenu: contenu,
    auteur: auteur || '',
    cree_le: nowStr()
  });
}

// ============================================================
// LISTES (envoyées au hub pour remplir les <select>)
// ============================================================

function getListesVehicules() {
  return {
    villes: VILLES_VEHICULES,
    types: VEHICULE_TYPES,
    statuts: VEHICULE_STATUTS
  };
}
