const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');

const NOMI_MESI = [
  '01 GENNAIO','02 FEBBRAIO','03 MARZO','04 APRILE','05 MAGGIO','06 GIUGNO',
  '07 LUGLIO','08 AGOSTO','09 SETTEMBRE','10 OTTOBRE','11 NOVEMBRE','12 DICEMBRE'
];

function getPercorsoBase() {
  try {
    const cfg = JSON.parse(fs.readFileSync(
      path.join(__dirname,'..','config','tariffe.json'), 'utf8'
    ));
    return (cfg.ordiniVolo && cfg.ordiniVolo.percorso) || '/home/luigi/Scaricati/ordini di volo';
  } catch(e) {
    return '/home/luigi/Scaricati/ordini di volo';
  }
}

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
 * ESTRAE SOLO BLOCCO NOMINATIVI (TRA "Nominativo" E "Note")
 */
function estraiSezioneNominativi(testo) {
  const t = testo.toUpperCase();

  const start = t.indexOf('NOMINATIVO');
  if (start === -1) return t;

  const end = t.indexOf('NOTE', start);
  if (end === -1) return t.slice(start);

  return t.slice(start, end);
}

/**
 * MATCH PRECISO SU PAROLE
 */
function pilotaPresente(testo, cognome) {
  if (!cognome || !testo) return false;

  const cog = cognome.toUpperCase().trim();
  const t = testo.toUpperCase();

  // match cognome con grado davanti e ruolo pilota
  const re = new RegExp(
    `(?:^|\\s)(?:[0-9°A-Z]+\\s+)*${cog}\\s*\\((P|IP|2P|CP)\\)`,
    'i'
  );

  const trovato = re.test(t);

  if (trovato) console.log("COLAZIONE MATCH:", cog);

  return trovato;
}

/**
 * REPERIBILITÀ (già funzionante)
 */
function estraiEquipaggioP42(testo) {
  const t = testo.toUpperCase();

  const startAllarme = t.indexOf("SERVIZIO DI ALLARME");
  if (startAllarme === -1) return [];

  const startEquip = t.indexOf("EQUIPAGGIO", startAllarme);
  if (startEquip === -1) return [];

  const end = t.indexOf("EQUIPAGGIAMENTI OPERATIVI", startEquip);

  const blocco = end !== -1
    ? t.slice(startEquip, end)
    : t.slice(startEquip);

  if (blocco.includes("ALLARME SOSPESO")) {
    console.log("P42: ALLARME SOSPESO");
    return [];
  }

  const righe = blocco.split("\n");

 const re = /^([0-9°A-ZÀ-ÖØ-Ý]+(?:\s+[0-9°A-ZÀ-ÖØ-Ý]+)*)\s*\((P|IP|2P|CP|OV|TEV|ASAV|AOV|ARS|CV|EV|IS)\)/;
  const trovati = [];

  for (const riga of righe) {
    const r = riga.trim();

    const match = r.match(re);
    if (match) {
      let nomeCompleto = match[1].trim();

// rimuove grado iniziale (CF, CC, STV, LGT, ecc)
nomeCompleto = nomeCompleto.replace(/^(CF|CC|TV|LGT|SGT|STV|1°LGT|1°\s*LGT)\s+/g, '');

trovati.push(nomeCompleto);
    }
  }

  console.log("P42 TROVATI:", trovati);

  return trovati;
}

function personaleInAllarmeP42(testo, cognome) {
  if (!cognome || !testo) return false;

  const equipaggio = estraiEquipaggioP42(testo);

  const normalizza = (s) =>
    s.toUpperCase()
     .replace(/^(CF|CC|TV|LGT|SGT|STV)\s+/, '')
     .replace(/\s+/g, ' ')
     .trim();

  const cog = normalizza(cognome);

return equipaggio.some(nome => {
  const n = normalizza(nome);

  if (n === cog) return true;

  const parti = n.split(" ");

  const prefissi = ["DI", "DE", "DEL", "DELLA", "D'"];

  // escludi cognomi composti con prefisso
  if (parti.length > 1 && prefissi.includes(parti[0])) {
    return false;
  }

  // match cognome semplice
  return parti[parti.length - 1] === cog;
});
 }
async function analizzaMese(anno, meseIdx, cognomi, checkFn) {
  const basePath = getPercorsoBase();
  const meseName = NOMI_MESI[meseIdx];
  const cartellaBase = path.join(basePath, String(anno), meseName);

  const risultati = {}, dettagli = {};
  cognomi.forEach(c => {
    risultati[c.toUpperCase()] = 0;
    dettagli[c.toUpperCase()] = [];
  });

  const giorni = fs.readdirSync(cartellaBase)
    .filter(d => fs.statSync(path.join(cartellaBase, d)).isDirectory())
    .sort();

  for (const giorno of giorni) {
    const cartellaGiorno = path.join(cartellaBase, giorno);
    const files = fs.readdirSync(cartellaGiorno);
    const ultimoFile = scegliUltimaVersione(files);

    if (!ultimoFile) continue;

    try {
      const buffer = fs.readFileSync(path.join(cartellaGiorno, ultimoFile));
      const data = await pdfParse(buffer);
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

  return { spettanze: risultati, dettagli };
}

async function calcolaSpettanze(anno, meseIdx, cognomi) {
  return analizzaMese(anno, meseIdx, cognomi, pilotaPresente);
}

async function calcolaReperibilita(anno, meseIdx, cognomi) {
  return analizzaMese(anno, meseIdx, cognomi, personaleInAllarmeP42);
}

module.exports = {
  calcolaSpettanze,
  calcolaReperibilita,
  getPercorsoBase,
  NOMI_MESI
};