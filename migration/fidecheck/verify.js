// Перевірка кожного зіставлення «гравець ↔ профіль FIDE» за незалежними ознаками:
//  1) рейтинг у протоколі змагання = рейтинг FIDE того місяця (історія з ratings.fide.com) — найсильніший доказ;
//  2) стать (за ім'ям) = стать у FIDE;  3) рік народження сумісний з віковою категорією змагання;
//  4) останні рейтинги в історії = рейтинги зі списку FIDE (перевірка розбору списку).
const fs = require('fs'), path = require('path');
const D = JSON.parse(fs.readFileSync('C:/Users/admin/Downloads/shahova-odesa-handoff/site/site-data.json', 'utf8'));
const UKR = new Map(JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'fide', 'ukr.json'), 'utf8')).map(f => [f.id, f]));
const UNM = JSON.parse(fs.readFileSync(path.join(__dirname, 'unmatched-candidates.json'), 'utf8'));
const NEWIDS = new Set(fs.readFileSync(path.join(__dirname, 'ids2.txt'), 'utf8').split(/\s+/).filter(Boolean));
const MON = { Jan: 1, Feb: 2, Mar: 3, Apr: 4, May: 5, Jun: 6, Jul: 7, Aug: 8, Sep: 9, Oct: 10, Nov: 11, Dec: 12 };
function hist(id) {
  const f = path.join(__dirname, 'hist', id + '.json'); if (!fs.existsSync(f)) return null;
  return JSON.parse(fs.readFileSync(f, 'utf8')).map(e => { const [y, m] = e.date_2.split('-'); return { k: +y * 100 + MON[m], std: +e.rating || 0, rapid: +e.rapid_rtng || 0, blitz: +e.blitz_rtng || 0, c: e.country, name: e.name }; })
    .sort((a, b) => a.k - b.k);
}
const at = (h, k) => { let r = null; for (const e of h) { if (e.k <= k) r = e; else break; } return r; };
const DK = { classic: 'std', rapid: 'rapid', blitz: 'blitz' };
const MALE_A = ['микола', 'ілля', 'нікіта', 'микита', 'лука', 'сава', 'кузьма', 'хома', 'данила', 'nikita', 'mykyta', 'mykola', 'luka', 'illia', 'ilya', 'danila', 'kuzma'];
function sexOf(p) {
  const n = p.name.includes(',') ? p.name.split(',')[1].trim().split(/\s+/)[0] : (p.name.split(/\s+/)[1] || '');
  const g = n.toLowerCase(); if (!g || g.length < 3) return '';
  if (MALE_A.includes(g)) return 'M';
  if (['ніколь', 'nikol', 'любов'].includes(g)) return 'F';
  return /[ая]$|ia$|a$/.test(g) ? 'F' : 'M';
}
function ageRule(label, y) { // [мін. рік народження, макс. рік народження]
  if (/Фінал до 20 років|Ветерани/.test(label)) {
    const v = label.match(/Ветерани (\d+)\+/); return v ? [0, y - +v[1] + 1] : null; }
  const m = [...label.matchAll(/до (\d+)(?: і (\d+))?(?:, (\d+))?(?: і (\d+))? років/g)].flatMap(x => x.slice(1).filter(Boolean).map(Number));
  return m.length ? [y - Math.max(...m) - 1, 9999] : null;
}
function check(p, fid, rec) {
  const h = hist(fid); const out = { player: p.name, pid: p.id, fid, fname: rec ? rec.name : '', notes: [], score: 0 };
  if (!h) { out.notes.push('немає історії'); out.verdict = 'немає історії'; return out; }
  if (!h.length) { out.notes.push('у FIDE ніколи не було рейтингу'); out.verdict = 'без рейтингу FIDE'; return out; }
  const last = h[h.length - 1]; out.fed = last.c; out.fname = out.fname || last.name;
  if (rec && (rec.std !== last.std || rec.rapid !== last.rapid || rec.blitz !== last.blitz) && last.k === 202610)
    out.notes.push(`список ≠ історія: ${rec.std}/${rec.rapid}/${rec.blitz} vs ${last.std}/${last.rapid}/${last.blitz}`);
  let exact = 0, close = 0, far = 0, unr = 0, dflt = 0; const ex = [];
  for (const a of p.apps) {
    const e = D.events[a[0]], r = a[3]; if (!r || !e.date || !DK[e.disc]) continue;
    if (r === 1900 && e.date < '2021-02') { dflt++; continue; } // «1900» у протоколах 2020/21 — умовне значення
    const k = +e.date.slice(0, 4) * 100 + +e.date.slice(5, 7), v = at(h, k), fv = v && v[DK[e.disc]];
    if (!fv) { unr++; ex.push(`${e.date.slice(0, 7)} ${e.disc} прот.${r} FIDE—`); continue; }
    const d = r - fv; if (Math.abs(d) <= 10) exact++; else if (Math.abs(d) <= 60) close++; else far++;
    ex.push(`${e.date.slice(0, 7)} ${e.disc} прот.${r} FIDE ${fv}`);
  }
  Object.assign(out, { exact, close, far, unr, dflt, ex: ex.slice(0, 6) });
  const fsex = rec ? rec.sex : '', psex = sexOf(p);
  if (fsex && psex && fsex !== psex) out.notes.push(`стать: ім'я ${psex}, FIDE ${fsex}`);
  const by = rec ? +rec.by : 0;
  for (const a of p.apps) { const e = D.events[a[0]]; const r = ageRule(e.label, +e.date.slice(0, 4));
    if (r && by && (by < r[0] || by > r[1])) out.notes.push(`вік: ${e.label.replace(/^.* — /, '')} ${e.date.slice(0, 4)}, FIDE н.${by}`); }
  // підсумок: підтверджено рейтингом / узгоджено / сумнівно
  out.verdict = exact ? 'ПІДТВЕРДЖЕНО' : close && !far ? 'узгоджено' : far && !exact && !close ? 'СУМНІВНО' : (unr && !far) ? 'без рейтингу FIDE тоді' : 'лише ім\'я';
  if (out.notes.some(n => /стать|вік|список/.test(n))) out.verdict = 'СУМНІВНО';
  return out;
}
const res = [];
for (const p of D.players) if (p.fide) res.push(check(p, p.fide.id, UKR.get(p.fide.id) || { name: p.fide.name, sex: '', by: '', std: p.fide.std, rapid: p.fide.rapid, blitz: p.fide.blitz }));
const newRes = [];
for (const u of UNM) {
  const p = D.players.find(x => x.id === u.id);
  for (const c of u.cands) if (NEWIDS.has(c.id)) newRes.push(Object.assign(check(p, c.id, c), { cand: `${c.fed} ${c.tit} н.${c.by} ${c.std}/${c.rapid}/${c.blitz}` }));
}
fs.writeFileSync(path.join(__dirname, 'verify.json'), JSON.stringify({ res, newRes }, null, 1));
const cnt = {}; res.forEach(r => cnt[r.verdict] = (cnt[r.verdict] || 0) + 1);
console.log('Наявні зіставлення:', res.length, cnt);
const show = r => `${r.verdict.padEnd(22)} ${r.player} → ${r.fid} ${r.fname} ${r.fed || ''} ${r.cand || ''} | точн ${r.exact} близ ${r.close} дал ${r.far} б/р ${r.unr}${r.dflt ? ' умовн ' + r.dflt : ''}${r.notes.length ? '\n      ! ' + r.notes.join('; ') : ''}\n      ${(r.ex || []).join(' · ')}`;
console.log('\n=== Наявні: не «ПІДТВЕРДЖЕНО» ===');
res.filter(r => r.verdict !== 'ПІДТВЕРДЖЕНО').forEach(r => console.log(show(r)));
console.log('\n=== Нові кандидати ===');
newRes.forEach(r => console.log(show(r)));
