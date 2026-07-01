const DEFAULT_CONFIG = window.FALTAH_CONFIG || {};
const localSettings = JSON.parse(localStorage.getItem('faltah_repo_settings') || '{}');
const CONFIG = { ...DEFAULT_CONFIG, ...localSettings };
let lessons = [];
let theme = localStorage.getItem('faltah_theme') || 'dark';
let currentFilter = 'All';
let searchText = '';
const fallbackLessons = [
  {id:'pump-basics',title:'Centrifugal Pump Fundamentals',equipment:'Centrifugal Pump',category:'Rotating Equipment',summary:'Explains impeller action, volute casing, NPSH, cavitation and minimum flow.',smartAnswer:'Low pump discharge pressure may be caused by low suction pressure, blocked suction strainer, air ingress, worn impeller, wrong rotation, or partially closed valves.',duration:'05:00',provider:'Rotating Equipment SME',videoUrl:'videos/sample-pump.mp4',documents:['documents/sample-pump-sop.pdf'],keywords:['pump','centrifugal','discharge pressure','cavitation','npsh','impeller'],featured:true},
  {id:'control-valve',title:'Control Valve Basics',equipment:'Control Valve',category:'Valves',summary:'Explains how control valves regulate flow, pressure, level or temperature through actuator movement.',smartAnswer:'Control valves regulate process variables by changing valve opening in response to a controller signal. Common issues include sticking, air supply failure, positioner malfunction, incorrect tuning, and actuator problems.',duration:'04:00',provider:'Instrument SME',videoUrl:'videos/control-valve-basics.mp4',documents:['documents/control-valve-guide.pdf'],keywords:['control valve','positioner','actuator','flow control','valve'],featured:true},
  {id:'separator',title:'Three Phase Separator',equipment:'Three Phase Separator',category:'Process Systems',summary:'Explains how gas, oil and water separate inside a vessel through gravity and level control.',smartAnswer:'A three-phase separator uses gravity to split gas, oil and water. Stable separation depends on inlet momentum reduction, residence time, interface control, mist extraction, and correct outlet control.',duration:'04:30',provider:'Process SME',videoUrl:'videos/separator.mp4',documents:['documents/separator-overview.pdf'],keywords:['separator','gas','oil','water','interface level'],featured:true}
];
const $=(s,r=document)=>r.querySelector(s); const $$=(s,r=document)=>[...r.querySelectorAll(s)];
function absUrl(repo, path=''){ if(!path) return ''; if(/^https?:\/\//.test(path)) return path; return (repo||'').replace(/\/?$/,'/') + path.replace(/^\//,''); }
function isYouTube(url=''){return /youtu\.be|youtube\.com/.test(url)}
function youtubeEmbed(url){let id=''; try{const u=new URL(url); if(u.hostname.includes('youtu.be')) id=u.pathname.slice(1); else id=u.searchParams.get('v') || u.pathname.split('/embed/')[1] || '';}catch{} return id?`https://www.youtube.com/embed/${id}`:url;}
async function loadLessons(){
  try{const dataUrl=absUrl(CONFIG.knowledgeRepo, CONFIG.knowledgeDataFile || 'data/lessons.json') + '?v=' + Date.now(); const res=await fetch(dataUrl); if(!res.ok) throw new Error('No knowledge data'); lessons = await res.json();}
  catch(e){lessons = fallbackLessons;}
  renderAll();
}
function applyBranding(){
  const icon192=absUrl(CONFIG.mediaRepo, CONFIG.appIcon192 || 'icons/icon-192.png'); const icon512=absUrl(CONFIG.mediaRepo, CONFIG.appIcon512 || 'icons/icon-512.png'); const char=absUrl(CONFIG.mediaRepo, CONFIG.officialCharacter || 'characters/faltah-main.png');
  if(icon192){ $('#brandIcon').src=icon192; $('#splashLogo').src=icon192; document.querySelector('link[rel="apple-touch-icon"]').href=icon192; }
  if(char){ $('#heroCharacter').src=char; }
}
function renderStats(){const eq=[...new Set(lessons.map(l=>l.equipment).filter(Boolean))]; const docs=lessons.reduce((a,l)=>a+(l.documents?.length||0),0); $('#stats').innerHTML=[['Equipment',eq.length],['Lessons',lessons.length],['Videos',lessons.filter(l=>l.videoUrl).length],['Documents',docs]].map(x=>`<div class="stat card"><b>${x[1]}</b><span>${x[0]}</span></div>`).join('');}
function lessonCard(l){return `<article class="lesson card" data-lesson="${l.id}"><div class="thumb">${icon(l.category)}</div><span class="meta">${l.category} • ${l.duration||''}</span><h4>${esc(l.title)}</h4><p>${esc(l.summary||'')}</p><small>${esc(l.equipment||'')}</small></article>`}
function renderFeatured(){ $('#featuredGrid').innerHTML = lessons.filter(l=>l.featured).slice(0,4).map(lessonCard).join('') || lessons.slice(0,4).map(lessonCard).join(''); }
function renderEquipment(){ const q=($('#equipmentSearch')?.value||'').toLowerCase(); const eqMap={}; lessons.forEach(l=>{ if(!l.equipment) return; if(!eqMap[l.equipment]) eqMap[l.equipment]={name:l.equipment,category:l.category,count:0,summary:l.summary}; eqMap[l.equipment].count++;}); let arr=Object.values(eqMap).filter(e=>e.name.toLowerCase().includes(q) || e.category.toLowerCase().includes(q)); $('#equipmentGrid').innerHTML=arr.map(e=>`<article class="equipment card" data-equipment="${esc(e.name)}"><div class="equip-icon">${icon(e.category)}</div><span class="meta">${esc(e.category)} • ${e.count} lessons</span><h4>${esc(e.name)}</h4><p>${esc(e.summary||'Open equipment details and related lessons.')}</p></article>`).join('');}
function renderLibrary(){ const cats=['All',...new Set(lessons.map(l=>l.category))]; $('#filters').innerHTML=cats.map(c=>`<button class="filter ${c===currentFilter?'active':''}" data-filter="${esc(c)}">${esc(c)}</button>`).join(''); const q=($('#librarySearch')?.value||searchText).toLowerCase(); let arr=lessons.filter(l=>(currentFilter==='All'||l.category===currentFilter) && [l.title,l.equipment,l.category,l.summary,l.provider,(l.keywords||[]).join(' ')].join(' ').toLowerCase().includes(q)); $('#libraryGrid').innerHTML=arr.map(lessonCard).join('') || '<div class="card" style="padding:20px">No results found.</div>';}
function renderPaths(){ const paths=[['Operator Fundamentals',35],['Rotating Equipment',20],['Valves & Instrumentation',15],['Process Systems',28]]; $('#paths').innerHTML=paths.map(p=>`<div class="path card"><h3>${p[0]}</h3><p>Structured lessons from the knowledge repository.</p><div class="progress"><span style="width:${p[1]}%"></span></div></div>`).join('');}
function renderHealth(){ const missingVideo=lessons.filter(l=>!l.videoUrl).length; const missingDocs=lessons.filter(l=>!l.documents||!l.documents.length).length; $('#health').innerHTML=[['Total lessons',lessons.length],['Missing video',missingVideo],['Missing documents',missingDocs],['Knowledge repo',CONFIG.knowledgeRepo||'Not set'],['Media repo',CONFIG.mediaRepo||'Not set']].map(x=>`<div class="health-row"><span>${x[0]}</span><b>${x[1]}</b></div>`).join('');}
function renderAll(){renderStats();renderFeatured();renderEquipment();renderLibrary();renderPaths();renderHealth(); $('#knowledgeUrl').value=CONFIG.knowledgeRepo||''; $('#mediaUrl').value=CONFIG.mediaRepo||'';}
function icon(cat=''){return {'Rotating Equipment':'⚙️','Process Systems':'🏭','Valves':'🚰','Instrumentation':'📈','Electrical':'⚡','Maintenance':'🔧','Fundamentals':'📚'}[cat]||'🎬'}
function esc(s=''){return String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
function openPage(id){$$('.page').forEach(p=>p.classList.toggle('active',p.id===id)); $$('.nav').forEach(n=>n.classList.toggle('active',n.dataset.page===id)); $('#pageTitle').textContent = id==='dashboard'?'Dashboard':$('.nav[data-page="'+id+'"]').textContent.trim().replace(/^\S+\s?/,''); window.scrollTo({top:0,behavior:'smooth'});}
function openLesson(id){const l=lessons.find(x=>x.id===id); if(!l)return; const video=absUrl(CONFIG.knowledgeRepo,l.videoUrl||''); const docs=(l.documents||[]).map(d=>`<a class="doc-link" target="_blank" href="${absUrl(CONFIG.knowledgeRepo,d)}">📄 ${esc(d.split('/').pop())}</a>`).join(''); let player='<div class="video-box">No video added yet</div>'; if(video){ player = isYouTube(video)?`<div class="video-box"><iframe src="${youtubeEmbed(video)}" allowfullscreen></iframe></div>`:`<div class="video-box"><video controls playsinline src="${video}"></video></div>`; } $('#dialogContent').innerHTML=`<div class="dialog-inner"><span class="meta">${esc(l.category)} • ${esc(l.equipment||'')}</span><h1>${esc(l.title)}</h1><p>${esc(l.summary||'')}</p>${player}<h3>Smart Answer</h3><p>${esc(l.smartAnswer||'No smart answer available yet.')}</p><h3>Documents</h3>${docs||'<p>No documents added yet.</p>'}</div>`; $('#lessonDialog').showModal();}

function openEquipment(name){
  const related = lessons.filter(l => (l.equipment || '').toLowerCase() === String(name).toLowerCase());
  const first = related[0] || {};
  const cards = related.map(l => `<article class="lesson card" data-lesson="${l.id}"><div class="thumb">${icon(l.category)}</div><span class="meta">${esc(l.category)} • ${esc(l.duration||'')}</span><h4>${esc(l.title)}</h4><p>${esc(l.summary||'')}</p><small>${esc(l.provider||'')}</small></article>`).join('');
  $('#dialogContent').innerHTML = `<div class="dialog-inner equipment-detail">
    <span class="meta">${esc(first.category || 'Equipment')}</span>
    <h1>${esc(name)}</h1>
    <p>${esc(first.summary || 'Equipment details and related knowledge lessons will appear here.')}</p>
    <div class="equipment-sections">
      <div><b>Overview</b><span>Purpose, function, and operating concept.</span></div>
      <div><b>How It Works</b><span>Working principle and process role.</span></div>
      <div><b>Components</b><span>Main parts, instruments, and controls.</span></div>
      <div><b>Troubleshooting</b><span>Common issues, causes, and checks.</span></div>
      <div><b>Knowledge Films</b><span>Videos linked to this equipment.</span></div>
      <div><b>Documents</b><span>Procedures, manuals, and references.</span></div>
    </div>
    <h3>Related Lessons</h3>
    <div class="grid">${cards || '<div class="card" style="padding:18px">No related lessons yet.</div>'}</div>
  </div>`;
  $('#lessonDialog').showModal();
}
function smartAnswer(q){q=q.toLowerCase(); const scored=lessons.map(l=>{const text=[l.title,l.equipment,l.category,l.summary,l.smartAnswer,(l.keywords||[]).join(' ')].join(' ').toLowerCase(); const score=q.split(/\s+/).filter(w=>w.length>2 && text.includes(w)).length + (text.includes(q)?5:0); return {l,score};}).sort((a,b)=>b.score-a.score); const best=scored[0]; if(!best||best.score===0) return `<h3>No knowledge available yet</h3><p>I could not find a matching topic in the current knowledge repository. Add keywords and a smart answer in <b>FALTAH-Knowledge/data/lessons.json</b>.</p>`; return `<h3>${esc(best.l.title)}</h3><p>${esc(best.l.smartAnswer||best.l.summary)}</p><p><b>Related equipment:</b> ${esc(best.l.equipment||'')}</p><button data-lesson="${best.l.id}" class="primary">Open Lesson</button>`;}
document.addEventListener('click',e=>{const nav=e.target.closest('[data-page]'); if(nav) openPage(nav.dataset.page); const jump=e.target.closest('[data-jump]'); if(jump) openPage(jump.dataset.jump); const eq=e.target.closest('[data-equipment]'); if(eq){ openEquipment(eq.dataset.equipment); return; } const lesson=e.target.closest('[data-lesson]'); if(lesson) openLesson(lesson.dataset.lesson); const fil=e.target.closest('[data-filter]'); if(fil){currentFilter=fil.dataset.filter; renderLibrary();}});
$('#closeDialog').onclick=()=>$('#lessonDialog').close(); $('#equipmentSearch').oninput=renderEquipment; $('#librarySearch').oninput=renderLibrary; $('#refreshBtn').onclick=loadLessons; $('#askBtn').onclick=()=>{$('#answerBox').innerHTML=smartAnswer($('#askInput').value);}; $('#themeBtn').onclick=()=>{theme=theme==='dark'?'light':'dark';localStorage.setItem('faltah_theme',theme);document.body.classList.toggle('light',theme==='light');}; $('#saveSettings').onclick=()=>{localStorage.setItem('faltah_repo_settings',JSON.stringify({knowledgeRepo:$('#knowledgeUrl').value,mediaRepo:$('#mediaUrl').value}));alert('Saved. Refreshing...');location.reload();};
window.addEventListener('load',()=>{document.body.classList.toggle('light',theme==='light'); applyBranding(); loadLessons(); setTimeout(()=>$('#splash').classList.add('hide'),800); if('serviceWorker'in navigator) navigator.serviceWorker.register('./service-worker.js').catch(()=>{});});
