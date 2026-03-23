/**
 * archivioManager.js
 * Salva i PDF in: ARCHIVIO NAAF\ARCHIVIO\ANNO\MESE\
 * Percorso: ARCHIVIO NAAF\utils\archivioManager.js
 *
 * Il percorso ARCHIVIO è RELATIVO alla cartella dell'app stessa,
 * quindi funziona ovunque venga spostata la cartella ARCHIVIO NAAF.
 */

const path = require('path');
const fs   = require('fs');

// Cartella ARCHIVIO\ nella stessa directory dell'app
const ARCHIVIO_BASE = process.env.ARCHIVIO_PATH ||
  path.join(__dirname, '..', 'ARCHIVIO');

/**
 * Salva un PDF in ARCHIVIO\ANNO\MESE\nomeFile
 */
function salva(anno, mese, nomeFile, buffer) {
  const dir = path.join(ARCHIVIO_BASE, String(anno), mese.toUpperCase());
  fs.mkdirSync(dir, { recursive: true });
  const dest = path.join(dir, nomeFile);
  fs.writeFileSync(dest, buffer);
  console.log(`[ARCHIVIO] Salvato: ${dest}`);
  return dest;
}

/**
 * Elenca tutti i PDF archiviati
 * @returns {{ [anno]: { [mese]: [{nome, path, data}] } }}
 */
function elenca() {
  if (!fs.existsSync(ARCHIVIO_BASE)) return {};
  const risultato = {};
  for (const anno of fs.readdirSync(ARCHIVIO_BASE)) {
    const annoPath = path.join(ARCHIVIO_BASE, anno);
    if (!fs.statSync(annoPath).isDirectory()) continue;
    risultato[anno] = {};
    for (const mese of fs.readdirSync(annoPath)) {
      const mesePath = path.join(annoPath, mese);
      if (!fs.statSync(mesePath).isDirectory()) continue;
      risultato[anno][mese] = fs.readdirSync(mesePath)
        .filter(f => f.endsWith('.pdf'))
        .map(f => ({
          nome: f,
          path: path.join(mesePath, f),
          data: fs.statSync(path.join(mesePath, f)).mtime
        }));
    }
  }
  return risultato;
}

module.exports = { salva, elenca, ARCHIVIO_BASE };
