/* ---------------- редактор сайту ---------------- */
/* Працює в браузері: зміни одразу видно на сайті в цьому браузері (попередній перегляд),
   кнопка «Опублікувати» надсилає їх на хостинг (publish.php). Незбережене тримається чернеткою в браузері. */
const ED={on:false,srv:false,key:'',tab:'news',sel:null,dirty:false,q:'',maxUp:0,busy:'',note:'',hist:null};
const ED_DRAFT='so-editor-draft', ED_KEY='so-editor-key';
const KINDS={champ:'Чемпіонат / першість області',tourn:'Турнір, меморіал',qualif:'Кваліфікаційний турнір',semi:'Півфінал',team:'Командні змагання'};
const STATUSES=['Перевірено','Потребує уточнення','Архівні дані'];
const store=(s,k,v)=>{try{const S=window[s];if(v===undefined)return S.getItem(k);if(v===null)S.removeItem(k);else S.setItem(k,v);}catch(e){}return null;};
const edSlug=s=>String(s||'').toLowerCase().split('').map(c=>c in TL?TL[c]:c).join('').replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,40)||'file';
const safeUrl=u=>{const s=String(u||'').trim();return /^(https?:\/\/|assets\/|#\/|mailto:|tel:)/i.test(s)?s:'';};
const fmtStamp=iso=>{const d=new Date(iso);return isNaN(d)?'':d.getDate()+' '+M[d.getMonth()]+' '+d.getFullYear()+', '+
  String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0');};
function setData(d){ Object.keys(DATA).forEach(k=>delete DATA[k]); Object.assign(DATA,d); XAPPS=null; }
function edRender(){ const y=window.scrollY; render(); window.scrollTo(0,y); }
let edT=null;
function edMark(){
  ED.dirty=true; clearTimeout(edT);
  edT=setTimeout(()=>store('localStorage',ED_DRAFT,JSON.stringify({at:new Date().toISOString(),data:DATA})),400);
  edStatus();
}
function edStatusHtml(){
  return ED.busy?'<b>'+esc(ED.busy)+'</b>':ED.dirty?'<b>Є неопубліковані зміни</b> · чернетку збережено в цьому браузері'
    :'<b>Усе опубліковано</b>'+(DATA.updated?' · оновлено '+esc(fmtStamp(DATA.updated)):'');
}
function edStatus(){ const s=$('#edst'); if(s){ s.className='st'+(ED.dirty||ED.busy?' dirty':''); s.innerHTML=edStatusHtml(); } }
function edDraft(){ try{ const d=JSON.parse(store('localStorage',ED_DRAFT)||'null'); return d&&d.data&&Array.isArray(d.data.news)?d:null; }catch(e){ return null; } }
/* запит до publish.php */
async function api(action,fields,files){
  const fd=new FormData(); fd.append('action',action); fd.append('key',ED.key);
  Object.entries(fields||{}).forEach(([k,v])=>fd.append(k,v));
  (files||[]).forEach(([k,b,n])=>fd.append(k,b,n));
  let r; try{ r=await fetch('publish.php',{method:'POST',body:fd,cache:'no-store'}); }
  catch(e){ throw Object.assign(new Error('Немає зв’язку із сервером. Перевірте інтернет.'),{status:0}); }
  let j=null; try{ j=await r.json(); }catch(e){}
  if(!j) throw Object.assign(new Error(r.status===404?'На хостингу немає файлу publish.php.':'Сервер відповів помилкою '+r.status+'.'),{status:r.status});
  if(!j.ok) throw Object.assign(new Error(j.error||'Помилка сервера.'),{status:r.status});
  return j;
}
async function freshData(){ const r=await fetch('site-data.json?t='+Date.now(),{cache:'no-store'}); const d=await r.json(); if(!d||!Array.isArray(d.news)) throw new Error('дані недоступні'); return d; }
async function edLogin(pw,silent){
  ED.key=String(pw||''); ED.note='';
  if(/^https?:$/.test(location.protocol)){
    try{
      const j=await api('ping'); ED.srv=true; ED.maxUp=j.maxUpload||0; store('sessionStorage',ED_KEY,ED.key);
      if(j.updated&&j.updated!==DATA.updated&&!ED.dirty){ try{ setData(await freshData()); }catch(e){} }
    }catch(e){
      if([401,403,429].includes(e.status)){ store('sessionStorage',ED_KEY,null); if(!silent) toast(e.message,4500); return; }
      ED.srv=false; ED.note=e.message+' Редагувати можна, але зміни лишаться лише в цьому браузері; '+
        'перенести їх на сайт можна файлом (меню «Ще» → «Зберегти копію даних»).';
    }
  } else { ED.srv=false; ED.note='Сайт відкрито з диска комп’ютера — публікація працює лише на хостингу. '+
    'Зміни можна зберегти файлом site-data.json (меню «Ще»).'; }
  ED.on=true; render();
}
/* ── вигляд ── */
const TABS=[['news','Новини'],['ann','Анонси'],['res','Результати'],['pages','Сторінки']];
const edArr=()=>ED.tab==='news'?DATA.news:ED.tab==='ann'?DATA.announcements:ED.tab==='res'?DATA.results:null;
const edItem=()=>{const a=edArr();return a&&ED.sel?a.find(x=>x.id===ED.sel)||null:null;};
const edTarget=()=>ED.tab==='pages'?(ED.sel==='contacts'?DATA.contacts:ED.sel==='about'?DATA.about:null):edItem();
const edList=()=>ED.tab==='news'?newsSorted():ED.tab==='ann'?annSorted():ED.tab==='res'?results():[];
const edDateOf=x=>x.date?fmtDate(x.date):x.dateStart?fmtDate(x.dateStart):(x.dateNote||x.year||'');
const fIn=(l,b,v,o={})=>'<div'+(o.wide?' style="grid-column:1/-1"':'')+'><label class="lab'+(o.req?' req':'')+'">'+esc(l)+'</label>'+
  '<input class="fld" data-b="'+b+'" value="'+esc(v==null?'':v)+'"'+(o.type?' type="'+o.type+'"':'')+(o.ph?' placeholder="'+esc(o.ph)+'"':'')+'>'+
  (o.hint?'<p class="hint">'+esc(o.hint)+'</p>':'')+'</div>';
const fTa=(l,b,v,o={})=>'<div style="margin-bottom:12px"><label class="lab'+(o.req?' req':'')+'">'+esc(l)+'</label>'+
  '<textarea class="fld'+(o.mono?' mono':'')+'" data-b="'+b+'" rows="'+(o.rows||4)+'"'+(o.ph?' placeholder="'+esc(o.ph)+'"':'')+'>'+esc(v||'')+'</textarea>'+
  (o.hint?'<p class="hint">'+o.hint+'</p>':'')+'</div>';
const fSel=(l,b,v,opts)=>'<div><label class="lab">'+esc(l)+'</label><select class="fld" data-b="'+b+'">'+
  opts.map(([k,t])=>'<option value="'+esc(k)+'"'+(String(v||'')===String(k)?' selected':'')+'>'+esc(t)+'</option>').join('')+'</select></div>';
const fChk=(l,b,v)=>'<label class="chk"><input type="checkbox" data-b="'+b+'"'+(v?' checked':'')+'><span>'+esc(l)+'</span></label>';
const newsOpts=()=>[['','— немає —']].concat(newsSorted().slice(0,120).map(n=>[n.id,(n.date||n.year||'')+' · '+String(n.title||'(без назви)').slice(0,80)]));
function vEditor(){
  if(!ED.on) return head('Редактор сайту','Новини, анонси, результати, фото й документи.')+
    '<section class="sec"><div class="wrap" style="max-width:460px"><div class="panel"><h3>Вхід для редакторів</h3>'+
    '<label class="lab" for="pw">Пароль</label><input class="fld" type="password" id="pw" autocomplete="current-password">'+
    '<div style="margin-top:14px"><button class="btn primary" id="go">Увійти</button></div>'+
    '<p class="dim" style="font-size:14px;margin:12px 0 0">Пароль видає адміністратор сайту. Після входу можна додавати новини, фото, '+
    'протоколи, документи й результати та публікувати їх кнопкою «Опублікувати».</p></div></div></section>';
  const dr=!ED.dirty&&edDraft();
  let h=head('Редактор сайту','')+'<section class="sec"><div class="wrap">'+
    '<div class="edbar"><div id="edst" class="st'+(ED.dirty?' dirty':'')+'">'+edStatusHtml()+'</div>'+
    '<a class="btn sm" href="#/">Сайт</a>'+
    '<button class="btn sm primary" id="edpub"'+(ED.srv?'':' disabled title="Публікація недоступна"')+'>Опублікувати</button>'+
    '<details class="menu"><summary class="btn sm">Ще ▾</summary><div>'+
      '<button data-ed="export">Зберегти копію даних (файл)</button>'+
      '<button data-ed="import">Відкрити копію даних…</button>'+
      (ED.srv?'<button data-ed="hist">Історія версій</button>':'')+
      '<button data-ed="help">Як користуватися</button>'+
      '<button data-ed="logout">Вийти</button></div></details>'+
    '<input type="file" id="edimp" accept="application/json,.json" class="hide"></div>';
  if(ED.note) h+='<div class="warn"><b>Публікація недоступна</b>'+esc(ED.note)+'</div>';
  if(dr) h+='<div class="note" style="display:flex;gap:10px;align-items:center;flex-wrap:wrap"><span style="flex:1;min-width:220px">'+
    'У цьому браузері є неопублікована чернетка від '+esc(fmtStamp(dr.at))+'.'+
    (dr.data.updated&&dr.data.updated!==DATA.updated?' <b>Увага:</b> після неї сайт уже оновлювали — відновлення замінить новіші зміни.':'')+'</span>'+
    '<button class="btn sm primary" data-ed="draft-restore">Відновити</button><button class="btn sm" data-ed="draft-drop">Видалити чернетку</button></div>';
  if(ED.hist) h+=edHistHtml();
  if(ED.help) h+=edHelpHtml();
  h+='<div class="ed"><div>'+edSide()+'</div><div id="edform">'+edForm()+'</div></div>';
  return h+'</div></section>';
}
function edSide(){
  let h='<div class="panel"><div class="tabs ed-tabs">'+TABS.map(([k,l])=>'<button data-tab="'+k+'" class="'+(ED.tab===k?'on':'')+'">'+l+'</button>').join('')+'</div>';
  if(ED.tab==='pages') return h+'<div class="ed-list">'+[['about','Про нас'],['contacts','Контакти']].map(([k,l])=>
    '<a href="#" data-sel="'+k+'" class="'+(ED.sel===k?'on':'')+'"><span>'+l+'</span></a>').join('')+'</div></div>';
  return h+'<button class="btn sm primary" id="edadd" style="width:100%;margin-bottom:10px">+ '+
    ({news:'Нова новина',ann:'Новий анонс',res:'Новий результат'}[ED.tab])+'</button>'+
    '<input class="fld" type="search" id="edq" placeholder="Пошук у списку" value="'+esc(ED.q)+'" style="margin-bottom:8px">'+
    '<div class="ed-list" id="edlist">'+edList().map(x=>'<a href="#" data-sel="'+esc(x.id)+'" data-s="'+esc(String(x.title||'').toLowerCase())+'" class="'+
      (ED.sel===x.id?'on':'')+'"><span>'+esc(x.title||'(без назви)')+'</span><small>'+esc(edDateOf(x))+'</small></a>').join('')+'</div></div>';
}
const edEmpty=t=>'<div class="panel"><h3>Нічого не вибрано</h3><p class="dim" style="margin:0">'+esc(t)+'</p></div>';
function edForm(){
  if(ED.tab==='pages') return ED.sel==='about'?edAbout():ED.sel==='contacts'?edContacts():edEmpty('Оберіть сторінку ліворуч.');
  const it=edItem();
  if(!it) return edEmpty('Оберіть матеріал у списку ліворуч або додайте новий.');
  return ED.tab==='news'?edNews(it):ED.tab==='ann'?edAnn(it):edRes(it);
}
const edTiles=(k,a)=>a.length?'<div class="ed-ph">'+a.map((p,i)=>'<div class="ed-tile"><img src="'+esc(p.thumb||p.src)+'" alt="" loading="lazy">'+
  '<input class="fld" data-b="'+k+'.'+i+'.caption" value="'+esc(p.caption||'')+'" placeholder="Підпис (необов’язково)">'+
  '<div class="ed-tb"><button data-mv="'+k+':'+i+':-1" title="Перемістити ліворуч" aria-label="Перемістити ліворуч">←</button>'+
  '<button data-mv="'+k+':'+i+':1" title="Перемістити праворуч" aria-label="Перемістити праворуч">→</button>'+
  '<button class="x" data-rm="'+k+':'+i+'" title="Прибрати" aria-label="Прибрати">✕</button></div></div>').join('')+'</div>'
  :'<p class="dim" style="font-size:14px;margin:0 0 10px">Ще немає.</p>';
const edUpBtn=(kind,l,acc,multi)=>'<label class="btn sm'+(ED.srv?'':' dis')+'">'+esc(l)+'<input type="file" class="hide" data-up="'+kind+'" accept="'+acc+'"'+
  (multi?' multiple':'')+(ED.srv?'':' disabled')+'></label>'+
  (ED.srv?'':'<p class="hint">Додавати файли можна лише на сайті з налаштованою публікацією.</p>')+'<div class="prog" data-prog="'+kind+'"></div>';
const rowsWord=n=>plural(n,'рядок','рядки','рядків');
const tsvInfo=t=>rowsWord((t.rows||[]).length)+', '+plural((t.head||[]).length,'стовпець','стовпці','стовпців')+'.'+
  (t.final&&!(t.head||[]).includes('Учасник')?' Для сторінок шахістів потрібен стовпець «Учасник».':'');
function edTable(t,i,n){
  let h='<div class="ed-box"><div class="row">'+fIn('Назва таблиці','tables.'+i+'.title',t.title,{wide:1})+'</div>';
  if(t.head&&t.rows){
    h+='<label class="lab">Вміст: кожен рядок — рядок таблиці, клітинки розділені табуляцією</label>'+
      '<textarea class="fld mono" data-tsv="'+i+'" rows="'+Math.max(5,Math.min(16,t.rows.length+2))+'" spellcheck="false">'+
      esc([t.head].concat(t.rows).map(r=>r.join('\t')).join('\n'))+'</textarea>'+
      '<p class="hint" data-tsvinfo="'+i+'">'+esc(tsvInfo(t))+' Перший рядок — заголовки. Таблицю можна скопіювати з Excel чи Swiss-Manager і вставити сюди (Ctrl+V).</p>'+
      fChk('Підсумкова таблиця змагання — показувати результати на сторінках шахістів','tables.'+i+'.final',t.final);
    if(t.final) h+='<div class="row">'+fIn('Назва змагання (коротко)','tables.'+i+'.label',t.label||n.title)+
      fSel('Дисципліна','tables.'+i+'.disc',t.disc,[['','—']].concat(Object.entries(DISC)))+
      fIn('Дата початку','tables.'+i+'.date',t.date||n.date,{type:'date'})+'</div>';
  } else h+='<p class="note" style="margin:0">Таблиця з групами ('+(t.groups||[]).length+') — тут змінюється лише назва.</p>';
  return h+'<div class="ed-row"><button class="btn sm" data-mv="tables:'+i+':-1" aria-label="Вище">↑</button>'+
    '<button class="btn sm" data-mv="tables:'+i+':1" aria-label="Нижче">↓</button>'+
    '<button class="btn sm danger" data-rm="tables:'+i+'">Видалити таблицю</button></div></div>';
}
function edNews(n){
  const hasRes=(DATA.results||[]).some(x=>x.newsId===n.id);
  let h='<div class="panel"><div class="sec-head" style="margin-bottom:12px"><h3 style="margin:0">Новина</h3>'+
    '<a class="link" href="#/news/'+esc(n.id)+'">Переглянути на сайті →</a></div>'+
    '<div class="row">'+fIn('Заголовок','title',n.title,{req:1,wide:1})+'</div>'+
    '<div class="row">'+fIn('Дата','date',n.date,{type:'date',req:1})+fSel('Статус','status',n.status||'Перевірено',STATUSES.map(s=>[s,s]))+'</div>'+
    fTa('Короткий опис — показується в картці новини','lead',n.lead,{rows:2})+
    fTa('Текст','body',(n.body||[]).join('\n\n'),{rows:12,hint:'Абзаци — через порожній рядок. Рядок, що починається з «## », стане підзаголовком, з «• » — пунктом списку.'})+
    '<div class="row">'+fIn('Позначка «потребує уточнення» (якщо щось ще не перевірено)','needsCheck',n.needsCheck,{wide:1})+'</div>'+
    (hasRes?'':'<button class="btn sm" data-mkres>Додати це змагання в «Результати»</button>')+'</div>';
  h+='<div class="panel"><h3>Фото <small class="dim" style="font-weight:500">перше — обкладинка новини</small></h3>'+
    edTiles('photos',n.photos||[])+edUpBtn('photo','+ Додати фото','image/*',true)+
    '<p class="hint">Можна вибрати одразу кілька. Фото зменшуються автоматично (до 1600 пікселів), тож можна брати прямо з телефона.</p></div>';
  h+='<div class="panel"><h3>Протоколи (фото таблиць)</h3>'+edTiles('scans',n.scans||[])+edUpBtn('scan','+ Додати фото протоколу','image/*',true)+
    '<p class="hint">Зберігаються з вищою роздільністю, щоб цифри читалися.</p></div>';
  h+='<div class="panel"><h3>Документи</h3>'+(n.docs||[]).map((d,i)=>'<div class="ed-doc"><input class="fld" data-b="docs.'+i+'.title" value="'+esc(d.title)+'" placeholder="Назва документа">'+
    (safeUrl(d.url)?'<a class="btn sm" href="'+esc(safeUrl(d.url))+'" target="_blank" rel="noopener">Відкрити</a>':'')+
    '<button class="btn sm danger" data-rm="docs:'+i+'" aria-label="Прибрати">✕</button></div>').join('')+
    edUpBtn('doc','+ Додати документ (PDF, Word, Excel, фото)','.pdf,.doc,.docx,.xls,.xlsx,image/*',true)+'</div>';
  h+='<div class="panel"><h3>Турнірні таблиці</h3>'+(n.tables||[]).map((t,i)=>edTable(t,i,n)).join('')+
    '<button class="btn sm" data-addtbl>+ Додати таблицю</button></div>';
  return h+'<div class="panel"><button class="btn sm danger" id="eddel">Видалити новину</button></div>';
}
function edAnn(a){
  return '<div class="panel"><div class="sec-head" style="margin-bottom:12px"><h3 style="margin:0">Анонс турніру</h3>'+
    '<a class="link" href="#/tournaments">Переглянути на сайті →</a></div>'+
    '<div class="row">'+fIn('Назва','title',a.title,{req:1,wide:1})+'</div>'+
    '<div class="row">'+fIn('Початок','dateStart',a.dateStart,{type:'date',req:1})+fIn('Завершення','dateEnd',a.dateEnd,{type:'date'})+
      fSel('Дисципліна','discipline',a.discipline,Object.entries(DISC))+'</div>'+
    '<div class="row">'+fIn('Місце проведення','place',a.place,{wide:1})+'</div>'+
    '<div class="row">'+fIn('Формат','format',a.format,{ph:'Швейцарська система, 9 турів'})+fIn('Учасники / вікова категорія','ageCat',a.ageCat)+'</div>'+
    fTa('Короткий опис','lead',a.lead,{rows:3})+
    '<div class="row">'+fIn('Регламент — посилання або файл','regulation',a.regulation,{wide:1,ph:'https://… або завантажте файл нижче'})+'</div>'+
    edUpBtn('reg','Завантажити регламент (PDF чи фото)','.pdf,.doc,.docx,image/*',false)+
    '<div class="row" style="margin-top:12px">'+fSel('Новина про цей турнір','newsId',a.newsId,newsOpts())+'</div></div>'+
    '<div class="panel"><button class="btn sm danger" id="eddel">Видалити анонс</button></div>';
}
function edRes(x){
  let h='<div class="panel"><div class="sec-head" style="margin-bottom:12px"><h3 style="margin:0">Результат змагання</h3>'+
    '<a class="link" href="#/tournaments?tab=results&year='+esc(x.year)+'">Переглянути на сайті →</a></div>'+
    '<div class="row">'+fIn('Назва змагання','title',x.title,{req:1,wide:1})+'</div>'+
    '<div class="row">'+fSel('Тип','kind',x.kind,Object.entries(KINDS))+fSel('Дисципліна','discipline',x.discipline,[['','—']].concat(Object.entries(DISC)))+
      fSel('Статус','status',x.status||'Перевірено',STATUSES.map(s=>[s,s]))+'</div>'+
    '<div class="row">'+fIn('Початок','dateStart',x.dateStart,{type:'date',req:1})+fIn('Завершення','dateEnd',x.dateEnd,{type:'date'})+'</div>'+
    '<div class="row">'+fSel('Новина з таблицями','newsId',x.newsId,newsOpts())+'</div>'+
    fTa('Примітка','note',x.note,{rows:2})+'</div>';
  h+='<div class="panel"><h3>Призери</h3>'+(x.groups||[]).map((g,i)=>'<div class="ed-box">'+
    '<div class="row">'+fIn('Група / категорія','groups.'+i+'.label',g.label,{ph:'порожньо — основний залік',wide:1})+'</div>'+
    '<label class="lab">Кожен призер з нового рядка: місце | прізвище ім’я | очки</label>'+
    '<textarea class="fld mono" data-places="'+i+'" rows="4" spellcheck="false">'+esc((g.places||[]).map(p=>[p.p,p.name,p.pts].join(' | ')).join('\n'))+'</textarea>'+
    (x.kind==='champ'?fChk('Не присвоювати звання чемпіона (наприклад, грали поза конкурсом)','groups.'+i+'.noChampion',g.noChampion):'')+
    '<div class="ed-row"><button class="btn sm danger" data-rm="groups:'+i+'">Видалити групу</button></div></div>').join('')+
    '<div class="ed-row"><button class="btn sm" data-addgrp>+ Група</button>'+
    (x.newsId?'<button class="btn sm" data-fromtbl>Заповнити з таблиці новини</button>':'')+'</div>'+
    '<p class="hint">Чемпіоном області на сайті вважається перше місце в основному заліку (чи у віковій групі) змагання типу «Чемпіонат / першість».</p></div>';
  return h+'<div class="panel"><button class="btn sm danger" id="eddel">Видалити результат</button></div>';
}
function edAbout(){
  const a=DATA.about;
  return '<div class="panel"><div class="sec-head" style="margin-bottom:12px"><h3 style="margin:0">Сторінка «Про нас»</h3>'+
    '<a class="link" href="#/about">Переглянути →</a></div>'+
    '<div class="row">'+fIn('Заголовок','title',a.title,{wide:1})+'</div>'+
    fTa('Текст','body',(a.body||[]).join('\n\n'),{rows:14,hint:'Абзаци — через порожній рядок.'})+'</div>';
}
function edContacts(){
  const c=DATA.contacts;
  return '<div class="panel"><div class="sec-head" style="margin-bottom:12px"><h3 style="margin:0">Контакти</h3>'+
    '<a class="link" href="#/contacts">Переглянути →</a></div>'+
    '<div class="row">'+fIn('Адреса','address',c.address,{wide:1})+'</div>'+
    '<div class="row">'+fIn('Час роботи','hours',c.hours)+fIn('Телефон','phone',c.phone)+'</div>'+
    '<div class="row">'+fIn('Email','email',c.email)+fIn('Facebook (посилання)','facebook',c.facebook)+fIn('Telegram (посилання)','telegram',c.telegram)+'</div>'+
    '<div class="row">'+fIn('Пошуковий запит для карти','mapQuery',c.mapQuery,{wide:1,hint:'Так, як шукали б у Google Картах.'})+'</div>'+
    '<p class="hint">Порожні поля на сайті не показуються.</p></div>';
}
function edHistHtml(){
  return '<div class="panel"><div class="sec-head" style="margin-bottom:8px"><h3 style="margin:0">Історія версій</h3>'+
    '<button class="btn sm" data-ed="histclose">Закрити</button></div>'+
    (ED.hist.length?'<p class="hint" style="margin:0 0 10px">Перед кожною публікацією сервер зберігає попередню версію сайту (останні 60). '+
      'Відновлення замінить поточну версію — її теж буде збережено в історії.</p><div class="ed-list">'+
      ED.hist.map(b=>'<div class="ed-hist"><span>'+esc(fmtStamp(b.time))+' <small class="dim">'+Math.max(1,Math.round(b.size/1024))+' КБ</small></span>'+
        '<button class="btn sm" data-restore="'+esc(b.name)+'" data-t="'+esc(fmtStamp(b.time))+'">Відновити</button></div>').join('')+'</div>'
      :'<p class="dim" style="margin:0">Копій ще немає — вони з’являться після першої публікації.</p>')+'</div>';
}
function edHelpHtml(){
  return '<div class="panel"><div class="sec-head" style="margin-bottom:8px"><h3 style="margin:0">Як користуватися</h3>'+
    '<button class="btn sm" data-ed="helpclose">Закрити</button></div><div class="article" style="max-width:none"><ul style="font-size:15.5px">'+
    '<li>Оберіть розділ (Новини, Анонси, Результати, Сторінки), потім матеріал у списку — або «+ Нова…».</li>'+
    '<li>Усе, що ви змінюєте, одразу видно на сайті <b>у вашому браузері</b> — натисніть «Переглянути на сайті», щоб перевірити.</li>'+
    '<li>Відвідувачі побачать зміни лише після кнопки <b>«Опублікувати»</b>.</li>'+
    '<li>Фото додаються кнопкою «+ Додати фото»: можна вибрати кілька одразу, з телефона теж. Перше фото — обкладинка.</li>'+
    '<li>Таблицю результатів зручно скопіювати з Swiss-Manager чи Excel і вставити в поле «Вміст». Позначка «Підсумкова таблиця» додасть результати на сторінки шахістів.</li>'+
    '<li>Переможців змагання додайте в розділі «Результати» — вони з’являться в «Результатах» і, для чемпіонатів, у «Залі чемпіонів».</li>'+
    '<li>Якщо щось пішло не так — «Ще» → «Історія версій» поверне сайт до попереднього стану.</li>'+
    '<li>Перевіряйте написання імен, особливо дітей, — до літери, як у протоколі.</li></ul></div></div>';
}
/* ── зміни полів ── */
const HEADMAP={'rk.':'Місце','rk':'Місце','pl.':'Місце','місце':'Місце','name':'Учасник','ім’я':'Учасник','прізвище, ім’я':'Учасник','учасник':'Учасник',
  'pts.':'Очки','pts':'Очки','points':'Очки','очки':'Очки','rtg':'Рейтинг','elo':'Рейтинг','rtgi':'Рейтинг','rtgn':'Рейтинг','рейтинг':'Рейтинг',
  'tb1':'Бухг.','bh.':'Бухг.','bh':'Бухг.','buchh.':'Бухг.','sno':'Ст. №','fed':'Федерація','club/city':'Клуб'};
function parseRows(txt){
  const lines=String(txt).replace(/\r/g,'').split('\n').filter(l=>l.trim());
  const tab=lines.some(l=>l.includes('\t')), semi=!tab&&lines.some(l=>l.includes(';')), bar=!tab&&!semi&&lines.some(l=>l.includes('|'));
  return lines.map(l=>(tab?l.split('\t'):semi?l.split(';'):bar?l.split('|'):l.trim().split(/\s{2,}/)).map(c=>c.trim()));
}
function edSet(it,el){
  if(!it) return;
  const path=el.dataset.b.split('.'); let o=it;
  for(let i=0;i<path.length-1;i++){ o=o[path[i]]; if(o==null) return; }
  const k=path[path.length-1];
  let v=el.type==='checkbox'?el.checked:el.value;
  if(k==='body'&&path.length===1) v=el.value.split(/\n\s*\n/).map(s=>s.trim()).filter(Boolean);
  if(el.type==='checkbox'&&!v) delete o[k]; else o[k]=v;
  if(path.length===1){
    if(k==='date'&&ED.tab==='news'&&v){ it.year=v.slice(0,4); delete it.sortDate; it.dateNote=''; }
    if(k==='dateStart'&&ED.tab==='res'&&v) it.year=v.slice(0,4);
    if(k==='title'){ const s=$('#edlist a.on span'); if(s) s.textContent=v||'(без назви)'; }
  }
  edMark();
  if(/\.final$/.test(el.dataset.b)||(ED.tab==='res'&&(k==='kind'||k==='newsId'))) edRender();
}
function edTsv(it,el){
  const t=(it.tables||[])[+el.dataset.tsv]; if(!t) return;
  const rows=parseRows(el.value);
  if(!rows.length){ t.head=[]; t.rows=[]; }
  else { const w=Math.max(...rows.map(r=>r.length)), pad=r=>{const x=r.slice();while(x.length<w)x.push('');return x;};
    t.head=pad(rows[0].map(c=>HEADMAP[c.toLowerCase()]||c)); t.rows=rows.slice(1).map(pad);
    const ri=t.head.indexOf('Рейтинг'); if(ri>=0) t.rows.forEach(r=>{ if(/^(0+|-|—)$/.test(r[ri])) r[ri]='б/р'; }); } /* без рейтингу — «б/р» */
  const info=$('[data-tsvinfo="'+el.dataset.tsv+'"]'); if(info) info.textContent=tsvInfo(t);
  edMark();
}
function edPlaces(it,el){
  const g=(it.groups||[])[+el.dataset.places]; if(!g) return;
  g.places=String(el.value).replace(/\r/g,'').split('\n').filter(l=>l.trim()).map(l=>{
    const c=l.split(/\s*[|\t]\s*/);
    return c.length>1?{p:c[0].trim().replace(/\.$/,''),name:(c[1]||'').trim(),pts:(c[2]||'').trim()}:{p:'',name:c[0].trim(),pts:''}; });
  edMark();
}
function edAdd(){
  const d=TODAY, y=d.slice(0,4), id=p=>p+'-'+d+'-'+Math.random().toString(36).slice(2,6);
  let x;
  if(ED.tab==='news'){ x={id:id('n'),date:d,dateNote:'',year:y,title:'',lead:'',body:[],tables:[],photos:[],scans:[],docs:[],related:[],needsCheck:'',status:'Перевірено'}; DATA.news.unshift(x); }
  else if(ED.tab==='ann'){ x={id:id('a'),newsId:'',title:'',dateStart:d,dateEnd:'',place:DATA.contacts.address||'',discipline:'classic',format:'',ageCat:'',lead:'',regulation:''}; DATA.announcements.unshift(x); }
  else { x={id:id('r'),newsId:'',year:y,dateStart:d,dateEnd:'',discipline:'classic',kind:'tourn',title:'',status:'Перевірено',
    groups:[{label:'',places:[{p:'1',name:'',pts:''},{p:'2',name:'',pts:''},{p:'3',name:'',pts:''}]}],note:''}; DATA.results.unshift(x); }
  ED.sel=x.id; ED.q=''; edMark(); render(); edFocusForm(true);
}
function edFocusForm(title){
  setTimeout(()=>{ const f=$('#edform'); if(f&&window.innerWidth<860) f.scrollIntoView({behavior:'smooth'});
    if(title){ const t=$('[data-b="title"]'); if(t) t.focus({preventScroll:window.innerWidth<860}); } },60);
}
function edDel(){
  const it=edItem(); if(!it) return;
  const k=ED.tab==='news'?'news':ED.tab==='ann'?'announcements':'results';
  const used=k==='news'&&(DATA.events||[]).some(e=>e.newsId===it.id);
  if(!confirm('Видалити «'+(it.title||'без назви')+'»?'+(used?'\nЦя новина згадується на сторінках шахістів.':'')+'\nНа сайті зникне після публікації.')) return;
  const i=DATA[k].indexOf(it); if(i>=0) DATA[k].splice(i,1);
  if(k==='news'){ DATA.announcements.forEach(a=>{if(a.newsId===it.id)a.newsId='';}); DATA.results.forEach(r=>{if(r.newsId===it.id)r.newsId='';});
    DATA.news.forEach(n=>{if(n.related)n.related=n.related.filter(r=>r!==it.id);}); }
  ED.sel=null; edMark(); render(); toast('Видалено. Натисніть «Опублікувати», щоб прибрати і з сайту.',3500);
}
function edResFromNews(n){
  const t=(n.tables||[]).find(t=>t.final&&t.head&&t.head.includes('Учасник'))||(n.tables||[]).find(t=>t.head&&t.rows&&t.head.includes('Учасник'));
  const x={id:'r-'+(n.date||TODAY)+'-'+Math.random().toString(36).slice(2,6),newsId:n.id,year:(n.date||TODAY).slice(0,4),dateStart:n.date||TODAY,dateEnd:'',
    discipline:(t&&t.disc)||'',kind:'tourn',title:n.title,status:n.status||'Перевірено',groups:[{label:'',places:[]}],note:''};
  if(t) x.groups[0].places=topThree(t);
  DATA.results.unshift(x); ED.tab='res'; ED.sel=x.id; ED.q=''; edMark(); render(); edFocusForm(false);
  toast(t?'Створено результат — перевірте призерів і тип змагання':'Створено результат — впишіть призерів',4000);
}
function topThree(t){
  const ni=t.head.indexOf('Учасник'), mi=t.head.indexOf('Місце'), pi=t.head.indexOf('Очки');
  return t.rows.slice(0,3).map((r,i)=>({p:String(mi>=0&&r[mi]?r[mi]:i+1).replace(/\.$/,''),name:r[ni]||'',pts:pi>=0?r[pi]||'':''}));
}
function edFromTable(x){
  const n=getNews(x.newsId);
  const t=n&&((n.tables||[]).find(t=>t.final&&t.head&&t.head.includes('Учасник'))||(n.tables||[]).find(t=>t.head&&t.rows&&t.head.includes('Учасник')));
  if(!t) return toast('У новині немає таблиці зі стовпцем «Учасник».',4000);
  if(!x.groups||!x.groups.length) x.groups=[{label:'',places:[]}];
  const g=x.groups[0];
  if((g.places||[]).some(p=>p.name)&&!confirm('Замінити призерів «'+(g.label||'основний залік')+'» першими трьома з таблиці «'+t.title+'»?')) return;
  g.places=topThree(t); edMark(); edRender();
}
/* фото: зменшення в браузері перед відправкою */
async function prepImage(file,max,q){
  let src;
  try{ src=await createImageBitmap(file,{imageOrientation:'from-image'}); }
  catch(e){ src=await new Promise((res,rej)=>{ const i=new Image(); i.onload=()=>res(i);
    i.onerror=()=>rej(new Error('не вдалося відкрити зображення (формат HEIC? збережіть як JPG)')); i.src=URL.createObjectURL(file); }); }
  const w0=src.width||src.naturalWidth, h0=src.height||src.naturalHeight, k=Math.min(1,max/Math.max(w0,h0));
  const c=document.createElement('canvas'); c.width=Math.max(1,Math.round(w0*k)); c.height=Math.max(1,Math.round(h0*k));
  const x=c.getContext('2d'); x.fillStyle='#fff'; x.fillRect(0,0,c.width,c.height); x.imageSmoothingQuality='high'; x.drawImage(src,0,0,c.width,c.height);
  if(src.close) src.close();
  return await new Promise((res,rej)=>c.toBlob(b=>b?res(b):rej(new Error('не вдалося стиснути зображення')),'image/jpeg',q));
}
/* якщо хостинг приймає файли лише до N МБ — дотискаємо зображення, поки не влізе */
async function fitImage(f,max,q){
  let b=await prepImage(f,max,q);
  for(let i=0;i<5&&ED.maxUp&&b.size>ED.maxUp*.9;i++){ max=Math.round(max*.85); q=Math.max(.6,q-.07); b=await prepImage(f,max,q); }
  return b;
}
async function edUpload(kind,input){
  const files=[...input.files]; input.value=''; if(!files.length) return;
  const it=edTarget(); if(!it||!ED.srv) return;
  const prog=$('[data-prog="'+kind+'"]'), say=t=>{ if(prog) prog.textContent=t; ED.busy=t; edStatus(); };
  const base=edSlug(it.title||kind); let done=0; const errs=[];
  for(const f of files){
    say('Завантаження '+(done+errs.length+1)+' з '+files.length+'…');
    try{
      if(kind==='photo'){ const full=await fitImage(f,1600,.85), th=await prepImage(f,480,.8);
        const j=await api('upload',{kind:'photo',name:base},[['file',full,'photo.jpg'],['thumb',th,'thumb.jpg']]);
        (it.photos=it.photos||[]).push({src:j.src,thumb:j.thumb||j.src,caption:''}); }
      else if(kind==='scan'){ const b=await fitImage(f,2400,.9);
        const j=await api('upload',{kind:'scan',name:base},[['file',b,'scan.jpg']]); (it.scans=it.scans||[]).push({src:j.src,caption:''}); }
      else { const img=/^image\//.test(f.type), b=img?await fitImage(f,2400,.9):f;
        if(ED.maxUp&&b.size>ED.maxUp) throw new Error('файл більший за дозволені хостингом '+Math.round(ED.maxUp/1048576)+' МБ');
        const j=await api('upload',{kind:'doc',name:(kind==='reg'?'reglament-':'')+base},[['file',b,img?'doc.jpg':f.name]]);
        if(kind==='reg') it.regulation=j.src; else (it.docs=it.docs||[]).push({title:f.name.replace(/\.[^.]+$/,''),url:j.src}); }
      done++; edMark();
    }catch(e){ errs.push(f.name+': '+e.message); }
  }
  ED.busy=''; edRender();
  toast(errs.length?'Не завантажено — '+errs.join('; '):'Завантажено: '+done+'. Не забудьте «Опублікувати».',errs.length?8000:3000);
}
function edCheck(){
  const p=[];
  DATA.news.forEach(n=>{ if(!String(n.title||'').trim()) p.push(['news',n.id,'Є новина без заголовка']);
    else if(!n.date&&!n.dateNote&&!n.year) p.push(['news',n.id,'Новина без дати: «'+n.title+'»']); });
  DATA.announcements.forEach(a=>{ if(!String(a.title||'').trim()) p.push(['ann',a.id,'Є анонс без назви']);
    else if(!a.dateStart) p.push(['ann',a.id,'Анонс без дати: «'+a.title+'»']); });
  DATA.results.forEach(x=>{ if(!String(x.title||'').trim()) p.push(['res',x.id,'Є результат без назви']);
    else if(!x.dateStart&&!x.year) p.push(['res',x.id,'Результат без дати: «'+x.title+'»']); });
  return p;
}
async function edPublish(){
  if(!ED.srv||ED.busy) return;
  const p=edCheck();
  if(p.length){ ED.tab=p[0][0]; ED.sel=p[0][1]; render(); edFocusForm(false);
    toast(p[0][2]+(p.length>1?' (і ще '+(p.length-1)+')':'')+' — виправте перед публікацією.',5000); return; }
  ED.busy='Публікація…'; edStatus(); const b=$('#edpub'); if(b) b.disabled=true;
  try{ clearTimeout(edT); const j=await api('save',{data:JSON.stringify(DATA)});
    DATA.updated=j.updated; ED.dirty=false; store('localStorage',ED_DRAFT,null); ED.busy=''; edStatus();
    toast('Опубліковано ✓ Зміни вже на сайті.',3500); }
  catch(e){ ED.busy=''; edStatus(); toast('Не вдалося опублікувати: '+e.message,8000); }
  finally{ const b2=$('#edpub'); if(b2) b2.disabled=!ED.srv; }
}
async function edRestore(name,when){
  if(!confirm('Повернути сайт до версії від '+when+'?\nПоточну версію буде збережено в історії.')) return;
  try{ await api('restore',{name}); setData(await freshData()); ED.dirty=false; store('localStorage',ED_DRAFT,null);
    ED.hist=null; ED.sel=null; render(); toast('Версію відновлено ✓',3500); }
  catch(e){ toast('Не вдалося відновити: '+e.message,8000); }
}
function bindEditor(){
  const go=$('#go');
  if(go){ const f=()=>edLogin($('#pw').value); go.onclick=f; $('#pw').onkeydown=e=>{if(e.key==='Enter')f();};
    const k=store('sessionStorage',ED_KEY); if(k) edLogin(k,true); else $('#pw').focus(); return; }
  $$('[data-tab]').forEach(b=>b.onclick=()=>{ ED.tab=b.dataset.tab; ED.sel=ED.tab==='pages'?'about':null; ED.q=''; render(); });
  $$('[data-sel]').forEach(a=>a.onclick=e=>{ e.preventDefault(); ED.sel=a.dataset.sel; edRender(); edFocusForm(false); });
  const q=$('#edq');
  if(q){ q.oninput=()=>{ ED.q=q.value; const w=q.value.toLowerCase().trim();
    $$('#edlist a').forEach(a=>a.classList.toggle('hide',!!w&&!a.dataset.s.includes(w))); }; if(ED.q) q.oninput(); }
  const on=(sel,fn)=>{ const el=$(sel); if(el) el.onclick=fn; };
  on('#edadd',edAdd); on('#eddel',edDel); on('#edpub',edPublish);
  $$('[data-ed]').forEach(b=>b.onclick=()=>{ const a=b.dataset.ed; const m=b.closest('details'); if(m) m.open=false;
    if(a==='export'){ const bl=new Blob([JSON.stringify(DATA,null,1)],{type:'application/json'}); const l=document.createElement('a');
      l.href=URL.createObjectURL(bl); l.download='site-data.json'; l.click(); setTimeout(()=>URL.revokeObjectURL(l.href),1000); }
    else if(a==='import') $('#edimp').click();
    else if(a==='hist') api('backups').then(j=>{ ED.hist=j.backups||[]; ED.help=false; render(); }).catch(e=>toast(e.message,6000));
    else if(a==='histclose'){ ED.hist=null; render(); }
    else if(a==='help'){ ED.help=true; ED.hist=null; render(); }
    else if(a==='helpclose'){ ED.help=false; render(); }
    else if(a==='logout'){ if(ED.dirty&&!confirm('Є неопубліковані зміни — вони залишаться чернеткою в цьому браузері. Вийти?')) return;
      ED.on=false; ED.key=''; ED.srv=false; ED.dirty=false; store('sessionStorage',ED_KEY,null); render(); }
    else if(a==='draft-restore'){ const d=edDraft(); if(d){ setData(d.data); ED.dirty=true; ED.sel=null; render(); toast('Чернетку відновлено',2500); } }
    else if(a==='draft-drop'){ if(confirm('Видалити чернетку назавжди?')){ store('localStorage',ED_DRAFT,null); render(); } }
  });
  const imp=$('#edimp');
  if(imp) imp.onchange=e=>{ const f=e.target.files[0]; if(!f) return; const fr=new FileReader();
    fr.onload=()=>{ try{ const d=JSON.parse(fr.result); if(!Array.isArray(d.news)) throw 0; setData(d); ED.sel=null; edMark(); render(); toast('Дані відкрито. Перевірте й опублікуйте.',3500); }
      catch(err){ toast('Файл пошкоджено або це не дані сайту.',4000); } }; fr.readAsText(f); };
  $$('[data-restore]').forEach(b=>b.onclick=()=>edRestore(b.dataset.restore,b.dataset.t));
  const it=edTarget(); if(!it) return;
  $$('[data-b]').forEach(el=>el.addEventListener(el.type==='checkbox'||el.tagName==='SELECT'?'change':'input',()=>edSet(it,el)));
  $$('[data-tsv]').forEach(el=>el.addEventListener('input',()=>edTsv(it,el)));
  $$('[data-places]').forEach(el=>el.addEventListener('input',()=>edPlaces(it,el)));
  $$('[data-up]').forEach(el=>el.onchange=()=>edUpload(el.dataset.up,el));
  $$('[data-mv]').forEach(b=>b.onclick=()=>{ const [k,i,d]=b.dataset.mv.split(':'), a=it[k], j=+i+ +d;
    if(!Array.isArray(a)||j<0||j>=a.length) return; [a[+i],a[j]]=[a[j],a[+i]]; edMark(); edRender(); });
  $$('[data-rm]').forEach(b=>b.onclick=()=>{ const [k,i]=b.dataset.rm.split(':'), a=it[k]; if(!Array.isArray(a)) return;
    const what={photos:'це фото',scans:'цей протокол',docs:'цей документ',tables:'цю таблицю',groups:'цю групу'}[k]||'це';
    if(!confirm('Прибрати '+what+'?')) return; a.splice(+i,1); edMark(); edRender(); });
  on('[data-addtbl]',()=>{ (it.tables=it.tables||[]).push({title:'Підсумкова таблиця',head:['Місце','Учасник','Очки','Бухг.','Рейтинг'],rows:[]}); edMark(); edRender(); });
  on('[data-addgrp]',()=>{ (it.groups=it.groups||[]).push({label:'',places:[{p:'1',name:'',pts:''}]}); edMark(); edRender(); });
  on('[data-fromtbl]',()=>edFromTable(it));
  on('[data-mkres]',()=>edResFromNews(it));
}
/* свіжі дані з хостингу (після публікації вони новіші за вбудовані в сторінку) */
function loadFresh(){
  if(!/^https?:$/.test(location.protocol)) return;
  freshData().then(d=>{ if(!d.updated||d.updated===DATA.updated||ED.dirty||ED.on) return; setData(d); edRender(); }).catch(()=>{});
}
window.addEventListener('beforeunload',e=>{ if(ED.dirty){ e.preventDefault(); e.returnValue=''; } });
