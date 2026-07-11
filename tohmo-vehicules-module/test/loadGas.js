const fs = require('fs');
const path = require('path');
const vm = require('vm');

/**
 * Charge un ou plusieurs fichiers .gs dans un contexte Node (via vm) et retourne ce contexte,
 * pour tester la vraie logique du module sans dépendre de Google Apps Script.
 * Les services Apps Script (SpreadsheetApp, DriveApp, Utilities, Logger, Session) sont
 * stubbés au minimum : suffisant pour les fonctions "pures" du module, pas pour celles qui
 * lisent/écrivent vraiment un Sheet ou un Drive (getVehicules, addVehicule, etc. — non testées ici).
 */
function loadGasFiles(filePaths, extraGlobals) {
  const context = Object.assign(
    {
      console,
      Logger: { log: () => {} },
      Utilities: {
        formatDate: (date) => date.toISOString(),
        newBlob: () => ({}),
        base64Decode: () => [],
      },
      Session: { getActiveUser: () => ({ getEmail: () => '' }) },
      SpreadsheetApp: {
        newDataValidation: () => {
          const builder = {
            requireValueInList: () => builder,
            setAllowInvalid: () => builder,
            build: () => ({ __fakeValidation: true }),
          };
          return builder;
        },
      },
      DriveApp: {},
    },
    extraGlobals || {}
  );
  vm.createContext(context);
  filePaths.forEach((filePath) => {
    const code = fs.readFileSync(filePath, 'utf8');
    vm.runInContext(code, context, { filename: path.basename(filePath) });
  });
  return context;
}

module.exports = { loadGasFiles };
