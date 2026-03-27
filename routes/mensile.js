/**
 * ARCHIVIO NAAF — routes/mensile.js v2
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
const GIORNI_MESE = [31,28,31,30,31,30,31,31,30,31,30,31];

function giorniMese(meseIdx, anno) {
  if (parseInt(meseIdx) === 1) {
    const a = parseInt(anno);
    return ((a%4===0 && a%100!==0) || a%400===0) ? 29 : 28;
  }
  return GIORNI_MESE[parseInt(meseIdx)];
}

function leggiConfig(file) {
  try {
    return JSON.parse(fs.readFileSync(path.join(__dirname,'..','config',file),'utf8'));
  } catch(e) { console.error('[CONFIG]',e.message); return {}; }
}

function salvaConfig(file, obj) {
  fs.writeFileSync(
    path.join(__dirname,'..','config',file),
    JSON.stringify(obj, null, 2),
    'utf8'
  );
}

// ── API: config ───────────────────────────────────────────────────────────────
router.get('/api/config', (req, res) => {
  res.json({ personale: leggiConfig('personale.json'), tariffe: leggiConfig('tariffe.json') });
});

// ── API: giorni mese ──────────────────────────────────────────────────────────
router.get('/api/giorni', (req, res) => {
  res.json({ giorni: giorniMese(req.query.mese, req.query.anno) });
});

// ── Dashboard ─────────────────────────────────────────────────────────────────
router.get('/', (req, res) => {
  const ora = new Date();
  res.render('mensile/index', {
    title: 'Modulo MENSILE',
    anno: ora.getFullYear(),
    mese: MESI[ora.getMonth()]
  });
});

// ── GENERI DI CONFORTO — form ─────────────────────────────────────────────────
router.get('/generi-conforto', (req, res) => {
  const ora = new Date();
  res.render('mensile/generi-conforto', {
    title: 'Generi di Conforto',
    anno: ora.getFullYear(),
    meseIdx: ora.getMonth(),
    mese: MESI[ora.getMonth()],
    mesi: MESI
  });
});

// ── GENERI DI CONFORTO — genera PDF ──────────────────────────────────────────
router.post('/generi-conforto/genera', async (req, res) => {
  try {
    const dati    = req.body;
    const anno    = dati.anno || new Date().getFullYear();
    const meseNome = MESI[parseInt(dati.meseIdx)] || MESI[new Date().getMonth()];

    const piloti = (dati.piloti||[]).map(p => ({
      ...p,
      giorniGeneri:     parseInt(p.giorniGeneri)||0,
      importoGeneri:    parseFloat(p.importoGeneri)||0,
      giorniColazione:  parseInt(p.giorniColazione)||0,
      importoColazione: parseFloat(p.importoColazione)||0,
      totale: (parseFloat(p.importoGeneri)||0)+(parseFloat(p.importoColazione)||0)
    }));
    const equipaggi = (dati.equipaggi||[]).map(e => ({
      ...e,
      giorniGeneri:  parseInt(e.giorniGeneri)||0,
      importoGeneri: parseFloat(e.importoGeneri)||0
    }));

    const totalePiloti    = piloti.reduce((s,p)=>s+p.totale,0);
    const totaleEquipaggi = equipaggi.reduce((s,e)=>s+(parseFloat(e.importoGeneri)||0),0);

    const payload = {
      anno, meseNome,
      capoNucleo:      dati.capoNucleo||'',
      piloti, equipaggi,
      totalePiloti:    totalePiloti.toFixed(2),
      totaleEquipaggi: totaleEquipaggi.toFixed(2),
      totaleGenerale:  (totalePiloti+totaleEquipaggi).toFixed(2),
      dataLettera:     dati.dataLettera||new Date().toLocaleDateString('it-IT')
    };

    const pdfLettera  = await pdfGen.genera('generi-conforto-lettera',  payload);
    const pdfAllegato = await pdfGen.genera('generi-conforto-allegato', payload);

    const nomeLettera  = `generi-conforto-lettera_${meseNome}-${anno}.pdf`;
    const nomeAllegato = `generi-conforto-allegato_${meseNome}-${anno}.pdf`;

    const destLettera  = archivio.salva(anno, meseNome, nomeLettera,  pdfLettera);
    const destAllegato = archivio.salva(anno, meseNome, nomeAllegato, pdfAllegato);

    res.json({
      ok: true,
      files: [
        { nome: `Lettera — Generi di Conforto ${meseNome} ${anno}`, path: destLettera,  nome_file: nomeLettera  },
        { nome: `Allegato — ${meseNome} ${anno}`,                   path: destAllegato, nome_file: nomeAllegato }
      ]
    });
  } catch(err) {
    console.error('[MENSILE]', err);
    res.status(500).json({ ok: false, errore: err.message });
  }
});

// ── VIEW PDF (anteprima inline) ───────────────────────────────────────────────
router.get('/view', (req, res) => {
  const filePath = req.query.path;
  if (!filePath || !fs.existsSync(filePath))
    return res.status(404).send('File non trovato');
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="${path.basename(filePath)}"`);
  fs.createReadStream(filePath).pipe(res);
});

// ── DOWNLOAD PDF ──────────────────────────────────────────────────────────────
router.get('/download', (req, res) => {
  const filePath = req.query.path;
  if (!filePath || !fs.existsSync(filePath))
    return res.status(404).send('File non trovato');
  res.download(filePath);
});

// ══════════════════════════════════════════════════════════════════════════════
// IMPOSTAZIONI — Gestione personale.json e tariffe.json
// ══════════════════════════════════════════════════════════════════════════════

router.get('/impostazioni', (req, res) => {
  res.render('mensile/impostazioni', {
    title: 'Impostazioni',
    personale: leggiConfig('personale.json'),
    tariffe:   leggiConfig('tariffe.json')
  });
});

// API: salva personale
router.post('/api/salva-personale', (req, res) => {
  try {
    const { capoNucleo, piloti, efv } = req.body;
    const cfg = leggiConfig('personale.json');
    if (capoNucleo !== undefined) cfg.capoNucleo = capoNucleo;
    if (piloti     !== undefined) cfg.piloti     = piloti;
    if (efv        !== undefined) cfg.efv        = efv;
    salvaConfig('personale.json', cfg);
    res.json({ ok: true });
  } catch(e) {
    res.status(500).json({ ok: false, errore: e.message });
  }
});

// API: salva tariffe
router.post('/api/salva-tariffe', (req, res) => {
  try {
    const cfg = leggiConfig('tariffe.json');
    if (req.body.generiConforto)       cfg.generiConforto       = req.body.generiConforto;
    if (req.body.colazioneObbligatoria) cfg.colazioneObbligatoria = req.body.colazioneObbligatoria;
    salvaConfig('tariffe.json', cfg);
    res.json({ ok: true });
  } catch(e) {
    res.status(500).json({ ok: false, errore: e.message });
  }
});


// ══════════════════════════════════════════════════════════════════════════════
// PIA — Pronto Intervento Aereo
// ══════════════════════════════════════════════════════════════════════════════
const pdfPIA = require('../utils/pdfGeneratorPIA');

const MESI_PIA = [
  'GENNAIO','FEBBRAIO','MARZO','APRILE','MAGGIO','GIUGNO',
  'LUGLIO','AGOSTO','SETTEMBRE','OTTOBRE','NOVEMBRE','DICEMBRE'
];

router.get('/pia', (req, res) => {
  const ora = new Date();
  res.render('mensile/pia', {
    title: 'Pronto Intervento Aereo',
    anno: ora.getFullYear(),
    meseIdx: ora.getMonth()
  });
});

router.post('/pia/genera', async (req, res) => {
  try {
    const dati     = req.body;
    const anno     = dati.anno || new Date().getFullYear();
    const meseNome = MESI_PIA[parseInt(dati.meseIdx)] || MESI_PIA[new Date().getMonth()];

    const payload = {
      anno, meseNome,
      protocollo:   dati.protocollo||'',
      capoNucleo:   dati.capoNucleo||'',
      firmaAssente: dati.firmaAssente===true||dati.firmaAssente==='true',
      sostituito:   dati.sostituito||'',
      sostituto:    dati.sostituto||'',
      pia:          dati.pia||[],
      istruttori:   dati.istruttori||[],
      efv:          dati.efv||[],
      assenze:      dati.assenze||[],
    };

    const nomi = [
      { tpl:'pia-lettera',    nome:`pia-lettera_${meseNome}-${anno}.pdf`,    label:'Lettera PIA' },
      { tpl:'pia-elenco',     nome:`pia-elenco_${meseNome}-${anno}.pdf`,     label:'Elenco P.I.A.' },
      { tpl:'pia-istruttori', nome:`pia-istruttori_${meseNome}-${anno}.pdf`, label:'Istruttori' },
      { tpl:'pia-efv',        nome:`pia-efv_${meseNome}-${anno}.pdf`,        label:'EFV' },
      { tpl:'pia-assenze',    nome:`pia-assenze_${meseNome}-${anno}.pdf`,    label:'Statino Assenze' },
    ];

    const files = [];
    for (const item of nomi) {
      const pdfBuf = await pdfPIA.genera(item.tpl, payload);
      const dest   = archivio.salva(anno, meseNome, item.nome, pdfBuf);
      files.push({ nome: `${item.label} — ${meseNome} ${anno}`, path: dest, nome_file: item.nome });
    }

    res.json({ ok: true, files });
  } catch(err) {
    console.error('[PIA]', err);
    res.status(500).json({ ok: false, errore: err.message });
  }
});


// ══════════════════════════════════════════════════════════════════════════════
// COLAZIONE PILOTI
// ══════════════════════════════════════════════════════════════════════════════
const pdfColazione = require('../utils/pdfGeneratorColazione');

router.get('/colazione', (req, res) => {
  const ora = new Date();
  res.render('mensile/colazione', {
    title: 'Colazione Obbligatoria Piloti',
    anno: ora.getFullYear(),
    meseIdx: ora.getMonth()
  });
});

router.post('/colazione/genera', async (req, res) => {
  try {
    const dati     = req.body;
    const anno     = dati.anno || new Date().getFullYear();
    const meseNome = MESI[parseInt(dati.meseIdx)] || MESI[new Date().getMonth()];

    const payload = {
      anno, meseNome,
      protocollo:   dati.protocollo||'',
      dataStatino:  dati.dataStatino||'',
      capoNucleo:   dati.capoNucleo||'',
      firmaAssente: dati.firmaAssente===true||dati.firmaAssente==='true',
      sostituito:   dati.sostituito||'',
      sostituto:    dati.sostituto||'',
      piloti:       dati.piloti||[],
    };

    const nomi = [
      { tpl:'colazione-lettera', nome:`colazione-lettera_${meseNome}-${anno}.pdf`, label:'Lettera Colazione' },
      { tpl:'colazione-statino', nome:`colazione-statino_${meseNome}-${anno}.pdf`, label:'Statino Colazione' },
    ];

    const files = [];
    for (const item of nomi) {
      const pdfBuf = await pdfColazione.genera(item.tpl, payload);
      const dest   = archivio.salva(anno, meseNome, item.nome, pdfBuf);
      files.push({ nome: `${item.label} — ${meseNome} ${anno}`, path: dest, nome_file: item.nome });
    }

    res.json({ ok: true, files });
  } catch(err) {
    console.error('[COLAZIONE]', err);
    res.status(500).json({ ok: false, errore: err.message });
  }
});


// ── API: calcola spettanze colazione dagli ordini di volo ─────────────────────
router.post('/api/calcola-spettanze', async (req, res) => {
  try {
    const { anno, meseIdx, cognomi } = req.body;
    const ordini = require('../utils/ordiniVolo');
    const risultato = await ordini.calcolaSpettanze(
      parseInt(anno),
      parseInt(meseIdx),
      cognomi || []
    );
    res.json({
      ok: true,
      spettanze:         risultato.spettanze,
      dettagli:          risultato.dettagli,
      giorniAnalizzati:  risultato.giorniAnalizzati,
      giorniSenzaFirmato: risultato.giorniSenzaFirmato
    });
  } catch(err) {
    console.error('[SPETTANZE]', err.message);
    res.status(500).json({ ok: false, errore: err.message });
  }
});


// REPERIBILITÀ MENSILE
const pdfRep = require('../utils/pdfGeneratorReperibilita');
router.get('/reperibilita', (req, res) => {
  const ora = new Date();
  res.render('mensile/reperibilita', { title:'Reperibilità Mensile', anno:ora.getFullYear(), meseIdx:ora.getMonth() });
});
router.post('/api/calcola-reperibilita', async (req, res) => {
  try {
    const {anno,meseIdx,cognomi} = req.body;
    const ordini = require('../utils/ordiniVolo');
    const r = await ordini.calcolaReperibilita(parseInt(anno),parseInt(meseIdx),cognomi||[]);
    res.json({ok:true,spettanze:r.spettanze,dettagli:r.dettagli,giorniAnalizzati:r.giorniAnalizzati,giorniSenzaFirmato:r.giorniSenzaFirmato});
  } catch(e){ res.status(500).json({ok:false,errore:e.message}); }
});
router.post('/reperibilita/genera', async (req, res) => {
  try {
    const dati=req.body, anno=dati.anno||new Date().getFullYear();
    const MESI=['GENNAIO','FEBBRAIO','MARZO','APRILE','MAGGIO','GIUGNO','LUGLIO','AGOSTO','SETTEMBRE','OTTOBRE','NOVEMBRE','DICEMBRE'];
    const meseNome=MESI[parseInt(dati.meseIdx)]||MESI[new Date().getMonth()];
    let capoNucleo=dati.capoNucleo||'';
    if(!capoNucleo){ try{ const p=JSON.parse(fs.readFileSync(path.join(__dirname,'..','config','personale.json'),'utf8')); capoNucleo=(p.capoNucleo||[])[0]||''; }catch(e){} }
    const payload={anno,meseNome,personale:dati.personale||[],capoNucleo};
    const pdfBuf=await pdfRep.genera('reperibilita-report',payload);
    const nome='reperibilita_'+meseNome+'-'+anno+'.pdf';
    const dest=archivio.salva(anno,meseNome,nome,pdfBuf);
    res.json({ok:true,files:[{nome:'Report Reperibilità — '+meseNome+' '+anno,path:dest,nome_file:nome}]});
  } catch(e){ console.error('[REP]',e); res.status(500).json({ok:false,errore:e.message}); }
});

module.exports = router;
