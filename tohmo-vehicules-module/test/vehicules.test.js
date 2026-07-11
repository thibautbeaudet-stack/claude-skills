const path = require('path');
const { loadGasFiles } = require('./loadGas');

const gas = loadGasFiles([path.join(__dirname, '..', 'Code_ajouts_vehicules.gs')]);

/** Retourne une date au format jj/mm/aaaa décalée de `offsetDays` par rapport à aujourd'hui. */
function dateFr(offsetDays) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

describe('normaliserImmatriculation', () => {
  test('ignore espaces, tirets et casse', () => {
    expect(gas.normaliserImmatriculation('ab-123-cd')).toBe('AB123CD');
    expect(gas.normaliserImmatriculation('AB 123 CD')).toBe('AB123CD');
    expect(gas.normaliserImmatriculation('AB123CD')).toBe('AB123CD');
  });
  test('valeur vide ou absente -> chaîne vide', () => {
    expect(gas.normaliserImmatriculation('')).toBe('');
    expect(gas.normaliserImmatriculation(null)).toBe('');
  });
});

describe('parseDateFrVehicules', () => {
  test('parse un format jj/mm/aaaa', () => {
    const d = gas.parseDateFrVehicules('11/07/2026');
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(6); // juillet = index 6
    expect(d.getDate()).toBe(11);
  });
  test('valeur vide ou invalide -> null', () => {
    expect(gas.parseDateFrVehicules('')).toBeNull();
    expect(gas.parseDateFrVehicules('pas une date')).toBeNull();
  });
});

describe('calculerAlerteVehicule', () => {
  test('aucune échéance renseignée -> à jour', () => {
    expect(gas.calculerAlerteVehicule({}).niveau).toBe('ok');
  });
  test('échéance lointaine -> à jour', () => {
    expect(gas.calculerAlerteVehicule({ date_ct: dateFr(90) }).niveau).toBe('ok');
  });
  test('échéance à moins de 30 jours -> attention', () => {
    const alerte = gas.calculerAlerteVehicule({ date_assurance: dateFr(10) });
    expect(alerte.niveau).toBe('attention');
    expect(alerte.libelle).toContain('Assurance');
  });
  test('échéance déjà passée -> urgent', () => {
    const alerte = gas.calculerAlerteVehicule({ date_entretien: dateFr(-5) });
    expect(alerte.niveau).toBe('urgent');
    expect(alerte.libelle).toContain('expiré');
  });
  test('la pire échéance l\'emporte quand il y en a plusieurs', () => {
    const alerte = gas.calculerAlerteVehicule({ date_ct: dateFr(10), date_fin_contrat: dateFr(-2) });
    expect(alerte.niveau).toBe('urgent');
  });
});

/** Sheet factice minimale (en-têtes uniquement) pour tester la gestion des colonnes sans Google Sheets. */
function makeFakeSheet(headers) {
  let currentHeaders = headers.slice();
  return {
    getLastColumn: () => currentHeaders.length,
    getRange: (row, col, numRows, numCols) => {
      const range = {
        getValues: () => (row === 1 ? [currentHeaders.slice(col - 1, col - 1 + numCols)] : [[]]),
        setValues: (values) => {
          if (row === 1) values[0].forEach((h, i) => { currentHeaders[col - 1 + i] = h; });
          return range;
        },
        setFontWeight: () => range,
        setDataValidation: () => range,
      };
      return range;
    },
  };
}

describe('gestion des colonnes du Sheet (mise à niveau sans casser les données existantes)', () => {
  test('ne modifie rien si toutes les colonnes attendues existent déjà', () => {
    const sh = makeFakeSheet(['id', 'immatriculation', 'categorie']);
    gas.ajouterColonnesManquantes(sh, ['id', 'immatriculation', 'categorie']);
    expect(sh.getLastColumn()).toBe(3);
  });

  test('ajoute uniquement les colonnes manquantes, à la suite, sans toucher aux existantes', () => {
    const sh = makeFakeSheet(['id', 'immatriculation']);
    gas.ajouterColonnesManquantes(sh, ['id', 'immatriculation', 'categorie', 'proprietaire']);
    expect(sh.getLastColumn()).toBe(4);
    expect(sh.getRange(1, 1, 1, 4).getValues()[0]).toEqual(['id', 'immatriculation', 'categorie', 'proprietaire']);
  });

  test('indexColonneVehicules retrouve la position 1-based d\'un en-tête, 0 si absente', () => {
    const sh = makeFakeSheet(['id', 'immatriculation', 'categorie']);
    expect(gas.indexColonneVehicules(sh, 'categorie')).toBe(3);
    expect(gas.indexColonneVehicules(sh, 'inexistant')).toBe(0);
  });

  test('poserValidationColonne ne plante pas, colonne présente ou absente', () => {
    const sh = makeFakeSheet(['id', 'type']);
    expect(() => gas.poserValidationColonne(sh, 'type', ['citadine', 'berline'], 10)).not.toThrow();
    expect(() => gas.poserValidationColonne(sh, 'absente', ['x'], 10)).not.toThrow();
  });
});
