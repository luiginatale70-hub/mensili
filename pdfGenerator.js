/*
 pdfGenerator.js
 Generazione PDF Lettera Generi di Conforto
 Layout fedele documento originale
*/

const PDFDocument = require('pdfkit')
const path = require('path')

/*────────────────────────────
  COSTANTI PAGINA
────────────────────────────*/

const PAGE_W = 595.28
const PAGE_H = 841.89

const ML = 50
const MR = 50
const MT = 40

const BODY_W = PAGE_W - ML - MR

const STEMMA = path.resolve(__dirname, 'lsof/images/logo.png')

/*────────────────────────────
 BUFFER UTILITY
────────────────────────────*/

function docToBuffer(doc) {
  return new Promise((resolve, reject) => {
    const chunks = []
    doc.on('data', c => chunks.push(c))
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)
  })
}

/*────────────────────────────
 LETTERA GENERI CONFORTO
────────────────────────────*/

async function generaLettera(dati) {

  const doc = new PDFDocument({
    size: 'A4',
    margin: 0
  })

  const bufferPromise = docToBuffer(doc)

  let y = MT

  /*──────── STEMMA CENTRALE ────────*/

  try {
    doc.image(STEMMA, PAGE_W / 2 - 25, y, { width: 50 })
  } catch (e) {}

  y += 50

  /*──────── INTESTAZIONE CENTRATA ────────*/

  doc
    .font('Helvetica')
    .fontSize(11)
    .text('Ministero delle Infrastrutture e dei Trasporti', 0, y, {
      width: PAGE_W,
      align: 'center'
    })

  y += 16

  doc.text('Direzione Marittima', 0, y, {
    width: PAGE_W,
    align: 'center'
  })

  y += 16

  doc.text('Pescara', 0, y, {
    width: PAGE_W,
    align: 'center'
  })

  /*──────── DATA DESTRA ────────*/

  doc
    .fontSize(11)
    .text(`65131 Pescara, ${dati.dataLettera || ''}`, PAGE_W - 200, MT, {
      width: 150,
      align: 'right'
    })

  doc
    .moveTo(PAGE_W - 200, MT + 16)
    .lineTo(PAGE_W - 50, MT + 16)
    .stroke()

  y += 20

  /*──────── DESTINATARIO ────────*/

  const destX = PAGE_W - 240

  doc.fontSize(11)
  doc.text('Alla', destX - 30, y)

  doc
    .font('Helvetica-Bold')
    .text('DIREZIONE MARITTIMA', destX, y)

  y += 16

  doc
    .font('Helvetica')
    .text('Segreteria Gestione Contabile del personale', destX, y)

  y += 16

  doc.text('- P E S C A R A -', destX, y)

  y += 30

  /*──────── LINEA TRATTEGGIATA ────────*/

  doc
    .dash(2, { space: 2 })
    .moveTo(ML, y)
    .lineTo(PAGE_W - MR, y)
    .stroke()

  doc.undash()

  y += 15

  /*──────── UFFICIO ────────*/

  doc
    .font('Helvetica')
    .fontSize(11)
    .text('Nucleo Addestramento Ala Fissa', ML, y)

  y += 16

  doc.text('Mail: naaf@mit.gov.it', ML, y)

  y += 16

  doc.text("Posizione Titolario d'Archivio        All.: 1", ML, y)

  y += 28

  /*──────── OGGETTO ────────*/

  doc.font('Helvetica-Bold')
  doc.text('OGGETTO:', ML, y)

  doc
    .font('Helvetica')
    .text(`Generi di conforto. Personale N.A.A.F. – Mese ${dati.meseNome} ${dati.anno}.-`, ML + 80, y)

  y += 20

  doc
    .moveTo(ML, y)
    .lineTo(PAGE_W - MR, y)
    .stroke()

  y += 20

  /*──────── COLONNA PROTOCOLLI ────────*/

  const protocolWidth = 95
  const textStart = ML + protocolWidth + 15
  const textWidth = BODY_W - protocolWidth - 15

  doc
    .moveTo(ML + protocolWidth, y - 5)
    .lineTo(ML + protocolWidth, PAGE_H - 120)
    .stroke()

  doc
    .fontSize(9)
    .fillColor('#666666')
    .text('(Spazio riservato a protocolli, visti e decretazioni)', ML + 5, y, {
      width: protocolWidth - 10
    })

  doc.fillColor('#000000')

  /*──────── RIFERIMENTI ────────*/

  doc
    .font('Helvetica-Bold')
    .fontSize(11)
    .text('Riferimenti:', textStart, y)

  y += 18

  doc
    .font('Helvetica')
    .text('SMM - LOG - 020 Edizione luglio 2019;', textStart, y)

  y += 26

  /*──────── TESTO LETTERA ────────*/

  const testo1 =
    `Si trasmette, in allegato, l’elenco del personale di questo ` +
    `Nucleo Addestramento riportante le spettanze dei generi di conforto, ` +
    `come previsto dalla pubblicazione in riferimento, per il mese di ` +
    `${dati.meseNome} ${dati.anno}.`

  doc.text(testo1, textStart, y, {
    width: textWidth,
    align: 'justify'
  })

  y += doc.heightOfString(testo1, { width: textWidth }) + 12

  const testo2 =
    `Per questioni logistiche, trattandosi di personale sovente in missione, ` +
    `si chiede la somministrazione in contanti anziché in natura.`

  doc.text(testo2, textStart, y, {
    width: textWidth,
    align: 'justify'
  })

  y += doc.heightOfString(testo2, { width: textWidth }) + 60

  /*──────── FIRMA ────────*/

  const centerX = PAGE_W / 2

  doc
    .font('Helvetica-Bold')
    .text('IL CAPO NUCLEO', centerX - 80, y, {
      width: 160,
      align: 'center'
    })

  y += 28

  doc
    .font('Helvetica')
    .text(dati.capoNucleo || '', centerX - 150, y, {
      width: 300,
      align: 'center'
    })

  doc.end()

  return bufferPromise
}

/*────────────────────────────
 ENTRY POINT GENERATORE
────────────────────────────*/

async function genera(nomeTemplate, dati) {

  switch (nomeTemplate) {

    case 'generi-conforto-lettera':
      return generaLettera(dati)

    default:
      throw new Error(`Template PDF non riconosciuto: ${nomeTemplate}`)
  }
}

module.exports = { genera }