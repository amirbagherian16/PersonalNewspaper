const TABS=[['today','Today'],['groups','Groups'],['brainstorm','Brainstorm'],['background','Background'],['dataset','Dataset']];
const SEC={contact_sport:'Contact sport',biomechanics_modeling:'Biomechanics & modeling',blast_military:'Blast & military',medical_clinical:'Medical & clinical',general_tbi:'General TBI'};
const TYPE={paper:'Paper',preprint:'Preprint',news:'News',linkedin:'LinkedIn',social:'Social',github:'GitHub'};
const COL={contact_sport:['#f08c3a','#8a2d12'],biomechanics_modeling:['#4aa3d8','#14375e'],blast_military:['#b56ab0','#3d1840'],medical_clinical:['#3bbd8e','#0d4a3a'],general_tbi:['#8f95e8','#2a2c66']};
const $=s=>document.querySelector(s);let D=null,IDEAS=null,BG=null;
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

/* ---------- cards ---------- */
function chips(i){return `<span class="chip sec" style="--c:var(--s-${i.section})">${esc(SEC[i.section]||i.section)}</span><span class="chip">${esc(TYPE[i.source_type]||i.source_type)}</span>`+
 i.groups.map(g=>`<span class="chip ${(D.groups.find(x=>x.id===g)||{}).mine?'mine':'g'}">${esc(gname(g).split(/ [-(]/)[0])}</span>`).join('')+
 i.tags.slice(0,3).map(t=>`<span class="chip">${esc(t)}</span>`).join('')+i.sports.slice(0,2).map(t=>`<span class="chip">${esc(t)}</span>`).join('')}
const link=i=>`<a href="${esc(safe(i.url))}" target="_blank" rel="noopener">${esc(i.title)}</a>`;
function card(i,lead){const body=`<div class="body"><h4>${link(i)}</h4><div class="meta">${esc(i.outlet)} · ${esc(i.date)}</div>${i.summary?`<p class="sum">${esc(i.summary)}</p>`:''}<div>${chips(i)}</div></div>`;
 return lead?`<div class="card lead">${img(i)}${body}</div>`:`<div class="card">${body}${img(i)}</div>`}
const mini=i=>`<div class="mini">${img(i,'')}<div><a href="${esc(safe(i.url))}" target="_blank" rel="noopener">${esc(i.title)}</a><div class="meta">${esc(i.outlet)} · ${esc(i.date)}</div></div></div>`;

/* ---------- TODAY ---------- */
const S={q:'',sec:'',type:'',day:'',grp:''};
function today(){
 const items=D.items;const days=[...new Set(items.map(i=>i.first_seen))].sort().reverse().slice(0,21);
 if(!S.day&&S.day!=='all')S.day=days[0]||'all';
 $('#main').innerHTML=`<div class="cols">
 <section class="panel filters"><h3>Browse</h3><div class="scroll" id="fl"></div></section>
 <section class="panel scrollpanel"><h3><span id="ct"></span><span class="meta">scroll ↓</span></h3><div class="scroll" id="feed"></div></section>
 <aside class="panel"><h3>Dashboard</h3><div class="scroll" id="rail"></div></aside></div>`;
 const base=()=>items.filter(i=>(S.day==='all'||i.first_seen===S.day)&&(!S.q||(i.title+' '+i.summary).toLowerCase().includes(S.q.toLowerCase())));
 const filters=()=>{const b=base();const cnt=(k,v)=>b.filter(i=>i[k]===v&&(k==='section'?true:true)).length;
  $('#fl').innerHTML=`<input type="search" id="q" placeholder="Search…" value="${esc(S.q)}">
  <select id="fd">${days.map(d=>`<option value="${d}" ${S.day===d?'selected':''}>${d}${d===D.today?' (today)':''}</option>`).join('')}<option value="all" ${S.day==='all'?'selected':''}>All days (45d)</option></select>
  <div class="sec"><h4>Section</h4><button class="fbtn ${!S.sec?'on':''}" data-k="sec" data-v="">All <span class="n">${b.length}</span></button>${Object.entries(SEC).map(([k,v])=>`<button class="fbtn ${S.sec===k?'on':''}" data-k="sec" data-v="${k}"><span><i class="dot" style="background:var(--s-${k})"></i>${v}</span><span class="n">${b.filter(i=>i.section===k).length}</span></button>`).join('')}</div>
  <div class="sec"><h4>Source</h4><button class="fbtn ${!S.type?'on':''}" data-k="type" data-v="">All</button>${Object.entries(TYPE).map(([k,v])=>`<button class="fbtn ${S.type===k?'on':''}" data-k="type" data-v="${k}">${v}<span class="n">${b.filter(i=>i.source_type===k).length}</span></button>`).join('')}</div>
  <div class="sec"><h4>Group</h4><button class="fbtn ${!S.grp?'on':''}" data-k="grp" data-v="">Any</button>${D.groups.map(g=>`<button class="fbtn ${S.grp===g.id?'on':''}" data-k="grp" data-v="${g.id}">${esc(g.name.split(/ [-(]/)[0])}<span class="n">${b.filter(i=>i.groups.includes(g.id)).length}</span></button>`).join('')}</div>`;
  $('#q').oninput=e=>{S.q=e.target.value;feed();const p=e.target.selectionStart;filters();$('#q').focus();$('#q').setSelectionRange(p,p)};
  $('#fd').onchange=e=>{S.day=e.target.value;feed();filters()};
  $('#fl').querySelectorAll('.fbtn').forEach(b=>b.onclick=()=>{S[b.dataset.k]=b.dataset.v;feed();filters()})};
 const feed=()=>{const r=base().filter(i=>(!S.sec||i.section===S.sec)&&(!S.type||i.source_type===S.type)&&(!S.grp||i.groups.includes(S.grp)));
  $('#ct').textContent=`${r.length} stories`;const li=r.findIndex(i=>i.img);
  const ord=li>0?[r[li],...r.filter((_,k)=>k!==li)]:r;
  $('#feed').innerHTML=r.length?ord.slice(0,200).map((i,k)=>card(i,k===0&&i.img)).join(''):'<p class="empty">Nothing matches. Try another day or clear a filter.</p>';$('#feed').scrollTop=0};
 const rail=()=>{const s=D.signals;const days=s.by_day.slice(-14),mx=Math.max(...days.map(d=>d[1]),1);
  const gi=items.filter(i=>i.groups.length&&i.source_type!=='github').sort((a,b)=>(isMine(b)-isMine(a))||b.date.localeCompare(a.date)).slice(0,5);
  $('#rail').innerHTML=`<div class="row"><div class="stat"><b>${D.new_today}</b><span>new today</span></div><div class="stat"><b>${D.total_items}</b><span>in dataset</span></div></div>
  <div class="sec" style="margin-top:12px"><h4>Items per day</h4><div class="spark">${days.map(d=>`<i title="${d[0]}: ${d[1]}" style="height:${d[1]/mx*100}%"></i>`).join('')}</div></div>
  <div class="sec"><h4>Trending topics</h4>${s.tag_counts.slice(0,10).map(([t,c])=>`<span class="chip">${esc(t)} · ${c}</span>`).join('')}</div>
  <div class="sec"><h4>From your groups</h4>${gi.length?gi.map(mini).join(''):'<p class="empty">No group items yet.</p>'}</div>`};
 filters();feed();rail()}

/* ---------- GROUPS ---------- */
let GSEL=null;
function groups(){GSEL=GSEL||D.groups[0].id;
 $('#main').innerHTML=`<div class="cols two"><section class="panel filters"><h3>Groups</h3><div class="scroll" id="gl"></div></section><section class="panel scrollpanel"><h3 id="gt"></h3><div class="scroll" id="gd"></div></section></div>`;
 const draw=()=>{$('#gl').innerHTML=D.groups.map(g=>{const n=D.items.filter(i=>i.groups.includes(g.id)&&i.source_type!=='github').length;return `<button class="fbtn ${GSEL===g.id?'on':''}" data-id="${g.id}"><span>${g.mine?'★ ':''}${esc(g.name.split(/ [-(]/)[0])}</span><span class="n">${n}</span></button>`}).join('');
  $('#gl').querySelectorAll('.fbtn').forEach(b=>b.onclick=()=>{GSEL=b.dataset.id;draw()});
  const g=D.groups.find(x=>x.id===GSEL);const its=D.items.filter(i=>i.groups.includes(g.id)&&i.source_type!=='github').sort((a,b)=>b.date.localeCompare(a.date));
  const gh=(D.github[g.id]||[]).slice(0,8);const pap=its.filter(i=>i.source_type==='paper'||i.source_type==='preprint'),news=its.filter(i=>!['paper','preprint'].includes(i.source_type));
  $('#gt').innerHTML=`<span>${esc(g.name)}</span><a href="${esc(safe(g.site))}" target="_blank" rel="noopener" class="meta">website ↗</a>`;
  $('#gd').innerHTML=(gh.length?`<div class="sec"><h4>GitHub activity</h4><div class="grid">${gh.map(r=>`<div class="gh"><a href="${esc(r.url)}" target="_blank" rel="noopener">${esc(r.name)}</a><div class="meta">pushed ${esc(r.pushed)} · ${esc(r.lang||'')} · ★${r.stars}</div><div class="meta">${esc(r.desc)}</div></div>`).join('')}</div></div>`:'')+
  `<div class="sec"><h4>Papers & preprints (${pap.length})</h4>${pap.length?pap.slice(0,15).map(i=>card(i)).join(''):'<p class="empty">None found recently. PubMed author search only.</p>'}</div>
   <div class="sec"><h4>News & mentions (${news.length})</h4>${news.length?news.slice(0,15).map(i=>card(i)).join(''):'<p class="empty">No news found recently.</p>'}</div>`;$('#gd').scrollTop=0};
 draw()}

/* ---------- BRAINSTORM ---------- */
let BTAB='research';
function brainstorm(){const s=D.signals,mx=Math.max(...s.tag_counts.map(t=>t[1]),1);
 $('#main').innerHTML=`<div class="cols twoeq"><section class="panel scrollpanel"><h3>Signals from today's data</h3><div class="scroll">
 <div class="sec"><h4>Topic volume</h4><div class="bars">${s.tag_counts.map(([t,c])=>`<div><span>${esc(t)}</span><i style="width:${c/mx*140}px"></i>${c}</div>`).join('')}</div></div>
 <div class="sec"><h4>Emerging terms (7d vs. earlier)</h4>${s.emerging_terms.length?s.emerging_terms.map(e=>`<span class="chip">${esc(e.term)} ×${e.lift}</span>`).join(''):'<p class="empty">Needs about a week of history.</p>'}</div>
 <div class="sec"><h4>Under-explored pairs</h4><p class="meta">Topics that co-occur less than chance predicts: possible gaps.</p>${s.underexplored_pairs.length?s.underexplored_pairs.map(p=>`<div style="margin:4px 0">${esc(p.a)} + ${esc(p.b)} <span class="meta">(seen ${p.observed}, expected ${p.expected})</span></div>`).join(''):'<p class="empty">Needs more data.</p>'}</div>
 </div></section>
 <section class="panel scrollpanel"><h3>Ideas for you</h3><div class="scroll"><div class="seg"><button data-t="research" class="${BTAB==='research'?'on':''}">Research</button><button data-t="market" class="${BTAB==='market'?'on':''}">Market &amp; translation</button></div><div id="ib"></div></div></section></div>`;
 const draw=()=>{$('#ib').innerHTML=IDEAS[BTAB].map(i=>`<div class="card noimg"><div><h4>${esc(i.title)}</h4><p class="sum" style="-webkit-line-clamp:unset">${esc(i.body)}</p>${i.tags.map(t=>`<span class="chip">${esc(t)}</span>`).join('')}</div></div>`).join('');
  document.querySelectorAll('.seg button').forEach(b=>b.classList.toggle('on',b.dataset.t===BTAB))};
 document.querySelectorAll('.seg button').forEach(b=>b.onclick=()=>{BTAB=b.dataset.t;draw()});draw()}

/* ---------- BACKGROUND ---------- */
function background(){$('#main').innerHTML=`<div class="cols two"><section class="panel filters"><h3>Contents</h3><div class="scroll toc">${BG.map((s,k)=>`<a href="#background" data-k="${k}">${esc(s.title)}</a>`).join('')}</div></section><section class="panel scrollpanel"><h3>Background</h3><div class="scroll" id="bgc">${BG.map((s,k)=>`<div class="sec" id="bg${k}"><h4>${esc(s.title)}</h4>${s.entries.map(e=>`<div class="card noimg"><div class="bgentry" style="margin:0"><h4>${e.url?`<a href="${esc(safe(e.url))}" target="_blank" rel="noopener">${esc(e.title)} ↗</a>`:esc(e.title)}</h4><p>${esc(e.body)}</p></div></div>`).join('')}</div>`).join('')}</div></section></div>`;
 document.querySelectorAll('.toc a').forEach(a=>a.onclick=e=>{e.preventDefault();$('#bg'+a.dataset.k).scrollIntoView({behavior:'smooth',block:'start'})})}

/* ---------- DATASET ---------- */
function dataset(){const rows=D.items;const c=k=>Object.entries(rows.reduce((a,i)=>(a[i[k]]=(a[i[k]]||0)+1,a),{})).sort((a,b)=>b[1]-a[1]);
 $('#main').innerHTML=`<div class="cols two"><section class="panel filters"><h3>Dataset</h3><div class="scroll"><p class="meta">Every item is auto-categorized (section, tags, sports, groups). Full history, de-duplicated:</p><a class="btn" href="data/dataset.csv">dataset.csv</a><a class="btn" href="data/dataset.jsonl">dataset.jsonl</a>
 <div class="sec"><h4>By section</h4>${c('section').map(([k,v])=>`<div class="meta"><i class="dot" style="background:var(--s-${k})"></i>${esc(SEC[k]||k)}: <b>${v}</b></div>`).join('')}</div><div class="sec"><h4>By source</h4>${c('source_type').map(([k,v])=>`<div class="meta">${esc(TYPE[k]||k)}: <b>${v}</b></div>`).join('')}</div></div></section>
 <section class="panel scrollpanel"><h3>Latest items<span class="meta">${D.total_items} total</span></h3><div class="scroll" style="padding:0"><table class="tbl"><tr><th>Date</th><th>Section</th><th>Type</th><th>Title</th><th>Tags</th></tr>${rows.slice(0,400).map(i=>`<tr><td>${esc(i.date)}</td><td>${esc(SEC[i.section]||i.section)}</td><td>${esc(i.source_type)}</td><td><a href="${esc(safe(i.url))}" target="_blank" rel="noopener">${esc(i.title)}</a></td><td>${esc(i.tags.join(', '))}</td></tr>`).join('')}</table></div></section></div>`}

/* ---------- boot ---------- */
function route(){const h=(location.hash||'#today').slice(1);$('#nav').innerHTML=TABS.map(([k,v])=>`<a href="#${k}" class="${k===h?'on':''}">${v}</a>`).join('');({today,groups,brainstorm,background,dataset}[h]||today)()}
$('#theme').onclick=()=>{const r=document.documentElement;const dark=r.dataset.theme?r.dataset.theme==='dark':matchMedia('(prefers-color-scheme: dark)').matches;const n=dark?'light':'dark';r.dataset.theme=n;store.set('theme',n)};
Promise.all(['data/latest.json','ideas.json','background.json'].map(u=>fetch(u,{cache:'no-cache'}).then(r=>r.json()))).then(([d,i,b])=>{D=d;IDEAS=i;BG=b;
 $('#sub').textContent=`Updated ${D.generated} · ${D.new_today} new today`;route();addEventListener('hashchange',route)})
 .catch(e=>{$('#main').innerHTML='<p class="empty">Could not load data: '+esc(e.message)+'. Locally, serve with: python -m http.server -d docs</p>'});
