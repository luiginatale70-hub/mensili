/**
 * ARCHIVIO NAAF — routes/mensile.js
 * Router principale — nessun controllo sessione (accesso libero in LAN)
 */

const express  = require('express');
const router   = express.Router();
const path     = require('path');
const fs       = require('fs');
const pdfGen   = require('../utils/pdfGenerator');
const archivio = require('../utils/archivioManager');

const MESI = [
  'GENNAIO','FEBBRAIO','MARZO','APRILE','MAGGIO','GIUGNO',
  'LUGLIO','AGOSTO','SETTEMBRE','OTTOBRE','NOVEMBRE','DICEMBRE'
];

// ── Dashboard ─────────────────────────────────────────────────────────────────
router.get('/', (req, res) => {
  const ora = new Date();
  res.render('mensile/index', {
    title: 'Modulo MENSILE',
    anno:  ora.getFullYear(),
    mese:  MESI[ora.getMonth()]
  });
});

// ── GENERI DI CONFORTO — form ─────────────────────────────────────────────────
router.get('/generi-conforto', (req, res) => {
  const ora = new Date();
  res.render('mensile/generi-conforto', {
    title:   'Generi di Conforto',
    anno:    ora.getFullYear(),
    meseIdx: ora.getMonth(),
    mese:    MESI[ora.getMonth()],
    mesi:    MESI
  });
});

// ── GENERI DI CONFORTO — genera PDF ──────────────────────────────────────────
router.post('/generi-conforto/genera', async (req, res) => {
  try {
    const dati     = req.body;
    const anno     = dati.anno || new Date().getFullYear();
    const meseNome = MESI[parseInt(dati.meseIdx)] || MESI[new Date().getMonth()];

    // Calcola importi e totali
    const piloti = (dati.piloti || []).map(p => ({
      ...p,
      giorniGeneri:     parseInt(p.giorniGeneri)     || 0,
      importoGeneri:    parseFloat(p.importoGeneri)  || 0,
      giorniColazione:  parseInt(p.giorniColazione)  || 0,
      importoColazione: parseFloat(p.importoColazione) || 0,
      totale: (parseFloat(p.importoGeneri) || 0) + (parseFloat(p.importoColazione) || 0)
    }));

    const equipaggi = (dati.equipaggi || []).map(e => ({
      ...e,
      giorniGeneri:  parseInt(e.giorniGeneri)    || 0,
      importoGeneri: parseFloat(e.importoGeneri) || 0
    }));

    const totalePiloti    = piloti.reduce((s, p) => s + p.totale, 0);
    const totaleEquipaggi = equipaggi.reduce((s, e) => s + (parseFloat(e.importoGeneri) || 0), 0);
    const totaleGenerale  = totalePiloti + totaleEquipaggi;

    const payload = {
      anno, meseNome,
      capoNucleo:      dati.capoNucleo || 'C.F. (CP) Pil. Marco Massimo di NARDO',
      piloti,
      equipaggi,
      totalePiloti:    totalePiloti.toFixed(2),
      totaleEquipaggi: totaleEquipaggi.toFixed(2),
      totaleGenerale:  totaleGenerale.toFixed(2),
      dataLettera:     dati.dataLettera || new Date().toLocaleDateString('it-IT')
    };

    // Genera i 2 PDF
    const pdfLettera  = await pdfGen.genera('generi-conforto-lettera',  payload);
    const pdfAllegato = await pdfGen.genera('generi-conforto-allegato', payload);

    // Archivia in ARCHIVIO\ANNO\MESE\
    const nomeLettera  = `generi-conforto-lettera_${meseNome}-${anno}.pdf`;
    const nomeAllegato = `generi-conforto-allegato_${meseNome}-${anno}.pdf`;

    const destLettera  = archivio.salva(anno, meseNome, nomeLettera,  pdfLettera);
    const destAllegato = archivio.salva(anno, meseNome, nomeAllegato, pdfAllegato);

    res.json({
      ok: true,
      files: [
        { nome: `Lettera — Generi di Conforto ${meseNome} ${anno}`,  path: destLettera,  nome_file: nomeLettera  },
        { nome: `Allegato Tabella — ${meseNome} ${anno}`,            path: destAllegato, nome_file: nomeAllegato }
      ]
    });

  } catch (err) {
    console.error('[MENSILE] Errore generazione PDF:', err);
    res.status(500).json({ ok: false, errore: err.message });
  }
});

// ── Download PDF archiviato ───────────────────────────────────────────────────
router.get('/download', (req, res) => {
  const filePath = req.query.path;
  if (!filePath || !fs.existsSync(filePath)) {
    return res.status(404).send('File non trovato');
  }
  res.download(filePath);
});

module.exports = router;
