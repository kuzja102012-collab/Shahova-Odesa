// Патч index.html: сторінки шахістів, «Зала чемпіонів», «Клуб у цифрах», посилання на гравців.
// Кожна заміна перевіряє, що вихідний фрагмент є рівно один раз; повторний запуск нічого не зламає (пропускає вже внесене).
const fs = require('fs');
const FILE = 'C:/Users/admin/Downloads/shahova-odesa-handoff/site/index.html';
let html = fs.readFileSync(FILE, 'utf8');
const once = (from, to, mark) => {
  if (mark && html.includes(mark)) { console.log('  вже є:', mark.slice(0, 50)); return; }
  const n = html.split(from).length - 1;
  if (n !== 1) throw new Error(`фрагмент знайдено ${n} разів: ${from.slice(0, 80)}`);
  html = html.replace(from, () => to);
};

// ───────── CSS ─────────
const CSS = `
/* шахісти */
a.pl{color:inherit;text-decoration:underline;text-decoration-color:var(--line-2);text-underline-offset:3px}
a.pl:hover{color:var(--grn);text-decoration-color:var(--grn)}
.tit{display:inline-block;font-family:'IBM Plex Mono',monospace;font-size:11px;font-weight:500;padding:1px 6px;
  border-radius:5px;background:#1F2A35;color:#fff;margin-left:7px;vertical-align:2px;letter-spacing:.04em}
.tit.lg{font-size:13px;padding:3px 9px;margin:0 6px 0 0;vertical-align:1px}
.ptools{display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin-bottom:12px}
.ptools input{flex:1;min-width:220px}
.ptools select{width:auto;flex:0 0 auto}
.chips{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:16px}
.chips button{padding:7px 13px;border:1px solid var(--line);background:#fff;border-radius:99px;cursor:pointer;
  font-size:14px;font-weight:600;color:var(--ink-2)}
.chips button.on{background:var(--ink);border-color:var(--ink);color:#fff}
.plist{border:1px solid var(--line);border-radius:var(--r);background:#fff;box-shadow:var(--sh);overflow:hidden}
.plist>a,.plist>.ph{display:grid;grid-template-columns:1fr repeat(3,78px);gap:10px;align-items:center;padding:11px 16px;
  border-bottom:1px solid var(--line)}
.plist>a:last-child{border-bottom:0}
.plist>a:hover{background:var(--bg-2)}
.plist>.ph{background:var(--bg-2);font-size:12.5px;font-weight:600;color:var(--ink-3);padding-top:9px;padding-bottom:9px}
.plist>.ph span+span{text-align:right}
.plist .nm b{font-weight:600}
.plist .nm small{display:block;font-size:13px;color:var(--ink-3);margin-top:1px}
.plist .r{font-family:'IBM Plex Mono',monospace;text-align:right;font-size:15px}
.plist .r.pr{color:var(--ink-3);font-style:italic}
.plist .r i{display:none;font-style:normal;font-size:11px;color:var(--ink-3);margin-right:4px}
.rcards{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}
.rc{border:1px solid var(--line);border-radius:var(--r);padding:16px 18px;background:#fff;box-shadow:var(--sh)}
.rc>span{display:block;font-size:13px;color:var(--ink-3);font-weight:600;text-transform:uppercase;letter-spacing:.08em}
.rc>b{display:block;font-family:'Onest',sans-serif;font-size:40px;font-weight:800;letter-spacing:-.02em;line-height:1.1;margin:6px 0 4px}
.rc>b.no{color:var(--line-2)}
.rc small{font-size:13px;color:var(--ink-2);line-height:1.45;display:block}
.ach{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:10px;margin:16px 0 0}
.ach div{background:var(--bg-2);border-radius:10px;padding:12px 14px;font-size:13.5px;color:var(--ink-2)}
.ach b{font-family:'Onest',sans-serif;font-size:24px;display:block;line-height:1.15;color:var(--ink)}
.md{display:inline-grid;place-items:center;min-width:24px;height:24px;padding:0 6px;border-radius:99px;font-size:12.5px;
  font-weight:700;font-family:'IBM Plex Mono',monospace;color:#fff}
.md1{background:#C9971A}.md2{background:#8F9BA8}.md3{background:#B0703A}
.titles{display:grid;grid-template-columns:repeat(auto-fill,minmax(270px,1fr));gap:10px}
.titles a{display:flex;gap:14px;align-items:center;padding:14px 16px;border-radius:var(--r);
  background:linear-gradient(100deg,#FFF5D6,#FFFDF6 70%);border:1px solid #EFDFAE;transition:.15s}
.titles a:hover{box-shadow:var(--sh-2);transform:translateY(-1px)}
.titles .cr{font-size:28px;line-height:1;color:#B8860B}
.titles b{display:block;font-family:'Onest',sans-serif;font-size:16px}
.titles small{display:block;font-size:13px;color:var(--ink-2);line-height:1.4}
.chart{border:1px solid var(--line);border-radius:var(--r);background:#fff;padding:12px 10px 4px;box-shadow:var(--sh)}
.chart svg{display:block;width:100%;height:auto}
.chart text{font-family:'IBM Plex Mono',monospace;font-size:11.5px;fill:var(--ink-3)}
.legend{display:flex;gap:16px;flex-wrap:wrap;font-size:13.5px;color:var(--ink-2);padding:8px 8px 6px}
.legend i{display:inline-block;width:14px;height:3px;border-radius:2px;margin-right:6px;vertical-align:middle}
.legend i.f{height:0;border-top:2px dashed var(--ink-3);background:none}
.ptbl td small{display:block;color:var(--ink-3);font-size:13px;margin-top:2px}
.ptbl td .disc{margin-left:6px}
table.ctbl td{vertical-align:top}
table.ctbl td.y{font-family:'Onest',sans-serif;font-weight:700;font-size:17px;width:72px}
table.ctbl .cr{color:#B8860B;margin-right:6px}
table.ctbl .none{color:var(--line-2)}
.ycards{display:grid;grid-template-columns:repeat(2,1fr);gap:16px}
.ycards .card h3{display:flex;align-items:baseline;gap:10px}
.ycards .card h3 span{font-family:'IBM Plex Mono',monospace;font-size:13px;color:var(--ink-3);font-weight:500}
.yrow{display:flex;gap:10px;align-items:baseline;padding:6px 0;border-bottom:1px dashed var(--line);font-size:15px}
.yrow:last-child{border-bottom:0}
.yrow span{color:var(--ink-3);font-size:13.5px;min-width:46%}
@media(max-width:860px){ .ycards{grid-template-columns:1fr} }
@media(max-width:680px){
  .plist>.ph{display:none}
  .plist>a{grid-template-columns:repeat(3,1fr);gap:4px 10px;padding:12px 14px}
  .plist .nm{grid-column:1/-1}
  .plist .r{text-align:left;font-size:14px}
  .plist .r i{display:inline}
  .rcards{grid-template-columns:repeat(3,1fr);gap:8px}
  .rc{padding:12px}
  .rc>b{font-size:26px}
  .rc>span{font-size:11px;letter-spacing:.04em}
  .rc small{font-size:12px}
  table.ptbl{min-width:0}
  table.ptbl td:nth-child(2){min-width:190px}
}
</style>`;
// CSS-блок: при повторному запуску замінюємо цілком
// блок закінчується перед оформленням «Турнірний зал» (ui-design.js), якщо воно вже є, інакше — перед </style>
if (html.includes('\n/* шахісти */')) {
  const a = html.indexOf('\n/* шахісти */'), d = html.indexOf('\n/* дизайн:', a);
  if (d >= 0) html = html.slice(0, a) + CSS.replace(/\n<\/style>$/, '') + html.slice(d);
  else { const b = html.indexOf('\n</style>', a); html = html.slice(0, a) + CSS + html.slice(b + '\n</style>'.length); }
  console.log('  оновлено CSS');
} else once('\n</style>', CSS);

// ───────── навігація ─────────
once(`    <a href="#/tournaments" data-r="tournaments">Турніри</a>\n`,
  `    <a href="#/tournaments" data-r="tournaments">Турніри</a>\n    <a href="#/players" data-r="players">Шахісти</a>\n`, 'data-r="players"');
once(`$('#drawer').innerHTML=[['#/','Головна'],['#/news','Новини'],['#/tournaments','Турніри'],`,
  `$('#drawer').innerHTML=[['#/','Головна'],['#/news','Новини'],['#/tournaments','Турніри'],['#/players','Шахісти'],`, "['#/players','Шахісти']");
once(`<a href="#/tournaments?tab=results">Результати</a><a href="#/tournaments?tab=champions">Чемпіони</a>`,
  `<a href="#/tournaments?tab=results">Результати</a><a href="#/tournaments?tab=champions">Зала чемпіонів</a>\n      <a href="#/players">Шахісти</a>`, '<a href="#/players">Шахісти</a>');
once(`const VIEWS={home:vHome, news:vNews, search:vSearch, tournaments:vTournaments, about:vAbout, contacts:vContacts, editor:vEditor};`,
  `const VIEWS={home:vHome, news:vNews, search:vSearch, tournaments:vTournaments, players:vPlayers, about:vAbout, contacts:vContacts, editor:vEditor};`, 'players:vPlayers');
once(`function render(){\n  closeLB();`, `function render(){\n  closeLB(); pIndexBuild();`, 'closeLB(); pIndexBuild();');
once(`[['ann','Анонси',''],['results','Результати','?tab=results'],['champions','Чемпіони','?tab=champions']]`,
  `[['ann','Анонси',''],['results','Результати','?tab=results'],['champions','Зала чемпіонів','?tab=champions']]`, "'Зала чемпіонів','?tab=champions'");

// ───────── головна: CTA і «Клуб у цифрах» ─────────
once(`    '<a class="btn" href="#/tournaments?tab=results">Результати і чемпіони</a></div></div></section>';`,
  `    '<a class="btn" href="#/tournaments?tab=results">Результати</a>'+\n    '<a class="btn" href="#/players">Шахісти</a></div></div></section>';\n  h+=clubNumbers();`, 'clubNumbers()');

// ───────── таблиці й подіуми: імена — посилання на сторінки шахістів ─────────
once(`        '<td data-l="'+esc(g.head[i])+'"'+(i===0?' class="n"':'')+'>'+esc(c)+'</td>').join('')+`,
  `        '<td data-l="'+esc(g.head[i])+'"'+(i===0?' class="n"':'')+'>'+cellHtml(c,g.head[i])+'</td>').join('')+`, "cellHtml(c,g.head[i])");
once(`      '<td data-l="'+esc(t.head[j])+'"'+(j===0||j>2?' class="n"':'')+'>'+esc(c)+'</td>').join('')+`,
  `      '<td data-l="'+esc(t.head[j])+'"'+(j===0||j>2?' class="n"':'')+'>'+cellHtml(c,t.head[j])+'</td>').join('')+`, "cellHtml(c,t.head[j])");
once(`      (p.p==='1'?'<b>'+esc(p.name)+'</b>':'<span>'+esc(p.name)+'</span>')+`,
  `      (p.p==='1'?'<b>'+pLink(p.name)+'</b>':'<span>'+pLink(p.name)+'</span>')+`, "'<b>'+pLink(p.name)+'</b>'");

// ───────── пошук: шахісти ─────────
once(`  const total=nres.length+ares.length+rres.length;`,
  `  const tq=tl(q).split(' ').filter(Boolean);
  const pres=tq.length?(DATA.players||[]).filter(p=>{const s=tl(p.name+' '+p.aliases.join(' '));return tq.every(w=>s.includes(w));}).slice(0,60):[];
  const total=nres.length+ares.length+rres.length+pres.length;`, 'const pres=');
once(`  if(rres.length) h+='<div class="tbl-cap">Результати — '+rres.length+'</div>`,
  `  if(pres.length) h+='<div class="tbl-cap">Шахісти — '+pres.length+'</div><div class="plist" style="margin-bottom:14px">'+pres.map(pRow).join('')+'</div>';
  if(rres.length) h+='<div class="tbl-cap">Результати — '+rres.length+'</div>`, "'<div class=\"tbl-cap\">Шахісти — '");

// ───────── нова «Зала чемпіонів» замість простого списку ─────────
const start = html.indexOf('function tChampions(){');
const end = html.indexOf('\n/* ---------------- про нас ---------------- */');
if (start < 0 || end < 0) throw new Error('не знайдено tChampions');
const JS = fs.readFileSync(__dirname + '/ui-players.client.js', 'utf8').trim();
if (!html.includes('/* ---------------- шахісти ---------------- */')) html = html.slice(0, start) + JS + '\n' + html.slice(end);
else {
  const s2 = html.indexOf('/* ---------------- шахісти ---------------- */');
  const e2 = html.indexOf('\n/* ---------------- про нас ---------------- */');
  html = html.slice(0, s2) + JS + '\n' + html.slice(e2);
  console.log('  оновлено блок шахістів');
}

// ───────── події: фільтри списку шахістів, лічильники ─────────
once(`  $$('[data-lb]').forEach(b=>b.onclick=()=>openLB(GAL[b.dataset.lb],+b.dataset.i));\n  if(r.route!=='editor') return;`,
  `  $$('[data-lb]').forEach(b=>b.onclick=()=>openLB(GAL[b.dataset.lb],+b.dataset.i));
  if(r.route==='players'&&!r.id) bindPlayers(r);
  countUp();
  if(r.route!=='editor') return;`, 'bindPlayers(r);');

fs.writeFileSync(FILE, html);
console.log('index.html:', (html.length / 1024).toFixed(0), 'KB');
