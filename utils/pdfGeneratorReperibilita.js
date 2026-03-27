/**
 * pdfGeneratorReperibilita.js
 * Genera report reperibilità mensile P-42
 */
const PDFDocument = require('pdfkit');
const path = require('path');
const fs   = require('fs');

const mm = v => v * 2.8346;
const PG_W = mm(210), PG_H = mm(297);
const MAR_L = mm(17), MAR_R = mm(17), MAR_T = mm(15);
const BODY_W = PG_W - MAR_L - MAR_R;
const F = 'Helvetica', FB = 'Helvetica-Bold';

function docToBuffer(doc){
  return new Promise((resolve,reject)=>{
    const chunks=[];
    doc.on('data',c=>chunks.push(c));
    doc.on('end',()=>resolve(Buffer.concat(chunks)));
    doc.on('error',e=>reject(e));
  });
}
function border(doc,x,y,w,h,lw=0.4){
  doc.save().rect(x,y,w,h).lineWidth(lw).stroke('#000').restore();
}
function solidLine(doc,x1,y,x2,lw=0.5){
  doc.save().moveTo(x1,y).lineTo(x2,y).lineWidth(lw).stroke('#000').restore();
}

async function generaReport(dati){
  const doc = new PDFDocument({size:[PG_W,PG_H], margin:0});
  const buf = docToBuffer(doc);

  let y = MAR_T;

  // Intestazione
  doc.font(FB).fontSize(12).fillColor('#000')
     .text('DIREZIONE MARITTIMA DI PESCARA', MAR_L, y, {width:BODY_W, align:'center'}); y+=mm(7);
  doc.font(FB).fontSize(12)
     .text('NUCLEO ADDESTRAMENTO ALA FISSA', MAR_L, y, {width:BODY_W, align:'center'}); y+=mm(12);

  doc.font(FB).fontSize(14)
     .text('REPORT REPERIBILITA\u2019 MENSILE', MAR_L, y, {width:BODY_W, align:'center'}); y+=mm(7);
  doc.font(FB).fontSize(13)
     .text('Servizio di Allarme P-42', MAR_L, y, {width:BODY_W, align:'center'}); y+=mm(5);

  doc.font(F).fontSize(12)
     .text('Mese di ', MAR_L, y, {width:BODY_W, align:'center', continued:true})
     .text(dati.meseNome+' '+dati.anno, {underline:true, continued:false}); y+=mm(12);

  solidLine(doc, MAR_L, y, PG_W-MAR_R); y+=mm(8);

  // Testo descrittivo
  const testo = 'Il presente report riepiloga i giorni di reperibilit\u00e0 effettuati dal personale del Nucleo Addestramento Ala Fissa nell\u2019ambito del Servizio di Allarme P-42, nel mese di '+dati.meseNome+' '+dati.anno+', rilevati dagli Ordini di Volo firmati.';
  doc.font(F).fontSize(11).text(testo, MAR_L, y, {width:BODY_W, align:'justify'}); y+=mm(14);

  // Tabella
  const cols = [mm(10), mm(52), mm(42), mm(40), mm(32)];
  const hdr  = ['#', 'Grado', 'Cognome', 'Nome', 'Giorni Rep.'];

  // Header tabella
  let x = MAR_L;
  cols.forEach(function(w,i){
    border(doc, x, y, w, mm(10));
    doc.font(FB).fontSize(10).fillColor('#000')
       .text(hdr[i], x+mm(1.5), y+mm(3), {width:w-mm(3), align: i===4 ? 'center' : 'left', lineBreak:false});
    x += w;
  });
  y += mm(10);

  // Righe
  var totale = 0;
  (dati.personale||[]).forEach(function(p, i){
    var x2 = MAR_L;
    var vals = [String(i+1), p.grado||'', p.cognome||'', p.nome||'', String(p.giorni||0)];
    cols.forEach(function(w,j){
      border(doc, x2, y, w, mm(9));
      doc.font(j===4 ? FB : F).fontSize(10).fillColor('#000')
         .text(vals[j], x2+mm(1.5), y+mm(2.5),
               {width:w-mm(3), align: j===4 ? 'center' : 'left', lineBreak:false, ellipsis:true});
      x2 += w;
    });
    totale += parseInt(p.giorni)||0;
    y += mm(9);
  });

  // Riga totale
  const xTotLabel = MAR_L + cols[0] + cols[1] + cols[2] + cols[3];
  solidLine(doc, MAR_L, y, MAR_L + cols.reduce((a,b)=>a+b,0)); y+=mm(3);
  doc.font(FB).fontSize(11)
     .text('TOTALE GIORNI:', MAR_L, y, {width:xTotLabel-MAR_L, align:'right'});
  doc.font(FB).fontSize(12)
     .text(String(totale), xTotLabel+mm(2), y, {width:cols[4]-mm(4), align:'center'});
  y += mm(16);

  solidLine(doc, MAR_L, y, PG_W-MAR_R); y+=mm(10);

  // Nota
  doc.font(F).fontSize(9).fillColor('#555')
     .text('Nota: i giorni di reperibilit\u00e0 sono stati rilevati automaticamente dagli Ordini di Volo firmati del mese. Un giorno viene conteggiato quando il nominativo compare nell\u2019equipaggio di allarme P-42 dell\u2019Ordine di Volo firmato del giorno.',
           MAR_L, y, {width:BODY_W, align:'justify'}); y+=mm(18);

  // Firma
  const xFirma = MAR_L + BODY_W*0.4, wFirma = BODY_W*0.6;
  doc.font(FB).fontSize(12).fillColor('#000')
     .text('IL CAPO NUCLEO', xFirma, y, {width:wFirma, align:'center'}); y+=mm(7);
  doc.font(FB).fontSize(12)
     .text(dati.capoNucleo||'', xFirma, y, {width:wFirma, align:'center'}); y+=mm(14);

  // Box firma digitale
  const bW=mm(70), bH=mm(16), bX=xFirma+(wFirma-bW)/2;
  doc.save().rect(bX,y,bW,bH).lineWidth(0.5).stroke('#000').restore();
  doc.font(F).fontSize(7).fillColor('#333')
     .text('Documento informatico firmato digitalmente ai sensi del\ntesto unico D.P.R. 28 dicembre 2000, n. 445 e D.Lgs\n7 marzo 2005, n. 82 e norme collegate.',
           bX+mm(2), y+mm(2.5), {width:bW-mm(4), align:'center'});

  doc.end();
  return buf;
}

async function genera(template, dati){
  if(template === 'reperibilita-report') return generaReport(dati);
  throw new Error('Template sconosciuto: '+template);
}
module.exports = { genera };
