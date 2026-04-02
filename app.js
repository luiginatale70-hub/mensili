/**
 * ARCHIVIO NAAF — app.js
 * Server Express autonomo — porta 3001
 * Percorso: C:\Users\Administrator\PROGETTI-NAAF\PORTALE\ARCHIVIO NAAF\app.js
 */

const express    = require('express');
const path       = require('path');
const { engine } = require('express-handlebars');

const app  = express();
const PORT = process.env.PORT || 3001;

// ── View engine: Handlebars ───────────────────────────────────────────────────
app.engine('hbs', engine({
  extname:        '.hbs',
  defaultLayout:  'main',
  layoutsDir:     path.join(__dirname, 'views', 'layouts'),
  partialsDir:    path.join(__dirname, 'views', 'partials'),
  helpers: {
    // Helper: indice 1-based nelle tabelle {{index_plus_1}}
    index_plus_1: (idx) => idx + 1,
    // Helper: confronto uguale
    eq: (a, b) => a === b,
    // Helper: anno corrente
    annoCorrente: () => new Date().getFullYear(),
    // Helper: mese corrente
    meseCorrente: () => {
      const mesi = ['GENNAIO','FEBBRAIO','MARZO','APRILE','MAGGIO','GIUGNO',
                    'LUGLIO','AGOSTO','SETTEMBRE','OTTOBRE','NOVEMBRE','DICEMBRE'];
      return mesi[new Date().getMonth()];
    }
  }
}));
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// ── Routes ────────────────────────────────────────────────────────────────────
app.get('/', (req, res) => res.redirect('/mensile'));
app.use('/mensile', require('./routes/mensile'));

// ── Avvio server ──────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n✅  ARCHIVIO NAAF in ascolto su http://localhost:${PORT}`);
  console.log(`    Accesso LAN: http://10.142.3.123:${PORT}\n`);
});

module.exports = app;
