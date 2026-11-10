const TABS=[['today','Today'],['groups','Groups'],['brainstorm','Brainstorm'],['background','Background'],['dataset','Dataset']];
const SEC={contact_sport:'Contact sport',biomechanics_modeling:'Biomechanics & modeling',blast_military:'Blast & military',medical_clinical:'Medical & clinical',general_tbi:'General TBI'};
const TYPE={paper:'Paper',preprint:'Preprint',news:'News',linkedin:'LinkedIn',social:'Social',github:'GitHub'};
const $=s=>document.querySelector(s);let D=null,IDEAS=null,BG=null;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const safe=u=>/^https?:\/\//i.test(u)?u:'#';
const gname=id=>(D.groups.find(g=>g.id===id)||{}).name||id;
const isMine=i=>i.groups.some(g=>(D.groups.find(x=>x.id===g)||{}).mine);
function card(i){return `<div class="card ${isMine(i)?'mine':''}"><h4><a href="${esc(safe(i.url))}" target="_blank" rel="noopener">${esc(i.title)}</a></h4>
<div class="meta">${esc(i.outlet)} · ${esc(i.date)}</div>${i.summary?`<p class="sum">${esc(i.summary.slice(0,320))}${i.summary.length>320?'…':''}</p>`:''}
<span class="chip t">${esc(TYPE[i.source_type]||i.source_type)}</span><span class="chip">${esc(SEC[i.section]||i.section)}</span>
${i.groups.map(g=>`<span class="chip g">${esc(gname(g).split(' - ')[0])}</span>`).join('')}${i.tags.map(t=>`<span class="chip">${esc(t)}</span>`).join('')}${i.sports.map(t=>`<span class="chip">${esc(t)}</span>`).join('')}</div>`}
function today(){const items=D.items;
const days=[...new Set(items.map(i=>i.first_seen))].sort().reverse().slice(0,14);
$('#main').innerHTML=`<div class="row"><div class="stat"><b>${D.new_today}</b><br>new items today</div><div class="stat"><b>${D.total_items}</b><br>in dataset</div><div class="stat"><b>${items.filter(i=>i.source_type==='paper'||i.source_type==='preprint').length}</b><br>papers (45d)</div></div>
<div class="bar"><input id="q" placeholder="Search title, summary…"><select id="fs"><option value="">All sections</option>${Object.entries(SEC).map(([k,v])=>`<option value="${k}">${v}</option>`).join('')}</select>
<select id="ft"><option value="">All sources</option>${Object.entries(TYPE).map(([k,v])=>`<option value="${k}">${v}</option>`).join('')}</select>
<select id="fd">${days.map(d=>`<option value="${d}">${d}${d===D.today?' (today)':''}</option>`).join('')}<option value="">All days</option></select></div><div id="list"></div>`;
const draw=()=>{const q=$('#q').value.toLowerCase(),s=$('#fs').value,t=$('#ft').value,d=$('#fd').value;
const r=items.filter(i=>(!s||i.section===s)&&(!t||i.source_type===t)&&(!d||i.first_seen===d)&&(!q||(i.title+i.summary).toLowerCase().includes(q))).slice(0,200);
$('#list').innerHTML=r.length?r.map(card).join(''):'<p class="empty">Nothing matches. Try another day or filter.</p>'};
['q','fs','ft','fd'].forEach(id=>$('#'+id).addEventListener('input',draw));draw()}
function groups(){$('#main').innerHTML='<p class="meta">Latest papers, news and repo activity per group. Papers come from PubMed author searches (names can be ambiguous, so check). Google Scholar has no public API and is not scraped.</p>'+D.groups.map(g=>{
const its=D.items.filter(i=>i.groups.includes(g.id)&&i.source_type!=='github').sort((a,b)=>b.date.localeCompare(a.date)).slice(0,12);
const gh=(D.github[g.id]||[]).slice(0,6);
return `<h2>${esc(g.name)} ${g.mine?'<span class="chip t">your lab</span>':''}</h2><div class="meta"><a href="${esc(g.site)}" target="_blank" rel="noopener">${esc(g.site)}</a></div>
${gh.length?`<h3>GitHub</h3><div class="grid">${gh.map(r=>`<div class="card"><h4><a href="${esc(r.url)}" target="_blank" rel="noopener">${esc(r.name)}</a></h4><div class="meta">pushed ${esc(r.pushed)} · ${esc(r.lang||'')} · ★${r.stars}</div><p class="sum">${esc(r.desc)}</p></div>`).join('')}</div>`:''}
${its.length?its.map(card).join(''):'<p class="empty">No updates found yet. It fills as the daily job runs.</p>'}`}).join('')}
function ideaCards(a){return a.map(i=>`<div class="card"><h4>${esc(i.title)}</h4><p class="sum">${esc(i.body)}</p>${i.tags.map(t=>`<span class="chip">${esc(t)}</span>`).join('')}</div>`).join('')}
function brainstorm(){const s=D.signals;const mx=Math.max(...s.tag_counts.map(t=>t[1]),1);
$('#main').innerHTML=`<h2>Today's signals <span class="meta">(computed from the dataset, free)</span></h2>
<div class="grid"><div class="card"><h3>Topic volume</h3><div class="bars">${s.tag_counts.map(([t,c])=>`<div><span style="width:150px">${esc(t)}</span><i style="width:${c/mx*100}px"></i>${c}</div>`).join('')}</div></div>
<div class="card"><h3>Emerging terms (7d vs. before)</h3>${s.emerging_terms.length?s.emerging_terms.map(e=>`<span class="chip">${esc(e.term)} ×${e.lift}</span>`).join(''):'<p class="empty">Needs a week or more of history.</p>'}</div>
<div class="card"><h3>Under-explored pairs</h3><p class="meta">Topic pairs that appear together less than chance predicts: possible gaps.</p>${s.underexplored_pairs.length?s.underexplored_pairs.map(p=>`<div>${esc(p.a)} + ${esc(p.b)} <span class="meta">(seen ${p.observed}, expected ${p.expected})</span></div>`).join(''):'<p class="empty">Needs more data.</p>'}</div></div>
<h2>Research ideas</h2>${ideaCards(IDEAS.research)}<h2>Market &amp; translation ideas</h2>${ideaCards(IDEAS.market)}`}
function background(){$('#main').innerHTML=BG.map(s=>`<h2>${esc(s.title)}</h2>${s.entries.map(e=>`<div class="card"><h4>${e.url?`<a href="${esc(safe(e.url))}" target="_blank" rel="noopener">${esc(e.title)}</a>`:esc(e.title)}</h4><p class="sum">${esc(e.body)}</p></div>`).join('')}`).join('')}
function dataset(){const rows=D.items;const c=k=>Object.entries(rows.reduce((a,i)=>(a[i[k]]=(a[i[k]]||0)+1,a),{})).sort((a,b)=>b[1]-a[1]);
$('#main').innerHTML=`<p>Every item is categorized by a rule-based classifier (section, tags, sports, group mentions). Full history:</p><a class="btn" href="data/dataset.csv">dataset.csv</a><a class="btn" href="data/dataset.jsonl">dataset.jsonl</a>
<div class="row"><div class="card"><h3>By section</h3>${c('section').map(([k,v])=>`<div>${esc(SEC[k]||k)}: <b>${v}</b></div>`).join('')}</div><div class="card"><h3>By source</h3>${c('source_type').map(([k,v])=>`<div>${esc(TYPE[k]||k)}: <b>${v}</b></div>`).join('')}</div></div>
<table><tr><th>Date</th><th>Section</th><th>Type</th><th>Title</th><th>Tags</th></tr>${rows.slice(0,300).map(i=>`<tr><td>${esc(i.date)}</td><td>${esc(SEC[i.section]||i.section)}</td><td>${esc(i.source_type)}</td><td><a href="${esc(safe(i.url))}" target="_blank" rel="noopener">${esc(i.title)}</a></td><td>${esc(i.tags.join(', '))}</td></tr>`).join('')}</table>`}
function route(){const h=(location.hash||'#today').slice(1);$('#nav').innerHTML=TABS.map(([k,v])=>`<a href="#${k}" class="${k===h?'on':''}">${v}</a>`).join('');
({today,groups,brainstorm,background,dataset}[h]||today)();window.scrollTo(0,0)}
Promise.all(['data/latest.json','ideas.json','background.json'].map(u=>fetch(u).then(r=>r.json()))).then(([d,i,b])=>{D=d;IDEAS=i;BG=b;
$('#sub').textContent=`Updated ${D.generated} · ${D.new_today} new today · ${D.total_items} items tracked`;route();addEventListener('hashchange',route)})
.catch(e=>{$('#main').innerHTML='<p class="empty">Could not load data: '+esc(e.message)+'. If opening locally, serve with: python -m http.server -d docs</p>'});
