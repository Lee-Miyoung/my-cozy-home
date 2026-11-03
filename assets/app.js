(()=>{'use strict';
const ICONS={home:'<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1Z"/><path d="M9 21v-8h6v8"/>',list:'<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M8 9h9M8 14h9"/>',wallet:'<rect x="3" y="5" width="18" height="15" rx="2"/><path d="M3 9h18"/><path d="M16 15h2"/>',book:'<path d="M12 7v14M3 5.5C6 4 9 4 12 6v15c-3-2-6-2-9-.5zM21 5.5c-3-1.5-6-1.5-9 .5v15c3-2 6-2 9-.5z"/>',folder:'<path d="M3 6a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v11H3Z"/>',palette:'<circle cx="12" cy="12" r="9"/><circle cx="7.5" cy="11" r="1"/><circle cx="11" cy="7.5" r="1"/><circle cx="16" cy="9" r="1"/><path d="M13 21c-2-3 0-5 2-5h2a3 3 0 0 0 3-3"/>',phone:'<path d="M7 3H5a2 2 0 0 0-2 2c0 9 7 16 16 16a2 2 0 0 0 2-2v-2l-5-2-2 2a14 14 0 0 1-7-7l2-2Z"/>',tool:'<path d="M14 7a5 5 0 0 1 6.5-4.5L17 6l1 2 3.5-3.5A5 5 0 0 1 17 11L8 20a3 3 0 0 1-4-4Z"/>',settings:'<circle cx="12" cy="12" r="3"/><path d="M4 9V7l3-2 2 1 2-3h2l2 3 2-1 3 2v3l-2 2 2 2v3l-3 2-2-1-2 3h-2l-2-3-2 1-3-2v-3l2-2z"/>',more:'<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>',plus:'<path d="M12 5v14M5 12h14"/>',arrow:'<path d="M5 12h14m-6-6 6 6-6 6"/>',edit:'<path d="M4 20h4l12-12-4-4L4 16zM14 6l4 4"/>',trash:'<path d="M4 7h16M9 7V4h6v3m-9 0 1 14h10l1-14M10 11v6m4-6v6"/>',check:'<path d="m4 12 5 5L20 6"/>',download:'<path d="M12 3v13m-5-5 5 5 5-5M4 18v3h16v-3"/>',upload:'<path d="M12 21V8m-5 5 5-5 5 5M4 6V3h16v3"/>',close:'<path d="M5 5 19 19M19 5 5 19"/>',calendar:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4m10-4v4M3 10h18"/>'};
const icon=(name,size=18)=>`<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" aria-hidden="true">${ICONS[name]||ICONS.home}</svg>`;
const $=s=>document.querySelector(s);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const id=()=>globalThis.crypto?.randomUUID?.()||('r'+Date.now().toString(36)+Math.random().toString(36).slice(2));
const localDate=(d=new Date())=>[d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');
const money=n=>Number(n||0).toLocaleString('ko-KR')+'원';
const compactMoney=n=>{n=Number(n||0);return n>=100000000?(n/100000000).toLocaleString('ko-KR',{maximumFractionDigits:2})+'억 원':n>=10000?(n/10000).toLocaleString('ko-KR',{maximumFractionDigits:1})+'만 원':money(n)};
const dateLabel=s=>{if(!s)return '일정 미정';const d=new Date(s+'T00:00:00');return isNaN(d)?esc(s):`${d.getFullYear()}.${String(d.getMonth()+1).padStart(2,'0')}.${String(d.getDate()).padStart(2,'0')}`};
const timestamp=()=>new Date().toISOString();
function resizeImage(file){return new Promise((resolve,reject)=>{const url=URL.createObjectURL(file),img=new Image();img.onload=()=>{const scale=Math.min(1,1800/Math.max(img.width,img.height)),w=Math.round(img.width*scale),h=Math.round(img.height*scale);if(!w||!h){URL.revokeObjectURL(url);return reject(Error('invalid image'))}const c=document.createElement('canvas');c.width=w;c.height=h;c.getContext('2d').drawImage(img,0,0,w,h);c.toBlob(b=>{URL.revokeObjectURL(url);b?resolve(b):reject(Error('image export failed'))},'image/jpeg',.82)};img.onerror=()=>{URL.revokeObjectURL(url);reject(Error('image unavailable'))};img.src=url})}
function field(label,name,value='',type='text',attr='',full=false,help=''){return `<div class="field ${full?'full':''}"><label for="f_${name}">${label}</label><input id="f_${name}" name="${name}" type="${type}" value="${esc(value)}" ${attr}>${help?`<span class="field-help">${help}</span>`:''}</div>`}
function textarea(label,name,value='',full=true){return `<div class="field ${full?'full':''}"><label for="f_${name}">${label}</label><textarea id="f_${name}" name="${name}">${esc(value)}</textarea></div>`}
function selectField(label,name,values,selected='',full=false){return `<div class="field ${full?'full':''}"><label for="f_${name}">${label}</label><select id="f_${name}" name="${name}">${values.map(v=>{const a=Array.isArray(v)?v:[v,v];return `<option value="${esc(a[0])}" ${a[0]===selected?'selected':''}>${esc(a[1])}</option>`}).join('')}</select></div>`}
function fileField(label,name,multiple=false,accept='image/*,application/pdf'){const image=accept.includes('image/');return `<div class="field full"><label for="f_${name}">${label}</label><input type="file" id="f_${name}" name="${name}" ${multiple?'multiple':''} accept="${accept}">${image?`<div class="image-paste-zone" tabindex="0" data-paste-target="${name}" aria-label="사진 붙여넣기 영역"><span class="image-paste-icon">${icon('camera',22)}</span><div><strong>사진 복사·붙여넣기</strong><span class="image-paste-count">PC는 Ctrl+V, 휴대폰은 아래 칸을 길게 눌러 붙여넣으세요</span></div><textarea class="image-paste-mobile" rows="1" placeholder="휴대폰에서 여기를 길게 눌러 사진 붙여넣기" aria-label="휴대폰 이미지 붙여넣기"></textarea><button class="image-paste-clear" type="button" data-action="clear-pasted" data-field="${name}" hidden>지우기</button><div class="image-paste-previews"></div></div>`:''}<span class="field-help">사진은 크기 자동 축소 저장(일부 형식 제외), 파일당 최대 30MB · 첨부가 많을수록 백업이 커집니다.</span></div>`}

const clipboardUploads=new WeakMap();
const pasteObjectUrls=[];
function attachmentPasteZone(input){
 const names=clipboardUploads.get(input)||[];
 const box=input?.closest('.field')?.querySelector('.image-paste-zone');
 if(!box)return;
 const details=box.querySelector('.image-paste-count');
 details.textContent=names.length?('붙여넣은 사진 '+names.length+'장 · 저장 버튼을 눌러 등록해요'):'이곳을 클릭하고 Ctrl+V로 이미지를 붙여넣으세요';
 box.classList.toggle('has-images',names.length>0);const clear=box.querySelector('.image-paste-clear');if(clear)clear.hidden=!names.length;
 const preview=box.querySelector('.image-paste-previews');
 for(const img of preview.querySelectorAll('img'))URL.revokeObjectURL(img.src);
 preview.innerHTML='';
 for(const file of names.slice(-12)){
  const img=document.createElement('img');img.src=URL.createObjectURL(file);img.alt=file.name||'붙여넣은 이미지';img.loading='lazy';preview.appendChild(img);
 }
}
function addPastedFiles(input,files){
 if(!input)return;
 const accepted=[];
 for(const f of files){
  if(!f.type.startsWith('image/'))continue;
  if(f.size>30*1024*1024){toast('사진 한 장은 최대 30MB까지 첨부할 수 있어요.');continue;}
  const suffix=(f.type.split('/')[1]||'png').replace(/[^a-z0-9]/gi,'')||'png';
  accepted.push(new File([f],f.name&&/\.(png|jpe?g|webp|gif)$/i.test(f.name)?f.name:'붙여넣기-'+Date.now()+'.'+suffix,{type:f.type,lastModified:Date.now()}));
 }
 if(!accepted.length)return;
 const current=clipboardUploads.get(input)||[];
 clipboardUploads.set(input,input.multiple?[...current,...accepted]:accepted.slice(-1));
 attachmentPasteZone(input);
 toast('사진 '+accepted.length+'장을 첨부했어요. 저장하기를 누르면 등록돼요.');
}

const fileToDataURL=b=>new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=()=>reject(r.error);r.readAsDataURL(b)});
function dataURLtoBlob(u){const m=/^data:([^;,]*)(?:;base64)?,(.*)$/s.exec(u);if(!m)throw Error('첨부 데이터 형식이 올바르지 않아요.');const mime=m[1]||'application/octet-stream';const raw=atob(m[2]);const bytes=new Uint8Array(raw.length);for(let i=0;i<raw.length;i++)bytes[i]=raw.charCodeAt(i);return new Blob([bytes],{type:mime})}
ICONS.camera='<path d="M14 4h-4L8 7H4a1 1 0 0 0-1 1v11h18V8a1 1 0 0 0-1-1h-4Z"/><circle cx="12" cy="13" r="4"/>';
const BASE_STAGES=[
 {id:'prep',name:'준비',desc:'건축 목표와 자금 계획, 필요한 상담을 정리해요.'},
 {id:'land',name:'토지·건축물 확인',desc:'토지·도로 조건과 기존 건축물 자료를 확인해요.'},
 {id:'clear',name:'철거',desc:'해체·멸실과 폐기물 처리 계획을 확인해요.'},
 {id:'design',name:'설계',desc:'배치·평면·구조와 생활 방식을 구체화해요.'},
 {id:'permit',name:'인허가',desc:'관할 부서와 필요한 허가·신고를 확인해요.'},
 {id:'contract',name:'계약·발주',desc:'견적을 비교하고 계약과 발주를 준비해요.'},
 {id:'build',name:'착공·시공',desc:'현장의 변화와 공정, 중요한 결정을 남겨요.'},
 {id:'finish',name:'준공·입주',desc:'검사와 보완, 입주 준비를 차례로 챙겨요.'}
];
const DEFAULT_TASKS=[['prep','공간 구성과 총예산 계획 정리'],['land','토지 등기·지적도와 도로 접도 조건 확인'],['land','기존 건축물대장 및 현장 상태 확인'],['clear','해체·멸실 및 폐기물 처리 절차를 관할 부서에 확인'],['design','건축사 상담 및 배치·평면도 검토'],['design','자재와 주요 공간의 우선순위 정리'],['permit','지역과 건축 조건에 필요한 인허가 확인'],['contract','공종별 견적과 계약 조건 비교'],['build','착공 전 공정표와 현장 연락처 정리'],['build','공정별 사진과 검측·변경 내용 기록'],['finish','준공 검사·사용승인 관련 사항 확인'],['finish','보증서·설비 매뉴얼과 입주 점검표 보관']];
const CATS=['토지 관련','철거','측량·설계','인허가','기초·골조','지붕·외장','창호','전기·설비','내장·마감','인테리어','조경','가전·가구','세금·수수료','기타'];
const DOC_CATS=['토지 서류','건축물 관련 서류','설계도면','인허가','계약서','견적서','시공 관련 자료','준공 관련 서류','기타'];
const RECORD_KEYS=['tasks','expenses','journals','documents','designs','contacts','care'];
// The initial-condition album is a journal view, not a second copy of photos.
const BASELINE_CATEGORIES=[
 {id:'exterior',name:'주택 외관',title:'철거 전 주택 외관',desc:'건물 전체, 출입구, 벽체와 외부 마감',stage:'land',icon:'home'},
 {id:'interior',name:'집 내부',title:'철거 전 실내 현황',desc:'방·거실·주방·바닥·천장 상태',stage:'land',icon:'image'},
 {id:'outbuilding',name:'창고·지붕',title:'기존 창고 및 지붕 현황',desc:'창고, 지붕재와 노후 상태',stage:'land',icon:'folder'},
 {id:'grounds',name:'마당·주변',title:'기존 대지 및 주변 환경',desc:'마당, 나무, 진입로와 주변 경관',stage:'prep',icon:'home'},
 {id:'facilities',name:'설비·정화조',title:'기존 설비 상태',desc:'배관, 전기, 정화조 등 현장 확인 사항',stage:'land',icon:'tool'}
];

function baselinePhase(j){return j.baselinePhase==='after'?'after':'before';}
function baselineRows(category,phase){return state.journals.filter(j=>j.baselineCategory===category&&baselinePhase(j)===phase);}
function baselineBeforePhotos(category){return baselineRows(category,'before').flatMap(j=>(j.photos||[]).map((photo,i)=>({photo,j,label:`${j.date||'날짜 미정'} · ${j.title} · 사진 ${i+1}`})));}
function baselineDraft(key,phase='before',beforeId=''){
 const c=BASELINE_CATEGORIES.find(x=>x.id===key);
 return c?{title:phase==='after'?c.name+' · 이후 모습':c.title,date:'',stage:phase==='after'?'build':c.stage,type:'현장일기',baselineCategory:c.id,baselinePhase:phase,baselineBeforeId:phase==='after'?beforeId:''}:null;
}
function beforeAfterBanner(){
 const before=state.journals.filter(j=>j.baselineCategory&&baselinePhase(j)==='before').reduce((n,j)=>n+(j.photos?.length||0),0);
 const after=state.journals.filter(j=>j.baselineCategory&&baselinePhase(j)==='after').reduce((n,j)=>n+(j.photos?.length||0),0);
 return `<button type="button" class="baseline-home-feature" data-nav="baseline" aria-label="철거 전후 사진 앨범 및 비교 열기"><span class="baseline-home-symbol">${icon('camera',28)}</span><span class="baseline-home-copy"><small>PHOTO ARCHIVE · BEFORE / AFTER</small><strong>철거 전·후 사진 비교</strong><span>우리 집의 처음과 변화된 모습을 같은 장소별로 연결해 보세요.</span></span><span class="baseline-home-stats"><b>이전 ${before}장</b><b>이후 ${after}장</b></span><span class="baseline-home-arrow">${icon('arrow',24)}</span></button>`;
}
function baselineComparisonPairs(category){
 const before=new Map(baselineBeforePhotos(category).map(x=>[x.photo.id,x]));
 return baselineRows(category,'after').flatMap(j=>(j.photos||[]).map(p=>({before:before.get(j.baselineBeforeId),after:p,record:j}))).filter(x=>x.before);
}
function baselinePage(){
 const categories=BASELINE_CATEGORIES;
 const tagged=state.journals.filter(j=>categories.some(c=>c.id===j.baselineCategory));
 const prevTotal=tagged.filter(j=>baselinePhase(j)==='before').reduce((n,j)=>n+(j.photos?.length||0),0);
 const nextTotal=tagged.filter(j=>baselinePhase(j)==='after').reduce((n,j)=>n+(j.photos?.length||0),0);
 const totalPairs=categories.reduce((n,c)=>n+baselineComparisonPairs(c.id).length,0);
 const sorted=[...tagged].sort((a,b)=>(b.date||'').localeCompare(a.date||''));
 return `${heading('철거 전·후 사진 비교','엄마 집의 처음 모습과 이후 현장을 장소별로 연결해 변화 과정을 확인하세요.',navButton('journal','전체 사진일기 보기','btn'))}
 <section class="baseline-hero card"><div><span class="eyebrow">BEFORE / AFTER · HOUSE HISTORY</span><h2>처음 모습부터 완공까지, 한자리에서.</h2><p>먼저 철거 전 사진을 올리고, 같은 장소를 다시 촬영한 다음 연결하면 슬라이더로 전·후를 비교할 수 있어요.</p><div class="baseline-hero-counts"><span>철거 전 <strong>${prevTotal}장</strong></span><span>이후 <strong>${nextTotal}장</strong></span><span>연결된 비교 <strong>${totalPairs}쌍</strong></span></div></div><div class="baseline-hero-actions"><button class="btn primary" data-open="journal" data-baseline="exterior" data-phase="before">${icon('plus',16)} 최초 현황 등록</button><a type="button" data-action="scroll-compare" class="btn baseline-compare-jump">${icon('arrow',16)} 사진 비교 보기</a></div></section>
 <div class="baseline-step-note"><span><b>1</b> 철거 전 사진 등록</span><span>${icon('arrow',15)}</span><span><b>2</b> 이후 사진과 연결</span><span>${icon('arrow',15)}</span><span><b>3</b> 비교 슬라이더 확인</span></div>
 <section class="baseline-grid" aria-label="철거 전후 사진 분류">
 ${categories.map(c=>{
  const before=baselineBeforePhotos(c.id),after=baselineRows(c.id,'after').flatMap(j=>j.photos||[]);
  return `<article class="card baseline-category" data-album-category="${esc(c.id)}"><div class="baseline-category-title"><span class="baseline-icon">${icon(c.icon,22)}</span><div><h2>${esc(c.name)}</h2><span>철거 전 ${before.length}장 · 이후 ${after.length}장</span></div></div><p>${esc(c.desc)}</p><div class="baseline-preview">${before.length?before.slice(0,3).map(({photo})=>`<button class="photo-thumb" data-action="preview-file" data-id="${esc(photo.id)}" aria-label="${esc(photo.name)} 확대"><img data-blob="${esc(photo.id)}" alt="${esc(c.name)} 철거 전 사진" loading="lazy"></button>`).join(''):`<div class="baseline-blank">${icon('camera',25)}<span>철거 전 사진을 등록해 주세요</span></div>`}</div><div class="baseline-category-actions"><button class="btn baseline-add" data-open="journal" data-baseline="${c.id}" data-phase="before">${icon('plus',16)} 철거 전</button><button class="btn baseline-after-add" data-open="journal" data-baseline="${c.id}" data-phase="after">${icon('plus',16)} 이후 사진</button></div></article>`;
 }).join('')}
 </section>
 <section class="baseline-comparison-section" id="compareArea"><div class="section-heading"><div><span class="eyebrow">SIDE BY SIDE · THEN & NOW</span><h2>전·후 사진 직접 비교</h2><p>경계선을 좌우로 움직여 변화된 모습을 살펴보세요. 촬영 위치가 비슷한 사진을 연결할수록 정확하게 비교할 수 있어요.</p></div></div>
 ${categories.map(c=>{const pairs=baselineComparisonPairs(c.id);if(!pairs.length)return '';return `<div class="baseline-compare-group"><h3>${esc(c.name)} <span>${pairs.length}쌍</span></h3><div class="baseline-pair-grid">${pairs.map(p=>`<article class="card baseline-pair"><div class="baseline-pair-title"><strong>${esc(p.record.title)}</strong><span class="chip">${dateLabel(p.before.j.date)} → ${dateLabel(p.record.date)}</span></div><div class="baseline-compare-viewport" style="--split:50%"><img class="baseline-before-photo" data-blob="${esc(p.before.photo.id)}" alt="${esc(c.name)} 철거 전 사진"><img class="baseline-after-photo" data-blob="${esc(p.after.id)}" alt="${esc(c.name)} 이후 사진"><div class="baseline-split-line" aria-hidden="true"></div><span class="baseline-over-label">BEFORE · 이전</span><span class="baseline-over-label after">AFTER · 이후</span></div><label class="baseline-slide-label">전·후 비교 <input class="baseline-compare-range" type="range" min="0" max="100" value="50" aria-label="${esc(c.name)} 전후 비교 위치 조절"></label><div class="baseline-pair-actions"><button class="btn sm" data-action="preview-file" data-id="${esc(p.before.photo.id)}">이전 사진 확대</button><button class="btn sm" data-action="preview-file" data-id="${esc(p.after.id)}">이후 사진 확대</button><button class="btn ghost sm" data-open="journal" data-id="${esc(p.record.id)}">연결 수정</button></div></article>`).join('')}</div></div>`}).join('')||empty('아직 연결된 전·후 사진이 없어요','철거 전 사진을 등록한 뒤 이후 사진에서 비교할 사진을 선택해 주세요.')}
 </section>
 <section class="baseline-history"><div class="section-heading"><div><span class="eyebrow">PHOTO RECORDS</span><h2>철거 전·후 전체 기록</h2><p>사진 아래의 ‘이후 사진 연결’을 누르면 해당 사진을 기준으로 새 사진을 등록할 수 있어요.</p></div></div>
 ${sorted.length?sorted.map(j=>{
  const before=baselinePhase(j)==='before';const cat=categories.find(c=>c.id===j.baselineCategory);const beforeRef=before?'':baselineBeforePhotos(j.baselineCategory).find(x=>x.photo.id===j.baselineBeforeId);
  return `<article class="card baseline-record" data-record-id="${esc(j.id)}"><div class="baseline-record-top"><span class="chip">${esc(cat?.name||'현황')} · ${before?'철거 전':'이후'}</span><span class="small muted">${dateLabel(j.date)}</span></div><h3>${esc(j.title)}</h3>${j.photos?.length?`<div class="baseline-history-photos">${j.photos.map(f=>`<div class="baseline-history-photo"><button class="photo-thumb" data-action="preview-file" data-id="${esc(f.id)}" aria-label="${esc(f.name)} 확대"><img data-blob="${esc(f.id)}" alt="${esc(j.title)} 사진" loading="lazy"></button>${before?`<button class="baseline-link-photo" data-open="journal" data-baseline="${esc(j.baselineCategory)}" data-phase="after" data-before-photo="${esc(f.id)}">이후 사진 연결 ${icon('arrow',13)}</button>`:''}</div>`).join('')}</div>`:''}${j.body?`<p class="journal-body">${esc(j.body)}</p>`:''}${j.siteNotes?`<p class="journal-body"><strong>현장 특이사항</strong> ${esc(j.siteNotes)}</p>`:''}${!before?`<p class="baseline-connection-status">${beforeRef?'연결됨 · '+esc(beforeRef.j.title):'아직 비교할 철거 전 사진을 연결하지 않았어요.'}</p>`:''}<div class="baseline-record-actions"><span class="small muted">사진 ${j.photos?.length||0}장 · ${esc(stageName(j.stage))}</span>${editDelete('journal',j.id)}</div></article>`;
 }).join(''):empty('아직 등록된 사진이 없어요','위 다섯 분류에서 철거 전 사진부터 등록해 보세요.')}
 </section>
 <p class="baseline-footnote">현재 선택한 프로젝트의 기록입니다. 일반 개인 프로젝트의 사진은 브라우저 내부에 저장됩니다. 기록이 사라지지 않도록 설정·백업에서 정기적으로 전체 백업을 내려받아 주세요.</p>`;
}
const NAV=[['home','홈 대시보드','home'],['baseline','철거 전·후 비교','camera'],['stages','공사 일정','calendar'],['journal','사진일기','camera'],['budget','예산 관리','wallet'],['files','서류 보관함','folder'],['design','자재·아이디어','palette'],['contacts','현장 연락처','phone'],['care','집 관리수첩','tool'],['projects','프로젝트','list'],['settings','설정·백업','settings']];
const TITLES={...Object.fromEntries(NAV.map(x=>[x[0],x[1]])),landing:'채피움',brand:'채피움 이야기',more:'더보기'};
const clone=v=>JSON.parse(JSON.stringify(v));
let db,state,catalog={schema:2,activeId:null,ids:[]},busy=false,saveQueue=Promise.resolve(),objectURLs=new Map(),lastFocus=null,toastTimer,storageInfo=null;
const ui={page:'landing',stage:'all',taskStatus:'all',stageStatus:'all',journalType:'all',journalMonth:'all',journalStage:'all',docCategory:'all',docSearch:'',designSpace:'all',designStatus:'all',budgetType:'all'};
function freshState(){return {schema:1,project:{title:'',location:'',area:'',landArea:'',buildingArea:'',floorArea:'',buildingType:'',start:'',target:'',budgetGoal:0,description:''},stages:clone(BASE_STAGES),tasks:DEFAULT_TASKS.map(([stage,title])=>({id:id(),stage,title,status:'todo',due:'',memo:'',created:timestamp()})),expenses:[],journals:[],documents:[],designs:[],contacts:[],care:[]};}
function stagesOf(s=state){const list=Array.isArray(s?.stages)?s.stages:BASE_STAGES;const out=list.map(x=>({...x}));for(const row of [...(s?.tasks||[]),...(s?.journals||[])])if(row.stage&&!out.some(x=>x.id===row.stage))out.push({id:row.stage,name:row.stage==='move'?'입주·생활':'기존 단계',desc:'이전 기록에서 보존한 단계입니다.'});return out;}
const stageName=v=>stagesOf().find(x=>x.id===v)?.name||'단계 미지정';
const visibleStages=()=>stagesOf().filter(s=>!s.hidden);
function progress(stageId){const rows=state.tasks.filter(t=>!t.archivedRecord&&t.stage===stageId);const done=rows.filter(t=>t.status==='done').length;return {total:rows.length,done,pct:rows.length?Math.round(done/rows.length*100):(stagesOf().find(s=>s.id===stageId)?.status==='done'?100:0)};}
function overall(){const visible=new Set(visibleStages().map(s=>s.id)),rows=state.tasks.filter(t=>!t.archivedRecord&&visible.has(t.stage));const empty=visibleStages().filter(s=>!rows.some(t=>t.stage===s.id)&&s.status!==undefined);const total=rows.length+empty.length,done=rows.filter(t=>t.status==='done').length+empty.filter(s=>s.status==='done').length;return {total,done,pct:total?Math.round(done/total*100):0};}
function totals(){let estimate=0,contract=0,paid=0;for(const e of state.expenses){if(e.type==='item'){estimate+=Number(e.estimate||0);contract+=Number(e.contract||0);paid+=Number(e.paid||0);}else if(e.type==='estimate')estimate+=Number(e.amount||0);else if(e.type==='contract')contract+=Number(e.amount||0);else if(e.type==='payment')paid+=Number(e.amount||0);}return {estimate,contract,paid};}
const actual=e=>Number(e.type==='item'?e.paid:e.type==='payment'?e.amount:0)||0;
const estimateAmount=e=>Number(e.type==='item'?e.estimate:e.type==='estimate'?e.amount:0)||0;
const contractAmount=e=>Number(e.type==='item'?e.contract:e.type==='contract'?e.amount:0)||0;
function fileRefs(s){const ids=new Set();const add=f=>{if(f?.id)ids.add(f.id)};add(s.project?.cover);for(const j of s.journals||[])for(const f of j.photos||[])add(f);for(const d of s.documents||[])add(d.file);for(const d of s.designs||[]){add(d.photo);for(const p of d.photos||[])add(p);}for(const e of s.expenses||[])add(e.receipt);for(const st of s.stages||[])add(st.file);return ids;}
function toast(message){const t=$('#toast');t.textContent=message;t.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.classList.remove('show'),4000);}
function openDB(){return new Promise((resolve,reject)=>{const r=indexedDB.open('house_time_private_v1',1);r.onupgradeneeded=()=>{r.result.createObjectStore('meta');r.result.createObjectStore('attachments')};r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)});}
function read(name,key){return new Promise((resolve,reject)=>{const tx=db.transaction(name);const r=key===undefined?tx.objectStore(name).getAll():tx.objectStore(name).get(key);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)});}
function transaction(names,work){return new Promise((resolve,reject)=>{const tx=db.transaction(names,'readwrite');try{work(tx)}catch(e){tx.abort();reject(e);return}tx.oncomplete=resolve;tx.onabort=()=>reject(tx._failure||tx.error||Error('저장이 취소되었습니다.'));tx.onerror=()=>reject(tx._failure||tx.error||Error('저장하지 못했습니다.'));});}
// Compare revisions within the write transaction so an older tab cannot overwrite newer records.
function workspaceWrite(expected,work,names=['meta'],allowLegacyConflict=false){return transaction(names,tx=>{const m=tx.objectStore('meta'),req=m.get('workspace');const fail=message=>{tx._failure=Error(message);tx.abort();};const apply=()=>{try{work(tx)}catch(e){tx._failure=e;tx.abort();}};req.onsuccess=()=>{const current=req.result;if((current?.revision||0)!==expected)return fail('다른 탭에서 기록이 변경되었습니다. 입력 내용을 보관한 뒤 새로고침해 주세요.');if(!current||allowLegacyConflict)return apply();let left=current.activeId?2:1,legacy,active;const done=()=>{if(--left)return;try{if(JSON.stringify(legacy??null)!==JSON.stringify(active??null))return fail('이전 버전 탭에서 기록이 변경되었습니다. 새로고침하면 별도 프로젝트로 보존합니다.');apply();}catch(e){tx._failure=e;tx.abort();}};const r=m.get('state');r.onsuccess=()=>{legacy=r.result;done();};if(current.activeId){const a=m.get('project:'+current.activeId);a.onsuccess=()=>{active=a.result;done();};}};});}
function withStoredFiles(tx,refs,work){if(!refs.size)return work();let pending=refs.size;for(const key of refs){const r=tx.objectStore('attachments').getKey(key);r.onsuccess=()=>{if(r.result===undefined){tx._failure=Error('첨부파일을 읽을 수 없어 저장하지 않았습니다. 파일을 다시 선택해 주세요.');tx.abort();return;}if(!--pending)work();};}}
function queue(work){saveQueue=saveQueue.catch(()=>{}).then(work);return saveQueue;}
async function allProjects(){await saveQueue.catch(()=>{});return Promise.all(catalog.ids.map(async key=>({id:key,state:await read('meta','project:'+key)})));}
// Keep the v1 active-state pointer and the project catalog in the same metadata transaction.
async function persist(next){const key=catalog.activeId;if(!key)throw Error('프로젝트를 먼저 만들어 주세요.');const snapshot=clone(next),expected=catalog.revision||0,cat={...clone(catalog),revision:expected+1},shared=key===window.chaeFamilyBridge?.familyId;if(shared)await window.chaeFamilyBridge.save(snapshot);await queue(()=>workspaceWrite(expected,tx=>{const write=()=>{const m=tx.objectStore('meta');m.put(snapshot,'project:'+key);m.put(snapshot,'state');m.put(cat,'workspace');};if(shared)write();else withStoredFiles(tx,fileRefs(snapshot),write)},['meta',...(shared?[]:['attachments'])]));catalog=cat;state=snapshot;}
async function refreshStorage(){try{storageInfo=await navigator.storage?.estimate?.()}catch{} }
async function putFile(file,imageOnly=false){if(file.size>30*1024*1024)throw Error('첨부파일 한 개는 30MB 이하로 선택해 주세요.');if(imageOnly&&!/^image\//.test(file.type))throw Error('사진 형식의 파일을 선택해 주세요.');let blob=file,name=file.name,type=file.type||'application/octet-stream';if(/^image\/(jpeg|png|webp)$/.test(type)&&file.size>250*1024){try{blob=await resizeImage(file);name=name.replace(/\.[^.]+$/,'')+'.jpg';type='image/jpeg'}catch{}}
const ref={id:id(),name,type,size:blob.size};await transaction(['attachments'],tx=>tx.objectStore('attachments').put({...ref,blob,added:timestamp()},ref.id));return ref;}
async function removeUnused(ids){await saveQueue.catch(()=>{});const current=await read('meta','workspace');const projects=await Promise.all(current.ids.map(key=>read('meta','project:'+key)));const used=new Set(projects.flatMap(s=>[...fileRefs(s)]));const remove=[...ids].filter(i=>!used.has(i));if(!remove.length)return;await workspaceWrite(current.revision||0,tx=>{for(const i of remove)tx.objectStore('attachments').delete(i);},['meta','attachments']);for(const i of remove){if(objectURLs.has(i))URL.revokeObjectURL(objectURLs.get(i));objectURLs.delete(i);}}
async function ensureFile(key){let f=await read('attachments',key);if(!f&&catalog.activeId===window.chaeFamilyBridge?.familyId){f=await window.chaeFamilyBridge.fetchFile(key);await transaction(['attachments'],tx=>tx.objectStore('attachments').put(f,key));}return f;}
async function oneImg(img){if(!img.isConnected)return;const key=img.dataset.blob;try{let url=objectURLs.get(key);if(!url){const f=await ensureFile(key);if(!f)return;url=URL.createObjectURL(f.blob);objectURLs.set(key,url);}if(img.isConnected)img.src=url;}catch(e){console.warn('Photo unavailable',e)}}
function loadImgs(){const imgs=[...document.querySelectorAll('img[data-blob]')];if('IntersectionObserver' in window){const obs=new IntersectionObserver(entries=>{for(const e of entries)if(e.isIntersecting){obs.unobserve(e.target);oneImg(e.target)}},{rootMargin:'350px'});for(const img of imgs)obs.observe(img);}else for(const img of imgs)oneImg(img);}
function projectPhoto(css=''){return state.project.cover?`<img class="${css}" data-blob="${esc(state.project.cover.id)}" alt="${esc(state.project.title)} 대표 사진">`:`<button class="summary-photo-empty" data-open="project">${icon('image',28)}<strong>우리 집 대표 사진을 등록해 보세요</strong><span>프로젝트 정보에서 사진 추가하기 ${icon('plus',14)}</span></button>`;}
// Presentation only: retain the existing progress calculation and stored stage states.
function summaryStageState(s){const p=progress(s.id);if(p.total?p.done===p.total:s.status==='done')return 'done';return s.status==='doing'||state.tasks.some(t=>t.stage===s.id&&t.status==='doing')?'current':'planned';}
function summaryStatus(){const stages=visibleStages(),o=overall(),active=stages.find(s=>summaryStageState(s)==='current');if(active)return `${active.name} 단계 진행 중`;if(stages.length&&stages.every(s=>summaryStageState(s)==='done'))return '집짓기 완료';const tracked=stages.filter(s=>s.status||progress(s.id).total);if(!tracked.length)return '진행 상황을 기록해 보세요';if(!o.done&&tracked.every(s=>!s.status||s.status==='todo'))return '집짓기 준비 중';const build=stages.find(s=>s.id==='build');if(build&&summaryStageState(build)==='planned'&&!progress(build.id).done)return '공사 준비 중';return '진행 상황을 기록해 보세요';}
function summarySchedule(){const {start,target}=state.project;return `<div class="summary-schedule"><p>${start&&target?`착공 ${dateLabel(start)} · 준공 목표 ${dateLabel(target)}`:start?`착공 목표: ${dateLabel(start)}`:target?`준공 목표: ${dateLabel(target)}`:'일정 미설정'}</p>${start&&target?'':`<span>${start?'준공 목표일을 추가해 보세요.':target?'착공 예정일을 입력하면 공사 계획을 정리하기 좋아요.':'착공일과 준공 목표일을 입력하면 전체 일정을 한눈에 확인할 수 있어요.'}</span>`}</div>`;}
function projectSummary(){const o=overall();return `<section class="project-hero project-summary card${state.project.cover?' has-cover':''}" aria-label="프로젝트 요약"><div class="project-hero-body"><div class="summary-top"><span class="summary-status">${esc(summaryStatus())}</span><span class="summary-progress-label">전체 진행률 <strong>${o.pct}%</strong></span></div><div class="summary-title-block"><span class="summary-kicker">우리 집 프로젝트</span><h2>${esc(state.project.title)}</h2><p class="summary-description">${esc(state.project.description||'가족이 함께 기록하는 집짓기 과정')}</p></div>${summarySchedule()}<div class="summary-progress" role="progressbar" aria-label="전체 진행률" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${o.pct}"><span style="width:${o.pct}%"></span></div><div class="summary-actions"><button class="btn summary-record" data-open="journal">${icon('plus',16)} 오늘의 현장 기록</button><button class="btn summary-plan" data-nav="stages">공사 일정 보기 ${icon('arrow',16)}</button></div></div><div class="project-photo">${projectPhoto()}${state.project.cover?'<button class="summary-photo-edit" data-open="project" aria-label="프로젝트 대표 사진 변경">'+icon('edit',15)+' 사진 변경</button>':''}</div><div class="summary-journey"><div class="summary-journey-heading"><h3>집이 완성되기까지</h3><button class="btn ghost sm" data-nav="stages">단계 관리 ${icon('arrow',14)}</button></div><div class="summary-stages" aria-label="공사 단계별 진행 현황">${visibleStages().map(s=>{const status=summaryStageState(s),label={done:'완료',current:'진행 중',planned:'예정'}[status];return `<button data-nav="stages" class="summary-stage ${status}" aria-label="${esc(s.name)}: ${label}"${status==='current'?' aria-current="step"':''}>${status==='done'?icon('check',14):''}<span>${esc(s.name)}</span><small>${label}</small></button>`}).join('')}</div><p class="summary-note">표시한 단계의 체크리스트와 기록한 단계 상태를 기준으로 계산해요.</p></div></section>`;}


function heading(title,desc='',actions=''){return `<div class="page-intro"><div><div class="eyebrow">YOUR HOME, YOUR JOURNEY.</div><h1>${title}</h1>${desc?`<p>${desc}</p>`:''}</div><div class="button-line">${actions}</div></div>`;}
function empty(title,desc,action=''){return `<div class="empty"><span class="empty-line-icon">${icon('book',30)}</span><strong>${title}</strong><p>${desc}</p>${action}</div>`;}
function actionButton(action,label,extra='',cls='btn'){return `<button class="${cls}" data-action="${action}" ${extra}>${label}</button>`;}
function navButton(page,label,cls='btn'){return `<button class="${cls}" data-nav="${page}">${label}</button>`;}
function editDelete(kind,key){return `<div class="record-actions"><button class="icon-btn" data-open="${kind}" data-id="${esc(key)}" aria-label="수정">${icon('edit')}</button><button class="icon-btn" data-action="delete" data-kind="${kind}" data-id="${esc(key)}" aria-label="삭제">${icon('trash')}</button></div>`;}
function stageOptions(){return stagesOf().map(s=>[s.id,s.name+(s.hidden?' (숨김)':'')]);}
function options(values,current){return values.map(v=>{const [key,label]=Array.isArray(v)?v:[v,v];return `<option value="${esc(key)}" ${key===current?'selected':''}>${esc(label)}</option>`}).join('');}
function filters(items){return `<div class="filter-bar">${items.join('')}</div>`;}
function selectFilter(label,key,values,current){return `<label class="filter-label"><span>${label}</span><select data-filter="${key}">${options(values,current)}</select></label>`;}
function fileControls(ref){return ref?`<div class="file-controls">${actionButton('preview-file',icon('folder',15)+' 열기',`data-id="${esc(ref.id)}"`,'btn sm')}${actionButton('download-file',icon('download',15)+' 다운로드',`data-id="${esc(ref.id)}"`,'btn sm')}<span>${esc(ref.name)}</span></div>`:'';}
function upcoming(){return `<section class="upcoming section-block"><div class="section-heading"><div><span class="eyebrow">ROADMAP</span><h2>집을 짓는 여정, 그다음 이야기</h2><p>기록과 관리부터 시작합니다. 다음 서비스는 아직 준비중입니다.</p></div></div><div class="roadmap-grid">${[['자재 탐색·비교','원하는 자재를 비교하는 시간','palette'],['건축사·시공사 연결','나에게 맞는 전문가와의 만남','tool'],['건축 사례 탐색','다양한 집짓기 경험과 영감','home'],['건축주 커뮤니티','함께 질문하고 나누는 이야기','phone']].map(([t,d,ic])=>`<div class="card roadmap-card"><span>${icon(ic,24)}</span><small class="chip">준비중</small><h3>${t}</h3><p>${d}</p></div>`).join('')}</div></section>`;}
function landing(){return `<section class="platform-hero"><img src="./assets/images/home-daylight.webp?v=platform-2" alt="따뜻한 햇살 속 주택을 표현한 채피움 브랜드 이미지" fetchpriority="high"><div class="platform-hero-content"><span class="eyebrow">YOUR HOME, YOUR JOURNEY.</span><h1>집을 짓는 모든 순간을,<br>채피움에.</h1><p>처음 집을 꿈꾸던 날부터 완공의 순간까지,<br>나만의 집짓기 여정을 기록하고 관리하세요.</p><div class="button-line">${actionButton('start-project','나의 집짓기 시작하기 '+icon('arrow',17),'','btn primary')}${navButton('brand','채피움 알아보기','btn')}</div><span class="local-badge">로그인 없이 시작하는 로컬 저장 버전</span></div></section><div class="landing-content"><section class="landing-features">${[['journal','사진일기','공사 과정을 한눈에','camera'],['stages','일정 관리','단계별 진행 상황','calendar'],['budget','예산 관리','계획부터 지출까지','wallet'],['files','서류 보관함','중요한 서류를 안전하게','folder']].map(([p,t,d,ic])=>`<button class="card landing-feature" data-nav="${p}"><span>${icon(ic,25)}</span><h2>${t}</h2><p>${d}</p></button>`).join('')}</section><section class="landing-intro section-block"><div><span class="eyebrow">한 채의 집, 수많은 선택</span><h2>짓는 순간을 기록하고,<br>당신의 이야기로 남기세요.</h2></div><p>도면을 펼치던 날, 첫 삽을 뜨던 순간, 창문이 달리고 공간이 완성되어 가는 시간. 채피움은 집을 짓는 모든 건축주가 자신의 여정을 정리하는 공간입니다.</p></section><section class="landing-journey section-block"><div class="section-heading"><div><span class="eyebrow">BUILD YOUR JOURNEY</span><h2>계획부터 완공까지, 한 걸음씩</h2></div></div><ol>${BASE_STAGES.map((st,i)=>`<li><span>${String(i+1).padStart(2,'0')}</span><h3>${st.name}</h3><p>${st.desc}</p></li>`).join('')}</ol></section><section class="section-block"><div class="section-heading"><div><span class="eyebrow">A PLACE FOR EVERY DETAIL</span><h2>기록부터 관리까지, 한곳에.</h2><p>필요한 순간에 쉽게 찾을 수 있도록 집짓기의 자료를 정리하세요.</p></div></div><div class="landing-preview"><div class="card"><div class="preview-photos" aria-label="사진일기 기능 소개"><img src="./assets/images/home-daylight.webp" alt="사진 기록의 배치를 보여주는 브랜드 이미지" loading="lazy"><span>사진일기 · 기능 미리보기</span></div><h2>집이 만들어지는<br>시간의 기록</h2><p>사진 여러 장과 작업 내용, 현장 메모와 오늘의 결정을 날짜별로 모아요.</p>${navButton('journal','사진일기 열기 '+icon('arrow',15))}</div><div class="card"><div class="preview-budget" aria-label="예산 관리 기능 소개"><i></i><div><span>견적</span><span>계약</span><span>지급</span></div></div><h2>기대와 현실을<br>함께 살피는 예산</h2><p>금액의 성격을 구분해 기록하고 분류별·월별 실제 지출을 확인해요.</p>${navButton('budget','예산 관리 열기 '+icon('arrow',15))}</div><div class="card"><div class="preview-folders" aria-label="서류 분류 기능 소개">${['설계도면','계약서','인허가'].map(t=>`<span>${icon('folder',18)} ${t}</span>`).join('')}</div><h2>찾아야 할 자료를<br>제자리에</h2><p>이름과 분류, 날짜와 메모로 서류를 보관하고 빠르게 검색해요.</p>${navButton('files','서류 보관함 열기 '+icon('arrow',15))}</div></div></section>${upcoming()}${brandTeaser()}<footer class="site-footer"><img src="./assets/brand/logo-main.png" alt="채피움 CHAEPIUM" width="1400" height="680"><p>집을 짓는 여정이 당신의 이야기가 됩니다.</p><span>기록은 이 브라우저에 저장됩니다. 다른 기기와 자동으로 동기화되지 않습니다.</span>${navButton('settings','백업과 저장 방식','btn ghost sm')}</footer></div>`;}
function familyIdeasShortcut(){return catalog.activeId==='family-moms-garden'?`<button type="button" class="family-ideas-shortcut" data-nav="design" aria-label="엄마의 뜰 가족 아이디어 열기"><span>${icon('palette',21)}</span><span><strong>엄마의 뜰 · 가족 아이디어</strong><small>같은 프로젝트에서 삼남매가 참고 사진과 링크를 함께 모아요.</small></span><span>${icon('arrow',19)}</span></button>`:'';}
function shortcuts(){return `<div class="dashboard-shortcuts">${[['journal','사진일기','camera'],['stages','일정','calendar'],['budget','예산','wallet'],['files','서류함','folder']].map(([p,t,ic])=>`<button data-nav="${p}"><span>${icon(ic,23)}</span><b>${t}</b></button>`).join('')}</div>`;}
function familyAtGlance(){
 const today=localDate(),all=(state.tasks||[]).filter(t=>!t.archivedRecord),open=all.filter(t=>t.status!=='done'),dated=open.filter(t=>t.due).sort((a,b)=>a.due.localeCompare(b.due));
 const late=dated.filter(t=>t.due<today),next=dated.filter(t=>t.due>=today),list=[...late,...next].slice(0,4),o=overall(),t=totals();
 return `<section class="family-glance card" aria-label="엄마의 뜰 한눈에 보기">
 <div class="family-glance-heading"><div><span class="eyebrow">PROJECT AT A GLANCE</span><h2>${esc(state.project.title)}, 한눈에 보기</h2><p>우리 집 공사 상황과 꼭 챙길 일정을 한자리에서</p></div><button class="btn sm" data-nav="stages">일정 전체 보기 ${icon('arrow',15)}</button></div>
 <div class="family-metrics">
 <button data-nav="stages"><small>전체 진행률</small><strong>${o.pct}%</strong><span>완료 ${o.done} / 전체 ${o.total}</span></button>
 <button data-nav="stages"><small>다가올 일정</small><strong>${next.length}건</strong><span>${next[0]?.due?dateLabel(next[0].due):'날짜를 정해 주세요'}</span></button>
 <button data-nav="stages"><small>미완료 할 일</small><strong>${open.length}건</strong><span>${late.length?'지연 '+late.length+'건 확인 필요':'기한 경과 없음'}</span></button>
 <button data-nav="budget"><small>실제 지출</small><strong>${compactMoney(t.paid)}</strong><span>예산 ${state.project.budgetGoal?compactMoney(state.project.budgetGoal):'미설정'}</span></button></div>
 <div class="family-upcoming"><div class="family-upcoming-title"><h3>가장 먼저 챙길 일정</h3><button data-open="task" class="btn sm">${icon('plus',14)} 일정 추가</button></div>
 ${list.length?list.map(t=>`<div class="family-upcoming-row"><span class="${t.due<today?'is-late':''}">${dateLabel(t.due)}</span><strong>${esc(t.title)}</strong><small>${esc(stageName(t.stage))}</small></div>`).join(''):'<p class="family-upcoming-empty">날짜가 정해진 일정이 없어요. 첫 일정을 등록하면 여기부터 표시돼요.</p>'}
 </div></section>`;
}
function home(){if(!catalog.activeId)return projectsPage();if(catalog.activeId==='family-moms-garden')return familyRecordHome();const o=overall(),t=totals();const tracked=visibleStages().filter(s=>progress(s.id).total||s.status);const current=tracked.find(s=>progress(s.id).pct<100)||tracked.at(-1)||visibleStages()[0];const now=new Date(),today=localDate(now),weekday=(now.getDay()+6)%7,weekStart=localDate(new Date(now.getFullYear(),now.getMonth(),now.getDate()-weekday)),week=localDate(new Date(now.getFullYear(),now.getMonth(),now.getDate()+6-weekday));const visibleIds=new Set(visibleStages().map(s=>s.id));const pending=state.tasks.filter(t=>!t.archivedRecord&&t.status!=='done'&&visibleIds.has(t.stage)).sort((a,b)=>(a.due||'9999').localeCompare(b.due||'9999'));const next=pending.find(t=>t.due&&t.due>=today);const weekly=pending.filter(t=>t.due&&t.due>=weekStart&&t.due<=week);const overdue=pending.filter(t=>t.due&&t.due<today);const decisions=state.journals.filter(j=>j.type==='결정기록'||j.decision).sort((a,b)=>b.date.localeCompare(a.date)).slice(0,3);const journals=[...state.journals].sort((a,b)=>b.date.localeCompare(a.date)).slice(0,3);
return `${heading('나의 집 대시보드','집을 짓는 여정의 오늘을 확인하세요.',`<button class="btn" data-nav="projects">${icon('home',16)} 프로젝트</button><button class="btn" data-open="project">${icon('edit',16)} 정보 수정</button>`)}${beforeAfterBanner()}${familyIdeasShortcut()}${catalog.activeId==='family-moms-garden'?familyAtGlance():''}${projectSummary()}${shortcuts()}<div class="stats-grid"><div class="card stat"><span>총예산</span><strong>${state.project.budgetGoal?compactMoney(state.project.budgetGoal):'미설정'}</strong><small>프로젝트 목표 총예산</small></div><div class="card stat"><span>예상 견적</span><strong>${compactMoney(t.estimate)}</strong><small>예상금액 합계</small></div><div class="card stat"><span>계약금액</span><strong>${compactMoney(t.contract)}</strong><small>현금 지출과 별도</small></div><div class="card stat"><span>실제 지출</span><strong>${compactMoney(t.paid)}</strong><small>실제 지급액 합계</small></div></div><div class="dashboard-grid"><section class="card pane"><div class="pane-heading"><h2>다가오는 일정</h2>${navButton('stages','전체 보기','btn ghost sm')}</div>${next?`<div class="next-task"><span>${dateLabel(next.due)}</span><h3>${esc(next.title)}</h3><p>${esc(stageName(next.stage))}</p></div>`:empty('우리 집의 공사 계획을 시작해 보세요.','준비부터 완공까지 필요한 단계를 차근차근 정리할 수 있어요.','<button class="btn" data-open="task">일정 등록하기</button>')}<h3 class="subheading">이번 주 할 일 <span>${weekly.length}</span></h3>${weekly.slice(0,4).map(taskRow).join('')||'<p class="muted small">이번 주에 예정된 할 일이 없습니다.</p>'}${overdue.length?`<div class="banner warning"><strong>기한이 지난 할 일 ${overdue.length}개</strong><p>일정 화면에서 진행 상황과 기한을 확인해 주세요.</p></div>`:''}</section><section class="card pane"><div class="pane-heading"><h2>최근 사진일기</h2><button class="btn sm" data-open="journal">${icon('plus',14)} 기록</button></div>${journals.map(j=>`<button class="recent-journal" data-nav="journal">${j.photos?.[0]?`<img data-blob="${esc(j.photos[0].id)}" alt="${esc(j.title)}">`:`<span>${icon('book',22)}</span>`}<div><small>${dateLabel(j.date)}</small><h3>${esc(j.title)}</h3><p>${esc(j.decision||j.body||'')}</p></div>${icon('arrow',16)}</button>`).join('')||empty('우리 집의 첫 순간을 남겨보세요.','현장 사진을 등록하면 집이 완성되어 가는 과정을 날짜별로 확인할 수 있어요.','<button class="btn" data-open="journal">사진 등록하기</button>')}<h3 class="subheading">최근 결정사항</h3>${decisions.map(j=>`<div class="decision-row"><span>${dateLabel(j.date)}</span><p>${esc(j.decision||j.title)}</p></div>`).join('')||'<p class="muted small">사진일기에 오늘의 결정을 남기면 모아 보여드려요.</p>'}</section></div>`;}


function activityContent(j){return [j.body,j.siteNotes,j.decision,j.memo].filter(Boolean).join(' · ');}

function familyHomePhotos(){
 const records=[];
 const add=(photo,caption,date,origin,category='')=>{
  if(!photo?.id||(photo.type&&!photo.type.startsWith('image/')))return;
  records.push({...photo,caption,date:date||'',origin,category});
 };
 for(const j of state.journals||[])for(const p of j.photos||[])add(p,j.title,j.date,'journal',j.baselineCategory||'');
 for(const d of state.designs||[])for(const p of designPictures(d))add(p,d.title,d.created?.slice(0,10),'design');
 for(const d of state.documents||[])if(d.file?.type?.startsWith('image/'))add(d.file,d.title,d.date||d.added?.slice(0,10),'document');
 records.sort((a,b)=>b.date.localeCompare(a.date));
 if(state.project.cover)add(state.project.cover,state.project.title+' 대표 사진','9999-12-31','cover');
 const seen=new Set();
 return records.filter(p=>!seen.has(p.id)&&seen.add(p.id));
}
function familyHomeDocuments(){
 return [...(state.documents||[])].sort((a,b)=>(b.date||b.added||b.created||'').localeCompare(a.date||a.added||a.created||''));
}
function familyActivityRow(item){
 const record=item.row,isMemo=item.kind==='task-memo',content=isMemo?record.memo:activityContent(record),kind=isMemo?'할 일 메모':record.type||'현장 기록';
 const photos=!isMemo&&Array.isArray(record.photos)?record.photos.filter(p=>p?.id):[];
 const action=isMemo?'view-task':'view-record';
 return `<article class="record-feed-item record-entry" ${isMemo?'':`data-record-id="${esc(record.id)}"`}>
 <button type="button" class="record-feed-open" data-action="${action}" data-id="${esc(record.id)}" aria-label="${esc(record.title)} 상세보기">
 <span class="record-feed-date">${dateLabel(item.date)} <span class="record-feed-type">· ${esc(kind)}</span></span>
 <strong>${esc(record.title)}</strong>
 ${content?`<span class="record-feed-preview">${esc(content)}</span>`:`<span class="record-feed-preview record-feed-no-note">등록된 내용은 상세보기에서 확인할 수 있어요.</span>`}
 <span class="record-feed-more">상세보기 ${icon('arrow',13)}</span></button>
 ${photos.length?`<div class="record-feed-thumbs" aria-label="${esc(record.title)} 첨부 사진">${photos.slice(0,3).map((p,n)=>`<button type="button" class="record-feed-photo" data-action="preview-file" data-id="${esc(p.id)}" aria-label="${esc(record.title)} 사진 ${n+1} 크게 보기"><img data-blob="${esc(p.id)}" alt="" loading="lazy"></button>`).join('')}${photos.length>3?`<span class="record-feed-photo-more">+${photos.length-3}장</span>`:''}</div>`:''}
 </article>`;
}
function familyUpcomingRow(t,today){
 return `<button type="button" class="record-upcoming-item" data-action="view-task" data-id="${esc(t.id)}"><span class="record-upcoming-date ${t.due<today?'is-late':''}">${dateLabel(t.due)}${t.due<today?' · 기한 지남':''}</span><strong>${esc(t.title)}</strong>${t.memo?`<span class="record-upcoming-note">${esc(t.memo)}</span>`:''}</button>`;
}
function familyDocumentRow(d){
 const type=d.file?.type==='application/pdf'?'PDF':d.file?.type?.startsWith('image/')?'사진':d.file?.name?.split('.').pop()?.toUpperCase()||'서류';
 return `<button type="button" class="family-doc-row" data-action="view-document" data-id="${esc(d.id)}"><span class="family-doc-icon">${icon('folder',17)}</span><span class="family-doc-text"><strong>${esc(d.title)}</strong><small>${esc(d.category||'서류')} · ${dateLabel(d.date||d.added?.slice(0,10))}${d.file?' · '+esc(type):' · 첨부 없음'}</small></span><span class="family-doc-chevron">${icon('arrow',15)}</span></button>`;
}

function familyHomeHeroPhoto(photos){
 const chosen=state.project.cover?.id;
 if(chosen){const exact=photos.find(p=>p.id===chosen);if(exact)return exact;}
 const records=photos.filter(p=>p.origin==='journal');
 const ranked=[...records].sort((a,b)=>{
  const score=p=>{
   let points=0;
   if(p.category==='exterior')points+=110;
   else if(p.category==='interior')points+=100;
   else if(p.category==='grounds')points+=85;
   else if(p.category==='outbuilding')points+=78;
   else if(p.category==='facilities')points+=64;
   if(/철거\s*전|주택|집\s*외관|실내|현장\s*사진|마당|집\s*내부/.test(p.caption||''))points+=35;
   if(/통화|협의|문의|담당자|서류|공문|견적|전화/.test(p.caption||''))points-=80;
   return points;
  };
  return score(b)-score(a)||b.date.localeCompare(a.date);
 });
 return ranked[0]||photos[0]||null;
}
function familyHomeCoverPicker(){
 if(busy)return;
 const photos=familyHomePhotos().slice(0,80);
 if(!photos.length){openModal('journal');return;}
 lastFocus=document.activeElement;
 $('#modalRoot').innerHTML=`<div class="modal family-cover-modal" role="dialog" aria-modal="true" aria-labelledby="familyCoverTitle">
 <div class="modal-header"><div><span class="eyebrow">HOUSE COVER</span><h2 id="familyCoverTitle">대표 사진 선택</h2></div><button type="button" class="icon-btn" data-action="close-modal" aria-label="닫기">${icon('close',22)}</button></div>
 <div class="modal-body family-cover-modal-body"><p>실제 집의 모습이 잘 보이는 사진을 선택해 주세요. 이미 등록한 사진을 그대로 사용하고, 원본은 이동하거나 삭제하지 않아요.</p>
 <div class="family-cover-picks">${photos.map(p=>`<button type="button" data-action="set-family-cover" data-id="${esc(p.id)}" class="family-cover-choice ${p.id===state.project.cover?.id?'is-selected':''}" aria-label="${esc(p.caption||'사진')}을 대표 사진으로 지정"><span class="family-cover-choice-image"><img data-blob="${esc(p.id)}" alt="" loading="lazy"></span><span class="family-cover-choice-caption">${esc((p.caption||p.name||'현장 사진').slice(0,70))}</span><span class="family-cover-choice-caption-secondary">${p.id===state.project.cover?.id?'현재 대표 사진':'대표 사진으로 지정'}</span></button>`).join('')}</div></div></div>`;
 $('#modalRoot').classList.remove('hidden');document.body.style.overflow='hidden';loadImgs();
 $('#modalRoot').querySelector('[data-action="close-modal"]')?.focus({preventScroll:true});
}
async function familySetHomeCover(key){
 if(catalog.activeId!=='family-moms-garden')throw Error('엄마의 뜰 프로젝트에서만 사용할 수 있어요.');
 const item=familyHomePhotos().find(p=>p.id===key);
 if(!item)throw Error('사진 정보를 찾을 수 없습니다.');
 const file=await ensureFile(key);
 if(!file?.blob||!String(file.type||item.type||'').startsWith('image/'))throw Error('이 사진은 현재 열 수 없어요. 다른 사진을 선택해 주세요.');
 const draft=clone(state);
 draft.project.cover={id:item.id,name:item.name||file.name||'대표 사진',type:item.type||file.type||'image/jpeg',size:Number(item.size||file.size||file.blob.size||0)};
 await persist(draft);
 await refreshProjectSummaries();
 closeModal(true);render();toast('대표 사진을 변경했어요.');
}
function familyRecordHome(){
 const today=localDate();
 const pending=state.tasks.filter(t=>!t.archivedRecord&&t.status!=='done');
 const upcoming=pending.filter(t=>t.due).sort((a,b)=>a.due.localeCompare(b.due));
 const undated=pending.filter(t=>!t.due);
 const todayRecords=state.journals.filter(j=>j.date===today).length;
 const journals=state.journals.map(j=>({kind:'journal',row:j,date:j.date||j.created?.slice(0,10)||'',sort:j.created||''}));
 const taskMemos=state.tasks.filter(t=>t.memo?.trim()&&!t.archivedRecord&&!state.journals.some(j=>j.taskId===t.id&&[j.body,j.memo].some(x=>x&&x.includes(t.memo)))).map(t=>({kind:'task-memo',row:t,date:t.created?.slice(0,10)||t.due||'',sort:t.created||''}));
 const records=[...journals,...taskMemos].sort((a,b)=>(b.date||'').localeCompare(a.date||'')||(b.sort||'').localeCompare(a.sort||''));
 const photos=familyHomePhotos();
 const hero=familyHomeHeroPhoto(photos);
 const recent=photos.filter(p=>p.id!==hero?.id&&(p.origin==='journal'||p.origin==='cover')).slice(0,3);
 const docs=familyHomeDocuments();
 const nearest=upcoming[0];
 const shown=records.slice(0,4),remaining=records.slice(4);
 return `<div class="family-dashboard-v4">
 <header class="family-v4-titlebar">
  <div><span class="family-v4-eyebrow">CHAEPIUM / FAMILY PROJECT</span><h1>${esc(state.project.title||'엄마의 뜰')}</h1><p>현장 사진과 오늘의 기록, 앞으로 할 일을 한눈에 확인해요.</p></div>
  <div class="family-v4-main-actions"><button class="btn primary" data-open="journal" data-record-type="call">${icon('plus',16)} 오늘 기록</button><button class="btn" data-open="task">${icon('plus',15)} 일정 추가</button></div>
 </header>
 <section class="family-v4-top card">
  <div class="family-v4-intro">
   <span class="family-v4-overline">우리 집 기록 현황</span>
   <p class="family-v4-description">${esc(state.project.description||'우리 가족이 함께 기록하는 집짓기 과정')}</p>
   <div class="family-v4-summary">
    <button data-nav="baseline"><strong>${photos.length}</strong><span>등록한 사진</span></button>
    <button data-nav="journal"><strong>${state.journals.length}</strong><span>활동 기록</span></button>
    <button data-nav="files"><strong>${docs.length}</strong><span>등록 서류</span></button>
   </div>
   <div class="family-v4-featured-next"><span>${icon('calendar',16)} 다음 일정</span>
    ${nearest?`<button data-action="view-task" data-id="${esc(nearest.id)}"><strong>${esc(nearest.title)}</strong><small>${dateLabel(nearest.due)}</small>${icon('arrow',15)}</button>`:`<p>아직 날짜가 정해진 일정이 없어요.</p>`}
   </div>
   <div class="family-v4-quicklinks"><button class="btn" data-nav="baseline">철거 전·후 비교</button><button class="btn" data-nav="design">가족 아이디어</button><button class="btn" data-action="pick-family-cover">대표 사진 선택</button></div>
  </div>
  <div class="family-v4-photo-area family-home-photo-group ${recent.length?'':'no-mini'}">
   ${hero?`<div class="family-v4-mainphoto">
    <button class="family-v4-mainphoto-open" type="button" data-action="preview-file" data-id="${esc(hero.id)}" aria-label="대표 현장 사진 크게 보기"><img data-blob="${esc(hero.id)}" alt="" loading="lazy"><span class="family-v4-photo-label">${icon('camera',14)} 현장 사진 크게 보기</span></button>
    <button type="button" class="family-v4-photo-choose" data-action="pick-family-cover">${icon('edit',14)} 사진 변경</button>
   </div>`:`<button class="family-v4-photo-empty" data-open="journal" type="button">${icon('camera',27)}<strong>첫 현장 사진을 등록해 주세요</strong><span>사진을 등록하면 여기에 표시돼요.</span></button>`}
   ${recent.length?`<div class="family-v4-photo-strip">${recent.map(p=>`<button class="family-v4-photo-thumb" type="button" data-action="preview-file" data-id="${esc(p.id)}" aria-label="현장 사진 크게 보기"><img data-blob="${esc(p.id)}" alt="" loading="lazy"></button>`).join('')}${photos.length>recent.length+Number(!!hero)?`<button type="button" class="family-v4-gallery-more" data-nav="journal">+ ${photos.length-recent.length-Number(!!hero)}장 <span>전체 보기</span></button>`:''}</div>`:''}
  </div>
 </section>
 <div class="family-v4-content">
  <section class="card family-v4-activities">
   <div class="family-v4-section-head"><div><span class="family-v4-eyebrow">DAILY NOTES</span><h2>통화·현장 기록 <span>${records.length}</span></h2><p>핵심만 읽고, 자세한 내용은 항목을 눌러 확인하세요.</p></div><button type="button" class="btn sm" data-open="journal" data-record-type="call">${icon('plus',15)} 기록</button></div>
   <div class="family-v4-record-list">${shown.length?shown.map(familyActivityRow).join(''):`<div class="family-v4-empty"><span>첫 통화·현장 기록을 남겨보세요.</span><button class="btn sm" data-open="journal" data-record-type="call">기록하기</button></div>`}
    ${remaining.length?`<details class="record-inline-more"><summary>이전 기록 ${remaining.length}건 더 보기</summary>${remaining.map(familyActivityRow).join('')}</details>`:''}
   </div><div class="family-v4-foot"><span>오늘 ${todayRecords}건 작성</span><button data-nav="journal">전체 활동 기록 보기 ${icon('arrow',14)}</button></div>
  </section>
  <aside class="family-v4-side">
   <section class="card family-v4-schedule"><div class="family-v4-section-head"><div><span class="family-v4-eyebrow">NEXT STEPS</span><h2>다가오는 일정 <span>${pending.length}</span></h2></div><button class="btn sm" data-open="task">${icon('plus',14)} 추가</button></div>
    <div class="family-v4-task-list">${upcoming.length?upcoming.slice(0,4).map(t=>familyUpcomingRow(t,today)).join(''):`<div class="family-v4-empty">예정된 일정이 없어요.</div>`}
    ${upcoming.length>4?`<details class="record-inline-more"><summary>추가 일정 ${upcoming.length-4}건</summary>${upcoming.slice(4).map(t=>familyUpcomingRow(t,today)).join('')}</details>`:''}
    ${undated.length?`<details class="record-inline-more"><summary>날짜 미정 할 일 ${undated.length}건</summary>${undated.map(t=>`<button class="record-undated-button" data-action="view-task" data-id="${esc(t.id)}">${esc(t.title)} ${icon('arrow',13)}</button>`).join('')}</details>`:''}</div>
    <div class="family-v4-foot"><span>세부 일정 관리</span><button data-nav="stages">전체 일정 보기 ${icon('arrow',14)}</button></div>
   </section>
   <section class="card family-v4-documents"><div class="family-v4-section-head"><div><span class="family-v4-eyebrow">DOCUMENTS</span><h2>등록 서류 <span>${docs.length}</span></h2></div><button class="btn sm" data-open="document">${icon('plus',14)} 추가</button></div>
    ${docs.length?`<div class="family-doc-list">${docs.slice(0,3).map(familyDocumentRow).join('')}</div>`:`<div class="family-v4-empty">아직 등록한 서류가 없어요. 도면과 견적서를 한곳에 보관할 수 있어요.</div>`}
    <div class="family-v4-foot"><span>공유 서류 보관</span><button data-nav="files">서류 전체 보기 ${icon('arrow',14)}</button></div>
   </section>
  </aside>
 </div></div>`;
}
function openDocumentDetail(key){
 if(busy)return;
 const d=state.documents.find(x=>x.id===key);
 if(!d)return toast('서류를 찾을 수 없습니다.');
 lastFocus=document.activeElement;
 $('#modalRoot').innerHTML=`<div class="modal record-detail-modal" role="dialog" aria-modal="true" aria-labelledby="family-doc-title"><div class="modal-header"><h2 id="family-doc-title">${esc(d.title)}</h2><button class="icon-btn" data-action="close-modal" aria-label="닫기">${icon('close',22)}</button></div><div class="modal-body record-detail-body"><span class="chip">${esc(d.category||'서류')}</span><dl class="record-detail-meta">${detailLine('등록 날짜',dateLabel(d.date||d.added?.slice(0,10)))}${detailLine('파일명',d.file?.name||'첨부 없음')}</dl>${d.memo?`<section class="record-detail-section"><h3>서류 메모</h3><p class="record-detail-text">${esc(d.memo)}</p></section>`:''}${d.file?`<div class="record-detail-buttons"><button class="btn primary" data-action="preview-file" data-id="${esc(d.file.id)}">파일 열기</button><button class="btn" data-action="download-file" data-id="${esc(d.file.id)}">파일 다운로드</button></div>`:'<p class="small muted">첨부된 파일이 없습니다.</p>'}<div class="record-detail-buttons"><button class="btn" data-action="close-modal">닫기</button><button class="btn" data-open="document" data-id="${esc(d.id)}">서류 수정</button></div></div></div>`;
 $('#modalRoot').classList.remove('hidden');document.body.style.overflow='hidden';
 $('#modalRoot').querySelector('[aria-label="닫기"]')?.focus({preventScroll:true});
}
function detailLine(label,value){
 return value?`<div class="record-detail-line"><dt>${esc(label)}</dt><dd>${esc(value)}</dd></div>`:'';
}
function openItemDetail(kind,key){
 if(busy)return;
 const isTask=kind==='task';
 const record=isTask?state.tasks.find(t=>t.id===key):state.journals.find(j=>j.id===key);
 if(!record)return toast('기록을 찾을 수 없습니다.');
 const linked=isTask?taskLogs(key):[];
 const photos=isTask?[]:(record.photos||[]);
 const fromMemo=isTask&&!record.archivedRecord;
 const type=isTask?'예정된 할 일':record.type||'활동 기록';
 const date=isTask?record.due:record.date;
 const htmlPhotos=(p,r)=>p?.length?`<div class="record-detail-photos">${p.map(f=>`<button class="photo-thumb" data-action="preview-file" data-id="${esc(f.id)}" aria-label="${esc(f.name)} 사진 확대"><img data-blob="${esc(f.id)}" alt="${esc(r.title)} 사진" loading="lazy"></button>`).join('')}</div>`:'';
 lastFocus=document.activeElement;
 $('#modalRoot').innerHTML=`<div class="modal record-detail-modal" role="dialog" aria-modal="true" aria-labelledby="recordDetailTitle"><div class="modal-header"><div><span class="eyebrow">CHAEPIUM · RECORD DETAIL</span><h2 id="recordDetailTitle">${esc(record.title)}</h2></div><button class="icon-btn" data-action="close-modal" aria-label="닫기">${icon('close',22)}</button></div>
 <div class="modal-body record-detail-body"><span class="chip">${esc(type)}</span><dl class="record-detail-meta">${detailLine(isTask?'예정일':'기록일',date?dateLabel(date):'날짜 미정')}${detailLine('공사 단계',stageName(record.stage))}${isTask?detailLine('진행 상태',({todo:'진행 전',doing:'진행 중',done:'완료'})[record.status]||'')+detailLine('담당자',record.owner):detailLine('연결된 할 일',state.tasks.find(t=>t.id===record.taskId)?.title)}</dl>
 ${isTask?`<section class="record-detail-section"><h3>메모</h3><p class="record-detail-text">${esc(record.memo||'등록된 메모 없음')}</p></section>`:`
 ${record.body?`<section class="record-detail-section"><h3>진행 내용·통화 내용</h3><p class="record-detail-text">${esc(record.body)}</p></section>`:''}
 ${record.siteNotes?`<section class="record-detail-section"><h3>현장 특이사항</h3><p class="record-detail-text">${esc(record.siteNotes)}</p></section>`:''}
 ${record.decision?`<section class="record-detail-section"><h3>결정사항</h3><p class="record-detail-text">${esc(record.decision)}</p></section>`:''}
 ${record.memo?`<section class="record-detail-section"><h3>메모</h3><p class="record-detail-text">${esc(record.memo)}</p></section>`:''}
 ${htmlPhotos(photos,record)}`}
 ${isTask&&linked.length?`<section class="record-detail-section"><h3>이 일정과 연결된 기록 ${linked.length}건</h3>${linked.map(j=>`<div class="record-detail-linked"><span>${dateLabel(j.date)} · ${esc(j.type||'활동 기록')}</span><p>${esc(activityContent(j)||j.title)}</p><button class="btn sm" data-action="view-record" data-id="${esc(j.id)}">기록 상세보기</button></div>`).join('')}</section>`:''}
 ${fromMemo?`<div class="record-detail-hint"><strong>이것이 오늘 통화한 내용인가요?</strong><p>통화한 내용을 활동 기록으로 분류하고, 이 항목은 예정 일정에서 제외할 수 있어요.</p><button class="btn" data-action="classify-task-record" data-id="${esc(record.id)}">통화·활동 기록으로 정리</button></div>`:''}
 <div class="record-detail-buttons"><button class="btn" data-action="close-modal">닫기</button><button class="btn primary" data-open="${isTask?'task':'journal'}" data-id="${esc(record.id)}">${icon('edit',14)} 수정하기</button>${isTask?`<button class="btn" data-open="journal" data-task="${esc(record.id)}">${icon('plus',14)} 관련 기록 추가</button>`:''}</div></div></div>`;
 $('#modalRoot').classList.remove('hidden');document.body.style.overflow='hidden';loadImgs();
 $('#modalRoot').querySelector('[aria-label="닫기"]')?.focus({preventScroll:true});
}
async function classifyTaskAsRecord(key){
 const row=state.tasks.find(t=>t.id===key);
 if(!row||row.archivedRecord)return;
 if(!confirm('이 항목을 통화·활동 기록으로 분류하고 예정 일정에서 제외할까요?'))return;
 const draft=clone(state),t=draft.tasks.find(x=>x.id===key);
 if(!t||t.archivedRecord)return;
 t.archivedRecord=true;
 const entry={id:id(),title:t.title,date:(/^\d{4}-\d{2}-\d{2}/.exec(t.created||'')||[])[0]||t.due||localDate(),type:'통화·문의',stage:t.stage,body:t.memo||'',siteNotes:'',decision:'',memo:'',taskId:t.id,created:timestamp(),photos:[]};
 draft.journals.push(entry);
 await persist(draft);
 await refreshProjectSummaries();
 closeModal(true);render();toast('통화 내용을 활동 기록으로 정리했어요. 원본 메모도 남아 있어요.');
}

function taskLogs(taskId){return state.journals.filter(j=>j.taskId===taskId).slice().sort((a,b)=>(b.date||'').localeCompare(a.date||'')||(b.created||'').localeCompare(a.created||''));}
function journalDraftForTask(taskId){
 const t=state.tasks.find(row=>row.id===taskId);if(!t)return null;
 return {taskId:t.id,title:t.title+' · 오늘 한 일',stage:t.stage,date:localDate(),type:'현장일기',body:'',quickEntry:true};
}
function todayTaskLogSummary(){
 const today=localDate(),entries=state.journals.filter(j=>j.date===today);
 const count=entries.reduce((sum,j)=>sum+(j.photos||[]).length,0);
 return `<section class="task-today-card card" aria-label="오늘의 현장 기록"><div><span class="eyebrow">TODAY'S SITE NOTES</span><h2>오늘 한 일</h2><p>${dateLabel(today)} · 기록 ${entries.length}건 · 사진 ${count}장</p></div><p>상단에서 통화·활동을 기록하거나, 할 일의 <strong>+ 기록</strong>을 눌러 해당 일정에 연결할 수 있어요.</p></section>`;
}
function taskRow(t){
 const logs=taskLogs(t.id),latest=logs[0],photos=logs.reduce((sum,j)=>sum+(j.photos?.length||0),0);
 return `<article class="task-row task-log-row" data-task-id="${esc(t.id)}">
 <button class="check ${t.status==='done'?'checked':''}" data-action="toggle-task" data-id="${esc(t.id)}" aria-label="${t.status==='done'?'완료 취소':'할 일 완료'}">${t.status==='done'?icon('check',15):''}</button>
 <div class="task-copy"><button class="task-title-link" type="button" data-action="view-task" data-id="${esc(t.id)}">${esc(t.title)}</button><p>${esc(stageName(t.stage))}${t.due?' · '+dateLabel(t.due):''}${t.owner?' · '+esc(t.owner):''}</p>
 ${t.memo?`<p class="task-visible-memo">${esc(t.memo)}</p>`:latest?`<p class="task-latest-note">${dateLabel(latest.date)} · ${esc(activityContent(latest)||latest.title)}</p>`:''}</div>
 <div class="task-row-actions"><button class="btn sm task-detail-cta" data-action="view-task" data-id="${esc(t.id)}">상세보기</button><button type="button" class="btn sm task-record-cta" data-open="journal" data-task="${esc(t.id)}">${icon('plus',14)} 기록</button>${editDelete('task',t.id)}</div>
 ${logs.length?`<details class="task-log-details"><summary>연결된 기록 ${logs.length}건 · 사진 ${photos}장 <span>펼쳐보기</span></summary>
 <div class="task-log-history">${logs.map(j=>`<div class="task-log-entry" data-record-id="${esc(j.id)}"><div class="task-log-header"><span class="small muted">${dateLabel(j.date)}</span><button class="btn sm" data-action="view-record" data-id="${esc(j.id)}">내용 보기</button>${editDelete('journal',j.id)}</div><p>${esc(activityContent(j)||j.title)}</p>${j.photos?.length?`<div class="task-log-photo-list">${j.photos.map(p=>`<button class="photo-thumb" type="button" data-action="preview-file" data-id="${esc(p.id)}" aria-label="${esc(p.name)} 확대"><img data-blob="${esc(p.id)}" alt="${esc(j.title)} 기록 사진" loading="lazy"></button>`).join('')}</div>`:''}</div>`).join('')}</div></details>`:''}</article>`;
}
function phaseStatus(s){const p=progress(s.id);return p.pct===100?'done':s.status||(state.tasks.some(t=>!t.archivedRecord&&t.stage===s.id&&t.status==='doing')?'doing':'todo');}
function stagesPage(){const all=stagesOf(),list=all.filter(s=>!s.hidden&&(ui.stageStatus==='all'||phaseStatus(s)===ui.stageStatus));const visibleIds=new Set(visibleStages().map(s=>s.id));const tasks=state.tasks.filter(t=>!t.archivedRecord&&(ui.stage==='all'?visibleIds.has(t.stage):t.stage===ui.stage)&&(ui.taskStatus==='all'||t.status===ui.taskStatus));return `${heading('공사 일정 · 체크리스트','지역과 건축 조건에 따라 절차는 달라질 수 있습니다. 관할 부서와 전문가에게 확인해 주세요.',`<button class="btn" data-open="stage">${icon('plus',16)} 단계 추가</button><button class="btn" data-open="journal" data-record-type="call">${icon('plus',16)} 통화·활동 기록</button><button class="btn primary" data-open="task">${icon('plus',16)} 할 일 추가</button>`)}${filters([selectFilter('진행 상태','stageStatus',[['all','전체 단계'],['todo','진행 전'],['doing','진행 중'],['done','완료']],ui.stageStatus)])}<details class="phase-collapsible"><summary>공사 단계별 진행 현황 · ${list.length}개 단계 <span>펼쳐보기</span></summary><div class="phase-timeline">${list.map(s=>{const p=progress(s.id),status=phaseStatus(s);return `<section class="card phase-card"><div class="phase-dot ${p.pct===100?'done':''}">${p.pct===100?icon('check',14):''}</div><div class="phase-heading"><div><span class="eyebrow">${String(all.indexOf(s)+1).padStart(2,'0')}</span><h2>${esc(s.name)}</h2><p>${esc(s.desc||'')}</p></div><span class="chip ${status==='done'?'green':''}">${({todo:'진행 전',doing:'진행 중',done:'완료'})[status]||'진행 전'}</span></div><div class="phase-dates"><span>${s.start?dateLabel(s.start):'시작일 미정'} → ${s.target?dateLabel(s.target):'목표일 미정'}</span><b>${p.done}/${p.total} 할 일 완료</b></div><div class="progress-track"><div style="width:${p.pct}%"></div></div>${s.completed?`<p class="small muted">실제 완료 ${dateLabel(s.completed)}</p>`:''}${s.owner?`<p class="small">담당자 ${esc(s.owner)}</p>`:''}${s.memo?`<p class="phase-memo">${esc(s.memo)}</p>`:''}${fileControls(s.file)}<div class="button-line"><button class="btn sm" data-open="stage" data-id="${esc(s.id)}">${icon('edit',14)} 단계 수정</button>${actionButton('focus-stage','체크리스트',`data-id="${esc(s.id)}"`,'btn ghost sm')}</div></section>`}).join('')}</div></details>${all.some(s=>s.hidden)?`<div class="hidden-stages"><h3>숨긴 단계</h3>${all.filter(s=>s.hidden).map(s=>`<button class="btn sm" data-open="stage" data-id="${esc(s.id)}">${esc(s.name)} · 다시 표시</button>`).join('')}</div>`:''}${todayTaskLogSummary()}<section id="task-list" class="section-block card pane"><div class="pane-heading"><h2>단계별 할 일</h2><button class="btn sm" data-open="task">${icon('plus',15)} 추가</button></div>${filters([selectFilter('단계','stage',[['all','전체 단계'],...stageOptions()],ui.stage),selectFilter('상태','taskStatus',[['all','전체'],['todo','진행 전'],['doing','진행 중'],['done','완료']],ui.taskStatus)])}${tasks.map(taskRow).join('')||(state.tasks.length?empty('해당하는 할 일이 없습니다','필터를 바꾸거나 새 할 일을 추가하세요.'):empty('우리 집의 공사 계획을 시작해 보세요.','준비부터 완공까지 필요한 단계를 차근차근 정리할 수 있어요.','<button class="btn" data-open="task">일정 등록하기</button>'))}</section>`;}
function budgetPage(){const t=totals(),goal=Number(state.project.budgetGoal||0),ratio=goal?Math.min(100,t.paid/goal*100):0;const categories=[...new Set([...CATS,...state.expenses.map(e=>e.category)])];const cats=categories.map(name=>({name,paid:state.expenses.filter(e=>e.category===name).reduce((a,e)=>a+actual(e),0)})).filter(x=>x.paid>0);const months=[...new Set(state.expenses.filter(e=>actual(e)>0&&e.date).map(e=>e.date.slice(0,7)))].sort();const rows=state.expenses.filter(e=>ui.budgetType==='all'||e.category===ui.budgetType).slice().sort((a,b)=>(b.date||'').localeCompare(a.date||''));const colors=['#7E4FA7','#B88BB7','#DCC7B0','#DCA9AE','#C6B4DF','#9DBAB1','#B5A29B'];let end=0;const gradient=cats.map((c,i)=>{const start=end;end+=t.paid?c.paid/t.paid*360:0;return `${colors[i%colors.length]} ${start}deg ${end}deg`}).join(',')||'#eee7ee 0deg 360deg';return `${heading('예산 관리','예상 견적·계약금액·실제 지급을 구분해 집짓기 비용을 살펴보세요.',`<button class="btn primary" data-open="expense">${icon('plus',16)} 비용 기록</button>`)}<div class="budget-layout"><section class="card budget-overview"><div class="budget-donut" style="background:conic-gradient(${gradient})" role="img" aria-label="실제 지급금액 ${money(t.paid)}"><div><span>총 지출</span><strong>${compactMoney(t.paid)}</strong><small>${goal?(t.paid/goal*100).toLocaleString('ko-KR',{maximumFractionDigits:1})+'% · 총예산 대비':'총예산 미설정'}</small></div></div><div class="budget-goal"><div><span>총예산 ${goal?compactMoney(goal):'미설정'}</span><strong>${goal?(t.paid/goal*100).toLocaleString('ko-KR',{maximumFractionDigits:1})+'%':'—'}</strong></div><div class="progress-track"><div style="width:${ratio}%"></div></div>${goal&&t.paid>goal?'<p class="warning-text">설정한 총예산을 초과했습니다.</p>':''}</div><div class="budget-totals"><p><span>예상 견적</span><strong>${money(t.estimate)}</strong></p><p><span>계약금액</span><strong>${money(t.contract)}</strong></p><p><span>실제 지급</span><strong>${money(t.paid)}</strong></p></div><h2>분류별 지급</h2><div class="category-legend">${cats.map((c,i)=>`<div><i style="background:${colors[i%colors.length]}"></i><span>${esc(c.name)}</span><strong>${compactMoney(c.paid)}</strong><small>${t.paid?Math.round(c.paid/t.paid*100):0}%</small></div>`).join('')||'<p class="muted">실제 지급 내역을 추가하면 표시됩니다.</p>'}</div></section><section class="card pane"><div class="pane-heading"><h2>비용 기록</h2><span class="chip">${rows.length}건</span></div>${filters([selectFilter('비용 분류','budgetType',[['all','전체 분류'],...categories],ui.budgetType)])}<div class="expense-list">${rows.map(e=>`<article class="expense-record"><div class="expense-heading"><div><span class="small muted">${dateLabel(e.date)} · ${esc(e.category||'기타')}</span><h3>${esc(e.title)}</h3><p>${esc(e.vendor||'업체 미입력')}${e.installment?' · '+esc(e.installment):''}</p></div>${editDelete('expense',e.id)}</div><dl><div><dt>예상</dt><dd>${money(estimateAmount(e))}</dd></div><div><dt>계약</dt><dd>${money(contractAmount(e))}</dd></div><div><dt>지급</dt><dd>${money(actual(e))}</dd></div></dl>${e.memo?`<p class="record-memo">${esc(e.memo)}</p>`:''}${fileControls(e.receipt)}</article>`).join('')||(state.expenses.length?empty('조건에 맞는 기록이 없습니다','검색어나 필터를 바꾸어 확인해 보세요.'):empty('첫 번째 건축비를 기록해 보세요.','견적부터 계약, 실제 지출까지 구분해 관리할 수 있어요.','<button class="btn" data-open="expense">비용 등록하기</button>'))}</div></section></div><section class="card pane section-block"><h2>월별 실제 지출</h2><div class="monthly-chart">${months.map(month=>{const paid=state.expenses.filter(e=>e.date?.startsWith(month)).reduce((a,e)=>a+actual(e),0);const max=Math.max(1,...months.map(m=>state.expenses.filter(e=>e.date?.startsWith(m)).reduce((a,e)=>a+actual(e),0)));return `<div><span>${esc(month)}</span><div><i style="width:${paid/max*100}%"></i></div><strong>${compactMoney(paid)}</strong></div>`}).join('')||'<p class="muted">지급일이 있는 내역을 기록하면 월별로 집계합니다.</p>'}</div><p class="section-note">견적·계약·지급은 별도로 합산합니다. 같은 비용의 계약총액은 한 번만 기록하고, 추가 지급 내역은 지급금액만 입력하세요. 세금 신고 또는 업체별 잔금 확정 계산서가 아닙니다.</p></section>`;}
function journalPage(){const months=[...new Set(state.journals.map(j=>j.date?.slice(0,7)).filter(Boolean))].sort().reverse();const rows=state.journals.filter(j=>(ui.journalType==='all'||j.type===ui.journalType)&&(ui.journalMonth==='all'||j.date?.startsWith(ui.journalMonth))&&(ui.journalStage==='all'||j.stage===ui.journalStage)).sort((a,b)=>(b.date||'').localeCompare(a.date||''));let month='';return `${heading(catalog.activeId==='family-moms-garden'?'통화·현장 활동 기록':'사진일기',catalog.activeId==='family-moms-garden'?'우리 가족이 진행한 통화, 메모, 현장 사진을 날짜별로 확인해요.':'우리 집이 만들어지는 시간. 현장 사진과 작업 내용, 오늘의 결정을 남겨요.',`<button class="btn" data-nav="baseline">${icon('camera',16)} 철거 전 최초 현황</button><button class="btn primary" data-open="journal" data-record-type="call">${icon('plus',16)} 기록 추가</button>`)}${filters([selectFilter('월','journalMonth',[['all','전체 월'],...months],ui.journalMonth),selectFilter('공사 단계','journalStage',[['all','전체 단계'],...stageOptions()],ui.journalStage),selectFilter('기록 종류','journalType',[['all','전체 종류'],'현장일기','통화·문의','결정기록'],ui.journalType)])}<div class="journal-timeline">${rows.map(j=>{let heading='';const m=j.date?.slice(0,7)||'';if(m!==month){month=m;heading=`<h2 class="journal-month">${esc(m||'날짜 미정')}</h2>`;}return `${heading}<article class="card journal-entry" data-record-id="${esc(j.id)}"><div class="entry-date-line"><span>${dateLabel(j.date)}</span><span class="chip">${esc(stageName(j.stage))}</span></div><h2>${esc(j.title)}</h2>${j.photos?.length?`<div class="photo-grid">${j.photos.map(f=>`<button class="photo-thumb" data-action="preview-file" data-id="${esc(f.id)}" aria-label="${esc(f.name)} 확대"><img data-blob="${esc(f.id)}" alt="${esc(f.name)}" loading="lazy"></button>`).join('')}</div>`:''}${j.body?`<p class="journal-body">${esc(j.body)}</p>`:''}${j.siteNotes?`<div class="journal-detail"><strong>현장 특이사항</strong><p>${esc(j.siteNotes)}</p></div>`:''}${j.decision?`<div class="journal-decision"><strong>오늘의 결정</strong><p>${esc(j.decision)}</p></div>`:''}${j.memo?`<div class="journal-detail"><strong>개인 메모</strong><p>${esc(j.memo)}</p></div>`:''}<div class="entry-footer"><span class="small muted">${esc(j.type||'현장일기')} · 사진 ${j.photos?.length||0}장</span>${actionButton('view-record','상세보기',`data-id="${esc(j.id)}"`,'btn sm')}${editDelete('journal',j.id)}</div></article>`;}).join('')||(state.journals.length?empty('조건에 맞는 기록이 없습니다','검색어나 필터를 바꾸어 확인해 보세요.'):empty('우리 집의 첫 순간을 남겨보세요.','현장 사진을 등록하면 집이 완성되어 가는 과정을 날짜별로 확인할 수 있어요.','<button class="btn" data-open="journal">사진 등록하기</button>'))}</div>`;}
function filesPage(){const cats=[...new Set([...DOC_CATS,...state.documents.map(d=>d.category)])];const query=ui.docSearch.toLocaleLowerCase();const rows=state.documents.filter(d=>(ui.docCategory==='all'||d.category===ui.docCategory)&&(!query||[d.title,d.memo,d.file?.name].some(v=>(v||'').toLocaleLowerCase().includes(query)))).sort((a,b)=>(b.date||b.added||'').localeCompare(a.date||a.added||''));return `${heading('서류 보관함','도면, 계약서, 인허가 자료를 한곳에 차곡차곡 보관해요.',`<button class="btn primary" data-open="document">${icon('plus',16)} 서류 추가</button>`)}<form class="search-form" data-search="documents"><label class="search-input"><span class="sr-only">서류 검색</span>${icon('folder',18)}<input name="query" value="${esc(ui.docSearch)}" placeholder="파일명, 제목, 메모 검색" maxlength="200"></label><button class="btn" type="submit">검색</button></form>${filters([selectFilter('분류','docCategory',[['all','전체 서류'],...cats],ui.docCategory)])}<div class="document-folders">${cats.filter(cat=>state.documents.some(d=>d.category===cat)).map(cat=>`<button data-action="doc-category" data-value="${esc(cat)}"><span>${icon('folder',24)} ${esc(cat)}</span><strong>${state.documents.filter(d=>d.category===cat).length}</strong></button>`).join('')}</div><div class="document-grid">${rows.map(d=>`<article class="card doc-card"><div class="file-type">${icon('folder',24)}</div><div class="doc-details"><span class="chip">${esc(d.category)}</span><h2>${esc(d.title)}</h2><p>${esc(d.file?.name||'첨부 없음')} · ${dateLabel((d.date||d.added||'').slice(0,10))}</p>${d.memo?`<p>${esc(d.memo)}</p>`:''}${fileControls(d.file)}${editDelete('document',d.id)}</div></article>`).join('')||(state.documents.length?empty('조건에 맞는 기록이 없습니다','검색어나 필터를 바꾸어 확인해 보세요.'):empty('중요한 서류를 한곳에 모아보세요.','도면, 견적서, 계약서, 인허가 자료를 정리할 수 있어요.','<button class="btn" data-open="document">서류 등록하기</button>'))}</div><div class="banner section-block"><strong>나의 기기에 보관되는 서류입니다.</strong><p>파일은 이 브라우저에 저장되며 공개 저장소나 서버에 업로드되지 않습니다. 중요한 원본은 별도로 보관하고 정기적으로 전체 백업을 내려받으세요.</p></div>`;}

function designPictures(d){const found=[...(d?.photo?[d.photo]:[]),...(Array.isArray(d?.photos)?d.photos:[])];const ids=new Set();return found.filter(p=>p?.id&&!ids.has(p.id)&&ids.add(p.id));}
function designUrls(d){
 const candidate=(d?.links||d?.link||'').split(/[\r\n]+/).map(x=>x.trim()).filter(Boolean);
 const values=[...(d?.link?[d.link]:[]),...candidate];const uniq=new Set();
 return values.filter(url=>{if(!/^https?:\/\//i.test(url)||uniq.has(url))return false;uniq.add(url);return true;}).slice(0,5);
}
function designPage(){
 const family=catalog.activeId==='family-moms-garden';
 const spaces=[...new Set(['외관','거실','주방','침실','욕실','마당','창고·지붕','설비','다용도실','기타',...state.designs.map(d=>d.space)])];
 const rows=state.designs.filter(d=>(ui.designSpace==='all'||d.space===ui.designSpace)&&(ui.designStatus==='all'||d.status===ui.designStatus)).sort((a,b)=>(b.created||'').localeCompare(a.created||''));
 return `${heading(family?'엄마의 뜰 · 가족 아이디어':'자재 · 아이디어',family?'삼남매가 같은 프로젝트 안에서 참고 사진과 제품 링크, 의견을 함께 모아요.':'공간별 자재 후보와 참고 사진, 선택 이유를 한곳에 남겨요.',`<button class="btn primary" data-open="design">${icon('plus',16)} 사진·아이디어 등록</button>`)}
 ${family?`<section class="family-design-intro"><span>${icon('home',19)}</span><p><strong>엄마의 뜰 공동 기록</strong> · 여기서 올린 아이디어와 사진은 가족 프로젝트에 저장되어 삼남매가 함께 볼 수 있어요.</p></section>`:''}
 ${filters([selectFilter('공간','designSpace',[['all','전체 공간'],...spaces],ui.designSpace),selectFilter('선택 상태','designStatus',[['all','전체 상태'],'후보','확정'],ui.designStatus)])}
 <div class="design-grid">${rows.map(d=>{
 const pics=designPictures(d),urls=designUrls(d);
 return `<article class="card design-card" data-design-id="${esc(d.id)}"><div class="design-visual">${pics.length?`<div class="design-photo-grid" data-count="${Math.min(6,pics.length)}">${pics.slice(0,6).map((p,n)=>`<button class="design-photo-thumb" data-action="preview-file" data-id="${esc(p.id)}" type="button" aria-label="${esc(d.title)} 참고 사진 ${n+1} 확대"><img data-blob="${esc(p.id)}" alt="${esc(d.title)} 사진 ${n+1}" loading="lazy"></button>`).join('')}${pics.length>6?`<span class="design-photo-count">+${pics.length-6}장</span>`:''}</div>`:`<span>${icon('palette',40)}</span>`}</div><div class="design-body"><div class="button-line"><span class="chip">${esc(d.space)}</span><span class="chip ${d.status==='확정'?'green':''}">${esc(d.status||'후보')}</span></div><h2>${esc(d.title)}</h2>${d.brand?`<p class="small">${esc(d.brand)}${d.materialType?' · '+esc(d.materialType):''}</p>`:''}${d.spec?`<p class="small muted">규격 ${esc(d.spec)}</p>`:''}${Number(d.price)>0?`<strong class="money">${money(d.price)}</strong>`:''}${d.note?`<p class="record-memo">${esc(d.note)}</p>`:''}${d.reason?`<p class="selection-reason"><b>선택 이유</b> ${esc(d.reason)}</p>`:''}${urls.length?`<div class="design-reference-links">${urls.map((url,n)=>`<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${icon('arrow',13)} 참고 링크 ${n+1} · ${esc((()=>{try{return new URL(url).hostname}catch{return url}})())}</a>`).join('')}</div>`:''}${editDelete('design',d.id)}</div></article>`;
 }).join('')||(state.designs.length?empty('조건에 맞는 기록이 없습니다','검색어나 필터를 바꾸어 확인해 보세요.'):empty('함께 모을 아이디어를 첫 번째로 등록해 보세요.','참고 사진은 여러 장 첨부하거나 붙여넣고, 링크도 여러 개 남길 수 있어요.','<button class="btn" data-open="design">아이디어 등록하기</button>'))}</div>`;
}
function contactsPage(){return `${heading('현장 연락처','건축사·시공사·기관 담당자와의 연락에 필요한 정보를 모아요.',`<button class="btn primary" data-open="contact">${icon('plus',16)} 연락처 추가</button>`)}<div class="contact-grid">${state.contacts.map(c=>`<article class="card contact-card"><span class="chip">${esc(c.category)}</span><h2>${esc(c.name)}</h2><p>${esc(c.person||'')}</p>${c.phone?`<a class="phone-link" href="tel:${esc(c.phone.replace(/[^\d+]/g,''))}">${icon('phone',16)} ${esc(c.phone)}</a>`:''}${c.note?`<p class="record-memo">${esc(c.note)}</p>`:''}${editDelete('contact',c.id)}</article>`).join('')||empty('연락처를 모아두세요','업체와 담당자의 연락처·메모를 안전하게 보관해요.')}</div>`;}
function carePage(){return `${heading('집 관리수첩','완공한 뒤에도 점검과 보증, 유지관리 일정을 이어가세요.',`<button class="btn primary" data-open="care">${icon('plus',16)} 관리 일정</button>`)}<div class="care-grid">${[...state.care].sort((a,b)=>Number(a.done)-Number(b.done)||(a.due||'9999').localeCompare(b.due||'9999')).map(c=>`<article class="card care-card"><span class="chip">${c.done?'완료':dateLabel(c.due)}</span><h2>${esc(c.title)}</h2>${c.provider?`<p>${esc(c.provider)}</p>`:''}<p class="record-memo">${esc(c.note||'')}</p>${actionButton('toggle-care',c.done?'완료 취소':'점검 완료',`data-id="${esc(c.id)}"`,'btn sm')}${editDelete('care',c.id)}</article>`).join('')||empty('관리 일정을 남겨보세요','보증 기간과 정기 점검을 잊지 않도록 기록해요.')}</div>`;}
let projectSummaries=[];
function visibleProjectSummaries(){const shared=catalog.ids.includes('family-moms-garden'),member=window.chaeFamilyBridge?.canView();return projectSummaries.filter(p=>{if(p.id==='family-moms-garden')return !!member;if(shared&&member&&p.state.project.title==='엄마의 뜰')return false;return true;})}
function familyProjectGuide(){
 const x=window.chaeFamilyBridge?.getStatus?.()||{},joined=!!x.role,owner=x.role==='owner',cloud=!!x.cloud;
 const title=cloud?'엄마의 뜰을 불러오고 있어요':owner?'엄마의 뜰을 지금 시작하세요':joined?'관리자가 프로젝트를 만들면 바로 열려요':'삼남매 가족 공동 프로젝트';
 const details=cloud?'공동 프로젝트를 휴대폰에 연결하는 중이에요.':owner?'기존 자료가 없어도 괜찮아요. 여기서 새로 만들면 삼남매가 같은 일정·사진·건축비·서류를 함께 보고 수정할 수 있어요.':'엄마의 뜰 프로젝트를 세 사람이 하나로 공유해요. 관리자 계정에서 처음 한 번만 만들면 돼요.';
 return `${heading('엄마의 뜰 · 삼남매 공동 프로젝트','핸드폰·컴퓨터 어디서나 같은 기록을 함께 수정합니다.')}
 <section class="card family-onboarding">
 <div class="family-onboarding-head"><div class="family-onboarding-illustration">${icon('home',27)}</div><div><span class="eyebrow">ONE FAMILY · ONE PROJECT</span><h2>${title}</h2></div></div><p>${details}</p>
 <div class="family-onboarding-steps"><div><b>1</b><span>가족 구글 로그인</span><small>${joined?'연결 완료':'로그인 필요'}</small></div><div><b>2</b><span>엄마의 뜰 공동 프로젝트</span><small>${cloud?'생성 완료':owner?'만들기 버튼만 누르면 완료':'관리자 생성 대기'}</small></div><div><b>3</b><span>자동 동기화</span><small>${cloud?'같은 데이터 사용':'생성하면 자동 시작'}</small></div></div>
 <div class="family-onboarding-actions">
 ${!x.uid?'<button class="btn primary" data-action="family-signin">가족 구글 로그인</button>':''}
 ${owner&&!cloud?'<button class="btn primary family-create-cta" data-action="family-create">엄마의 뜰 공동 프로젝트 만들기</button>':''}
 ${joined?'<button class="btn" data-action="family-refresh">동기화 상태 다시 확인</button>':''}
 </div>
 ${owner&&!cloud?'<p class="family-onboarding-note">처음부터 시작할게요. 예전 자료나 백업 파일은 필요 없어요. 버튼을 눌러도 이 휴대폰의 기존 기록은 삭제되지 않아요.</p>':''}
 </section>`;
}
function projectsPage(){if(!catalog.ids.length)return familyProjectGuide();return `${heading('내 프로젝트','개인 원본은 보존하며, 가족 3명은 ‘엄마의 뜰’ 공동 프로젝트 하나를 사용합니다.',`<button class="btn primary" data-open="new-project">${icon('plus',16)} 새 프로젝트</button>`)}<div class="projects-grid">${visibleProjectSummaries().map(p=>`<article class="card project-card"><div class="project-list-photo">${p.state.project.cover?`<img data-blob="${esc(p.state.project.cover.id)}" alt="${esc(p.state.project.title)} 대표 사진">`:`<span>${icon('home',40)}</span>`}</div><div><span class="chip">${catalog.recoveredIds?.includes(p.id)?'이전 탭에서 보존한 기록':p.id===catalog.activeId?'현재 프로젝트':'로컬 프로젝트'}</span><h2>${esc(p.state.project.title)}</h2><p>${esc(p.state.project.location||'건축 예정지 미입력')}</p><small>${p.state.journals.length}개 기록 · ${p.state.documents.length}개 서류</small><div class="button-line">${actionButton('switch-project','프로젝트 열기',`data-id="${esc(p.id)}"`,'btn primary')}${actionButton('delete-project','삭제',`data-id="${esc(p.id)}"`,'btn danger')}</div></div></article>`).join('')||empty('당신의 집짓기를 시작하세요','프로젝트 이름을 정하면 일정·사진·예산을 독립적으로 기록할 수 있어요.',`<button class="btn primary" data-open="new-project">첫 프로젝트 만들기</button>`)}</div><div class="banner section-block"><h3>기록은 이 브라우저 안에 있습니다.</h3><p>개인 기록은 이 브라우저에 남아 있습니다. ‘엄마의 뜰’ 공동 프로젝트는 가족 로그인 및 최초 공유 이후 세 기기에서 자동으로 동기화됩니다.</p></div>`;}
function settingsPage(){return `${heading('설정 · 백업','소중한 기록과 첨부파일을 빠짐없이 보관하세요.')}<div class="settings-grid"><section class="card settings-card"><h2>프로젝트 관리</h2><p>${catalog.activeId?esc(state.project.title)+' · '+esc(state.project.location||'예정지 미입력'):'아직 프로젝트가 없습니다.'}</p><div class="button-line">${navButton('projects','모든 프로젝트')}${catalog.activeId?'<button class="btn primary" data-open="project">현재 프로젝트 수정</button>':''}</div></section><section class="card settings-card"><h2>전체 기록 백업</h2><p>모든 프로젝트의 기록·대표 사진·서류·영수증·첨부파일을 하나의 JSON 파일로 내려받습니다. 전체 백업·복원은 파일당 250MB까지 지원합니다.</p>${actionButton('backup',icon('download',16)+' 전체 백업','','btn primary')}<span class="small muted">프로젝트 ${catalog.ids.length}개 · 백업에는 개인 정보가 포함될 수 있습니다.</span></section><section class="card settings-card"><h2>백업 파일 복원</h2><p>복원하면 모든 프로젝트와 파일이 백업 내용으로 교체됩니다. 기존 단일 프로젝트 백업도 지원합니다.</p>${actionButton('restore',icon('upload',16)+' JSON 백업 불러오기')}<span class="small muted">복원 전 상태는 이 기기의 복구 사본에 자동 보존합니다.</span>${actionButton('recovery','마지막 복원 전 사본 내려받기','','btn ghost sm')}</section><section class="card settings-card"><h2>저장 용량과 개인정보</h2><p>기록과 파일은 이 브라우저의 IndexedDB에 저장됩니다. 계정·서버 저장·기기 간 자동 동기화는 제공하지 않습니다.</p><span class="storage-usage">${storageInfo?`사용 중 약 ${formatBytes(storageInfo.usage||0)} / 사용 가능 한도 약 ${formatBytes(storageInfo.quota||0)}`:'저장 용량은 브라우저가 제공하는 범위에서 확인합니다.'}</span><p>사진은 일부 형식을 제외하고 자동 축소합니다. 파일당 최대 30MB이며, 브라우저 데이터 삭제나 기기 변경 전에 백업하세요.</p>${actionButton('cleanup','사용하지 않는 첨부파일 정리','','btn sm')}</section></div><section class="banner section-block"><h3>안전한 데이터 이전</h3><p>이전 버전에서 가져온 기록은 원본 상태로 자동 보존되어 있습니다. 개인 사진·문서·백업 JSON을 공개 GitHub 저장소에 올리지 마세요.</p></section>`;}
const formatBytes=n=>n>=1024**3?(n/1024**3).toFixed(2)+'GB':(n/1024**2).toFixed(1)+'MB';
function morePage(){return `${heading('더보기','프로젝트의 모든 자료와 설정을 한곳에서 확인하세요.')}<div class="more-grid">${NAV.filter(([p])=>!['home','journal','baseline','budget'].includes(p)).map(([p,t,ic])=>`<button class="more-item" data-nav="${p}"><span>${icon(ic,24)}</span><span>${t}<small>${({files:'도면·계약·인허가 자료',baseline:'철거 전 사진 5가지 분류',design:'후보와 최종 선택',contacts:'업체·기관 담당자',care:'입주 이후 유지관리',projects:'프로젝트 만들기·전환',settings:'전체 백업·복원'})[p]}</small></span></button>`).join('')}<a class="more-item" href="./shared.html"><span>${icon('home',24)}</span><span>엄마의 뜰 · 가족 공유<small>구글 로그인 · 가족 공동 프로젝트</small></span></a><button class="more-item" data-nav="brand"><span>${icon('home',24)}</span><span>채피움 이야기<small>집을 짓는 모든 순간을</small></span></button><button class="more-item" data-nav="landing"><span>${icon('arrow',24)}</span><span>서비스 소개<small>Your Home, Your Journey.</small></span></button></div>${upcoming()}`;}
function brandTeaser(){return `<section class="brand-story-teaser section-block"><div class="brand-teaser-mark"><img src="./assets/brand/logo-white.png" alt="채피움 CHAEPIUM" width="1400" height="680"></div><div><span class="eyebrow">BRAND MEANING</span><h2>집을 짓는 모든 순간이,<br>당신의 이야기로 피어납니다.</h2><p>채피움은 ‘채우다’와 ‘피어나다’의 의미를 담았습니다. 집이 완성되기까지의 시간과 선택, 고민과 기대를 함께 기록해요.</p>${navButton('brand','채피움의 이야기 '+icon('arrow',16))}</div></section>`;}
function brandPage(){return `<article class="brand-about">${heading('채피움 이야기','Your Home, Your Journey.')}<section class="brand-about-statement"><img src="./assets/brand/logo-main.png" alt="채피움 CHAEPIUM" width="1400" height="680"><h2>집을 짓는 모든 순간을,<br>채피움에.</h2><p>채피움은 ‘채우다’와 ‘피어나다’의 의미를 담은 이름입니다. 하나의 집이 완성되기까지는 수많은 시간과 선택, 고민과 기대가 쌓입니다.</p></section><div class="brand-values"><section class="card"><span>01 · 처음 꿈꾸던 날</span><h2>가능성을 채우다</h2><p>땅을 살펴보고 설계도를 펼치던 순간. 나의 계획과 선택을 정리합니다.</p></section><section class="card"><span>02 · 공간이 만들어질 때</span><h2>변화를 기록하다</h2><p>첫 삽을 뜨던 날부터 창문이 달리는 시간까지. 현장의 변화를 사진과 메모로 남깁니다.</p></section><section class="card"><span>03 · 새로운 삶의 시작</span><h2>일상을 피우다</h2><p>한 채의 집이 피어나고 그 안에서 새로운 삶이 시작되는 과정을 함께합니다.</p></section></div><section class="brand-local-note"><h2>모든 건축주의 여정을 위한 기록 플랫폼</h2><p>현재는 로그인 없이 사용하는 로컬 저장 버전입니다. 프로젝트별 일정·예산·사진·서류 관리부터 시작하며, 자재 비교·전문가 연결·커뮤니티는 준비중입니다.</p>${actionButton('start-project','내 프로젝트 열기 '+icon('arrow',16),'','btn primary')}</section>${navButton('landing','서비스 소개로 돌아가기')}</article>`;}
const kindStore={task:'tasks',expense:'expenses',journal:'journals',document:'documents',design:'designs',contact:'contacts',care:'care'};
const kindTitle={task:' 할 일',expense:'비용',journal:'사진일기',document:'서류',design:'자재·아이디어',contact:'연락처',care:'관리 일정',project:'프로젝트 정보','new-project':'새 프로젝트',stage:'공사 단계'};
const unique=a=>[...new Set(a.filter(Boolean))];
function currentFile(ref){return ref?`<div class="field full"><span class="field-help">현재 첨부: ${esc(ref.name)} · 새 파일을 선택하면 교체됩니다.</span></div>`:'';}
function projectFields(p={}){return field('프로젝트 이름 *','title',p.title,'text','required maxlength="80" placeholder="프로젝트 이름을 입력하세요"',true)+field('건축 예정지','location',p.location,'text','maxlength="200"',true)+field('대지면적 (㎡)','landArea',p.landArea,'number','min="0" step="0.01"')+field('건축면적 (㎡)','buildingArea',p.buildingArea,'number','min="0" step="0.01"')+field('연면적 (㎡)','floorArea',p.floorArea,'number','min="0" step="0.01"')+field('건축 예정 규모 (자유 입력)','area',p.area,'text','maxlength="80"')+selectField('건축 유형','buildingType',unique([p.buildingType,'미정','단독주택','다가구주택','다세대주택','상가주택','기타']),p.buildingType||'미정')+field('예상 총예산 (원)','budgetGoal',p.budgetGoal||'','number','min="0" step="1"')+field('착공 목표일','start',p.start,'date')+field('준공·입주 목표일','target',p.target,'date')+fileField('대표 사진 (선택)','cover',false,'image/*')+currentFile(p.cover)+textarea('프로젝트 소개','description',p.description);}

function baselineBeforeOptions(category){
 const rows=baselineBeforePhotos(category);
 return [['','연결할 철거 전 사진 선택'],...rows.map(x=>[x.photo.id,x.label])];
}
function syncBaselineModal(resetSelection=false){
 const form=$('#modalRoot form[data-form="journal"]');if(!form)return;
 const cat=form.elements.namedItem('baselineCategory')?.value||'';
 const phase=form.elements.namedItem('baselinePhase')?.value||'before';
 const field=form.querySelector('[data-baseline-link]');
 if(!field)return;field.hidden=phase!=='after'||!cat;
 const input=form.elements.namedItem('baselineBeforeId');if(!input)return;
 const selected=resetSelection?'':input.value;
 input.innerHTML=baselineBeforeOptions(cat).map(([val,label])=>`<option value="${esc(val)}" ${val===selected?'selected':''}>${esc(label)}</option>`).join('');
}

function modalFields(kind,e={}){if(kind==='project'||kind==='new-project')return projectFields(e);if(kind==='stage')return field('단계 이름 *','name',e.name,'text','required maxlength="60"',true)+textarea('단계 설명','desc',e.desc)+field('시작일','start',e.start,'date')+field('목표 완료일','target',e.target,'date')+field('실제 완료일','completed',e.completed,'date')+selectField('진행 상태','status',[['todo','진행 전'],['doing','진행 중'],['done','완료']],e.status||'todo')+`<div class="field full field-help">할 일이 있는 단계의 진행률은 체크리스트 완료 비율로 계산합니다. 할 일이 없으면 직접 기록한 단계 상태를 사용합니다.</div>`+field('담당자','owner',e.owner,'text','maxlength="120"')+selectField('화면 표시','visibility',[['show','표시'],['hide','숨기기 (기록 유지)']],e.hidden?'hide':'show')+textarea('단계 메모','memo',e.memo)+fileField('단계 관련 파일','file',false,'image/*,.pdf,.hwp,.hwpx,.doc,.docx,.xls,.xlsx,.txt,.zip')+currentFile(e.file);
if(kind==='task')return selectField('공사 단계','stage',stageOptions(),e.stage||visibleStages()[0]?.id||'prep')+field('할 일 *','title',e.title,'text','required maxlength="200"',true)+selectField('진행 상태','status',[['todo','진행 전'],['doing','진행 중'],['done','완료']],e.status||'todo')+field('기한','due',e.due,'date')+field('담당자','owner',e.owner,'text','maxlength="120"',true)+textarea('메모','memo',e.memo);
if(kind==='expense')return field('비용명 *','title',e.title,'text','required maxlength="150"',true)+selectField('비용 분류','category',unique([e.category,...CATS]),e.category||CATS[0])+field('업체','vendor',e.vendor,'text','maxlength="140"')+field('예상 견적 (원)','estimate',estimateAmount(e)||'','number','min="0" step="1"')+field('계약금액 (원)','contract',contractAmount(e)||'','number','min="0" step="1"')+field('실제 지급금액 (원)','paid',actual(e)||'','number','min="0" step="1"')+field('지급·기록 날짜','date',e.date||localDate(),'date','required')+selectField('지급 구분','installment',['미정','계약금','중도금','잔금','일괄 지급','기타'],e.installment||'미정')+textarea('비용 메모','memo',e.memo)+fileField('영수증·증빙 첨부 (선택)','receipt',false,'image/*,.pdf,.txt')+currentFile(e.receipt)+`<div class="field full field-help">같은 비용의 계약총액은 한 번만 기록하고, 중도금·잔금 추가 지급은 지급금액만 입력하세요.</div>`;
if(kind==='journal'&&e.quickEntry)return field('오늘 기록 제목 *','title',e.title,'text','required maxlength="160" placeholder="예: 도시재생과 담당자와 통화"',true)+field('기록 날짜','date',e.date||localDate(),'date','required')+selectField('기록 종류','type',[['통화·문의','통화·문의'],['현장일기','현장 활동'],['결정기록','결정·협의']],e.type||'통화·문의')+selectField('공사 단계','stage',stageOptions(),e.stage||visibleStages()[0]?.id||'prep')+selectField('연결된 할 일 (선택)','taskId',[['','연결하지 않음'],...state.tasks.filter(t=>!t.archivedRecord).map(t=>[t.id,t.title])],e.taskId||'')+textarea('오늘 진행한 내용 · 통화 메모','body',e.body)+fileField('현장 사진 여러 장 · 파일 선택 또는 붙여넣기','photos',true,'image/*');
if(kind==='journal')return selectField('연결된 할 일 · 선택','taskId',[['','연결하지 않음'],...state.tasks.map(t=>[t.id,t.title])],e.taskId||'',true)+field('제목 *','title',e.title,'text','required maxlength="160"',true)+field('촬영·기록 날짜','date',e.date===undefined?localDate():e.date,'date','required')+selectField('공사 단계','stage',stageOptions(),e.stage||visibleStages()[0]?.id||'prep')+selectField('기록 종류','type',['현장일기','통화·문의','결정기록'],e.type||'현장일기')+selectField('철거 전·후 장소','baselineCategory',[['','일반 사진일기'],...BASELINE_CATEGORIES.map(c=>[c.id,c.name])],e.baselineCategory||'')+selectField('사진 구분','baselinePhase',[['before','철거 전 · 최초 현황'],['after','이후 · 변화된 모습']],e.baselinePhase||'before')+`<div class="field full" data-baseline-link><label for="f_baselineBeforeId">비교할 철거 전 사진</label><select name="baselineBeforeId" id="f_baselineBeforeId">${baselineBeforeOptions(e.baselineCategory||'').map(([val,label])=>`<option value="${esc(val)}" ${val===(e.baselineBeforeId||'')?'selected':''}>${esc(label)}</option>`).join('')}</select><span class="field-help">같은 장소의 철거 전 사진을 선택하면 겹쳐 보기로 비교할 수 있어요. 아직 없다면 나중에 연결할 수 있어요.</span></div>`+fileField('사진 추가 (여러 장 가능)','photos',true,'image/*')+(e.photos?.length?`<div class="field full"><label>기존 사진 · 삭제할 사진을 선택하세요</label><div class="existing-photos">${e.photos.map(f=>`<label class="existing-photo-choice"><img data-blob="${esc(f.id)}" alt="${esc(f.name)}"><span><input type="checkbox" name="removePhotos" value="${esc(f.id)}"> 삭제</span></label>`).join('')}</div></div>`:'')+textarea('작업 내용','body',e.body)+textarea('현장 특이사항','siteNotes',e.siteNotes)+textarea('오늘의 결정','decision',e.decision)+textarea('개인 메모','memo',e.memo);
if(kind==='document')return field('서류 이름 *','title',e.title,'text','required maxlength="160"',true)+selectField('분류','category',unique([e.category,...DOC_CATS]),e.category||DOC_CATS[0])+field('서류 날짜','date',e.date||e.added?.slice(0,10)||localDate(),'date','required')+fileField(e.file?'첨부 파일 교체 (선택)':'첨부 파일 *','file',false,'image/*,.pdf,.hwp,.hwpx,.doc,.docx,.xls,.xlsx,.txt,.zip')+currentFile(e.file)+textarea('메모','memo',e.memo);
if(kind==='design')return field('제품·아이디어 이름 *','title',e.title,'text','required maxlength="160"',true)+selectField('공간','space',unique([e.space,'외관','거실','주방','침실','욕실','마당','다용도실','기타']),e.space||'거실')+selectField('선택 상태','status',['후보','확정'],e.status||'후보')+field('자재 종류','materialType',e.materialType,'text','maxlength="100"')+field('브랜드','brand',e.brand,'text','maxlength="100"')+field('규격','spec',e.spec,'text','maxlength="150"')+field('가격 (원)','price',e.price||'','number','min="0" step="1"')+textarea('참고 링크 · 한 줄에 하나씩 (최대 5개)','links',e.links||e.link||'')+fileField('참고 사진 여러 장 첨부·붙여넣기','designPhotos',true,'image/*')+(designPictures(e).length?`<div class="field full"><label>기존 참고 사진 · 삭제할 사진 선택</label><div class="existing-photos">${designPictures(e).map(p=>`<label class="existing-photo-choice"><img data-blob="${esc(p.id)}" alt="${esc(p.name)}"><span><input type="checkbox" name="removeDesignPhotos" value="${esc(p.id)}"> 삭제</span></label>`).join('')}</div></div>`:'')+textarea('비교 메모','note',e.note)+textarea('최종 선택 이유','reason',e.reason);
if(kind==='contact')return field('기관·업체명 *','name',e.name,'text','required maxlength="120"',true)+selectField('분류','category',unique([e.category,'건축사·감리','시공사','관공서','설비·인입','자재·인테리어','기타']),e.category||'기타')+field('담당자','person',e.person,'text','maxlength="120"')+field('전화번호','phone',e.phone,'tel','maxlength="60"',true)+textarea('메모','note',e.note);
if(kind==='care')return field('관리 항목 *','title',e.title,'text','required maxlength="160"',true)+field('예정일','due',e.due,'date')+field('관련 업체','provider',e.provider,'text','maxlength="120"')+textarea('관리 내용','note',e.note);return '';}
function openModal(kind,key,prefill=null){if(busy)return;if(!catalog.activeId&&!['new-project'].includes(kind)){kind='new-project';key='';}let entry=prefill||{};if(kind==='project')entry=state.project;else if(kind==='stage'&&key)entry=stagesOf().find(s=>s.id===key);else if(key&&kindStore[kind])entry=state[kindStore[kind]].find(e=>e.id===key);if(!entry)return toast('기록을 찾을 수 없습니다.');lastFocus=document.activeElement;$('#modalRoot').innerHTML=`<div class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title"><div class="modal-header"><h2 id="modal-title">${kindTitle[kind]} ${key||kind==='project'?'수정':kind==='new-project'?'만들기':'추가'}</h2><button class="icon-btn" data-action="close-modal" aria-label="닫기">${icon('close',22)}</button></div><form class="modal-body" data-form="${kind}" data-id="${esc(key||'')}"><div class="form-grid">${modalFields(kind,entry)}</div><div class="form-actions"><button type="button" class="btn" data-action="close-modal">취소</button><button class="btn primary" type="submit">${kind==='new-project'?'프로젝트 만들기':'저장하기'}</button></div></form></div>`;$('#modalRoot').classList.remove('hidden');document.body.style.overflow='hidden';loadImgs();if(kind==='journal')syncBaselineModal();$('#modalRoot').querySelector('input:not([type=file]),select,textarea')?.focus({preventScroll:true});}
function closeModal(force=false){if(busy&&!force)return;gallerySession=null;for(const img of $('#modalRoot').querySelectorAll('.image-paste-previews img'))URL.revokeObjectURL(img.src);$('#modalRoot').classList.remove('gallery-open');$('#modalRoot').classList.add('hidden');$('#modalRoot').innerHTML='';document.body.style.overflow='';if(lastFocus?.isConnected)lastFocus.focus({preventScroll:true});}
const str=(fd,k)=>(fd.get(k)||'').toString().trim();
function num(fd,key){const raw=str(fd,key),n=Number(raw||0);if(!Number.isFinite(n)||n<0)throw Error('금액은 0 이상의 유효한 숫자로 입력하세요.');return Math.round(n);}
const picked=(fd,key)=>{const f=fd.get(key);return f instanceof File&&f.size?f:null;};
async function onForm(form){if(busy)return;busy=true;const submit=form.querySelector('[type=submit]');submit.disabled=true;submit.textContent='저장 중…';const kind=form.dataset.form,key=form.dataset.id,fd=new FormData(form);const pasted=k=>clipboardUploads.get(form.elements.namedItem(k))||[];const selectedFile=k=>pasted(k).at(-1)||picked(fd,k);const before=state?clone(state):null,oldRefs=state?fileRefs(state):new Set();try{const draft=kind==='new-project'?freshState():clone(state);let row=kind==='project'||kind==='new-project'?{...draft.project}:kind==='stage'?{...(key?stagesOf(draft).find(s=>s.id===key):{}),id:key||id()}:{...(key?draft[kindStore[kind]].find(e=>e.id===key):{}),id:key||id()};if(!row.created&&kind!=='project'&&kind!=='new-project')row.created=timestamp();
if(kind==='project'||kind==='new-project'){for(const k of ['title','location','area','landArea','buildingArea','floorArea','buildingType','start','target','description'])row[k]=str(fd,k);row.budgetGoal=num(fd,'budgetGoal');if(!row.title)throw Error('프로젝트 이름을 입력해 주세요.');const f=selectedFile('cover');if(f)row.cover=await putFile(f,true);draft.project=row;}
if(kind==='stage'){for(const k of ['name','desc','start','target','completed','status','owner','memo'])row[k]=str(fd,k);if(!row.name)throw Error('단계 이름을 입력해 주세요.');row.hidden=str(fd,'visibility')==='hide';const f=selectedFile('file');if(f)row.file=await putFile(f);draft.stages=stagesOf(draft);if(key)draft.stages=draft.stages.map(s=>s.id===key?row:s);else draft.stages.push(row);}
if(kind==='task')for(const k of ['title','stage','status','due','owner','memo'])row[k]=str(fd,k);
if(kind==='expense'){row.type='item';for(const k of ['title','category','vendor','date','installment','memo'])row[k]=str(fd,k);for(const k of ['estimate','contract','paid'])row[k]=num(fd,k);const f=selectedFile('receipt');if(f)row.receipt=await putFile(f);}
if(kind==='journal'){for(const k of ['title','date','stage','type','body','siteNotes','decision','memo','baselineCategory','baselinePhase','baselineBeforeId','taskId'])if(fd.has(k))row[k]=str(fd,k);if(!row.baselineCategory){row.baselinePhase='before';row.baselineBeforeId='';}if(row.baselinePhase!=='after')row.baselineBeforeId='';if(row.baselineBeforeId&&!baselineBeforePhotos(row.baselineCategory).some(p=>p.photo.id===row.baselineBeforeId))throw Error('선택한 철거 전 사진을 찾지 못했습니다. 같은 장소의 사진으로 다시 연결해 주세요.');const removed=new Set(fd.getAll('removePhotos'));row.photos=(row.photos||[]).filter(f=>!removed.has(f.id));for(const f of [...fd.getAll('photos'),...pasted('photos')])if(f instanceof File&&f.size)row.photos.push(await putFile(f,true));}
if(kind==='document'){for(const k of ['title','category','date','memo'])row[k]=str(fd,k);row.added=row.added||timestamp();const f=selectedFile('file');if(f)row.file=await putFile(f);if(!row.file)throw Error('첨부파일을 선택해 주세요.');}
if(kind==='design'){
 for(const k of ['title','space','status','materialType','brand','spec','note','reason'])row[k]=str(fd,k);
 row.price=num(fd,'price');
 const raw=str(fd,'links').split(/[\r\n]+/).map(x=>x.trim()).filter(Boolean);
 if(raw.length>5)throw Error('참고 링크는 최대 5개까지 등록할 수 있어요.');
 const urls=raw.map(x=>{let u;try{u=new URL(x);}catch{throw Error('올바른 참고 링크를 입력해 주세요.');}if(!['http:','https:'].includes(u.protocol))throw Error('http 또는 https 링크만 등록할 수 있어요.');return u.href;});
 row.links=urls.join('\n');row.link=urls[0]||'';
 const removed=new Set(fd.getAll('removeDesignPhotos'));
 if(row.photo&&removed.has(row.photo.id))delete row.photo;
 row.photos=(Array.isArray(row.photos)?row.photos:[]).filter(p=>!removed.has(p.id));
 const allFiles=[...fd.getAll('designPhotos'),...pasted('designPhotos')].filter(f=>f instanceof File&&f.size);
 if(designPictures(row).length+allFiles.length>12)throw Error('참고 사진은 아이디어당 최대 12장까지 등록할 수 있어요.');
 for(const file of allFiles)row.photos.push(await putFile(file,true));
 }
if(kind==='contact')for(const k of ['name','category','person','phone','note'])row[k]=str(fd,k);
if(kind==='care'){for(const k of ['title','due','provider','note'])row[k]=str(fd,k);row.done=row.done||false;}
if(kindStore[kind]){if(!(kind==='contact'?row.name:row.title))throw Error('필수 이름 또는 제목을 입력해 주세요.');const arr=kindStore[kind];if(key)draft[arr]=draft[arr].map(r=>r.id===key?row:r);else draft[arr].unshift(row);}
if(kind==='new-project'){if(catalog.ids.length>=100)throw Error('한 브라우저에서 최대 100개 프로젝트를 관리할 수 있습니다.');const projectId=id(),nextCatalog={...catalog,schema:2,activeId:projectId,ids:[...catalog.ids,projectId],revision:(catalog.revision||0)+1};await queue(()=>workspaceWrite(catalog.revision||0,tx=>withStoredFiles(tx,fileRefs(draft),()=>{const m=tx.objectStore('meta');m.put(draft,'project:'+projectId);m.put(nextCatalog,'workspace');m.put(draft,'state');}),['meta','attachments']));catalog=nextCatalog;state=draft;ui.page='home';location.hash='home';}else await persist(draft);
await refreshProjectSummaries();try{await removeUnused([...oldRefs].filter(i=>!fileRefs(state).has(i)))}catch{}await refreshStorage();closeModal(true);render();toast(kind==='new-project'?'프로젝트를 만들었어요.':'기록을 저장했어요.');
}catch(e){state=before||state;console.error('Save failed',e);toast(e.name==='QuotaExceededError'?'저장 공간이 부족합니다. 먼저 백업하고 불필요한 파일을 정리해 주세요.':e.message||'저장하지 못했습니다.');}finally{busy=false;if(submit.isConnected){submit.disabled=false;submit.textContent=kind==='new-project'?'프로젝트 만들기':'저장하기';}}}
async function refreshProjectSummaries(){projectSummaries=await allProjects();}
function resetFilters(){for(const k of ['stage','taskStatus','stageStatus','journalType','journalMonth','journalStage','docCategory','designSpace','designStatus','budgetType'])ui[k]='all';ui.docSearch='';}
async function switchProject(key){if(!catalog.ids.includes(key))throw Error('프로젝트를 찾을 수 없습니다.');const next=await read('meta','project:'+key);if(!next)throw Error('프로젝트 데이터를 읽지 못했습니다.');const cat={...catalog,activeId:key,revision:(catalog.revision||0)+1};await workspaceWrite(catalog.revision||0,tx=>{tx.objectStore('meta').put(cat,'workspace');tx.objectStore('meta').put(next,'state')});catalog=cat;state=next;resetFilters();clearObjectURLs();await refreshProjectSummaries();navigate('home');}
function clearObjectURLs(){for(const url of objectURLs.values())URL.revokeObjectURL(url);objectURLs.clear();}
async function deleteProject(key){if(key==='family-moms-garden')throw Error('삼남매가 함께 쓰는 프로젝트는 여기서 삭제할 수 없습니다.');const existing=projectSummaries.find(p=>p.id===key);if(!existing)return;if(!confirm(`‘${existing.state.project.title}’ 프로젝트의 모든 기록을 삭제할까요? 삭제 전에 전체 백업을 권장합니다.`))return;const refs=fileRefs(existing.state);const ids=catalog.ids.filter(i=>i!==key),activeId=catalog.activeId===key?(ids[0]||null):catalog.activeId;const next=activeId?await read('meta','project:'+activeId):freshState();const cat={...catalog,schema:2,ids,activeId,revision:(catalog.revision||0)+1};await workspaceWrite(catalog.revision||0,tx=>{const m=tx.objectStore('meta');m.delete('project:'+key);m.put(cat,'workspace');if(activeId)m.put(next,'state');else m.delete('state')});catalog=cat;state=next;clearObjectURLs();try{await removeUnused(refs)}catch{}await refreshProjectSummaries();navigate('projects');toast('프로젝트를 삭제했습니다.');}
async function deleteRecord(kind,key){const arr=kindStore[kind],row=state[arr]?.find(e=>e.id===key);if(!row)return;if(!confirm('이 기록을 삭제할까요? 연결된 첨부파일도 사용되지 않으면 삭제됩니다.'))return;const old=fileRefs(state),draft=clone(state);draft[arr]=draft[arr].filter(e=>e.id!==key);await persist(draft);try{await removeUnused([...old].filter(i=>!fileRefs(draft).has(i)))}catch{}await refreshProjectSummaries();render();toast('기록을 삭제했습니다.');}
async function downloadFile(key){const f=await ensureFile(key);if(!f)throw Error('첨부파일을 찾을 수 없습니다.');downloadBlob(f.blob,f.name);}
function downloadBlob(blob,name){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),15000);}

let gallerySession=null;
function galleryItemsForClick(button,key){
 const base=button?.closest('.baseline-category');
 const record=button?.closest('.baseline-record,.journal-entry,.task-log-entry,.record-entry');
 const familyPhotos=button?.closest('.family-home-photo-group');
 const pair=button?.closest('.baseline-pair');
 let photos=[];
 if(familyPhotos){
  photos=familyHomePhotos();
 }else if(base?.dataset.albumCategory){
  photos=baselineBeforePhotos(base.dataset.albumCategory).map(({photo,j})=>({...photo,caption:j.title}));
 }else if(record?.dataset.recordId){
  const j=state.journals.find(row=>row.id===record.dataset.recordId);
  photos=(j?.photos||[]).map(p=>({...p,caption:j.title}));
 }else if(pair){
  photos=[...pair.querySelectorAll('[data-action="preview-file"][data-id]')].map(b=>({id:b.dataset.id,caption:pair.querySelector('.baseline-pair-title strong')?.textContent||'전·후 사진',name:b.textContent?.trim()||'사진'}));
 }else if(button?.closest('.design-card')){
  const d=state.designs.find(row=>row.id===button.closest('.design-card').dataset.designId);
  photos=designPictures(d).map(p=>({...p,caption:d?.title||'참고 사진'}));
 }else {
  const j=state.journals.find(j=>(j.photos||[]).some(p=>p.id===key));
  photos=(j?.photos||[]).map(p=>({...p,caption:j.title}));
 }
 const uniqueIds=new Set();
 photos=photos.filter(p=>p?.id&&!uniqueIds.has(p.id)&&uniqueIds.add(p.id));
 if(!photos.some(p=>p.id===key))photos.unshift({id:key,name:'현장 사진'});
 return photos;
}

function galleryApplyZoom(){
 const g=gallerySession,image=$('#galleryImage');if(!g||!image)return;
 const z=g.zoom;
 z.scale=Math.max(1,Math.min(5,z.scale));
 if(z.scale===1){z.x=0;z.y=0;}
 else{
  const maxX=Math.max(0,image.clientWidth*(z.scale-1)/2);
  const maxY=Math.max(0,image.clientHeight*(z.scale-1)/2);
  z.x=Math.max(-maxX,Math.min(maxX,z.x));
  z.y=Math.max(-maxY,Math.min(maxY,z.y));
 }
 image.style.transform=`translate3d(${z.x}px,${z.y}px,0) scale(${z.scale})`;
 image.classList.toggle('zoomed',z.scale>1);
 const stage=image.closest('.gallery-stage');stage?.classList.toggle('is-zoomed',z.scale>1);
 const pct=$('#galleryZoomValue');if(pct)pct.textContent=Math.round(z.scale*100)+'%';
 const minus=$('#galleryZoomOut');if(minus)minus.disabled=z.scale<=1;
 const plus=$('#galleryZoomIn');if(plus)plus.disabled=z.scale>=5;
 const reset=$('#galleryZoomReset');if(reset)reset.disabled=z.scale===1;
}
function gallerySetZoom(scale,x=0,y=0){
 const g=gallerySession;if(!g)return;g.zoom={scale,x,y};galleryApplyZoom();
}
function galleryZoomStep(direction){
 if(!gallerySession)return;
 const z=gallerySession.zoom;
 gallerySetZoom(z.scale+(direction>0?.5:-.5),z.x,z.y);
}
function galleryToggleZoom(){
 if(!gallerySession||Date.now()<(gallerySession.ignoreTapUntil||0))return;
 gallerySetZoom(gallerySession.zoom.scale>1?1:2.5);
}

async function showGalleryPhoto(nextIndex){
 const g=gallerySession;
 if(!g||!g.items.length)return;
 g.index=(nextIndex+g.items.length)%g.items.length;
 const sequence=++g.sequence;
 const photo=g.items[g.index];
 const image=$('#galleryImage'),counter=$('#galleryCounter'),caption=$('#galleryCaption'),strip=$('#galleryStrip');
 if(!image)return;
 gallerySetZoom(1);
 image.removeAttribute('src');
 image.alt=photo.name||photo.caption||'현장 사진';
 counter.textContent=`${g.index+1} / ${g.items.length}`;
 caption.textContent=photo.caption||photo.name||'현장 사진';
 $('#galleryDownload').dataset.id=photo.id;
 $('#galleryPrev').disabled=g.items.length<=1;
 $('#galleryNext').disabled=g.items.length<=1;
 const start=Math.max(0,Math.min(g.index-2,g.items.length-5)),end=Math.min(g.items.length,start+5);
 strip.innerHTML=g.items.length>1?g.items.slice(start,end).map((item,i)=>`<button type="button" class="gallery-strip-thumb ${start+i===g.index?'selected':''}" data-action="gallery-go" data-index="${start+i}" aria-label="${start+i+1}번 사진 보기" ${start+i===g.index?'aria-current="true"':''}><img data-blob="${esc(item.id)}" alt="${esc(item.name||'사진')}"></button>`).join(''):'';
 loadImgs();
 try{
  const file=await ensureFile(photo.id);
  if(gallerySession!==g||g.sequence!==sequence||!image.isConnected)return;
  if(!file||!/^image\//.test(file.type))throw Error('사진을 불러올 수 없습니다.');
  let url=objectURLs.get(photo.id);
  if(!url){url=URL.createObjectURL(file.blob);objectURLs.set(photo.id,url);}
  image.src=url;
 }catch(error){if(gallerySession===g&&g.sequence===sequence){image.alt='사진을 불러올 수 없습니다.';toast(error.message||'사진을 불러오지 못했어요.');}}
}
async function showGallery(key,button){
 const items=galleryItemsForClick(button,key);
 const index=items.findIndex(p=>p.id===key);
 gallerySession={items,index:index<0?0:index,sequence:0,zoom:{scale:1,x:0,y:0},ignoreTapUntil:0};
 lastFocus=button||document.activeElement;
 $('#modalRoot').innerHTML=`<div class="modal gallery-modal" role="dialog" aria-modal="true" aria-labelledby="galleryTitle"><div class="gallery-top"><div class="gallery-heading"><span>CHAEPIUM PHOTO ARCHIVE</span><h2 id="galleryTitle">사진 슬라이드 보기</h2></div><span class="gallery-counter" id="galleryCounter" aria-live="polite"></span><div class="gallery-zoom-tools" aria-label="사진 확대 제어"><button type="button" id="galleryZoomOut" data-action="gallery-zoom-out" aria-label="사진 축소">−</button><span id="galleryZoomValue" aria-live="polite">100%</span><button type="button" id="galleryZoomIn" data-action="gallery-zoom-in" aria-label="사진 확대">+</button><button type="button" id="galleryZoomReset" data-action="gallery-zoom-reset" aria-label="사진 크기 원래대로">맞춤</button></div><button type="button" class="gallery-close" data-action="close-modal" aria-label="사진 슬라이드 닫기">×</button></div><div class="gallery-stage"><button type="button" class="gallery-arrow prev" id="galleryPrev" data-action="gallery-prev" aria-label="이전 사진">‹</button><img id="galleryImage" data-action="gallery-toggle-zoom" alt="현장 사진 · 누르면 확대" title="사진을 클릭하면 확대·축소" draggable="false"><button type="button" class="gallery-arrow next" id="galleryNext" data-action="gallery-next" aria-label="다음 사진">›</button></div><div class="gallery-bottom"><p class="gallery-caption" id="galleryCaption"></p><div class="gallery-strip" id="galleryStrip" aria-label="사진 목록"></div><div class="gallery-actions"><span>사진 누르면 확대 · 두 손가락 확대 · 스와이프로 넘기기</span><button type="button" class="btn" data-action="download-file" id="galleryDownload">현재 사진 저장</button></div></div></div>`;
 $('#modalRoot').classList.remove('hidden');
 $('#modalRoot').classList.add('gallery-open');
 document.body.style.overflow='hidden';
 await showGalleryPhoto(gallerySession.index);
 $('#modalRoot').querySelector('[aria-label="사진 슬라이드 닫기"]')?.focus({preventScroll:true});
}

async function previewFile(key,button=null){const f=await ensureFile(key);if(!f)throw Error('첨부파일을 찾을 수 없습니다.');if(/^image\//.test(f.type))return showGallery(key,button);let url=objectURLs.get(key);if(!url){url=URL.createObjectURL(f.blob);objectURLs.set(key,url);}let content;if(/^image\//.test(f.type))content=`<img class="viewer" src="${url}" alt="${esc(f.name)}">`;else if(f.type==='application/pdf')content=`<iframe sandbox="" class="pdf-preview" src="${url}" title="${esc(f.name)} 미리보기"></iframe><p class="small muted">미리보기가 지원되지 않으면 다운로드해서 열어 주세요.</p>`;else if(/^text\/plain/.test(f.type)&&f.size<1024*1024)content=`<pre class="text-preview">${esc(await f.blob.text())}</pre>`;else content='<p>이 형식은 다운로드한 뒤 해당 앱에서 열 수 있습니다.</p>';lastFocus=document.activeElement;$('#modalRoot').innerHTML=`<div class="modal file-preview" role="dialog" aria-modal="true" aria-labelledby="preview-title"><div class="modal-header"><h2 id="preview-title">${esc(f.name)}</h2><button class="icon-btn" data-action="close-modal" aria-label="닫기">${icon('close',22)}</button></div><div class="modal-body">${content}<div class="button-line">${actionButton('download-file','원본 다운로드',`data-id="${esc(f.id)}"`,'btn primary')}</div></div></div>`;$('#modalRoot').classList.remove('hidden');document.body.style.overflow='hidden';$('#modalRoot').querySelector('[aria-label="닫기"]').focus();}
async function workspaceSnapshot(requireComplete=true){const current=await read('meta','workspace');if((current.revision||0)!==(catalog.revision||0))throw Error('다른 탭에서 프로젝트가 변경되었습니다. 새로고침한 뒤 백업해 주세요.');const active=current.activeId?await read('meta','project:'+current.activeId):null;const legacy=await read('meta','state');if(JSON.stringify(legacy??null)!==JSON.stringify(active??null))throw Error('이전 버전 탭에서 변경된 기록이 있습니다. 새로고침하면 별도 프로젝트로 보존합니다.');const projects=await allProjects(),refs=new Set(projects.flatMap(p=>[...fileRefs(p.state)]));let records=await read('attachments');let files=records.filter(f=>refs.has(f.id));const family=projects.find(p=>p.id==='family-moms-garden');if(requireComplete&&family&&window.chaeFamilyBridge?.canView()){const familyRefs=fileRefs(family.state),present=new Set(files.map(f=>f.id));for(const id of familyRefs){if(!present.has(id)){const cloudFile=await window.chaeFamilyBridge.fetchFile(id);await transaction(['attachments'],tx=>tx.objectStore('attachments').put(cloudFile,id));present.add(id);}}records=await read('attachments');files=records.filter(f=>refs.has(f.id));}const missingFileIds=[...refs].filter(ref=>!files.some(f=>f.id===ref));if(requireComplete&&missingFileIds.length)throw Error('첨부파일이 누락되어 있습니다. 백업을 중단합니다.');const latest=await read('meta','workspace');const latestLegacy=await read('meta','state');if(JSON.stringify(latestLegacy??null)!==JSON.stringify(active??null))throw Error('백업 중 이전 버전 탭에서 기록이 변경되었습니다. 새로고침한 뒤 다시 시도해 주세요.');if((latest.revision||0)!==(current.revision||0))throw Error('백업 중 기록이 변경되었습니다. 새로고침한 뒤 다시 시도해 주세요.');return {activeId:catalog.activeId,projects,files,missingFileIds,exported:timestamp()};}
async function exportSnapshot(snap,name='채피움_전체백업_'){if(snap.projects.length>1000||snap.files.length>10000)throw Error('전체 백업의 프로젝트 또는 첨부파일 수가 지원 범위를 초과합니다. 원본을 개별 보관해 주세요.');const files=[];for(const f of snap.files)files.push({id:f.id,name:f.name,type:f.type,size:f.blob.size,data:await fileToDataURL(f.blob)});const incomplete=Boolean(snap.missingFileIds?.length);const payload={app:incomplete?'house-time-recovery':'house-time',version:2,exported:snap.exported||timestamp(),workspace:{activeId:snap.activeId,projects:snap.projects},files};if(incomplete){payload.missingFileIds=snap.missingFileIds;payload.notice='첨부파일이 이미 누락된 상태의 점검용 사본입니다. 일반 전체 복원용 파일이 아닙니다.';name='채피움_누락정보포함_복구점검_';}const blob=new Blob([JSON.stringify(payload)],{type:'application/json'});if(blob.size>250*1024*1024)throw Error('전체 백업이 250MB를 초과합니다. 중요한 원본을 개별 다운로드한 뒤 첨부파일을 정리해 주세요. 기록은 변경하지 않았습니다.');downloadBlob(blob,name+localDate()+'.json');return payload;}
async function backup(){const snap=await workspaceSnapshot();await exportSnapshot(snap);toast(`전체 백업 완료 · 프로젝트 ${snap.projects.length}개, 첨부 ${snap.files.length}개`);}
function validateTextFields(row){for(const key of ['title','name','location','area','start','target','description','stage','status','due','memo','created','type','category','date','vendor','added','body','siteNotes','decision','space','brand','materialType','spec','link','note','reason','phone','person','provider','owner','completed','desc','buildingType','installment'])if(row[key]!==undefined&&row[key]!==null&&typeof row[key]!=='string')throw Error('기록의 날짜·문자 데이터가 올바르지 않습니다.');}
function validateFileRef(ref){if(ref===undefined||ref===null)return;if(typeof ref!=='object'||typeof ref.id!=='string'||!ref.id)throw Error('첨부파일 참조가 올바르지 않습니다.');for(const key of ['name','type'])if(ref[key]!==undefined&&typeof ref[key]!=='string')throw Error('첨부파일 정보가 올바르지 않습니다.');if(ref.size!==undefined&&(!Number.isFinite(Number(ref.size))||Number(ref.size)<0))throw Error('파일 크기가 올바르지 않습니다.');}
function validState(s){if(!s||typeof s!=='object'||!s.project||typeof s.project.title!=='string')throw Error('프로젝트 정보가 올바르지 않습니다.');validateTextFields(s.project);validateFileRef(s.project.cover);for(const key of RECORD_KEYS){if(!Array.isArray(s[key])||s[key].length>50000)throw Error('기록 목록이 올바르지 않습니다.');const ids=new Set();for(const row of s[key]){if(!row||typeof row.id!=='string'||!row.id||ids.has(row.id))throw Error('기록 식별자가 중복되었거나 잘못되었습니다.');ids.add(row.id);validateTextFields(row);for(const field of ['file','photo','receipt'])validateFileRef(row[field]);for(const amount of ['amount','estimate','contract','paid','price'])if(row[amount]!==undefined&&(!['number','string'].includes(typeof row[amount])||!Number.isFinite(Number(row[amount]))||Number(row[amount])<0))throw Error('금액 데이터가 올바르지 않습니다.');}}if(s.project.budgetGoal!==undefined&&(!Number.isFinite(Number(s.project.budgetGoal))||Number(s.project.budgetGoal)<0))throw Error('총예산이 올바르지 않습니다.');if(s.stages!==undefined){if(!Array.isArray(s.stages)||s.stages.length>200)throw Error('단계 데이터가 올바르지 않습니다.');const ids=new Set();for(const stage of s.stages){if(!stage||typeof stage.id!=='string'||typeof stage.name!=='string'||ids.has(stage.id))throw Error('공사 단계가 올바르지 않습니다.');ids.add(stage.id);validateTextFields(stage);validateFileRef(stage.file);}}for(const j of s.journals)if(j.photos!==undefined&&(!Array.isArray(j.photos)||j.photos.some(f=>!f||typeof f.id!=='string')))throw Error('사진 데이터가 올바르지 않습니다.');for(const j of s.journals)for(const f of j.photos||[])validateFileRef(f);for(const d of s.designs){if(d.photos!==undefined&&(!Array.isArray(d.photos)||d.photos.length>100))throw Error('자재 참고 사진 배열이 올바르지 않습니다.');for(const photo of d.photos||[])validateFileRef(photo);if(d.links!==undefined&&typeof d.links!=='string')throw Error('참고 링크 데이터가 올바르지 않습니다.');}return true;}
// Validation and Blob decoding happen before any existing data is replaced.
function validateBackup(obj){if(obj?.app!=='house-time'||![1,2].includes(obj.version)||!Array.isArray(obj.files)||obj.files.length>10000)throw Error('지원하는 채피움 백업 파일이 아닙니다.');let projects,activeId;if(obj.version===1){validState(obj.state);activeId=id();projects=[{id:activeId,state:obj.state}];}else{projects=obj.workspace?.projects;activeId=obj.workspace?.activeId;if(!Array.isArray(projects)||projects.length>1000)throw Error('프로젝트 목록이 올바르지 않습니다.');const seen=new Set();for(const p of projects){if(!p||typeof p.id!=='string'||!p.id||seen.has(p.id))throw Error('프로젝트 식별자가 올바르지 않습니다.');seen.add(p.id);validState(p.state);}if((projects.length&&!seen.has(activeId))||(!projects.length&&activeId!==null))throw Error('현재 프로젝트 정보가 올바르지 않습니다.');}
const seen=new Set(),records=[];for(const f of obj.files){if(!f||typeof f.id!=='string'||!f.id||seen.has(f.id)||typeof f.data!=='string'||!/^data:[^,]*;base64,/.test(f.data))throw Error('첨부파일 데이터가 올바르지 않습니다.');seen.add(f.id);const blob=dataURLtoBlob(f.data);if(blob.size>30*1024*1024)throw Error('개별 첨부파일이 30MB를 초과합니다.');records.push({id:f.id,name:typeof f.name==='string'?f.name:'첨부파일',type:blob.type||f.type||'application/octet-stream',size:blob.size,blob,added:obj.exported||timestamp()});}for(const p of projects)for(const ref of fileRefs(p.state))if(!seen.has(ref))throw Error('사진·파일이 누락된 백업입니다. 기존 기록은 변경하지 않았습니다.');return {projects,activeId,records};}
// Capture the entire prior workspace, then restore metadata and files atomically.
async function restore(file){if(!file)return;if(busy)return;busy=true;try{if(file.size>250*1024*1024)throw Error('250MB 이하의 백업 파일을 선택해 주세요.');const obj=JSON.parse(await file.text()),parsed=validateBackup(obj);if(!confirm(`프로젝트 ${parsed.projects.length}개, 첨부파일 ${parsed.records.length}개로 모든 기록을 복원할까요? 현재 기록은 교체됩니다. 복원 전 전체 백업을 권장합니다.`))return;const recovery=await workspaceSnapshot(false);const nextCatalog={schema:2,activeId:parsed.activeId,ids:parsed.projects.map(p=>p.id),revision:(catalog.revision||0)+1};const current=parsed.projects.find(p=>p.id===parsed.activeId)?.state||freshState();await queue(()=>workspaceWrite(catalog.revision||0,tx=>{const m=tx.objectStore('meta'),a=tx.objectStore('attachments');m.put(recovery,'recovery:last');for(const key of catalog.ids)m.delete('project:'+key);for(const p of parsed.projects)m.put(p.state,'project:'+p.id);m.put(nextCatalog,'workspace');if(parsed.activeId)m.put(current,'state');else m.delete('state');a.clear();for(const f of parsed.records)a.put(f,f.id)},['meta','attachments']));catalog=nextCatalog;state=current;resetFilters();clearObjectURLs();await refreshProjectSummaries();await refreshStorage();ui.page=parsed.activeId?'home':'projects';location.hash=ui.page;render();toast('전체 기록을 복원했어요.');}catch(e){console.error('Restore failed',e);toast('복원 실패: '+(e.message||'파일을 확인해 주세요.'));}finally{busy=false;$('#restoreInput').value='';}}
async function recoverBackup(){const snap=await read('meta','recovery:last');if(!snap)throw Error('아직 복원 전 사본이 없습니다.');await exportSnapshot(snap,'채피움_복원전_사본_');toast(snap.missingFileIds?.length?'누락 파일 목록이 포함된 점검용 사본입니다. 일반 복원용 백업이 아닙니다.':'복원 전 사본을 내려받았습니다.');}
const PAGES={landing,home,stages:stagesPage,budget:budgetPage,journal:journalPage,baseline:baselinePage,files:filesPage,design:designPage,contacts:contactsPage,care:carePage,projects:projectsPage,settings:settingsPage,more:morePage,brand:brandPage};
const PUBLIC_PAGES=new Set(['landing','projects','settings','more','brand']);
function render(){if(!Object.hasOwn(PAGES,ui.page))ui.page=catalog.activeId?'home':'projects';if(!catalog.activeId&&!PUBLIC_PAGES.has(ui.page))ui.page='projects';document.body.className=ui.page==='landing'?'landing-screen':`workspace-screen page-${ui.page}`;$('#railMark').innerHTML=`<img src="./assets/brand/logo-main.png" alt="채피움 CHAEPIUM" width="1400" height="680">`;$('#mobileMark').innerHTML=`<img src="./assets/brand/logo-main.png" alt="채피움 CHAEPIUM" width="1400" height="680">`;$('#railNav').innerHTML=NAV.map(([p,t,ic])=>`<button class="nav-btn ${ui.page===p?'active':''} ${p==='baseline'?'baseline-featured':''}" data-nav="${p}">${icon(ic)}<span>${t}</span></button>`).join('')+`<button class="nav-btn ${ui.page==='more'?'active':''}" data-nav="more">${icon('more')}<span>더보기</span></button><button class="nav-btn" data-nav="landing">${icon('home')}<span>서비스 소개</span></button>`;const mini=[['home','홈','home'],['baseline','전후 비교','camera'],['journal','사진','book'],['budget','비용','wallet'],['more','더보기','more']];$('#bottomNav').innerHTML=mini.map(([p,t,ic])=>`<button class="${ui.page===p||(p==='more'&&!mini.some(x=>x[0]===ui.page))?'active':''}" data-nav="${p}">${icon(ic,21)}<span>${t}</span></button>`).join('');$('#topTitle').textContent=ui.page==='home'&&catalog.activeId==='family-moms-garden'?'엄마의 뜰 · 활동 기록':TITLES[ui.page]||'채피움';const switcher=$('#projectSwitcher');switcher.innerHTML=visibleProjectSummaries().map(p=>`<option value="${esc(p.id)}" ${p.id===catalog.activeId?'selected':''}>${esc(p.state.project.title||'이름 없는 프로젝트')}</option>`).join('')||'<option>가족 프로젝트 연결 전</option>';switcher.disabled=!catalog.ids.length;$('#mainContent').innerHTML=(catalog.activeId==='family-moms-garden'&&!window.chaeFamilyBridge?.canView()&&!['landing','brand','projects'].includes(ui.page))?'<section class="card pane"><h2>엄마의 뜰 · 가족 로그인</h2><p>삼남매가 함께 쓰는 프로젝트입니다. 위의 가족 구글 로그인 버튼으로 로그인해 주세요.</p></section>':PAGES[ui.page]();$('#quickAdd').hidden=ui.page==='landing'||!catalog.activeId;const headerAdd=document.querySelector('.workspace-add');if(headerAdd)headerAdd.hidden=!catalog.activeId;document.title=ui.page==='landing'?'채피움 CHAEPIUM | 집을 짓는 모든 순간을':(TITLES[ui.page]||'채피움')+' | 채피움';loadImgs();window.chaeFamilyBridge?.update?.();}
function navigate(page){if(!Object.hasOwn(PAGES,page))return;if(!catalog.activeId&&!PUBLIC_PAGES.has(page))page='projects';const previous=ui.page;ui.page=page;if(location.hash!=='#'+page)history.pushState({chaepium:true,from:previous},'',location.pathname+location.search+'#'+page);render();window.scrollTo({top:0,behavior:'instant'});}
function quickAdd(){if(!catalog.activeId)return openModal('new-project');lastFocus=document.activeElement;$('#modalRoot').innerHTML=`<div class="modal quick-add-modal" role="dialog" aria-modal="true" aria-labelledby="quick-add-title"><div class="modal-header"><h2 id="quick-add-title">오늘 무엇을 기록할까요?</h2><button class="icon-btn" data-action="close-modal" aria-label="닫기">${icon('close',22)}</button></div><div class="modal-body quick-add-options">${[['journal','사진일기','camera'],['task','일정·할 일','calendar'],['expense','비용','wallet'],['document','서류','folder'],['design','자재·아이디어','palette'],['contact','연락처','phone']].map(([kind,label,ic])=>`<button data-open="${kind}">${icon(ic,24)}<span>${label}</span></button>`).join('')}</div></div>`;$('#modalRoot').classList.remove('hidden');document.body.style.overflow='hidden';$('#modalRoot').querySelector('button').focus();}
async function handleClick(event){const close=event.target.closest('[data-action="close-modal"]');if(close){closeModal();return;}if(busy)return;const nav=event.target.closest('[data-nav]');if(nav){event.preventDefault();navigate(nav.dataset.nav);return;}const op=event.target.closest('[data-open]');if(op){const draft=op.dataset.task?journalDraftForTask(op.dataset.task):(op.dataset.recordType?{type:op.dataset.recordType==='call'?'통화·문의':'현장일기',date:localDate(),stage:visibleStages()[0]?.id||'prep',quickEntry:true}:(op.dataset.baseline?baselineDraft(op.dataset.baseline,op.dataset.phase||'before',op.dataset.beforePhoto||''):null));openModal(op.dataset.open,op.dataset.id,draft);return;}const button=event.target.closest('[data-action]');if(!button)return;const {action,id:key}=button.dataset;if(action==='clear-pasted'){const input=button.closest('.field')?.querySelector('input[type=file]');if(input){clipboardUploads.delete(input);attachmentPasteZone(input);}return;}if(action==='gallery-toggle-zoom'){galleryToggleZoom();return;}if(action==='gallery-zoom-in'){galleryZoomStep(1);return;}if(action==='gallery-zoom-out'){galleryZoomStep(-1);return;}if(action==='gallery-zoom-reset'){gallerySetZoom(1);return;}if(action==='gallery-prev'){await showGalleryPhoto((gallerySession?.index||0)-1);return;}if(action==='gallery-next'){await showGalleryPhoto((gallerySession?.index||0)+1);return;}if(action==='gallery-go'){await showGalleryPhoto(Number(button.dataset.index));return;}if(action==='family-signin'){window.chaeFamilyBridge?.login?.();return;}if(action==='family-create'){window.chaeFamilyBridge?.create?.();return;}if(action==='family-refresh'){window.chaeFamilyBridge?.refresh?.();return;}if(action==='scroll-compare'){$('#compareArea')?.scrollIntoView({behavior:'smooth',block:'start'});return;}if(action==='quick-add')return quickAdd();if(action==='start-project'){if(catalog.ids.length)navigate('projects');else openModal('new-project');return;}if(action==='back'){if(history.state?.from)history.back();else navigate(catalog.activeId?'home':'projects');return;}if(action==='restore'){$('#restoreInput').click();return;}if(action==='focus-stage'){ui.stage=key;ui.taskStatus='all';render();$('#task-list')?.scrollIntoView({block:'start'});return;}if(action==='doc-category'){ui.docCategory=button.dataset.value;render();return;}if(action==='pick-family-cover'){familyHomeCoverPicker();return;}if(action==='view-task'||action==='view-record'){openItemDetail(action==='view-task'?'task':'journal',key);return;}if(action==='view-document'){openDocumentDetail(key);return;}
busy=true;try{if(action==='switch-project')await switchProject(key);else if(action==='delete-project')await deleteProject(key);else if(action==='set-family-cover')await familySetHomeCover(key);else if(action==='delete')await deleteRecord(button.dataset.kind,key);else if(action==='classify-task-record')await classifyTaskAsRecord(key);else if(action==='toggle-task'||action==='toggle-care'){const draft=clone(state),rows=action==='toggle-task'?draft.tasks:draft.care,row=rows.find(t=>t.id===key);if(row){if(action==='toggle-task')row.status=row.status==='done'?'todo':'done';else row.done=!row.done;await persist(draft);render();}}else if(action==='download-file')await downloadFile(key);else if(action==='preview-file')await previewFile(key,button);else if(action==='backup')await backup();else if(action==='recovery')await recoverBackup();else if(action==='cleanup'){if(confirm('어떤 프로젝트에서도 사용하지 않는 첨부파일만 정리할까요?')){await removeUnused((await read('attachments')).map(f=>f.id));await refreshStorage();render();toast('사용하지 않는 첨부파일을 정리했습니다.');}}}catch(e){console.error('Action failed',e);toast(e.message||'처리하지 못했습니다.');}finally{busy=false;}}
// Additive v1 migration: retain original state and attachment IDs; never reset an existing store.
async function init(){try{db=await openDB();const savedCatalog=await read('meta','workspace'),legacy=await read('meta','state');if(savedCatalog){if(savedCatalog.schema!==2||!Array.isArray(savedCatalog.ids))throw Error('프로젝트 목록을 읽을 수 없습니다. 데이터를 삭제하지 말고 백업을 확인해 주세요.');catalog=savedCatalog;state=catalog.activeId?await read('meta','project:'+catalog.activeId):freshState();if(catalog.activeId)validState(state);}else if(legacy){validState(legacy);const legacyId=id();catalog={schema:2,activeId:legacyId,ids:[legacyId],revision:1};await workspaceWrite(0,tx=>{const m=tx.objectStore('meta');m.put(legacy,'legacy-original-v1');m.put(legacy,'project:'+legacyId);m.put(catalog,'workspace')});state=legacy;}else{catalog={schema:2,activeId:null,ids:[],revision:0};state=freshState();await workspaceWrite(0,tx=>tx.objectStore('meta').put(catalog,'workspace'));}if(savedCatalog&&legacy&&JSON.stringify(legacy)!==JSON.stringify(catalog.activeId?state:null)){validState(legacy);const recoveredId=id(),nextCatalog={...catalog,activeId:recoveredId,ids:[...catalog.ids,recoveredId],recoveredIds:[...(catalog.recoveredIds||[]),recoveredId],revision:(catalog.revision||0)+1};await workspaceWrite(catalog.revision||0,tx=>{const m=tx.objectStore('meta');m.put(legacy,'project:'+recoveredId);m.put(nextCatalog,'workspace');m.put(legacy,'state');},['meta'],true);catalog=nextCatalog;state=legacy;toast('이전 버전 탭의 기록을 별도 프로젝트로 보존했습니다. 이전 탭을 닫아 주세요.');}else if(savedCatalog&&catalog.activeId&&!legacy){const nextCatalog={...catalog,revision:(catalog.revision||0)+1};await workspaceWrite(catalog.revision||0,tx=>{tx.objectStore('meta').put(state,'state');tx.objectStore('meta').put(nextCatalog,'workspace');},['meta'],true);catalog=nextCatalog;}await refreshProjectSummaries();for(const p of projectSummaries)validState(p.state);await refreshStorage();const requested=location.hash.slice(1);ui.page=Object.hasOwn(PAGES,requested)?requested:(catalog.activeId?'home':'projects');history.replaceState({chaepium:true},'',location.href);render();window.dispatchEvent(new Event('chaepium-ready'));}catch(e){console.error('Initialization failed',e);$('#mainContent').innerHTML=`<div class="banner warning"><h1>기록 저장소를 열지 못했습니다</h1><p>${esc(e.message)}</p><p>브라우저 데이터를 삭제하지 마세요. 일반 브라우저 모드의 저장 공간과 기존 백업 파일을 확인해 주세요.</p></div>`;}}
// A cloud project is a second copy; never replace the original private project.
async function applyFamilyState(remote,familyId){
 if(busy||!$('#modalRoot').classList.contains('hidden'))throw Error('입력 중에는 다른 가족 기록을 덮어쓰지 않습니다.');
 validState(remote);
 const exists=catalog.ids.includes(familyId),activate=!exists||catalog.activeId===familyId,cat={...clone(catalog),ids:exists?[...catalog.ids]:[...catalog.ids,familyId],activeId:activate?familyId:catalog.activeId,revision:(catalog.revision||0)+1};
 await queue(()=>workspaceWrite(catalog.revision||0,tx=>{const m=tx.objectStore('meta');m.put(clone(remote),'project:'+familyId);if(activate)m.put(clone(remote),'state');m.put(cat,'workspace');},['meta']));
 catalog=cat;if(activate){state=clone(remote);clearObjectURLs();if(ui.page==='landing'||ui.page==='projects')ui.page='home';}await refreshProjectSummaries();render();
}
window.chaeFamilyApp={
 context:()=>({activeId:catalog.activeId,state:state?clone(state):null}),
 newFamily:()=>{const fresh=freshState();fresh.project.title='엄마의 뜰';fresh.project.description='가족이 함께 기록하는 집짓기 과정';return fresh;},
 apply:applyFamilyState,
 getFile:key=>read('attachments',key),
 isBusy:()=>busy,
 modalOpen:()=>!$('#modalRoot').classList.contains('hidden'),
 repaint:()=>{if(db)render()}
};
document.addEventListener('click',handleClick);
document.addEventListener('submit',event=>{const form=event.target;if(form.matches('form[data-form]')){event.preventDefault();onForm(form);}else if(form.matches('[data-search="documents"]')){event.preventDefault();ui.docSearch=new FormData(form).get('query')?.toString().trim()||'';render();}});
document.addEventListener('change',async event=>{if(busy)return;const el=event.target;if(el.matches('#modalRoot select[name=baselineCategory],#modalRoot select[name=baselinePhase]'))syncBaselineModal(el.name==='baselineCategory');if(el.matches('[data-filter]')&&Object.hasOwn(ui,el.dataset.filter)){ui[el.dataset.filter]=el.value;render();}if(el.matches('[data-project-switch]')){busy=true;try{await switchProject(el.value)}catch(e){toast(e.message);render()}finally{busy=false;}}});
document.addEventListener('input',event=>{if(event.target.matches('.baseline-compare-range')){const card=event.target.closest('.baseline-pair');card?.querySelector('.baseline-compare-viewport')?.style.setProperty('--split',event.target.value+'%');}});

document.addEventListener('paste',event=>{
 const zone=event.target.closest?.('.image-paste-zone');
 if(!zone||!$('#modalRoot').contains(zone))return;
 const items=[...(event.clipboardData?.items||[])],images=items.filter(item=>item.kind==='file'&&item.type.startsWith('image/')).map(item=>item.getAsFile()).filter(Boolean);
 if(!images.length)return;
 event.preventDefault();
 const input=zone.closest('.field')?.querySelector('input[type=file]');
 addPastedFiles(input,images);
});
document.addEventListener('drop',event=>{
 const zone=event.target.closest?.('.image-paste-zone');
 if(!zone||!$('#modalRoot').contains(zone))return;
 event.preventDefault();
 addPastedFiles(zone.closest('.field')?.querySelector('input[type=file]'),[...(event.dataTransfer?.files||[])]);
});
document.addEventListener('dragover',event=>{
 if(event.target.closest?.('.image-paste-zone'))event.preventDefault();
});

$('#restoreInput').addEventListener('change',e=>restore(e.target.files?.[0]));
$('#modalRoot').addEventListener('click',event=>{if(event.target===$('#modalRoot'))closeModal();});
document.addEventListener('keydown',event=>{if($('#modalRoot').classList.contains('hidden'))return;if(gallerySession&&['ArrowLeft','ArrowRight'].includes(event.key)){event.preventDefault();showGalleryPhoto(gallerySession.index+(event.key==='ArrowRight'?1:-1));return;}if(event.key==='Escape'){event.preventDefault();closeModal();}if(event.key==='Tab'){const nodes=[...$('#modalRoot').querySelectorAll('button,input,select,textarea,a[href]')].filter(n=>!n.disabled&&n.getClientRects().length);const first=nodes[0],last=nodes.at(-1);if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}}});

let galleryTouchStart=null,galleryPinch=null,galleryMousePan=null;
$('#modalRoot').addEventListener('wheel',event=>{
 if(!gallerySession||!event.target.closest('.gallery-stage'))return;
 event.preventDefault();
 galleryZoomStep(event.deltaY<0?1:-1);
},{passive:false});
$('#modalRoot').addEventListener('pointerdown',event=>{
 if(!gallerySession||gallerySession.zoom.scale<=1||event.pointerType!=='mouse'||event.target.id!=='galleryImage')return;
 galleryMousePan={id:event.pointerId,x:event.clientX,y:event.clientY,left:gallerySession.zoom.x,top:gallerySession.zoom.y,moved:false};
 event.target.setPointerCapture?.(event.pointerId);
});
$('#modalRoot').addEventListener('pointermove',event=>{
 const pan=galleryMousePan,g=gallerySession;
 if(!pan||!g||event.pointerId!==pan.id||event.pointerType!=='mouse')return;
 if(Math.abs(event.clientX-pan.x)>4||Math.abs(event.clientY-pan.y)>4)pan.moved=true;
 g.zoom.x=pan.left+(event.clientX-pan.x);
 g.zoom.y=pan.top+(event.clientY-pan.y);
 galleryApplyZoom();
});
function galleryEndMousePan(){
 if(galleryMousePan?.moved&&gallerySession)gallerySession.ignoreTapUntil=Date.now()+400;
 galleryMousePan=null;
}
$('#modalRoot').addEventListener('pointerup',galleryEndMousePan);
$('#modalRoot').addEventListener('pointercancel',galleryEndMousePan);
$('#modalRoot').addEventListener('touchstart',event=>{
 if(!gallerySession||!event.target.closest('.gallery-stage')){galleryTouchStart=null;galleryPinch=null;return;}
 if(event.touches.length===2){
  const [a,b]=event.touches;
  galleryPinch={distance:Math.hypot(b.clientX-a.clientX,b.clientY-a.clientY),startScale:gallerySession.zoom.scale};
  galleryTouchStart=null;
  return;
 }
 if(event.touches.length!==1){galleryTouchStart=null;return;}
 galleryTouchStart={x:event.touches[0].clientX,y:event.touches[0].clientY,lastX:event.touches[0].clientX,lastY:event.touches[0].clientY,dragged:false};
},{passive:true});
$('#modalRoot').addEventListener('touchmove',event=>{
 const g=gallerySession;
 if(!g||!event.target.closest('.gallery-stage'))return;
 if(event.touches.length===2&&galleryPinch){
  const [a,b]=event.touches,now=Math.hypot(b.clientX-a.clientX,b.clientY-a.clientY);
  if(galleryPinch.distance>0){g.zoom.scale=galleryPinch.startScale*now/galleryPinch.distance;galleryApplyZoom();}
  g.ignoreTapUntil=Date.now()+450;
  event.preventDefault();
  return;
 }
 if(event.touches.length===1&&g.zoom.scale>1&&galleryTouchStart){
  const touch=event.touches[0];
  const dx=touch.clientX-galleryTouchStart.lastX,dy=touch.clientY-galleryTouchStart.lastY;
  if(Math.abs(dx)>1||Math.abs(dy)>1)galleryTouchStart.dragged=true;
  g.zoom.x+=dx;g.zoom.y+=dy;galleryApplyZoom();
  galleryTouchStart.lastX=touch.clientX;galleryTouchStart.lastY=touch.clientY;
  g.ignoreTapUntil=Date.now()+350;
  event.preventDefault();
 }
},{passive:false});
$('#modalRoot').addEventListener('touchend',event=>{
 if(!gallerySession)return;
 if(galleryPinch){
  if(event.touches.length<2){galleryPinch=null;galleryTouchStart=null;gallerySession.ignoreTapUntil=Date.now()+450;}
  return;
 }
 const t=galleryTouchStart;
 if(!t||event.changedTouches.length!==1)return;
 galleryTouchStart=null;
 if(gallerySession.zoom.scale>1){if(t.dragged)gallerySession.ignoreTapUntil=Date.now()+350;return;}
 const dx=event.changedTouches[0].clientX-t.x,dy=event.changedTouches[0].clientY-t.y;
 if(Math.abs(dx)>45&&Math.abs(dx)>Math.abs(dy)*1.25){
  gallerySession.ignoreTapUntil=Date.now()+400;
  showGalleryPhoto(gallerySession.index+(dx<0?1:-1));
 }
},{passive:true});
$('#modalRoot').addEventListener('touchcancel',()=>{galleryTouchStart=null;galleryPinch=null;},{passive:true});

function readRoute(){if(!db)return;const requested=location.hash.slice(1);ui.page=Object.hasOwn(PAGES,requested)?requested:(catalog.activeId?'home':'projects');closeModal();render();}
window.addEventListener('popstate',readRoute);window.addEventListener('hashchange',readRoute);window.addEventListener('beforeunload',event=>{if(busy){event.preventDefault();event.returnValue='';}});
init();
})();
