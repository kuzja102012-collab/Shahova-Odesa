// Збирання DATA для «Шахової Одеси»: базові дані + специфікація перенесення → site-data.json і index.html.
// Запуск: node build.js [--preview] [--no-download]
const fs = require('fs'), path = require('path');
const SITE = 'C:/Users/admin/Downloads/shahova-odesa-handoff/site';
const HERE = __dirname, ROOT = path.dirname(HERE);
const PREVIEW = process.argv.includes('--preview');
const NODL = process.argv.includes('--no-download');
const reg = require(path.join(ROOT, 'registry.json'));
const sizes = require(path.join(ROOT, 'oldsite/media-sizes.json'));

// ── базові дані: незмінна копія стану до перенесення ──
const BASE = path.join(HERE, 'base-data.json');
if (!fs.existsSync(BASE)) fs.copyFileSync(path.join(SITE, 'site-data.json'), BASE);
const DATA = JSON.parse(fs.readFileSync(BASE, 'utf8'));
const specs = [...require('./spec-a.js'), ...require('./spec-b.js')];
let results = []; try { results = require('./spec-results.js'); } catch (e) { if (!/Cannot find module/.test(e.message)) throw e; }

// ── джерела ──
const PFX = { H: 'P1870', N: 'P49', T: 'P676', A: 'W20240908010423_архів-новин_', R: 'W20220808221736_' };
const isRef = s => typeof s === 'string' && /^([HNTAR]|P\d+|W\d{14}[^:]*):\d+$/.test(s);
const keyOf = ref => { const i = ref.lastIndexOf(':'); const p = ref.slice(0, i); return (PFX[p] || p) + ':' + ref.slice(i + 1); };
function block(ref) { const b = reg[keyOf(ref)]; if (!b) throw new Error('немає блоку ' + ref); return b; }
const CHROME_HEAD = ['Архів новин', 'Новости', 'Новини'];
function blockLines(ref) {
  const key = keyOf(ref); let lines = block(ref).text.slice();
  if (key.startsWith('W')) {
    if (key.endsWith(':0')) { let cut = -1; lines.slice(0, 40).forEach((l, i) => { if (CHROME_HEAD.includes(l)) cut = i; }); if (cut >= 0) lines = lines.slice(cut + 1); }
    const f = lines.findIndex(l => l === 'Контакты' || l === 'Контакти'); if (f >= 0) lines = lines.slice(0, f);
  }
  return lines;
}
const DROP_ALWAYS = [/^(АНОНС|Анонс)$/, /^Шановні учні та батьки!?$/i, /^•$/];
function mergeLines(lines) {
  const out = [];
  for (let l of lines) {
    l = l.replace(/[ \t\u00a0]+/g, ' ').trim(); if (!l) continue;
    const prev = out[out.length - 1];
    const join = prev && !prev.startsWith('## ') && !prev.startsWith('• ') && !/[.!?:;]$/.test(prev)
      && /^[a-zа-яіїєґ(]/.test(l) && !l.startsWith('• ');
    if (join) out[out.length - 1] = prev + ' ' + l; else out.push(l);
  }
  return out;
}
function textFrom(list, drop = [], fix = []) {
  const res = [];
  for (const it of list) {
    if (isRef(it)) {
      let lines = blockLines(it).filter(l => !DROP_ALWAYS.some(r => r.test(l)) && !drop.some(d => new RegExp(d).test(l)));
      for (const [a, b] of fix) lines = lines.map(l => l.split(a).join(b));
      res.push(...mergeLines(lines));
    } else if (it.startsWith('= ')) res.push(it.slice(2));
    else res.push(it);
  }
  return res;
}

// ── файли ──
const TR = { а: 'a', б: 'b', в: 'v', г: 'h', ґ: 'g', д: 'd', е: 'e', є: 'ie', ж: 'zh', з: 'z', и: 'y', і: 'i', ї: 'i', й: 'i', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'kh', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'shch', ь: '', ю: 'iu', я: 'ia', ы: 'y', э: 'e', ё: 'e', ъ: '' };
function asciiName(file) {
  if (!/[^\x00-\x7f]/.test(file)) return file;
  return file.toLowerCase().split('').map(c => (c in TR ? TR[c] : c)).join('').replace(/[^a-z0-9._-]/g, '_');
}
const KIND_DIR = { photo: 'photos', scan: 'scans', doc: 'docs' };
const used = new Map(); // локальний шлях → вихідний файл (контроль колізій)
const downloads = new Map(); // локальний шлях → {url}
function local(rel, kind) {
  const [y, m, file] = rel.split('/');
  let name = asciiName(file);
  if (rel === '2026/08/Регламент-scaled.jpg') name = 'reglament.jpg'; // збігається з уже опублікованим шляхом
  const p = `assets/${KIND_DIR[kind]}/${y}-${m}/${name}`;
  if (used.has(p) && used.get(p) !== rel) throw new Error(`колізія ${p}: ${used.get(p)} і ${rel}`);
  used.set(p, rel);
  const s = sizes[rel] || {};
  const direct = 'https://chessclub.com.ua/wp-content/uploads/' + rel.split('/').map(encodeURIComponent).join('/');
  downloads.set(p, kind === 'photo' ? (s.large || s.full || direct) : (s.full || direct));
  return p;
}
function thumb(rel) {
  const [y, m, file] = rel.split('/');
  const p = `assets/photos/${y}-${m}/t/${asciiName(file)}`;
  const s = sizes[rel] || {};
  downloads.set(p, s.medium || s.large || s.full || ('https://chessclub.com.ua/wp-content/uploads/' + rel.split('/').map(encodeURIComponent).join('/')));
  return p;
}
const oldPath = new Map(); // вихідний файл → локальний шлях (для .htaccess)
function photo(rel, caption = '') { const src = local(rel, 'photo'); oldPath.set(rel, src); return { src, thumb: thumb(rel), caption }; }
function scan(rel, caption = '') { const src = local(rel, 'scan'); oldPath.set(rel, src); return { src, caption }; }
function doc(rel, title) { const url = local(rel, 'doc'); oldPath.set(rel, url); return { title, url }; }
const fromLocalPhoto = src => { // зворотне зіставлення вже перенесених файлів: assets/photos/2025-02/x.jpg → 2025/02/x.jpg
  const m = src.match(/^assets\/(?:photos|docs)\/(\d{4})-(\d{2})\/(.+)$/); if (!m) return null;
  const cand = Object.keys(sizes).find(k => k.startsWith(`${m[1]}/${m[2]}/`) && asciiName(k.split('/')[2]) === m[3]);
  return cand || (m[3] === 'blyts_01_cr.jpg' ? '2026/07/Блиц_01_cr.jpg' : null);
};
function imgsFrom(list) {
  const out = [];
  for (const x of list) (isRef(x) ? block(x).imgs : [x]).forEach(i => { if (!out.includes(i)) out.push(i); });
  return out.filter(i => !/logo-ch|cropped-|fon3/.test(i));
}

// ── таблиці з текстових протоколів ──
const half = s => { const n = Number(s); const w = Math.floor(n); const f = Math.round((n - w) * 10) / 10; return f === 0.5 ? (w ? w + '½' : '½') : String(w); };
const halfB = s => { const n = Number(s); const w = Math.floor(n); const f = Math.round((n - w) * 100) / 100; return f === 0.5 ? w + '½' : f === 0 ? String(w) : String(n).replace('.', ','); };
function parseSwiss(ref, title) {
  const re = /^(?:(\d+)\.\s+)?(\d+)\s+(.+?)\s+(\d+(?:\.\d)?)\s+(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)\s+(\d{3,4})\s+(\d+|-)\s+([+-]?\d+(?:\.\d+)?)\s*$/;
  const rows = [];
  for (const l of block(ref).text) { const m = l.replace(/\s+/g, ' ').trim().match(re); if (m) rows.push([m[1] ? m[1] + '.' : '', m[3].trim(), half(m[4]), halfB(m[5]), m[8] === '0000' ? 'б/р' : m[8]]); }
  if (!rows.length) throw new Error('порожній протокол ' + ref);
  return { title, head: ['Місце', 'Учасник', 'Очки', 'Бухг.', 'Рейтинг'], rows };
}
function parsePairs(ref, title) {
  const rows = [];
  for (const l of block(ref).text) {
    const m = l.match(/^(\d+)\s+(.+?)\s*\(\s*([\d.]+)\s*\)\s*-\s*(.+?)\s*\(\s*([\d.]+)\s*\)/);
    if (m) rows.push([m[1], `${m[2].trim()} (${half(m[3])})`, `${m[4].trim()} (${half(m[5])})`]);
  }
  return { title, head: ['Дошка', 'Білі (очки)', 'Чорні (очки)'], rows };
}
function parseCross(ref, title) {
  const lines = block(ref).text; const k = lines.indexOf('K |');
  const cells = lines.slice(k + 1).map(l => l.replace(/\|$/, '').trim()).filter((c, i, a) => true);
  const rows = [];
  for (let i = 0; i + 17 <= cells.length; i += 17) rows.push(cells.slice(i, i + 17));
  const n = rows.length, res = rows.map(r => r.slice(5, 15).map(c => c.replace('´', '')));
  const val = c => c === '1' ? 1 : c === '0' ? 0 : c === '=' ? 0.5 : null;
  // перевірка симетрії результатів
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) if (i !== j) {
    const a = val(res[i][j]), b = val(res[j][i]);
    if (a === null || b === null || a + b !== 1) throw new Error(`хрест-таблиця ${ref}: несиметричний результат ${i + 1}-${j + 1}: ${res[i][j]}/${res[j][i]}`);
  }
  const pts = res.map(r => r.reduce((s, c) => s + (val(c) || 0), 0));
  return { title, head: ['№', 'Учасник', 'Рейтинг', 'Федерація', 'Звання', ...Array.from({ length: n }, (_, i) => String(i + 1)), 'Очки*'],
    rows: rows.map((r, i) => [r[0], r[1], r[2], r[3], r[4], ...res[i].map((c, j) => i === j ? '×' : c === '=' ? '½' : c), half(pts[i])]) };
}
function buildTable(t) {
  if (t.swiss) return parseSwiss(t.swiss, t.title);
  if (t.pairs) return parsePairs(t.pairs, t.title);
  if (t.crosstable) return parseCross(t.crosstable, t.title);
  return t;
}

// ── дата ──
function resolveDate(d) {
  if (d && d.startsWith('img:')) { const s = sizes[d.slice(4)]; if (!s) throw new Error('немає дати для ' + d); return s.date.slice(0, 10); }
  return d || '';
}

// ── застосування специфікації ──
const byId = new Map(DATA.news.map(n => [n.id, n]));
const report = [];
for (const s of specs) {
  let n;
  if (s.update) {
    n = byId.get(s.id); if (!n) throw new Error('немає запису для оновлення ' + s.id);
    // наявні фото → або лишаються фото (з мініатюрами), або переходять у протоколи
    const prevPhotos = (n.photos || []).map(p => fromLocalPhoto(p.src)).filter(Boolean);
    if (s.photosToScans) n.photos = []; else n.photos = (n.photos || []).filter(p => !(s.scans || []).some(([r]) => fromLocalPhoto(p.src) === r));
    if (!s.photosToScans && !s.photos) n.photos = prevPhotos.filter(r => !(s.scans || []).some(([x]) => x === r)).map(r => photo(r));
  } else {
    if (byId.has(s.id)) throw new Error('дубль id ' + s.id);
    n = { id: s.id, date: '', dateNote: '', year: '', title: '', lead: '', body: [], tables: [], photos: [], needsCheck: '', docs: [], related: [], status: '' };
    DATA.news.push(n); byId.set(s.id, n);
  }
  for (const f of ['title', 'lead', 'status', 'needsCheck', 'dateNote', 'sortDate']) if (s[f] !== undefined) n[f] = s[f];
  if (s.date !== undefined) n.date = resolveDate(s.date);
  n.year = s.year || (n.date ? n.date.slice(0, 4) : n.year);
  if (s.fix) n.body = n.body.map(p => s.fix.reduce((t, [a, b]) => t.split(a).join(b), p));
  if (s.body) n.body = textFrom(s.body, s.textDrop, s.textFix);
  if (s.text) n.body = textFrom(s.text, s.textDrop, s.textFix);
  if (s.prependText) n.body = [...textFrom(s.prependText, s.textDrop, s.textFix), ...n.body];
  if (s.appendText) n.body = [...n.body, ...textFrom(s.appendText, s.textDrop, s.textFix)];
  if (s.appendBody) n.body = [...n.body, ...s.appendBody];
  // фото, протоколи, документи
  const scanList = (s.scans || []).slice();
  const docList = (s.docs || []).map(([r]) => r);
  if (s.photos) {
    let imgs = imgsFrom(s.photos).filter(i => !scanList.some(([r]) => r === i) && !docList.includes(i));
    if (s.photosAreScansIf) { const re = new RegExp(s.photosAreScansIf); imgs.filter(i => re.test(i)).forEach(i => { if (!scanList.some(([r]) => r === i)) scanList.push([i, 'Таблиця (протокол)']); }); imgs = imgs.filter(i => !re.test(i)); }
    n.photos = imgs.map(i => photo(i));
  }
  if (scanList.length) n.scans = scanList.map(([r, c]) => scan(r, c));
  if (s.docs) n.docs = [...(n.docs || []).filter(d => !s.docs.some(([r]) => d.url === local(r, 'doc'))), ...s.docs.map(([r, t]) => doc(r, t))];
  if (s.tables) n.tables = [...(s.update ? n.tables || [] : []), ...s.tables.map(buildTable)];
  if (s.tablesPrepend) n.tables = [...s.tablesPrepend.map(buildTable), ...(n.tables || [])];
  if (s.related) n.related = s.related;
  // джерело
  const notes = [];
  if (s.wayback) notes.push(`Відновлено з архівної копії старого сайту chessclub.com.ua (Web Archive, знімок ${s.wayback}).`);
  if (s.translated && !s.sourceNote) notes.push('Переклад з російськомовного оригіналу.');
  if (s.sourceNote) notes.push(s.sourceNote);
  if (notes.length) n.sourceNote = notes.join(' ');
  if (s.announcement) {
    const a = { id: s.announcement.id, newsId: n.id, title: n.title, place: 'м. Одеса, вул. Канатна, 95', regulation: '', ...s.announcement };
    DATA.announcements = DATA.announcements.filter(x => x.id !== a.id); DATA.announcements.push(a);
  }
  report.push(n);
}
// транскрипції протоколів-зображень 2023–2026 — на початок таблиць відповідного матеріалу
{
  const TRANS = require('./transcribed.js'); const add = new Map();
  for (const [key, t] of Object.entries(TRANS)) {
    const id = key.split('#')[0]; if (!byId.has(id)) throw new Error('транскрипція: немає новини ' + id);
    const rows = t.rows.trim().split('\n').map(l => { const [p, name, pts, wp, rat] = l.split('|').map(s => s.trim());
      return [p, name, half(pts), halfB(wp), rat === '0000' ? 'б/р' : rat]; });
    (add.get(id) || add.set(id, []).get(id)).push({ title: t.title, head: ['Місце', 'Учасник', 'Очки', 'Бухг.', 'Рейтинг'], rows, transcribed: true });
  }
  for (const [id, tbls] of add) { const n = byId.get(id); n.tables = [...tbls, ...(n.tables || []).filter(x => !tbls.some(y => y.title === x.title))]; }
}
// наявні записи, яких специфікація не торкалася, — фото з мініатюрами
for (const n of DATA.news) if ((n.photos || []).some(p => !p.thumb)) n.photos = n.photos.map(p => { const r = fromLocalPhoto(p.src); return r ? photo(r, p.caption) : p; });
// документи, що вже лежать локально, — у карту старих адрес
for (const n of DATA.news) for (const d of n.docs || []) { const r = fromLocalPhoto(d.url); if (r) { oldPath.set(r, d.url); used.set(d.url, r); } }
// пов’язані матеріали: лише наявні id
const ids = new Set(DATA.news.map(n => n.id));
for (const n of DATA.news) { const bad = (n.related || []).filter(r => !ids.has(r)); if (bad.length) { console.log('  ! відкинуто пов’язані', n.id, bad); n.related = n.related.filter(r => ids.has(r)); } }
DATA.results = results;
// виправлення транскрипцій після звірки з протоколами
const FIX = require('./fixes.js');
Object.assign(DATA.contacts, FIX.contacts || {});
// підтверджене написання прізвищ — у всіх рядках новин і результатів
const fixStr = s => (FIX.names || []).reduce((t, [a, b]) => t.split(a).join(b), s);
const fixNames = o => { for (const k of Object.keys(o)) { // зміна на місці, щоб посилання byId лишались чинними
  if (typeof o[k] === 'string') o[k] = fixStr(o[k]); else if (o[k] && typeof o[k] === 'object') fixNames(o[k]); } };
fixNames(DATA.news); fixNames(DATA.results);
for (const [id, tprefix, who, col, from, to] of FIX.cells) {
  const n = byId.get(id); const t = (n.tables || []).find(x => x.title.startsWith(tprefix));
  const ci = t && t.head.indexOf(col); const row = t && t.rows.find(r => r[1] === who);
  if (!row || ci < 0) throw new Error(`виправлення: не знайдено ${id} / ${tprefix} / ${who}`);
  if (row[ci] !== from) throw new Error(`виправлення: ${id} / ${who}: очікувалось «${from}», є «${row[ci]}»`);
  row[ci] = to;
}
for (const [src, cap] of FIX.captions) {
  let hit = 0; for (const n of DATA.news) for (const s of n.scans || []) if (s.src === src) { s.caption = cap; hit++; }
  if (!hit) throw new Error('виправлення підпису: немає ' + src);
}
// «без рейтингу» — завжди «б/р» (правило проєкту)
for (const n of DATA.news) for (const t of n.tables || []) {
  const fixRows = (head, rows) => { const ri = (head || []).indexOf('Рейтинг'); if (ri >= 0) rows.forEach(r => { if (r[ri] === '—' || r[ri] === '0000') r[ri] = 'б/р'; }); };
  if (t.rows) fixRows(t.head, t.rows); (t.groups || []).forEach(g => fixRows(g.head, g.rows));
}
const sk = n => n.date || n.sortDate || n.year + '-00-00';
DATA.news.sort((a, b) => sk(b).localeCompare(sk(a)));
// шахісти: реєстр з підсумкових таблиць і подіумів + рейтинги FIDE (players.js, ручні правила — players-spec.js)
const PL = require('./players.js')(DATA);
Object.assign(DATA, { fideDate: PL.fideDate, events: PL.events, players: PL.players });
// мітка версії даних: сторінка порівнює її з site-data.json на хостингу (після публікації з редактора)
DATA.updated = new Date().toISOString().replace(/\.\d+Z$/, 'Z');
console.log(`шахістів: ${PL.players.length} (з FIDE ${PL.players.filter(p => p.fide).length}), змагань у реєстрі: ${PL.events.length}`);
// контроль сум очок у розібраних протоколах: N гравців × R турів ÷ 2 (непарне N — з урахуванням пропуску туру)
const ptsOf = v => { const m = String(v).match(/^(\d*)(½?)$/); return m ? (+m[1] || 0) + (m[2] ? 0.5 : 0) : NaN; };
for (const n of DATA.news) for (const t of n.tables || []) {
  if (!t.head || t.head[2] !== 'Очки' || !t.rows) continue;
  const sum = t.rows.reduce((s, r) => s + ptsOf(r[2]), 0), N = t.rows.length;
  const rounds = (t.title.match(/після (\d+) туру/) || [])[1];
  const exp = rounds ? (N % 2 ? (N + 1) * rounds / 2 : N * rounds / 2) : null;
  t._check = `${N} гравців, сума ${sum}` + (exp !== null ? `, очікувано ${exp}${N % 2 ? ' (з пропуском туру = 1 очко)' : ''}` + (Math.abs(sum - exp) < 0.01 ? ' ✓' : ' ✗') : '');
}
if (process.argv.includes('--checks')) { for (const n of DATA.news) for (const t of n.tables || []) if (t._check) console.log(n.id.padEnd(30), t.title.slice(0, 40).padEnd(40), t._check); }
for (const n of DATA.news) for (const t of n.tables || []) delete t._check;

// ── перегляд ──
if (PREVIEW) {
  const only = process.argv.find(a => a.startsWith('--id='));
  for (const n of DATA.news) {
    if (only && !n.id.includes(only.slice(5))) continue;
    console.log(`\n## ${n.id} | ${n.date || n.dateNote} | ${n.status}\n   ${n.title}\n   L: ${n.lead}`);
    n.body.forEach(p => console.log('   · ' + p));
    (n.tables || []).forEach(t => console.log(`   [tbl] ${t.title}: ${(t.rows || []).length} рядків`));
    console.log(`   [фото ${(n.photos || []).length}] [протоколи ${(n.scans || []).length}] [док ${(n.docs || []).length}]${n.sourceNote ? '\n   src: ' + n.sourceNote : ''}${n.needsCheck ? '\n   !: ' + n.needsCheck : ''}`);
  }
  console.log('\nновин:', DATA.news.length, '| анонсів:', DATA.announcements.length, '| файлів до завантаження:', downloads.size);
  process.exit(0);
}

// ── завантаження ──
(async () => {
  let got = 0, skip = 0, fail = 0, bytes = 0;
  const todo = [...downloads].filter(([p]) => !fs.existsSync(path.join(SITE, p)));
  skip = downloads.size - todo.length;
  if (!NODL) {
    const worker = async () => {
      for (;;) {
        const it = todo.shift(); if (!it) return;
        const [p, url] = it;
        try {
          const res = await fetch(url); if (!res.ok) throw new Error('HTTP ' + res.status);
          const buf = Buffer.from(await res.arrayBuffer());
          const ok = /\.pdf$/i.test(p) ? buf.slice(0, 5).toString() === '%PDF-' : (buf[0] === 0xff && buf[1] === 0xd8) || buf.slice(1, 4).toString() === 'PNG';
          if (!ok) throw new Error('не зображення/PDF');
          fs.mkdirSync(path.dirname(path.join(SITE, p)), { recursive: true });
          fs.writeFileSync(path.join(SITE, p), buf); got++; bytes += buf.length;
        } catch (e) { fail++; console.log('  ! ', p, url, e.message); }
      }
    };
    await Promise.all(Array.from({ length: 6 }, worker));
  }
  console.log(`файли: завантажено ${got} (${(bytes / 1048576).toFixed(1)} МБ), уже були ${skip}, помилок ${fail}`);
  if (process.argv.includes('--download-only')) return;

  // ── запис даних ──
  // масиви з простих значень (рядки таблиць, виступи гравців) — в один рядок, щоб файл не розростався
  // «</script» усередині тексту зламав би сторінку — екрануємо (у JSON «\/» — те саме «/»)
  // реєстр шахістів (виступи, історія FIDE) — по рядку на гравця/змагання: його не правлять руками, а відступи подвоюють розмір
  const compact = a => '[\n' + a.map(x => '  ' + JSON.stringify(x)).join(',\n') + '\n ]';
  const json = JSON.stringify(Object.assign({}, DATA, { events: '@@EVENTS@@', players: '@@PLAYERS@@' }), null, 1)
    .replace(/\[\n(?:\s*(?:"(?:[^"\\\n]|\\.)*"|-?\d+(?:\.\d+)?|true|false|null),?\n)+\s*\]/g, m => JSON.stringify(JSON.parse(m)))
    .replace('"@@EVENTS@@"', () => compact(DATA.events)).replace('"@@PLAYERS@@"', () => compact(DATA.players))
    .replace(/<\/(script)/gi, '<\\/$1');
  if (JSON.stringify(JSON.parse(json)) !== JSON.stringify(DATA)) throw new Error('запис даних: JSON не збігається з DATA');
  fs.writeFileSync(path.join(SITE, 'site-data.json'), json);
  const html = fs.readFileSync(path.join(SITE, 'index.html'), 'utf8');
  const start = html.indexOf('const DATA = {');
  const end = html.indexOf('\n};\n', start);
  if (start < 0 || end < 0) throw new Error('не знайдено const DATA у index.html');
  fs.writeFileSync(path.join(SITE, 'index.html'), html.slice(0, start) + 'const DATA = ' + json + ';\n' + html.slice(end + 4));

  // ── .htaccess: правила для старих адрес файлів ──
  fs.writeFileSync(path.join(HERE, 'oldpaths.json'), JSON.stringify([...oldPath].sort(), null, 1));
  console.log('новин:', DATA.news.length, '| анонсів:', DATA.announcements.length, '| результатів:', DATA.results.length, '| старих адрес файлів:', oldPath.size);
})();
