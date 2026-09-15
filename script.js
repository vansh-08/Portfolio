const $ = (s, root=document) => root.querySelector(s);
const $$ = (s, root=document) => [...root.querySelectorAll(s)];

const nav = $('#nav');
const navToggle = $('#navToggle');
const navLinks = $('#navLinks');
const progress = $('#progressBar');
const glow = $('.cursor-glow');

navToggle.addEventListener('click', () => {
  const open = navLinks.classList.toggle('open');
  navToggle.classList.toggle('active', open);
  navToggle.setAttribute('aria-expanded', open);
});
$$('#navLinks a').forEach(a => a.addEventListener('click', () => {
  navLinks.classList.remove('open');
  navToggle.classList.remove('active');
  navToggle.setAttribute('aria-expanded', 'false');
}));

window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', scrollY > 40);
  const max = document.documentElement.scrollHeight - innerHeight;
  progress.style.width = `${Math.min(100, Math.max(0, scrollY / max * 100))}%`;
}, {passive:true});

if (matchMedia('(pointer:fine)').matches) {
  addEventListener('pointermove', e => {
    glow.style.left = `${e.clientX}px`;
    glow.style.top = `${e.clientY}px`;
  }, {passive:true});
  $$('.magnetic').forEach(el => {
    el.addEventListener('pointermove', e => {
      const r = el.getBoundingClientRect();
      el.style.transform = `translate(${(e.clientX-r.left-r.width/2)*.12}px, ${(e.clientY-r.top-r.height/2)*.12}px)`;
    });
    el.addEventListener('pointerleave', () => el.style.transform = '');
  });
}

const revealObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => { if(entry.isIntersecting) entry.target.classList.add('visible'); });
}, {threshold:.12, rootMargin:'0px 0px -8% 0px'});
$$('.reveal').forEach(el => revealObserver.observe(el));

/* Scroll-driven "video" — a procedural cinematic scene, so the portfolio ships with
   no copyrighted footage or external media. The frame changes continuously with scroll. */
const canvas = $('#scene');
const ctx = canvas.getContext('2d', {alpha:false});
let W=0,H=0,dpr=1, t=0;

function resize(){
  dpr = Math.min(devicePixelRatio || 1, 2);
  W = innerWidth; H = innerHeight;
  canvas.width = W*dpr; canvas.height = H*dpr;
  canvas.style.width=W+'px'; canvas.style.height=H+'px';
  ctx.setTransform(dpr,0,0,dpr,0,0);
}
addEventListener('resize', resize); resize();

const lerp=(a,b,x)=>a+(b-a)*x;
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
function mix(a,b,p){return [lerp(a[0],b[0],p),lerp(a[1],b[1],p),lerp(a[2],b[2],p)]}
function rgb(c){return `rgb(${c.map(v=>v|0).join(',')})`}

function scene(progress){
  const p=clamp(progress);
  const dawn=clamp(p*1.45);
  const dusk=clamp((p-.45)*1.8);
  const night=clamp((p-.75)*4);
  const top=mix([30,18,28],[236,112,83],dawn);
  const bot=mix([8,8,13],[244,187,112],dawn);
  const top2=mix(top,[16,8,18],night);
  const bot2=mix(bot,[11,8,13],night);

  const g=ctx.createLinearGradient(0,0,0,H);
  g.addColorStop(0,rgb(top2)); g.addColorStop(.55,rgb(bot2)); g.addColorStop(1,'#070609');
  ctx.fillStyle=g;ctx.fillRect(0,0,W,H);

  // moving cloud bands
  ctx.save();
  ctx.globalAlpha=.10*(1-night*.5);
  for(let i=0;i<7;i++){
    const y=H*(.15+i*.09)+Math.sin(t*.0002+i)*35;
    ctx.fillStyle=i%2?'#fff1df':'#6c2b46';
    ctx.beginPath();ctx.ellipse(W*(.2+i*.18),y,W*.3,H*.035,0,0,Math.PI*2);ctx.fill();
  }
  ctx.restore();

  // sun / moon
  const sunP=clamp((p-.02)/.75);
  const sx=W*(.2+.6*sunP), sy=H*(.52-.28*Math.sin(sunP*Math.PI));
  const radius=Math.min(W,H)*(.055+.025*(1-night));
  ctx.globalAlpha=1-night*.65;
  const sg=ctx.createRadialGradient(sx,sy,0,sx,sy,radius*4);
  sg.addColorStop(0,'rgba(255,226,164,.9)');sg.addColorStop(.25,'rgba(255,153,93,.28)');sg.addColorStop(1,'rgba(255,120,80,0)');
  ctx.fillStyle=sg;ctx.fillRect(sx-radius*4,sy-radius*4,radius*8,radius*8);
  ctx.fillStyle=night>.4?'#ddd6c9':'#ffe0a0';ctx.beginPath();ctx.arc(sx,sy,radius,0,Math.PI*2);ctx.fill();

  // distant skyline
  const base=H*.72;
  ctx.fillStyle=`rgba(13,9,14,${.72+.2*night})`;
  for(let i=0;i<45;i++){
    const bw=18+(i*37%60), bh=25+(i*83%(H*.18));
    const x=(i/45)*W-10;
    ctx.fillRect(x,base-bh,bw,bh);
    if(i%4===0){ctx.fillStyle='rgba(246,170,108,.28)';ctx.fillRect(x+8,base-bh+12,3,3);ctx.fillStyle=`rgba(13,9,14,${.72+.2*night})`}
  }

  // foreground palms
  ctx.strokeStyle='rgba(7,5,7,.9)';ctx.lineWidth=Math.max(2,W/700);
  const palm=(x,y,s)=>{
    ctx.beginPath();ctx.moveTo(x,y);ctx.quadraticCurveTo(x-s*.03,y-s*.3,x+s*.08,y-s*.62);ctx.stroke();
    const cx=x+s*.08,cy=y-s*.62;
    for(let k=0;k<9;k++){const a=-Math.PI*.9+k*Math.PI*.2;ctx.beginPath();ctx.moveTo(cx,cy);ctx.quadraticCurveTo(cx+Math.cos(a)*s*.16,cy+Math.sin(a)*s*.1,cx+Math.cos(a)*s*.38,cy+Math.sin(a)*s*.25);ctx.stroke()}
  };
  palm(W*.08,H*.9,H*.5); palm(W*.9,H*.94,H*.42);

  // road / water reflections
  const rg=ctx.createLinearGradient(0,H*.72,0,H);rg.addColorStop(0,'rgba(255,135,91,.06)');rg.addColorStop(1,'rgba(0,0,0,.6)');
  ctx.fillStyle=rg;ctx.fillRect(0,H*.72,W,H*.28);
  ctx.globalAlpha=.16*(1-night*.5);
  for(let i=0;i<18;i++){const yy=H*.76+i*14+Math.sin(t*.001+i)*2;ctx.fillStyle=i%2?'#f3a06c':'#d84e61';ctx.fillRect(W*.35+(i%3)*18,yy,80+(i%5)*35,1)}
  ctx.globalAlpha=1;

  // film flare
  const fx=W*(.5+.3*Math.sin(p*4));const fg=ctx.createRadialGradient(fx,H*.42,0,fx,H*.42,W*.4);
  fg.addColorStop(0,`rgba(255,100,72,${.06+dusk*.08})`);fg.addColorStop(1,'rgba(0,0,0,0)');
  ctx.fillStyle=fg;ctx.fillRect(0,0,W,H);

  // fine particles
  ctx.fillStyle='rgba(255,230,205,.5)';
  for(let i=0;i<50;i++){const x=(i*197+t*.018)%W,y=(i*97+Math.sin(i+t*.0004)*35)%H;ctx.fillRect(x,y,1,1)}
}

function draw(){
  t=performance.now();
  const hero=document.querySelector('.cinematic');
  const r=hero.getBoundingClientRect();
  const p=clamp(-r.top/(r.height-innerHeight));
  scene(p);
  requestAnimationFrame(draw);
}
draw();
