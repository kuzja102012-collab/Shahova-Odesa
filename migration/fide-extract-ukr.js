// Витягує з повного списку FIDE (жовтень 2026) гравців федерації UKR у компактний JSON
const fs = require('fs'), path = require('path'), readline = require('readline');
const src = path.join(__dirname, 'x', 'players_list_foa.txt');
const out = path.join(__dirname, 'ukr.json');
const rl = readline.createInterface({ input: fs.createReadStream(src, 'latin1') });
let cols = null; const res = [];
rl.on('line', line => {
  if (!cols) { // позиції стовпців — за заголовком
    const names = ['ID Number', 'Name', 'Fed', 'Sex', 'Tit', 'WTit', 'OTit', 'FOA', 'SRtng', 'SGm', 'SK', 'RRtng', 'RGm', 'Rk', 'BRtng', 'BGm', 'BK', 'B-day', 'Flag'];
    cols = names.map(n => ({ n, i: line.indexOf(n) }));
    // числові стовпці вирівняні праворуч — беремо межі між початками заголовків
    return;
  }
  const get = k => { const j = cols.findIndex(c => c.n === k); const a = j === 0 ? 0 : cols[j].i; const b = j + 1 < cols.length ? cols[j + 1].i : line.length; return line.slice(a, b).trim(); };
  // числові поля праворуч від заголовка: беремо з невеликим запасом ліворуч
  const num = k => { const j = cols.findIndex(c => c.n === k); const a = cols[j - 1].i + cols[j - 1].n.length; const b = cols[j].i + cols[j].n.length; return line.slice(a, b).trim(); };
  if (get('Fed') !== 'UKR') return;
  res.push({ id: get('ID Number'), name: get('Name'), sex: get('Sex'), tit: get('Tit'), wtit: get('WTit'),
    std: +num('SRtng') || 0, rapid: +num('RRtng') || 0, blitz: +num('BRtng') || 0, by: get('B-day'), flag: get('Flag') });
});
rl.on('close', () => {
  fs.writeFileSync(out, JSON.stringify(res));
  const s = res.find(p => p.id === '14143488');
  console.log('UKR players:', res.length, '| перевірка Snigurov:', JSON.stringify(s));
});
