// Патч index.html: оформлення «Турнірний зал» (рішення автора 14.10.2026: варіант A, без культу окремих людей).
// Стилі — останнім блоком перед </style>, тож перекривають базові й блоки шахістів/редактора. Повторний запуск оновлює блок.
const fs = require('fs');
const FILE = 'C:/Users/admin/Downloads/shahova-odesa-handoff/site/index.html';
let html = fs.readFileSync(FILE, 'utf8');
const once = (from, to, mark) => {
  if (mark && html.includes(mark)) return;
  const n = html.split(from).length - 1;
  if (n !== 1) throw new Error(`фрагмент знайдено ${n} разів: ${from.slice(0, 90)}`);
  html = html.replace(from, () => to);
};

const PAT = (o) => `content:"";position:absolute;inset:0;pointer-events:none;opacity:${o};
  background-image:repeating-conic-gradient(var(--gold) 0% 25%,transparent 0% 50%);background-size:72px 72px;
  -webkit-mask-image:linear-gradient(100deg,transparent 40%,#000 100%);mask-image:linear-gradient(100deg,transparent 40%,#000 100%)`;
const SERIF = `'Playfair Display',Georgia,'Times New Roman',serif`;
const CSS = `
/* дизайн: турнірний зал */
:root{
  --bg:#FBF8F2; --bg-2:#F3EDE2; --bg-3:#E9E1D2; --line:#E6DCCB; --line-2:#D4C6AE;
  --ink:#17201B; --ink-2:#56605A; --ink-3:#8B918B;
  --grn:#1E5A40; --grn-d:#123D2B; --grn-l:#E6EEE7;
  --night:#0F2E22; --ivory:#F4EEE2; --ivory-2:#C3CFC6;
  --gold:#C9A24A; --gold-d:#8A6A1E; --gold-l:#F5EAD0;
  --sh:0 1px 2px rgba(23,32,27,.05); --sh-2:0 12px 32px rgba(23,32,27,.11);
}
body{background:var(--bg)}
h1,h2,h3,.brand b,.tbl-cap,.panel>h3{font-family:${SERIF};letter-spacing:-.005em}
.sec-head h2{font-weight:700}
.card h3{font-weight:600;font-size:19px}
.eyebrow{color:var(--gold-d);letter-spacing:.16em}
::selection{background:var(--gold);color:#1E1708}
:focus-visible{outline-color:var(--gold-d)}
header.top{background:rgba(251,248,242,.94);border-bottom-color:var(--line)}
.brand b{font-size:19px;font-weight:700}
.nav a:hover{background:var(--bg-2)}
.nav a.on{background:var(--night);color:var(--ivory);font-weight:600}
.burger,.drawer{background:var(--bg)}
.drawer a{font-family:${SERIF};font-weight:600;border-bottom-color:var(--line)}
.hero{background:var(--night);color:var(--ivory);padding:0;border-bottom:0}
.hero::after{display:none}
.hero::before{${PAT('.07')}}
.hero-in{display:grid;grid-template-columns:1.15fr .85fr;gap:48px;align-items:center;padding-top:64px;padding-bottom:40px}
.hero .eyebrow{color:var(--gold)}
.hero h1{font-size:clamp(46px,7vw,86px);font-weight:700;line-height:1;letter-spacing:-.01em;margin-top:8px}
.hero p{color:var(--ivory-2);max-width:44ch}
.hero .cta{margin-top:30px}
.btn{border-color:var(--line-2);background:#fff}
.btn:hover{border-color:var(--gold-d);color:var(--gold-d)}
.btn.primary{background:var(--night);border-color:var(--night);color:#fff}
.btn.primary:hover{background:var(--grn);border-color:var(--grn);color:#fff}
.btn.gold{background:var(--gold);border-color:var(--gold);color:#1E1708}
.btn.gold:hover{background:#D8B45E;border-color:#D8B45E;color:#1E1708}
.btn.ghost{background:transparent;border-color:rgba(244,238,226,.35);color:var(--ivory)}
.btn.ghost:hover{border-color:var(--gold);color:var(--gold)}
.hero-ph{margin:0;position:relative;border-radius:16px;overflow:hidden;aspect-ratio:4/5;max-height:470px;width:100%;
  box-shadow:0 30px 60px rgba(0,0,0,.35);outline:1px solid rgba(201,162,74,.4);outline-offset:8px}
.hero-ph img{width:100%;height:100%;object-fit:cover;object-position:50% 72%}
.hero-ph figcaption{position:absolute;left:0;right:0;bottom:0;padding:32px 16px 12px;font-size:13px;color:var(--ivory);
  background:linear-gradient(transparent,rgba(8,22,16,.85))}
.hero-ph figcaption a:hover{color:var(--gold)}
.hstats{display:grid;grid-template-columns:repeat(4,1fr);border-top:1px solid rgba(201,162,74,.3)}
.hstats a{padding:22px 18px 28px 0}
.hstats a+a{padding-left:22px;border-left:1px solid rgba(244,238,226,.12)}
.hstats b{display:block;font-family:${SERIF};font-size:clamp(30px,4vw,46px);font-weight:700;color:var(--gold);line-height:1}
.hstats span{display:block;margin-top:8px;font-size:14px;color:var(--ivory-2)}
.hstats a:hover span{color:var(--ivory)}
.page-head{background:var(--night);color:var(--ivory);border-bottom:0;position:relative;overflow:hidden}
.page-head::before{${PAT('.06')}}
.page-head .wrap{position:relative}
.page-head h1{font-weight:700}
.page-head p,.page-head .dim,.page-head .crumbs,.page-head .crumbs a{color:var(--ivory-2)}
.page-head .crumbs a:hover{color:var(--gold)}
.page-head .badge,.page-head .badge.past{background:rgba(244,238,226,.12);color:var(--ivory)}
.page-head .tit{background:var(--gold);color:#1E1708}
.sec.grey{background:var(--bg-2)}
.card{border-color:var(--line);border-radius:14px}
a.card:hover{border-color:var(--gold)}
.thumb{background:var(--bg-3);border-radius:10px}
.thumb span{color:#B9AE98}
.thumb.noph{background:var(--night);position:relative}
.thumb.noph::before{content:"";position:absolute;inset:0;opacity:.07;background-image:repeating-conic-gradient(var(--gold) 0% 25%,transparent 0% 50%);background-size:36px 36px}
.thumb.noph span{position:relative;font-family:Georgia,serif;font-size:56px;letter-spacing:0;color:var(--gold)}
.thumb.noph em{position:absolute;right:14px;bottom:10px;font-style:normal;font-family:${SERIF};font-size:16px;color:rgba(244,238,226,.55);letter-spacing:.02em}
.badge{background:var(--grn-l);color:var(--grn-d)}
.badge.past{background:var(--bg-3);color:var(--ink-2)}
.tabs button{background:#fff;border-color:var(--line)}
.tabs button.on,.chips button.on{background:var(--night);border-color:var(--night);color:var(--ivory)}
.tbl-wrap{border-color:var(--line);border-radius:14px}
table.tbl th{background:var(--bg-2)}
table.tbl tbody tr:hover{background:#FAF5EC}
tr.top td:first-child{color:var(--gold-d)}
.tbl-cap{font-size:19px;font-weight:600}
.pod .p1 .m{color:var(--gold-d)}
table.ctbl .cr,.titles .cr{color:var(--gold)}
table.ctbl td.y{font-family:${SERIF}}
.titles a{background:var(--gold-l);border-color:#E9D8AA}
.tit{background:var(--night)}
.tit.fed{background:transparent;color:var(--ink-2);border:1px solid var(--line-2)}
.rc>b,.ach b{font-family:${SERIF};font-weight:700}
.md1{background:var(--gold)}
.note{border-left-color:var(--gold)}
.empty{background:var(--bg-2);border-color:var(--line-2)}
.panel{border-color:var(--line);border-radius:14px}
.fld{border-color:var(--line-2)}
.fld:focus{border-color:var(--gold-d)}
footer{background:var(--night);border-top:0;color:var(--ivory)}
footer .dim{color:var(--ivory-2)}
footer h4{color:var(--gold);letter-spacing:.06em}
footer a{color:var(--ivory-2)}
footer a:hover{color:var(--gold)}
footer .brand b{color:var(--ivory)}
.f-bot{border-top-color:rgba(244,238,226,.12);color:var(--ivory-2)}
@media(max-width:860px){
  .hero-in{grid-template-columns:1fr;gap:30px;padding-top:44px;padding-bottom:26px}
  .hero-ph{aspect-ratio:16/10;max-height:none}
  .hstats{grid-template-columns:repeat(2,1fr)}
  .hstats a,.hstats a+a{padding:16px 14px 18px 0;border-left:0}
  .hstats a:nth-child(even){padding-left:16px;border-left:1px solid rgba(244,238,226,.12)}
  .hstats a:nth-child(n+3){border-top:1px solid rgba(244,238,226,.12)}
}
@media(max-width:680px){ .hero h1{font-size:50px} .hstats b{font-size:34px} .hstats span{font-size:13.5px} }
`;
if (html.includes('\n/* дизайн: турнірний зал */')) {
  // блок закінчується перед анімаціями (ui-motion.js), якщо вони вже є, інакше — перед </style>
  const a = html.indexOf('\n/* дизайн: турнірний зал */'), m = html.indexOf('\n/* рух:', a), b = m >= 0 ? m : html.indexOf('\n</style>', a);
  html = html.slice(0, a) + CSS.replace(/\n$/, '') + html.slice(b); console.log('  оновлено CSS оформлення');
} else once('\n</style>', CSS.replace(/\n$/, '') + '\n</style>');

// шрифт заголовків
once('family=Onest:wght@500;600;700;800&', 'family=Playfair+Display:wght@600;700&family=Onest:wght@500;600;700;800&', 'family=Playfair+Display');
once('<meta name="theme-color" content="#ffffff">', '<meta name="theme-color" content="#FBF8F2">', 'content="#FBF8F2"');

// перший екран
const HERO_OLD = `  let h='<section class="hero"><div class="wrap">'+
    '<h1>Шахова <em>Одеса</em></h1>'+
    '<p>Новини, анонси турнірів та архів шахового життя Одеси.</p>'+
    '<div class="cta"><a class="btn primary" href="#/news">Новини</a>'+
    '<a class="btn" href="#/tournaments">Анонси турнірів</a>'+
    '<a class="btn" href="#/tournaments?tab=results">Результати</a>'+
    '<a class="btn" href="#/players">Шахісти</a></div></div></section>';
  h+=clubNumbers();`;
once(HERO_OLD, '  let h=heroHtml();', 'let h=heroHtml();');
const HERO_FN = `/* перший екран «Турнірний зал»: фото без людей у кадрі, найближчий турнір, цифри архіву */
const HERO_PHOTO={src:'assets/photos/2023-09/23-09-09_04.jpg',alt:'Кубки переможців на столі суддівської колегії',
  caption:'Кубки Меморіалу Юхима Геллера, 2023',newsId:'n-2023-geller'};
function heroHtml(){
  const up=annSorted().filter(a=>(a.dateEnd||a.dateStart)>=TODAY).sort((a,b)=>String(a.dateStart).localeCompare(String(b.dateStart)))[0];
  const short=d=>{const x=new Date(d);return isNaN(x)?'':x.getDate()+' '+M[x.getMonth()];};
  const next=up?(up.dateStart<=TODAY?'Зараз триває турнір':'Найближчий турнір · '+short(up.dateStart)):'Анонси турнірів';
  const ph=HERO_PHOTO, cap=ph.caption?(ph.newsId&&getNews(ph.newsId)?'<a href="#/news/'+ph.newsId+'">'+esc(ph.caption)+'</a>':esc(ph.caption)):'';
  return '<section class="hero has-cosmos"><canvas class="cosmos" aria-hidden="true"></canvas><div class="wrap hero-in"><div>'+
    '<span class="eyebrow">Об’єднання шахово-шашкових клубів Одеської області</span>'+
    '<h1 class="split">Шахова Одеса</h1>'+
    '<p>Новини, турніри, результати й чемпіони шахового життя Одеси та області.</p>'+
    '<div class="cta"><a class="btn gold" href="#/tournaments">'+esc(next)+'</a>'+
    '<a class="btn ghost" href="#/news">Новини</a><a class="btn ghost" href="#/tournaments?tab=champions">Зала чемпіонів</a></div></div>'+
    '<figure class="hero-ph"><img src="'+esc(ph.src)+'" alt="'+esc(ph.alt)+'" fetchpriority="high">'+(cap?'<figcaption>'+cap+'</figcaption>':'')+'</figure>'+
    '</div></section>'; /* цифри архіву на головній прибрано на прохання автора (14.10.2026) */
}
`;
once('/* ---------------- головна ---------------- */\n', '/* ---------------- головна ---------------- */\n' + HERO_FN, 'function heroHtml(){');

// картка новини без фото — темна плитка із золотим конем (замість порожньої сірої)
once(`    '<div class="thumb">'+((n.photos||[])[0]&&n.photos[0].src
      ?'<img src="'+esc(n.photos[0].thumb||n.photos[0].src)+'" alt="" loading="lazy">'
      :'<span style="font-size:36px;letter-spacing:0;color:#C3CBD3">♞</span>')+'</div>'+`,
`    ((n.photos||[])[0]&&n.photos[0].src
      ?'<div class="thumb"><img src="'+esc(n.photos[0].thumb||n.photos[0].src)+'" alt="" loading="lazy"></div>'
      :'<div class="thumb noph" aria-hidden="true"><span>♞</span><em>'+esc(n.year||'')+'</em></div>')+`, 'thumb noph');
// смуга цифр на головній — прибрано (автор, 14.10.2026)
if (html.includes("    '</div><div class=\"wrap\">'+clubNumbers()+'</div></section>';")) html = html.split("    '</div><div class=\"wrap\">'+clubNumbers()+'</div></section>';").join("    '</div></section>'; /* цифри архіву на головній прибрано на прохання автора (14.10.2026) */");
fs.writeFileSync(FILE, html);
console.log('index.html:', (Buffer.byteLength(html) / 1024).toFixed(0), 'KB');
