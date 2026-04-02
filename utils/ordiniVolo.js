/**
 * ordiniVolo.js
 * Calcola spettanze colazione e giorni reperibilità
 * analizzando gli ordini di volo firmati del mese.
 *
 * Struttura: PERCORSO_BASE\ANNO\MESE\GIORNO\file_Firmato.pdf
 * Regole selezione file:
 *   1. Il file DEVE contenere "Firmato" nel nome
 *   2. Tra i firmati, prende quello con VAR numero più alto
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
 * Sceglie l'ultima versione FIRMATA tra i file di una cartella giorno.
 * REGOLA: il file DEVE contenere "Firmato" nel nome.
 * Tra i firmati, prende quello con VAR numero più alto.
 */
function scegliUltimaVersione(files) {
  const pdf = files.filter(f => f.toLowerCase().endsWith('.pdf'));
  const firmati = pdf.filter(f => /firmato/i.test(f));
  if (!firmati.length) return null;

  const varianti = firmati.filter(f => /VAR[_\s]*(\d+)/i.test(f));
  if (varianti.length > 0) {
    varianti.sort((a, b) => {
      const nA = parseInt((a.match(/VAR[_\s]*(\d+)/i)||[0,0])[1]);
      const nB = parseInt((b.match(/VAR[_\s]*(\d+)/i)||[0,0])[1]);
      return nB - nA;
    });
    return varianti[0];
  }
  return firmati[0];
}

/**
 * Verifica se il pilota è nella colonna Piloti con ruolo (P),(IP),(2P),(CP)
 */
function pilotaPresente(testo, cognome) {
  if (!cognome || !testo) return false;
  const cog = cognome.toUpperCase().trim();
  const pattern = new RegExp(cog + '\\s*\\((?:P|IP|2P|CP)\\)', 'i');
  return pattern.test(testo.toUpperCase());
}

/**
 * Estrae i nominativi dall'equipaggio P-42 nella sezione SERVIZIO DI ALLARME.
 */
function estraiEquipaggioP42(testo) {
  const t = testo.toUpperCase();

  if (/ALLARME\s+SOSPESO/.test(t)) return [];

  const idxAllarme = t.indexOf('SERVIZIO DI ALLARME');
  if (idxAllarme === -1) return [];

  const idxEquip = t.indexOf('EQUIPAGGIAMENTI OPERATIVI');
  const blocco = idxEquip !== -1 ? t.slice(idxAllarme, idxEquip) : t.slice(idxAllarme);

  const idxP42 = blocco.indexOf('P-42');
  if (idxP42 === -1) return [];

  const idxPH139 = blocco.indexOf('PH-139', idxP42);
  const sezioneP42 = idxPH139 !== -1 ? blocco.slice(idxP42, idxPH139) : blocco.slice(idxP42);

  // Se sezione vuota o solo "//" è sospeso
  const contenuto = sezioneP42.replace(/P-42|MANTA|IN CAMPO|IN REPERIBILIT[A\u00C0]|\d{2}:\d{2}|\(\d+\)|[\/\-]/g,'').trim();
  if (!contenuto || contenuto.length < 10) return [];

  const re = /([A-Z][A-Z\u00C0-\u00D6\u00D8-\u00F6\s\u00B0\u00AA\d\.]+?)\s*\((?:P|IP|2P|CP|OV|TEV|ASAV|AOV|ARS|CV|EV|IS)\)/g;
  const trovati = [];
  let m;
  while ((m = re.exec(sezioneP42)) !== null) {
    const nome = m[1].trim();
    if (nome.length > 2) trovati.push(nome);
  }
  return trovati;
}

/**
 * Verifica se il cognome del personale NAAF è nell'equipaggio P-42 allarme
 */
function personaleInAllarmeP42(testo, cognome) {
  if (!cognome || !testo) return false;
  const equipaggio = estraiEquipaggioP42(testo);
  const cog = cognome.toUpperCase().trim();
  return equipaggio.some(nome => nome.includes(cog));
}

/**
 * Funzione generica per analizzare tutti i giorni del mese
 */
async function analizzaMese(anno, meseIdx, cognomi, checkFn) {
  const basePath = getPercorsoBase();
  const meseName = NOMI_MESI[meseIdx];
  const cartellaBase = path.join(basePath, String(anno), meseName);

  const risultati = {}, dettagli = {};
  cognomi.forEach(c => { risultati[c.toUpperCase()] = 0; dettagli[c.toUpperCase()] = []; });

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

    if (!ultimoFile) { giorniSenzaFirmato++; continue; }
    giorniAnalizzati++;

    try {
      const data = await pdfParse(fs.readFileSync(path.join(cartellaGiorno, ultimoFile)));
      const testo = data.text;
      for (const cognome of cognomi) {
        if (checkFn(testo, cognome)) {
          risultati[cognome.toUpperCase()]++;
          dettagli[cognome.toUpperCase()].push(giorno);
        }
      }
    } catch(e) {
      console.warn(`[ODV] Errore ${ultimoFile}: ${e.message}`);
    }
  }

  return { spettanze: risultati, dettagli, giorniAnalizzati, giorniSenzaFirmato };
}

/**
 * Calcola spettanze colazione (presenza come pilota nei voli)
 */
async function calcolaSpettanze(anno, meseIdx, cognomi) {
  return analizzaMese(anno, meseIdx, cognomi, pilotaPresente);
}

/**
 * Calcola giorni reperibilità (presenza equipaggio P-42 allarme)
 */
async function calcolaReperibilita(anno, meseIdx, cognomi) {
  return analizzaMese(anno, meseIdx, cognomi, personaleInAllarmeP42);
}

module.exports = { calcolaSpettanze, calcolaReperibilita, getPercorsoBase, NOMI_MESI };
