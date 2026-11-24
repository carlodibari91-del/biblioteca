'use strict';
/* La mia Biblioteca — PWA. Tutti i dati restano sul telefono (IndexedDB). */

// ---------- Costanti ----------
const GENRES = ['Giallo', 'Thriller', 'Noir', 'Fantasy', 'Fantascienza', 'Horror', 'Storico', 'Rosa', 'Classico',
  'Avventura', 'Umoristico', 'Biografia', 'Saggio', 'Poesia', 'Ragazzi'];
const TYPES = ['Romanzo', 'Saggio', 'Fumetto', 'Manga', 'Graphic novel', 'Poesia', 'Altro'];
const STATUSES = { 'da-leggere': 'Da leggere', 'in-lettura': 'In lettura', 'letto': 'Letto', 'prestato': 'Prestato' };
const MONTHS = ['G', 'F', 'M', 'A', 'M', 'G', 'L', 'A', 'S', 'O', 'N', 'D'];

const PALETTES = {
  bordeaux: { name: 'Bordeaux', mood: 'Bordeaux e grigi', bg: '#ffffff', surface: '#ededed', primary: '#b3003c', onPrimary: '#ffffff', dark: '#76052b', onDark: '#ffffff', accent: '#b3003c', ring: '#ffffff', ringTrack: '#9a0034', title: '#76052b', text: '#000000', muted: '#666666', line: '#e0e0e0', track: '#d6d6d6', bar: '#76052b' },
  bosco: { name: 'Biblioteca inglese', mood: 'Verde bosco e oro antico', bg: '#f3efe6', surface: '#ffffff', primary: '#1f4d3a', onPrimary: '#ffffff', dark: '#143326', onDark: '#ffffff', accent: '#d4a24c', ring: '#d4a24c', ringTrack: '#2c5a45', title: '#1f4d3a', text: '#1c1c1c', muted: '#5f5a50', line: '#e2dccd', track: '#e6e0d2', bar: '#1f4d3a' },
  inchiostro: { name: 'Inchiostro e carta', mood: 'Blu notte e terracotta', bg: '#f4f1ea', surface: '#ffffff', primary: '#1e2a4a', onPrimary: '#ffffff', dark: '#121a30', onDark: '#ffffff', accent: '#e07a5f', ring: '#e07a5f', ringTrack: '#2a3a63', title: '#1e2a4a', text: '#111111', muted: '#5c5f66', line: '#e2ddd2', track: '#e7e2d8', bar: '#1e2a4a' },
  notte: { name: 'Lettura notturna', mood: 'Scuro con ambra', bg: '#121212', surface: '#1e1e1e', primary: '#f2a65a', onPrimary: '#121212', dark: '#2a2118', onDark: '#f5f5f5', accent: '#7fb7be', ring: '#7fb7be', ringTrack: '#4a3a28', title: '#f2a65a', text: '#f5f5f5', muted: '#a8a8a8', line: '#2e2e2e', track: '#333333', bar: '#c9864a' },
  salvia: { name: 'Salvia e terracotta', mood: 'Toni naturali e morbidi', bg: '#f6f3ee', surface: '#ffffff', primary: '#4f6344', onPrimary: '#ffffff', dark: '#3d4d35', onDark: '#ffffff', accent: '#e0915a', ring: '#e0915a', ringTrack: '#566a4b', title: '#4f6344', text: '#2b2b2b', muted: '#6a655c', line: '#e3ddd1', track: '#ebe5da', bar: '#7d9270' }
};

const ICON = {
  back: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 18l-6-6 6-6"/></svg>',
  edit: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><path d="M4 20h4L19 9l-4-4L4 16z"/></svg>',
  pin: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/></svg>',
  search: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>',
  x: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>'
};

// ---------- Utilità ----------
const $ = (s, el = document) => el.querySelector(s);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
const today = () => { const d = new Date(); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 10); };
const thisYear = () => new Date().getFullYear();
const fmtDate = (iso, withYear) => iso ? new Date(iso + 'T00:00').toLocaleDateString('it-IT', withYear ? { day: 'numeric', month: 'short', year: 'numeric' } : { day: 'numeric', month: 'short' }) : '';
const nf = (n) => Number(n).toLocaleString('it-IT', { maximumFractionDigits: 1 });
const byTitle = (a, b) => (a.title || '').localeCompare(b.title || '', 'it', { sensitivity: 'base' });
const firstAuthor = (b) => (b.authors || '').split(',')[0].trim();

function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => t.classList.remove('show'), 2600);
}

// ---------- Archivio (IndexedDB) ----------
const DB = {
  db: null,
  open() {
    return new Promise((res, rej) => {
      const r = indexedDB.open('biblioteca', 1);
      r.onupgradeneeded = () => {
        const d = r.result;
        d.createObjectStore('books', { keyPath: 'id' });
        d.createObjectStore('readings', { keyPath: 'id' });
      };
      r.onsuccess = () => { this.db = r.result; res(); };
      r.onerror = () => rej(r.error);
    });
  },
  all(store) {
    return new Promise((res, rej) => {
      const q = this.db.transaction(store).objectStore(store).getAll();
      q.onsuccess = () => res(q.result);
      q.onerror = () => rej(q.error);
    });
  },
  tx(store, fn) {
    return new Promise((res, rej) => {
      const t = this.db.transaction(store, 'readwrite');
      fn(t.objectStore(store));
      t.oncomplete = () => res();
      t.onerror = () => rej(t.error);
    });
  },
  put(store, obj) { return this.tx(store, (s) => s.put(obj)); },
  putMany(store, arr) { return this.tx(store, (s) => arr.forEach((o) => s.put(o))); },
  del(store, id) { return this.tx(store, (s) => s.delete(id)); },
  clear(store) { return this.tx(store, (s) => s.clear()); }
};

// ---------- Impostazioni ----------
const SETTINGS_KEY = 'biblioteca-impostazioni';
let settings = { palette: 'bordeaux', mode: 'auto', goal: 24, lastBackup: '' };
try { Object.assign(settings, JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}')); } catch (e) { /* prima apertura */ }
function saveSettings() { try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); } catch (e) { /* spazio esaurito */ } }

const darkQuery = window.matchMedia('(prefers-color-scheme: dark)');
function applyTheme() {
  const useDark = settings.mode === 'scura' || (settings.mode === 'auto' && darkQuery.matches);
  const p = PALETTES[useDark ? 'notte' : settings.palette] || PALETTES.bordeaux;
  const map = { bg: 'bg', surface: 'surface', primary: 'primary', onPrimary: 'on-primary', dark: 'dark', onDark: 'on-dark', accent: 'accent', ring: 'ring', ringTrack: 'ring-track', title: 'title', text: 'text', muted: 'muted', line: 'line', track: 'track', bar: 'bar' };
  for (const k in map) document.documentElement.style.setProperty('--' + map[k], p[k]);
  document.documentElement.style.colorScheme = p.bg === '#121212' ? 'dark' : 'light';
  $('meta[name="theme-color"]').setAttribute('content', p.bg);
}
darkQuery.addEventListener('change', applyTheme);

// ---------- Stato ----------
let books = [];
let readings = [];
const ui = { q: '', status: 'tutti', genre: '', sort: 'titolo', place: null, addTab: 'scan', results: null, lastQ: '', draft: null, letTab: 'anno', yearFilter: 'tutti', statYear: thisYear() };

const bookById = (id) => books.find((b) => b.id === id);
const readingsOf = (id) => readings.filter((r) => r.bookId === id).sort((a, b) => (b.end || b.start || '9').localeCompare(a.end || a.start || '9'));
const finished = () => readings.filter((r) => r.end && bookById(r.bookId));

// ---------- Componenti ----------
function coverHTML(b, size = '') {
  const img = b.cover ? `<img src="${esc(b.cover)}" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.remove()">` : '';
  return `<div class="cover ${size}" aria-hidden="true">${esc(b.title)}${img}</div>`;
}
function placeText(b) {
  if (b.status === 'prestato') return 'Prestato' + (b.lentTo ? ' a ' + b.lentTo : '');
  if (b.owned === false) return 'Non è mio';
  const parts = [b.room, b.shelf && 'scaffale ' + b.shelf, b.level && 'ripiano ' + b.level].filter(Boolean);
  return parts.length ? parts.join(', ') : 'Posizione da indicare';
}
function starsText(n) { return n ? '★★★★★'.slice(0, n) + '☆☆☆☆☆'.slice(0, 5 - n) : ''; }
function bookRow(b) {
  return `<a class="row" href="#/libro/${esc(b.id)}">
    ${coverHTML(b)}
    <div class="meta"><span class="t">${esc(b.title)}${b.volume ? ' ' + esc(b.volume) : ''}</span><span class="a">${esc(b.authors || 'Autore sconosciuto')}</span><span class="where">${ICON.pin}${esc(placeText(b))}</span></div>
    <span class="pill ${esc(b.status)}">${esc(STATUSES[b.status] || '')}</span></a>`;
}
function ringSVG(pct) {
  const c = 251.3, d = Math.min(Math.max(pct, 0), 1) * c;
  return `<svg width="92" height="92" viewBox="0 0 100 100" role="img" aria-label="Obiettivo al ${Math.round(pct * 100)} per cento">
    <circle cx="50" cy="50" r="40" fill="none" stroke="var(--ring-track)" stroke-width="12"/>
    <circle cx="50" cy="50" r="40" fill="none" stroke="var(--ring)" stroke-width="12" stroke-linecap="round" stroke-dasharray="${d.toFixed(1)} ${c}" transform="rotate(-90 50 50)"/>
    <text x="50" y="57" text-anchor="middle" font-family="Inter,sans-serif" font-size="20" font-weight="700" fill="currentColor">${Math.round(pct * 100)}%</text></svg>`;
}

// ---------- Viste ----------
function viewLibreria() {
  const owned = books.length;
  const counts = { tutti: owned };
  for (const k in STATUSES) counts[k] = books.filter((b) => b.status === k).length;
  const used = new Set(GENRES); books.forEach((b) => (b.genres || []).forEach((g) => used.add(g)));
  const overdue = books.length > 0 && (!settings.lastBackup || (Date.now() - new Date(settings.lastBackup)) / 864e5 > 30);
  return `
  <div class="head"><div><h1>La mia biblioteca</h1><p class="sub">${owned === 1 ? '1 libro' : owned + ' libri'}</p></div></div>
  ${overdue ? `<div class="banner"><span>${settings.lastBackup ? 'L’ultimo backup ha più di 30 giorni.' : 'Non hai ancora fatto un backup.'}</span><a href="#/dati">Fai il backup</a></div>` : ''}
  <label class="searchbox">${ICON.search}<span class="sr">Cerca</span><input id="q" type="search" placeholder="Cerca titolo, autore, ISBN…" value="${esc(ui.q)}" autocomplete="off"></label>
  <div class="chips" role="group" aria-label="Filtra per stato">
    <button class="chip" data-act="status" data-v="tutti" aria-pressed="${ui.status === 'tutti'}">Tutti ${counts.tutti}</button>
    ${Object.keys(STATUSES).map((k) => `<button class="chip" data-act="status" data-v="${k}" aria-pressed="${ui.status === k}">${STATUSES[k]} ${counts[k]}</button>`).join('')}
  </div>
  <div class="filters">
    <select class="input" id="genre" aria-label="Filtra per genere"><option value="">Tutti i generi</option>${[...used].sort().map((g) => `<option ${ui.genre === g ? 'selected' : ''}>${esc(g)}</option>`).join('')}</select>
    <select class="input" id="sort" aria-label="Ordina"><option value="titolo" ${ui.sort === 'titolo' ? 'selected' : ''}>Per titolo</option><option value="autore" ${ui.sort === 'autore' ? 'selected' : ''}>Per autore</option><option value="recenti" ${ui.sort === 'recenti' ? 'selected' : ''}>Aggiunti di recente</option></select>
  </div>
  ${ui.place ? `<div class="placebar"><span>${esc([ui.place.room || 'Senza posizione', ui.place.shelf && 'scaffale ' + ui.place.shelf, ui.place.level && 'ripiano ' + ui.place.level].filter(Boolean).join(', '))}</span><button data-act="clearplace" aria-label="Togli filtro posizione">${ICON.x}</button></div>` : ''}
  <div class="list" id="list">${listHTML()}</div>`;
}
function listHTML() {
  if (!books.length) {
    return `<div class="empty"><p>La biblioteca è vuota. Inizia scansionando il codice a barre di un libro.</p><a class="btn" href="#/aggiungi">Aggiungi il primo libro</a></div>`;
  }
  const q = ui.q.trim().toLowerCase();
  let list = books.filter((b) =>
    (ui.status === 'tutti' || b.status === ui.status) &&
    (!ui.genre || (b.genres || []).includes(ui.genre)) &&
    (!ui.place || ((b.room || '') === ui.place.room && (b.shelf || '') === ui.place.shelf && (b.level || '') === ui.place.level)) &&
    (!q || [b.title, b.authors, b.isbn, b.series, b.publisher].some((v) => (v || '').toLowerCase().includes(q))));
  if (ui.sort === 'autore') list.sort((a, b) => firstAuthor(a).localeCompare(firstAuthor(b), 'it') || byTitle(a, b));
  else if (ui.sort === 'recenti') list.sort((a, b) => (b.addedAt || '').localeCompare(a.addedAt || ''));
  else list.sort((a, b) => (a.series && a.series === b.series) ? (parseFloat(a.volume) || 0) - (parseFloat(b.volume) || 0) : byTitle(a, b));
  if (!list.length) return `<div class="empty"><p>Nessun libro corrisponde ai filtri.</p></div>`;
  return list.map(bookRow).join('');
}

function viewScaffali() {
  const tree = {};
  books.filter((b) => b.owned !== false && b.status !== 'prestato').forEach((b) => {
    const r = b.room || '', s = b.shelf || '', l = b.level || '';
    ((tree[r] ||= {})[s] ||= {})[l] ||= [];
    tree[r][s][l].push(b);
  });
  const rooms = Object.keys(tree).sort((a, b) => (a === '') - (b === '') || a.localeCompare(b, 'it'));
  if (!rooms.length) {
    return `<div class="head"><div><h1>Scaffali</h1></div></div>
      <div class="empty"><p>Quando aggiungi un libro indica stanza, scaffale e ripiano: qui vedrai la mappa della tua casa.</p><a class="btn" href="#/aggiungi">Aggiungi un libro</a></div>`;
  }
  const spines = (arr) => arr.slice(0, 30).map((b, i) => `<i style="height:${30 + ((i * 7 + (b.title || '').length) % 5) * 5}px;background:${['var(--dark)', 'var(--primary)', 'var(--muted)', 'var(--bar)'][i % 4]}"></i>`).join('');
  const nat = (a, b) => a.localeCompare(b, 'it', { numeric: true });
  return `<div class="head"><div><h1>Scaffali</h1><p class="sub">Tocca un ripiano per vedere i suoi libri</p></div></div>
  ${rooms.map((r) => `<section class="stack"><h2>${esc(r || 'Senza posizione')}</h2>
    ${Object.keys(tree[r]).sort(nat).map((s) => {
      const levels = tree[r][s];
      const tot = Object.values(levels).reduce((n, a) => n + a.length, 0);
      return `<div class="shelf"><div class="shelf-h">${s ? 'Scaffale ' + esc(s) : 'Scaffale non indicato'}<span>${tot} ${tot === 1 ? 'libro' : 'libri'}</span></div>
        ${Object.keys(levels).sort(nat).map((l) => `<button class="level" data-act="place" data-room="${esc(r)}" data-shelf="${esc(s)}" data-level="${esc(l)}">
          <span class="lv">${l ? 'Ripiano ' + esc(l) : 'Ripiano ?'}</span><span class="spines">${spines(levels[l])}</span><span class="n">${levels[l].length}</span></button>`).join('')}</div>`;
    }).join('')}</section>`).join('')}`;
}

function viewAggiungi() {
  const results = ui.results;
  return `<div class="head"><div><h1>Aggiungi libro</h1></div></div>
  <div class="seg" role="group" aria-label="Modo di inserimento">
    <button data-act="addtab" data-v="scan" aria-pressed="${ui.addTab === 'scan'}">Scansiona</button>
    <button data-act="addtab" data-v="cerca" aria-pressed="${ui.addTab === 'cerca'}">Cerca per titolo</button>
  </div>
  ${ui.addTab === 'scan' ? `
    <div class="scanner"><video id="cam" playsinline muted></video><div class="frame"></div><div class="laser"></div></div>
    <p class="sub" id="scanmsg">Avvio della fotocamera…</p>
    <form id="isbnform" class="inline"><label class="sr" for="isbn">ISBN</label><input class="input" id="isbn" name="isbn" inputmode="numeric" placeholder="Oppure scrivi l’ISBN" autocomplete="off"><button class="btn">Cerca</button></form>`
  : `
    <form id="searchform" class="inline"><label class="sr" for="sq">Titolo o autore</label><input class="input" id="sq" name="q" type="search" placeholder="Titolo, autore…" value="${esc(ui.lastQ)}" autocomplete="off"><button class="btn">Cerca</button></form>
    <div class="list" id="results">${results === null ? '<p class="sub">Funziona anche per fumetti e manga: scrivi il titolo e il numero del volume.</p>' : resultsHTML(results)}</div>`}
  <button class="btn quiet block" data-act="manual">Inserisci a mano</button>`;
}
function resultsHTML(list) {
  if (!list.length) return '<p class="sub">Nessun risultato. Prova con meno parole oppure inserisci il libro a mano.</p>';
  return list.map((d, i) => `<button class="row" data-act="pick" data-i="${i}">${coverHTML(d)}
    <div class="meta"><span class="t">${esc(d.title)}</span><span class="a">${esc(d.authors || 'Autore sconosciuto')}</span><span class="where">${esc([d.publisher, d.year].filter(Boolean).join(', '))}</span></div></button>`).join('');
}

function viewForm(id) {
  const isNew = !id;
  const b = isNew ? (ui.draft || {}) : bookById(id);
  if (!b) return notFound();
  const uniq = (k) => [...new Set(books.map((x) => x[k]).filter(Boolean))].sort((a, c) => a.localeCompare(c, 'it', { numeric: true }));
  const allGenres = [...new Set([...GENRES, ...(b.genres || [])])];
  const status = b.status || 'da-leggere';
  const type = b.type || 'Romanzo';
  return `<div class="head"><div><h1>${isNew ? 'Nuovo libro' : 'Modifica libro'}</h1></div></div>
  <form id="bookform" class="stack" novalidate>
    <input type="hidden" name="id" value="${esc(b.id || '')}"><input type="hidden" name="cover" value="${esc(b.cover || '')}">
    ${b.title || b.cover ? `<div style="display:flex;gap:14px;align-items:center">${coverHTML(b)}<p class="sub">${b.fromApi ? 'Dati trovati online: controllali e completa la posizione.' : ''}</p></div>` : ''}
    <label class="field"><span>Titolo</span><input class="input" name="title" required value="${esc(b.title || '')}"></label>
    <label class="field"><span>Autori (separati da virgola)</span><input class="input" name="authors" value="${esc(b.authors || '')}"></label>
    <div class="grid2">
      <label class="field"><span>Tipo</span><select class="input" name="type">${TYPES.map((t) => `<option ${t === type ? 'selected' : ''}>${t}</option>`).join('')}</select></label>
      <label class="field"><span>Stato</span><select class="input" name="status">${Object.keys(STATUSES).map((k) => `<option value="${k}" ${k === status ? 'selected' : ''}>${STATUSES[k]}</option>`).join('')}</select></label>
    </div>
    <fieldset class="field" style="border:0;padding:0;margin:0"><legend style="font-size:.85rem;font-weight:600;color:var(--muted);margin-bottom:6px">Generi</legend>
      <div class="genres">${allGenres.map((g) => `<label><input type="checkbox" name="genres" value="${esc(g)}" ${(b.genres || []).includes(g) ? 'checked' : ''}><span>${esc(g)}</span></label>`).join('')}</div>
    </fieldset>
    <label class="field"><span>Altro genere (facoltativo)</span><input class="input" name="genreExtra" placeholder="Es. Cozy mystery"></label>
    <h2>Dove si trova</h2>
    <div class="grid3">
      <label class="field"><span>Stanza</span><input class="input" name="room" list="dl-room" value="${esc(b.room || '')}" placeholder="Soggiorno"></label>
      <label class="field"><span>Scaffale</span><input class="input" name="shelf" list="dl-shelf" value="${esc(b.shelf || '')}" placeholder="B"></label>
      <label class="field"><span>Ripiano</span><input class="input" name="level" list="dl-level" value="${esc(b.level || '')}" placeholder="2"></label>
    </div>
    <datalist id="dl-room">${uniq('room').map((v) => `<option value="${esc(v)}">`).join('')}</datalist>
    <datalist id="dl-shelf">${uniq('shelf').map((v) => `<option value="${esc(v)}">`).join('')}</datalist>
    <datalist id="dl-level">${uniq('level').map((v) => `<option value="${esc(v)}">`).join('')}</datalist>
    <label class="check"><input type="checkbox" name="owned" ${b.owned === false ? '' : 'checked'}>È un libro mio (togli la spunta per prestiti e biblioteca)</label>
    <label class="field"><span>Prestato a</span><input class="input" name="lentTo" value="${esc(b.lentTo || '')}" placeholder="Solo se lo hai prestato"></label>
    <h2>Dettagli</h2>
    <div class="grid2">
      <label class="field"><span>ISBN</span><input class="input" name="isbn" inputmode="numeric" value="${esc(b.isbn || '')}"></label>
      <label class="field"><span>Editore</span><input class="input" name="publisher" value="${esc(b.publisher || '')}"></label>
      <label class="field"><span>Anno</span><input class="input" name="year" inputmode="numeric" value="${esc(b.year || '')}"></label>
      <label class="field"><span>Pagine</span><input class="input" name="pages" inputmode="numeric" value="${esc(b.pages || '')}"></label>
      <label class="field"><span>Serie (fumetti, saghe)</span><input class="input" name="series" list="dl-series" value="${esc(b.series || '')}"></label>
      <label class="field"><span>Volume n.</span><input class="input" name="volume" inputmode="numeric" value="${esc(b.volume || '')}"></label>
    </div>
    <datalist id="dl-series">${uniq('series').map((v) => `<option value="${esc(v)}">`).join('')}</datalist>
    <label class="field"><span>Note</span><textarea class="input" name="notes">${esc(b.notes || '')}</textarea></label>
    <div class="btnrow"><button type="button" class="btn plain" data-act="cancel">Annulla</button><button class="btn" type="submit">Salva libro</button></div>
  </form>`;
}

function viewLibro(id) {
  const b = bookById(id);
  if (!b) return notFound();
  const rs = readingsOf(id);
  const open = rs.find((r) => !r.end);
  const info = [
    ['Tipo', b.type], ['Editore', b.publisher], ['Anno', b.year], ['Pagine', b.pages], ['ISBN', b.isbn],
    ['Serie', b.series ? b.series + (b.volume ? ', vol. ' + b.volume : '') : ''], ['Generi', (b.genres || []).join(', ')], ['Aggiunto il', fmtDate(b.addedAt, true)]
  ].filter((x) => x[1]);
  return `<div class="hero">
    <div class="hero-top"><button class="iconbtn" data-act="back" aria-label="Indietro">${ICON.back}</button><a class="iconbtn" href="#/modifica/${esc(id)}" aria-label="Modifica">${ICON.edit}</a></div>
    <div class="hero-body">${coverHTML(b, 'lg')}<div class="stack" style="gap:6px;min-width:0"><h1>${esc(b.title)}${b.volume ? ' ' + esc(b.volume) : ''}</h1><span class="a">${esc(b.authors || 'Autore sconosciuto')}</span></div></div>
  </div>
  <div class="card"><span class="where" style="font-size:.85rem">${ICON.pin}${esc(placeText(b))}</span></div>
  <div class="seg" role="group" aria-label="Stato del libro">${Object.keys(STATUSES).map((k) => `<button data-act="setstatus" data-id="${esc(id)}" data-v="${k}" aria-pressed="${b.status === k}">${STATUSES[k]}</button>`).join('')}</div>
  <div class="btnrow">
    ${open ? `<button class="btn" data-act="finish" data-id="${esc(id)}">Ho finito di leggerlo</button>` : `<button class="btn" data-act="start" data-id="${esc(id)}">Inizia a leggerlo</button>`}
    <button class="btn ghost" data-act="pastreading" data-id="${esc(id)}">Lettura passata</button>
  </div>
  ${info.length ? `<dl class="info">${info.map(([k, v]) => `<div><dt>${k}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>` : ''}
  <section class="stack" style="gap:0"><h2>Letture</h2>
    ${rs.length ? rs.map((r) => `<div class="reading">
      <div class="dates">
        <label class="field"><span>Inizio</span><input class="input" type="date" data-rid="${esc(r.id)}" data-k="start" value="${esc(r.start || '')}"></label>
        <label class="field"><span>Fine</span><input class="input" type="date" data-rid="${esc(r.id)}" data-k="end" value="${esc(r.end || '')}"></label>
        <button class="iconbtn" data-act="delreading" data-rid="${esc(r.id)}" aria-label="Elimina questa lettura">${ICON.x}</button>
      </div>
      <div class="stars" role="group" aria-label="Voto">${[1, 2, 3, 4, 5].map((n) => `<button data-act="rate" data-rid="${esc(r.id)}" data-v="${n}" aria-label="${n} su 5" aria-pressed="${r.rating === n}">${n <= (r.rating || 0) ? '★' : '☆'}</button>`).join('')}</div>
    </div>`).join('') : '<p class="sub">Nessuna lettura registrata.</p>'}
  </section>
  ${b.notes ? `<section class="stack" style="gap:6px"><h2>Note</h2><p style="margin:0;white-space:pre-wrap">${esc(b.notes)}</p></section>` : ''}
  <button class="btn plain block" data-act="delbook" data-id="${esc(id)}">Elimina libro</button>`;
}

function viewLetture() {
  return `<div class="head"><div><h1>Letture</h1></div></div>
  <div class="seg" role="group" aria-label="Vista letture">
    <button data-act="lettab" data-v="anno" aria-pressed="${ui.letTab === 'anno'}">Per anno</button>
    <button data-act="lettab" data-v="stat" aria-pressed="${ui.letTab === 'stat'}">Statistiche</button>
  </div>
  ${ui.letTab === 'anno' ? perAnnoHTML() : statsHTML()}`;
}
function readRow(r) {
  const b = bookById(r.bookId);
  return `<a class="row" href="#/libro/${esc(b.id)}">${coverHTML(b, 'sm')}
    <div class="meta"><span class="t">${esc(b.title)}${b.volume ? ' ' + esc(b.volume) : ''}</span><span class="a">${esc(b.authors || '')}</span></div>
    <div class="right"><span>${r.end ? fmtDate(r.end) : 'dal ' + fmtDate(r.start)}</span>${r.rating ? `<span class="stars ro" aria-label="Voto ${r.rating} su 5">${starsText(r.rating)}</span>` : ''}</div></a>`;
}
function perAnnoHTML() {
  const current = readings.filter((r) => !r.end && bookById(r.bookId));
  const fin = finished();
  const years = [...new Set(fin.map((r) => r.end.slice(0, 4)))].sort().reverse();
  if (!fin.length && !current.length) {
    return `<div class="empty"><p>Quando finisci un libro, aprilo e tocca «Ho finito di leggerlo»: comparirà qui, diviso per anno.</p></div>`;
  }
  const shown = ui.yearFilter === 'tutti' ? years : years.filter((y) => y === ui.yearFilter);
  return `${current.length ? `<section class="stack" style="gap:0"><h2>In lettura ora</h2>${current.map(readRow).join('')}</section>` : ''}
  ${years.length ? `<div class="chips" role="group" aria-label="Scegli l’anno"><button class="chip" data-act="yearfilter" data-v="tutti" aria-pressed="${ui.yearFilter === 'tutti'}">Tutti</button>
    ${years.map((y) => `<button class="chip" data-act="yearfilter" data-v="${y}" aria-pressed="${ui.yearFilter === y}">${y} · ${fin.filter((r) => r.end.startsWith(y)).length}</button>`).join('')}</div>` : ''}
  ${shown.map((y) => {
    const list = fin.filter((r) => r.end.startsWith(y)).sort((a, b) => b.end.localeCompare(a.end));
    return `<section class="stack" style="gap:0"><div style="display:flex;justify-content:space-between;align-items:baseline;padding-bottom:6px;border-bottom:2px solid var(--dark)"><h2 style="font-family:var(--serif);font-size:1.5rem;color:var(--title)">${y}</h2><span class="sub">${list.length === 1 ? '1 libro' : list.length + ' libri'}</span></div>${list.map(readRow).join('')}</section>`;
  }).join('')}`;
}
function statsHTML() {
  const fin = finished();
  const years = [...new Set([...fin.map((r) => r.end.slice(0, 4)), String(thisYear())])].sort();
  const Y = String(ui.statYear);
  const inY = (y) => fin.filter((r) => r.end.startsWith(y));
  const cur = inY(Y), prev = inY(String(+Y - 1));
  const bk = (r) => bookById(r.bookId);
  const pages = cur.reduce((n, r) => n + (+bk(r).pages || 0), 0);
  const rated = cur.filter((r) => r.rating);
  const avg = rated.length ? rated.reduce((n, r) => n + r.rating, 0) / rated.length : 0;
  const durations = cur.filter((r) => r.start && r.end >= r.start).map((r) => (new Date(r.end) - new Date(r.start)) / 864e5 + 1);
  const avgDays = durations.length ? durations.reduce((a, b) => a + b, 0) / durations.length : 0;
  const months = MONTHS.map((_, i) => cur.filter((r) => +r.end.slice(5, 7) === i + 1).length);
  const mMax = Math.max(1, ...months);
  const count = (fn) => { const m = {}; cur.forEach((r) => [].concat(fn(bk(r))).filter(Boolean).forEach((k) => { m[k] = (m[k] || 0) + 1; })); return Object.entries(m).sort((a, b) => b[1] - a[1]); };
  const genres = count((b) => b.genres || []).slice(0, 6);
  const types = count((b) => b.type || 'Altro');
  const authors = count((b) => firstAuthor(b)).slice(0, 5);
  const mine = cur.filter((r) => bk(r).owned !== false).length;
  const goal = +settings.goal || 0;
  const isNow = +Y === thisYear();
  const dayOfYear = Math.ceil((Date.now() - new Date(thisYear(), 0, 1)) / 864e5);
  const projection = isNow && dayOfYear > 14 ? Math.round(cur.length / dayOfYear * 365) : null;
  const delta = (a, b, unit = '') => b ? `${a - b >= 0 ? '+' : '−'}${nf(Math.abs(a - b))}${unit} sul ${+Y - 1}` : `${+Y - 1}: nessun dato`;
  const typeColors = ['var(--dark)', 'var(--primary)', 'var(--muted)', 'var(--accent)', 'var(--bar)', 'var(--track)'];
  const yMax = Math.max(1, ...years.map((y) => inY(y).length));
  return `<div class="chips" role="group" aria-label="Anno delle statistiche">${years.slice().reverse().map((y) => `<button class="chip" data-act="statyear" data-v="${y}" aria-pressed="${y === Y}">${y}</button>`).join('')}</div>
  <div class="kpis">
    <div class="kpi"><span class="l">Libri letti</span><span class="v">${cur.length}</span><span class="d">${delta(cur.length, prev.length)}</span></div>
    <div class="kpi"><span class="l">Pagine</span><span class="v">${nf(pages)}</span><span class="d">${pages ? 'dai libri con pagine indicate' : 'aggiungi le pagine ai libri'}</span></div>
    <div class="kpi"><span class="l">Voto medio</span><span class="v">${avg ? nf(avg) : '–'}</span><span class="d">${rated.length} libri votati</span></div>
    <div class="kpi"><span class="l">Giorni per libro</span><span class="v">${avgDays ? Math.round(avgDays) : '–'}</span><span class="d">quando c’è la data di inizio</span></div>
  </div>
  ${goal ? `<div class="goal">${ringSVG(cur.length / goal)}<div class="stack" style="gap:2px"><span style="font-size:.85rem;font-weight:600">Obiettivo ${Y}</span><span style="font-size:1.35rem;font-weight:700">${cur.length} di ${goal} libri</span>${projection !== null ? `<span style="font-size:.85rem;opacity:.9">A questo ritmo arrivi a ${projection} entro il 31 dicembre</span>` : ''}</div></div>` : ''}
  <div class="card"><h2>Libri finiti per mese</h2>
    <div class="months" role="img" aria-label="Libri finiti per mese nel ${Y}: ${months.join(', ')}">${months.map((v, i) => `<div><b>${v || ''}</b><i style="height:${Math.max(v / mMax * 80, 3)}px;${v ? '' : 'background:var(--track)'}"></i><span>${MONTHS[i]}</span></div>`).join('')}</div></div>
  ${genres.length ? `<div class="card"><h2>Generi</h2>${genres.map(([g, v], i) => `<div class="hrow"><span>${esc(g)}</span><div class="hbar"><i style="width:${v / genres[0][1] * 100}%;${i === 0 ? 'background:var(--primary)' : ''}"></i></div><b style="text-align:right">${v}</b></div>`).join('')}</div>` : ''}
  ${types.length ? `<div class="card"><h2>Tipo di lettura</h2>
    <div class="stackbar" role="img" aria-label="${types.map(([t, v]) => t + ' ' + v).join(', ')}">${types.map(([t, v], i) => `<i style="flex:${v};background:${typeColors[i % 6]}"></i>`).join('')}</div>
    <div class="legend">${types.map(([t, v], i) => `<span><i style="background:${typeColors[i % 6]}"></i>${esc(t)} ${v}</span>`).join('')}</div>
    <p class="sub">${mine} dalla tua biblioteca, ${cur.length - mine} in prestito o da biblioteca</p></div>` : ''}
  ${authors.length ? `<div class="card"><h2>Autori più letti</h2>${authors.map(([a, v]) => `<div style="display:flex;justify-content:space-between"><span>${esc(a)}</span><b style="color:var(--title)">${v}</b></div>`).join('')}</div>` : ''}
  <div class="card"><h2>Anni a confronto</h2>${years.map((y) => `<div class="hrow" style="grid-template-columns:48px minmax(0,1fr) 28px"><span>${y}</span><div class="hbar" style="height:16px"><i style="width:${inY(y).length / yMax * 100}%;${y === Y ? 'background:var(--primary)' : ''}"></i></div><b style="text-align:right">${inY(y).length}</b></div>`).join('')}</div>`;
}

function viewDati() {
  const persisted = viewDati.persisted;
  return `<div class="head"><div><h1>Dati e impostazioni</h1></div></div>
  <div class="card">
    <b>${books.length} libri e ${readings.length} letture salvati su questo telefono</b>
    <span class="sub">Ultimo backup: ${settings.lastBackup ? fmtDate(settings.lastBackup, true) : 'mai'}${persisted === false ? '. Il browser potrebbe cancellare i dati se lo spazio scarseggia: fai backup regolari.' : ''}</span>
  </div>
  <section class="stack"><h2>Backup ed esportazione</h2>
    <button class="btn block" data-act="export-json">Scarica backup completo (JSON)</button>
    <div class="btnrow"><button class="btn quiet" data-act="export-csv">Tabella per Excel (CSV)</button><button class="btn quiet" data-act="export-txt">Riepilogo letture (TXT)</button></div>
    <button class="btn ghost block" data-act="import">Ripristina da un backup</button>
  </section>
  <section class="stack"><h2>Obiettivo di lettura annuale</h2>
    <div class="inline"><label class="sr" for="goal">Libri all’anno</label><input class="input" id="goal" type="number" min="0" max="999" inputmode="numeric" value="${esc(settings.goal)}"><span style="align-self:center;color:var(--muted)">libri all’anno</span></div>
  </section>
  <section class="stack"><h2>Palette colori</h2>
    ${Object.entries(PALETTES).map(([k, p]) => `<button class="palette" data-act="palette" data-v="${k}" aria-pressed="${settings.palette === k}">
      <span class="dots"><i style="background:${p.primary}"></i><i style="background:${p.dark}"></i><i style="background:${p.accent}"></i><i style="background:${p.bg}"></i></span>
      <span class="meta"><span class="t">${p.name}</span><span class="a">${p.mood}</span></span></button>`).join('')}
    <div class="seg" role="group" aria-label="Modalità chiara o scura">
      ${[['auto', 'Automatica'], ['chiara', 'Chiara'], ['scura', 'Scura']].map(([k, l]) => `<button data-act="mode" data-v="${k}" aria-pressed="${settings.mode === k}">${l}</button>`).join('')}
    </div>
    <p class="sub">In modalità scura, o automatica con il telefono in tema scuro, l’app usa sempre «Lettura notturna».</p>
  </section>
  <button class="btn plain block" data-act="wipe">Cancella tutti i dati</button>`;
}
function notFound() { return `<div class="empty"><p>Questo libro non esiste più.</p><a class="btn" href="#/libreria">Torna alla biblioteca</a></div>`; }

// ---------- Router ----------
function currentRoute() { const [name, arg] = (location.hash.replace(/^#\/?/, '') || 'libreria').split('/'); return { name, arg: arg && decodeURIComponent(arg) }; }
function render() {
  stopCamera();
  const { name, arg } = currentRoute();
  const views = { libreria: viewLibreria, scaffali: viewScaffali, aggiungi: viewAggiungi, nuovo: () => viewForm(null), modifica: () => viewForm(arg), libro: () => viewLibro(arg), letture: viewLetture, dati: viewDati };
  const app = $('#app');
  app.innerHTML = (views[name] || viewLibreria)();
  const tab = { nuovo: 'aggiungi', modifica: 'libreria', libro: 'libreria' }[name] || name;
  document.querySelectorAll('nav.tabs a').forEach((a) => { if (a.dataset.tab === tab) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
  if (name === 'aggiungi' && ui.addTab === 'scan') startCamera();
  if (name === 'dati' && viewDati.persisted === undefined && navigator.storage?.persisted) {
    navigator.storage.persisted().then((p) => { viewDati.persisted = p; if (currentRoute().name === 'dati') render(); });
  }
}
window.addEventListener('hashchange', () => { render(); window.scrollTo(0, 0); });

// ---------- Ricerca online ----------
const GENRE_MAP = [[/mystery|detective|crime|giall|polizies/i, 'Giallo'], [/thriller|suspense/i, 'Thriller'], [/noir/i, 'Noir'], [/fantasy/i, 'Fantasy'],
  [/science fiction|fantascienza|sci-fi/i, 'Fantascienza'], [/horror/i, 'Horror'], [/histor|storic/i, 'Storico'], [/romance|love stor/i, 'Rosa'],
  [/classic/i, 'Classico'], [/adventure|avventur/i, 'Avventura'], [/humor|umoris/i, 'Umoristico'], [/biograph|autobiograph/i, 'Biografia'],
  [/poetry|poesi/i, 'Poesia'], [/juvenile|children|ragazzi|young adult/i, 'Ragazzi']];
function suggestGenres(cats) { const s = (cats || []).join(' '); return [...new Set(GENRE_MAP.filter(([re]) => re.test(s)).map(([, g]) => g))]; }
function suggestType(cats, title) {
  const s = (cats || []).join(' ') + ' ' + (title || '');
  if (/manga/i.test(s)) return 'Manga';
  if (/graphic novel/i.test(s)) return 'Graphic novel';
  if (/comic|fumett/i.test(s)) return 'Fumetto';
  if (/poetry|poesi/i.test(s)) return 'Poesia';
  if (cats && cats.length && !/fiction|narrativ|novel|romanz/i.test(s)) return 'Saggio';
  return 'Romanzo';
}
function fromGoogle(item) {
  const v = item.volumeInfo || {};
  const ids = v.industryIdentifiers || [];
  const isbn = (ids.find((x) => x.type === 'ISBN_13') || ids.find((x) => x.type === 'ISBN_10') || {}).identifier || '';
  const cover = (v.imageLinks && (v.imageLinks.thumbnail || v.imageLinks.smallThumbnail) || '').replace(/^http:/, 'https:');
  const title = [v.title, v.subtitle].filter(Boolean).join(': ');
  return { title, authors: (v.authors || []).join(', '), publisher: v.publisher || '', year: (v.publishedDate || '').slice(0, 4), pages: v.pageCount || '', isbn,
    cover: cover || (isbn ? `https://covers.openlibrary.org/b/isbn/${isbn}-M.jpg?default=false` : ''), genres: suggestGenres(v.categories), type: suggestType(v.categories, title), fromApi: true };
}
async function lookupISBN(isbn) {
  try {
    const r = await fetch(`https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`);
    if (r.ok) { const j = await r.json(); if (j.items && j.items.length) { const d = fromGoogle(j.items[0]); d.isbn = isbn; return d; } }
  } catch (e) { /* prova Open Library */ }
  try {
    const r = await fetch(`https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&format=json&jscmd=data`);
    const j = await r.json();
    const v = j['ISBN:' + isbn];
    if (v) {
      const subj = (v.subjects || []).map((s) => s.name);
      return { title: v.title || '', authors: (v.authors || []).map((a) => a.name).join(', '), publisher: (v.publishers || []).map((p) => p.name).join(', '),
        year: ((v.publish_date || '').match(/\d{4}/) || [''])[0], pages: v.number_of_pages || '', isbn, cover: (v.cover && (v.cover.medium || v.cover.small)) || '',
        genres: suggestGenres(subj), type: suggestType(subj, v.title), fromApi: true };
    }
  } catch (e) { /* nessun risultato */ }
  return null;
}
async function searchBooks(q) {
  const r = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(q)}&maxResults=20&printType=books`);
  if (!r.ok) throw new Error('rete');
  const j = await r.json();
  return (j.items || []).map(fromGoogle);
}
function cleanIsbn(s) { return String(s || '').replace(/[^0-9Xx]/g, '').toUpperCase(); }
async function handleIsbn(isbn) {
  isbn = cleanIsbn(isbn);
  if (isbn.length !== 10 && isbn.length !== 13) { toast('Un ISBN ha 10 o 13 cifre'); return; }
  const dup = books.find((b) => cleanIsbn(b.isbn) === isbn);
  if (dup) { toast('Hai già questo libro'); location.hash = '#/libro/' + dup.id; return; }
  const msg = $('#scanmsg'); if (msg) msg.textContent = 'Cerco i dati del libro…';
  if (!navigator.onLine) { ui.draft = { isbn }; toast('Sei offline: completa i dati a mano'); location.hash = '#/nuovo'; return; }
  const d = await lookupISBN(isbn);
  ui.draft = d || { isbn };
  if (!d) toast('Nessun dato trovato online: completa a mano');
  location.hash = '#/nuovo';
}

// ---------- Fotocamera ----------
let stream = null, scanTimer = null;
async function startCamera() {
  const msg = $('#scanmsg');
  if (!('BarcodeDetector' in window)) { msg.textContent = 'Questo browser non legge i codici a barre: usa Chrome su Android oppure scrivi l’ISBN qui sotto.'; return; }
  let s;
  try { s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false }); }
  catch (e) { msg.textContent = 'Fotocamera non disponibile. Consenti l’accesso alla fotocamera nelle impostazioni del sito, oppure scrivi l’ISBN qui sotto.'; return; }
  const v = $('#cam');
  if (!v || currentRoute().name !== 'aggiungi' || ui.addTab !== 'scan') { s.getTracks().forEach((t) => t.stop()); return; }
  stream = s; v.srcObject = s;
  try { await v.play(); } catch (e) { /* riproduzione automatica */ }
  const detector = new BarcodeDetector({ formats: ['ean_13'] });
  msg.textContent = 'Inquadra il codice a barre sul retro del libro.';
  let busy = false;
  scanTimer = setInterval(async () => {
    if (busy || !v.videoWidth) return;
    busy = true;
    try {
      const codes = await detector.detect(v);
      const c = codes.find((x) => /^97[89]\d{10}$/.test(x.rawValue));
      if (c) { stopCamera(); if (navigator.vibrate) navigator.vibrate(60); await handleIsbn(c.rawValue); }
      else if (codes.length) msg.textContent = 'Questo non è un ISBN: cerca il codice che inizia con 978 o 979.';
    } catch (e) { /* frame non leggibile */ }
    busy = false;
  }, 300);
}
function stopCamera() {
  clearInterval(scanTimer); scanTimer = null;
  if (stream) { stream.getTracks().forEach((t) => t.stop()); stream = null; }
}

// ---------- Azioni ----------
async function saveBook(form) {
  const fd = new FormData(form);
  const get = (k) => String(fd.get(k) || '').trim();
  const title = get('title');
  if (!title) { toast('Scrivi almeno il titolo'); form.elements.title.focus(); return; }
  const id = get('id') || uid();
  const old = bookById(id);
  const genres = [...fd.getAll('genres'), ...get('genreExtra').split(',').map((s) => s.trim()).filter(Boolean)];
  const isbn = cleanIsbn(get('isbn'));
  if (!old && isbn && books.some((b) => cleanIsbn(b.isbn) === isbn) && !confirm('Hai già un libro con questo ISBN. Lo salvo comunque?')) return;
  const b = Object.assign({}, old || {}, {
    id, title, authors: get('authors'), isbn, publisher: get('publisher'), year: get('year'), pages: parseInt(get('pages'), 10) || '',
    type: get('type'), genres: [...new Set(genres)], room: get('room'), shelf: get('shelf'), level: get('level'), status: get('status'),
    lentTo: get('lentTo'), owned: fd.get('owned') === 'on', series: get('series'), volume: get('volume'), notes: get('notes'),
    cover: get('cover'), addedAt: (old && old.addedAt) || today()
  });
  delete b.fromApi;
  await DB.put('books', b);
  if (old) Object.assign(old, b); else books.push(b);
  if (!old && b.status === 'in-lettura') await addReading({ bookId: id, start: today(), end: '' });
  if (!old && b.status === 'letto') await addReading({ bookId: id, start: '', end: today() });
  ui.draft = null;
  toast(old ? 'Modifiche salvate' : 'Libro aggiunto');
  location.replace('#/libro/' + id);
}
async function addReading(r) { const x = Object.assign({ id: uid(), rating: 0 }, r); await DB.put('readings', x); readings.push(x); return x; }
async function setStatus(b, status) { b.status = status; await DB.put('books', b); }

function download(name, text, mime) {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}
function exportJSON() {
  download(`biblioteca-backup-${today()}.json`, JSON.stringify({ app: 'la-mia-biblioteca', version: 1, exportedAt: new Date().toISOString(), settings, books, readings }, null, 1), 'application/json');
  settings.lastBackup = today(); saveSettings(); render(); toast('Backup scaricato nella cartella Download');
}
function exportCSV() {
  const cols = ['Titolo', 'Autori', 'Tipo', 'Generi', 'Stato', 'Stanza', 'Scaffale', 'Ripiano', 'Prestato a', 'Mio', 'Serie', 'Volume', 'ISBN', 'Editore', 'Anno', 'Pagine', 'Aggiunto il', 'Letto nel', 'Voto', 'Note'];
  const q = (v) => '"' + String(v ?? '').replace(/"/g, '""') + '"';
  const rows = books.slice().sort(byTitle).map((b) => {
    const rs = readingsOf(b.id).filter((r) => r.end);
    const rated = rs.filter((r) => r.rating);
    return [b.title, b.authors, b.type, (b.genres || []).join(', '), STATUSES[b.status], b.room, b.shelf, b.level, b.lentTo, b.owned === false ? 'no' : 'sì', b.series, b.volume, b.isbn, b.publisher, b.year, b.pages, b.addedAt,
      rs.map((r) => r.end.slice(0, 4)).join(', '), rated.length ? nf(rated.reduce((n, r) => n + r.rating, 0) / rated.length) : '', b.notes].map(q).join(';');
  });
  download(`biblioteca-${today()}.csv`, '\ufeff' + [cols.map(q).join(';'), ...rows].join('\r\n'), 'text/csv;charset=utf-8');
  toast('Tabella scaricata nella cartella Download');
}
function exportTXT() {
  const fin = finished();
  const years = [...new Set(fin.map((r) => r.end.slice(0, 4)))].sort().reverse();
  let out = `LE MIE LETTURE\nEsportato il ${fmtDate(today(), true)}\n`;
  for (const y of years) {
    const list = fin.filter((r) => r.end.startsWith(y)).sort((a, b) => a.end.localeCompare(b.end));
    out += `\n${y} — ${list.length} ${list.length === 1 ? 'libro' : 'libri'}\n`;
    for (const r of list) {
      const b = bookById(r.bookId);
      out += `  ${r.end.slice(8, 10)}/${r.end.slice(5, 7)}  ${b.title}${b.volume ? ' ' + b.volume : ''}${b.authors ? ' — ' + b.authors : ''}${r.rating ? '  ' + starsText(r.rating) : ''}\n`;
    }
  }
  if (!years.length) out += '\nNessuna lettura completata.\n';
  download(`letture-${today()}.txt`, out, 'text/plain;charset=utf-8');
  toast('Riepilogo scaricato nella cartella Download');
}
async function importFile(file) {
  let data;
  try { data = JSON.parse(await file.text()); } catch (e) { toast('Il file non è un backup valido'); return; }
  if (!data || !Array.isArray(data.books) || !Array.isArray(data.readings)) { toast('Il file non è un backup di questa app'); return; }
  const replace = confirm(`Il backup contiene ${data.books.length} libri e ${data.readings.length} letture.\n\nOK: sostituisci i dati di questo telefono.\nAnnulla: scegli se unirli.`);
  if (!replace && !confirm('Unire il backup ai dati attuali? I libri già presenti vengono aggiornati.')) return;
  if (replace) { await DB.clear('books'); await DB.clear('readings'); }
  await DB.putMany('books', data.books); await DB.putMany('readings', data.readings);
  if (data.settings && replace) { Object.assign(settings, data.settings); saveSettings(); applyTheme(); }
  books = await DB.all('books'); readings = await DB.all('readings');
  toast('Backup ripristinato'); render();
}

document.addEventListener('click', async (e) => {
  const el = e.target.closest('[data-act]');
  if (!el) return;
  const d = el.dataset;
  const b = d.id ? bookById(d.id) : null;
  switch (d.act) {
    case 'status': ui.status = d.v; render(); break;
    case 'clearplace': ui.place = null; render(); break;
    case 'place': ui.place = { room: d.room, shelf: d.shelf, level: d.level }; ui.status = 'tutti'; ui.q = ''; location.hash = '#/libreria'; break;
    case 'addtab': ui.addTab = d.v; render(); break;
    case 'manual': ui.draft = {}; location.hash = '#/nuovo'; break;
    case 'pick': ui.draft = Object.assign({}, ui.results[+d.i]); {
      const dup = ui.draft.isbn && books.find((x) => cleanIsbn(x.isbn) === cleanIsbn(ui.draft.isbn));
      if (dup && !confirm('Hai già un libro con questo ISBN. Aggiungerlo di nuovo?')) { location.hash = '#/libro/' + dup.id; break; }
      location.hash = '#/nuovo'; } break;
    case 'cancel': case 'back': history.length > 1 ? history.back() : (location.hash = '#/libreria'); break;
    case 'setstatus':
      if (d.v === 'prestato') { const who = prompt('A chi l’hai prestato?', b.lentTo || ''); if (who === null) break; b.lentTo = who.trim(); }
      await setStatus(b, d.v); render(); break;
    case 'start': await addReading({ bookId: b.id, start: today(), end: '' }); await setStatus(b, 'in-lettura'); toast('Buona lettura'); render(); break;
    case 'finish': {
      const open = readingsOf(b.id).find((r) => !r.end);
      if (open) { open.end = today(); await DB.put('readings', open); } else await addReading({ bookId: b.id, start: '', end: today() });
      if (b.status !== 'prestato') await setStatus(b, 'letto');
      toast('Segnato come letto: dagli un voto qui sotto'); render(); break;
    }
    case 'pastreading': await addReading({ bookId: b.id, start: '', end: today() }); if (b.status === 'da-leggere') await setStatus(b, 'letto'); toast('Lettura aggiunta: correggi le date qui sotto'); render(); break;
    case 'rate': { const r = readings.find((x) => x.id === d.rid); r.rating = r.rating === +d.v ? 0 : +d.v; await DB.put('readings', r); render(); break; }
    case 'delreading':
      if (!confirm('Eliminare questa lettura?')) break;
      await DB.del('readings', d.rid); readings = readings.filter((x) => x.id !== d.rid); render(); break;
    case 'delbook':
      if (!confirm(`Eliminare «${b.title}» e le sue letture? Non si può annullare.`)) break;
      await DB.del('books', b.id);
      for (const r of readingsOf(b.id)) await DB.del('readings', r.id);
      books = books.filter((x) => x.id !== b.id); readings = readings.filter((x) => x.bookId !== b.id);
      toast('Libro eliminato'); location.replace('#/libreria'); break;
    case 'lettab': ui.letTab = d.v; render(); break;
    case 'yearfilter': ui.yearFilter = d.v; render(); break;
    case 'statyear': ui.statYear = +d.v; render(); break;
    case 'export-json': exportJSON(); break;
    case 'export-csv': exportCSV(); break;
    case 'export-txt': exportTXT(); break;
    case 'import': $('#importfile').click(); break;
    case 'palette': settings.palette = d.v; if (settings.mode === 'scura' && d.v !== 'notte') settings.mode = 'chiara'; saveSettings(); applyTheme(); render(); break;
    case 'mode': settings.mode = d.v; saveSettings(); applyTheme(); render(); break;
    case 'wipe':
      if (!confirm('Cancellare tutti i libri e le letture da questo telefono?')) break;
      if (!confirm('Sicuro? Senza un backup i dati non si possono recuperare.')) break;
      await DB.clear('books'); await DB.clear('readings'); books = []; readings = []; toast('Dati cancellati'); location.hash = '#/libreria'; break;
  }
});

document.addEventListener('input', (e) => {
  if (e.target.id === 'q') { ui.q = e.target.value; $('#list').innerHTML = listHTML(); }
});
document.addEventListener('change', async (e) => {
  const t = e.target;
  if (t.id === 'genre') { ui.genre = t.value; $('#list').innerHTML = listHTML(); }
  else if (t.id === 'sort') { ui.sort = t.value; $('#list').innerHTML = listHTML(); }
  else if (t.id === 'goal') { settings.goal = Math.max(0, parseInt(t.value, 10) || 0); saveSettings(); toast('Obiettivo salvato'); }
  else if (t.id === 'importfile' && t.files[0]) { await importFile(t.files[0]); t.value = ''; }
  else if (t.dataset.rid && t.dataset.k) {
    const r = readings.find((x) => x.id === t.dataset.rid);
    r[t.dataset.k] = t.value; await DB.put('readings', r);
    const b = bookById(r.bookId);
    if (t.dataset.k === 'end' && t.value && b.status === 'in-lettura' && !readingsOf(b.id).some((x) => !x.end)) { await setStatus(b, 'letto'); render(); }
    toast('Date salvate');
  }
});
document.addEventListener('submit', async (e) => {
  e.preventDefault();
  const f = e.target;
  const fid = f.getAttribute('id');
  if (fid === 'bookform') await saveBook(f);
  else if (fid === 'isbnform') { stopCamera(); await handleIsbn(f.isbn.value); }
  else if (fid === 'searchform') {
    const q = f.q.value.trim(); if (!q) return;
    ui.lastQ = q;
    const box = $('#results'); box.innerHTML = '<p class="sub">Cerco…</p>';
    try { ui.results = await searchBooks(q); box.innerHTML = resultsHTML(ui.results); }
    catch (err) { box.innerHTML = '<p class="sub">Ricerca non riuscita: controlla la connessione e riprova.</p>'; }
  }
});

// ---------- Avvio ----------
(async function init() {
  applyTheme();
  try {
    await DB.open();
    books = await DB.all('books');
    readings = await DB.all('readings');
  } catch (e) {
    $('#app').innerHTML = '<div class="empty"><p>Impossibile aprire l’archivio del telefono. Esci dalla navigazione in incognito e riprova.</p></div>';
    return;
  }
  if (navigator.storage && navigator.storage.persist) navigator.storage.persist().then((p) => { viewDati.persisted = p; });
  render();
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js').catch(() => {});
})();
