// Завантажує історію рейтингів FIDE (як графік на ratings.fide.com/profile/ID) для списку ID.
// node fetch-hist.js ids.txt  → hist/ID.json (вже завантажені пропускає). Пауза між запитами — 800 мс.
const fs = require('fs'), path = require('path');
const ids = fs.readFileSync(process.argv[2], 'utf8').split(/\s+/).filter(Boolean);
const dir = path.join(__dirname, 'hist'); fs.mkdirSync(dir, { recursive: true });
const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  let ok = 0, skip = 0, fail = 0;
  for (const id of ids) {
    const f = path.join(dir, id + '.json');
    if (fs.existsSync(f) && fs.statSync(f).size > 2) { skip++; continue; }
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const r = await fetch(`https://ratings.fide.com/a_chart_data.phtml?event=${id}&period=0`, {
          method: 'POST', headers: { 'User-Agent': 'Mozilla/5.0', 'X-Requested-With': 'XMLHttpRequest', Referer: `https://ratings.fide.com/profile/${id}` } });
        const t = (await r.text()).replace(/^﻿/, '');
        const j = JSON.parse(t); if (!Array.isArray(j)) throw new Error('not array');
        fs.writeFileSync(f, JSON.stringify(j)); ok++; break;
      } catch (e) { if (attempt === 3) { fail++; console.log('fail', id, e.message); } else await sleep(15000 * attempt); }
    }
    await sleep(1500);
    if ((ok + fail) % 25 === 0) console.log(`… ${ok + skip + fail}/${ids.length}`);
  }
  console.log(`готово: завантажено ${ok}, уже були ${skip}, помилок ${fail}`);
})();
