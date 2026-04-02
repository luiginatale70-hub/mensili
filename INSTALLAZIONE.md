# ARCHIVIO NAAF — Istruzioni di installazione
## Modulo MENSILE — N.A.A.F. Pescara

---

## ARCHITETTURA FINALE

```
C:\Users\Administrator\PROGETTI-NAAF\PORTALE\
│
├── CASEV\                          ← App esistente (porta 3000) — NON si tocca
│   └── views\layouts\main.hbs     ← aggiungere SOLO il link navbar (vedi punto 4)
│
└── ARCHIVIO NAAF\                  ← App NUOVA autonoma (porta 3001)
    ├── app.js
    ├── package.json
    ├── routes\
    │   └── mensile.js
    ├── views\
    │   ├── layouts\
    │   │   └── main.hbs
    │   └── mensile\
    │       ├── index.hbs
    │       └── generi-conforto.hbs
    ├── utils\
    │   ├── pdfGenerator.js
    │   └── archivioManager.js
    ├── pdf-templates\
    │   ├── generi-conforto-lettera.html
    │   └── generi-conforto-allegato.html
    ├── public\
    │   └── css\
    │       └── mensile.css
    └── ARCHIVIO\                   ← PDF generati (creata automaticamente)
        └── 2026\
            └── GENNAIO\
                ├── generi-conforto-lettera_GENNAIO-2026.pdf
                └── generi-conforto-allegato_GENNAIO-2026.pdf
```

---

## PASSO 1 — Copiare i file

Copiare l'intera cartella `ARCHIVIO NAAF\` in:
```
C:\Users\Administrator\PROGETTI-NAAF\PORTALE\
```

---

## PASSO 2 — Installare dipendenze

Aprire il terminale nella cartella `ARCHIVIO NAAF\`:

```bash
cd "C:\Users\Administrator\PROGETTI-NAAF\PORTALE\ARCHIVIO NAAF"
npm install
```

> ✅ PDFKit è una libreria Node.js pura (~2MB), nessuna dipendenza esterna, nessun browser da installare.
> Funziona immediatamente su Windows Server senza configurazioni aggiuntive.

---

## PASSO 3 — Avviare l'app

```bash
# Avvio normale
node app.js

# Avvio con PM2 (consigliato per produzione)
pm2 start app.js --name "archivio-naaf"
pm2 save
pm2 startup
```

L'app sarà disponibile su:
- Locale:  http://localhost:3001
- LAN:     http://10.142.3.123:3001

---

## PASSO 4 — Aggiungere link in CASEV (unica modifica a CASEV)

Nel template di navigazione di CASEV (es. `views/layouts/main.hbs` o il partial navbar),
aggiungere UN solo link:

```html
<a href="http://10.142.3.123:3001" target="_blank" class="nav-link">
  <i class="fas fa-folder-open"></i> ARCHIVIO MENSILE
</a>
```

---

## PASSO 5 — Configurare avvio automatico con Windows

Per avviare automaticamente al riavvio del server, usare PM2 con startup Windows:

```bash
pm2 start app.js --name "archivio-naaf"
pm2 save
pm2 startup
```

Oppure creare un servizio Windows con NSSM:
```bash
nssm install archivio-naaf "node" "C:\Users\Administrator\PROGETTI-NAAF\PORTALE\ARCHIVIO NAAF\app.js"
nssm start archivio-naaf
```

---

## ACCESSI

| Utente | Percorso |
|--------|----------|
| Da CASEV | Click link "ARCHIVIO MENSILE" in navbar → porta 3001 |
| Diretto LAN | http://10.142.3.123:3001 |
| Diretto locale | http://localhost:3001 |

Nessun login richiesto — accesso libero in LAN.

---

## COMUNICAZIONI DISPONIBILI

| Stato | Comunicazione | Percorso |
|-------|--------------|----------|
| ✅ Pronta | Generi di Conforto | `/generi-conforto` |
| 🔜 | Colazione Piloti | `/colazione-piloti` |
| 🔜 | Pronto Intervento Aereo | `/pronto-intervento` |
| 🔜 | Presenza Festiva | `/presenza-festiva` |
| 🔜 | Reperibilità Mensile | `/reperibilita` |

---

## TARIFFE CONFIGURATE (aggiornare se cambiano)

File: `views\mensile\generi-conforto.hbs` — variabili JS in fondo al file:

```javascript
const TARIFFA_GENERI    = 2.41;   // € per giorno generi di conforto
const TARIFFA_COLAZIONE = 1.85;   // € per giorno colazione obbligatoria
```
