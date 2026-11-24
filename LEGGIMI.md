# La mia Biblioteca

App per telefono che tiene traccia dei libri di casa (con stanza, scaffale e ripiano) e delle letture di ogni anno.
I dati restano solo sul telefono; online c'è soltanto il codice dell'app.

## Contenuto della cartella

- `index.html`: la pagina dell'app e lo stile
- `app.js`: tutto il funzionamento
- `sw.js`: permette di usare l'app senza connessione
- `manifest.webmanifest` e `icons/`: nome e icona per l'installazione

## Pubblicarla con GitHub Pages (5 minuti, gratis)

1. Su github.com crea un nuovo repository chiamato `biblioteca`, impostato come **Public**.
2. Nel repository scegli **Add file → Upload files** e trascina tutti i file e la cartella `icons`. Poi premi **Commit changes**.
3. Vai in **Settings → Pages**. In *Build and deployment* scegli **Deploy from a branch**, ramo **main**, cartella **/ (root)**, e premi **Save**.
4. Dopo uno o due minuti l'app è online all'indirizzo `https://TUO-NOME-UTENTE.github.io/biblioteca/`.

## Installarla sul telefono Android

1. Apri l'indirizzo con **Chrome**.
2. Tocca il menu **⋮** e scegli **Installa app** (o **Aggiungi a schermata Home**).
3. Alla prima scansione consenti l'accesso alla fotocamera.

## Aggiornare l'app

Carica di nuovo i file modificati nel repository. In `sw.js` aumenta il numero in `VERSION` (per esempio `biblioteca-v2`), così il telefono scarica la versione nuova. I tuoi dati non vengono toccati.

## Backup

Dal tab **Dati** scarica ogni tanto il backup JSON e salvalo su Google Drive. Con **Ripristina da un backup** lo ricarichi, anche su un telefono nuovo. L'app ti avvisa se l'ultimo backup ha più di 30 giorni.
