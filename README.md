# MENSILI - Git Workflow

## PUSH (invia modifiche su GitHub)

1. Aggiungi modifiche
```bash
git add .
```

2. Crea commit
```bash
git commit -m "descrizione modifiche"
```

3. Invia al repo
```bash
git push
```

---

## PULL (scarica aggiornamenti da GitHub)

```bash
git pull
```

---

## FLUSSO COMPLETO

```bash
git add .
git commit -m "update"
git push
```

---

## SETUP INIZIALE (una sola volta)

```bash
git init
git remote add origin https://github.com/luiginatale70-hub/mensili.git
git branch -M main
git add .
git commit -m "first commit"
git push -u origin main
```

---

## NOTE VELOCI

- add → prepara file
- commit → salva locale
- push → invia online
- pull → aggiorna locale
