/**
 * ordiniVolo.js
 * Calcola le spettanze colazione cercando i cognomi dei piloti
 * negli ordini di volo del mese selezionato.
 *
 * Struttura: PERCORSO_BASE\ANNO\MESE\GIORNO\file.pdf
 * Regole selezione file:
 *   1. Il file DEVE contenere "Firmato" nel nome (altrimenti è copia lavoro)
 *   2. Tra i file firmati, prende quello con VAR numero più alto
 *   3. Se non ci sono varianti, prende il file base firmato
 */

const fs       = require('fs');
const path     = require('path');
const pdfParse = require('pdf-parse');

const NOMI_MESI = [
  'gennaio','febbraio','marzo','aprile','maggio','giugno',
  'luglio','agosto','settembre','ottobre','novembre','dicembre'
];

function getPercorsoBase() {
  try {
    const cfg = JSON.parse(fs.readFileSync(
      path.join(__dirname,'..','config','tariffe.json'), 'utf8'
    ));
    return (cfg.ordiniVolo && cfg.ordiniVolo.percorso) || '\\\\napescara79\\ordini di volo';
  } catch(e) {
    return '\\\\napescara79\\ordini di volo';
  }
}

/**
 * Sceglie l'ultima versione firmata tra i file di una cartella giorno.
 * REGOLA: il file DEVE contenere "Firmato" nel nome (case-insensitive).
 */
function scegliUltimaVersione(files) {
  const pdf = files.filter(f => f.toLowerCase().endsWith('.pdf'));

  // FILTRO OBBLIGATORIO: solo file con "Firmato" nel nome
  const firmati = pdf.filter(f => /firmato/i.test(f));
  if (!firmati.length) return null; // Nessun file firmato → ignora giorno

  // Cerca varianti tra i firmati: file con VAR_N nel nome
  const varianti = firmati.filter(f => /VAR[_\s]*(\d+)/i.test(f));

  if (varianti.length > 0) {
    // Prendi la variante con numero VAR più alto
    varianti.sort((a, b) => {
      const nA = parseInt((a.match(/VAR[_\s]*(\d+)/i)||[0,0])[1]);
      const nB = parseInt((b.match(/VAR[_\s]*(\d+)/i)||[0,0])[1]);
      return nB - nA;
    });
    return varianti[0];
  }

  // Nessuna variante → prendi il primo file firmato
  return firmati[0];
}

/**
 * Verifica se il pilota è presente nell'ordine di volo come pilota effettivo.
 * Cerca il cognome seguito da ruolo pilota: (P), (IP), (2P), (CP)
 */
function pilotaPresente(testo, cognome) {
  if (!cognome || !testo) return false;
  const cog = cognome.toUpperCase().trim();
  const pattern = new RegExp(cog + '\\s*\\((?:P|IP|2P|CP)\\)', 'i');
  return pattern.test(testo);
}

/**
 * Calcola le spettanze colazione per ogni pilota nel mese.
 */
async function calcolaSpettanze(anno, meseIdx, cognomi) {
  const basePath = getPercorsoBase();
  const meseName = NOMI_MESI[meseIdx];
  const cartellaBase = path.join(basePath, String(anno), meseName);

  const risultati = {};
  const dettagli  = {}; // per debug: quali giorni ha volato
  cognomi.forEach(c => {
    risultati[c.toUpperCase()] = 0;
    dettagli[c.toUpperCase()]  = [];
  });

  if (!fs.existsSync(cartellaBase)) {
    throw new Error(`Cartella non trovata: ${cartellaBase}\nVerifica il percorso nelle Impostazioni.`);
  }

  const giorni = fs.readdirSync(cartellaBase)
    .filter(d => fs.statSync(path.join(cartellaBase, d)).isDirectory())
    .sort();

  let giorniAnalizzati = 0, giorniSenzaFirmato = 0;

  for (const giorno of giorni) {
    const cartellaGiorno = path.join(cartellaBase, giorno);
    const files = fs.readdirSync(cartellaGiorno);
    const ultimoFile = scegliUltimaVersione(files);

    if (!ultimoFile) {
      giorniSenzaFirmato++;
      console.log(`[ODV] Giorno ${giorno}: nessun file firmato trovato (${files.join(', ')})`);
      continue;
    }

    giorniAnalizzati++;
    const filePath = path.join(cartellaGiorno, ultimoFile);
    console.log(`[ODV] Giorno ${giorno}: analisi ${ultimoFile}`);

    try {
      const dataBuffer = fs.readFileSync(filePath);
      const data = await pdfParse(dataBuffer);
      const testo = data.text.toUpperCase();

      for (const cognome of cognomi) {
        if (pilotaPresente(testo, cognome)) {
          risultati[cognome.toUpperCase()]++;
          dettagli[cognome.toUpperCase()].push(giorno);
        }
      }
    } catch(e) {
      console.warn(`[ODV] Errore lettura ${filePath}: ${e.message}`);
    }
  }

  console.log(`[ODV] Analizzati: ${giorniAnalizzati} giorni (${giorniSenzaFirmato} senza firmato)`);
  return { spettanze: risultati, dettagli, giorniAnalizzati, giorniSenzaFirmato };
}

module.exports = { calcolaSpettanze, getPercorsoBase, NOMI_MESI };
