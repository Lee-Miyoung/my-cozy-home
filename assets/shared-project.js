import{firebaseConfig}from"./firebase-config.js";
import{initializeApp}from"https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import{getAuth,GoogleAuthProvider,signInWithPopup,onAuthStateChanged,signOut}from"https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";
import{getDatabase,ref,get,onValue,set,push,update,remove,query,limitToLast}from"https://www.gstatic.com/firebasejs/11.10.0/firebase-database.js";
const $=q=>document.querySelector(q),safe=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
let auth,db,user,role,shared=null,photos=[],docs=[],active="overview",unsubs=[],busy=false;
const root="familyAlbum/";
function status(x,error=false){$("#status").textContent=x;$("#status").className="status "+(error?"error":"ok")}
const money=v=>Number(v||0).toLocaleString("ko-KR")+"원";
function row(t,d){return'<div class="record"><strong>'+safe(t)+'</strong><span class="small">'+safe(d)+'</span></div>'}
function show(tab){active=tab;document.querySelectorAll("[data-tab]").forEach(x=>x.classList.toggle("active",x.dataset.tab===tab));$("#photoFormPanel").hidden=tab!=="photos";$("#ownerFiles").hidden=!(tab==="documents"&&role==="owner");render();}
function render(){
 const v=$("#view");if(!shared){v.innerHTML='<p class="muted">아직 공유된 프로젝트가 없어. 관리자 계정에서 현재 프로젝트 공유를 눌러줘.</p>';return}
 const p=shared.project||{},j=shared.journals||[],tasks=shared.tasks||[],expenses=shared.expenses||[],documents=shared.documents||[];
 if(active==="overview"){v.innerHTML='<h2>'+safe(shared.title||"엄마의 뜰")+'</h2><div class="info-grid">'+[['건축 예정지',p.location||"미입력"],['진행률',(shared.progress||0)+"%"],['공사 단계',shared.stage||"준비"],['목표 예산',money(p.budgetGoal)],['착공',p.start||"미정"],['준공',p.target||"미정"]].map(([k,val])=>'<div><small>'+safe(k)+'</small><b>'+safe(val)+'</b></div>').join("")+'</div><h3>프로젝트 소개</h3><p>'+safe(p.description||"엄마 집 짓기 기록")+'</p><p class="small">기록 갱신: '+new Date(shared.updatedAt).toLocaleString("ko-KR")+'</p>'}
 if(active==="timeline"){v.innerHTML='<h2>공사 일정과 할 일</h2>'+tasks.map(t=>row(t.title||"할 일",[t.due,t.status==="done"?"완료":"진행중",t.owner||""].filter(Boolean).join(" · "))).join("")+(tasks.length?"":"<p>기록이 없어.</p>")}
 if(active==="budget"){v.innerHTML='<h2>건축비와 계약</h2><div class="info-grid">'+[['총예산',p.budgetGoal],['견적 합계',expenses.reduce((n,x)=>n+Number(x.estimate||0),0)],['계약 합계',expenses.reduce((n,x)=>n+Number(x.contract||0),0)],['지급 합계',expenses.reduce((n,x)=>n+Number(x.paid||0),0)]].map(([k,n])=>'<div><small>'+k+'</small><b>'+money(n)+'</b></div>').join("")+'</div><h3>비용 내역</h3>'+expenses.map(e=>row(e.title||"지출",[e.category||"",e.vendor||"",e.date||"","견적 "+money(e.estimate),"계약 "+money(e.contract),"지급 "+money(e.paid)].join(" · "))).join("")}
 if(active==="documents"){v.innerHTML='<h2>계약서·서류 목록</h2>'+documents.map(d=>row(d.title||d.file?.name||"서류",[d.category,d.date,d.memo].filter(Boolean).join(" · "))).join("")+'<h3>가족 공유 첨부파일</h3><div id="contractList">'+docs.map(d=>'<div class="record"><b>'+safe(d.name)+'</b> <button class="secondary" data-file="'+safe(d.id)+'">열기</button></div>').join("")+'</div><p class="small">개인 로컬 서류 원본은 자동 공개하지 않으며, 관리자가 직접 등록한 파일만 열 수 있어.</p>'}
 if(active==="photos"){v.innerHTML='<h2>가족 사진일기</h2>'+photos.map(e=>{let pic=[];try{pic=JSON.parse(e.photosJson||"[]")}catch{}return '<article class="entry"><strong>'+safe(e.date)+' · '+safe(e.authorName)+'</strong><div class="small">'+safe(e.stage)+'</div><p class="note">'+safe(e.note)+'</p><div class="shared-photos">'+pic.filter(x=>/^data:image\/jpeg;base64,[\w+/=]+$/.test(x)).map(x=>'<img src="'+x+'" loading="lazy" alt="현장 사진">').join("")+'</div>'+(role==="owner"||e.authorUid===user?.uid?'<button class="secondary" data-del="'+safe(e.id)+'">삭제</button>':"")+'</article>'}).join("")+(photos.length?"":"<p>가족이 첫 현장 사진을 올려줘.</p>")+'<h3>내 기존 사진일기 목록</h3>'+j.map(x=>row(x.title||"사진일기",[x.date,x.body].filter(Boolean).join(" · "))).join("")+'<p class="small">개인 사진 원본은 아직 자동 업로드하지 않아.</p>'}
}
async function loadLocal(){
 const dbx=await new Promise((ok,no)=>{const q=indexedDB.open("house_time_private_v1",1);q.onsuccess=()=>ok(q.result);q.onerror=()=>no(q.error)});
 try{const read=key=>new Promise((ok,no)=>{const tr=dbx.transaction("meta","readonly"),r=tr.objectStore("meta").get(key);r.onsuccess=()=>ok(r.result);r.onerror=()=>no(r.error)});
 const catalog=await read("workspace");if(!catalog?.activeId)throw Error("이 브라우저에 프로젝트가 없습니다. 원래 프로젝트를 만들었던 브라우저에서 열어줘.");
 const state=await read("project:"+catalog.activeId);if(!state?.project)throw Error("현재 프로젝트를 읽지 못했어요.");
 return state;
 }finally{dbx.close()}
}
function progress(tasks){const a=(tasks||[]).filter(t=>t.status);return a.length?Math.round(a.filter(t=>t.status==="done").length/a.length*100):0}
async function publish(){
 if(busy)return;if(!$("#consent").checked)return status("먼저 주소·비용·계약 공유에 동의해 주세요.",true);
 busy=true;$("#publish").disabled=true;
 try{const state=await loadLocal();if(!confirm("현재 선택한 '"+state.project.title+"' 프로젝트의 주소·예산·계약 내역·일정·서류 제목을 가족에게 공유할까요?"))return;
 const project={title:state.project.title,location:state.project.location||"",description:state.project.description||"",budgetGoal:Number(state.project.budgetGoal||0),start:state.project.start||"",target:state.project.target||"",buildingType:state.project.buildingType||"",landArea:state.project.landArea||"",floorArea:state.project.floorArea||""};
 const tasks=(state.tasks||[]).map(t=>({title:t.title||"",due:t.due||"",status:t.status||"",owner:t.owner||"",stage:t.stage||""}));
 const expenses=(state.expenses||[]).map(e=>({title:e.title||"",category:e.category||"",vendor:e.vendor||"",date:e.date||"",estimate:Number(e.estimate||0),contract:Number(e.contract||0),paid:Number(e.paid||0),memo:e.memo||""}));
 const documents=(state.documents||[]).map(d=>({title:d.title||"",category:d.category||"",date:d.date||"",memo:d.memo||"",name:d.file?.name||""}));
 const journals=(state.journals||[]).map(j=>({title:j.title||"",date:j.date||"",body:j.body||"",stage:j.stage||""}));
 const data={title:state.project.title||"엄마의 뜰",stage:"집짓기 진행",progress:progress(tasks),updatedAt:Date.now(),project,tasks,expenses,documents,journals};
 await set(ref(db,root+"sharedProject"),data);status("현재 프로젝트를 가족과 공유했어. 가족이 같은 화면에서 볼 수 있어.");}
 catch(e){status("프로젝트 공유 실패: "+e.message,true)}finally{busy=false;$("#publish").disabled=false}
}
async function compress(file){if(!/^image\/(jpeg|png|webp)$/.test(file.type))throw Error("JPG·PNG·WebP만 지원해. HEIC은 변환 필요.");const bmp=await createImageBitmap(file),c=document.createElement("canvas");const sc=Math.min(1,750/Math.max(bmp.width,bmp.height));c.width=Math.max(1,Math.round(bmp.width*sc));c.height=Math.max(1,Math.round(bmp.height*sc));c.getContext("2d").drawImage(bmp,0,0,c.width,c.height);bmp.close();const v=c.toDataURL("image/jpeg",.48);c.width=0;c.height=0;if(v.length>140000)throw Error("사진이 너무 커서 올리지 못했어.");return v}
async function savePhotos(ev){ev.preventDefault();const fd=new FormData(ev.currentTarget),files=[...fd.getAll("photos")].filter(f=>f.size);if(!files.length&&!fd.get("note"))return status("사진 또는 메모를 선택해.",true);try{let batch=[],saved=0;const put=async(note)=>{const parent=push(ref(db,root+"entries"));await set(parent,{authorUid:user.uid,authorName:user.displayName||"가족",date:String(fd.get("date")||""),stage:String(fd.get("stage")||""),note,photosJson:JSON.stringify(batch),createdAt:Date.now()});batch=[];};if(!files.length){await put(String(fd.get("note")||"").slice(0,1200))}else{for(const file of files){status("사진 자동 압축·등록 "+(saved+1)+"/"+files.length+"장");batch.push(await compress(file));saved++;if(batch.length===2||saved===files.length)await put(saved<=2?String(fd.get("note")||"").slice(0,1200):"")}}ev.target.reset();ev.target.elements.date.value=new Date().toISOString().slice(0,10);status("사진과 기록을 가족 프로젝트에 저장했어.")}catch(e){status("등록 실패: "+e.message,true)}}
const blobURL=s=>fetch(s).then(r=>r.blob());
async function fileUpload(){const f=$("#contractFile").files[0];if(!f)return status("파일을 골라줘.",true);if(f.size>300000)return status("300KB 이하 파일만 가능해. 큰 계약서는 별도 안전한 방식으로 공유해.",true);if(!["application/pdf","image/jpeg","image/png"].includes(f.type))return status("PDF/JPG/PNG만 지원해.",true);try{const payload=await new Promise((yes,no)=>{const reader=new FileReader();reader.onload=()=>yes(reader.result);reader.onerror=()=>no(reader.error);reader.readAsDataURL(f)});await set(push(ref(db,root+"contracts")),{name:f.name.slice(0,180),mime:f.type,payload,createdAt:Date.now()});status("가족 공유 파일을 저장했어.")}catch(e){status("파일 공유 실패: "+e.message,true)}}
async function openFile(id){const f=docs.find(x=>x.id===id);if(!f)return;try{const blob=await blobURL(f.payload),url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download=f.name;a.click();setTimeout(()=>URL.revokeObjectURL(url),30000)}catch(e){status("파일 열기 실패: "+e.message,true)}}
function connect(){
 const app=initializeApp(firebaseConfig);auth=getAuth(app);db=getDatabase(app);
 $("#signIn").onclick=async()=>{try{await signInWithPopup(auth,new GoogleAuthProvider())}catch(e){status("로그인 실패: "+e.message,true)}};
 $("#signOut").onclick=()=>signOut(auth);$("#publish").onclick=publish;
 $("#photoForm").onsubmit=savePhotos;$("#photoForm [name=date]").value=new Date().toISOString().slice(0,10);
 $("#contractUpload").onclick=fileUpload;
 document.querySelectorAll("[data-tab]").forEach(b=>b.onclick=()=>show(b.dataset.tab));
 $("#view").onclick=async e=>{const f=e.target.closest("[data-file]"),d=e.target.closest("[data-del]");if(f)openFile(f.dataset.file);if(d&&confirm("가족 사진 기록을 삭제할까?")){try{await remove(ref(db,root+"entries/"+d.dataset.del))}catch(err){status(err.message,true)}}};
 onAuthStateChanged(auth,async u=>{unsubs.forEach(fn=>fn());unsubs=[];user=u;role="";shared=null;photos=[];docs=[];$("#login").hidden=!!u;$("#app").hidden=true;
 if(!u){status("가족 구글 계정으로 로그인해 주세요.");return}
 try{const perm=(await get(ref(db,"familyAccess/"+u.uid))).val();if(!["owner","contributor"].includes(perm))return status("가족 명단에 없는 계정이야. UID: "+u.uid,true);
 role=perm;$("#who").textContent=(u.displayName||u.email)+" · "+(role==="owner"?"관리자":"가족 기록자");$("#app").hidden=false;$("#ownerTools").hidden=role!=="owner";
 unsubs.push(onValue(ref(db,root+"sharedProject"),snap=>{shared=snap.val();render()},err=>status("현황 조회 실패: "+err.message,true)));
 unsubs.push(onValue(query(ref(db,root+"entries"),limitToLast(150)),snap=>{photos=Object.entries(snap.val()||{}).map(([id,e])=>({id,...e})).sort((a,b)=>b.createdAt-a.createdAt);render()},err=>status("사진 조회 실패: "+err.message,true)));
 unsubs.push(onValue(ref(db,root+"contracts"),snap=>{docs=Object.entries(snap.val()||{}).map(([id,e])=>({id,...e}));render()},err=>status("서류 조회 실패: "+err.message,true)));
 show("overview");status("가족 프로젝트에 연결됐어.")}
 catch(e){status("접근 오류: "+e.message,true)}
 });
}
try{connect()}catch(e){status("연결 오류: "+e.message,true)}
