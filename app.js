const CFG = window.FALTAH_CONFIG || {};
const defaultKnowledgeBase = CFG.knowledgeBaseUrl || 'https://msharyx99.github.io/FALTAH-Knowledge/';
const defaultMediaBase = CFG.mediaBaseUrl || 'https://msharyx99.github.io/FALTAH-Media/';
const localFallbackCharacter = 'assets/branding/faltah-official.jpeg';
const localFallbackIcon = 'assets/icons/icon.svg';
function cleanBase(url){ return (url || '').trim().replace(/\/?$/, '/'); }
function isExternal(url=''){ return /^https?:\/\//i.test(url) || url.startsWith('data:'); }
function resolveKnowledge(path=''){
  if(!path) return '';
  if(isExternal(path)) return path;
  return cleanBase(store?.settings?.knowledgeBaseUrl || defaultKnowledgeBase) + path.replace(/^\//,'');
}
function resolveMedia(path=''){
  if(!path) return localFallbackCharacter;
  if(isExternal(path)) return path;
  return cleanBase(store?.settings?.mediaBaseUrl || defaultMediaBase) + path.replace(/^\//,'');
}
function youTubeEmbed(url=''){
  if(!url) return '';
  if(url.includes('/embed/')) return url;
  const watch = url.match(/[?&]v=([^&]+)/);
  const short = url.match(/youtu\.be\/([^?&]+)/);
  const id = watch?.[1] || short?.[1];
  return id ? `https://www.youtube.com/embed/${id}` : url;
}
function videoHtml(url){
  if(!url) return `<div class="videoMissing">No video linked yet. Add a video URL in CMS or upload MP4 to FALTAH-Knowledge.</div>`;
  const src = youTubeEmbed(resolveKnowledge(url));
  if(/youtube\.com\/embed/i.test(src)) return `<iframe class="lessonVideo" src="${src}" allowfullscreen></iframe>`;
  return `<video class="lessonVideo" controls src="${src}">Your browser cannot play this video.</video><p class="muted small">If the video does not play, confirm the MP4 exists in FALTAH-Knowledge at: ${url}</p>`;
}
const icons={dashboard:'<svg viewBox="0 0 24 24" fill="none" stroke-width="1.8"><path d="M4 13h7V4H4v9Zm9 7h7v-9h-7v9ZM4 20h7v-5H4v5Zm9-11h7V4h-7v5Z"/></svg>',equipment:'<svg viewBox="0 0 24 24" fill="none" stroke-width="1.8"><path d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z"/><path d="M3 12h3m12 0h3M12 3v3m0 12v3M5.6 5.6l2.1 2.1m8.6 8.6 2.1 2.1m0-12.8-2.1 2.1m-8.6 8.6-2.1 2.1"/></svg>',academy:'<svg viewBox="0 0 24 24" fill="none" stroke-width="1.8"><path d="M4 6.5A2.5 2.5 0 0 1 6.5 4H20v15H6.5A2.5 2.5 0 0 1 4 16.5v-10Z"/><path d="M8 8h8M8 12h7"/></svg>',library:'<svg viewBox="0 0 24 24" fill="none" stroke-width="1.8"><path d="M5 4h4v16H5zM10 4h4v16h-4zM16 5l3 14"/></svg>',assistant:'<svg viewBox="0 0 24 24" fill="none" stroke-width="1.8"><path d="M12 3a7 7 0 0 0-7 7v3a5 5 0 0 0 5 5h1l3 3v-3h1a5 5 0 0 0 5-5v-3a7 7 0 0 0-7-7Z"/><path d="M9 10h.01M15 10h.01M9 14h6"/></svg>',challenges:'<svg viewBox="0 0 24 24" fill="none" stroke-width="1.8"><path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4Z"/><path d="M5 6H3v2a4 4 0 0 0 4 4M19 6h2v2a4 4 0 0 1-4 4"/></svg>',analytics:'<svg viewBox="0 0 24 24" fill="none" stroke-width="1.8"><path d="M4 19V5M4 19h16"/><path d="M8 16V9m4 7V6m4 10v-4"/></svg>',settings:'<svg viewBox="0 0 24 24" fill="none" stroke-width="1.8"><path d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z"/><path d="M4 12h2m12 0h2M12 4v2m0 12v2m-5.7-3.7 1.4-1.4m8.6-8.6 1.4-1.4m0 12.8-1.4-1.4M7.7 7.7 6.3 6.3"/></svg>',search:'<svg viewBox="0 0 24 24" fill="none" stroke-width="1.8"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>'};
const defaults={brandName:'FALTAH Enterprise',motto:'Learn • Apply • Excel',character:'characters/faltah-main.png',appIcon:'icons/faltah-app-icon.png',icons};
const saved=JSON.parse(localStorage.getItem('faltah5')||'null');
let store=saved||{settings:{knowledgeBaseUrl:defaultKnowledgeBase,mediaBaseUrl:defaultMediaBase},brand:defaults,equipment:[{name:'Centrifugal Pump',cat:'Rotating Equipment',icon:icons.equipment,desc:'Converts mechanical energy into hydraulic energy.'},{name:'Control Valve',cat:'Valves',icon:'<svg viewBox="0 0 24 24" fill="none" stroke-width="1.8"><path d="M4 12h16"/><path d="M8 8l8 8M16 8l-8 8"/><circle cx="12" cy="12" r="8"/></svg>',desc:'Regulates flow, pressure, level or temperature using a control signal.'},{name:'Three Phase Separator',cat:'Process Systems',icon:'<svg viewBox="0 0 24 24" fill="none" stroke-width="1.8"><rect x="6" y="5" width="12" height="14" rx="4"/><path d="M8 9h8M8 12h8M8 15h8"/></svg>',desc:'Separates gas, oil and water using gravity and internals.'},{name:'PSV',cat:'Safety Systems',icon:'<svg viewBox="0 0 24 24" fill="none" stroke-width="1.8"><path d="M12 3 3 21h18L12 3Z"/><path d="M12 9v5m0 3h.01"/></svg>',desc:'Protects equipment from overpressure.'}],lessons:[{title:'Pump Fundamentals',eq:'Centrifugal Pump',video:'videos/rotating-equipment/pump-fundamentals.mp4',doc:'documents/rotating-equipment/pump-fundamentals.pdf',summary:'How a centrifugal pump works and common troubleshooting.',keys:'pump,pressure,cavitation,npsh,rotating equipment'},{title:'Control Valve Basics',eq:'Control Valve',video:'videos/valves/control-valve-basics.mp4',doc:'documents/valves/control-valve-basics.pdf',summary:'How control valves regulate process conditions.',keys:'control valve,actuator,positioner'},{title:'Separator Overview',eq:'Three Phase Separator',video:'videos/process/three-phase-separator-overview.mp4',doc:'documents/process/three-phase-separator-overview.pdf',summary:'How gas, oil and water separation works.',keys:'separator,oil,water,gas'}]};
store.settings ||= {knowledgeBaseUrl:defaultKnowledgeBase,mediaBaseUrl:defaultMediaBase};
store.brand ||= defaults; store.brand.icons ||= icons;
const modules=[['dashboard','Dashboard','Executive learning command center.'],['equipment','Equipment Explorer','Open standardized equipment pages.'],['academy','Learning Academy','Structured learning paths.'],['library','Knowledge Library','Search videos, documents and lessons.'],['assistant','Smart Assistant','Local FALTAH knowledge engine.'],['challenges','Challenges','Weekly technical challenges.'],['analytics','Analytics','Content and learning insights.'],['settings','Settings','Branding and platform settings.']];
const $=(s,r=document)=>r.querySelector(s); const $$=(s,r=document)=>[...r.querySelectorAll(s)];
function save(){localStorage.setItem('faltah5',JSON.stringify(store))}
function navBtn(m){return `<button class="navBtn" data-page="${m[0]}"><span class="navIcon">${store.brand.icons[m[0]]||icons[m[0]]||''}</span><b>${m[1]}</b></button>`}
function iconMarkup(value){ if(!value) return icons.equipment; if(isExternal(value)) return `<img class="inlineIcon" src="${value}">`; return value; }
function render(){
  brandName.textContent=store.brand.brandName; brandTag.textContent=store.brand.motto; footerMotto.textContent=store.brand.motto;
  brandIcon.src=resolveMedia(store.brand.appIcon||defaults.appIcon); brandIcon.onerror=()=>{brandIcon.src=localFallbackIcon};
  heroCharacter.src=resolveMedia(store.brand.character||defaults.character); heroCharacter.onerror=()=>{heroCharacter.src=localFallbackCharacter};
  nav.innerHTML=modules.map(navBtn).join(''); bottomNav.innerHTML=modules.slice(0,4).map(navBtn).join(''); modulesEl(); stats();
  equipmentGrid.innerHTML=store.equipment.map(e=>`<div class="card click" data-eq="${e.name}"><span class="eqIcon">${iconMarkup(e.icon)}</span><h3>${e.name}</h3><p class="muted">${e.desc}</p><small>${e.cat}</small></div>`).join('');
  lessonGrid.innerHTML=lessonsFiltered().map(l=>`<div class="card click" data-lesson="${l.title}"><div class="lessonThumb">▶</div><h3>${l.title}</h3><p class="muted">${l.summary}</p><small>${l.eq}</small></div>`).join('');
  paths.innerHTML=['New Operator','Rotating Equipment','Valves Specialist','Process Fundamentals'].map((p,i)=>`<div class="path"><h3>${p}</h3><div class="progress"><span style="width:${(i+1)*20}%"></span></div><p>${(i+1)*20}% complete</p></div>`).join('');
  analyticsStats.innerHTML=statHtml(); searchIcon.innerHTML=store.brand.icons.search||icons.search; bind();
}
function modulesEl(){modules.innerHTML=modules.slice(1,8).map(m=>`<div class="module" data-page="${m[0]}"><span class="moduleIcon">${store.brand.icons[m[0]]||icons[m[0]]}</span><h3>${m[1]}</h3><p>${m[2]}</p></div>`).join('')}
function statHtml(){return `<div class="metric"><b>${store.equipment.length}</b><span>Equipment</span></div><div class="metric"><b>${store.lessons.length}</b><span>Lessons</span></div><div class="metric"><b>${store.lessons.filter(l=>l.video).length}</b><span>Videos</span></div><div class="metric"><b>${store.lessons.filter(l=>l.doc).length}</b><span>Documents</span></div>`}
function stats(){document.getElementById('stats').innerHTML=statHtml()}
function lessonsFiltered(){let q=($('#search')?.value||'').toLowerCase();return store.lessons.filter(l=>(l.title+l.eq+l.summary+l.keys).toLowerCase().includes(q))}
function bind(){$$('[data-page]').forEach(b=>b.onclick=()=>openPage(b.dataset.page));$$('[data-eq]').forEach(b=>b.onclick=()=>openEq(b.dataset.eq));$$('[data-lesson]').forEach(b=>b.onclick=()=>openLesson(b.dataset.lesson))}
function openPage(p){$$('.page').forEach(x=>x.classList.toggle('active',x.id==p));$$('.navBtn').forEach(x=>x.classList.toggle('active',x.dataset.page==p));pageTitle.textContent=modules.find(m=>m[0]==p)?.[1]||'Dashboard';scrollTo(0,0)}
function openEq(name){let e=store.equipment.find(x=>x.name==name);let related=store.lessons.filter(l=>l.eq==name);equipDetail.innerHTML=`<h1><span class="eqIcon large">${iconMarkup(e.icon)}</span> ${e.name}</h1><p>${e.desc}</p><div class="detailGrid">${['Overview','Purpose','Working Principle','Components','Operating Parameters','Common Alarms','Failure Modes','Troubleshooting','Maintenance','Inspection','Knowledge Films','Documents'].map(x=>`<div class="detailBox"><b>${x}</b><p class="muted">Ready for ${e.name} content.</p></div>`).join('')}</div><h3>Related Lessons</h3>${related.map(l=>`<p class="click" data-lesson="${l.title}">▶ ${l.title}</p>`).join('')||'<p>No lessons yet.</p>'}`;equipDialog.showModal();bind()}
function openLesson(title){let l=store.lessons.find(x=>x.title==title);lessonDetail.innerHTML=`<h1>${l.title}</h1><p>${l.summary}</p><div class="detailBox">${videoHtml(l.video)}</div><p><b>Equipment:</b> ${l.eq}</p><p><b>Document:</b> ${l.doc?`<a href="${resolveKnowledge(l.doc)}" target="_blank">Open Document</a>`:'No document'}</p>`;lessonDialog.showModal()}
theme.onclick=()=>{document.body.classList.toggle('light');localStorage.setItem('theme',document.body.classList.contains('light')?'light':'dark')};
openCms.onclick=settingsCms.onclick=()=>location.href='cms.html'; search.oninput=render;
askBtn.onclick=()=>{let q=askInput.value.toLowerCase();let hits=store.lessons.filter(l=>(l.title+l.eq+l.summary+l.keys).toLowerCase().includes(q)).slice(0,3);chat.innerHTML+=`<p><b>You:</b> ${askInput.value}</p><p><b>FALTAH:</b> ${hits.length?'I found related knowledge: '+hits.map(h=>h.title+' ('+h.eq+')').join(', '):'No knowledge available yet. Add this topic in the CMS.'}</p>`;askInput.value=''};
if(localStorage.getItem('theme')=='light')document.body.classList.add('light'); setTimeout(()=>splash.classList.add('hide'),800); render(); openPage('dashboard');
