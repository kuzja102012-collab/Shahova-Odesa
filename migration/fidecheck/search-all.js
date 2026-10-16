// Шукає у ПОВНОМУ списку FIDE (усі федерації) кандидатів для гравців без профілю FIDE.
// Порівняння — тією ж нормалізацією, що й players.js (кирилиця й латиниця зводяться до спільного «скелета»).
const fs = require('fs'), readline = require('readline');
const D = JSON.parse(fs.readFileSync('C:/Users/admin/Downloads/shahova-odesa-handoff/site/site-data.json', 'utf8'));
const CYR = { а: 'a', б: 'b', в: 'v', г: 'h', ґ: 'g', д: 'd', е: 'e', є: 'ie', ж: 'zh', з: 'z', и: 'y', і: 'i', ї: 'i', й: 'i', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'kh', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'shch', ь: '', ю: 'iu', я: 'ia', ё: 'e', ы: 'y', э: 'e', ъ: '', '’': '', "'": '' };
const lat = s => s.toLowerCase().split('').map(c => (c in CYR ? CYR[c] : c)).join('');
const norm = s => lat(s).replace(/[^a-z ]/g, ' ')
  .replace(/shch|sch/g, 's').replace(/zh/g, 'j').replace(/kh/g, 'h').replace(/tch|ch/g, 'c').replace(/ts/g, 'c').replace(/sh/g, 's')
  .replace(/x/g, 'ks').replace(/w/g, 'v').replace(/ph/g, 'f').replace(/g/g, 'h').replace(/y/g, 'i').replace(/j/g, 'i').replace(/\s+/g, ' ').trim();
const skel = s => norm(s).replace(/[aeiou]/g, '').replace(/(.)\1+/g, '$1');
function split(name) {
  let s = name.replace(/\s*\([^)]*\)\s*/g, ' ').replace(/^(ГМ|ММ|КМ|НМ|ФМ|МС|КМС)\s+/, '').trim();
  if (s.includes(',')) { const [a, b] = s.split(','); return [a.trim(), (b || '').trim().split(/\s+/)[0] || '']; }
  const p = s.split(/\s+/); return [p[0], p[1] || ''];
}
const lev = (a, b) => { const d = Array.from({ length: a.length + 1 }, (_, i) => [i]); for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); return d[a.length][b.length]; };

const targets = D.players.filter(p => !p.fide).map(p => {
  const keys = p.aliases.map(a => { const [f, g] = split(a); return { f: norm(f).replace(/ /g, ''), g: norm(g), fs: skel(f), raw: a }; });
  return { p, keys };
});
const bySur = new Map();
for (const t of targets) for (const k of t.keys) { (bySur.get(k.fs) || bySur.set(k.fs, []).get(k.fs)).push(t); }
const found = new Map();
let cols = null;
const rl = readline.createInterface({ input: fs.createReadStream('C:/Users/admin/AppData/Local/Temp/claude/C--Users-admin-OneDrive-Desktop--------/33d19de1-524d-433c-b26b-2e4a19dd27be/scratchpad/fide/x/players_list_foa.txt', 'latin1') });
const names = ['ID Number', 'Name', 'Fed', 'Sex', 'Tit', 'WTit', 'OTit', 'FOA', 'SRtng', 'SGm', 'SK', 'RRtng', 'RGm', 'Rk', 'BRtng', 'BGm', 'BK', 'B-day', 'Flag'];
rl.on('line', line => {
  if (!cols) { cols = names.map(n => ({ n, i: line.indexOf(n) })); return; }
  const get = k => { const j = cols.findIndex(c => c.n === k); const a = j === 0 ? 0 : cols[j].i; const b = j + 1 < cols.length ? cols[j + 1].i : line.length; return line.slice(a, b).trim(); };
  const num = k => { const j = cols.findIndex(c => c.n === k); const a = cols[j - 1].i + cols[j - 1].n.length; const b = cols[j].i + cols[j].n.length; return line.slice(a, b).trim(); };
  const nm = get('Name'); const [f, g] = split(nm); const fs_ = skel(f);
  const ts = bySur.get(fs_); if (!ts) return;
  const fn = norm(f).replace(/ /g, ''), gn = norm(g);
  for (const t of ts) for (const k of t.keys) {
    if (k.fs !== fs_ || lev(k.f, fn) > 1) continue;
    const gOk = gn === k.g || (gn && k.g && skel(g) === skel(k.raw.split(/[ ,]+/)[1] || '') && lev(gn, k.g) <= 2) || (k.g.length === 1 && gn[0] === k.g);
    if (!gOk) continue;
    const rec = { id: get('ID Number'), name: nm, fed: get('Fed'), sex: get('Sex'), tit: get('Tit') || get('WTit'), std: +num('SRtng') || 0, rapid: +num('RRtng') || 0, blitz: +num('BRtng') || 0, by: get('B-day'), flag: get('Flag') };
    const arr = found.get(t.p.id) || found.set(t.p.id, []).get(t.p.id);
    if (!arr.some(x => x.id === rec.id)) arr.push(rec);
  }
});
rl.on('close', () => {
  const out = [];
  for (const t of targets) {
    const c = found.get(t.p.id) || [];
    const rats = t.p.apps.filter(a => a[3]).map(a => { const e = D.events[a[0]]; return `${e.date.slice(0, 7)} ${e.disc} ${a[3]}`; });
    const cats = t.p.apps.map(a => D.events[a[0]].label).filter(l => /років|Ветерани/.test(l)).map(l => l.replace(/^.* — /, ''));
    out.push({ id: t.p.id, name: t.p.name, aliases: t.p.aliases, rats, cats: [...new Set(cats)], cands: c });
  }
  fs.writeFileSync(__dirname + '/unmatched-candidates.json', JSON.stringify(out, null, 1));
  for (const o of out) console.log(`${o.cands.length ? '●' : '·'} ${o.name} [${o.aliases.join(' | ')}] ${o.rats.slice(0, 3).join(', ')} ${o.cats.join('; ')}\n` +
    o.cands.map(x => `     → ${x.id} ${x.name} ${x.fed} ${x.sex} ${x.tit} ${x.std}/${x.rapid}/${x.blitz} н.${x.by} ${x.flag}`).join('\n'));
});
