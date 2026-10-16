// Патч: перший екран зі справжнім фото Одеси (Воронцовський маяк, Andris Malygin, CC BY 3.0, Wikimedia Commons).
// Кубки з першого екрана прибрано, сцену «Денна Одеса» замінено на фото з живими деталями. Решта ефектів — без змін.
const fs = require('fs');
const FILE = 'C:/Users/admin/Downloads/shahova-odesa-handoff/site/index.html';
let html = fs.readFileSync(FILE, 'utf8');

// 1) шаблон першого екрана
const HERO = `/* перший екран: справжнє фото Одеси — Воронцовський маяк і море (рішення автора 15.10.2026; кубки й цифри прибрано).
   Фото: Andris Malygin, 2009, CC BY 3.0, Wikimedia Commons — підпис автора на сторінці обов'язковий за ліцензією. */
const HERO_BG={src:'assets/hero/odesa-mayak-2000.jpg',srcSmall:'assets/hero/odesa-mayak-1000.jpg',author:'Andris Malygin',
  license:'CC BY 3.0',licenseUrl:'https://creativecommons.org/licenses/by/3.0/',
  page:'https://commons.wikimedia.org/wiki/File:%D0%9E%D0%B4%D0%B5%D1%81%D1%81%D0%B0_-_panoramio_(17).jpg',
  horizon:.648}; /* частка висоти фото, де горизонт */
function heroHtml(){
  const up=annSorted().filter(a=>(a.dateEnd||a.dateStart)>=TODAY).sort((a,b)=>String(a.dateStart).localeCompare(String(b.dateStart)))[0];
  const short=d=>{const x=new Date(d);return isNaN(x)?'':x.getDate()+' '+M[x.getMonth()];};
  const next=up?(up.dateStart<=TODAY?'Зараз триває турнір':'Найближчий турнір · '+short(up.dateStart)):'Анонси турнірів';
  return '<section class="hero has-cosmos hero-photo"><canvas class="cosmos" aria-hidden="true"></canvas><div class="wrap hero-in"><div>'+
    '<span class="eyebrow">Об’єднання шахово-шашкових клубів Одеської області</span>'+
    '<h1 class="split">Шахова Одеса</h1>'+
    '<p>Новини, турніри, результати й чемпіони шахового життя Одеси та області.</p>'+
    '<div class="cta"><a class="btn gold" href="#/tournaments">'+esc(next)+'</a>'+
    '<a class="btn ghost" href="#/news">Новини</a><a class="btn ghost" href="#/tournaments?tab=champions">Зала чемпіонів</a></div></div></div>'+
    '</section>';
}
`;
{
  const a1 = html.indexOf('/* перший екран «Турнірний зал»'), a2 = html.indexOf('/* перший екран: справжнє фото Одеси — Воронцовський маяк');
  const a = a1 >= 0 ? a1 : a2, b = html.indexOf('function vHome(){', a);
  if (a < 0 || b < 0) throw new Error('не знайдено heroHtml');
  html = html.slice(0, a) + HERO + html.slice(b);
}

// 2) сцена: замість «Денної Одеси» — фото з живими деталями
{
  const JS = fs.readFileSync(__dirname + '/hero-photo.client.js', 'utf8').trim() + '\n';
  const a1 = html.indexOf('/* перший екран: «Денна Одеса»'), a2 = html.indexOf('/* перший екран: справжнє фото Одеси (рішення автора 15.10.2026) — Воронцовський маяк');
  const a = a1 >= 0 ? a1 : a2, b = html.indexOf('/* літери заголовка з’являються по одній', a);
  if (a < 0 || b < 0) throw new Error('не знайдено сцену першого екрана');
  html = html.slice(0, a) + JS + html.slice(b);
  html = html.replace("if(cv) odesaScene(cv);", "if(cv) heroPhotoScene(cv);");
  if (!html.includes('if(cv) heroPhotoScene(cv);')) throw new Error('не підключено сцену');
}

// 3) стилі: прибрати правило «фото вужче» і додати стилі першого екрана з фото
{
  html = html.replace(/\/\* денна Одеса: на комп'ютері фото вужче[^\n]*\n@media\(min-width:861px\)\{ \.hero-in\{grid-template-columns:1\.35fr \.65fr\} \.hero-ph\{max-width:380px;justify-self:end\} \}\n/, '');
  const CSS = `/* перший екран зі справжнім фото */
.hero-photo{min-height:min(84vh,780px);display:flex;flex-direction:column;justify-content:center}
.hero-photo .hero-in{grid-template-columns:minmax(0,660px);padding-top:56px;padding-bottom:92px}
.hero-photo h1{text-shadow:0 2px 26px rgba(5,20,14,.5)}
.hero-photo .hero-in p{color:#E6EEE8;text-shadow:0 1px 14px rgba(5,20,14,.55)}

.hero-photo .btn.ghost{background:rgba(10,32,24,.38);border-color:rgba(244,238,226,.5);-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px)}
.hero-photo .btn.ghost:hover{background:rgba(10,32,24,.55)}
@media(max-width:860px){ .hero-photo{min-height:min(88vh,720px)} .hero-photo .hero-in{grid-template-columns:1fr;padding-bottom:110px}
}
`;
  const M = '/* перший екран зі справжнім фото */';
  if (html.includes(M)) { const a = html.indexOf(M), b = html.indexOf("/* сузір'я «Кінь» у підвалі */", a); html = html.slice(0, a) + CSS + html.slice(b); }
  else { const k = "/* сузір'я «Кінь» у підвалі */"; if (!html.includes(k)) throw new Error('не знайдено місце для стилів'); html = html.replace(k, () => CSS + k); }
}
fs.writeFileSync(FILE, html);
console.log('index.html:', (Buffer.byteLength(html) / 1024).toFixed(0), 'KB');
