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
