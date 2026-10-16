// Патч index.html: анімації «шаховий космос» (сцена першого екрана, шапки сторінок, поява блоків, переходи, графіки).
// Стилі — останнім блоком перед </style> (після оформлення «Турнірний зал»). Повторний запуск оновлює блоки.
const fs = require('fs');
const FILE = 'C:/Users/admin/Downloads/shahova-odesa-handoff/site/index.html';
let html = fs.readFileSync(FILE, 'utf8');
const once = (from, to, mark) => {
  if (mark && html.includes(mark)) return;
  const n = html.split(from).length - 1;
  if (n !== 1) throw new Error(`фрагмент знайдено ${n} разів: ${from.slice(0, 90)}`);
  html = html.replace(from, () => to);
};

const CSS = `
/* рух: шаховий космос */
.cosmos{position:absolute;inset:0;width:100%;height:100%;display:block;pointer-events:none;z-index:0}
.hero.has-cosmos::before,.page-head.has-cosmos::before{display:none}
.page-head .wrap{position:relative;z-index:1}
.hero::after{display:block;content:"";position:absolute;inset:0;pointer-events:none;z-index:0;
  background:radial-gradient(460px circle at var(--gx,70%) var(--gy,40%),rgba(217,180,92,.10),transparent 62%)}
.hero-in{transform:translate3d(0,calc(var(--sy,0) * .18px),0);opacity:calc(1 - var(--sy,0) / 900)}
h1.split .w{display:inline-block;white-space:nowrap}
h1.split .ch{display:inline-block;opacity:0;transform:translateY(.55em) rotateX(-70deg);filter:blur(6px);
  animation:chIn .9s cubic-bezier(.2,.8,.2,1) forwards;animation-delay:calc(var(--i) * 55ms + 150ms)}
@keyframes chIn{to{opacity:1;transform:none;filter:none}}
@keyframes fadeUp{from{opacity:0;transform:translateY(18px)}}
@keyframes fadeIn{to{opacity:1}}
.hero .eyebrow{animation:fadeUp .8s .05s both}
.hero-in p{animation:fadeUp .9s .55s both}
.hero .cta{animation:fadeUp .9s .75s both}
.hstats{animation:fadeUp 1s .95s both}
@property --fy{syntax:'<length>';inherits:false;initial-value:0px}
.hero-ph{transform:perspective(900px) rotateX(var(--rx,0deg)) rotateY(var(--ry,0deg)) translateY(var(--fy,0px));
  transition:transform .3s ease-out;will-change:transform;animation:phIn 1.1s .3s cubic-bezier(.2,.8,.2,1) backwards,float 7s 1.5s ease-in-out infinite}
.hero-ph.tilting{transition:transform .08s linear}
@keyframes phIn{from{opacity:0;transform:perspective(900px) rotateY(-18deg) translateX(40px) scale(.94)}}
@keyframes float{0%,100%{--fy:0px}50%{--fy:-10px}}
.hero-ph::after{content:"";position:absolute;inset:0;pointer-events:none;
  background:linear-gradient(115deg,transparent 32%,rgba(255,240,200,.30) 48%,transparent 62%);background-size:260% 100%;
  background-position:var(--sx,120%) 0;opacity:0;animation:sheen 7s 2.6s infinite}
.hero-ph.tilting::after{opacity:1;animation:none}
@keyframes sheen{0%{background-position:160% 0;opacity:0}8%{opacity:1}30%{background-position:-60% 0;opacity:0}100%{opacity:0}}
.btn.gold{position:relative;overflow:hidden}
.btn.gold::after{content:"";position:absolute;top:0;bottom:0;width:40%;left:-60%;pointer-events:none;
  background:linear-gradient(100deg,transparent,rgba(255,255,255,.55),transparent);transform:skewX(-20deg);animation:shine 5s 2.2s infinite}
@keyframes shine{0%{left:-60%}22%,100%{left:130%}}
.rv{opacity:0;transform:translate3d(0,22px,0) scale(.985);
  transition:opacity .7s cubic-bezier(.2,.8,.2,1) var(--d,0ms),transform .8s cubic-bezier(.2,.8,.2,1) var(--d,0ms)}
.rv.in{opacity:1;transform:none}
.chart path.drawn{stroke-dasharray:1;stroke-dashoffset:1}
.chart.anim.in path.drawn,.chart.anim:not(.rv) path.drawn{animation:draw 1.8s .15s cubic-bezier(.4,.1,.2,1) forwards}
.chart.anim circle{opacity:0}
.chart.anim.in circle,.chart.anim:not(.rv) circle{animation:fadeIn .5s 1.5s forwards}
@keyframes draw{to{stroke-dashoffset:0}}
header.top{view-transition-name:topbar}
::view-transition-old(topbar),::view-transition-new(topbar){animation:none}
@keyframes vtOut{to{opacity:0;transform:translateY(-8px)}}
@keyframes vtIn{from{opacity:0;transform:translateY(14px)}}
::view-transition-old(root){animation:vtOut .2s ease both}
::view-transition-new(root){animation:vtIn .36s cubic-bezier(.2,.8,.2,1) both}
a.card,.titles a,.plist>a,.hstats a{transition:transform .25s cubic-bezier(.2,.8,.2,1),box-shadow .25s,border-color .25s,background .2s}
a.card:hover{transform:translateY(-4px)}
.hstats a:hover b{text-shadow:0 0 18px rgba(217,180,92,.55)}
/* перший екран зі справжнім фото */
.hero-photo{min-height:min(84vh,780px);display:flex;flex-direction:column;justify-content:center}
.hero-photo .hero-in{grid-template-columns:minmax(0,660px);padding-top:56px;padding-bottom:92px}
.hero-photo h1{text-shadow:0 2px 26px rgba(5,20,14,.5)}
.hero-photo .hero-in p{color:#E6EEE8;text-shadow:0 1px 14px rgba(5,20,14,.55)}
.hero .hero-credit{position:absolute;right:16px;bottom:10px;z-index:1;margin:0;max-width:none;font-size:11px;color:rgba(244,238,226,.66)}
.hero-credit a{color:inherit;text-decoration:underline;text-decoration-color:rgba(244,238,226,.35);text-underline-offset:2px}
.hero-credit a:hover{color:var(--gold)}
.hero-photo .btn.ghost{background:rgba(10,32,24,.38);border-color:rgba(244,238,226,.5);-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px)}
.hero-photo .btn.ghost:hover{background:rgba(10,32,24,.55)}
@media(max-width:860px){ .hero-photo{min-height:min(88vh,720px)} .hero-photo .hero-in{grid-template-columns:1fr;padding-bottom:110px}
  .hero .hero-credit{left:16px;right:16px;text-align:right} }
/* сузір'я «Кінь» у підвалі */
footer.has-sky{position:relative;overflow:hidden}
footer.has-sky>.wrap{position:relative;z-index:1}
canvas.sky{position:absolute;inset:0;width:100%;height:100%;display:block;pointer-events:none;z-index:0}
/* перехід «шахова дошка» (~3 с: накриває 1 с, тримається 0,9 с, відкриває 1 с; клік — пропустити) */
.wave{position:fixed;inset:0;z-index:150;display:grid;pointer-events:none;visibility:hidden;--cell:260ms;--spread:240ms}
.wave.fast{--cell:220ms;--spread:130ms}
.wave i{display:block;transform:scale(0)}
.wave i.l{background:#163E2E}.wave i.d{background:#0F2E22}
.wave.cover,.wave.hold,.wave.reveal{visibility:visible}
.wave.cover,.wave.hold{pointer-events:auto;cursor:pointer}
.wave.cover i{animation:cellIn var(--cell) cubic-bezier(.6,0,.3,1) calc(var(--f) * var(--spread)) forwards}
.wave.hold i{transform:none;animation:glint .45s ease-in-out calc(var(--f) * 180ms) both}
.wave.reveal i{transform:none;animation:cellOut var(--cell) cubic-bezier(.6,0,.3,1) calc(var(--f) * var(--spread)) forwards}
@keyframes cellIn{from{transform:scale(0) rotate(45deg);opacity:.4}to{transform:none;opacity:1}}
@keyframes cellOut{from{transform:none}to{transform:scale(0) rotate(-45deg);opacity:.3}}
@keyframes glint{0%,100%{box-shadow:inset 0 0 0 0 rgba(217,180,92,0)}45%{box-shadow:inset 0 0 0 200px rgba(217,180,92,.2)}}
.wave b{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%) scale(.6);font:400 72px Georgia,serif;color:var(--gold);opacity:0;
  text-shadow:0 0 24px rgba(217,180,92,.6)}
.wave.cover b{animation:crest .3s .26s forwards}
.wave.hold b{opacity:1;transform:translate(-50%,-50%);animation:crestPulse .5s ease-in-out}
/* редактор сайту поки лише для автора: посилання в підвалі сховано, вхід — за адресою /#/editor */
footer a[href="#/editor"]{display:none}
.wave.reveal b{opacity:1;transform:translate(-50%,-50%);animation:crestOut .35s forwards}
.wave.reveal.fast b{animation-duration:.15s}
@keyframes crest{to{opacity:1;transform:translate(-50%,-50%)}}
@keyframes crestPulse{50%{transform:translate(-50%,-50%) scale(1.18);text-shadow:0 0 42px rgba(242,210,122,.95)}}
@keyframes crestOut{to{opacity:0;transform:translate(-50%,-50%) scale(1.5)}}
/* інтро: корона з частинок (раз за візит) */
#intro{position:fixed;inset:0;z-index:300;cursor:pointer;transition:opacity .42s ease}
#intro canvas{display:block;width:100%;height:100%}
#intro.out{opacity:0;pointer-events:none}
body.intro-wait .hero .ch,body.intro-wait .hero .eyebrow,body.intro-wait .hero-in p,body.intro-wait .hero .cta,
body.intro-wait .hstats,body.intro-wait .hero-ph{animation-play-state:paused}
/* «Зала чемпіонів»: корони спалахують іскрами */
table.ctbl .cr,.titles .cr{display:inline-block;transition:transform .25s cubic-bezier(.2,.8,.2,1),text-shadow .25s}
table.ctbl td:hover .cr,.titles a:hover .cr{transform:scale(1.4) rotate(-10deg);text-shadow:0 0 14px rgba(217,180,92,.95)}
.sparks{position:fixed;width:0;height:0;z-index:120;pointer-events:none}
.sparks i{position:absolute;left:-2px;top:-2px;width:4px;height:4px;border-radius:50%;background:#F2D27A;
  box-shadow:0 0 6px 1px rgba(242,210,122,.85);animation:spark .7s cubic-bezier(.2,.8,.2,1) forwards}
@keyframes spark{to{transform:translate(var(--dx),var(--dy)) scale(.2);opacity:0}}
/* рейтинг шахіста: зміна за рік */
.dlt{display:inline-block;margin-left:6px;font-style:normal;font-weight:700;font-size:12px;padding:1px 7px;border-radius:99px;white-space:nowrap}
.dlt.up{color:#1E5A40;background:#E1EFE4}.dlt.down{color:#9B2C2C;background:#F7E3DF}.dlt.eq{color:var(--ink-3);background:var(--bg-2)}
@media(max-width:680px){ .rcards{grid-template-columns:repeat(3,minmax(0,1fr))} .dlt{display:inline-block;margin:4px 0 0;font-size:11px;padding:1px 5px;white-space:normal} }
`;
if (html.includes('\n/* рух: шаховий космос */')) {
  const a = html.indexOf('\n/* рух: шаховий космос */'), b = html.indexOf('\n</style>', a);
  html = html.slice(0, a) + CSS.replace(/\n$/, '') + html.slice(b); console.log('  оновлено CSS руху');
} else once('\n</style>', CSS.replace(/\n$/, '') + '\n</style>');

// код
const JS = fs.readFileSync(__dirname + '/ui-motion.client.js', 'utf8').trim() + '\n\n';
const START = '/* ---------------- старт ---------------- */';
const M0 = '/* ---------------- рух: «шаховий космос» ---------------- */';
if (html.includes(M0)) { const a = html.indexOf(M0), b = html.indexOf(START, a); html = html.slice(0, a) + JS + html.slice(b); console.log('  оновлено код руху'); }
else once(START, JS + START);

// підключення
once('  bind(r);\n}', '  bind(r);\n  try{ motion(r); }catch(e){}\n}', 'try{ motion(r); }');
once("window.addEventListener('hashchange', render);", "window.addEventListener('hashchange', navRender);", "'hashchange', navRender");
once(`return '<section class="hero"><div class="wrap hero-in"><div>'+`,
  `return '<section class="hero has-cosmos"><canvas class="cosmos" aria-hidden="true"></canvas><div class="wrap hero-in"><div>'+`, 'hero has-cosmos');
once(`'<h1>Шахова Одеса</h1>'+`, `'<h1 class="split">Шахова Одеса</h1>'+`, 'h1 class="split"');
// старт: інтро (раз за візит) і сузір'я в підвалі
once("render();\nloadFresh();", "render();\nloadFresh();\ntry{ footerSky(); introOnce(); }catch(e){}", 'introOnce(); }');

fs.writeFileSync(FILE, html);
console.log('index.html:', (Buffer.byteLength(html) / 1024).toFixed(0), 'KB');
