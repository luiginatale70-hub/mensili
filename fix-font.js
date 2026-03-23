/**
 * fix-font.js
 * Cambia tutti i fontSize nella funzione generaLettera a 12
 * Esegui con: node fix-font.js
 */

const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, 'utils', 'pdfGenerator.js');

let content = fs.readFileSync(FILE, 'utf8');

// Trova la sezione generaLettera (da "async function generaLettera" a "async function generaAllegato")
const inizioLettera = content.indexOf('async function generaLettera');
const inizioAllegato = content.indexOf('async function generaAllegato');

if (inizioLettera === -1 || inizioAllegato === -1) {
  console.error('ERRORE: funzioni non trovate nel file');
  process.exit(1);
}

const prima    = content.substring(0, inizioLettera);
const lettera  = content.substring(inizioLettera, inizioAllegato);
const dopo     = content.substring(inizioAllegato);

// Sostituisce tutti i fontSize(X) con fontSize(12) SOLO nella sezione lettera
// Esclude fontSize(6) del box firma digitale (troppo piccolo per testo normale)
const letteraFixed = lettera
  .replace(/\.fontSize\((?!6\b)(?!12\b)\d+(\.\d+)?\)/g, '.fontSize(12)');

// Conta sostituzioni
const originali  = (lettera.match(/\.fontSize\(\d+(\.\d+)?\)/g) || []);
const modificati = (letteraFixed.match(/\.fontSize\(\d+(\.\d+)?\)/g) || []);
const cambiati   = originali.filter(f => f !== '.fontSize(12)' && f !== '.fontSize(6)');

console.log('\n=== fix-font.js ===');
console.log(`File: ${FILE}`);
console.log(`fontSize trovati nella lettera: ${originali.length}`);
console.log(`Modificati a fontSize(12):      ${cambiati.length}`);
console.log(`Lasciati invariati (12 o 6):    ${originali.length - cambiati.length}`);

if (cambiati.length === 0) {
  console.log('\nNessuna modifica necessaria — tutti i fontSize sono già corretti.');
  process.exit(0);
}

// Mostra cosa viene cambiato
console.log('\nModifiche:');
cambiati.forEach(f => console.log(`  ${f}  →  .fontSize(12)`));

// Backup
const backup = FILE + '.backup';
fs.writeFileSync(backup, content, 'utf8');
console.log(`\nBackup salvato: ${backup}`);

// Scrivi file modificato
fs.writeFileSync(FILE, prima + letteraFixed + dopo, 'utf8');
console.log('File aggiornato con successo!');
console.log('\nRiavvia il server: npm start\n');
