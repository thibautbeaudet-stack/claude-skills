/**
 * MODULE VÉHICULES — code à ajouter dans le Code.gs du projet Apps Script "HUB"
 *
 * COMMENT L'INSTALLER :
 * 1. Ouvre le projet Apps Script "HUB" (script.google.com, ou depuis le Sheet : Extensions > Apps Script)
 * 2. Ouvre ton fichier Code.gs existant
 * 3. Colle TOUT le contenu de ce fichier À LA SUITE de ton code existant (à la fin du fichier)
 * 4. Renseigne SITES_VEHICULES ci-dessous avec ta vraie liste de sites Tohmo (même liste que SITES_TICKETS si tu as déjà le module Tickets)
 * 5. N'oublie pas : Déployer > Gérer les déploiements > Nouvelle version (sinon rien ne change en prod)
 *
 * Contrairement à Tickets, ce module N'A PAS BESOIN d'un Sheet séparé : il n'y a pas de formulaire
 * public, seulement toi (office manager) qui gères le parc depuis le hub. Les données vivent donc
 * dans le Sheet principal déjà lié au projet Apps Script (celui du Budget), dans deux nouveaux onglets.
 * Ce fichier réutilise tel quel les helpers déjà présents dans ton Code.gs :
 * getSheet, readSheet, appendRow, updateRowById, deleteRowById, uid, nowStr, today, who
 * Il ne les redéfinit pas — ne les copie pas deux fois.
 */

// ============================================================
// CONFIGURATION — à adapter à Tohmo avant de déployer
// ============================================================

// Liste des sites Tohmo (mêmes valeurs que pour Tickets si le module est déjà installé)
var SITES_VEHICULES = ['Paris', 'Lyon', 'Marseille', 'Bordeaux'];

// Valeurs fermées (doivent correspondre EXACTEMENT aux validations de données du Sheet)
var VEHICULE_TYPES   = ['citadine', 'berline', 'utilitaire', 'suv', 'autre'];
var VEHICULE_STATUTS = ['En service', 'En maintenance', 'Hors service'];

// Nombre de jours avant échéance (CT, assurance, entretien) à partir duquel on affiche une alerte "à renouveler"
var VEHICULE_SEUIL_ALERTE_JOURS = 30;

// ============================================================
// LECTURE
// ============================================================

/**
 * Retourne tous les véhicules, triés par immatriculation.
 * Chaque véhicule reçoit un champ .alerte = { niveau: 'ok'|'attention'|'urgent', libelle: '...' }
 * calculé à partir de la plus proche échéance (contrôle technique, assurance, entretien).
 */
function getVehicules() {
  var rows = readSheet('vehicules');
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
  var rows = readSheet('vehicules_historique').filter(function (r) { return String(r.vehicule_id) === String(id); });
  rows.sort(function (a, b) { return String(a.cree_le).localeCompare(String(b.cree_le)); });
  return rows;
}

/** Chiffres pour le bandeau de stats du module (total, en service, en maintenance, échéances à surveiller). */
function getStatsVehicules() {
  var rows = getVehicules();
  return {
    total: rows.length,
    enService: rows.filter(function (v) { return v.statut === 'En service'; }).length,
    enMaintenance: rows.filter(function (v) { return v.statut === 'En maintenance'; }).length,
    alertes: rows.filter(function (v) { return v.alerte.niveau !== 'ok'; }).length
  };
}

/**
 * Calcule l'alerte d'échéance d'un véhicule à partir de date_ct, date_assurance, date_entretien.
 * Retourne le pire des trois : 'urgent' (déjà expiré) > 'attention' (< 30 jours) > 'ok'.
 */
function calculerAlerteVehicule(v) {
  var echeances = [
    { label: 'Contrôle technique', date: v.date_ct },
    { label: 'Assurance', date: v.date_assurance },
    { label: 'Entretien', date: v.date_entretien }
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
 * data = { immatriculation, marque, modele, type, site, conducteur_nom, conducteur_email, kilometrage, date_ct, date_assurance, date_entretien, notes }
 */
function addVehicule(data) {
  var id = uid('VEH');
  appendRow('vehicules', {
    id: id,
    immatriculation: data.immatriculation || '',
    marque: data.marque || '',
    modele: data.modele || '',
    type: data.type || 'autre',
    statut: 'En service',
    site: data.site || '',
    conducteur_nom: data.conducteur_nom || '',
    conducteur_email: data.conducteur_email || '',
    kilometrage: data.kilometrage || 0,
    date_ct: data.date_ct || '',
    date_assurance: data.date_assurance || '',
    date_entretien: data.date_entretien || '',
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
  updateRowById('vehicules', id, { statut: statut, maj_le: nowStr() });
  ajouterEvenementVehicule(id, 'changement_statut', 'Statut changé en « ' + statut + ' »' + (commentaire ? ' — ' + commentaire : ''), who());
  return true;
}

/** Mise à jour libre d'un véhicule (kilométrage, dates d'échéance, conducteur, etc.) : updates = objet {colonne: valeur}. */
function majVehicule(id, updates) {
  updates.maj_le = nowStr();
  updateRowById('vehicules', id, updates);
  return true;
}

/** Ajoute un commentaire (ex : compte-rendu d'entretien, incident) dans la timeline du véhicule. */
function addCommentaireVehicule(id, texte) {
  if (!texte || !texte.trim()) throw new Error('Commentaire vide');
  updateRowById('vehicules', id, { maj_le: nowStr() });
  ajouterEvenementVehicule(id, 'commentaire', texte.trim(), who());
  return true;
}

/** Suppression d'un véhicule (sortie de parc définitive). */
function supprimerVehicule(id) {
  return deleteRowById('vehicules', id);
}

/** Ajoute une ligne dans l'onglet vehicules_historique (utilisé par toutes les fonctions ci-dessus). */
function ajouterEvenementVehicule(vehiculeId, type, contenu, auteur) {
  appendRow('vehicules_historique', {
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
    sites: SITES_VEHICULES,
    types: VEHICULE_TYPES,
    statuts: VEHICULE_STATUTS
  };
}
