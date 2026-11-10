/* Tiny dependency-free force-directed network graph (SVG). Dots = nodes, lines = connections.
   netgraph(host,{nodes:[{id,label,r,color,shape,always,ghost,title}],links:[{s,t,w,dash,color,soft}],onSelect,pad,repel,len})
   shapes: circle (default) | diamond | hex | square */
function netgraph(host,o){
 host.innerHTML='';
 const W=host.clientWidth||600,H=host.clientHeight||400,NS='http://www.w3.org/2000/svg';
 const SC=Math.max(1,Math.min(2.2,Math.sqrt(W*H/260000)));
 const nodes=o.nodes.map(n=>({r:8,shape:'circle',...n,vx:0,vy:0}));
 const byId=Object.fromEntries(nodes.map(n=>[n.id,n]));
 const links=o.links.map(l=>({w:.5,...l,a:byId[l.s],b:byId[l.t]})).filter(l=>l.a&&l.b&&l.a!==l.b);
 const adj={};nodes.forEach(n=>adj[n.id]=new Set());links.forEach(l=>{adj[l.s].add(l.t);adj[l.t].add(l.s)});
 nodes.forEach((n,i)=>{const a=i*2.399963,rad=Math.sqrt((i+.5)/nodes.length)*Math.min(W,H)*.42;n.x=W/2+Math.cos(a)*rad;n.y=H/2+Math.sin(a)*rad});
 let alpha=1,raf=0,sel=null,drag=null;
 const clamp=n=>{n.x=Math.max(n.r+6,Math.min(W-n.r-6,n.x));n.y=Math.max(n.r+14,Math.min(H-n.r-16,n.y))};
 function step(){
  const k=(o.repel||2200)*SC*SC,pad=o.pad??8;
  for(let i=0;i<nodes.length;i++)for(let j=i+1;j<nodes.length;j++){
   const a=nodes[i],b=nodes[j];let dx=b.x-a.x,dy=b.y-a.y,d2=dx*dx+dy*dy;if(d2<.01){dx=Math.random()-.5;dy=Math.random()-.5;d2=.5}
   const d=Math.sqrt(d2),min=a.r+b.r+pad;let f=k/d2;if(d<min)f+=(min-d)*.5;f*=alpha;
   const fx=dx/d*f,fy=dy/d*f;a.vx-=fx;a.vy-=fy;b.vx+=fx;b.vy+=fy}
  for(const l of links){
   const dx=l.b.x-l.a.x,dy=l.b.y-l.a.y,d=Math.sqrt(dx*dx+dy*dy)||.1;
   const L=(o.len||62)*SC*(l.soft?2.2:1)+l.a.r+l.b.r,f=(d-L)*(l.soft?.004:.018)*(.4+l.w)*alpha;
   const fx=dx/d*f,fy=dy/d*f;l.a.vx+=fx;l.a.vy+=fy;l.b.vx-=fx;l.b.vy-=fy}
  for(const n of nodes){
   n.vx+=(W/2-n.x)*.0035*alpha;n.vy+=(H/2-n.y)*.0045*alpha;
   if(n===drag){n.vx=n.vy=0;continue}
   n.vx*=.78;n.vy*=.78;n.x+=n.vx;n.y+=n.vy;clamp(n)}}
 for(let i=0;i<260;i++){alpha=Math.max(.04,1-i/260);step()}
 /* ---- svg ---- */
 const svg=document.createElementNS(NS,'svg');svg.setAttribute('viewBox',`0 0 ${W} ${H}`);svg.setAttribute('class','ng');svg.setAttribute('width','100%');svg.setAttribute('height','100%');
 const polys={diamond:r=>[[0,-1.3*r],[1.3*r,0],[0,1.3*r],[-1.3*r,0]],hex:r=>[...Array(6)].map((_,i)=>[1.15*r*Math.cos(i*Math.PI/3),1.15*r*Math.sin(i*Math.PI/3)])};
 const shape=n=>{const st=`fill:${n.ghost?'var(--panel)':n.color||'var(--link)'};stroke:${n.ring||(n.ghost?n.color||'var(--mut)':'var(--panel)')};stroke-width:${n.ring||n.ghost?2.2:1.6};${n.ghost?'stroke-dasharray:3 3;':''}`;
  if(n.shape==='square')return `<rect x="${-n.r}" y="${-n.r}" width="${2*n.r}" height="${2*n.r}" rx="4" style="${st}"/>`;
  if(polys[n.shape])return `<polygon points="${polys[n.shape](n.r).map(p=>p.join(',')).join(' ')}" style="${st}"/>`;
  return `<circle r="${n.r}" style="${st}"/>`};
 svg.innerHTML=`<g class="lk">${links.map((l,i)=>`<line data-i="${i}" style="stroke:${l.color||'var(--mut)'};stroke-width:${l.dash?1.6:(.6+l.w*3.2).toFixed(2)};opacity:${l.dash?.8:(.18+l.w*.5).toFixed(2)};${l.dash?'stroke-dasharray:5 4;':''}"/>`).join('')}</g>
  <g class="nd">${nodes.map((n,i)=>`<g class="node" data-i="${i}" tabindex="0">${shape(n)}<title>${(n.title||n.label||'').replace(/&/g,'&amp;').replace(/</g,'&lt;')}</title>${n.label?`<text class="lbl ${n.always?'':'sm'}" y="${n.r+13}" text-anchor="middle">${(n.label).replace(/&/g,'&amp;').replace(/</g,'&lt;')}</text>`:''}</g>`).join('')}</g>`;
 host.appendChild(svg);
 const LE=[...svg.querySelectorAll('line')],NE=[...svg.querySelectorAll('g.node')];
 const draw=()=>{links.forEach((l,i)=>{const e=LE[i];e.setAttribute('x1',l.a.x);e.setAttribute('y1',l.a.y);e.setAttribute('x2',l.b.x);e.setAttribute('y2',l.b.y)});
  nodes.forEach((n,i)=>NE[i].setAttribute('transform',`translate(${n.x.toFixed(1)},${n.y.toFixed(1)})`))};
 const focus=id=>{svg.classList.toggle('focus',!!id);
  nodes.forEach((n,i)=>{const on=id&&(n.id===id||adj[id].has(n.id));NE[i].classList.toggle('hl',!!on);NE[i].classList.toggle('sel',n.id===sel)});
  links.forEach((l,i)=>LE[i].classList.toggle('hl',!!id&&(l.s===id||l.t===id)))};
 const tick=()=>{raf=0;alpha*=.965;step();draw();if(alpha>.03)raf=requestAnimationFrame(tick)};
 const heat=a=>{alpha=Math.max(alpha,a);if(!raf)raf=requestAnimationFrame(tick)};
 draw();alpha=.12;heat(.12);
 const pt=e=>{const r=svg.getBoundingClientRect();return[(e.clientX-r.left)*W/r.width,(e.clientY-r.top)*H/r.height]};
 let moved=0;
 NE.forEach((g,i)=>{const n=nodes[i];
  g.addEventListener('pointerenter',()=>focus(n.id));g.addEventListener('pointerleave',()=>{if(!drag)focus(sel)});
  g.addEventListener('keydown',e=>{if(e.key==='Enter'){sel=n.id;focus(sel);o.onSelect&&o.onSelect(n)}});
  g.addEventListener('pointerdown',e=>{drag=n;moved=0;g.setPointerCapture(e.pointerId);e.preventDefault()});
  g.addEventListener('pointermove',e=>{if(drag!==n)return;moved++;const[x,y]=pt(e);n.x=x;n.y=y;clamp(n);heat(.35);draw()});
  g.addEventListener('pointerup',e=>{if(drag!==n)return;drag=null;if(moved<4){sel=sel===n.id?null:n.id;focus(sel);o.onSelect&&o.onSelect(sel?n:null)}else focus(sel)})});
 svg.addEventListener('click',e=>{if(e.target===svg){sel=null;focus(null);o.onSelect&&o.onSelect(null)}});
 return{select(id){sel=id;focus(id);const n=byId[id];if(n&&o.onSelect)o.onSelect(n)},node:id=>byId[id],destroy(){cancelAnimationFrame(raf)}}}

/* stacked bar chart: data=[{label,parts:[[value,color,name]]}] */
function stackbars(host,data,o={}){
 const W=host.clientWidth||520,H=o.h||host.clientHeight||150,m={l:26,r:6,t:8,b:20},mx=Math.max(1,...data.map(d=>d.parts.reduce((a,p)=>a+p[0],0)));
 const bw=(W-m.l-m.r)/data.length;let g='';
 for(let k=0;k<=3;k++){const y=m.t+(H-m.t-m.b)*(1-k/3);g+=`<line x1="${m.l}" x2="${W-m.r}" y1="${y}" y2="${y}" style="stroke:var(--line)"/><text x="${m.l-4}" y="${y+3}" text-anchor="end" class="ax">${Math.round(mx*k/3)}</text>`}
 data.forEach((d,i)=>{let y=H-m.b;const x=m.l+i*bw+bw*.12;
  d.parts.forEach(p=>{const h=(H-m.t-m.b)*p[0]/mx;y-=h;if(h>0)g+=`<rect x="${x}" y="${y}" width="${bw*.76}" height="${h}" rx="1.5" style="fill:${p[1]}"><title>${d.label} · ${p[2]}: ${p[0]}</title></rect>`});
  if(i%Math.ceil(data.length/7)===0)g+=`<text x="${x+bw*.38}" y="${H-5}" text-anchor="middle" class="ax">${d.label.slice(5)}</text>`});
 host.innerHTML=`<svg viewBox="0 0 ${W} ${H}" width="100%" height="${H}" class="ng">${g}</svg>`}
