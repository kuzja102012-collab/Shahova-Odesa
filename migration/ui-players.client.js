/* ---------------- шахісти ---------------- */
/* DATA.players — реєстр з підсумкових таблиць 2020–2026 (виступ: [№ змагання в DATA.events, місце, очки,
   рейтинг у протоколі, 1 = титул чемпіона, приз за категорією]); fide — рейтинги зі списку FIDE (DATA.fideDate) */
const FT={GM:'гросмейстер',IM:'міжнародний майстер',FM:'майстер ФІДЕ',CM:'кандидат у майстри ФІДЕ',
  WGM:'гросмейстер серед жінок',WIM:'міжнародний майстер серед жінок',WFM:'майстер ФІДЕ серед жінок',WCM:'кандидат у майстри ФІДЕ серед жінок'};
const RK=[['std','classic','Класика'],['rapid','rapid','Рапід'],['blitz','blitz','Бліц']];
const MN=['січень','лютий','березень','квітень','травень','червень','липень','серпень','вересень','жовтень','листопад','грудень'];
const fideWhen=()=>{const d=String(DATA.fideDate||'');return d?MN[+d.slice(5,7)-1]+' '+d.slice(0,4):'';};
/* транслітерація для пошуку: «Кузубов» знаходить «Kuzubov, Yuriy» і навпаки */
const TL={а:'a',б:'b',в:'v',г:'h',ґ:'g',д:'d',е:'e',є:'ie',ж:'zh',з:'z',и:'y',і:'i',ї:'i',й:'i',к:'k',л:'l',м:'m',н:'n',о:'o',
  п:'p',р:'r',с:'s',т:'t',у:'u',ф:'f',х:'kh',ц:'ts',ч:'ch',ш:'sh',щ:'shch',ь:'',ю:'iu',я:'ia',ё:'e',ы:'y',э:'e',ъ:'','’':'',"'":''};
const tl=s=>String(s||'').toLowerCase().split('').map(c=>c in TL?TL[c]:c).join('').replace(/[^a-z0-9 ]/g,' ')
  .replace(/shch|sch/g,'s').replace(/zh/g,'j').replace(/kh/g,'h').replace(/ch/g,'c').replace(/ts/g,'c').replace(/sh/g,'s')
  .replace(/x/g,'ks').replace(/w/g,'v').replace(/g/g,'h').replace(/[yj]/g,'i').replace(/(.)\1+/g,'$1').replace(/\s+/g,' ').trim();
let PIDX=new Map();
function pIndexBuild(){ /* написання з протоколів → гравець; спільне для двох людей написання не зв’язуємо */
  PIDX=new Map(); const dup=new Set();
  (DATA.players||[]).forEach(p=>[p.name].concat(p.aliases||[]).forEach(a=>{
    const k=String(a).trim(); if(PIDX.has(k)&&PIDX.get(k)!==p) dup.add(k); else PIDX.set(k,p); }));
  dup.forEach(k=>PIDX.delete(k));
}
const pOf=n=>PIDX.get(String(n||'').trim())||null;
const pHref=p=>'#/players/'+p.id;
const pLink=n=>{const p=pOf(n);return p?'<a class="pl" href="'+pHref(p)+'">'+esc(n)+'</a>':esc(n);};      /* текст як у джерелі */
const pName=n=>{const p=pOf(n);return p?'<a class="pl" href="'+pHref(p)+'">'+esc(p.name)+'</a>':esc(n);}; /* єдине написання */
const NAMECOL=['Учасник','Шахіст','Чемпіон','Білі','Чорні','Білі (очки)','Чорні (очки)'];
function cellHtml(c,col){
  if(!NAMECOL.includes(col)||!c) return esc(c);
  const m=String(c).match(/^(.*?)\s*(\([\d½.,]+\))$/);   /* «Снігуров Максим (3½)» у парах */
  return m&&pOf(m[1])?pLink(m[1])+' '+esc(m[2]):pLink(c);
}
const evDate=e=>e.date?(e.approx?'не пізніше '+fmtDate(e.date):fmtDate(e.date)):'';
const dShort=d=>d?d.slice(8,10)+'.'+d.slice(5,7)+'.'+d.slice(0,4):'';
const plural=(n,a,b,c)=>{const m=n%10,h=n%100;return n+' '+(m===1&&h!==11?a:m>=2&&m<=4&&(h<12||h>14)?b:c);};
const medalOf=pl=>['1','2','3'].includes(String(pl))?+pl:0;
/* підсумкові таблиці, додані через редактор після останнього оновлення реєстру (позначка «підсумкова») */
function extraApps(){
  const known=new Set((DATA.events||[]).map(e=>e.newsId)), out=[];
  (DATA.news||[]).forEach(n=>{ if(known.has(n.id)) return;
    (n.tables||[]).forEach(t=>{ if(!t.final||!t.rows||!t.head) return;
      const ni=t.head.indexOf('Учасник'), mi=t.head.indexOf('Місце'), pi=t.head.indexOf('Очки'), ri=t.head.indexOf('Рейтинг');
      if(ni<0) return;
      const e={newsId:n.id,label:t.label||n.title,date:t.date||n.date||'',disc:t.disc||'',of:t.rows.length};
      let rank='';
      t.rows.forEach(r=>{ if(mi>=0&&r[mi]) rank=String(r[mi]).replace(/\.$/,'');
        const p=pOf(r[ni]); if(!p) return;
        const rat=ri>=0&&/^\d{3,4}$/.test(r[ri])?+r[ri]:0;
        out.push({p,a:{e,place:rank,pts:pi>=0?r[pi]:'',rat,champ:false,cat:''}}); });
    });
  });
  return out;
}
let XAPPS=null;
function pStats(p){
  if(!XAPPS){ XAPPS=new Map(); extraApps().forEach(x=>{ if(!XAPPS.has(x.p)) XAPPS.set(x.p,[]); XAPPS.get(x.p).push(x.a); }); }
  const A=p.apps.map(a=>({e:(DATA.events||[])[a[0]]||{},place:a[1],pts:a[2],rat:a[3],champ:!!a[4],cat:a[5]||''}))
    .concat(XAPPS.get(p)||[]).sort((x,y)=>String(y.e.date).localeCompare(String(x.e.date)));
  const ys=A.map(a=>String(a.e.date||'').slice(0,4)).filter(Boolean).sort();
  const m=[0,0,0,0]; A.forEach(a=>{const k=medalOf(a.place); if(k) m[k]++;});
  return {p,A,n:A.length,y0:ys[0],y1:ys[ys.length-1],m,champ:A.filter(a=>a.champ)};
}
/* останній рейтинг з протоколу за дисципліною (для гравців без профілю FIDE) */
const lastRat=(st,d)=>st.A.find(a=>a.rat>0&&a.e.disc===d);
function pRow(p){
  const st=pStats(p), f=p.fide;
  const yrs=st.y0?(st.y0===st.y1?st.y0:st.y0+'–'+st.y1):'';
  const sub=[plural(st.n,'турнір','турніри','турнірів'),yrs].filter(Boolean).join(' · ')+
    (st.champ.length?' · ♔ '+st.champ.length:'')+(st.m[1]+st.m[2]+st.m[3]?' · призових місць: '+(st.m[1]+st.m[2]+st.m[3]):'');
  const cell=([k,d,l])=>{
    if(f) return '<span class="r"><i>'+l+'</i>'+(f[k]||'—')+'</span>';
    const a=lastRat(st,d);
    return a?'<span class="r pr" title="Рейтинг у протоколі, '+esc(dShort(a.e.date))+'"><i>'+l+'</i>'+a.rat+'*</span>':'<span class="r"><i>'+l+'</i>—</span>';
  };
  return '<a href="'+pHref(p)+'" data-s="'+esc(tl(p.name+' '+p.aliases.join(' ')))+'"><span class="nm"><b>'+esc(p.name)+'</b>'+
    (f&&f.title?'<span class="tit" title="'+esc(FT[f.title]||'')+'">'+esc(f.title)+'</span>':'')+
    (f&&f.fed?'<span class="tit fed" title="'+esc('Федерація: '+(FED[f.fed]||f.fed))+'">'+esc(f.fed)+'</span>':'')+
    '<small>'+esc(sub)+'</small></span>'+RK.map(cell).join('')+'</a>';
}
function vPlayers(r){
  if(r.id) return vPlayer(r.id);
  XAPPS=null;
  const P=DATA.players||[];
  const f=['fide','champ'].includes(r.q.f)?r.q.f:'all';
  const s=['std','rapid','blitz','n'].includes(r.q.s)?r.q.s:'name';
  const rv=(p,k)=>p.fide&&p.fide[k]||0;
  let list=P.filter(p=>f==='all'||(f==='fide'?!!p.fide:pStats(p).champ.length));
  if(s==='n') list=list.slice().sort((a,b)=>pStats(b).n-pStats(a).n||a.name.localeCompare(b.name,'uk'));
  else if(s!=='name') list=list.slice().sort((a,b)=>rv(b,s)-rv(a,s)||a.name.localeCompare(b.name,'uk'));
  let h=head('Шахісти',plural(P.length,'шахіст','шахісти','шахістів')+', які грали у змаганнях Об’єднання у 2020–2026 роках: результати, титули й рейтинги. '+
    'Рейтинги — зі списку FIDE ('+fideWhen()+').');
  h+='<section class="sec"><div class="wrap">';
  h+='<div class="ptools"><input class="fld" type="search" id="pq" placeholder="Прізвище або ім’я — українською чи латиницею" '+
    'value="'+esc(r.q.q||'')+'" aria-label="Пошук шахіста" autocomplete="off">'+
    '<select class="fld" id="ps" aria-label="Сортування">'+[['name','За алфавітом'],['std','Рейтинг: класика'],['rapid','Рейтинг: рапід'],
      ['blitz','Рейтинг: бліц'],['n','Кількість турнірів']].map(([k,l])=>'<option value="'+k+'"'+(s===k?' selected':'')+'>'+l+'</option>').join('')+
    '</select></div><div class="chips">'+[['all','Усі'],['fide','З профілем FIDE'],['champ','Чемпіони']].map(([k,l])=>
      '<button data-pf="'+k+'" class="'+(f===k?'on':'')+'">'+l+'</button>').join('')+'</div>';
  h+='<div class="plist" id="plist"><div class="ph"><span>Шахіст</span><span>Класика</span><span>Рапід</span><span>Бліц</span></div>'+
    list.map(pRow).join('')+'</div><div id="pnone" class="hide" style="margin-top:12px">'+empty('Нікого не знайдено','Спробуйте інше написання або лише прізвище.')+'</div>'+
    '<p class="src">* Сірим — останній рейтинг, указаний у протоколі змагання, для шахістів без профілю FIDE. '+
    'Дані зібрано з протоколів і повідомлень Об’єднання 2020–2026 років; рік народження не публікуємо.</p>';
  return h+'</div></section>';
}
function bindPlayers(r){
  const q=$('#pq'), rows=$$('#plist>a');
  const go=(k,v)=>{const p=new URLSearchParams(); const cur=Object.assign({},r.q,{q:q?q.value.trim():''},{[k]:v});
    Object.entries(cur).forEach(([a,b])=>{if(b&&!(a==='f'&&b==='all')&&!(a==='s'&&b==='name')) p.set(a,b);});
    location.hash='#/players'+(p.toString()?'?'+p:'');};
  const filter=()=>{ const w=tl(q.value).split(' ').filter(Boolean); let n=0;
    rows.forEach(a=>{const ok=w.every(x=>a.dataset.s.includes(x)); a.classList.toggle('hide',!ok); if(ok) n++;});
    $('#pnone').classList.toggle('hide',n>0); const t=$('#ptops'); if(t) t.classList.toggle('hide',w.length>0); };
  if(q){ q.oninput=filter; q.onkeydown=e=>{if(e.key==='Enter'){ const v=rows.filter(a=>!a.classList.contains('hide')); if(v.length===1) location.hash=v[0].getAttribute('href'); }};
    if(q.value) filter(); }
  const s=$('#ps'); if(s) s.onchange=()=>go('s',s.value);
  $$('[data-pf]').forEach(b=>b.onclick=()=>go('f',b.dataset.pf));
}
/* графік офіційної історії FIDE (p.fh: {s|r|b: [[РРММ, рейтинг]]} — місяці змін), сходинками: рейтинг FIDE діє місяць */
const FED={CZE:'Чехія',SLO:'Словенія',SVK:'Словаччина',SUI:'Швейцарія',AUT:'Австрія',ISR:'Ізраїль',FRA:'Франція',SRB:'Сербія',
  KAZ:'Казахстан',GER:'Німеччина',IRI:'Іран',ENG:'Англія',POL:'Польща',ROU:'Румунія',MDA:'Молдова',USA:'США',CAN:'Канада',ESP:'Іспанія',
  ITA:'Італія',NED:'Нідерланди',BEL:'Бельгія',LTU:'Литва',LAT:'Латвія',EST:'Естонія',GEO:'Грузія',ARM:'Вірменія',AZE:'Азербайджан',
  TUR:'Туреччина',BUL:'Болгарія',GRE:'Греція',HUN:'Угорщина',AUS:'Австралія',SWE:'Швеція',NOR:'Норвегія',DEN:'Данія',FIN:'Фінляндія',
  IRL:'Ірландія',SCO:'Шотландія',WLS:'Уельс',POR:'Португалія',CRO:'Хорватія',BIH:'Боснія і Герцеговина',MNE:'Чорногорія',MKD:'Північна Македонія'};
const ymT=ym=>2000+Math.floor(ym/100)+((ym%100)-1)/12;
/* зміна рейтингу FIDE за рік (з офіційної історії): «▲ +27 за рік» */
function yearDelta(p,k){
  const s=p.fh&&p.fh[{std:'s',rapid:'r',blitz:'b'}[k]], fd=String(DATA.fideDate||''); if(!s||!fd) return '';
  const ym=(+fd.slice(2,4))*100+ +fd.slice(5,7), at=y=>{let v=0; for(const [m,x] of s){ if(m<=y) v=x; else break; } return v;};
  const now=at(ym), was=at(ym-100); if(!now||!was) return '';
  const d=now-was;
  return ' <em class="dlt '+(d>0?'up':d<0?'down':'eq')+'" title="Порівняно з '+esc(ymText(ym-100))+'">'+(d>0?'▲ +'+d:d<0?'▼ '+Math.abs(d):'без змін')+' за рік</em>';
}
const ymText=ym=>MN[(ym%100)-1]+' '+(2000+Math.floor(ym/100));
function fChart(st){
  const COL={s:'#1E5A40',r:'#2F6DB5',b:'#B8892A'}, NAME={s:'Класика',r:'Рапід',b:'Бліц'};
  const H=st.p.fh, tEnd=DATA.fideDate?ymT((+DATA.fideDate.slice(2,4))*100+ +DATA.fideDate.slice(5,7)):2026.75;
  const ks=['s','r','b'].filter(k=>H[k]&&H[k].some(x=>x[1]>0));
  if(!ks.length) return '';
  const vs=[], ts=[];
  ks.forEach(k=>H[k].forEach(([ym,v])=>{ if(v>0){vs.push(v);ts.push(ymT(ym));} }));
  const aw=$('#app')&&$('#app').clientWidth;
  const W=typeof aw==='number'&&aw>0?Math.max(300,Math.min(1080,aw-62)):760, Hh=Math.max(210,Math.min(300,Math.round(W*.4)));
  const L=42,R=12,T=12,B=26;
  const x0=Math.max(2020,Math.floor(Math.min(...ts))), x1=tEnd+1/12;
  let v0=Math.floor((Math.min(...vs)-30)/100)*100, v1=Math.ceil((Math.max(...vs)+30)/100)*100; if(v1-v0<200) v1=v0+200;
  const X=t=>L+(Math.max(t,x0)-x0)/(x1-x0)*(W-L-R), Y=v=>T+(v1-v)/(v1-v0)*(Hh-T-B), step=v1-v0>700?200:100;
  let g='';
  for(let v=v0;v<=v1;v+=step) g+='<line x1="'+L+'" x2="'+(W-R)+'" y1="'+Y(v)+'" y2="'+Y(v)+'" stroke="#EDE6D8"/><text x="'+(L-6)+'" y="'+(Y(v)+4)+'" text-anchor="end">'+v+'</text>';
  for(let y=x0;y<=Math.floor(x1);y++){ g+='<line x1="'+X(y)+'" x2="'+X(y)+'" y1="'+T+'" y2="'+(Hh-B)+'" stroke="#F3EEE4"/>';
    const xm=X(Math.min(y+.5,(y+x1)/2)); if(xm<W-R-8) g+='<text x="'+xm+'" y="'+(Hh-8)+'" text-anchor="middle">'+y+'</text>'; }
  let lines='', dots='';
  ks.forEach(k=>{
    const pts=H[k]; let d='', on=false;
    pts.forEach(([ym,v],i)=>{ const t=ymT(ym), tn=i+1<pts.length?ymT(pts[i+1][0]):x1;
      if(v>0&&tn>x0){ const xa=X(t).toFixed(1), xb=X(tn).toFixed(1), y=Y(v).toFixed(1);
        d+=(on?'V'+y+'H'+xb:'M'+xa+' '+y+'H'+xb); on=true;
        if(t>=x0) dots+='<circle cx="'+xa+'" cy="'+y+'" r="2.6" fill="'+COL[k]+'"><title>'+esc(NAME[k]+' · '+v+' · з '+ymText(ym))+'</title></circle>'; }
      else on=false; });
    if(d) lines+='<path d="'+d+'" fill="none" stroke="'+COL[k]+'" stroke-width="2.2" stroke-linejoin="round"/>';
  });
  return '<div class="chart"><svg viewBox="0 0 '+W+' '+Hh+'" role="img" aria-label="Історія рейтингу FIDE '+esc(st.p.name)+'">'+g+lines+dots+'</svg>'+
    '<div class="legend">'+ks.map(k=>'<span><i style="background:'+COL[k]+'"></i>'+NAME[k]+'</span>').join('')+'</div></div>';
}
/* графік рейтингів з протоколів + поточний FIDE */
function rChart(st){
  if(st.p.fh) return fChart(st);
  const COL={classic:'#1F6F4A',rapid:'#2F6DB5',blitz:'#C2721C'};
  const yf=d=>{const [y,m,dd]=String(d).split('-').map(Number);return y+((m||6)-1)/12+((dd||15)-1)/365;};
  const S={classic:[],rapid:[],blitz:[]};
  st.A.forEach(a=>{ if(a.rat>0&&a.e.date&&S[a.e.disc]) S[a.e.disc].push({t:yf(a.e.date),v:a.rat,a}); });
  const f=st.p.fide, F=f?{classic:f.std,rapid:f.rapid,blitz:f.blitz}:{}, tF=DATA.fideDate?yf(DATA.fideDate+'-15'):0;
  let ts=[],vs=[],n=0;
  for(const d in S){ S[d].sort((x,y)=>x.t-y.t); n+=S[d].length; S[d].forEach(z=>{ts.push(z.t);vs.push(z.v);});
    if(F[d]&&tF&&S[d].length){ts.push(tF);vs.push(F[d]);} }
  if(n<2) return '';
  const aw=$('#app')&&$('#app').clientWidth;
  const W=typeof aw==='number'&&aw>0?Math.max(300,Math.min(1080,aw-62)):760, H=Math.max(210,Math.min(300,Math.round(W*.4)));
  const L=42,R=12,T=12,B=26;
  const x0=Math.floor(Math.min(...ts)), x1=Math.max(...ts)+.25;
  let v0=Math.floor((Math.min(...vs)-30)/100)*100, v1=Math.ceil((Math.max(...vs)+30)/100)*100; if(v1-v0<200) v1=v0+200;
  const X=t=>L+(t-x0)/(x1-x0)*(W-L-R), Y=v=>T+(v1-v)/(v1-v0)*(H-T-B);
  const step=v1-v0>700?200:100;
  let g='';
  for(let v=v0;v<=v1;v+=step) g+='<line x1="'+L+'" x2="'+(W-R)+'" y1="'+Y(v)+'" y2="'+Y(v)+'" stroke="#EDEFF2"/>'+
    '<text x="'+(L-6)+'" y="'+(Y(v)+4)+'" text-anchor="end">'+v+'</text>';
  for(let y=x0;y<=Math.floor(x1);y++){ g+='<line x1="'+X(y)+'" x2="'+X(y)+'" y1="'+T+'" y2="'+(H-B)+'" stroke="#F3F4F6"/>';
    const xm=X(Math.min(y+.5,(y+x1)/2)); if(xm<W-R-8) g+='<text x="'+xm+'" y="'+(H-8)+'" text-anchor="middle">'+y+'</text>'; }
  let lines='', dots='';
  for(const d in S){ const z=S[d]; if(!z.length) continue;
    if(z.length>1) lines+='<path d="'+z.map((p,i)=>(i?'L':'M')+X(p.t).toFixed(1)+' '+Y(p.v).toFixed(1)).join(' ')+'" fill="none" stroke="'+COL[d]+'" stroke-width="2.2" stroke-linejoin="round"/>';
    dots+=z.map(p=>'<circle cx="'+X(p.t).toFixed(1)+'" cy="'+Y(p.v).toFixed(1)+'" r="3.6" fill="'+COL[d]+'" stroke="#fff" stroke-width="1.2">'+
      '<title>'+esc(DISC[d]+' · '+p.v+' · '+p.a.e.label+' · '+dShort(p.a.e.date))+'</title></circle>').join('');
    if(F[d]&&tF){ const l=z[z.length-1];
      lines+='<path d="M'+X(l.t).toFixed(1)+' '+Y(l.v).toFixed(1)+' L'+X(tF).toFixed(1)+' '+Y(F[d]).toFixed(1)+'" fill="none" stroke="'+COL[d]+'" stroke-width="1.6" stroke-dasharray="4 4" opacity=".75"/>';
      dots+='<circle cx="'+X(tF).toFixed(1)+'" cy="'+Y(F[d]).toFixed(1)+'" r="4.4" fill="#fff" stroke="'+COL[d]+'" stroke-width="2.2">'+
        '<title>'+esc(DISC[d]+' · FIDE '+fideWhen()+': '+F[d])+'</title></circle>'; }
  }
  const leg=Object.keys(S).filter(d=>S[d].length).map(d=>'<span><i style="background:'+COL[d]+'"></i>'+DISC[d]+'</span>').join('')+
    (f&&tF?'<span><i class="f"></i>до рейтингу FIDE, '+esc(fideWhen())+'</span>':'');
  return '<div class="chart"><svg viewBox="0 0 '+W+' '+H+'" role="img" aria-label="Динаміка рейтингу '+esc(st.p.name)+'">'+g+lines+dots+'</svg>'+
    '<div class="legend">'+leg+'</div></div>';
}
function vPlayer(id){
  XAPPS=null;
  const p=(DATA.players||[]).find(x=>x.id===id); if(!p) return v404();
  const st=pStats(p), f=p.fide;
  const other=p.aliases.filter(a=>a!==p.name&&!/^(ГМ|ММ|КМ|МС|КМС|ФМ)\s/.test(a));
  let h='<section class="page-head"><div class="wrap"><div class="crumbs"><a href="#/">Головна</a> / <a href="#/players">Шахісти</a></div>'+
    '<h1>'+esc(p.name)+'</h1>'+
    (f&&f.title?'<p style="margin-top:12px"><span class="tit lg">'+esc(f.title)+'</span>'+esc(FT[f.title]||'')+'</p>':'')+
    (other.length?'<p style="font-size:14.5px;margin-top:8px">У протоколах: '+other.map(esc).join(' · ')+'</p>':'')+
    '</div></section><section class="sec"><div class="wrap">';
  /* рейтинги */
  h+='<div class="sec-head"><div><span class="eyebrow">'+(f?'Рейтинг FIDE · '+esc(fideWhen()):'Рейтинг у протоколах змагань')+'</span><h2>Рейтинги</h2></div>'+
    (f?'<a class="link" href="https://ratings.fide.com/profile/'+encodeURIComponent(f.id)+'" target="_blank" rel="noopener">Профіль FIDE ↗</a>':'')+'</div>';
  h+='<div class="rcards">'+RK.map(([k,d,l])=>{
    if(f) return '<div class="rc"><span>'+l+'</span>'+(f[k]?'<b data-n="'+f[k]+'">'+f[k]+'</b><small>FIDE, '+esc(fideWhen())+yearDelta(p,k)+'</small>'
      :'<b class="no">—</b><small>без рейтингу FIDE</small>')+'</div>';
    const a=lastRat(st,d);
    return '<div class="rc"><span>'+l+'</span>'+(a?'<b>'+a.rat+'</b><small>у протоколі: '+esc(a.e.label)+', '+esc(evDate(a.e))+'</small>'
      :'<b class="no">—</b><small>у протоколах не вказано</small>')+'</div>';
  }).join('')+'</div>';
  h+='<p class="dim" style="font-size:14px;margin:10px 0 0">'+(f?(f.fed?'Грає за федерацію: '+esc(FED[f.fed]||f.fed)+'. ':'')+(f.inactive?'У списку FIDE позначений як неактивний. ':'')+'ID FIDE: '+esc(f.id)+'.'+
      (f.m==='n'?' Профіль зіставлено за ім’ям — у протоколах немає рейтингу FIDE, з яким можна звірити. Якщо це не ви, напишіть нам.':'')
    :'Профілю FIDE за прізвищем не знайдено — показано останній рейтинг, указаний у протоколах змагань.')+'</p>';
  /* підсумок */
  const yrs=st.y0?(st.y0===st.y1?st.y0:st.y0+'–'+st.y1):'—';
  h+='<div class="ach"><div><b>'+st.n+'</b>'+plural(st.n,'турнір','турніри','турнірів').replace(/^\d+ /,'')+' в архіві</div>'+
    '<div><b>'+esc(yrs)+'</b>роки виступів</div>'+
    (st.champ.length?'<div><b style="color:#B8860B">♔ '+st.champ.length+'</b>'+(st.champ.length===1?'титул':st.champ.length<5?'титули':'титулів')+' чемпіона</div>':'')+
    '<div><b><span class="md md1">'+st.m[1]+'</span> <span class="md md2">'+st.m[2]+'</span> <span class="md md3">'+st.m[3]+'</span></b>1, 2 і 3 місця</div></div>';
  /* титули */
  if(st.champ.length) h+='<div class="sec-head" style="margin-top:36px"><div><span class="eyebrow">Титули</span><h2>Чемпіон Одеської області</h2></div></div>'+
    '<div class="titles">'+st.champ.map(a=>{ const [main,cat]=String(a.e.label).split(' — ');
      return '<a href="#/news/'+esc(a.e.newsId)+'"><span class="cr">♔</span><span><b>'+esc(String(a.e.date).slice(0,4))+' · '+
        esc(cat||DISC[a.e.disc]||'')+'</b><small>'+esc(main)+(a.pts?' · '+esc(a.pts)+' очк.':'')+'</small></span></a>'; }).join('')+'</div>';
  /* графік */
  const ch=rChart(st);
  if(ch&&p.fh) h+='<div class="sec-head" style="margin-top:36px"><div><span class="eyebrow">Рейтинг FIDE по місяцях</span><h2>Динаміка рейтингу</h2></div></div>'+ch+
    '<p class="dim" style="font-size:13.5px;margin:8px 0 0">Офіційна історія рейтингу FIDE з 2020 року (ratings.fide.com, до '+esc(fideWhen())+'). '+
    'Наведіть на точку, щоб побачити місяць зміни. Рейтинг, указаний у протоколі кожного змагання, — у таблиці «Виступи».</p>';
  else if(ch) h+='<div class="sec-head" style="margin-top:36px"><div><span class="eyebrow">2020–2026</span><h2>Динаміка рейтингу</h2></div></div>'+ch+
    '<p class="dim" style="font-size:13.5px;margin:8px 0 0">Точки — рейтинг, указаний у протоколі кожного змагання (на момент турніру); '+
    (f?'пунктир веде до рейтингу FIDE за '+esc(fideWhen())+'. ':'')+'Наведіть на точку, щоб побачити турнір.</p>';
  /* виступи */
  h+='<div class="sec-head" style="margin-top:36px"><div><span class="eyebrow">Архів</span><h2>Виступи</h2></div></div>'+
    '<div class="tbl-wrap"><table class="tbl ptbl"><thead><tr><th>Дата</th><th>Змагання</th><th>Місце</th><th>Очки</th><th>Рейтинг</th></tr></thead><tbody>'+
    st.A.map(a=>{ const k=medalOf(a.place);
      return '<tr><td class="n">'+esc(a.e.approx?'до '+dShort(a.e.date):dShort(a.e.date))+'</td>'+
        '<td><a class="pl" href="#/news/'+esc(a.e.newsId)+'">'+esc(a.e.label)+'</a>'+(DISC[a.e.disc]?'<span class="disc">'+DISC[a.e.disc]+'</span>':'')+
        (a.champ?'<small style="color:#9A7409;font-weight:600">♔ чемпіон</small>':'')+(a.cat?'<small>Приз: '+esc(a.cat)+'</small>':'')+'</td>'+
        '<td class="n">'+(k?'<span class="md md'+k+'">'+k+'</span>':esc(a.place||'—'))+(a.e.of?' <span style="color:var(--ink-3)">/ '+a.e.of+'</span>':'')+'</td>'+
        '<td class="n">'+esc(a.pts||'—')+'</td><td class="n">'+(a.rat?a.rat:a.e.of?'б/р':'—')+'</td></tr>'; }).join('')+
    '</tbody></table></div>';
  h+='<p class="src">Дані зібрано з протоколів і повідомлень Об’єднання 2020–2026 років; написання імені — як в оголошеннях клубу. '+
    'Помітили помилку — <a class="link" href="#/contacts">напишіть нам</a>.</p>';
  return h+'</div></section>';
}

/* ---------------- зала чемпіонів ---------------- */
function champRows(){
  const rows=[];
  results().filter(x=>x.kind==='champ').forEach(x=>(x.groups||[]).forEach(g=>{
    if(g.noChampion) return;
    const p=g.places.find(p=>p.p==='1'); if(!p) return;
    rows.push({year:x.year,x,cat:g.label||'',name:p.name,adult:!g.label&&!!DISC[x.discipline]});
  }));
  return rows;
}
function tChampions(){
  const rows=champRows();
  let h='<p class="dim" style="margin:-6px 0 22px">Чемпіони Одеської області за даними протоколів і повідомлень Об’єднання з 2020 року. '+
    'Переможці меморіалів, кваліфікаційних і відкритих турнірів — у вкладці «Результати».</p>';
  if(!rows.length) return h+empty('Даних поки немає','');
  const adult=rows.filter(z=>z.adult);
  /* таблиця: роки × дисципліни (без рейтингу «хто більше» — рішення автора: без культу окремих людей) */
  const ys=[...new Set(results().map(x=>x.year))].filter(Boolean).sort().reverse();
  h+='<div class="sec-head"><div><span class="eyebrow">Дорослі чемпіонати</span><h2>Чемпіони області за роками</h2></div></div>'+
    '<div class="tbl-wrap"><table class="tbl ctbl"><thead><tr><th>Рік</th>'+Object.values(DISC).map(d=>'<th>'+d+'</th>').join('')+'</tr></thead><tbody>'+
    ys.map(y=>'<tr><td class="y">'+esc(y)+'</td>'+Object.keys(DISC).map(d=>{
      const z=adult.filter(c=>c.year===y&&c.x.discipline===d);
      return '<td data-l="'+DISC[d]+'">'+(z.length?z.map(c=>'<span class="cr">♔</span>'+pName(c.name)+
        (c.x.newsId?' <a class="link" style="font-size:13px" href="#/news/'+esc(c.x.newsId)+'" aria-label="Таблиця змагання">↗</a>':'')).join('<br>')
        :'<span class="none" title="Немає даних в архіві">—</span>')+'</td>';
    }).join('')+'</tr>').join('')+'</tbody></table></div>'+
    '<p class="dim" style="font-size:13.5px;margin:0 0 6px">«—» — даних про чемпіонат цього року в архіві сайту немає.</p>';
  /* юні та ветерани */
  const rest=rows.filter(z=>!z.adult);
  if(rest.length){
    const ry=[...new Set(rest.map(z=>z.year))].sort().reverse();
    h+='<div class="sec-head" style="margin-top:36px"><div><span class="eyebrow">Юнаки, дівчата, ветерани</span><h2>Чемпіони у вікових категоріях</h2></div></div>'+
      '<div class="ycards">'+ry.map(y=>{
        const comps=[...new Set(rest.filter(z=>z.year===y).map(z=>z.x))];
        return comps.map(x=>'<div class="card"><h3>'+esc(y)+' <span>'+esc(DISC[x.discipline]||'')+'</span></h3>'+
          '<p style="margin:0 0 8px"><a class="pl" href="#/news/'+esc(x.newsId)+'">'+esc(x.title)+'</a></p>'+
          rest.filter(z=>z.x===x).map(z=>'<div class="yrow"><span>'+esc(z.cat)+'</span><b>♔ '+pName(z.name)+'</b></div>').join('')+'</div>').join('');
      }).join('')+'</div>';
  }
  return h;
}

/* ---------------- клуб у цифрах (нижня смуга першого екрана) ---------------- */
function clubNumbers(){
  const photos=(DATA.news||[]).reduce((s,n)=>s+(n.photos||[]).filter(p=>p.src).length,0);
  const ys=years(), span=ys.length?ys[ys.length-1]+'–'+ys[0]:'';
  const N=[[(DATA.news||[]).length,'матеріалів в архіві'+(span?' '+span:''),'#/news'],[results().length,'змагань із результатами','#/tournaments?tab=results'],
    [(DATA.players||[]).length,'шахістів у протоколах','#/players'],[photos,'фотографій','#/news']].filter(x=>x[0]);
  return '<div class="hstats">'+N.map(([n,l,href])=>'<a href="'+href+'"><b data-n="'+n+'" aria-label="'+n+'">'+n+'</b><span>'+esc(l)+'</span></a>').join('')+'</div>';
}
/* лічильники: числа «набігають», коли блок з’являється на екрані */
function countUp(){
  const els=$$('[data-n]'); if(!els.length) return;
  if(!('IntersectionObserver' in window)||matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const run=el=>{ const n=+el.dataset.n, t0=performance.now(), d=1100;
    const step=t=>{ const k=Math.min(1,(t-t0)/d); el.textContent=Math.round(n*(1-Math.pow(1-k,3))); if(k<1) requestAnimationFrame(step); };
    requestAnimationFrame(step); };
  const io=new IntersectionObserver(es=>es.forEach(e=>{ if(e.isIntersecting){ io.unobserve(e.target); run(e.target); } }),{threshold:.4});
  els.forEach(el=>{ el.textContent='0'; io.observe(el); });
}
