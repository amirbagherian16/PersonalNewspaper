const TABS=[['today','Today','📰'],['groups','Groups','👥'],['funding','Funding','💰'],['brainstorm','Brainstorm','💡'],['saved','Saved','⭐'],['background','Background','📚'],['dataset','Dataset','🗂']];
const SEC={contact_sport:'Contact sport',biomechanics_modeling:'Biomechanics & modeling',blast_military:'Blast & military',medical_clinical:'Medical & clinical',general_tbi:'General TBI'};
const TYPE={paper:'Paper',preprint:'Preprint',news:'News',linkedin:'LinkedIn',social:'Social',github:'GitHub',grant:'Grant award',opportunity:'Open call',funding_news:'Funding news'};
const FEED_TYPES=['paper','preprint','news','funding_news','linkedin','social','github'];
const NOFEED=['grant','opportunity'];
const COL={contact_sport:['#f08c3a','#8a2d12'],biomechanics_modeling:['#4aa3d8','#14375e'],blast_military:['#b56ab0','#3d1840'],medical_clinical:['#3bbd8e','#0d4a3a'],general_tbi:['#8f95e8','#2a2c66']};
const $=s=>document.querySelector(s);let D=null,IDEAS=null,BG=null,DL={csv:'',jsonl:''};
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const safe=u=>/^https?:\/\//i.test(u||'')?u:'#';
const gname=id=>(D.groups.find(g=>g.id===id)||{}).name||id;
const isMine=i=>i.groups.some(g=>(D.groups.find(x=>x.id===g)||{}).mine);
const hash=s=>{let h=0;for(const c of s)h=(h*31+c.charCodeAt(0))|0;return Math.abs(h)};
const store={get(k){try{return localStorage.getItem(k)}catch(e){return null}},set(k,v){try{localStorage.setItem(k,v)}catch(e){}}};

/* ---------- generated art (fallback image) ---------- */
function glyph(sec,h){const o=(h%5)*6;
 if(sec==='contact_sport')return `<path d="M120 175c0-60 40-105 95-105 50 0 85 35 85 85v20H120z" fill="none" stroke="#fff" stroke-width="7" opacity=".85"/><path d="M215 70v105M160 175c0-45 20-85 55-105" fill="none" stroke="#fff" stroke-width="5" opacity=".6"/><circle cx="${290+o}" cy="${70+o}" r="14" fill="#fff" opacity=".7"/>`;
 if(sec==='biomechanics_modeling')return `<g stroke="#fff" stroke-width="2.4" opacity=".75" fill="none">${[0,1,2,3,4,5].map(i=>`<path d="M${70+o} ${60+i*28}Q200 ${40+i*28+o} ${330-o} ${60+i*28}"/>`).join('')}${[0,1,2,3,4,5,6].map(i=>`<path d="M${90+i*38} 50Q${110+i*38} 130 ${90+i*38} 200"/>`).join('')}</g><circle cx="200" cy="130" r="${20+o}" fill="#fff" opacity=".25"/>`;
 if(sec==='blast_military')return `<g fill="none" stroke="#fff" opacity=".8">${[24,48,72,96,120].map((r,i)=>`<circle cx="${200+o}" cy="130" r="${r}" stroke-width="${6-i}"/>`).join('')}</g><circle cx="${200+o}" cy="130" r="10" fill="#fff"/>`;
 if(sec==='medical_clinical')return `<path d="M60 135h80l22-48 40 96 28-60 20 12h90" fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" opacity=".9"/><rect x="${300+o}" y="40" width="14" height="46" rx="3" fill="#fff" opacity=".7"/><rect x="${284+o}" y="56" width="46" height="14" rx="3" fill="#fff" opacity=".7"/>`;
 return `<path d="M200 60c-34-18-86 6-84 48-24 10-30 44-4 58 4 24 36 36 58 22 8 6 20 8 30 2 22 14 54 2 58-22 26-14 20-48-4-58 2-42-50-66-84-48z" fill="none" stroke="#fff" stroke-width="6" opacity=".85" transform="translate(0 ${o/2})"/><path d="M200 66v118M160 100q20 10 40 0t40 0M155 140q22 12 45 0t45 0" fill="none" stroke="#fff" stroke-width="4" opacity=".55"/>`}
function art(sec,seed){const c=COL[sec]||COL.general_tbi,h=hash(seed||sec),a=(h%90)+20;
 const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 260"><defs><linearGradient id="g" gradientTransform="rotate(${a})"><stop offset="0" stop-color="${c[0]}"/><stop offset="1" stop-color="${c[1]}"/></linearGradient></defs><rect width="400" height="260" fill="url(#g)"/><circle cx="${40+h%80}" cy="${200-h%60}" r="90" fill="#fff" opacity=".06"/>${glyph(sec,h)}</svg>`;
 return 'data:image/svg+xml;utf8,'+encodeURIComponent(svg)}
document.addEventListener('error',e=>{const t=e.target;if(t.tagName==='IMG'&&t.dataset.sec&&!t.dataset.fb){t.dataset.fb=1;t.removeAttribute('referrerpolicy');t.src=art(t.dataset.sec,t.dataset.seed)}},true);
const img=(i,cls='thumb')=>`<img class="${cls}" loading="lazy" referrerpolicy="no-referrer" alt="" data-sec="${esc(i.section)}" data-seed="${esc(i.title)}" src="${esc(i.img&&/^https?:/.test(i.img)?i.img:art(i.section,i.title))}">`;


/* ---------- saved + seen state (kept in this browser) ---------- */
const UK='tbi_user_v1';let U={seen:{},saved:{},folders:['Read later','Cite','Ideas','Funding'],base:''},IDX={},REDRAW=null;
const loadU=()=>{try{const o=JSON.parse(store.get(UK)||'null');if(o)U={...U,...o,seen:o.seen||{},saved:o.saved||{},folders:o.folders&&o.folders.length?o.folders:U.folders}}catch(e){}};
const saveU=()=>store.set(UK,JSON.stringify(U));
const getItem=id=>IDX[id]||(U.saved[id]||{}).item;
const isNew=i=>U.seen[i.id]===1?false:U.seen[i.id]===0?true:i.first_seen>=U.base;
function acts(i){const sv=!!U.saved[i.id];return `<span class="acts"><button class="act star ${sv?'on':''}" data-a="star" data-id="${esc(i.id)}" title="Save for later">${sv?'★ Saved':'☆ Save'}</button><button class="act eye" data-a="eye" data-id="${esc(i.id)}" title="Mark seen / unseen">${isNew(i)?'● New':'✓ Seen'}</button></span>`}
function badges(){if(!D)return;const n=D.items.filter(i=>!NOFEED.includes(i.source_type)&&isNew(i)).length,sv=Object.keys(U.saved).length;
 document.querySelectorAll('[data-b="today"]').forEach(e=>e.textContent=n?(n>99?'99+':n):'');document.querySelectorAll('[data-b="saved"]').forEach(e=>e.textContent=sv||'');
 const nu=$('#nu');if(nu)nu.textContent=n;const ns=$('#ns');if(ns)ns.textContent=sv}
function sync(id){const it=getItem(id);if(!it)return;const nw=isNew(it),sv=!!U.saved[id];
 document.querySelectorAll('[data-id]').forEach(el=>{if(el.dataset.id!==id)return;
  if(el.classList.contains('card')||el.classList.contains('mini'))el.classList.toggle('unseen',nw);
  if(el.dataset.a==='star'){el.classList.toggle('on',sv);el.textContent=sv?'★ Saved':'☆ Save'}
  if(el.dataset.a==='eye')el.textContent=nw?'● New':'✓ Seen'});badges()}
function markSeen(id,v){U.seen[id]=v?1:0;saveU();sync(id)}
function toggleSave(id){const it=getItem(id);if(!it)return;if(U.saved[id])delete U.saved[id];else U.saved[id]={t:Date.now(),f:U.folders[0],item:it};saveU();sync(id);REDRAW&&REDRAW()}
document.addEventListener('click',e=>{const b=e.target.closest('.act');
 if(b){e.preventDefault();const id=b.dataset.id,it=getItem(id);if(b.dataset.a==='star')toggleSave(id);else if(it)markSeen(id,isNew(it));return}
 const a=e.target.closest('a[target=_blank]'),c=a&&a.closest('[data-id]');if(c){const it=getItem(c.dataset.id);if(it&&isNew(it))markSeen(c.dataset.id,true)}});
document.addEventListener('auxclick',e=>{const a=e.target.closest('a[target=_blank]'),c=a&&a.closest('[data-id]');if(c){const it=getItem(c.dataset.id);if(it&&isNew(it))markSeen(c.dataset.id,true)}});

/* ---------- cards ---------- */
function chips(i){return `<span class="chip sec" style="--c:var(--s-${i.section})">${esc(SEC[i.section]||i.section)}</span><span class="chip">${esc(TYPE[i.source_type]||i.source_type)}</span>`+
 i.groups.map(g=>`<span class="chip ${(D.groups.find(x=>x.id===g)||{}).mine?'mine':'g'}">${esc(gname(g).split(/ [-(]/)[0])}</span>`).join('')+
 i.tags.slice(0,3).map(t=>`<span class="chip">${esc(t)}</span>`).join('')+i.sports.slice(0,2).map(t=>`<span class="chip">${esc(t)}</span>`).join('')}
const link=i=>`<a href="${esc(safe(i.url))}" target="_blank" rel="noopener">${esc(i.title)}</a>`;
function card(i,lead){const body=`<div class="body"><h4>${link(i)}</h4><div class="meta">${esc(i.outlet)} · ${esc(i.date)}</div>${i.summary?`<p class="sum">${esc(i.summary)}</p>`:''}<div>${chips(i)}</div>${acts(i)}</div>`,u=isNew(i)?' unseen':'';
 return lead?`<div class="card lead${u}" data-id="${esc(i.id)}">${img(i)}${body}</div>`:`<div class="card${u}" data-id="${esc(i.id)}">${body}${img(i)}</div>`}
const mini=i=>`<div class="mini${isNew(i)?' unseen':''}" data-id="${esc(i.id)}">${img(i,'')}<div><a href="${esc(safe(i.url))}" target="_blank" rel="noopener">${esc(i.title)}</a><div class="meta">${esc(i.outlet)} · ${esc(i.date)}</div></div></div>`;

/* ---------- shared stats (topic co-occurrence, rising topics, white-space gaps) ---------- */
let ST=null;const K=(a,b)=>a<b?a+'|'+b:b+'|'+a;
const SHORT={contact_sport:'Sport',biomechanics_modeling:'Biomech',blast_military:'Blast',medical_clinical:'Medical',general_tbi:'General'};
const gshort=g=>g.name.split(/ [-(]/)[0];
function buildStats(){const N=D.items.length,tag={},sport={},pair={},ts={},tsec={},rec={},old={};
 const cut=new Date(D.today+'T00:00:00Z');cut.setUTCDate(cut.getUTCDate()-7);const cs=cut.toISOString().slice(0,10);
 for(const i of D.items){
  for(const t of i.tags){tag[t]=(tag[t]||0)+1;const m=tsec[t]=tsec[t]||{};m[i.section]=(m[i.section]||0)+1;const r=i.date>cs?rec:old;r[t]=(r[t]||0)+1}
  for(const s of i.sports)sport[s]=(sport[s]||0)+1;
  i.tags.forEach((a,x)=>{i.tags.slice(x+1).forEach(b=>{pair[K(a,b)]=(pair[K(a,b)]||0)+1});i.sports.forEach(s=>{ts[K(a,s)]=(ts[K(a,s)]||0)+1})})}
 const dom=t=>(Object.entries(tsec[t]||{}).sort((a,b)=>b[1]-a[1])[0]||['general_tbi'])[0];
 const rising=Object.keys(tag).map(t=>({t,rec:rec[t]||0,lift:((rec[t]||0)+1)/(((old[t]||0)/6)+1)})).filter(x=>x.rec>=3).sort((a,b)=>b.lift-a.lift);
 const gaps=[];const tl=Object.keys(tag),sl=Object.keys(sport).filter(s=>sport[s]>=3);
 tl.forEach((a,x)=>{tl.slice(x+1).forEach(b=>{const e=tag[a]*tag[b]/N,o=pair[K(a,b)]||0;if(e>=2&&o<=e*.4)gaps.push({a,b,bk:'t',obs:o,exp:e,score:(e-o)/Math.sqrt(e)})});
  sl.forEach(s=>{const e=tag[a]*sport[s]/N,o=ts[K(a,s)]||0;if(e>=1.5&&o<=e*.35)gaps.push({a,b:s,bk:'s',obs:o,exp:e,score:(e-o)/Math.sqrt(e)})})});
 gaps.sort((a,b)=>b.score-a.score);
 ST={N,tag,sport,pair,ts,dom,rising,gaps}}
const rOf=n=>5+Math.sqrt(n)*1.25;
function mapNodes(items,max){ /* compact topic map: 5 section hubs + top topics */
 const cnt={};items.forEach(i=>i.tags.forEach(t=>cnt[t]=(cnt[t]||0)+1));
 const top=Object.entries(cnt).sort((a,b)=>b[1]-a[1]).slice(0,max||12);
 const nodes=Object.keys(SEC).map(k=>({id:'c:'+k,kind:'sec',key:k,label:SHORT[k],always:true,r:15,color:`var(--s-${k})`,ring:'var(--fg)',title:SEC[k]}));
 const links=[];
 top.forEach(([t,n])=>{const d=ST.dom(t);nodes.push({id:'t:'+t,kind:'tag',key:t,label:t.length>15?t.slice(0,14)+'…':t,always:true,r:rOf(n)*.85,color:`var(--s-${d})`,title:`${t}: ${n}`});links.push({s:'t:'+t,t:'c:'+d,w:.9})});
 for(let a=0;a<top.length;a++)for(let b=a+1;b<top.length;b++){const c=ST.pair[K(top[a][0],top[b][0])]||0;if(c>=4)links.push({s:'t:'+top[a][0],t:'t:'+top[b][0],w:Math.min(.8,c/Math.min(top[a][1],top[b][1])*1.4)})}
 return{nodes,links}}

/* ---------- TODAY ---------- */
const S={q:'',sec:'',type:'',day:'',grp:'',tag:'',unseen:false,fav:false,group:''};
function today(){
 const items=D.items.filter(i=>!NOFEED.includes(i.source_type));const days=[...new Set(items.map(i=>i.first_seen))].sort().reverse().slice(0,21);
 if(!S.day&&S.day!=='all')S.day=days[0]||'all';
 $('#main').innerHTML=`<div class="page"><div class="toolbar">
  <input type="search" id="q" placeholder="Search stories…" value="${esc(S.q)}">
  <select id="fd">${days.map(d=>`<option value="${d}" ${S.day===d?'selected':''}>${d}${d===D.today?' (today)':''}</option>`).join('')}<option value="all" ${S.day==='all'?'selected':''}>All days</option></select>
  <select id="fs"><option value="">All sources</option>${FEED_TYPES.map(k=>`<option value="${k}" ${S.type===k?'selected':''}>${TYPE[k]}</option>`).join('')}</select>
  <select id="fg"><option value="">All groups</option>${D.groups.map(g=>`<option value="${g.id}" ${S.grp===g.id?'selected':''}>${esc(gshort(g))}</option>`).join('')}</select>
  <select id="fv"><option value="">Group: none</option><option value="sec" ${S.group==='sec'?'selected':''}>Group: section</option><option value="type" ${S.group==='type'?'selected':''}>Group: source</option></select>
  <button class="pill" id="tu" title="Only stories you have not opened">● New <b id="nu"></b></button><button class="pill" id="tf" title="Only stories you saved">★ Saved <b id="ns"></b></button><button class="pill" id="tm" title="Mark every story as seen">✓ Mark all seen</button>
  <div class="pills" id="pills"></div><span id="atag"></span><span class="meta" id="ct"></span></div>
 <div class="cols today"><section class="panel scrollpanel"><div class="scroll" id="feed"></div></section>
 <aside class="panel"><h3>Dashboard</h3><div class="scroll" id="rail"></div></aside></div></div>`;
 const base=()=>items.filter(i=>(S.day==='all'||i.first_seen===S.day)&&(!S.q||(i.title+' '+i.summary).toLowerCase().includes(S.q.toLowerCase()))&&(!S.unseen||isNew(i))&&(!S.fav||U.saved[i.id]));
 const pills=()=>{const b=base().filter(i=>(!S.type||i.source_type===S.type)&&(!S.grp||i.groups.includes(S.grp))&&(!S.tag||i.tags.includes(S.tag)));
  $('#pills').innerHTML=`<button class="pill ${!S.sec?'on':''}" data-v="">All <b>${b.length}</b></button>`+Object.entries(SEC).map(([k,v])=>`<button class="pill ${S.sec===k?'on':''}" data-v="${k}" style="--c:var(--s-${k})"><i class="dot"></i>${v} <b>${b.filter(i=>i.section===k).length}</b></button>`).join('');
  $('#pills').querySelectorAll('.pill').forEach(p=>p.onclick=()=>{S.sec=p.dataset.v;feed();pills()});
  $('#atag').innerHTML=S.tag?`<button class="chip x" id="xt">${esc(S.tag)} ✕</button>`:'';if(S.tag)$('#xt').onclick=()=>{S.tag='';feed();pills()}};
 const feed=()=>{const r=base().filter(i=>(!S.sec||i.section===S.sec)&&(!S.type||i.source_type===S.type)&&(!S.grp||i.groups.includes(S.grp))&&(!S.tag||i.tags.includes(S.tag)));
  $('#ct').textContent=`${r.length} stories`;const li=r.findIndex(i=>i.img);
  const ord=li>0?[r[li],...r.filter((_,k)=>k!==li)]:r;
  let html;
  if(S.group&&r.length){const kf=i=>S.group==='sec'?i.section:i.source_type,lab=k=>S.group==='sec'?SEC[k]:TYPE[k],m={};r.forEach(i=>(m[kf(i)]=m[kf(i)]||[]).push(i));
   html=Object.entries(m).sort((x,y)=>y[1].length-x[1].length).map(([k,a])=>`<h4 class="gh" style="--c:var(--s-${k},var(--mut))"><i class="dot"></i>${esc(lab(k)||k)} <b>${a.length}</b><span class="ghn">${a.filter(isNew).length?a.filter(isNew).length+' new':''}</span></h4><div class="feedgrid">${a.slice(0,60).map(i=>card(i)).join('')}</div>`).join('')}
  else html=r.length?`<div class="feedgrid">${ord.slice(0,200).map((i,k)=>card(i,k===0&&i.img)).join('')}</div>`:'<p class="empty">Nothing matches. Try another day or clear a filter.</p>';
  $('#feed').innerHTML=html;$('#feed').scrollTop=0};
 $('#q').oninput=e=>{S.q=e.target.value;feed();pills()};
 $('#fd').onchange=e=>{S.day=e.target.value;feed();pills()};$('#fs').onchange=e=>{S.type=e.target.value;feed();pills()};$('#fg').onchange=e=>{S.grp=e.target.value;feed();pills()};$('#fv').onchange=e=>{S.group=e.target.value;feed()};
 const tb=()=>{$('#tu').classList.toggle('on',S.unseen);$('#tf').classList.toggle('on',S.fav)};tb();
 $('#tu').onclick=()=>{S.unseen=!S.unseen;tb();feed();pills()};$('#tf').onclick=()=>{S.fav=!S.fav;tb();feed();pills()};
 $('#tm').onclick=()=>{D.items.forEach(i=>{if(isNew(i))U.seen[i.id]=1});saveU();feed();pills();badges()};
 const s=D.signals,dd=s.by_day.slice(-14),mx=Math.max(...dd.map(d=>d[1]),1);
 const gi=items.filter(i=>i.groups.length&&i.source_type!=='github').sort((a,b)=>(isMine(b)-isMine(a))||b.date.localeCompare(a.date)).slice(0,5);
 $('#rail').innerHTML=`<div class="row"><div class="stat"><b>${D.new_today}</b><span>new today</span></div><div class="stat"><b>${D.total_items}</b><span>in dataset</span></div></div>
  <div class="sec" style="margin-top:12px"><h4>Topic map <span class="hint">click a dot to filter</span></h4><div class="gbox" id="rg"></div></div>
  <div class="sec"><h4>Rising this week</h4>${ST.rising.slice(0,6).map(r=>`<button class="chip x" data-t="${esc(r.t)}">${esc(r.t)} ↑${r.lift.toFixed(1)}×</button>`).join('')||'<p class="empty">Needs about a week of history.</p>'}</div>
  <div class="sec"><h4>Items per day</h4><div class="spark">${dd.map(d=>`<i title="${d[0]}: ${d[1]}" style="height:${d[1]/mx*100}%"></i>`).join('')}</div></div>
  <div class="sec"><h4>From your groups</h4>${gi.length?gi.map(mini).join(''):'<p class="empty">No group items yet.</p>'}</div>`;
 $('#rail').querySelectorAll('[data-t]').forEach(b=>b.onclick=()=>{S.tag=b.dataset.t;feed();pills()});
 const mn=mapNodes(items.filter(i=>S.day==='all'||i.first_seen===S.day).length>20?items.filter(i=>S.day==='all'||i.first_seen===S.day):items,12);
 netgraph($('#rg'),{...mn,len:46,repel:1500,onSelect:n=>{if(!n){S.tag='';S.sec='';}else if(n.kind==='tag'){S.tag=n.key;S.sec=''}else{S.sec=n.key;S.tag=''}feed();pills()}});
 pills();feed();badges()}

/* ---------- GROUPS ---------- */
let GSEL=null;
function groups(){GSEL=GSEL||D.groups[0].id;
 $('#main').innerHTML=`<div class="cols two"><section class="panel filters"><h3>Groups</h3><div class="scroll" id="gl"></div></section><section class="panel scrollpanel"><h3 id="gt"></h3><div class="scroll"><div class="sec"><h4>Landscape <span class="hint">groups (squares) and the topics they publish on</span></h4><div class="gbox" id="gg"></div></div><div id="gd"></div></div></section></div>`;
 const gitems=g=>D.items.filter(i=>i.groups.includes(g.id)&&i.source_type!=='github');
 const nodes=[],links=[];const tc={};
 D.groups.forEach(g=>{const its=gitems(g);nodes.push({id:'g:'+g.id,kind:'group',key:g.id,shape:'square',r:11+Math.sqrt(its.length)*1.2,color:g.mine?'var(--acc)':'var(--link)',label:gshort(g),always:true,title:`${g.name}: ${its.length} items`});
  const c={};its.forEach(i=>i.tags.forEach(t=>c[t]=(c[t]||0)+1));Object.entries(c).filter(([,n])=>n>=2).forEach(([t,n])=>{tc[t]=(tc[t]||0)+n;links.push({s:'g:'+g.id,t:'t:'+t,w:Math.min(1,n/8)})})});
 Object.keys(tc).forEach(t=>nodes.push({id:'t:'+t,kind:'tag',key:t,r:rOf(ST.tag[t]||1)*.75,color:`var(--s-${ST.dom(t)})`,label:t.length>16?t.slice(0,15)+'…':t,always:true,title:t}));
 let API=null;
 const drawList=()=>{$('#gl').innerHTML=D.groups.map(g=>`<button class="fbtn ${GSEL===g.id?'on':''}" data-id="${g.id}"><span>${g.mine?'★ ':''}${esc(gshort(g))}</span><span class="n">${gitems(g).length}</span></button>`).join('');
  $('#gl').querySelectorAll('.fbtn').forEach(b=>b.onclick=()=>API?API.select('g:'+b.dataset.id):0)};
 const drawDetail=()=>{const g=D.groups.find(x=>x.id===GSEL);const its=gitems(g).sort((a,b)=>b.date.localeCompare(a.date));
  const gh=(D.github[g.id]||[]).slice(0,8);const pap=its.filter(i=>i.source_type==='paper'||i.source_type==='preprint'),news=its.filter(i=>!['paper','preprint'].includes(i.source_type));
  $('#gt').innerHTML=`<span>${esc(g.name)}</span><a href="${esc(safe(g.site))}" target="_blank" rel="noopener" class="meta">website ↗</a>`;
  $('#gd').innerHTML=(gh.length?`<div class="sec"><h4>GitHub activity</h4><div class="grid">${gh.map(r=>`<div class="gh"><a href="${esc(r.url)}" target="_blank" rel="noopener">${esc(r.name)}</a><div class="meta">pushed ${esc(r.pushed)} · ${esc(r.lang||'')} · ★${r.stars}</div><div class="meta">${esc(r.desc)}</div></div>`).join('')}</div></div>`:'')+
  `<div class="sec"><h4>Papers & preprints (${pap.length})</h4>${pap.length?`<div class="feedgrid">${pap.slice(0,14).map(i=>card(i)).join('')}</div>`:'<p class="empty">None found recently. PubMed author search only.</p>'}</div>
   <div class="sec"><h4>News & mentions (${news.length})</h4>${news.length?`<div class="feedgrid">${news.slice(0,14).map(i=>card(i)).join('')}</div>`:'<p class="empty">No news found recently.</p>'}</div>`};
 API=netgraph($('#gg'),{nodes,links,len:70,repel:2600,onSelect:n=>{if(n&&n.kind==='group'){GSEL=n.key;drawList();drawDetail()}}});
 drawList();drawDetail();API.select('g:'+GSEL)}

/* ---------- FUNDING ---------- */
const FS={q:'',mine:false,tag:'',grp:'',map:true};
function fcard(i){const m=i.summary.split(' | ');const amt=(m.find(x=>/^\$/.test(x))||'');
 return `<div class="card noimg${isNew(i)?' unseen':''}" data-id="${esc(i.id)}"><div><h4>${link(i)}</h4><div class="meta">${esc(i.outlet)} · ${esc(i.date)}${i.deadline?` · <b>closes ${esc(i.deadline)}</b>`:''}</div>
 <p class="sum">${esc(i.source_type==='grant'?m.slice(0,3).join(' · '):i.summary)}</p><div>${amt?`<span class="chip mine">${esc(amt)}</span>`:''}${i.groups.map(g=>`<span class="chip ${(D.groups.find(x=>x.id===g)||{}).mine?'mine':'g'}">${esc(gname(g).split(/ [-(]/)[0])}</span>`).join('')}<span class="chip">${esc(TYPE[i.source_type])}</span></div>${acts(i)}</div></div>`}
function funding(){
 $('#main').innerHTML=`<div class="page"><section class="panel fgraph ${FS.map?'':'shut'}"><h3><span>Funding map <span class="hint">calls, awards and news linked to topics and groups · click a dot to filter</span></span><button class="chip x" id="fgt">${FS.map?'Hide':'Show'}</button></h3><div class="gbox short" id="fgm"></div></section>
 <div class="cols three"><section class="panel scrollpanel"><h3><span id="c1"></span><span class="meta">grants.gov</span></h3><div class="fbar" id="fbar"></div><div class="scroll" id="f1"></div></section>
 <section class="panel scrollpanel"><h3><span id="c2"></span><span class="meta">NIH RePORTER · NSF</span></h3><div class="scroll" id="f2"></div></section>
 <section class="panel scrollpanel"><h3><span id="c3"></span><span class="meta">news</span></h3><div class="scroll" id="f3"></div></section></div></div>`;
 $('#fbar').innerHTML=`<input type="search" id="fq" placeholder="Search funding…" value="${esc(FS.q)}" style="margin:0"><button class="iconbtn" id="fm" style="width:auto;padding:0 12px;height:36px;font-size:12px" title="Only your lab and tracked groups">Groups</button><span id="fact"></span>`;
 const draw=()=>{const ok=i=>(!FS.q||(i.title+' '+i.summary).toLowerCase().includes(FS.q.toLowerCase()))&&(!FS.mine||i.groups.length)&&(!FS.tag||i.tags.includes(FS.tag))&&(!FS.grp||i.groups.includes(FS.grp));
  const f=t=>D.items.filter(i=>i.source_type===t&&ok(i)).sort((a,b)=>(isMine(b)-isMine(a))||b.date.localeCompare(a.date));
  const o=f('opportunity').sort((a,b)=>(a.deadline||'9999').localeCompare(b.deadline||'9999')),g=f('grant'),n=f('funding_news');
  $('#c1').textContent=`Open calls (${o.length})`;$('#c2').textContent=`Recent awards (${g.length})`;$('#c3').textContent=`Wins & funding news (${n.length})`;
  $('#fact').innerHTML=(FS.tag?`<button class="chip x" data-x="tag">${esc(FS.tag)} ✕</button>`:'')+(FS.grp?`<button class="chip x" data-x="grp">${esc(gname(FS.grp).split(/ [-(]/)[0])} ✕</button>`:'');
  $('#fact').querySelectorAll('[data-x]').forEach(b=>b.onclick=()=>{FS[b.dataset.x]='';draw()});
  $('#f1').innerHTML=(o.length?o.slice(0,80).map(fcard).join(''):'<p class="empty">No open calls found.</p>');
  $('#f2').innerHTML=g.length?g.slice(0,120).map(fcard).join(''):'<p class="empty">No awards found.</p>';
  $('#f3').innerHTML=n.length?n.slice(0,60).map(i=>card(i)).join(''):'<p class="empty">No funding news yet.</p>'};
 const tog=()=>{$('#fm').style.cssText+=FS.mine?';background:var(--acc);color:var(--acc-fg)':';background:var(--card);color:var(--fg)'};
 $('#fq').oninput=e=>{FS.q=e.target.value;draw()};
 $('#fm').onclick=()=>{FS.mine=!FS.mine;tog();draw()};tog();
 $('#fgt').onclick=()=>{FS.map=!FS.map;funding()};
 if(FS.map){const fi=D.items.filter(i=>['opportunity','grant','funding_news'].includes(i.source_type));
  const hubs={opportunity:['Open calls','var(--acc)'],grant:['Awards','var(--link)'],funding_news:['Funding news','var(--gold)']};
  const nodes=Object.entries(hubs).map(([k,[l,c]])=>({id:'h:'+k,kind:'hub',label:l,always:true,r:17,color:c,ring:'var(--fg)',title:l+': '+fi.filter(i=>i.source_type===k).length}));
  const links=[],tc={},gc={};
  fi.forEach(i=>{i.tags.forEach(t=>{tc[t]=(tc[t]||0)+1});i.groups.forEach(g=>{gc[g]=(gc[g]||0)+1})});
  const cnt={};fi.forEach(i=>{i.tags.forEach(t=>{const k='h:'+i.source_type+'|'+t;cnt[k]=(cnt[k]||0)+1});i.groups.forEach(g=>{const k='h:'+i.source_type+'|g:'+g;cnt[k]=(cnt[k]||0)+1})});
  Object.entries(tc).filter(([,n])=>n>=2).forEach(([t,n])=>nodes.push({id:'t:'+t,kind:'tag',key:t,r:rOf(n),color:`var(--s-${ST.dom(t)})`,label:t,always:true,title:`${t}: ${n}`}));
  Object.keys(gc).forEach(g=>nodes.push({id:'g:'+g,kind:'group',key:g,shape:'square',r:9,color:'var(--link)',label:gname(g).split(/ [-(]/)[0],always:true,title:gname(g)}));
  const ids=new Set(nodes.map(n=>n.id));
  Object.entries(cnt).forEach(([k,n])=>{const[h,x]=k.split('|');const t=x.startsWith('g:')?x:'t:'+x;if(ids.has(t))links.push({s:h,t,w:Math.min(1,n/12)})});
  netgraph($('#fgm'),{nodes,links,len:70,repel:3200,onSelect:n=>{FS.tag=n&&n.kind==='tag'?n.key:'';FS.grp=n&&n.kind==='group'?n.key:'';draw()}})}
 draw()}

/* ---------- BRAINSTORM ---------- */
let BTAB='research';const BL={co:true,sports:true,ideas:true,groups:false,gaps:true};
function brainstorm(){const st=ST;
 $('#main').innerHTML=`<div class="cols brain"><section class="panel"><h3><span>Idea map</span><span class="meta">drag dots · hover to trace links · click to inspect</span></h3><div class="layers" id="ly"></div><div class="gbox grow" id="bgraph"></div>
  <div class="legend"><span><i class="lg c"></i>topic (color = section)</span><span><i class="lg h"></i>sport</span><span><i class="lg d r"></i>research idea</span><span><i class="lg d m"></i>market idea</span><span><i class="lg s"></i>group</span><span><i class="lg g"></i>white space</span></div></section>
 <div class="stackcol"><section class="panel scrollpanel"><h3>Inspector</h3><div class="scroll" id="sel"></div></section>
 <section class="panel scrollpanel"><h3>Ideas for you</h3><div class="scroll"><div class="seg"><button data-t="research">Research</button><button data-t="market">Market &amp; translation</button></div><div id="ib"></div></div></section></div></div>`;
 const all=['research','market'].flatMap(k=>IDEAS[k].map((x,i)=>({...x,k,nid:`i:${k}${i}`})));
 let API=null;
 const LAY=[['co','Topic links'],['sports','Sports'],['ideas','Ideas'],['groups','Groups'],['gaps','White space']];
 const lay=()=>{$('#ly').innerHTML=LAY.map(([k,v])=>`<button class="chip x ${BL[k]?'on':''}" data-k="${k}">${v}</button>`).join('');
  $('#ly').querySelectorAll('button').forEach(b=>b.onclick=()=>{BL[b.dataset.k]=!BL[b.dataset.k];lay();build()})};
 const helpHtml=()=>`<p class="meta">Each dot is a topic seen in the news and papers; larger = more coverage. Lines connect topics that appear together. <b>Dashed red lines are white space</b>: pairs that co-occur far less than chance. Diamonds are the research and market ideas, attached to the topics they build on.</p>
  <div class="sec"><h4>Rising this week</h4>${st.rising.slice(0,8).map(r=>`<button class="chip x" data-n="t:${esc(r.t)}">${esc(r.t)} ↑${r.lift.toFixed(1)}×</button>`).join('')||'<p class="empty">Needs about a week of history.</p>'}</div>
  <div class="sec"><h4>White space (possible gaps)</h4>${st.gaps.slice(0,8).map(g=>`<div class="gap" data-n="t:${esc(g.a)}"><b>${esc(g.a)}</b> + <b>${esc(g.b)}</b> <span class="meta">seen ${g.obs}, expected ${g.exp.toFixed(1)}</span></div>`).join('')||'<p class="empty">Needs more data.</p>'}</div>`;
 const wire=()=>{$('#sel').querySelectorAll('[data-n]').forEach(b=>b.onclick=()=>API&&API.node(b.dataset.n)?API.select(b.dataset.n):0)};
 const show=n=>{const el=$('#sel');
  if(!n){el.innerHTML=helpHtml();return wire()}
  if(n.kind==='idea'){const x=all.find(a=>a.nid===n.id);
   el.innerHTML=`<h4 class="ih">${esc(x.title)}</h4><div><span class="chip ${x.k==='research'?'mine':'g'}">${x.k==='research'?'Research idea':'Market idea'}</span></div><p>${esc(x.body)}</p><div class="sec"><h4>Builds on</h4>${x.tags.map(t=>`<button class="chip x" data-n="t:${esc(t)}">${esc(t)} (${st.tag[t]||0})</button>`).join('')}</div>`;return wire()}
  if(n.kind==='group'){const g=D.groups.find(x=>x.id===n.key),its=D.items.filter(i=>i.groups.includes(g.id)&&i.source_type!=='github').sort((a,b)=>b.date.localeCompare(a.date)).slice(0,5);
   el.innerHTML=`<h4 class="ih">${esc(g.name)}</h4><p class="meta">${its.length} recent items · <a href="#groups" id="gg2">open in Groups</a></p>${its.map(mini).join('')}`;$('#gg2').onclick=()=>{GSEL=g.id};return}
  const key=n.key,isS=n.kind==='sport',its=D.items.filter(i=>(isS?i.sports:i.tags).includes(key)).sort((a,b)=>b.date.localeCompare(a.date));
  const ideas=all.filter(a=>a.tags.includes(key)),gp=st.gaps.filter(g=>g.a===key||g.b===key).slice(0,5);
  const co=Object.keys(st.tag).filter(t=>t!==key&&(st.pair[K(key,t)]||0)>0).sort((a,b)=>st.pair[K(key,b)]-st.pair[K(key,a)]).slice(0,6);
  el.innerHTML=`<h4 class="ih">${esc(key)}</h4><div class="meta">${its.length} items${isS?'':` · mostly ${esc(SEC[st.dom(key)]||'')}`}${(st.rising.find(r=>r.t===key)||{}).lift?` · rising ↑${st.rising.find(r=>r.t===key).lift.toFixed(1)}×`:''}</div>
   ${co.length?`<div class="sec"><h4>Often seen with</h4>${co.map(t=>`<button class="chip x" data-n="t:${esc(t)}">${esc(t)} ${st.pair[K(key,t)]}</button>`).join('')}</div>`:''}
   ${gp.length?`<div class="sec"><h4>White space</h4>${gp.map(g=>{const o=g.a===key?g.b:g.a;return `<div class="gap" data-n="${g.bk==='s'&&g.a!==key?'t:'+g.a:(g.bk==='s'?'s:'+g.b:'t:'+o)}">${esc(key)} + <b>${esc(o)}</b> <span class="meta">seen ${g.obs}, expected ${g.exp.toFixed(1)}</span></div>`}).join('')}</div>`:''}
   ${ideas.length?`<div class="sec"><h4>Ideas on this topic</h4>${ideas.map(a=>`<button class="chip x" data-n="${a.nid}">${esc(a.title)}</button>`).join('')}</div>`:''}
   <div class="sec"><h4>Latest items</h4>${its.slice(0,5).map(mini).join('')||'<p class="empty">No items yet: an unexplored area.</p>'}</div>`;wire()};
 const build=()=>{const nodes=[],links=[],has=new Set();
  const add=n=>{nodes.push(n);has.add(n.id)};
  Object.keys(st.tag).forEach(t=>add({id:'t:'+t,kind:'tag',key:t,label:t,always:true,r:rOf(st.tag[t]),color:`var(--s-${st.dom(t)})`,title:`${t}: ${st.tag[t]} items`}));
  if(BL.co)Object.entries(st.pair).forEach(([k,c])=>{if(c<3)return;const[a,b]=k.split('|');links.push({s:'t:'+a,t:'t:'+b,w:Math.min(1,c/(Math.min(st.tag[a],st.tag[b])*.7))})});
  if(BL.sports)Object.entries(st.sport).filter(([,n])=>n>=3).forEach(([s,n])=>{add({id:'s:'+s,kind:'sport',key:s,shape:'hex',label:s,always:true,r:rOf(n)*.85,color:'var(--mut)',title:`${s}: ${n} items`});
   Object.keys(st.tag).forEach(t=>{const c=st.ts[K(t,s)]||0;if(c>=3)links.push({s:'s:'+s,t:'t:'+t,w:Math.min(1,c/(n*.6)),color:'var(--mut)'})})});
  if(BL.groups)D.groups.forEach(g=>{const its=D.items.filter(i=>i.groups.includes(g.id)&&i.source_type!=='github'),c={};its.forEach(i=>i.tags.forEach(t=>c[t]=(c[t]||0)+1));
   add({id:'g:'+g.id,kind:'group',key:g.id,shape:'square',label:gshort(g),always:true,r:10,color:g.mine?'var(--acc)':'var(--link)',title:g.name});
   Object.entries(c).filter(([,n])=>n>=2).forEach(([t,n])=>links.push({s:'g:'+g.id,t:'t:'+t,w:Math.min(1,n/8),color:'var(--link)'}))});
  if(BL.ideas)all.forEach(a=>{add({id:a.nid,kind:'idea',shape:'diamond',label:a.title.length>24?a.title.slice(0,23)+'…':a.title,r:7.5,color:a.k==='research'?'var(--acc)':'var(--gold)',title:a.title});
   a.tags.forEach(t=>{if(!has.has('t:'+t))add({id:'t:'+t,kind:'tag',key:t,label:t,always:true,r:6,ghost:true,color:'var(--mut)',title:t+': no coverage yet'});links.push({s:a.nid,t:'t:'+t,w:.7,color:a.k==='research'?'var(--acc)':'var(--gold)'})})});
  if(BL.gaps)st.gaps.slice(0,9).forEach(g=>{const b=(g.bk==='s'?'s:':'t:')+g.b;if(has.has('t:'+g.a)&&has.has(b))links.push({s:'t:'+g.a,t:b,dash:true,color:'var(--acc)',soft:true,w:.1})});
  API=netgraph($('#bgraph'),{nodes,links,len:58,repel:2600,onSelect:show});show(null)};
 const ib=()=>{$('#ib').innerHTML=IDEAS[BTAB].map((x,i)=>`<div class="card noimg idea" data-n="i:${BTAB}${i}"><div><h4>${esc(x.title)}</h4><p class="sum" style="-webkit-line-clamp:unset">${esc(x.body)}</p>${x.tags.map(t=>`<span class="chip">${esc(t)}</span>`).join('')}</div></div>`).join('');
  document.querySelectorAll('.seg button').forEach(b=>b.classList.toggle('on',b.dataset.t===BTAB));
  $('#ib').querySelectorAll('.idea').forEach(c=>c.onclick=()=>API&&API.node(c.dataset.n)?API.select(c.dataset.n):0)};
 document.querySelectorAll('.seg button').forEach(b=>b.onclick=()=>{BTAB=b.dataset.t;ib()});
 lay();build();ib()}

/* ---------- SAVED ---------- */
let SV={f:'',sec:''};
function saved(){
 $('#main').innerHTML=`<div class="cols two"><section class="panel filters"><h3>Saved</h3><div class="scroll" id="sl"></div></section><section class="panel scrollpanel"><h3><span id="st2"></span><span class="meta">kept in this browser · export to back up</span></h3><div class="scroll" id="sd"></div></section></div>`;
 const draw=()=>{const A=Object.entries(U.saved).map(([id,v])=>({...v,id})),F=U.folders;if(SV.f&&!F.includes(SV.f))SV.f='';
  const inF=A.filter(x=>!SV.f||x.f===SV.f);
  $('#sl').innerHTML=`<div class="sec"><h4>Folders</h4><button class="fbtn ${!SV.f?'on':''}" data-f="">All saved<span class="n">${A.length}</span></button>${F.map(f=>`<button class="fbtn ${SV.f===f?'on':''}" data-f="${esc(f)}">${esc(f)}<span class="n">${A.filter(x=>x.f===f).length}</span></button>`).join('')}
   <button class="chip x" id="nf">+ New folder</button>${SV.f&&SV.f!==F[0]?`<button class="chip x" id="df">Delete “${esc(SV.f)}”</button>`:''}</div>
   <div class="sec"><h4>Topic</h4><button class="fbtn ${!SV.sec?'on':''}" data-s="">All topics</button>${Object.entries(SEC).map(([k,v])=>`<button class="fbtn ${SV.sec===k?'on':''}" data-s="${k}"><span><i class="dot" style="background:var(--s-${k})"></i>${v}</span><span class="n">${inF.filter(x=>x.item.section===k).length}</span></button>`).join('')}</div>
   <div class="sec"><h4>Backup</h4><p class="meta">Saved stories live only in this browser. Export a file to move them to another device.</p><button class="btn" id="ex" style="border:0;cursor:pointer">Export</button><label class="btn" style="cursor:pointer">Import<input type="file" id="im" accept=".json" hidden></label></div>`;
  $('#sl').querySelectorAll('[data-f]').forEach(b=>b.onclick=()=>{SV.f=b.dataset.f;draw()});$('#sl').querySelectorAll('[data-s]').forEach(b=>b.onclick=()=>{SV.sec=b.dataset.s;draw()});
  $('#nf').onclick=()=>{const n=(prompt('New folder name')||'').trim();if(n&&!U.folders.includes(n)){U.folders.push(n);saveU();SV.f=n;draw()}};
  if($('#df'))$('#df').onclick=()=>{if(confirm(`Delete folder “${SV.f}”? Its stories move to “${F[0]}”.`)){Object.values(U.saved).forEach(v=>{if(v.f===SV.f)v.f=F[0]});U.folders=F.filter(f=>f!==SV.f);saveU();SV.f='';draw()}};
  $('#ex').onclick=()=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify({saved:U.saved,folders:U.folders,seen:U.seen,base:U.base})],{type:'application/json'}));a.download='tbi_saved.json';a.click()};
  $('#im').onchange=e=>{const f=e.target.files[0];if(!f)return;f.text().then(t=>{try{const o=JSON.parse(t);Object.entries(o.saved||{}).forEach(([k,v])=>{if(!U.saved[k]||v.t>U.saved[k].t)U.saved[k]=v});(o.folders||[]).forEach(x=>{if(!U.folders.includes(x))U.folders.push(x)});Object.entries(o.seen||{}).forEach(([k,v])=>{if(U.seen[k]===undefined)U.seen[k]=v});Object.values(U.saved).forEach(v=>{if(!U.folders.includes(v.f))v.f=U.folders[0]});saveU();draw();badges()}catch(x){alert('Not a valid export file.')}})};
  const L=inF.filter(x=>!SV.sec||x.item.section===SV.sec).sort((a,b)=>b.t-a.t);
  $('#st2').textContent=`${SV.f||'All saved'} · ${L.length}`;
  $('#sd').innerHTML=L.length?`<div class="feedgrid">${L.map(x=>`<div class="svitem">${card(x.item)}<div class="svbar"><label class="meta">Folder <select class="fsel" data-id="${esc(x.id)}">${U.folders.map(f=>`<option ${f===x.f?'selected':''}>${esc(f)}</option>`).join('')}</select></label><span class="meta">saved ${new Date(x.t).toLocaleDateString()}</span></div></div>`).join('')}</div>`:'<p class="empty">Nothing here yet. Click ☆ Save on any story and it shows up in this tab.</p>';
  $('#sd').querySelectorAll('.fsel').forEach(sel=>sel.onchange=()=>{U.saved[sel.dataset.id].f=sel.value;saveU();draw()})};
 REDRAW=draw;draw();badges()}

/* ---------- BACKGROUND ---------- */
function background(){$('#main').innerHTML=`<div class="cols two"><section class="panel filters"><h3>Contents</h3><div class="scroll toc">${BG.map((s,k)=>`<a href="#background" data-k="${k}">${esc(s.title)}</a>`).join('')}</div></section><section class="panel scrollpanel"><h3>Background</h3><div class="scroll" id="bgc">${BG.map((s,k)=>`<div class="sec" id="bg${k}"><h4>${esc(s.title)}</h4>${s.entries.map(e=>`<div class="card noimg"><div class="bgentry" style="margin:0"><h4>${e.url?`<a href="${esc(safe(e.url))}" target="_blank" rel="noopener">${esc(e.title)} ↗</a>`:esc(e.title)}</h4><p>${esc(e.body)}</p></div></div>`).join('')}</div>`).join('')}</div></section></div>`;
 document.querySelectorAll('.toc a').forEach(a=>a.onclick=e=>{e.preventDefault();$('#bg'+a.dataset.k).scrollIntoView({behavior:'smooth',block:'start'})})}

/* ---------- DATASET ---------- */
function dataset(){const rows=D.items;const c=k=>Object.entries(rows.reduce((a,i)=>(a[i[k]]=(a[i[k]]||0)+1,a),{})).sort((a,b)=>b[1]-a[1]);
 const types=c('source_type').map(x=>x[0]),secs=Object.keys(SEC);const cell={};rows.forEach(i=>{const k=i.section+'|'+i.source_type;cell[k]=(cell[k]||0)+1});const mx=Math.max(...Object.values(cell),1);
 $('#main').innerHTML=`<div class="cols two"><section class="panel filters"><h3>Dataset</h3><div class="scroll"><p class="meta">Every item is auto-categorized (section, tags, sports, groups). Full history, de-duplicated:</p><a class="btn" href="${URL.createObjectURL(new Blob(['\ufeff'+DL.csv],{type:'text/csv'}))}" download="tbi_dataset.csv">dataset.csv</a><a class="btn" href="${URL.createObjectURL(new Blob([DL.jsonl],{type:'application/x-ndjson'}))}" download="tbi_dataset.jsonl">dataset.jsonl</a>
 <div class="sec"><h4>Items by day &amp; section</h4><div id="tl"></div></div>
 <div class="sec"><h4>Section × source</h4><div class="heat" style="grid-template-columns:70px repeat(${secs.length},1fr)"><span></span>${secs.map(k=>`<span class="hh" title="${esc(SEC[k])}">${SHORT[k]}</span>`).join('')}${types.map(t=>`<span class="hl2">${esc(TYPE[t]||t)}</span>`+secs.map(k=>{const n=cell[k+'|'+t]||0;return `<span class="hc" title="${esc(SEC[k])} · ${esc(TYPE[t]||t)}: ${n}" style="background:color-mix(in srgb,var(--s-${k}) ${Math.round(8+n/mx*85)}%,transparent)">${n||''}</span>`}).join('')).join('')}</div></div></div></section>
 <section class="panel scrollpanel"><h3>Latest items<span class="meta">${D.total_items} total</span></h3><div class="scroll" style="padding:0"><table class="tbl"><tr><th>Date</th><th>Section</th><th>Type</th><th>Title</th><th>Tags</th></tr>${rows.slice(0,400).map(i=>`<tr><td>${esc(i.date)}</td><td>${esc(SEC[i.section]||i.section)}</td><td>${esc(i.source_type)}</td><td><a href="${esc(safe(i.url))}" target="_blank" rel="noopener">${esc(i.title)}</a></td><td>${esc(i.tags.join(', '))}</td></tr>`).join('')}</table></div></section></div>`;
 const by={};rows.forEach(i=>{(by[i.date]=by[i.date]||{})[i.section]=((by[i.date]||{})[i.section]||0)+1});
 const ds=Object.keys(by).sort().slice(-30);
 stackbars($('#tl'),ds.map(d=>({label:d,parts:secs.map(k=>[by[d][k]||0,`var(--s-${k})`,SEC[k]])})),{h:150})}

/* ---------- boot ---------- */
function route(){REDRAW=null;const h=(location.hash||'#today').slice(1);$('#nav').innerHTML=TABS.map(([k,v,ic])=>`<a href="#${k}" class="${k===h?'on':''}"><span class="ic">${ic}</span><span class="tx">${v}</span>${k==='today'||k==='saved'?`<span class="bd" data-b="${k}"></span>`:''}</a>`).join('');badges();({today,groups,funding,brainstorm,saved,background,dataset}[h]||today)()}
$('#theme').onclick=()=>{const r=document.documentElement;const dark=r.dataset.theme?r.dataset.theme==='dark':matchMedia('(prefers-color-scheme: dark)').matches;const n=dark?'light':'dark';r.dataset.theme=n;store.set('theme',n)};
/* ---------- password gate (data is AES-256-GCM encrypted; decrypted in this browser only) ---------- */
const b64=t=>Uint8Array.from(atob(t),c=>c.charCodeAt(0));
async function decryptBundle(text,pw){const o=JSON.parse(text);
 const km=await crypto.subtle.importKey('raw',new TextEncoder().encode(pw),'PBKDF2',false,['deriveKey']);
 const key=await crypto.subtle.deriveKey({name:'PBKDF2',salt:b64(o.salt),iterations:o.iter,hash:'SHA-256'},km,{name:'AES-GCM',length:256},false,['decrypt']);
 const pt=await crypto.subtle.decrypt({name:'AES-GCM',iv:b64(o.iv)},key,b64(o.ct));
 return JSON.parse(new TextDecoder().decode(pt))}
function start(b){D=b.latest;buildStats();IDX=Object.fromEntries(D.items.map(i=>[i.id,i]));loadU();if(!U.base){U.base=D.today;saveU()}Object.keys(U.seen).forEach(k=>{if(!IDX[k]&&!U.saved[k])delete U.seen[k]});IDEAS=b.ideas;BG=b.background;DL={csv:b.csv,jsonl:b.jsonl};
 $('#sub').textContent=`Updated ${D.generated} · ${D.new_today} new today`;$('#nav').style.visibility='visible';$('#lock').hidden=false;route();addEventListener('hashchange',route);let rw=innerWidth,rt;addEventListener('resize',()=>{clearTimeout(rt);rt=setTimeout(()=>{if(Math.abs(innerWidth-rw)>40){rw=innerWidth;route()}},300)})}
function gate(text){
 const saved=store.get('pw')||(()=>{try{return sessionStorage.getItem('pw')}catch(e){return null}})();
 const form=(msg)=>{$('#nav').style.visibility='hidden';$('#lock').hidden=true;
  $('#main').innerHTML=`<div style="margin:auto;max-width:340px;width:100%"><form class="panel" id="lf" style="padding:22px;gap:12px"><div style="font:700 22px Georgia,serif">Private newspaper</div><div class="meta">Enter the password to unlock.</div>
  <input type="password" id="pw" placeholder="Password" autocomplete="current-password" autofocus style="margin:0"><label class="meta"><input type="checkbox" id="rm"> Remember on this device</label>
  <button class="btn" style="border:0;cursor:pointer;margin:0" type="submit">Unlock</button><div id="err" class="meta" style="color:var(--acc)">${esc(msg||'')}</div></form></div>`;
  $('#main').style.display='flex';$('#lf').onsubmit=async e=>{e.preventDefault();const pw=$('#pw').value;$('#err').textContent='Decrypting…';
   try{const b=await decryptBundle(text,pw);if($('#rm').checked)store.set('pw',pw);else try{sessionStorage.setItem('pw',pw)}catch(x){}
    $('#main').style.display='';start(b)}catch(x){$('#err').textContent='Wrong password.'}}};
 if(saved)decryptBundle(text,saved).then(start).catch(()=>{store.set('pw','');form('Saved password no longer works.')});else form()}
$('#lock').onclick=()=>{store.set('pw','');try{sessionStorage.removeItem('pw')}catch(e){}location.reload()};
fetch('data/bundle.enc',{cache:'no-cache'}).then(r=>{if(!r.ok)throw new Error('data not published yet');return r.text()}).then(gate)
 .catch(e=>{$('#main').innerHTML='<p class="empty">Could not load data: '+esc(e.message)+'.</p>'});
