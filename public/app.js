(function(){
"use strict";
const $=id=>document.getElementById(id);
const RM=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
const NS='http://www.w3.org/2000/svg';
const wait=ms=>new Promise(r=>setTimeout(r,ms));
function timers(){let t=[];return{q(ms,f){t.push(setTimeout(f,ms))},clear(){t.forEach(clearTimeout);t=[]}}}
const S={}; // stop id -> {play, show, hide}

/* ---------------- index bar ---------------- */
const hops=[...document.querySelectorAll('#idx .hop')];
const stops=[...document.querySelectorAll('[data-stop]')];
const idxBox=$('idx'),mbar=$('mbar'),mlist=$('mlist');
hops.forEach((h,i)=>{const a=document.createElement('a');a.href=h.getAttribute('href');
  a.innerHTML=`<span class="n">${String(i+1).padStart(2,'0')}</span>${h.querySelector('svg').outerHTML}<span>${h.textContent.trim()}</span>`;
  a.addEventListener('click',()=>toggleList(false));mlist.appendChild(a)});
const mitems=[...mlist.children];
function toggleList(open){mlist.hidden=!open;mbar.setAttribute('aria-expanded',String(open))}
mbar.addEventListener('click',()=>toggleList(mlist.hidden));
document.addEventListener('keydown',e=>{if(e.key==='Escape')toggleList(false)});
const idxNav=document.querySelector('.idx');let peekT;
function peek(){if(!idxNav||matchMedia('(max-width:959px)').matches)return;idxNav.classList.add('peek');clearTimeout(peekT);peekT=setTimeout(()=>idxNav.classList.remove('peek'),1400)}
let lastI=-1;
function setActive(i){hops.forEach((h,j)=>{h.classList.toggle('on',j===i);h.classList.toggle('done',j<i)});
  if(typeof ride==='function')ride(i);
  mitems.forEach((a,j)=>{a.classList.toggle('on',j===i);a.classList.toggle('done',j<i)});
  {const hh=hops[i];if(hh&&hh.offsetParent)idxBox.style.setProperty('--px',(hh.offsetLeft+hh.offsetWidth/2)+'px');const tc=$('tcnt');if(tc)tc.textContent=(i+1)+' / '+hops.length;const ph=hops[i].closest('.ph');document.querySelectorAll('#idx .ph').forEach(x=>{x.classList.toggle('on',x===ph);x.querySelector('.grp').classList.toggle('on',x===ph)});document.querySelectorAll('#idx .ln,#idx .pl').forEach(l=>{const n=l.nextElementSibling,h=n&&(n.classList.contains('hop')?n:n.querySelector('.hop'));l.classList.toggle('done',hops.indexOf(h)<=i)})}
  $('mcur').innerHTML='<span class="mn">'+(i+1)+' / '+hops.length+'</span><span class="mt"> · '+hops[i].textContent.trim()+'</span>';$('mprog').style.width=((i+1)/hops.length*100)+'%';
}
const navObs=new IntersectionObserver(es=>{es.forEach(e=>{if(e.isIntersecting)setActive(stops.indexOf(e.target))})},{rootMargin:'-45% 0px -50% 0px'});
stops.forEach(s=>navObs.observe(s));
document.addEventListener('keydown',e=>{if(e.target.closest&&e.target.closest('input,textarea'))return;
  if(e.key!=='ArrowRight'&&e.key!=='ArrowLeft')return;const cur=hops.findIndex(h=>h.classList.contains('on'));
  const n=Math.max(0,Math.min(hops.length-1,cur+(e.key==='ArrowRight'?1:-1)));if(n!==cur){e.preventDefault();stops[n].scrollIntoView({behavior:RM?'auto':'smooth'})}});


/* packet riding the rail: it sits on the current hop */
const pkt=$('pkt'),idxEl=document.querySelector('.idx');
function railGeom(){const f=hops[0].querySelector('.bar').getBoundingClientRect(),l=hops[hops.length-1].querySelector('.bar').getBoundingClientRect();
  idxEl.style.setProperty('--rt',(f.top+f.height/2)+'px');idxEl.style.setProperty('--rh',(l.top-f.top)+'px')}
function ride(i){const r=hops[i].querySelector('.bar').getBoundingClientRect();if(pkt)pkt.style.top=(r.top+r.height/2-5)+'px'}
addEventListener('resize',()=>{railGeom();ride(Math.max(0,hops.findIndex(h=>h.classList.contains('on'))))});setTimeout(()=>{railGeom();ride(0)},100);
setActive(0);
document.fonts&&document.fonts.ready.then(()=>{railGeom();ride(Math.max(0,hops.findIndex(h=>h.classList.contains('on'))))});

/* ---------------- play on first view, ambient while visible ---------------- */
const played=new Set(),settle={},onScreen={};
/* a slide counts as arrived when it covers most of the viewport for a moment; passing through never triggers it */
const GA=(n,p)=>{try{if(window.gtag)gtag('event',n,p)}catch(e){}};const seen={};
function arrived(id){seen[id]=performance.now();GA('slide_view',{slide_id:id,slide_number:stops.findIndex(x=>x.id===id)+1});const s=S[id];if(!s)return;onScreen[id]=true;if(s.show)s.show();if(s.play&&!played.has(id)&&!RM){played.add(id);s.play()}}
function left(id){if(seen[id]){GA('slide_time',{slide_id:id,seconds:Math.round((performance.now()-seen[id])/1000)});delete seen[id]}const s=S[id];clearTimeout(settle[id]);settle[id]=null;if(onScreen[id]&&s&&s.hide)s.hide();onScreen[id]=false}
const playObs=new IntersectionObserver(es=>{es.forEach(e=>{const id=e.target.id;
  const cover=e.intersectionRect.height/innerHeight;
  if(e.isIntersecting&&cover>=0.6){if(!settle[id]&&!onScreen[id])settle[id]=setTimeout(()=>{settle[id]=null;arrived(id)},450)}
  else if(cover<0.25)left(id);
  else{clearTimeout(settle[id]);settle[id]=null}})},{threshold:[0,.1,.25,.4,.5,.6,.7,.8,.9,1]});
addEventListener('pagehide',()=>{Object.keys(seen).forEach(id=>GA('slide_time',{slide_id:id,seconds:Math.round((performance.now()-seen[id])/1000),transport_type:'beacon'}))});
document.addEventListener('click',e=>{const a=e.target.closest('a[href^="http"],a[href^="mailto"]');if(a)GA('link_click',{link_url:a.href,link_text:(a.textContent||'').trim().slice(0,60),slide_id:(a.closest('[data-stop]')||{}).id||'footer'})},true);
document.addEventListener('click',e=>{const b=e.target.closest('[data-replay]');if(b&&S[b.dataset.replay]&&S[b.dataset.replay].play)S[b.dataset.replay].play()});

/* ---------------- quiet progress bar in each animated scene ---------------- */
const PB={get(id){const sc=document.querySelector('#'+CSS.escape(id)+' .scene');if(!sc)return null;let b=sc.querySelector(':scope>.pbar>b');
    if(!b){const i=document.createElement('i');i.className='pbar';i.setAttribute('aria-hidden','true');b=document.createElement('b');i.appendChild(b);sc.appendChild(i)}return b},
  run(id,ms){const b=PB.get(id);if(!b)return;b.style.transition='none';b.style.width='0';void b.offsetWidth;b.style.transition=`width ${ms}ms linear`;b.style.width='100%'},
  set(id,f){const b=PB.get(id);if(!b)return;b.style.transition='width .4s ease';b.style.width=(Math.max(0,Math.min(1,f))*100).toFixed(1)+'%'}};

/* ---------------- 1 · sign in ---------------- */
$('sigo').addEventListener('click',()=>{const b=$('sigo');b.innerHTML='<span class="spin"></span>Signing in';
  setTimeout(()=>{$('siform').hidden=true;$('sipush').hidden=false;const p=$('sipi');p.classList.remove('bz');void p.offsetWidth;p.classList.add('bz');
    setTimeout(()=>{$('auth').scrollIntoView({behavior:RM?'auto':'smooth'});setTimeout(()=>{$('siform').hidden=false;$('sipush').hidden=true;b.textContent='Sign in'},1500)},1500)},1000)});

/* ---------------- 2 · auth ---------------- */
(function(){const scr=$('ascr'),yes=$('ayes');
  function approve(){if(scr.classList.contains('ok'))return;yes.classList.add('press');setTimeout(()=>{yes.classList.remove('press');scr.classList.add('ok');PB.set('auth',1)},180)}
  if(!RM)scr.classList.remove('ok');
  let goT=null;function tapped(){const was=scr.classList.contains('ok');approve();if(!was){clearTimeout(goT);goT=setTimeout(()=>{const n=$('security');if(n)n.scrollIntoView({behavior:RM?'auto':'smooth'})},1100)}}
  yes.addEventListener('click',tapped);yes.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();tapped()}});
  S.auth={play(){scr.classList.remove('ok');PB.set('auth',.15)},hide(){approve()}};})();

/* ---------------- security: a probe every few seconds, blocked ---------------- */
(function(){const pr=$('probe');if(!pr)return;const P=[0,1,2].map(i=>$('ap'+i)),Df=[0,1,2].map(i=>$('df'+i));let k=0,iv=null,raf=null;
  function probe(){const path=P[k],df=Df[k],L=path.getTotalLength(),stop=L*.5-20,t0=performance.now(),dur=1600;cancelAnimationFrame(raf);
    (function f(t){const p=Math.min(1,(t-t0)/dur),e=p<.8?p/.8:1,pt=path.getPointAtLength(stop*e);pr.setAttribute('cx',pt.x);pr.setAttribute('cy',pt.y);
      pr.setAttribute('opacity',p<.1?p*6:p<.8?.6:Math.max(0,.6-(p-.8)*3));if(p>=.8&&!df.classList.contains('hit')){df.classList.add('hit');setTimeout(()=>df.classList.remove('hit'),900)}
      if(p<1)raf=requestAnimationFrame(f)})(t0);k=(k+1)%3}
  S.security={show(){if(iv||RM)return;setTimeout(probe,600);iv=setInterval(probe,7000)},hide(){clearInterval(iv);iv=null;cancelAnimationFrame(raf);pr.setAttribute('opacity',0)}};})();

/* ---------------- 3 · experiments ---------------- */
/* experiments: static result */

/* ---------------- 4 · global traffic ---------------- */
(function(){if(!window.d3||!window.topojson||!window.LAND110)return;
  const svg=d3.select('#tmap'),W=680,H=340,g=svg.append('g');
  const proj=d3.geoNaturalEarth1().fitExtent([[6,6],[W-6,H-6]],{type:'Sphere'}),path=d3.geoPath(proj);
  g.append('path').datum(topojson.feature(LAND110,LAND110.objects.land)).attr('d',path).attr('fill','#E9EDF3').attr('stroke','#C9D0DA').attr('stroke-width',0.6);
  const C=[[-74,40.7],[-118,34],[-87.6,41.9],[-122.4,37.8],[-79.4,43.7],[-123.1,49.3],[-99.1,19.4],[-46.6,-23.5],[-58.4,-34.6],[-77,-12],[-74.1,4.7],[-70.6,-33.4],[-0.1,51.5],[2.35,48.9],[13.4,52.5],[4.9,52.4],[-3.7,40.4],[12.5,41.9],[18.1,59.3],[21,52.2],[37.6,55.8],[28.9,41],[31.2,30],[3.4,6.5],[36.8,-1.3],[28,-26.2],[18.4,-33.9],[55.3,25.2],[46.7,24.7],[51.4,35.7],[67,24.9],[72.9,19.1],[77.2,28.6],[77.6,13],[80.3,13.1],[88.4,22.6],[90.4,23.8],[85.3,27.7],[100.5,13.8],[106.7,10.8],[105.8,21],[101.7,3.1],[106.8,-6.2],[121,14.6],[114.2,22.3],[121.5,25],[121.5,31.2],[116.4,39.9],[127,37.6],[139.7,35.7],[135.5,34.7],[151.2,-33.9],[144.9,-37.8],[153,-27.5],[115.9,-32],[174.8,-36.8],[-157.9,21.3],[-149.9,61.2],[-21.9,64.1],[10.7,59.9],[24.9,60.2],[30.5,50.4],[44.5,40.2],[69.3,41.3],[-66.9,10.5],[-90.5,14.6],[-82.4,23.1],[-17.4,14.7],[7.5,9.1],[32.6,0.3],[38.7,9],[47.5,-18.9],[-6.8,34],[10.2,36.8],[35.2,31.8],[-43.2,-22.9],[-38.5,-12.9],[-60,-3.1]].sort((a,b)=>a[0]-b[0]);
  const dots=g.append('g'),red=g.append('g');
  const D=C.map(c=>{const[x,y]=proj(c);const d=dots.append('g').attr('transform',`translate(${x},${y})`);
    d.append('circle').attr('class','ring').attr('r',2).attr('fill','none').attr('stroke','#16946C').attr('opacity',0);
    d.append('circle').attr('r',2.6).attr('fill','#16946C');return d});
  const[mx,my]=proj([-122.03,37.37]),[sx,sy]=[mx,my];const T=timers();
  const me=g.append('circle').attr('id','tme').attr('cx',mx).attr('cy',my).attr('r',4.5).attr('fill','#9A2547').attr('stroke','#fff').attr('stroke-width',1.5);
  g.append('circle').attr('id','tsg').attr('cx',sx).attr('cy',sy).attr('r',1).attr('fill','none');
  const map=document.getElementById('tmap');map.dataset.state='ok';let pulseT=null,rpsT=null;
  function pulse(){dots.selectAll('.ring').each(function(){if(Math.random()<0.15)d3.select(this).attr('r',2).attr('opacity',.9).transition().duration(1400).attr('r',10).attr('opacity',0)})}
  function lab(t,c){const l=$('tlab');l.textContent=t;l.style.color=c}
  let looped=false;
  const stg=[...document.querySelectorAll('#dpl span')],dst=$('dplst');
  function stage(k){stg.forEach((x,j)=>x.className=j<k?'done':j===k?'on':'')}
  const order=D.map((_,i)=>i).sort(()=>Math.random()-.5);let lit=0;
  function lightTo(n){for(;lit<n;lit++){const d=D[order[lit]];d.transition().duration(250).attr('opacity',1)}}
  function cycle(first){T.clear();clearInterval(rpsT);red.selectAll('*').remove();$('talert').classList.add('hide');map.dataset.state='ok';me.interrupt().attr('opacity',1);dots.interrupt().attr('opacity',1);
    lab("deploying · today's release",'#2F6DB3');dst.textContent='';stage(-1);
    if(first){D.forEach(d=>d.attr('opacity',0));lit=0}
    T.q(150,()=>stage(0));T.q(550,()=>stage(1));
    T.q(950,()=>{stage(2);if(first)lightTo(Math.max(2,Math.round(D.length*.04)))});
    T.q(1650,()=>{stage(3);if(first)lightTo(Math.round(D.length*.25))});
    T.q(2350,()=>{stage(4);if(first)lightTo(D.length)});
    T.q(3000,()=>{stage(5);lab('live traffic · nearly every country','#0E7553')});
    const t1=4000;PB.run('traffic',t1+7600);
    T.q(t1,()=>{lab('error rate rising · us-west-1','#C2302F');map.dataset.state='bad';me.transition().duration(300).attr('opacity',0);
      for(let i=0;i<9;i++){const a=Math.random()*6.28,r=Math.random()*5,p=red.append('g').attr('transform',`translate(${sx+r*Math.cos(a)},${sy+r*Math.sin(a)})`);
        p.append('circle').attr('r',0).attr('fill','#E24B4A').transition().delay(i*80).duration(250).attr('r',2.6);
        const rg=p.append('circle').attr('r',2).attr('fill','none').attr('stroke','#E24B4A');(function loop(){rg.attr('r',2).attr('opacity',.9).transition().duration(1000).attr('r',12).attr('opacity',0).on('end',loop)})()}});
    T.q(t1+900,()=>{const k=5;dots.transition().duration(1000).attr('opacity',.35);g.transition().duration(1200).ease(d3.easeCubicInOut).attr('transform',`translate(${W/2-k*sx},${H/2-k*sy}) scale(${k})`)});
    T.q(t1+2100,()=>$('talert').classList.remove('hide'));
    T.q(t1+4200,()=>{dst.textContent='rolling back…'});
    T.q(t1+5600,()=>{$('talert').classList.add('hide');red.selectAll('*').interrupt().remove();map.dataset.state='ok';me.attr('opacity',1);lab('rolled back · error rate normal','#0E7553');dst.textContent='rolled back';
      dots.transition().duration(800).attr('opacity',1);g.transition().duration(1000).ease(d3.easeCubicInOut).attr('transform','translate(0,0) scale(1)')});
    T.q(t1+7600,()=>{if(onScreen.traffic&&!RM)cycle(false)})}
  S.traffic={
    show(){if(!pulseT)pulseT=setInterval(pulse,300);if(looped&&!RM)cycle(false)},
    hide(){clearInterval(pulseT);pulseT=null;T.clear()},
    play(){looped=true;g.interrupt().attr('transform',null);cycle(true)}};})();

/* ---------------- 5 · on-call ---------------- */
(function(){const T=timers(),items=[...document.querySelectorAll('#ochat .m, #ochat .dv')],st=$('ost');
  const gaps=[500,900,1700,900,1050,1250,1000,900,700,1050,1050];
  function state(t,bg,c){st.textContent=t;st.style.background=bg;st.style.color=c}
  S.oncall={play(){T.clear();items.forEach(e=>e.classList.add('wait'));state('open','var(--bad-deep)','var(--bad-soft)');
    const box=$('ochat');box.scrollTop=0;
    let t=400;items.forEach((el,i)=>{t+=gaps[i]||1300});PB.run('oncall',t);t=400;items.forEach((el,i)=>{t+=gaps[i]||1300;T.q(t,()=>{el.classList.remove('wait');box.scrollTop=box.scrollHeight;
      if(i===5)state('mitigated','#FCEFD9','var(--warn)');if(i===items.length-1)state('closed','var(--ok-deep)','var(--ok)')})})}};})();

/* ---------------- 6 · observability ---------------- */
(function(){const N=48,T=timers();let fail=false,a=null;
  const mk=(i,gen)=>{const el=$('op'+i);return{el,s:el.querySelector('.s'),v:$('ov'+i),ln:el.querySelector('.ln'),ar:el.querySelector('.ar'),er:el.querySelector('.er'),gen,d:[],e:[]}};
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  let cpu=46,rq=.78,lat=.21;
  const P=[mk(0,()=>{cpu=clamp(cpu+(Math.random()-.5)*7+(fail?2.2:(46-cpu)*.12),18,92);return[cpu/100]}),
           mk(1,()=>{rq=clamp(rq+(Math.random()-.5)*.06+(.78-rq)*.15,.55,.95);return[rq,fail?clamp(.32+Math.random()*.2,0,1):Math.random()*.025]}),
           mk(2,()=>{lat=clamp(lat+(Math.random()-.5)*.03+((fail?.82:.21)-lat)*.25,.1,.98);return[lat]})];
  for(let k=0;k<N;k++)P.forEach(p=>{const r=p.gen();p.d.push(r[0]);p.e.push(r[1]||0)});
  const X=i=>(i*220/(N-1)).toFixed(1),Y=v=>(62-v*60).toFixed(1);
  function draw(p,i){const pts=p.d.map((v,j)=>X(j)+','+Y(v)).join(' ');p.ln.setAttribute('points',pts);p.ar.setAttribute('d','M0 64L'+pts.replace(/ /g,'L')+'L220 64Z');
    if(p.er)p.er.setAttribute('d','M0 64L'+p.e.map((v,j)=>X(j)+','+Y(v)).join('L')+'L220 64Z');
    const last=p.d[N-1];
    p.v.textContent=i===0?Math.round(last*100)+'%':i===1?(last*3).toFixed(1)+'k/s · '+(p.e[N-1]*100).toFixed(1)+'%':Math.round(last*1000)+' ms'}
  function tick(){P.forEach((p,i)=>{const r=p.gen();p.d.push(r[0]);p.d.shift();p.e.push(r[1]||0);p.e.shift();draw(p,i)})}
  function setFail(on){fail=on;[1,2].forEach(i=>{const p=P[i];p.el.classList.toggle('bad',on);p.s.textContent=on?(i===1?'5xx rising':'slow'):'ok';p.s.style.color=on?'var(--bad-soft)':''});
    $('obell').classList.toggle('ring',on);$('oalrt').style.opacity=on?1:0}
  P.forEach(draw);
  function cycle(){PB.run('observability',11000);T.q(4200,()=>setFail(true));T.q(8600,()=>setFail(false));T.q(11000,cycle)}
  S.observability={show(){if(a)return;a=setInterval(tick,700);if(!RM)cycle()},hide(){clearInterval(a);a=null;T.clear();setFail(false)}};})();

/* ---------------- resilience: one failure at a time ---------------- */
(function(){const tiles=[...document.querySelectorAll('#resilience .tile')];let iv=null,k=0;
  function on(i){tiles.forEach((t,j)=>t.classList.toggle('run',j===i))}
  S.resilience={show(){if(iv||RM)return;k=0;on(0);iv=setInterval(()=>{k=(k+1)%tiles.length;on(k)},4000)},hide(){clearInterval(iv);iv=null;on(-1)}};})();

/* ---------------- 8 · proxy ---------------- */
(function(){const dg=$('pdots'),lg=$('plbl'),psvg=$('psvg');
  const fitV=()=>psvg.setAttribute('viewBox',innerWidth<600?'150 16 380 224':'0 0 680 250');fitV();addEventListener('resize',fitV);let P=[],L=[],acc=0,nb=0,raf=null,last=0,CT=null;
  const ease=t=>1-Math.pow(1-t,3),smooth=t=>t*t*(3-2*t),cl=t=>t<0?0:t>1?1:t;let nextT=0;
  function spawn(now){const bad=Math.random()<0.8,c=document.createElementNS(NS,'circle'),y0=150+(Math.random()-.5)*(bad?110:36);
    c.setAttribute('r',bad?4.5:6.5);c.setAttribute('fill',bad?'#E24B4A':'#16946C');c.setAttribute('cx',20);c.setAttribute('cy',y0.toFixed(1));dg.appendChild(c);
    const v=bad?.17+Math.random()*.07:.2;P.push({el:c,t0:now,y0,v,bad,hit:(292-20)/v,dy:(Math.random()-.5)*90,dx:30+Math.random()*30,lbl:false})}
  function label(x,y,now){const t=document.createElementNS(NS,'text');t.setAttribute('x',x);t.setAttribute('y',y);t.setAttribute('text-anchor','end');
    t.setAttribute('style','font:500 16px var(--mono);fill:#C2302F');t.textContent='429';lg.appendChild(t);L.push({el:t,x,y,t0:now})}
  function step(now){if(now>=nextT){spawn(now);nextT=now+170+Math.random()*90}
    P=P.filter(p=>{const t=now-p.t0;let x,y,o=1;
      if(p.bad){if(t<p.hit){x=20+p.v*t;y=p.y0}else{const s2=cl((t-p.hit)/650),e=ease(s2);x=292-p.dx*e;y=p.y0+p.dy*e;o=1-s2;
          if(!p.lbl){p.lbl=true;if(++nb%5===0)label(286,p.y0-8,now)}if(s2>=1){p.el.remove();return false}}}
      else{x=20+p.v*t;y=p.y0+(150-p.y0)*smooth(cl((x-190)/130));if(x>675){p.el.remove();return false}}
      p.el.setAttribute('cx',x.toFixed(1));p.el.setAttribute('cy',y.toFixed(1));if(o<1)p.el.setAttribute('opacity',o.toFixed(2));return true});
    L=L.filter(l=>{const s2=cl((now-l.t0)/1100),e=ease(s2);l.el.setAttribute('x',(l.x-26*e).toFixed(1));l.el.setAttribute('y',(l.y-16*e).toFixed(1));l.el.setAttribute('opacity',(1-s2).toFixed(2));if(s2>=1){l.el.remove();return false}return true});
    raf=requestAnimationFrame(step)}
  const cert=$('pcert'),exp=$('pexp'),days=$('pdays'),pill=$('pcb');
  function setD(d){exp.setAttribute('width',String(Math.max(3,Math.round(30*d/90))));const w=d<=30;
    exp.setAttribute('fill',w?'#C9790F':'#16946C');days.textContent='TLS cert · '+d+'d left';pill.style.background=w?'#FCEFD9':'var(--ok-deep)';pill.style.color=w?'var(--warn)':'var(--ok)'}
  async function certCycle(){while(CT){PB.run('proxy',6200);let d=34;setD(d);for(;d>29&&CT;){await wait(380);d--;setD(d)}if(!CT)break;
      days.textContent='rotating cert…';pill.style.background='var(--ok-deep)';pill.style.color='var(--ok)';
      await wait(700);cert.classList.add('out');await wait(700);cert.classList.remove('out');cert.classList.add('in');setD(90);
      requestAnimationFrame(()=>requestAnimationFrame(()=>cert.classList.remove('in')));await wait(2800)}}
  S.proxy={show(){if(raf||RM)return;nextT=0;raf=requestAnimationFrame(step);if(!CT){CT=1;certCycle()}},
    hide(){cancelAnimationFrame(raf);raf=null;CT=null}};})();

/* ---------------- 9 · infra ---------------- */
(function(){const cv=$('icv'),cx=cv.getContext('2d'),LW=+cv.getAttribute('width'),LH=+cv.getAttribute('height');
  let DPR=1;function fitDpr(){DPR=Math.min(2,window.devicePixelRatio||1);cv.width=Math.round(LW*DPR);cv.height=Math.round(LH*DPR)}fitDpr();
  const RC=20,RR=5,SPR=10,SW=60,SH=8,RW=72,RH=100,PAD=6,TH=15,WW=RC*RW,WH=RR*RH,N=RC*RR*SPR;
  const C={old:'#C3CAD5',drain:'#C9790F',boot:'#9AA2B1',ok:'#16946C',fail:'#E24B4A'},FR={c:0,r:2};
  const RGB={};for(const k in C){const h=C[k];RGB[k]=[1,3,5].map(i=>parseInt(h.substr(i,2),16))}
  const sm=t=>t<=0?0:t>=1?1:t*t*(3-2*t),io=p=>p<.5?4*p*p*p:1-Math.pow(-2*p+2,3)/2;
  let gen=0,paused=false,pausedAt=0;
  const w=async ms=>{const g=gen;await wait(ms);while(paused&&g===gen)await wait(150);if(g!==gen)throw 0};
  /* every server eases from its previous colour to its new one */
  const st=new Array(N).fill('old'),from=new Array(N).fill('old'),t0=new Float64Array(N),DUR=260;
  let loop=0,bios=4,os=7,denom=SPR,showCount=true,running=false,shown=0;
  const idx=(rc,rr,s)=>((rr*RC+rc)*SPR+s);
  function set(i,k,delay,now){if(st[i]===k)return;from[i]=st[i];st[i]=k;t0[i]=now+(delay||0)}
  /* a batch sweeps across its racks instead of flipping all at once */
  function setMany(list,k,spread){const now=performance.now(),n=list.length;list.forEach((i,j)=>set(i,typeof k==='function'?k(i):k,spread*j/n,now))}
  function col(i,now){const p=sm((now-t0[i])/DUR);if(p>=1)return C[st[i]];const a=RGB[from[i]],b=RGB[st[i]];
    return 'rgb('+Math.round(a[0]+(b[0]-a[0])*p)+','+Math.round(a[1]+(b[1]-a[1])*p)+','+Math.round(a[2]+(b[2]-a[2])*p)+')'}
  const fitS=Math.min(LW/WW,LH/WH)*.95,zoomS=2.9;
  const ZIN={s:zoomS,x:FR.c*RW+RW/2,y:FR.r*RH+RH/2-4},ZOUT={s:fitS,x:WW/2-RW/2+SW/2,y:WH/2-4};let cam={...ZIN},tw=null;
  const cnt=k=>{let n=0;for(const v of st)if(v===k)n++;return n};
  let lastLv='';
  function hud(){const f=cnt('fail');$('ifb').style.width=Math.min(100,Math.round(100*f/TH))+'%';$('ift').textContent=f+' / '+TH+' · pause threshold';
    if(showCount){const target=Math.min(cnt('ok'),denom);shown+=(target-shown)*.18;if(Math.abs(target-shown)<.5)shown=target;
      $('icn').textContent=Math.round(shown).toLocaleString('en-US');$('icd').textContent=' / '+denom.toLocaleString('en-US');
      const lv='servers upgraded · '+(SH*cam.s>12?'1 rack':cam.s>.9?'a few racks':'the fleet');if(lv!==lastLv){lastLv=lv;$('ilv').textContent=lv}}}
  function draw(now){cx.setTransform(DPR,0,0,DPR,0,0);cx.clearRect(0,0,LW,LH);cx.save();cx.translate(LW/2,LH/2);cx.scale(cam.s,cam.s);cx.translate(-cam.x,-cam.y);
    /* detail fades in as you zoom, instead of popping at one scale */
    const dA=sm((SH*cam.s-9)/6);
    const vx0=cam.x-LW/2/cam.s-RW,vx1=cam.x+LW/2/cam.s+RW,vy0=cam.y-LH/2/cam.s-RH,vy1=cam.y+LH/2/cam.s+RH;
    for(let rr=0;rr<RR;rr++)for(let rc=0;rc<RC;rc++){const rx=rc*RW,ry=rr*RH;if(rx<vx0||rx>vx1||ry<vy0||ry>vy1)continue;
      if(dA>0){cx.globalAlpha=dA;cx.fillStyle='#E9EDF2';cx.fillRect(rx-4,ry-4,SW+8,SPR*SH+PAD*2+4)}
      for(let s=0;s<SPR;s++){const x=rx,y=ry+PAD+s*SH,c=col(idx(rc,rr,s),now);
        if(dA<1){cx.globalAlpha=1-dA;cx.fillStyle=c;cx.fillRect(x,y+.6,SW,SH-1.2)}
        if(dA>0){cx.globalAlpha=dA;cx.fillStyle='#E9EDF3';cx.fillRect(x,y+.5,SW,SH-1);cx.fillStyle='#FFFFFF';for(let d=0;d<4;d++)cx.fillRect(x+4+d*7,y+2,5,SH-4);
          cx.fillStyle=c;cx.beginPath();cx.arc(x+SW-6,y+SH/2,1.6,0,6.3);cx.fill();cx.fillRect(x+36,y+SH/2-.8,12,1.6)}}}
    cx.globalAlpha=1;
    {const x=FR.c*RW,y=FR.r*RH+PAD;cx.strokeStyle='#9A2547';cx.lineWidth=Math.max(1.2,2.2/cam.s);cx.strokeRect(x-1.5,y-.5,SW+3,SH);
      window.__srv={x:(LW/2+(x+SW+1.5-cam.x)*cam.s)*DPR,y:(LH/2+(y+SH/2-.5-cam.y)*cam.s)*DPR}}
    cx.restore();hud()}
  /* one render loop; camera moves and colour fades are all driven from it */
  let raf=null;function tick(now){if(tw){let p=Math.min(1,(now-tw.t0)/tw.ms);const e=io(p),f=tw.from,t=tw.to;
      cam={s:Math.exp(Math.log(f.s)+(Math.log(t.s)-Math.log(f.s))*e),x:f.x+(t.x-f.x)*e,y:f.y+(t.y-f.y)*e};
      if(tw.grow)denom=p>=1?N:Math.max(SPR,Math.round(Math.exp(Math.log(SPR)+(Math.log(N)-Math.log(SPR))*e)/10)*10);
      if(p>=1){const r=tw.res;tw=null;r()}}
    draw(now);raf=requestAnimationFrame(tick)}
  function anim(from,to,ms,grow){const g=gen;return new Promise((res,rej)=>{tw={from,to,ms,grow,t0:performance.now(),res:()=>g===gen?res():rej(0)}})}
  function status(t,p){$('ibt').textContent=t;$('ibt').classList.toggle('pause',!!p)}
  async function fixAll(){const f=[];st.forEach((k,i)=>{if(k==='fail')f.push(i)});
    for(let j=0;j<f.length;j+=3){const g=f.slice(j,j+3);setMany(g,'drain',0);await w(160);setMany(g,'boot',0);await w(160);setMany(g,'ok',0);await w(80)}}
  async function cycle(){const isB=loop%2===0;
    $('ity').textContent=isB?'BIOS upgrade':'OS upgrade';$('ivr').textContent=isB?('2.'+bios+' → 2.'+(bios+1)):('v'+os+' → v'+(os+1));$('ity').style.opacity=1;
    PB.set('infra',0);denom=SPR;showCount=true;shown=0;$('icw').style.opacity=1;status('routine upgrade');await w(800);
    const rf=2+Math.floor(Math.random()*7);
    for(let s=0;s<SPR;s++){const i=idx(FR.c,FR.r,s);setMany([i],'drain',0);await w(170);setMany([i],'boot',0);await w(170);setMany([i],s===rf?'fail':'ok',0);await w(100)}
    await w(400);status('fixing 1 host',true);await fixAll();status('rack done');PB.set('infra',.2);await w(600);
    await anim(ZIN,ZOUT,2600,true);
    const NB=10,PC=RC/NB,cells=b=>{const o=[];for(let rc=b*PC;rc<(b+1)*PC;rc++)for(let rr=0;rr<RR;rr++)if(!(rc===FR.c&&rr===FR.r))for(let s=0;s<SPR;s++)o.push(idx(rc,rr,s));return o};
    for(let b=0;b<NB;b++){status('batch '+(b+1)+' / '+NB);PB.set('infra',.25+.7*b/NB);const cs=cells(b);
      setMany(cs,'drain',260);await w(380);setMany(cs,'boot',260);await w(380);setMany(cs,()=>Math.random()<.05?'fail':'ok',260);await w(420);
      if(cnt('fail')>=TH){status('paused · failure threshold hit',true);await w(1300);status('fixing failed hosts',true);await fixAll();status('resuming');await w(600)}}
    if(cnt('fail')>0){status('fixing failed hosts',true);await fixAll()}
    status('fleet upgraded');PB.set('infra',1);await w(1800);
    showCount=false;$('icw').style.opacity=0;$('ity').style.opacity=.4;$('ilv').textContent='next routine upgrade';lastLv='';status('scheduled');$('ivr').textContent=isB?'next: OS upgrade':'next: BIOS upgrade';
    /* the fleet greys out gently while the camera returns to the first rack */
    const all=[];for(let i=0;i<N;i++)all.push(i);setMany(all,'old',1800);
    await anim(ZOUT,ZIN,2600,false);await w(300);if(isB)bios++;else os++;loop++;run()}
  function run(){cycle().catch(e=>{if(e!==0)console.error("infra",e&&e.stack||e)})}
  function hardReset(){gen++;tw=null;cam={...ZIN};st.fill('old');from.fill('old');t0.fill(0)}
  draw(performance.now());
  addEventListener('resize',()=>{const d=Math.min(2,window.devicePixelRatio||1);if(d!==DPR){fitDpr();if(!raf)draw(performance.now())}});
  S.infra={show(){if(RM)return;if(paused){const d=performance.now()-pausedAt;paused=false;if(tw)tw.t0+=d;for(let i=0;i<N;i++)t0[i]+=d}
      if(!raf)raf=requestAnimationFrame(tick);if(!running){running=true;run()}},
    hide(){if(!running)return;paused=true;pausedAt=performance.now();cancelAnimationFrame(raf);raf=null},
    play(){if(RM)return;hardReset();paused=false;running=true;if(!raf)raf=requestAnimationFrame(tick);setTimeout(run,30)}};})();

/* ---------------- data: this week vs last week ---------------- */
(function(){const sv=$('dsv');if(!sv)return;const N=48,X=j=>(j*240/(N-1)),Y=v=>(96-v*90);
  const lw=[],tw=[];for(let j=0;j<N;j++){const base=.45+.25*Math.sin((j-6)/24*Math.PI*2)+.04*Math.sin(j*1.7);lw.push(base);
    const dev=j>=36?Math.min(.32,(j-35)*.05):0;tw.push(base+(Math.sin(j*2.3)*.025)-dev)}
  const pts=a=>a.map((v,j)=>X(j).toFixed(1)+','+Y(v).toFixed(1)).join(' ');
  sv.querySelector('.lw').setAttribute('points',pts(lw));sv.querySelector('.tw').setAttribute('points',pts(tw));
  let g='M'+X(35).toFixed(1)+' '+Y(lw[35]).toFixed(1);for(let j=36;j<N;j++)g+='L'+X(j).toFixed(1)+' '+Y(lw[j]).toFixed(1);for(let j=N-1;j>=35;j--)g+='L'+X(j).toFixed(1)+' '+Y(tw[j]).toFixed(1);
  sv.querySelector('.gap').setAttribute('d',g+'Z');
  const dot=$('dnow');function place(){const r=sv.getBoundingClientRect(),p=sv.parentElement.getBoundingClientRect();dot.style.left=(r.left-p.left+r.width).toFixed(1)+'px';dot.style.top=(r.top-p.top+r.height*Y(tw[N-1])/100).toFixed(1)+'px'}
  place();addEventListener('resize',place);setTimeout(place,300);document.fonts&&document.fonts.ready.then(place)})();

/* ---------------- 11 · AI ---------------- */
(function(){const T=timers(),steps=[...document.querySelectorAll('#aline .step')];
  if(RM)steps.forEach(x=>x.className='step ok');
  S.ai={play(){T.clear();steps.forEach(x=>x.className='step');PB.run('ai',500+steps.length*900);
    steps.forEach((x,i)=>{T.q(400+i*900,()=>x.className='step on');T.q(900+i*900,()=>x.className='step ok')})}};})();

/* ---------------- 12 · talks ---------------- */
/* talks: who was in the room for each talk at work */
(function(){const btn=[...document.querySelectorAll('#talks .rpills button')],aud=$('raud');if(!btn.length)return;
  const N=['Team','Stakeholders','Architects','Leadership','Engineers','New joiners','New grads','Interviewers'];
  const MAP=[[0,1],[2,3,4],[5],[0,6,7]];let k=0,iv=null,hold=0;
  function sel(i){k=i;btn.forEach((b,j)=>b.setAttribute('aria-selected',String(j===i)));
    for(let s=0;s<8;s++){const e=$('rs'+s);if(e)e.classList.toggle('on',MAP[i].includes(s))}
    aud.textContent='For: '+MAP[i].map(s=>N[s]).join(', ')}
  btn.forEach((b,i)=>b.addEventListener('click',()=>{sel(i);hold=performance.now()+10000}));
  sel(0);
  S.talks={show(){if(iv||RM)return;iv=setInterval(()=>{if(performance.now()<hold)return;sel((k+1)%4)},3600)},hide(){clearInterval(iv);iv=null}};})();

/* ---------------- 13 · talks internal ---------------- */


/* ---------------- 14 · summary ---------------- */
(function(){const CX=340,CY=235,RI=90,RO=188,RS=139,RL=208,deg=d=>d*Math.PI/180;
  const A=[{n:['Reliability'],c:'#1D9E75',f:'#E0F3EB',a0:-135,a1:-45,st:[['Resilience',-117,null,160],['Observability',-100,null,118],['On-call',-84,null,164],['Anomaly',-58,'detection',134]]},
    {n:['Security &','identity'],c:'#D4537E',f:'#F8E3EA',a0:-45,a1:45,st:[['Auth',-20,null,139],['Threat',12,'modeling',139]]},
    {n:['Infrastructure'],c:'#378ADD',f:'#E2EDFA',a0:45,a1:135,st:[['Fleet',66,'upgrades',142],['CI/CD',90,null,122],['Cert',114,'rotation',142]]},
    {n:['Building'],c:'#C9790F',f:'#FCEFD9',a0:135,a1:225,st:[['Experiments',149,null,150],['Data',170,'analysis',118],['Personal',192,'projects',152],['AI',214,null,124]]}];
  const pt=(r,a)=>[(CX+r*Math.cos(deg(a))).toFixed(1),(CY+r*Math.sin(deg(a))).toFixed(1)];
  function arc(a0,a1){const[x1,y1]=pt(RO,a0),[x2,y2]=pt(RO,a1),[x3,y3]=pt(RI,a1),[x4,y4]=pt(RI,a0);return`M${x1} ${y1}A${RO} ${RO} 0 0 1 ${x2} ${y2}L${x3} ${y3}A${RI} ${RI} 0 0 0 ${x4} ${y4}Z`}
  const sec=$('ssec'),sg=$('sstops');
  function txt(x,y,s,cls,anc,style){const e=document.createElementNS(NS,'text');e.setAttribute('class',cls);e.setAttribute('x',x);e.setAttribute('y',y);e.setAttribute('text-anchor',anc||'middle');if(style)e.setAttribute('style',style);e.textContent=s;sg.appendChild(e);return e}
  A.forEach(s=>{const p=document.createElementNS(NS,'path');p.setAttribute('d',arc(s.a0+1,s.a1-1));p.setAttribute('fill',s.f);p.setAttribute('stroke',s.c);p.setAttribute('stroke-width','1.5');sec.appendChild(p);s.el=p;
    const m=deg((s.a0+s.a1)/2),lx=CX+RL*Math.cos(m),ly=CY+RL*Math.sin(m),anc=Math.abs(Math.cos(m))<.2?'middle':Math.cos(m)>0?'start':'end';
    s.n.forEach((t,i)=>{const y=Math.sin(m)<-.5?ly-4-(s.n.length-1-i)*17:Math.sin(m)>.5?ly+14+i*17:ly+5+(i-(s.n.length-1)/2)*17;txt(lx.toFixed(1),y.toFixed(1),t,'th stop-lbl',anc,'fill:'+s.c)});
    s.st.forEach(([t,a,t2,rr])=>{const x=(CX+rr*Math.cos(deg(a))).toFixed(1),y=CY+rr*Math.sin(deg(a));txt(x,(t2?y-3:y+4.5).toFixed(1),t,'ti stop-lbl',null,null);if(t2)txt(x,(y+12).toFixed(1),t2,'ti stop-lbl',null,null)});
  });

  
  {const[px,py]=pt(RO,45).map(Number);const pg=document.createElementNS(NS,'g');pg.setAttribute('class','stop-lbl');
   pg.innerHTML=`<rect x="${(px-30).toFixed(1)}" y="${(py-12).toFixed(1)}" width="60" height="24" rx="12" fill="#FFFFFF" stroke="#1A1F2B" stroke-width="1.5"/><text class="ti" x="${px}" y="${(py+4.5).toFixed(1)}" text-anchor="middle">Edge</text>`;sg.appendChild(pg)}
  document.querySelector('#ssvg text.th').classList.add('stop-lbl');
  const pk=$('spk');let ang=-90,last=0,raf=null;
  function f(t){const dt=Math.min(40,t-last);last=t;ang=(ang+dt*.03)%360;
    pk.setAttribute('cx',(CX+198*Math.cos(deg(ang))).toFixed(1));pk.setAttribute('cy',(CY+198*Math.sin(deg(ang))).toFixed(1));
    const n=((ang%360)+360)%360;A.forEach(s=>{const a0=((s.a0%360)+360)%360,a1=((s.a1%360)+360)%360,in_=a0<a1?(n>=a0&&n<a1):(n>=a0||n<a1);
      s.el.setAttribute('stroke-width',in_?'3':'1.5');s.el.setAttribute('fill-opacity',in_?'1':'.55')});raf=requestAnimationFrame(f)}
  S.summary={show(){if(raf||RM)return;last=performance.now();raf=requestAnimationFrame(f)},hide(){cancelAnimationFrame(raf);raf=null}};})();


/* ---------------- your request: status in the top bar, a marker in the scene ---------------- */
(function(){const pills=[...document.querySelectorAll('.rq')];if(!pills.length)return;
  const R=el=>{if(!el)return null;const r=el.getBoundingClientRect();return r.width+r.height>0?r:null};
  const ctr=el=>{const r=R(el);return r?{x:r.left+r.width/2,y:r.top+r.height/2}:null};
  const sp=(svg,x,y)=>{const m=svg&&svg.getScreenCTM();return m?{x:m.a*x+m.c*y+m.e,y:m.b*x+m.d*y+m.f}:null};
  const ME='req 7f3a';
  const A={
    start:()=>({t:ME+' · ready',tg:ctr($('sigo'))}),
    auth:()=>{const ok=$('ascr').classList.contains('ok');return{t:ME+(ok?' · approved':' · tap Yes'),tg:ctr($('ayes'))}},
    security:()=>({t:ME+' · checked',tone:'ok',tg:ctr(document.querySelector('#atk .srv rect:nth-of-type(2)'))}),
    experiments:()=>({t:ME+' · saw B',tg:ctr($('ephB'))}),
    data:()=>({t:ME+' · counted',tg:ctr(document.querySelector('#dfun .fr b'))}),
    proxy:()=>({t:ME+' · passed the edge',tg:sp($('psvg'),420,150)}),
    infra:()=>{const c=$('icv'),r=R(c),v=window.__srv;return{t:ME+' → server-001.example.com',tg:r&&v?{x:r.left+v.x*r.width/c.width-30,y:r.top+v.y*r.width/c.width}:null}},
    traffic:()=>{const m=$('tmap'),bad=m.dataset.state==='bad';return{t:ME+(bad?' · 5xx':' · 200 OK'),tone:bad?'bad':null,tg:ctr($(bad?'tsg':'tme'))}},
    oncall:()=>{const s=$('ost').textContent;return{t:ME+(s==='open'?' · 5xx':s==='mitigated'?' · rolled back':' · recovered'),tone:s==='open'?'bad':s==='mitigated'?'warn':'ok',tg:ctr(document.querySelector('#ochat .alrt'))}},
    observability:()=>{const p=$('op1'),f=p.classList.contains('bad');return{t:ME+(f?' · 5xx':' · 200 OK'),tone:f?'bad':'ok',tg:ctr(p.querySelector('.ch'))}},
    resilience:()=>({t:ME+' · 200 OK',tone:'ok'})};
  const DONE={t:ME+' · 200 OK',tone:'ok'};
  const navh=()=>parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--navh'))||0;
  const NS='http://www.w3.org/2000/svg',rt=document.createElementNS(NS,'svg');rt.id='route';rt.setAttribute('aria-hidden','true');
  rt.innerHTML='<line class="hl"/><circle class="mr" r="6"/>';document.body.appendChild(rt);
  const hl=rt.querySelector('.hl'),mr=rt.querySelector('.mr');
  let lastT='',lastTone='',cur=-1,still=0,shown=-1,hlT=null;
  function setPill(t,tone){if(t!==lastT){const m=t.slice(ME.length),sep=m.startsWith(' → ')?' → ':m.startsWith(' · ')?' · ':'',st=m.slice(sep.length);pills.forEach(p=>{p.querySelector('.rqt').innerHTML='<span class="rid">'+ME+sep+'</span><span class="rst">'+st+'</span>';p.classList.remove('chg');void p.offsetWidth;p.classList.add('chg')});lastT=t}
    if((tone||'me')!==lastTone){pills.forEach(p=>p.dataset.tone=tone||'me');lastTone=tone||'me'}}
  function off(){hl.classList.remove('on');mr.classList.remove('on')}
  let lastScroll=performance.now(),lastRun=0;addEventListener('scroll',()=>{lastScroll=performance.now()},{passive:true});addEventListener('resize',()=>{lastScroll=performance.now()});
  function frame(){const t0=performance.now();if(t0-lastScroll>1500&&t0-lastRun<250){requestAnimationFrame(frame);return}lastRun=t0;const nh=navh();let i=0;for(let k=0;k<stops.length;k++){if(stops[k].getBoundingClientRect().top-nh<=innerHeight*.45)i=k}
    const id=stops[i].id,a=A[id]?A[id]():DONE;setPill(a.t,a.tone);
    const top=stops[i].getBoundingClientRect().top-nh,settled=Math.abs(top)<4,now=performance.now();
    if(i!==cur||!settled){cur=i;still=now;if(!settled&&shown!==-1){shown=-1;off()}}
    const tg=a.tg,pill=pills.find(p=>p.offsetParent!==null),pr=R(pill);
    if(settled&&tg&&pr&&shown!==i&&now-still>350&&!RM){shown=i;
      const x1=pr.left+pr.width/2,y1=pr.bottom,dx=tg.x-x1,dy=tg.y-y1,L=Math.hypot(dx,dy)||1,e=Math.min(1,22/L);
      hl.setAttribute('x1',x1.toFixed(1));hl.setAttribute('y1',y1.toFixed(1));hl.setAttribute('x2',(tg.x-dx*e).toFixed(1));hl.setAttribute('y2',(tg.y-dy*e).toFixed(1));
      mr.setAttribute('cx',tg.x.toFixed(1));mr.setAttribute('cy',tg.y.toFixed(1));
      [hl,mr].forEach(el=>{el.classList.toggle('bad',a.tone==='bad');el.classList.toggle('ok',a.tone==='ok')});
      mr.classList.remove('on');void mr.getBBox();mr.classList.add('on');clearTimeout(hlT);hlT=setTimeout(off,1100)}
    requestAnimationFrame(frame)}
  requestAnimationFrame(frame)})();

stops.forEach(s=>playObs.observe(s));
})();
