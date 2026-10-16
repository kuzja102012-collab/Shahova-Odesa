// Реєстр шахістів: виступи з підсумкових таблиць і результатів, зіставлення написань, рейтинги FIDE.
// Використання: require('./players.js')(DATA) → {players, report}; або `node players.js` — звіт для перегляду.
const fs = require('fs'), path = require('path');
const SPEC = require('./players-spec.js');
const FIDE = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'fide', 'ukr.json'), 'utf8'));
// гравці, що перейшли в інші федерації (і т. п.) — записи з повного списку FIDE, підтверджені вручну (players-spec.js → fide)
const EXTRA = path.join(__dirname, '..', 'fide', 'extra.json');
if (fs.existsSync(EXTRA)) FIDE.push(...JSON.parse(fs.readFileSync(EXTRA, 'utf8')));
const FIDE_DATE = '2026-10'; // список FIDE за жовтень 2026
// історія рейтингів з ratings.fide.com (графік профілю), завантажена fidecheck/fetch-hist.js
const HIST = path.join(__dirname, '..', 'fidecheck', 'hist');
const MON = { Jan: 1, Feb: 2, Mar: 3, Apr: 4, May: 5, Jun: 6, Jul: 7, Aug: 8, Sep: 9, Oct: 10, Nov: 11, Dec: 12 };
// компактно з 2020 року: {s|r|b: [[РРММ, рейтинг], …]} — лише місяці, коли рейтинг змінився (0 = без рейтингу)
function fideHistory(id) {
  const f = path.join(HIST, id + '.json'); if (!fs.existsSync(f)) return null;
  const h = JSON.parse(fs.readFileSync(f, 'utf8')).map(e => { const [y, m] = e.date_2.split('-'); return { ym: (+y - 2000) * 100 + MON[m], e }; })
    .filter(x => x.ym >= 2001).sort((a, b) => a.ym - b.ym);
  const out = {}; let any = false;
  for (const [k, src] of [['s', 'rating'], ['r', 'rapid_rtng'], ['b', 'blitz_rtng']]) {
    let prev = null; const pts = [];
    for (const { ym, e } of h) { const v = +e[src] || 0; if (v !== prev) { pts.push([ym, v]); prev = v; } }
    while (pts.length && pts[0][1] === 0) pts.shift(); // до першого рейтингу — не показуємо
    if (pts.length) { out[k] = pts; any = true; }
  }
  return any ? out : null;
}

const CYR = { а: 'a', б: 'b', в: 'v', г: 'h', ґ: 'g', д: 'd', е: 'e', є: 'ie', ж: 'zh', з: 'z', и: 'y', і: 'i', ї: 'i', й: 'i', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'kh', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'shch', ь: '', ю: 'iu', я: 'ia', ё: 'e', ы: 'y', э: 'e', ъ: '', '’': '', "'": '' };
const isCyr = s => /[а-яіїєґё]/i.test(s);
const lat = s => s.toLowerCase().split('').map(c => (c in CYR ? CYR[c] : c)).join('');
const norm = s => lat(s).replace(/[^a-z ]/g, ' ')
  .replace(/shch|sch/g, 's').replace(/zh/g, 'j').replace(/kh/g, 'h').replace(/tch|ch/g, 'c').replace(/ts/g, 'c').replace(/sh/g, 's')
  .replace(/x/g, 'ks').replace(/w/g, 'v').replace(/ph/g, 'f').replace(/g/g, 'h').replace(/y/g, 'i').replace(/j/g, 'i').replace(/\s+/g, ' ').trim();
const skel = s => norm(s).replace(/[aeiou]/g, '').replace(/(.)\1+/g, '$1');
// «Прізвище, Ім'я» (латиниця) або «Прізвище Ім'я» (кирилиця) → [прізвище, ім'я]
function split(name) {
  let s = name.replace(/\s*\([^)]*\)\s*/g, ' ').replace(/^(ГМ|ММ|КМ|НМ|ФМ|МС|КМС)\s+/, '').trim();
  if (s.includes(',')) { const [a, b] = s.split(','); return [a.trim(), (b || '').trim().split(/\s+/)[0] || '']; }
  const parts = s.split(/\s+/);
  return [parts[0], parts[1] || ''];
}
const keyOf = name => { const [f, g] = split(name); return { sur: skel(f), given: skel(g), g0: norm(g)[0] || '', ns: norm(f), ng: norm(g), raw: name }; };
const lev = (a, b) => { const d = Array.from({ length: a.length + 1 }, (_, i) => [i]); for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); return d[a.length][b.length]; };
// та сама людина: прізвище збігається (або скелет однаковий і різниця ≤ 2 літер), ім'я — так само або ініціал
const surSame = (p, q) => p.ns === q.ns || (p.sur === q.sur && p.sur && lev(p.ns, q.ns) <= 2);
const givenSame = (p, q) => p.ng === q.ng || (p.given === q.given && p.given && lev(p.ng, q.ng) <= 2)
  || (p.ng.length === 1 && q.g0 === p.ng) || (q.ng.length === 1 && p.g0 === q.ng);
const samePerson = (p, q) => surSame(p, q) && givenSame(p, q);

module.exports = function buildPlayers(DATA) {
  const news = new Map(DATA.news.map(n => [n.id, n]));
  const apps = []; // виступи
  const ROMAN = { I: 1, II: 2, III: 3, IV: 4, V: 5, VI: 6, VII: 7, VIII: 8, IX: 9, X: 10, XI: 11, XII: 12, XIII: 13, XIV: 14, XV: 15, XVI: 16, XVII: 17, XVIII: 18, XIX: 19, XX: 20 };
  const rename = s => (SPEC.rename || {})[s] || s; // «КМ Максим Снігуров (Одеса)» → «Снігуров Максим»
  for (const [id, tprefix, date, disc, label, approx] of SPEC.tables) {
    const n = news.get(id); if (!n) throw new Error('players: немає новини ' + id);
    const t = (n.tables || []).find(x => x.title.startsWith(tprefix));
    if (!t) throw new Error(`players: немає таблиці «${tprefix}» у ${id}`);
    const ni = t.head.indexOf('Учасник'), pi = t.head.indexOf('Очки'), ri = t.head.indexOf('Рейтинг'), mi = t.head.indexOf('Місце');
    let rank = ''; t.rows.forEach((r, i) => {
      if (mi >= 0 && r[mi]) { rank = String(r[mi]).replace(/\.$/, ''); if (ROMAN[rank]) rank = String(ROMAN[rank]); }
      const shared = mi >= 0 && (!r[mi] || (t.rows[i + 1] && !t.rows[i + 1][mi]));
      let place = rank;
      if (/^\d+$/.test(rank) && shared) { let j = i; while (j + 1 < t.rows.length && !t.rows[j + 1][mi]) j++; let k = i; while (k > 0 && !t.rows[k][mi]) k--; place = `${+rank}–${+rank + (j - k)}`; }
      const rat = ri >= 0 ? String(r[ri]) : '';
      const tr = (SPEC.tableRename || []).find(([nid, tp, from]) => nid === id && t.title.startsWith(tp) && from === r[ni]);
      apps.push({ name: tr ? tr[3] : rename(r[ni]), raw: tr ? tr[3] : r[ni], newsId: id, table: t.title, date, disc, label, place, pts: pi >= 0 ? r[pi] : '', rat: /^\d{3,4}$/.test(rat) && rat !== '0000' ? +rat : null, n: t.rows.length, src: 'table', approx: !!approx });
    });
  }
  // призери з «Результатів». Для змагань з підсумковою таблицею: офіційне призове місце (за додатковими показниками)
  // замінює спільне «2–5» з протоколу, а призи за категоріями стають приміткою до виступу.
  const tabled = new Set(SPEC.tables.map(x => x[0]));
  const DISC_LABEL = { 'Класичні шахи': 'classic', 'Швидкі шахи': 'rapid', 'Бліц': 'blitz' };
  const isMain = l => !l || /^(Турнірна|Загальна) таблиця$/.test(l);
  for (const x of DATA.results || []) {
    for (const g of x.groups || []) {
      const gd = DISC_LABEL[g.label] || x.discipline;
      // окрема таблиця змагання під назвою групи («Ветерани 50+» → таблиця «Ветерани 50+ — рейтинг…»)
      const tp = g.label && apps.some(a => a.src === 'table' && a.newsId === x.newsId && a.table.startsWith(g.label)) ? g.label : '';
      const main = isMain(g.label) || !!DISC_LABEL[g.label] || !!tp;
      for (const p of g.places) {
        if (/—|ліцей|Ліцей|«|Одеса-1|БВР|золото|срібло|бронза/.test(p.name)) continue; // командні
        const champ = x.kind === 'champ' && !g.noChampion && p.p === '1';
        if (tabled.has(x.newsId) && main) {
          const a = apps.find(a => a.src === 'table' && a.newsId === x.newsId && a.disc === gd && (!tp || a.table.startsWith(tp)) && a.raw === p.name);
          if (a) { a.place = p.p; if (champ) a.champ = true; continue; }
        }
        const merge = tabled.has(x.newsId) && !/^Сума місць/.test(g.label || '') ? (main ? 'place' : 'cat') : '';
        apps.push({ name: rename(p.name), raw: p.name, newsId: x.newsId, table: '', date: x.dateStart, disc: gd, label: x.title + (g.label ? ' — ' + g.label : ''), cat: g.label || '', place: p.p, pts: p.pts, rat: null, n: null, src: 'result', champ, merge, tp });
      }
    }
  }

  // ── групування написань ──
  let clusters = [];
  const apart = (a, b) => (SPEC.keepApart || []).some(([x, y]) => (a === x && b === y) || (a === y && b === x));
  const find = name => { const k = keyOf(name); return clusters.find(c => c.keys.some(q => samePerson(k, q) && !apart(name, q.raw))); };
  for (const a of apps.sort((x, y) => (y.date || '').localeCompare(x.date || ''))) {
    let c = find(a.name);
    if (!c) { c = { names: new Set(), keys: [], apps: [] }; clusters.push(c); }
    if (!c.names.has(a.name)) { c.names.add(a.name); c.keys.push(keyOf(a.name)); }
    (c.raw = c.raw || new Set()).add(a.raw || a.name);
    c.apps.push(a);
  }
  // ручні об'єднання (після перегляду звіту)
  for (const group of SPEC.sameAs) {
    const hit = clusters.filter(c => group.some(n => c.names.has(n)));
    if (hit.length < 2) continue;
    const [main, ...rest] = hit;
    for (const r of rest) { r.names.forEach(n => main.names.add(n)); r.raw.forEach(n => main.raw.add(n)); main.keys.push(...r.keys); main.apps.push(...r.apps); }
    clusters = clusters.filter(c => !rest.includes(c));
  }
  // призери змагань з таблицею, чиє ім'я записане інакше, ніж у протоколі («Чайка В.» ↔ «Chaika, Vitalii»):
  // приєднуємо до виступу з таблиці того самого гравця
  for (const c of clusters) {
    for (const r of c.apps.filter(a => a.merge)) {
      const t = c.apps.find(a => a.src === 'table' && a.newsId === r.newsId && a.disc === r.disc && (!r.tp || a.table.startsWith(r.tp)));
      if (!t) continue;
      if (r.merge === 'place') { t.place = r.place; if (r.champ) t.champ = true; }
      else t.cat = (t.cat ? t.cat + '; ' : '') + r.cat + ' — ' + r.place + ' місце';
      r.drop = true;
    }
    c.nameApps = c.apps; // для вибору написання імені враховуємо й приєднані записи
    c.apps = c.apps.filter(a => !a.drop);
  }
  // ── FIDE ──
  const fideExact = new Map(), fideSkel = new Map();
  const put = (m, k, f) => (m.get(k) || m.set(k, []).get(k)).push(f);
  for (const f of FIDE) { const k = keyOf(f.name); put(fideExact, k.ns + '|' + k.ng, f); put(fideSkel, k.sur + '|' + k.given, f); }
  const report = { ambiguous: [], unmatched: [] };
  for (const c of clusters) {
    if (SPEC.noFide && [...c.names].some(n => SPEC.noFide.includes(n))) continue;
    const forcedId = [...c.names].map(n => SPEC.fide && SPEC.fide[n]).find(Boolean);
    const latin = [...c.names].filter(n => !isCyr(n));
    const lastRat = d => (c.apps.filter(a => a.rat && (!d || a.disc === d)).sort((x, y) => (y.date || '').localeCompare(x.date || ''))[0] || {});
    // спершу точний збіг написання, лише за його відсутності — близький (той самий «скелет» прізвища й імені)
    let cands = [];
    if (forcedId) cands = FIDE.filter(f => f.id === forcedId);
    else if (FIDE.some(f => latin.includes(f.name))) cands = FIDE.filter(f => latin.includes(f.name)); // написання збігається до літери
    else {
      for (const n of latin) { const k = keyOf(n); (fideExact.get(k.ns + '|' + k.ng) || []).forEach(f => { if (!cands.includes(f)) cands.push(f); }); }
      if (!cands.length) for (const n of latin) { const k = keyOf(n); (fideSkel.get(k.sur + '|' + k.given) || []).forEach(f => { if (!cands.includes(f) && samePerson(k, keyOf(f.name))) cands.push(f); }); }
    }
    if (cands.length > 1) { // кілька тезок — вибираємо за близькістю рейтингу
      const scored = cands.map(f => { let best = Infinity; for (const d of ['classic', 'rapid', 'blitz']) { const r = lastRat(d).rat; const fr = { classic: f.std, rapid: f.rapid, blitz: f.blitz }[d]; if (r && fr) best = Math.min(best, Math.abs(r - fr)); } return { f, best }; }).sort((a, b) => a.best - b.best);
      if (scored[0].best <= 120 && (scored.length < 2 || scored[1].best >= scored[0].best + 60)) cands = [scored[0].f];
      else { report.ambiguous.push({ names: [...c.names], cands: cands.map(f => `${f.id} ${f.name} ${f.std}/${f.rapid}/${f.blitz} ${f.by}`) }); cands = []; }
    }
    if (cands.length === 1) {
      const f = cands[0], d = lastRat(); const fr = d.rat && { classic: f.std, rapid: f.rapid, blitz: f.blitz }[d.disc];
      // різку розбіжність перевіряємо лише для свіжих протоколів (діти за 2–4 роки ростуть на сотні пунктів)
      if (!forcedId && fr && d.date >= '2025-07' && Math.abs(fr - d.rat) > 300) { report.ambiguous.push({ names: [...c.names], cands: [`розбіжність рейтингу: протокол ${d.rat} (${d.disc}, ${d.date}) vs FIDE ${fr}: ${f.id} ${f.name}`] }); }
      else { // рік народження з FIDE свідомо не беремо (серед гравців — діти)
        c.fide = { id: f.id, name: f.name, title: f.tit || f.wtit || '', std: f.std || 0, rapid: f.rapid || 0, blitz: f.blitz || 0 };
        if (f.fed && f.fed !== 'UKR') c.fide.fed = f.fed;
        if (/i/.test(f.flag || '')) c.fide.inactive = 1;
      }
    } else if (latin.length && !cands.length && !report.ambiguous.some(a => a.names.join() === [...c.names].join())) report.unmatched.push([...c.names].join(' / '));
  }
  // ── змагання (спільний список для всіх гравців) ──
  const events = [], evKey = new Map();
  const evIdx = a => { const k = a.newsId + '|' + a.label + '|' + a.date; if (!evKey.has(k)) { evKey.set(k, events.length); events.push({ newsId: a.newsId, label: a.label, date: a.date || '', disc: a.disc || '', of: a.n || 0 }); if (a.approx) events[events.length - 1].approx = 1; } return evKey.get(k); };
  // ── відображуване ім'я та ідентифікатор ──
  const used = new Set();
  const players = clusters.map(c => {
    const names = [...c.names];
    const full = n => { const [, g] = split(n); return g.length > 2 && !g.endsWith('.'); };
    const cyr = names.filter(n => isCyr(n) && full(n));
    let display = SPEC.display[names.find(n => SPEC.display[n])] || null;
    if (!display && cyr.length) { // найчастіше повне кириличне написання; за рівності — новіше
      const cnt = {}; (c.nameApps || c.apps).forEach(a => { if (isCyr(a.name) && full(a.name)) { const [f, g] = split(a.name); const nm = (f + ' ' + g).trim(); cnt[nm] = cnt[nm] || { n: 0, d: '' }; cnt[nm].n++; if ((a.date || '') > cnt[nm].d) cnt[nm].d = a.date || ''; } });
      display = Object.entries(cnt).sort((a, b) => b[1].n - a[1].n || b[1].d.localeCompare(a[1].d))[0][0];
    }
    if (!display) { const [f, g] = split(c.fide ? c.fide.name : names[0]); display = f + (g ? ', ' + g : ''); }
    let id = 'p-' + norm(display).replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    while (used.has(id)) id += '-2'; used.add(id);
    // компактно: [№ змагання в events, місце, очки, рейтинг у протоколі, 1 = чемпіонський титул, приз за категорією]
    const apps = c.apps.sort((x, y) => (y.date || '0').localeCompare(x.date || '0'))
      .map(a => { const r = [evIdx(a), a.place || '', a.pts || '', a.rat || 0, a.champ ? 1 : 0]; if (a.cat && a.src === 'table') r.push(a.cat); return r; });
    // написання з протоколів і повідомлень — для пошуку й посилань з таблиць
    const p = { id, name: display, aliases: [...new Set([...names, ...c.raw])], apps };
    if (c.fide) {
      p.fide = c.fide; const fh = fideHistory(c.fide.id); if (fh) p.fh = fh;
      // підтвердження: рейтинг у протоколі хоч одного змагання = рейтинг FIDE того місяця (±10)
      const at = (pts, ym) => { let v = 0; for (const [k, x] of pts) { if (k <= ym) v = x; else break; } return v; };
      const ok = !!fh && c.apps.some(a => { const s = fh[{ classic: 's', rapid: 'r', blitz: 'b' }[a.disc]]; if (!a.rat || !a.date || !s) return false;
        const v = at(s, (+a.date.slice(0, 4) - 2000) * 100 + +a.date.slice(5, 7)); return v && Math.abs(v - a.rat) <= 10; });
      if (!ok) p.fide.m = 'n'; // зіставлено за ім'ям (рейтинги в протоколах відсутні або національні)
    }
    return p;
  });
  report.players = players.length;
  report.multiName = players.filter(p => p.aliases.length > 1).map(p => `${p.name}  ⇐  ${p.aliases.join(' | ')}`);
  return { players: players.sort((a, b) => a.name.localeCompare(b.name, 'uk')), events, fideDate: FIDE_DATE, report };
};

if (require.main === module) {
  const DATA = JSON.parse(fs.readFileSync('C:/Users/admin/Downloads/shahova-odesa-handoff/site/site-data.json', 'utf8'));
  const { players, report } = module.exports(DATA);
  fs.writeFileSync(path.join(__dirname, 'players-report.txt'), [
    `гравців: ${report.players}; з FIDE: ${players.filter(p => p.fide).length}`,
    '', '## Об\'єднані написання', ...report.multiName,
    '', '## Неоднозначні збіги з FIDE', ...report.ambiguous.map(a => a.names.join(' / ') + '\n    ' + a.cands.join('\n    ')),
    '', '## Латинські імена без збігу у FIDE', ...report.unmatched,
    '', '## Усі гравці', ...players.map(p => `${p.name} | ${p.aliases.length} нап. | ${p.apps.length} вист. | титулів ${p.apps.filter(a => a[4]).length} | ${p.fide ? 'FIDE ' + p.fide.id + ' ' + p.fide.std + '/' + p.fide.rapid + '/' + p.fide.blitz : '—'}`),
  ].join('\n'));
  console.log(`гравців: ${report.players}, з FIDE: ${players.filter(p => p.fide).length}, об'єднань: ${report.multiName.length}, неоднозначних: ${report.ambiguous.length}, без збігу: ${report.unmatched.length}`);
}
