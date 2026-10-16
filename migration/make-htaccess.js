// Генерує site/.htaccess: https/без www, старі сторінки WordPress → розділи, старі адреси файлів → assets/
const fs = require('fs'), path = require('path');
const out = process.argv[2];
const rx = s => s.replace(/[.\\+*?^$()[\]{}|]/g, '\\$&');
// старі адреси файлів: з останнього збирання + перші 20 перенесених (там є регламенти з власними назвами)
const map = new Map(require('./build/oldpaths.json'));
for (const [oldRel, newRel] of require('./media-manifest.js')) {
  if (!map.has(oldRel) && fs.existsSync(path.join(path.dirname(out), newRel))) map.set(oldRel, newRel);
}
const renamed = [...map].filter(([o, n]) => o.split('/')[2] !== n.split('/').pop()).sort();

// старі сторінки (з wp-sitemap.xml старого сайту, 14.10.2026) → нові адреси
const pages = [
  ['новости', '/#/news'], ['архів-новин', '/#/news'],
  ['турніри', '/#/tournaments'], ['план-спортивно-массовых-мероприятий', '/#/tournaments'],
  ['контакты', '/#/contacts'],
  ['турниры', '/#/news/n-2023-geller'],   // розклад турів Меморіалу Геллера 2023
  ['регламент', '/#/news/n-2023-geller'], // регламент Меморіалу Геллера 2023
  ['championship-of-odessa-region-2020-blitz', '/#/news/n-2020-champ-blitz'],
  ['100th-anniversary-of-e-kogan-blitz', '/#/news/n-2020-kogan'],
  ['Галерея', '/'], ['запись', '/'], ['тестовая-запись', '/'], ['category/uncategorized', '/'],
];

const L = [
  '# Шахова Одеса — налаштування сервера (LiteSpeed / Apache).',
  '# Лежить у кореневій теці хостингу поруч з index.html.',
  '# Файл збережено в UTF-8: кириличні адреси нижче мають лишатися як є.',
  '',
  'DirectoryIndex index.html',
  'AddDefaultCharset UTF-8',
  '',
  '<IfModule mod_rewrite.c>',
  'RewriteEngine On',
  '',
  '# 1. Завжди https і без www',
  'RewriteCond %{HTTPS} !=on',
  'RewriteRule ^ https://%{HTTP_HOST}%{REQUEST_URI} [R=301,L]',
  'RewriteCond %{HTTP_HOST} ^www\\.(.+)$ [NC]',
  'RewriteRule ^ https://%1%{REQUEST_URI} [R=301,L]',
  '',
  '# 1а. Службові файли редактора (пароль, резервні копії) — недоступні ззовні',
  'RewriteRule ^(publish-config\\.php|_private(/.*)?)$ - [F,L]',
  '',
  '# 2. Сторінки старого сайту (WordPress) → розділи й матеріали нового',
  ...pages.map(([from, to]) => `RewriteRule ^${rx(from)}/?$ ${to} [R=301,L,NE]`),
  '',
  `# 3а. Файли старого сайту з кириличними назвами → перейменовані копії в assets/ (${renamed.length})`,
  ...renamed.map(([o, n]) => { const [y, m, f] = o.split('/'); const dot = f.lastIndexOf('.');
    return `RewriteRule ^wp-content/uploads/${y}/${m}/${rx(f.slice(0, dot))}(-\\d+x\\d+)?${rx(f.slice(dot))}$ /${n} [R=301,L]`; }),
  '',
  '# 3б. Решта файлів старого сайту: та сама назва в assets/photos|scans|docs/РРРР-ММ/',
  '#     (зокрема зменшені копії WordPress на кшталт «-300x200»)',
  'RewriteCond %{DOCUMENT_ROOT}/assets/photos/$1-$2/$3.$5 -f',
  'RewriteRule ^wp-content/uploads/(\\d{4})/(\\d{2})/(.+?)(-\\d+x\\d+)?\\.(jpe?g|png|gif)$ /assets/photos/$1-$2/$3.$5 [R=301,L]',
  'RewriteCond %{DOCUMENT_ROOT}/assets/scans/$1-$2/$3.$5 -f',
  'RewriteRule ^wp-content/uploads/(\\d{4})/(\\d{2})/(.+?)(-\\d+x\\d+)?\\.(jpe?g|png|gif)$ /assets/scans/$1-$2/$3.$5 [R=301,L]',
  'RewriteCond %{DOCUMENT_ROOT}/assets/docs/$1-$2/$3 -f',
  'RewriteRule ^wp-content/uploads/(\\d{4})/(\\d{2})/(.+)$ /assets/docs/$1-$2/$3 [R=301,L]',
  '',
  '# 4. Будь-яка інша адреса, якої немає на новому сайті → головна',
  'RewriteCond %{REQUEST_FILENAME} !-f',
  'RewriteCond %{REQUEST_FILENAME} !-d',
  'RewriteCond %{REQUEST_URI} !^/assets/',
  'RewriteRule ^ / [R=302,L]',
  '</IfModule>',
  '',
  '# Після публікації з редактора браузер має одразу бачити нову версію',
  '<IfModule mod_headers.c>',
  '<FilesMatch "^(index\\.html|site-data\\.json)$">',
  'Header set Cache-Control "no-cache"',
  '</FilesMatch>',
  '</IfModule>',
  '',
];
fs.writeFileSync(out, L.join('\n'), { encoding: 'utf8' });
// самоперевірка: кожна стара адреса має знайти правило і цільовий файл
let ok = 0, bad = [];
for (const [o, n] of map) {
  if (!fs.existsSync(path.join(path.dirname(out), n))) { bad.push('немає файлу ' + n); continue; }
  const [y, m, f] = o.split('/');
  if (renamed.find(r => r[0] === o)) { ok++; continue; }
  const sub = n.split('/')[1]; // photos|scans|docs
  if (n === `assets/${sub}/${y}-${m}/${f}`) ok++; else bad.push(`${o} → ${n}`);
}
console.log('written', out, '| правил для перейменованих:', renamed.length, '| перевірено адрес:', ok, '| проблем:', bad.length, bad.slice(0, 5));
