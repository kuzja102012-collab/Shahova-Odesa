/* ---------------- рух: «шаховий космос» ---------------- */
/* Перший екран — canvas: зорі, нескінченна шахова дошка в перспективі, контурні фігури; реагує на курсор і прокручування.
   Шапки сторінок — легка версія (зорі й фігури). Решта — поява блоків під час прокручування, переходи між сторінками,
   малювання ліній графіка. Усе зупиняється, коли не видно; при «зменшити рух» у системі — статично. */
const RM=typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches;
const COSMOS=new Set();
function cosmos(cv,lite){
  const ctx=cv.getContext&&cv.getContext('2d'); if(!ctx) return;
  const host=cv.parentElement;
  const small=innerWidth<680, weak=(navigator.hardwareConcurrency||4)<=4;
  const NS=lite?(small?28:50):(small?70:weak?120:180);
  const stars=Array.from({length:NS},()=>({x:Math.random(),y:Math.random(),z:Math.random(),r:Math.random()*1.3+.35,p:Math.random()*6.283,s:.5+Math.random()*1.8}));
  const GL=['♔','♕','♖','♗','♘','♙'];
  const NP=lite?(small?2:4):(small?4:7);
  const pcs=Array.from({length:NP},(_,i)=>({g:GL[(i*5+1)%6],x:Math.random(),y:lite?.15+Math.random()*.7:.1+Math.random()*.42,z:.25+Math.random()*.75,ph:Math.random()*6.283,sp:.12+Math.random()*.22,vx:(Math.random()-.5)*.006}));
  let W=0,H=0,raf=0,last=performance.now(),cam=0,vis=true,mx=0,my=0,tmx=0,tmy=0,boost=0,shoot=null,alive=true;
  const size=()=>{ const r=host.getBoundingClientRect(), d=Math.min(1.5,devicePixelRatio||1); W=r.width; H=r.height;
    cv.width=Math.round(W*d); cv.height=Math.round(H*d); ctx.setTransform(d,0,0,d,0,0); };
  const draw=(t)=>{
    ctx.clearRect(0,0,W,H);
    const hz=lite?H*1.05:H*(.62+my*.025), f=H-hz;
    /* сяйво горизонту */
    const g=ctx.createRadialGradient(W*(.62+mx*.06),hz,0,W*(.62+mx*.06),hz,Math.max(W,H)*.75);
    g.addColorStop(0,'rgba(201,162,74,'+(lite?.16:.24)+')'); g.addColorStop(.45,'rgba(201,162,74,.05)'); g.addColorStop(1,'rgba(201,162,74,0)');
    ctx.fillStyle=g; ctx.fillRect(0,0,W,H);
    /* зорі */
    for(const s of stars){ const tw=.4+.6*Math.sin(t*s.s+s.p);
      const x=((s.x*W+mx*24*s.z)%W+W)%W, y=s.y*(lite?H:hz*.96)-my*12*s.z;
      ctx.globalAlpha=Math.max(0,tw)*(.3+.7*s.z); ctx.fillStyle=s.z>.72?'#F4EEE2':'#D9B45C';
      ctx.beginPath(); ctx.arc(x,y,s.r*(.55+s.z*.65),0,6.283); ctx.fill(); }
    ctx.globalAlpha=1;
    /* падуча зірка */
    if(!shoot&&Math.random()<(lite?.002:.004)) shoot={x:Math.random()*W*.7+W*.2,y:Math.random()*hz*.4,l:0,v:5+Math.random()*4};
    if(shoot){ shoot.l+=shoot.v; const a=Math.max(0,1-shoot.l/260), x2=shoot.x-shoot.l, y2=shoot.y+shoot.l*.42;
      const lg=ctx.createLinearGradient(x2,y2,x2+70,y2-30); lg.addColorStop(0,'rgba(244,238,226,'+a+')'); lg.addColorStop(1,'rgba(244,238,226,0)');
      ctx.strokeStyle=lg; ctx.lineWidth=1.4; ctx.beginPath(); ctx.moveTo(x2,y2); ctx.lineTo(x2+70,y2-30); ctx.stroke(); if(a<=0) shoot=null; }
    /* нескінченна дошка в перспективі */
    if(!lite&&f>0){
      const rows=small?14:22, cols=small?10:14, sw=W*(small?.3:.2), cx=W*.5-mx*W*.06, fr=cam%1, base=Math.floor(cam);
      for(let i=rows;i>=0;i--){
        const za=i+1-fr, zb=Math.max(.35,i-fr); if(za<=.35) continue;
        const ya=hz+f/za, yb=hz+f/zb, fade=Math.pow(1-Math.min(1,za/rows),1.6);
        for(let c=-cols;c<cols;c++){
          if(((c+i+base)%2+2)%2) continue;
          ctx.fillStyle='rgba(201,162,74,'+(.035+.15*fade)+')';
          ctx.beginPath(); ctx.moveTo(cx+c*sw/za,ya); ctx.lineTo(cx+(c+1)*sw/za,ya); ctx.lineTo(cx+(c+1)*sw/zb,yb); ctx.lineTo(cx+c*sw/zb,yb); ctx.fill();
        }
      }
      /* лінія горизонту */
      const hl=ctx.createLinearGradient(0,hz,W,hz); hl.addColorStop(0,'rgba(201,162,74,0)'); hl.addColorStop(.5,'rgba(217,180,92,.55)'); hl.addColorStop(1,'rgba(201,162,74,0)');
      ctx.fillStyle=hl; ctx.fillRect(0,hz-.5,W,1);
      /* туман над горизонтом */
      const fog=ctx.createLinearGradient(0,hz-2,0,hz+f*.35); fog.addColorStop(0,'rgba(15,46,34,.95)'); fog.addColorStop(1,'rgba(15,46,34,0)');
      ctx.fillStyle=fog; ctx.fillRect(0,hz-2,W,f*.35+2);
      /* знизу дошка тоне в темряві — щоб цифри внизу читалися */
      const bf=ctx.createLinearGradient(0,H*.74,0,H); bf.addColorStop(0,'rgba(15,46,34,0)'); bf.addColorStop(1,'rgba(15,46,34,.78)');
      ctx.fillStyle=bf; ctx.fillRect(0,H*.74,W,H*.26);
    }
    /* контурні фігури, що повільно ширяють */
    ctx.textAlign='center'; ctx.textBaseline='middle';
    for(const p of pcs){
      const bob=Math.sin(t*p.sp*2.2+p.ph)*(lite?6:12), sz=(lite?22:30)+p.z*(lite?26:52)*(small?.75:1);
      const x=((p.x*W+mx*46*p.z)%(W+120)+W+120)%(W+120)-60, y=p.y*(lite?H:hz)+bob-my*24*p.z;
      ctx.save(); ctx.translate(x,y); ctx.rotate(Math.sin(t*.28+p.ph)*.14);
      ctx.font=sz+'px Georgia,"Times New Roman",serif'; ctx.shadowColor='rgba(217,180,92,.55)'; ctx.shadowBlur=14*p.z;
      /* над колонкою тексту — ледь помітно, щоб не заважати читати */
      const over=!lite&&x<W*.58&&y>H*.16&&y<H*.66&&W>760;
      ctx.fillStyle='rgba(217,180,92,'+((.12+.26*p.z)*(over?.3:1))+')'; ctx.fillText(p.g,0,0); ctx.restore();
    }
    /* золотий зоряний пил за курсором */
    for(const s of trail){ const a=Math.max(0,1-s.life/s.max);
      ctx.globalAlpha=a*.35; ctx.fillStyle='#D9B45C'; ctx.beginPath(); ctx.arc(s.x,s.y,s.r*2.6,0,6.283); ctx.fill();
      ctx.globalAlpha=a; ctx.fillStyle=s.w?'#FFF6DE':'#E8C46A'; ctx.beginPath(); ctx.arc(s.x,s.y,s.r,0,6.283); ctx.fill(); }
    ctx.globalAlpha=1;
  };
  const trail=[]; let lastSpawn=0;
  const loop=(now)=>{ raf=0; if(!alive) return;
    const dt=Math.min(.05,(now-last)/1000); last=now;
    mx+=(tmx-mx)*.045; my+=(tmy-my)*.045; boost*=.94; cam+=dt*(.32+boost);
    for(const p of pcs){ p.x+=p.vx*dt; if(p.x>1.1) p.x=-.1; if(p.x<-.1) p.x=1.1; }
    for(let i=trail.length-1;i>=0;i--){ const s=trail[i]; s.life+=dt; s.x+=s.vx*dt; s.y+=s.vy*dt; s.vx*=.96; s.vy=s.vy*.96+18*dt; if(s.life>=s.max) trail.splice(i,1); }
    draw(now/1000); if(vis&&!document.hidden) raf=requestAnimationFrame(loop); };
  const start=()=>{ if(!raf&&vis&&!document.hidden&&alive){ last=performance.now(); raf=requestAnimationFrame(loop); } };
  size();
  if(RM){ draw(2); return; }
  const io=new IntersectionObserver(es=>{ vis=es[0].isIntersecting; start(); }); io.observe(host);
  const onMove=e=>{ const r=host.getBoundingClientRect(); tmx=((e.clientX-r.left)/r.width-.5)*2; tmy=((e.clientY-r.top)/r.height-.5)*2;
    host.style.setProperty('--gx',(e.clientX-r.left)+'px'); host.style.setProperty('--gy',(e.clientY-r.top)+'px');
    const now=performance.now(); if(lite||now-lastSpawn<16) return; lastSpawn=now;
    for(let i=0;i<(small?1:2);i++) if(trail.length<170) trail.push({x:e.clientX-r.left+(Math.random()-.5)*6,y:e.clientY-r.top+(Math.random()-.5)*6,
      vx:(Math.random()-.5)*46,vy:(Math.random()-.5)*46-18,life:0,max:.55+Math.random()*.7,r:.7+Math.random()*1.6,w:Math.random()<.25}); };
  host.addEventListener('pointermove',onMove);
  let sy=scrollY; const onScroll=()=>{ boost=Math.min(2.5,boost+Math.abs(scrollY-sy)*.004); sy=scrollY; };
  addEventListener('scroll',onScroll,{passive:true});
  const onRs=()=>{ size(); if(!raf) draw(performance.now()/1000); }; addEventListener('resize',onRs);
  const onVis=()=>start(); document.addEventListener('visibilitychange',onVis);
  const kill=()=>{ alive=false; if(raf) cancelAnimationFrame(raf); io.disconnect(); removeEventListener('scroll',onScroll); removeEventListener('resize',onRs);
    document.removeEventListener('visibilitychange',onVis); };
  COSMOS.add(kill); start();
}
/* перший екран: справжнє фото Одеси (рішення автора 15.10.2026) — Воронцовський маяк і море, Wikimedia Commons.
   Поверх фото — лише те, що не руйнує реалізм: повільний «вдих» камери, паралакс за курсором, сонячні відблиски
   на хвилях, світлові брижі на воді, кілька чайок. Ліворуч (на телефоні — зверху) фото темніє під текст. */
function heroPhotoScene(cv){
  const ctx=cv.getContext&&cv.getContext('2d'); if(!ctx) return;
  const host=cv.parentElement, small=innerWidth<680, B=HERO_BG;
  let W=0,H=0,D=1,raf=0,last=performance.now(),vis=true,mx=0,my=0,tmx=0,tmy=0,boost=0,clock=0,alive=true,img=null,shown=0;
  const glints=Array.from({length:small?110:240},()=>({x:Math.random(),y:Math.random(),p:Math.random()*6.283,s:1.2+Math.random()*2.6,r:.5+Math.random()*1.3}));
  const gulls=Array.from({length:small?2:4},()=>({x:Math.random(),y:.1+Math.random()*.3,s:.8+Math.random()*.5,v:.008+Math.random()*.01,ph:Math.random()*20}));
  const im=new Image(); im.decoding='async';
  im.onload=()=>{ img=im; if(RM){ shown=1; draw(0); } else start(); };
  im.src=(innerWidth*Math.min(2,devicePixelRatio||1)<1300)?B.srcSmall:B.src;
  /* куди лягає фото: «cover» з точкою фокусу, щоб маяк був праворуч (на телефоні — у кадрі) */
  const rect=()=>{ const iw=img?img.naturalWidth:1000, ih=img?img.naturalHeight:756, kb=RM?0:.5-.5*Math.cos(clock*Math.PI*2/36);
    const z=(small?1.02:1.04)+.025*kb, sc=Math.max(W/iw,H/ih)*z, dw=iw*sc, dh=ih*sc, fx=small?.86:.62, fy=small?.4:.42;
    return {x:(W-dw)*fx+mx*10, y:(H-dh)*fy+my*6, dw, dh}; };
  const size=()=>{ const r=host.getBoundingClientRect(); D=Math.min(1.5,devicePixelRatio||1); W=r.width; H=r.height;
    cv.width=Math.round(W*D); cv.height=Math.round(H*D); ctx.setTransform(D,0,0,D,0,0); };
  const draw=t=>{
    ctx.globalCompositeOperation='source-over'; ctx.globalAlpha=1; ctx.clearRect(0,0,W,H);
    const R=rect(), hz=R.y+B.horizon*R.dh;
    /* поки фото вантажиться — небо й море тими ж кольорами */
    const base=ctx.createLinearGradient(0,0,0,H); base.addColorStop(0,'#8FB7D9'); base.addColorStop(Math.max(.05,Math.min(.95,hz/H)),'#B9CFDF'); base.addColorStop(Math.min(1,hz/H+.02),'#2E5F80'); base.addColorStop(1,'#1F4560');
    ctx.fillStyle=base; ctx.fillRect(0,0,W,H);
    if(img){ ctx.globalAlpha=shown; ctx.drawImage(img,R.x,R.y,R.dw,R.dh); ctx.globalAlpha=1; }
    if(img&&shown>0){
      ctx.globalCompositeOperation='lighter';
      /* світлові брижі, що повільно пливуть по воді */
      for(let i=0;i<6;i++){ const yy=hz+(H-hz)*(.12+.15*i)+Math.sin(t*.55+i*1.7)*4, hh=6+i*4;
        const gx=((t*(14+i*6)*(1+boost))%(W*1.6))-W*.3, gr=ctx.createLinearGradient(gx,0,gx+W*.6,0);
        gr.addColorStop(0,'rgba(255,255,255,0)'); gr.addColorStop(.5,'rgba(220,235,245,'+(.025+.01*i)*shown+')'); gr.addColorStop(1,'rgba(255,255,255,0)');
        ctx.fillStyle=gr; ctx.fillRect(0,yy-hh/2,W,hh); }
      /* сонячні відблиски: короткі спалахи на хвилях */
      for(const g of glints){ const q=Math.pow(g.y,1.35), yy=hz+4+q*(H-hz-4), b=Math.pow(Math.max(0,Math.sin(t*g.s*(1+boost*.6)+g.p)),14);
        if(b<.03) continue; const x=g.x*W+mx*6*(.4+q), r=g.r*(.45+q*.9);
        /* дрібна гостра іскорка з ледь помітним ореолом, витягнута по горизонталі — як сонце на брижах */
        ctx.fillStyle='rgba(255,255,248,'+(b*.22*shown)+')'; ctx.beginPath(); ctx.ellipse(x,yy,r*3.2,r*1.3,0,0,6.283); ctx.fill();
        ctx.fillStyle='rgba(255,255,252,'+(b*.95*shown)+')'; ctx.beginPath(); ctx.ellipse(x,yy,r*1.1,r*.55,0,0,6.283); ctx.fill(); }
      ctx.globalCompositeOperation='source-over';
    }
    /* чайки: махають і планерують */
    ctx.lineCap='round'; ctx.lineJoin='round';
    for(const g of gulls){ const x=((g.x*W+mx*16)%(W+80)+W+80)%(W+80)-40, y=g.y*H+Math.sin(t*.6+g.ph)*8+my*5, sz=(small?7:11)*g.s;
      const cyc=(t+g.ph)%4.2, flap=cyc<1.6?Math.sin(cyc*Math.PI*2.4)*.6:.12+Math.sin(t*1.3+g.ph)*.05;
      ctx.globalAlpha=shown*.95; ctx.lineWidth=1.7; ctx.strokeStyle='#F7F7F4';
      ctx.beginPath(); ctx.moveTo(x-sz,y-sz*flap); ctx.quadraticCurveTo(x-sz*.42,y-sz*.42,x,y); ctx.quadraticCurveTo(x+sz*.42,y-sz*.42,x+sz,y-sz*flap); ctx.stroke();
      ctx.strokeStyle='#3C4650'; ctx.lineWidth=1.5;
      ctx.beginPath(); ctx.moveTo(x-sz,y-sz*flap); ctx.lineTo(x-sz*.78,y-sz*flap*.82-sz*.06); ctx.moveTo(x+sz,y-sz*flap); ctx.lineTo(x+sz*.78,y-sz*flap*.82-sz*.06); ctx.stroke();
      ctx.fillStyle='#F7F7F4'; ctx.beginPath(); ctx.ellipse(x,y+.5,sz*.16,sz*.09,0,0,6.283); ctx.fill(); }
    ctx.globalAlpha=1;
    /* текст на фірмовому зеленому: ліворуч (на телефоні — зверху) фото темніє */
    if(small){ const v=ctx.createLinearGradient(0,0,0,H*.72); v.addColorStop(0,'rgba(10,32,24,.82)'); v.addColorStop(.6,'rgba(10,32,24,.5)'); v.addColorStop(1,'rgba(10,32,24,0)');
      ctx.fillStyle=v; ctx.fillRect(0,0,W,H*.72); }
    else { const v=ctx.createLinearGradient(0,0,W*.72,0); v.addColorStop(0,'rgba(10,32,24,.78)'); v.addColorStop(.55,'rgba(10,32,24,.42)'); v.addColorStop(1,'rgba(10,32,24,0)');
      ctx.fillStyle=v; ctx.fillRect(0,0,W*.72,H); }
    const bf=ctx.createLinearGradient(0,H*.82,0,H); bf.addColorStop(0,'rgba(10,32,24,0)'); bf.addColorStop(1,'rgba(10,32,24,.45)');
    ctx.fillStyle=bf; ctx.fillRect(0,H*.82,W,H*.18);
  };
  const loop=now=>{ raf=0; if(!alive) return;
    const dt=Math.min(.05,(now-last)/1000); last=now; clock+=dt;
    mx+=(tmx-mx)*.04; my+=(tmy-my)*.04; boost*=.94; if(img&&shown<1) shown=Math.min(1,shown+dt*1.4);
    for(const g of gulls){ g.x+=g.v*dt*(1+boost*.4); if(g.x>1.1) g.x=-.1; }
    draw(clock); if(vis&&!document.hidden) raf=requestAnimationFrame(loop); };
  const start=()=>{ if(!raf&&vis&&!document.hidden&&alive&&!RM){ last=performance.now(); raf=requestAnimationFrame(loop); } };
  size(); draw(0);
  if(RM) return;
  const io=new IntersectionObserver(es=>{ vis=es[0].isIntersecting; start(); }); io.observe(host);
  const onMove=e=>{ const r=host.getBoundingClientRect(); tmx=((e.clientX-r.left)/r.width-.5)*2; tmy=((e.clientY-r.top)/r.height-.5)*2;
    host.style.setProperty('--gx',(e.clientX-r.left)+'px'); host.style.setProperty('--gy',(e.clientY-r.top)+'px'); };
  /* фото не рухається за курсором (прохання автора 15.10.2026) — обробник не підключено */
  let sy=scrollY; const onScroll=()=>{ boost=Math.min(2.5,boost+Math.abs(scrollY-sy)*.004); sy=scrollY; };
  addEventListener('scroll',onScroll,{passive:true});
  const onRs=()=>{ size(); if(!raf) draw(clock); }; addEventListener('resize',onRs);
  const onVis=()=>start(); document.addEventListener('visibilitychange',onVis);
  COSMOS.add(()=>{ alive=false; if(raf) cancelAnimationFrame(raf); io.disconnect(); removeEventListener('scroll',onScroll); removeEventListener('resize',onRs);
    document.removeEventListener('visibilitychange',onVis); });
  start();
}
/* літери заголовка з’являються по одній (текст для читачів екрана лишається цілим) */
function splitTitle(h){
  if(h.dataset.split) return; const txt=h.textContent; h.dataset.split='1'; h.setAttribute('aria-label',txt);
  let i=0; h.innerHTML=txt.split(/(\s+)/).map(w=>/^\s+$/.test(w)?w:'<span class="w" aria-hidden="true">'+[...w].map(ch=>
    '<span class="ch" style="--i:'+(i++)+'">'+esc(ch)+'</span>').join('')+'</span>').join('');
}
/* 3D-нахил фото за курсором */
function tilt(el){
  if(!el||el.dataset.tilt) return; el.dataset.tilt='1';
  el.addEventListener('pointermove',e=>{ const r=el.getBoundingClientRect(), x=(e.clientX-r.left)/r.width-.5, y=(e.clientY-r.top)/r.height-.5;
    el.style.setProperty('--rx',(-y*9).toFixed(2)+'deg'); el.style.setProperty('--ry',(x*11).toFixed(2)+'deg');
    el.style.setProperty('--sx',((x+.5)*100).toFixed(1)+'%'); el.classList.add('tilting'); });
  el.addEventListener('pointerleave',()=>{ el.style.setProperty('--rx','0deg'); el.style.setProperty('--ry','0deg'); el.classList.remove('tilting'); });
}
/* поява блоків під час прокручування */
let RIO=null;
function reveal(){
  if(RM||!('IntersectionObserver' in window)) return;
  if(!RIO) RIO=new IntersectionObserver(es=>es.forEach(e=>{ if(!e.isIntersecting) return; const el=e.target;
    el.classList.add('in'); RIO.unobserve(el);
    /* після появи прибираємо службові класи — наведення знову реагує миттєво */
    setTimeout(()=>el.classList.remove('rv','in'),950+(parseInt(el.style.getPropertyValue('--d'))||0)); }),{rootMargin:'0px 0px -6% 0px',threshold:.06});
  const sel='#app .sec-head, #app .card, #app .tbl-wrap, #app .rc, #app .ach>div, #app .titles a, #app .chart, #app .gal button, #app .scans figure, '+
    '#app .plist>a:nth-child(-n+40), #app .info, #app .article>p, #app .article>h3, #app .tabs, #app .hstats a, #app .ptools, #app .chips, #app .empty, '+
    '#app table.ctbl tbody tr';
  const seen=new Map();
  $$(sel).forEach(el=>{ if(el.closest('.ed')||el.closest('.edbar')) return;
    const k=el.parentElement; const n=seen.get(k)||0; seen.set(k,n+1);
    el.classList.add('rv'); el.style.setProperty('--d',Math.min(n,8)*55+'ms'); RIO.observe(el); });
}
/* лінії графіка рейтингу «малюються» */
function drawCharts(){
  $$('#app .chart svg path').forEach(p=>{ p.setAttribute('pathLength','1'); p.classList.add('drawn'); });
  $$('#app .chart').forEach(c=>c.classList.add('anim'));
}
function motion(r){
  NAVPREV=r;
  COSMOS.forEach(k=>k()); COSMOS.clear();
  if(typeof requestAnimationFrame!=='function'||typeof IntersectionObserver!=='function') return;
  const hero=$('#app .hero'); if(hero){ const cv=hero.querySelector('canvas.cosmos'); if(cv) heroPhotoScene(cv);
    const h1=hero.querySelector('h1.split'); if(h1&&!RM) splitTitle(h1); tilt(hero.querySelector('.hero-ph')); }
  $$('#app .page-head').forEach(ph=>{ if(r.route==='editor') return; let cv=ph.querySelector('canvas.cosmos');
    if(!cv){ cv=document.createElement('canvas'); cv.className='cosmos'; cv.setAttribute('aria-hidden','true'); ph.prepend(cv); ph.classList.add('has-cosmos'); }
    cosmos(cv,true); });
  if(RM) return;
  reveal(); drawCharts(); bindSparks();
  const y=()=>{ if(hero) hero.style.setProperty('--sy',Math.min(scrollY,800)); };
  if(hero&&!RM){ y(); addEventListener('scroll',y,{passive:true}); COSMOS.add(()=>removeEventListener('scroll',y)); }
}
/* іскри з корон чемпіонів під курсором */
function sparks(el){
  const now=performance.now(); if(+el.dataset.sp>now-700) return; el.dataset.sp=now;
  const r=el.getBoundingClientRect(), b=document.createElement('div'); b.className='sparks'; b.setAttribute('aria-hidden','true');
  b.style.left=(r.left+(el.tagName==='B'?9:r.width/2))+'px'; b.style.top=(r.top+r.height/2)+'px';
  for(let i=0;i<12;i++){ const s=document.createElement('i'), a=Math.random()*6.283, d=18+Math.random()*26;
    s.style.setProperty('--dx',(Math.cos(a)*d).toFixed(1)+'px'); s.style.setProperty('--dy',(Math.sin(a)*d-8).toFixed(1)+'px');
    s.style.animationDelay=(Math.random()*80)+'ms'; b.appendChild(s); }
  document.body.appendChild(b); setTimeout(()=>b.remove(),900);
}
function bindSparks(){ $$('#app table.ctbl .cr, #app .yrow b, #app .titles .cr').forEach(el=>el.addEventListener('pointerenter',()=>sparks(el))); }
/* перехід «шахова дошка»: клітинки хвилею накривають екран і відкривають нову сторінку; редактор — без переходів */
let WAVE=null, WBUSY=false, WPEND=false;
function waveGrid(){
  const cell=innerWidth<680?64:96, cols=Math.ceil(innerWidth/cell), rows=Math.ceil(innerHeight/cell);
  if(!WAVE){ WAVE=document.createElement('div'); WAVE.className='wave'; WAVE.setAttribute('aria-hidden','true'); document.body.appendChild(WAVE); }
  if(WAVE.dataset.sz!==cols+'x'+rows){ WAVE.dataset.sz=cols+'x'+rows;
    WAVE.style.gridTemplateColumns='repeat('+cols+',1fr)'; WAVE.style.gridTemplateRows='repeat('+rows+',1fr)';
    let h=''; const span=cols+rows-2||1;
    for(let r=0;r<rows;r++) for(let c=0;c<cols;c++) h+='<i class="'+((r+c)%2?'d':'l')+'" style="--f:'+((r+c)/span).toFixed(3)+'"></i>';
    WAVE.innerHTML=h+'<b>♔</b>'; }
}
let NAVPREV=null; /* останній показаний маршрут (ставить motion) */
function navRender(){
  const cur=parseHash(), prev=NAVPREV||{route:'',id:null,q:{}}, to=cur.route;
  /* хвиля — лише між розділами, сторінками матеріалів і вкладками «Турнірів»; фільтри, сортування, роки — без неї */
  const big=prev.route!==to||(prev.id||'')!==(cur.id||'')||(to==='tournaments'&&(prev.q.tab||'')!==(cur.q.tab||''));
  if(!big||RM||to==='editor'||(typeof ED!=='undefined'&&ED.on)||typeof requestAnimationFrame!=='function'){ render(); return; }
  if(WBUSY){ WPEND=true; return; }
  /* ~3 с (прохання автора): 1 с клітинки накривають, 0,9 с дошка тримається (відблиск, корона), 1 с відкривають.
     Клік по дошці — пропустити. */
  const CELL=260, SPREAD=240, HOLD=500, FAST=300; /* разом ≈1,5 с (прохання автора 15.10.2026) */
  WBUSY=true; waveGrid();
  let rendered=false, timers=[];
  const later=(fn,ms)=>timers.push(setTimeout(fn,ms));
  const done=()=>{ WAVE.className='wave'; WAVE.onclick=null; WBUSY=false; if(WPEND){ WPEND=false; render(); } };
  const open=fast=>{ WAVE.className='wave reveal'+(fast?' fast':''); later(done,fast?FAST:CELL+SPREAD); };
  WAVE.className='wave cover';
  later(()=>{ rendered=true; render(); WAVE.className='wave hold'; later(()=>open(false),HOLD); },CELL+SPREAD);
  WAVE.onclick=()=>{ timers.forEach(clearTimeout); timers=[]; if(!rendered){ rendered=true; render(); } open(true); };
}
/* сузір'я «Кінь» у підвалі: зорі складаються в шахового коня, лінії спалахують по черзі */
const KNIGHT=[[.22,.96],[.82,.96],[.80,.86],[.70,.82],[.74,.62],[.80,.44],[.74,.26],[.62,.14],[.58,.04],[.52,.14],[.40,.18],
  [.24,.34],[.16,.46],[.22,.52],[.36,.50],[.46,.44],[.40,.60],[.32,.80],[.30,.86],[.22,.96]];
function footerSky(){
  const ft=document.querySelector('footer'); if(!ft||ft.querySelector('canvas.sky')) return;
  const cv=document.createElement('canvas'); cv.className='sky'; cv.setAttribute('aria-hidden','true'); ft.prepend(cv); ft.classList.add('has-sky');
  const ctx=cv.getContext&&cv.getContext('2d'); if(!ctx) return;
  let W=0,H=0,raf=0,vis=false,t0=performance.now();
  const st=Array.from({length:46},()=>({x:Math.random(),y:Math.random(),r:Math.random()*1.1+.3,p:Math.random()*6.283,s:.6+Math.random()*1.5}));
  const seg=[]; let total=0; for(let i=1;i<KNIGHT.length;i++){ const a=KNIGHT[i-1],b=KNIGHT[i],l=Math.hypot(b[0]-a[0],b[1]-a[1]); seg.push({a,b,l,from:total}); total+=l; }
  const size=()=>{ const r=ft.getBoundingClientRect(), d=Math.min(1.5,devicePixelRatio||1); W=r.width; H=r.height;
    cv.width=Math.round(W*d); cv.height=Math.round(H*d); ctx.setTransform(d,0,0,d,0,0); };
  const draw=(t)=>{
    ctx.clearRect(0,0,W,H);
    for(const s of st){ ctx.globalAlpha=(.25+.45*(.5+.5*Math.sin(t*s.s+s.p))); ctx.fillStyle='#E9DDBE'; ctx.beginPath(); ctx.arc(s.x*W,s.y*H,s.r,0,6.283); ctx.fill(); }
    const small=W<680, S=small?Math.min(W*.5,H*.36):Math.min(H*.82,W*.26), ox=W-S-(small?14:W*.05), oy=small?H-S-46:(H-S)/2;
    const P=([x,y])=>[ox+x*S,oy+y*S];
    const cyc=13, k=(t%cyc)/cyc, drawn=RM?1:Math.min(1,k/.35), fade=RM?1:(k>.8?1-(k-.8)/.2*.7:1);
    /* лінії: малюються по черзі, тримаються, згасають до напівпрозорих */
    ctx.lineWidth=1.2; ctx.lineCap='round';
    for(const sg of seg){ const [x1,y1]=P(sg.a),[x2,y2]=P(sg.b);
      ctx.globalAlpha=.16; ctx.strokeStyle='#D9B45C'; ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke();
      const u=Math.max(0,Math.min(1,(drawn*total-sg.from)/sg.l)); if(u<=0) continue;
      ctx.globalAlpha=.75*fade; ctx.strokeStyle='#E2C06C'; ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x1+(x2-x1)*u,y1+(y2-y1)*u); ctx.stroke(); }
    /* вогник, що біжить контуром */
    if(!RM&&k>.35&&k<.8){ const d=((k-.35)/.45)*total, sg=seg.find(s=>d>=s.from&&d<=s.from+s.l)||seg[seg.length-1], u=(d-sg.from)/sg.l;
      const [x1,y1]=P(sg.a),[x2,y2]=P(sg.b), x=x1+(x2-x1)*u, y=y1+(y2-y1)*u;
      const g=ctx.createRadialGradient(x,y,0,x,y,14); g.addColorStop(0,'rgba(255,240,200,.95)'); g.addColorStop(1,'rgba(255,240,200,0)');
      ctx.globalAlpha=1; ctx.fillStyle=g; ctx.beginPath(); ctx.arc(x,y,14,0,6.283); ctx.fill(); }
    /* зорі сузір'я */
    KNIGHT.slice(0,-1).forEach((pt,i)=>{ const [x,y]=P(pt), tw=.6+.4*Math.sin(t*1.7+i);
      ctx.globalAlpha=.9*tw; ctx.fillStyle='#FFF4D6'; ctx.beginPath(); ctx.arc(x,y,i===8?2.4:1.7,0,6.283); ctx.fill();
      ctx.globalAlpha=.25*tw; ctx.fillStyle='#E2C06C'; ctx.beginPath(); ctx.arc(x,y,5,0,6.283); ctx.fill(); });
    const [ex,ey]=P([.42,.28]); ctx.globalAlpha=.95; ctx.fillStyle='#FFF4D6'; ctx.beginPath(); ctx.arc(ex,ey,2,0,6.283); ctx.fill(); /* око */
    ctx.globalAlpha=1;
  };
  const loop=now=>{ raf=0; draw((now-t0)/1000); if(vis&&!document.hidden) raf=requestAnimationFrame(loop); };
  const start=()=>{ if(!raf&&vis&&!document.hidden) raf=requestAnimationFrame(loop); };
  size(); draw(0); addEventListener('resize',()=>{ size(); draw((performance.now()-t0)/1000); });
  if(RM||typeof IntersectionObserver!=='function') return;
  new IntersectionObserver(es=>{ vis=es[0].isIntersecting; start(); }).observe(ft);
  document.addEventListener('visibilitychange',start);
}
/* інтро при першому відкритті (раз за візит): золоті частинки збираються в корону й розлітаються зорями */
function introOnce(){
  let seen=null; try{ seen=sessionStorage.getItem('so-intro'); sessionStorage.setItem('so-intro','1'); }catch(e){ seen='1'; }
  if(seen||RM||parseHash().route==='editor'||typeof requestAnimationFrame!=='function') return;
  const ov=document.createElement('div'); ov.id='intro'; ov.setAttribute('aria-hidden','true');
  const cv=document.createElement('canvas'); ov.appendChild(cv); document.body.appendChild(ov); document.body.classList.add('intro-wait');
  const ctx=cv.getContext('2d'); if(!ctx){ ov.remove(); document.body.classList.remove('intro-wait'); return; }
  const d=Math.min(1.5,devicePixelRatio||1), W=innerWidth, H=innerHeight; cv.width=W*d; cv.height=H*d; ctx.setTransform(d,0,0,d,0,0);
  /* точки корони — з гліфа ♚ на прихованому полотні */
  const oc=document.createElement('canvas'), N=200; oc.width=N; oc.height=N; const o=oc.getContext('2d');
  o.fillStyle='#000'; o.textAlign='center'; o.textBaseline='middle'; o.font='170px Georgia,"Segoe UI Symbol","Noto Sans Symbols2",serif'; o.fillText('♚',N/2,N/2+8);
  const px=o.getImageData(0,0,N,N).data, pts=[];
  for(let y=0;y<N;y+=3) for(let x=0;x<N;x+=3) if(px[(y*N+x)*4+3]>128) pts.push([x-N/2,y-N/2]);
  const cnt=Math.min(pts.length,W<680?320:560), sc=Math.min(W,H)/N*.42, cx=W/2, cy=H/2-H*.06;
  const P=Array.from({length:cnt},()=>{ const t=pts[(Math.random()*pts.length)|0], a=Math.random()*6.283, R=Math.max(W,H)*(.55+Math.random()*.4);
    return {sx:cx+Math.cos(a)*R,sy:cy+Math.sin(a)*R,tx:cx+t[0]*sc,ty:cy+t[1]*sc,dl:Math.random()*.35,r:.8+Math.random()*1.5,vx:0,vy:0,x:0,y:0}; });
  const ease=u=>1-Math.pow(1-u,3); let t0=performance.now(), done=false, burst=false;
  const finish=()=>{ if(done) return; done=true; ov.classList.add('out'); document.body.classList.remove('intro-wait'); setTimeout(()=>ov.remove(),450); };
  const doBurst=()=>{ if(burst) return; burst=true; P.forEach(p=>{ const dx=p.x-cx, dy=p.y-cy, l=Math.hypot(dx,dy)||1, v=380+Math.random()*520; p.vx=dx/l*v; p.vy=dy/l*v; }); };
  ov.addEventListener('click',()=>{ doBurst(); setTimeout(finish,250); });
  addEventListener('keydown',function k(){ removeEventListener('keydown',k); doBurst(); setTimeout(finish,250); });
  let last=t0;
  const frame=now=>{ const t=(now-t0)/1000, dt=Math.min(.05,(now-last)/1000); last=now;
    ctx.clearRect(0,0,W,H); ctx.fillStyle='#0F2E22'; ctx.fillRect(0,0,W,H);
    if(t>1.25) doBurst();
    for(const p of P){
      if(!burst){ const u=ease(Math.max(0,Math.min(1,(t-p.dl)/.85))); p.x=p.sx+(p.tx-p.sx)*u; p.y=p.sy+(p.ty-p.sy)*u; }
      else { p.x+=p.vx*dt; p.y+=p.vy*dt; p.vx*=.985; p.vy*=.985; }
      const a=burst?Math.max(0,1-(t-1.25)/.55):Math.min(1,t*2);
      ctx.globalAlpha=a*.3; ctx.fillStyle='#D9B45C'; ctx.beginPath(); ctx.arc(p.x,p.y,p.r*2.8,0,6.283); ctx.fill();
      ctx.globalAlpha=a; ctx.fillStyle='#FFF1CF'; ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,6.283); ctx.fill(); }
    /* назва під короною */
    const wa=t<.6?0:burst?Math.max(0,1-(t-1.25)/.3):Math.min(1,(t-.6)/.4);
    if(wa>0){ ctx.globalAlpha=wa; ctx.fillStyle='#F4EEE2'; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.font='700 '+Math.round(Math.min(W*.075,46))+'px "Playfair Display",Georgia,serif'; ctx.fillText('Шахова Одеса',cx,cy+N/2*sc+Math.min(H*.07,48)); }
    ctx.globalAlpha=1;
    if(t>1.45) finish();
    if(t<2.2) requestAnimationFrame(frame); };
  requestAnimationFrame(frame);
  setTimeout(finish,3200); /* запобіжник */
}
/* друк і збереження в PDF — усе видно одразу, без анімацій */
addEventListener('beforeprint',()=>$$('.rv').forEach(el=>el.classList.remove('rv','in')));
