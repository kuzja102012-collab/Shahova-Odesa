// Патч index.html: новий редактор сайту з публікацією через publish.php. Повторний запуск оновлює внесене.
const fs = require('fs');
const FILE = 'C:/Users/admin/Downloads/shahova-odesa-handoff/site/index.html';
let html = fs.readFileSync(FILE, 'utf8');
const once = (from, to, mark) => {
  if (mark && html.includes(mark)) return;
  const n = html.split(from).length - 1;
  if (n !== 1) throw new Error(`фрагмент знайдено ${n} разів: ${from.slice(0, 90)}`);
  html = html.replace(from, () => to);
};
const region = (a, b, to) => { // заміна від маркера a (включно) до маркера b (не включно)
  const s = html.indexOf(a), e = html.indexOf(b, s);
  if (s < 0 || e < 0) return false;
  html = html.slice(0, s) + to + html.slice(e); return true;
};

// ───────── CSS (перед блоком шахістів, щоб обидва патчі не зачіпали одне одного) ─────────
const CSS = `
/* редактор */
.ed{grid-template-columns:300px 1fr}
.edbar{position:sticky;top:calc(var(--hd) + 8px);z-index:25;display:flex;gap:8px;align-items:center;flex-wrap:wrap;background:#fff;
  border:1px solid var(--line);border-radius:12px;padding:10px 12px;box-shadow:var(--sh-2);margin-bottom:16px}
.edbar .st{flex:1;min-width:200px;font-size:14px;color:var(--ink-2)}
.edbar .st b{color:var(--grn-d)}
.edbar .st.dirty b{color:#A45C00}
.btn[disabled],.btn.dis{opacity:.5;cursor:not-allowed}
.menu{position:relative}
.menu>summary{list-style:none}
.menu>summary::-webkit-details-marker{display:none}
.menu>div{position:absolute;right:0;top:calc(100% + 6px);background:#fff;border:1px solid var(--line);border-radius:10px;
  box-shadow:var(--sh-2);padding:6px;min-width:250px;z-index:30}
.menu>div button{display:block;width:100%;text-align:left;padding:9px 12px;border:0;background:none;border-radius:7px;cursor:pointer;font-size:14.5px}
.menu>div button:hover{background:var(--bg-2)}
.ed-tabs{flex-wrap:wrap;margin-bottom:10px;gap:5px}
.ed-tabs button{padding:7px 12px;font-size:14px}
.ed-list{max-height:62vh;overflow:auto}
.ed-list a span{display:block}
.ed-list a small{display:block;color:var(--ink-3);font-size:12.5px;margin-top:2px}
.panel>h3 small{font-size:13px}
.ed-ph{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px;margin-bottom:12px}
.ed-tile{border:1px solid var(--line);border-radius:10px;overflow:hidden;background:#fff}
.ed-tile img{width:100%;aspect-ratio:4/3;object-fit:cover;background:var(--bg-3)}
.ed-tile .fld{border:0;border-top:1px solid var(--line);border-radius:0;font-size:13.5px;padding:8px 10px}
.ed-tb{display:flex;border-top:1px solid var(--line)}
.ed-tb button{flex:1;border:0;background:#fff;padding:8px 0;cursor:pointer;font-size:14px;color:var(--ink-2)}
.ed-tb button+button{border-left:1px solid var(--line)}
.ed-tb button:hover{background:var(--bg-2);color:var(--ink)}
.ed-tb button.x:hover{color:#B3392F}
.ed-box{border:1px solid var(--line);border-radius:10px;padding:14px;margin-bottom:12px;background:var(--bg-2)}
.ed-row{display:flex;gap:6px;flex-wrap:wrap;margin-top:10px}
.ed-doc{display:flex;gap:8px;align-items:center;margin-bottom:8px}
.ed-doc .fld{flex:1}
.ed-hist{display:flex;gap:10px;align-items:center;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--line);font-size:14.5px}
textarea.mono{font-family:'IBM Plex Mono',monospace;font-size:13px;line-height:1.55;white-space:pre;overflow:auto;tab-size:14}
.chk{display:flex;gap:9px;align-items:flex-start;font-size:14.5px;margin:10px 0 4px;cursor:pointer}
.chk input{margin-top:5px;width:16px;height:16px;flex-shrink:0;accent-color:var(--grn)}
.hint{font-size:13px;color:var(--ink-3);margin:6px 0 0;line-height:1.5}
.prog{font-size:14px;color:var(--grn);margin:6px 0 0;min-height:1px}
.lab.req::after{content:" *";color:#B3392F}
.edpill{position:fixed;left:16px;bottom:16px;z-index:70;background:var(--ink);color:#fff;border-radius:99px;padding:11px 16px;
  font-size:14px;font-weight:600;box-shadow:var(--sh-2)}
.edpill:hover{background:#000}
@media(max-width:860px){ .ed{grid-template-columns:1fr} .ed-list{max-height:40vh}
  .edbar{top:calc(var(--hd) + 4px);padding:7px 9px;gap:6px} .edbar .st{flex-basis:100%;min-width:0;font-size:12.5px;line-height:1.35}
  .edbar .btn.sm{padding:7px 12px} }
`;
if (html.includes('\n/* редактор */')) { region('\n/* редактор */', '\n/* шахісти */', CSS.replace(/\n$/, '')); console.log('  оновлено CSS редактора'); }
else once('\n/* шахісти */', CSS.replace(/\n$/, '') + '\n/* шахісти */');

// ───────── код редактора ─────────
const JS = fs.readFileSync(__dirname + '/ui-editor.client.js', 'utf8').trim() + '\n\n';
if (!region('/* ---------------- редактор сайту ---------------- */', '/* ---------------- події ---------------- */', JS)
  && !region('/* ---------------- редактор контенту ---------------- */', '/* ---------------- події ---------------- */', JS))
  throw new Error('не знайдено блок редактора');

// події: редактор — окремою функцією
{
  const a = "  if(r.route!=='editor') return;\n  const go=$('#go');", b = '\n/* ---------------- старт ---------------- */';
  const s = html.indexOf(a);
  if (s >= 0) { const e = html.indexOf(b, s); html = html.slice(0, s) + "  if(r.route==='editor') bindEditor();\n}\n" + html.slice(e); }
  else if (!html.includes("if(r.route==='editor') bindEditor();")) throw new Error('не знайдено bind редактора');
}
// повідомлення довше для помилок
once("function toast(m){const t=document.createElement('div');t.className='toast';t.textContent=m;\n  document.body.appendChild(t);setTimeout(()=>t.remove(),2400);}",
  "function toast(m,ms){const t=document.createElement('div');t.className='toast';t.textContent=m;t.setAttribute('role','status');\n  document.body.appendChild(t);setTimeout(()=>t.remove(),ms||2400);}", 'function toast(m,ms)');
// поки редактор відкритий — кнопка повернення з попереднього перегляду
once("  $('#drawer').classList.remove('open');\n  bind(r);\n}",
  "  $('#drawer').classList.remove('open');\n  if(ED.on&&r.route!=='editor') $('#app').insertAdjacentHTML('beforeend','<a class=\"edpill\" href=\"#/editor\">✎ До редактора'+(ED.dirty?' · є неопубліковані зміни':'')+'</a>');\n  bind(r);\n}", '<a class="edpill"');
// старт: підтягнути опубліковане після останнього оновлення сторінки
once("$('#fYear').textContent='© '+new Date().getFullYear()+' Шахова Одеса';\nrender();",
  "$('#fYear').textContent='© '+new Date().getFullYear()+' Шахова Одеса';\nrender();\nloadFresh();", '\nloadFresh();');
// лише безпечні посилання (без javascript: тощо)
once(`      (a.regulation?'<a class="btn sm" href="'+esc(a.regulation)+'" target="_blank" rel="noopener">Регламент</a>':'')+`,
  `      (safeUrl(a.regulation)?'<a class="btn sm" href="'+esc(safeUrl(a.regulation))+'" target="_blank" rel="noopener">Регламент</a>':'')+`, 'esc(safeUrl(a.regulation))');
once(`'<div class="grid g2">'+n.docs.map(x=>'<a class="card" href="'+esc(x.url)+'" target="_blank" rel="noopener">'+`,
  `'<div class="grid g2">'+n.docs.map(x=>'<a class="card" href="'+esc(safeUrl(x.url))+'" target="_blank" rel="noopener">'+`, 'esc(safeUrl(x.url))');
// опис у шапці скрипта
once("   Редагування — розділ #/editor, зміни вивантажуються файлом site-data.json.",
  "   Редагування — розділ #/editor; кнопка «Опублікувати» зберігає зміни на хостингу через publish.php\n   (site-data.json + копія даних тут). Пароль — у publish-config.php.", 'через publish.php\n');
// посилання в підвалі
once('<a href="#/editor">Редактор контенту</a>', '<a href="#/editor">Редактор сайту</a>', '<a href="#/editor">Редактор сайту</a>');

fs.writeFileSync(FILE, html);
console.log('index.html:', (Buffer.byteLength(html) / 1024).toFixed(0), 'KB');
