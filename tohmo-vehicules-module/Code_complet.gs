/** Pont Tohmo Hub ↔ Sheets — Budget / Cartes / Factures / PO-PR / Fournisseurs / Tickets */
var SS = SpreadsheetApp.getActive();
var DOSSIER_FACTURES = '1vuh1aXyhU_z976GzUvY4PCReekKNC3a8';

function getSheet(name){
  var sh=SS.getSheetByName(name); if(sh)return sh;
  var t=String(name).trim().toLowerCase(), all=SS.getSheets();
  for(var i=0;i<all.length;i++){ if(all[i].getName().trim().toLowerCase()===t) return all[i]; }
  throw new Error('Onglet introuvable : "'+name+'". Onglets : '+all.map(function(s){return '"'+s.getName()+'"';}).join(', '));
}
function cellVal(v){ if(v instanceof Date) return Utilities.formatDate(v,'Europe/Paris','dd/MM/yyyy'); return v; }
function readSheet(name){
  var vals=getSheet(name).getDataRange().getValues(), h=vals.shift();
  return vals.filter(function(r){return r.join('')!=='';}).map(function(row){var o={};h.forEach(function(k,i){o[String(k).trim()]=cellVal(row[i]);});return o;});
}
function appendRow(name,obj){
  var sh=getSheet(name), h=sh.getRange(1,1,1,sh.getLastColumn()).getValues()[0].map(function(x){return String(x).trim();});
  sh.appendRow(h.map(function(k){return obj[k]!==undefined?obj[k]:'';})); return obj.id;
}
function updateRowById(name,id,patch){
  var sh=getSheet(name), data=sh.getDataRange().getValues(), h=data[0].map(function(x){return String(x).trim();}), idc=h.indexOf('id');
  for(var r=1;r<data.length;r++){ if(String(data[r][idc])===String(id)){ h.forEach(function(k,c){ if(patch[k]!==undefined) sh.getRange(r+1,c+1).setValue(patch[k]); }); return true; } }
  return false;
}
function deleteRowById(name,id){
  var sh=getSheet(name), data=sh.getDataRange().getValues(), h=data[0].map(function(x){return String(x).trim();}), idc=h.indexOf('id');
  for(var r=data.length-1;r>=1;r--){ if(String(data[r][idc])===String(id)){ sh.deleteRow(r+1); return true; } }
  return false;
}
var SHEETS={carte:'paiements_carte',facture:'factures',commande:'commandes_po',fournisseur:'fournisseurs'};
function supprimer(module,id){ var n=SHEETS[module]; if(!n) throw new Error('Module inconnu'); return deleteRowById(n,id); }
function uid(p){ return p+'-'+Utilities.formatDate(new Date(),'Europe/Paris','yyyyMMdd')+'-'+Math.floor(Math.random()*900+100); }
function nowStr(){ return Utilities.formatDate(new Date(),'Europe/Paris','dd/MM/yyyy HH:mm'); }
function today(){ return Utilities.formatDate(new Date(),'Europe/Paris','dd/MM/yyyy'); }
function who(p){ return p || (Session.getActiveUser().getEmail()||'hub'); }
function amounts(ttc,tva){ ttc=Number(ttc)||0; tva=Number(tva)||0; var ht=ttc/(1+tva/100); return {ttc:Math.round(ttc*100)/100,tva_rate:tva,ht:Math.round(ht*100)/100,tva:Math.round((ttc-ht)*100)/100}; }

// ============================================================
// BUDGET / POSTES
// ============================================================

function getPostes(){ return readSheet('budget_postes'); }

// ============================================================
// CARTES
// ============================================================

function getCartes(){ return readSheet('paiements_carte'); }
function addCarte(d){ var a=amounts(d.montant_ttc,d.taux_tva);
  return appendRow('paiements_carte',{id:uid('CB'),date:d.date||today(),libelle:d.libelle||'',poste:d.poste||'',montant_ttc:a.ttc,taux_tva:a.tva_rate,montant_ht:a.ht,montant_tva:a.tva,mode_paiement:d.mode_paiement||'Carte unique',carte:d.carte||'',fournisseur:d.fournisseur||'',numero_po:'',source:d.source||'hub',statut_validation:(d.source==='make')?'a_valider':'valide',cree_le:nowStr(),cree_par:who(d.cree_par)}); }
function majCarte(id, d) {
  var a = amounts(d.montant_ttc, d.taux_tva);
  updateRowById('paiements_carte', id, {
    libelle: d.libelle, poste: d.poste, fournisseur: d.fournisseur,
    mode_paiement: d.mode_paiement,
    montant_ttc: a.ttc, taux_tva: a.tva_rate, montant_ht: a.ht, montant_tva: a.tva,
    maj_le: nowStr()
  });
  return true;
}

// ============================================================
// FACTURES
// ============================================================

function getFactures(){ return readSheet('factures'); }
function addFacture(f){ var a=amounts(f.montant_ttc,f.taux_tva); var scan=f.scan_url||'';
  if(f.file && f.file.data){
    var folder=DriveApp.getFolderById(DOSSIER_FACTURES);
    var blob=Utilities.newBlob(Utilities.base64Decode(f.file.data), f.file.mime||'application/octet-stream', f.file.name||('facture_'+f.numero_facture||'facture'));
    scan=folder.createFile(blob).getUrl();
  }
  return appendRow('factures',{id:uid('FAC'),numero_facture:f.numero_facture||'',fournisseur:f.fournisseur||'',numero_po:f.numero_po||'',poste:f.poste||'',montant_ttc:a.ttc,taux_tva:a.tva_rate,montant_ht:a.ht,montant_tva:a.tva,date_facturation:f.date_facturation||today(),statut_paiement:f.statut_paiement||'À payer',scan_url:scan,source:f.source||'hub',statut_validation:(f.source==='make')?'a_valider':'valide',cree_le:nowStr(),cree_par:who(f.cree_par)}); }
function majFacture(id, d) {
  var a = amounts(d.montant_ttc, d.taux_tva);
  var u = {
    numero_facture: d.numero_facture, fournisseur: d.fournisseur,
    numero_po: d.numero_po, poste: d.poste,
    date_facturation: d.date_facturation, statut_paiement: d.statut_paiement,
    montant_ttc: a.ttc, taux_tva: a.tva_rate, montant_ht: a.ht, montant_tva: a.tva,
    maj_le: nowStr()
  };
  if (d.file && d.file.data) {
    var folder = DriveApp.getFolderById(DOSSIER_FACTURES);
    var blob = Utilities.newBlob(Utilities.base64Decode(d.file.data), d.file.mime, d.file.name);
    u.scan_url = folder.createFile(blob).getUrl();
  }
  updateRowById('factures', id, u);
  return true;
}

// ============================================================
// COMMANDES (PR / PO)
// ============================================================

function getCommandes(){ return readSheet('commandes_po'); }
function addCommande(c){
  return appendRow('commandes_po',{id:uid('CMD'),numero_pr:c.numero_pr||'',date_pr:c.date_pr||today(),numero_po:c.numero_po||'',date_creation:c.numero_po?today():'',objet:c.objet||'',fournisseur:c.fournisseur||'',poste:c.poste||'',annee:c.annee||Utilities.formatDate(new Date(),'Europe/Paris','yyyy'),montant_engage_ht:Math.round((Number(c.montant_engage_ht)||0)*100)/100,statut:c.statut||'PR en cours',source:c.source||'hub',statut_validation:(c.source==='make')?'a_valider':'valide',cree_le:nowStr(),cree_par:who(c.cree_par)}); }
function convertirEnPO(id,numero_po){ return updateRowById('commandes_po',id,{numero_po:numero_po,statut:'PO émis',date_creation:today()}); }
function majStatutCommande(id,statut){ return updateRowById('commandes_po',id,{statut:statut}); }
function majCommande(id, d) {
  updateRowById('commandes_po', id, {
    numero_pr: d.numero_pr, objet: d.objet, fournisseur: d.fournisseur,
    poste: d.poste, annee: d.annee, montant_engage_ht: d.montant_engage_ht,
    maj_le: nowStr()
  });
  return true;
}

// ============================================================
// FOURNISSEURS
// ============================================================

function getFournisseurs(){ return readSheet('fournisseurs'); }
function addFournisseur(f){
  return appendRow('fournisseurs',{id:uid('FRN'),numero_fournisseur:f.numero_fournisseur||'',nom:f.nom||'',telephone:f.telephone||'',source:f.source||'hub',statut_validation:(f.source==='make')?'a_valider':'valide',cree_le:nowStr(),cree_par:who(f.cree_par)}); }
function majFournisseur(id, d) {
  updateRowById('fournisseurs', id, {
    nom: d.nom, numero_fournisseur: d.numero_fournisseur, telephone: d.telephone,
    maj_le: nowStr()
  });
  return true;
}

// ============================================================
// WEB APP
// ============================================================

function doGet(e) {
  var page = (e && e.parameter && e.parameter.page) || '';
  if (page === 'ticket') {
    return HtmlService.createHtmlOutputFromFile('formulaire_ticket').setTitle('Nouvelle demande — Tohmo');
  }
  return HtmlService.createHtmlOutputFromFile('index').setTitle('Tohmo — Budget & achats').addMetaTag('viewport','width=device-width, initial-scale=1');
}

// ============================================================
// OUTILS / MAINTENANCE
// ============================================================

function testRead(){ Logger.log('Postes '+getPostes().length+' · Cartes '+getCartes().length+' · Commandes '+getCommandes().length+' · Factures '+getFactures().length+' · Fournisseurs '+getFournisseurs().length); }

function poserGardeFous(){
  var postes = getPostes().map(function(p){return p.poste;});
  function dv(list){ return SpreadsheetApp.newDataValidation().requireValueInList(list, true).setAllowInvalid(false).build(); }
  function col(sheet, header, list){
    var sh=getSheet(sheet), hdr=sh.getRange(1,1,1,sh.getLastColumn()).getValues()[0].map(function(x){return String(x).trim();});
    var i=hdr.indexOf(header); if(i<0) return; var rows=sh.getMaxRows()-1; if(rows<1) return;
    sh.getRange(2, i+1, rows, 1).setDataValidation(dv(list));
  }
  var tva=[20,10,5.5,2.1,0], val=['valide','a_valider'], src=['hub','make','qr'];
  col('paiements_carte','poste',postes); col('paiements_carte','taux_tva',tva); col('paiements_carte','mode_paiement',['Carte unique','CB physique']); col('paiements_carte','source',src); col('paiements_carte','statut_validation',val);
  col('factures','poste',postes); col('factures','taux_tva',tva); col('factures','statut_paiement',['À payer','Payée']); col('factures','source',src); col('factures','statut_validation',val);
  col('commandes_po','poste',postes); col('commandes_po','statut',['PR en cours','PO émis','Clôturé']); col('commandes_po','source',src); col('commandes_po','statut_validation',val);
  col('fournisseurs','source',src); col('fournisseurs','statut_validation',val);
  return 'Garde-fous posés.';
}

// ============================================================
// MODULE TICKETS — données stockées dans un Sheet séparé
// ============================================================

var SS_TICKETS_ID = '1upy9uyN-g3afAEkOgpx806plCcEsL_bx75raPnsfTfI';

// Listes fermées utilisées dans les formulaires
var SITES_TICKETS = ['Paris', 'Lyon', 'Marseille', 'Bordeaux']; // <- à adapter à vos vrais sites Tohmo
var TICKET_TYPES     = ['badge', 'courrier', 'panne_casse', 'casier', 'proprete', 'autre'];
var TICKET_STATUTS   = ['Nouveau', 'En cours', 'Résolu', 'Fermé'];
var TICKET_PRIORITES = ['Basse', 'Normale', 'Haute', 'Urgente'];

// Dossier Drive pour les photos de panne/casse envoyées via le formulaire public (optionnel)
var DOSSIER_PHOTOS_TICKETS = 'COLLEZ_ICI_ID_DU_DOSSIER_DRIVE_PHOTOS';

// ---- Helpers dédiés au Sheet Tickets (équivalents de getSheet/readSheet/appendRow/updateRowById mais sur l'autre fichier) ----

function getSSTickets() { return SpreadsheetApp.openById(SS_TICKETS_ID); }

function getSheetTickets(name) {
  var sheets = getSSTickets().getSheets();
  var n = name.trim().toLowerCase();
  for (var i = 0; i < sheets.length; i++) {
    if (sheets[i].getName().trim().toLowerCase() === n) return sheets[i];
  }
  throw new Error('Onglet "' + name + '" introuvable dans le Sheet Tickets. Onglets existants : ' + sheets.map(function(s){return s.getName();}).join(', '));
}

function readSheetTickets(name) {
  var sh = getSheetTickets(name), data = sh.getDataRange().getValues();
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

function appendRowTickets(sheetName, obj) {
  var sh = getSheetTickets(sheetName), hdr = sh.getRange(1,1,1,sh.getLastColumn()).getValues()[0].map(function(h){return String(h).trim().toLowerCase().replace(/\s+/g,'_');});
  var row = hdr.map(function(h){return obj[h] !== undefined ? obj[h] : '';});
  sh.appendRow(row);
}

function updateRowByIdTickets(sheetName, id, updates) {
  var sh = getSheetTickets(sheetName), data = sh.getDataRange().getValues();
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

function deleteRowByIdTickets(sheetName, id) {
  var sh = getSheetTickets(sheetName), data = sh.getDataRange().getValues();
  var hdr = data[0].map(function(h){return String(h).trim().toLowerCase().replace(/\s+/g,'_');});
  var idCol = hdr.indexOf('id');
  for (var r = data.length - 1; r >= 1; r--) {
    if (String(data[r][idCol]) === String(id)) { sh.deleteRow(r+1); return true; }
  }
  return false;
}

// ---- Lecture ----

function getTickets() {
  var rows = readSheetTickets('tickets');
  rows.forEach(function (t) {
    try { t.donnees = t.donnees_specifiques ? JSON.parse(t.donnees_specifiques) : {}; }
    catch (e) { t.donnees = {}; }
  });
  rows.sort(function (a, b) { return String(b.cree_le).localeCompare(String(a.cree_le)); });
  return rows;
}

function getTicket(id) {
  var t = getTickets().filter(function (r) { return String(r.id) === String(id); })[0];
  if (!t) throw new Error('Ticket introuvable : ' + id);
  t.historique = getHistoriqueTicket(id);
  return t;
}

function getHistoriqueTicket(id) {
  var rows = readSheetTickets('tickets_historique').filter(function (r) { return String(r.ticket_id) === String(id); });
  rows.sort(function (a, b) { return String(a.cree_le).localeCompare(String(b.cree_le)); });
  return rows;
}

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

function parseDateFrTickets(s) {
  if (!s) return null;
  var m = String(s).match(/(\d{2})\/(\d{2})\/(\d{4})(?:\s+(\d{2}):(\d{2}))?/);
  if (!m) return null;
  return new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]), Number(m[4] || 0), Number(m[5] || 0));
}

// ---- Écriture — création ----

function addTicket(data) {
  var id = uid('TIK');
  appendRowTickets('tickets', {
    id: id, type: data.type, statut: 'Nouveau', priorite: data.priorite || 'Normale',
    objet: data.objet || '', description: data.description || '',
    demandeur_nom: data.demandeur_nom || '', demandeur_email: data.demandeur_email || '',
    site: data.site || '', localisation: data.localisation || '',
    donnees_specifiques: JSON.stringify(data.donnees || {}), commentaire_om: '', date_resolution: '',
    source: 'hub', statut_validation: 'valide', cree_le: nowStr(), cree_par: who(), maj_le: nowStr()
  });
  ajouterEvenementTicket(id, 'creation', 'Ticket créé depuis le hub', who());
  return id;
}

function addTicketPublic(data) {
  var id = uid('TIK');
  appendRowTickets('tickets', {
    id: id, type: data.type, statut: 'Nouveau', priorite: data.priorite || 'Normale',
    objet: data.objet || '', description: data.description || '',
    demandeur_nom: data.demandeur_nom || '', demandeur_email: data.demandeur_email || '',
    site: data.site || '', localisation: data.localisation || '',
    donnees_specifiques: JSON.stringify(data.donnees || {}), commentaire_om: '', date_resolution: '',
    source: 'qr', statut_validation: 'a_valider', cree_le: nowStr(),
    cree_par: data.demandeur_email || 'formulaire_public', maj_le: nowStr()
  });
  ajouterEvenementTicket(id, 'creation', 'Demande soumise via le formulaire public', data.demandeur_nom || 'Anonyme');
  return id;
}

// ---- Écriture — mise à jour ----

function majStatutTicket(id, statut, commentaire) {
  if (TICKET_STATUTS.indexOf(statut) === -1) throw new Error('Statut inconnu : ' + statut);
  var updates = { statut: statut, maj_le: nowStr() };
  if (statut === 'Résolu' || statut === 'Fermé') updates.date_resolution = nowStr();
  updateRowByIdTickets('tickets', id, updates);
  ajouterEvenementTicket(id, 'changement_statut', 'Statut changé en « ' + statut + ' »' + (commentaire ? ' — ' + commentaire : ''), who());
  return true;
}

function majTicket(id, updates) {
  updates.maj_le = nowStr();
  updateRowByIdTickets('tickets', id, updates);
  return true;
}

function addCommentaire(id, texte) {
  if (!texte || !texte.trim()) throw new Error('Commentaire vide');
  updateRowByIdTickets('tickets', id, { maj_le: nowStr() });
  ajouterEvenementTicket(id, 'commentaire', texte.trim(), who());
  return true;
}

function supprimerTicket(id) { return deleteRowByIdTickets('tickets', id); }

function ajouterEvenementTicket(ticketId, type, contenu, auteur) {
  appendRowTickets('tickets_historique', {
    id: uid('EVT'), ticket_id: ticketId, type_evenement: type, contenu: contenu, auteur: auteur || '', cree_le: nowStr()
  });
}

function uploadPhotoTicket(base64Data, nomFichier, mimeType) {
  var dossier = DriveApp.getFolderById(DOSSIER_PHOTOS_TICKETS);
  var blob = Utilities.newBlob(Utilities.base64Decode(base64Data), mimeType, nomFichier);
  var fichier = dossier.createFile(blob);
  fichier.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  return fichier.getUrl();
}

function getListesTickets() {
  return { sites: SITES_TICKETS, types: TICKET_TYPES, statuts: TICKET_STATUTS, priorites: TICKET_PRIORITES };
}

// ============================================================
// MODULE VÉHICULES — données dans un Sheet DÉDIÉ et SÉPARÉ (même logique que Tickets)
// ============================================================

var SS_VEHICULES_ID = '19mNkzcSMTwrl5Nx4QzApZDNTQLB2bntWl_76lRVzCYU';
var DOSSIER_VEHICULES_ID = '1QuMgPpvDdO0HZE2cPRznU99rFTTQm7-r'; // dossier Drive parent, un sous-dossier par véhicule (nommé d'après l'immatriculation)
var VILLES_VEHICULES = ['Paris', 'Lyon', 'Marseille', 'Bordeaux']; // <- à adapter à vos vraies villes Tohmo
var VEHICULE_TYPES   = ['citadine', 'berline', 'utilitaire', 'suv', 'autre'];
var VEHICULE_STATUTS = ['En service', 'En maintenance', 'Hors service'];
var VEHICULE_CATEGORIES = ['Pool', 'Fonction']; // Pool = partagé ; Fonction = attribué nominativement (a un propriétaire)
var VEHICULE_SEUIL_ALERTE_JOURS = 30;

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

var VEHICULES_ENTETES = [
  'id','immatriculation','marque','modele','type','categorie','statut','ville',
  'conducteur_nom','conducteur_email','proprietaire',
  'kilometrage','km_contrat','duree_contrat_annees','loyer_mensuel','date_fin_contrat',
  'date_ct','date_assurance','date_entretien',
  'lien_drive','notes','cree_le','cree_par','maj_le'
];
var VEHICULES_HISTORIQUE_ENTETES = ['id','vehicule_id','type_evenement','contenu','auteur','cree_le'];

/**
 * Crée les onglets "vehicules" et "vehicules_historique" DANS LE SHEET DÉDIÉ (SS_VEHICULES_ID)
 * avec en-têtes + garde-fous. À lancer une seule fois depuis l'éditeur Apps Script.
 * Sûr à relancer plusieurs fois : ne recrée pas les onglets s'ils existent déjà, complète
 * les colonnes manquantes sinon (ex : ajout ultérieur d'une colonne au module).
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
  } else {
    ajouterColonnesManquantes(shVeh, VEHICULES_ENTETES);
  }

  var shHist = ss.getSheetByName('vehicules_historique');
  if (!shHist) {
    shHist = ss.insertSheet('vehicules_historique');
    shHist.getRange(1, 1, 1, VEHICULES_HISTORIQUE_ENTETES.length).setValues([VEHICULES_HISTORIQUE_ENTETES]).setFontWeight('bold');
    shHist.setFrozenRows(1);
    creees.push('vehicules_historique');
  } else {
    ajouterColonnesManquantes(shHist, VEHICULES_HISTORIQUE_ENTETES);
  }

  var rows = Math.max(shVeh.getMaxRows() - 1, 200);
  poserValidationColonne(shVeh, 'type', VEHICULE_TYPES, rows);
  poserValidationColonne(shVeh, 'categorie', VEHICULE_CATEGORIES, rows);
  poserValidationColonne(shVeh, 'statut', VEHICULE_STATUTS, rows);
  poserValidationColonne(shVeh, 'ville', VILLES_VEHICULES, rows);

  var msg = creees.length
    ? 'Onglets créés dans le Sheet Véhicules : ' + creees.join(', ') + '. Garde-fous (type/catégorie/statut/ville) posés.'
    : 'Les onglets existaient déjà — colonnes manquantes complétées, garde-fous (type/catégorie/statut/ville) réappliqués.';
  Logger.log(msg);
  return msg;
}

function indexColonneVehicules(sh, header) {
  var largeur = sh.getLastColumn();
  if (largeur < 1) return 0;
  var entetes = sh.getRange(1, 1, 1, largeur).getValues()[0].map(function(h){return String(h).trim().toLowerCase().replace(/\s+/g,'_');});
  return entetes.indexOf(header) + 1;
}

function ajouterColonnesManquantes(sh, entetesAttendues) {
  var largeur = Math.max(sh.getLastColumn(), 1);
  var entetesActuelles = sh.getRange(1, 1, 1, largeur).getValues()[0].map(function(h){return String(h).trim().toLowerCase().replace(/\s+/g,'_');});
  var manquantes = entetesAttendues.filter(function(h){ return entetesActuelles.indexOf(h) === -1; });
  if (!manquantes.length) return;
  sh.getRange(1, largeur + 1, 1, manquantes.length).setValues([manquantes]).setFontWeight('bold');
}

function poserValidationColonne(sh, header, liste, rows) {
  var col = indexColonneVehicules(sh, header);
  if (!col) return;
  var dv = SpreadsheetApp.newDataValidation().requireValueInList(liste, true).setAllowInvalid(false).build();
  sh.getRange(2, col, rows, 1).setDataValidation(dv);
}

function getVehicules() {
  var rows = readSheetVehicules('vehicules');
  rows.forEach(function (v) { v.alerte = calculerAlerteVehicule(v); });
  rows.sort(function (a, b) { return String(a.immatriculation).localeCompare(String(b.immatriculation)); });
  return rows;
}

function getVehicule(id) {
  var v = getVehicules().filter(function (r) { return String(r.id) === String(id); })[0];
  if (!v) throw new Error('Véhicule introuvable : ' + id);
  v.historique = getHistoriqueVehicule(id);
  return v;
}

function getHistoriqueVehicule(id) {
  var rows = readSheetVehicules('vehicules_historique').filter(function (r) { return String(r.vehicule_id) === String(id); });
  rows.sort(function (a, b) { return String(a.cree_le).localeCompare(String(b.cree_le)); });
  return rows;
}

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

function parseDateFrVehicules(s) {
  if (!s) return null;
  var m = String(s).match(/(\d{2})\/(\d{2})\/(\d{4})/);
  if (!m) return null;
  return new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
}

function addVehicule(data) {
  var id = uid('VEH');
  var lienDrive = data.lien_drive || '';
  if (!lienDrive && data.immatriculation) {
    try { lienDrive = obtenirOuCreerDossierDriveVehicule(data.immatriculation); }
    catch (e) { lienDrive = ''; }
  }
  appendRowVehicules('vehicules', {
    id: id,
    immatriculation: data.immatriculation || '',
    marque: data.marque || '',
    modele: data.modele || '',
    type: data.type || 'autre',
    categorie: VEHICULE_CATEGORIES.indexOf(data.categorie) > -1 ? data.categorie : 'Pool',
    statut: 'En service',
    ville: data.ville || '',
    conducteur_nom: data.conducteur_nom || '',
    conducteur_email: data.conducteur_email || '',
    proprietaire: data.proprietaire || '',
    kilometrage: data.kilometrage || 0,
    km_contrat: data.km_contrat || 0,
    duree_contrat_annees: data.duree_contrat_annees || '',
    loyer_mensuel: data.loyer_mensuel || 0,
    date_fin_contrat: data.date_fin_contrat || '',
    date_ct: data.date_ct || '',
    date_assurance: data.date_assurance || '',
    date_entretien: data.date_entretien || '',
    lien_drive: lienDrive,
    notes: '',
    cree_le: nowStr(),
    cree_par: who(),
    maj_le: nowStr()
  });
  ajouterEvenementVehicule(id, 'creation', 'Véhicule ajouté au parc', who());
  return id;
}

function normaliserImmatriculation(s) {
  return String(s || '').toUpperCase().replace(/[\s-]/g, '');
}

function obtenirOuCreerDossierDriveVehicule(immatriculation) {
  var parent = DriveApp.getFolderById(DOSSIER_VEHICULES_ID);
  var cible = normaliserImmatriculation(immatriculation);
  var sousDossiers = parent.getFolders();
  while (sousDossiers.hasNext()) {
    var f = sousDossiers.next();
    if (normaliserImmatriculation(f.getName()) === cible) return f.getUrl();
  }
  var nouveau = parent.createFolder(immatriculation);
  return nouveau.getUrl();
}

function synchroniserDossiersDriveVehicules() {
  var rows = readSheetVehicules('vehicules');
  var maj = 0;
  rows.forEach(function (v) {
    if (v.lien_drive || !v.immatriculation) return;
    var lien = obtenirOuCreerDossierDriveVehicule(v.immatriculation);
    updateRowByIdVehicules('vehicules', v.id, { lien_drive: lien, maj_le: nowStr() });
    maj++;
  });
  var msg = maj + ' véhicule(s) rattaché(s) à leur dossier Drive.';
  Logger.log(msg);
  return msg;
}

function majStatutVehicule(id, statut, commentaire) {
  if (VEHICULE_STATUTS.indexOf(statut) === -1) throw new Error('Statut inconnu : ' + statut);
  updateRowByIdVehicules('vehicules', id, { statut: statut, maj_le: nowStr() });
  ajouterEvenementVehicule(id, 'changement_statut', 'Statut changé en « ' + statut + ' »' + (commentaire ? ' — ' + commentaire : ''), who());
  return true;
}

function majVehicule(id, updates) {
  updates.maj_le = nowStr();
  updateRowByIdVehicules('vehicules', id, updates);
  return true;
}

function addCommentaireVehicule(id, texte) {
  if (!texte || !texte.trim()) throw new Error('Commentaire vide');
  updateRowByIdVehicules('vehicules', id, { maj_le: nowStr() });
  ajouterEvenementVehicule(id, 'commentaire', texte.trim(), who());
  return true;
}

function supprimerVehicule(id) {
  return deleteRowByIdVehicules('vehicules', id);
}

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

function getListesVehicules() {
  return {
    villes: VILLES_VEHICULES,
    types: VEHICULE_TYPES,
    statuts: VEHICULE_STATUTS,
    categories: VEHICULE_CATEGORIES
  };
}
