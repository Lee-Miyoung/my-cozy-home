import{firebaseConfig}from'./firebase-config.js';
import{initializeApp}from'https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js';
import{getAuth,GoogleAuthProvider,signInWithPopup,signInWithRedirect,signOut,onAuthStateChanged}from'https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js';
import{getDatabase,ref,get,set,onValue,runTransaction}from'https://www.gstatic.com/firebasejs/11.10.0/firebase-database.js';
const fb=initializeApp(firebaseConfig),auth=getAuth(fb),db=getDatabase(fb);
const ID='family-moms-garden',BASE='familyAlbum/',TARGET=BASE+'sharedProject',FILES=BASE+'sharedFiles/';
let api=null,role='',uid='',live=null,version=0,applied=0,off=null,pending=null,syncing=false,known=new Set(),statusText='';
const byId=s=>document.getElementById(s),member=x=>x==='owner'||x==='contributor';
function note(s){statusText=s;const n=byId('familyStatus');if(n)n.textContent=s}
function ui(){
 const btn=byId('familyLoginBtn');if(btn)btn.textContent=uid?(role?'가족 연결됨 · 로그아웃':'가족 권한 확인 · 로그아웃'):'가족 구글 로그인';
 const context=api?.context();const ready=!!(context?.activeId&&context.state?.project?.title?.trim()==='엄마의 뜰'&&context.activeId!==ID);
 const start=byId('familyStartBtn');if(start)start.hidden=!(role==='owner'&&!live);
 const share=byId('familyInviteBtn');if(share)share.hidden=!(role&&live);
 note(statusText)
}
const refs=s=>{const all=[s.project?.cover];for(const j of s.journals||[])all.push(...(j.photos||[]));for(const d of s.documents||[])all.push(d.file);for(const d of s.designs||[])all.push(d.photo);for(const d of s.expenses||[])all.push(d.receipt);for(const d of s.stages||[])all.push(d.file);return all.filter(f=>f?.id)};
const encoding=b=>new Promise((yes,no)=>{const r=new FileReader();r.onload=()=>yes(r.result);r.onerror=()=>no(r.error);r.readAsDataURL(b)});
async function compress(blob){let img;const canvas=document.createElement('canvas');try{img=await createImageBitmap(blob);let scale=Math.min(1,940/Math.max(img.width,img.height)),data='';for(let i=0;i<8;i++){canvas.width=Math.max(1,Math.round(img.width*scale));canvas.height=Math.max(1,Math.round(img.height*scale));canvas.getContext('2d').drawImage(img,0,0,canvas.width,canvas.height);data=canvas.toDataURL('image/jpeg',Math.max(.35,.64-i*.04));if(data.length<=170000)break;scale*=.82}if(data.length>170000)throw Error('이 사진은 압축할 수 없어요. JPG로 변환해서 올려주세요.');return data}finally{img?.close();canvas.width=canvas.height=0}}
async function uploadFiles(s){for(const f of refs(s)){if(known.has(f.id))continue;const exists=await get(ref(db,FILES+f.id));if(exists.exists()){known.add(f.id);continue}const saved=await api.getFile(f.id);if(!saved?.blob)throw Error('첨부파일을 찾을 수 없어요: '+f.name);let mime=saved.type||saved.blob.type,payload;if(mime.startsWith('image/')){mime='image/jpeg';payload=await compress(saved.blob)}else if(mime==='application/pdf'||mime==='text/plain'){if(saved.blob.size>4*1024*1024)throw Error('파일이 4MB를 넘어요. PDF를 압축해 다시 첨부해 주세요: '+f.name);payload=await encoding(saved.blob)}else throw Error('공유할 수 없는 파일 형식: '+f.name);await set(ref(db,FILES+f.id),{authorUid:uid,name:f.name||saved.name||'첨부',mime,payload,createdAt:Date.now()});known.add(f.id)}}
async function fetchFile(id){if(!role)throw Error('가족 로그인이 필요해요.');const s=await get(ref(db,FILES+id));if(!s.exists())throw Error('가족 파일을 찾지 못했어요.');const v=s.val(),response=await fetch(v.payload),blob=await response.blob();return{id,name:v.name,type:v.mime,size:blob.size,blob}}
function normalizeState(value){const x=JSON.parse(JSON.stringify(value||{}));for(const k of ['tasks','expenses','journals','documents','designs','contacts','care','stages'])if(!Array.isArray(x[k]))x[k]=[];return x}
async function apply(){if(!pending||!api||syncing||api.isBusy()||api.modalOpen())return;const x=pending;if(x.revision===applied){pending=null;return}syncing=true;try{const fixed=normalizeState(x.state);await api.apply(fixed,ID);applied=x.revision;pending=null;known=new Set(refs(fixed).map(f=>f.id));note('삼남매 공동 프로젝트 동기화 완료')}catch(e){note('화면 동기화 실패: '+e.message)}finally{syncing=false;ui()}}
async function changed(snapshot){live=snapshot.val();version=live?.revision||0;if(live?.state){pending=live;await apply()}else note(role==='owner'?'관리자 로그인 완료! 공동 프로젝트 만들기를 누르면 시작할 수 있어요.':'로그인 완료! 관리자가 프로젝트를 만들면 자동으로 나타나요.');ui();api?.repaint()}
async function authorize(user){if(off){off();off=null}uid=user?.uid||'';role='';live=null;version=applied=0;pending=null;known=new Set();ui();if(!uid){note('가족 계정으로 로그인하면 함께 사용할 수 있어요.');api?.repaint();return}try{const p=await get(ref(db,'familyAccess/'+uid));role=member(p.val())?p.val():'';if(!role){note('등록되지 않은 계정입니다. UID: '+uid);ui();api?.repaint();return}off=onValue(ref(db,TARGET),changed,e=>note('Firebase 권한 오류: '+e.message));note('가족 계정 연결됨');ui();api?.repaint()}catch(e){note('가족 로그인 확인 실패: '+e.message);ui()}}
async function login(){try{if(auth.currentUser)await signOut(auth);else await signInWithPopup(auth,new GoogleAuthProvider())}catch(e){if(['auth/popup-blocked','auth/operation-not-supported-in-this-environment'].includes(e.code)){try{await signInWithRedirect(auth,new GoogleAuthProvider())}catch(err){note('로그인 실패: '+err.message)}}else note('구글 로그인 실패: '+e.message)}}
async function start(){
 if(role!=='owner'||!api){note('관리자 계정으로 로그인해 주세요.');return}
 if(live){note('이미 가족 프로젝트가 있어요. 새로 만들 필요가 없어요.');return}
 const c=api.context(),old=(c.activeId!==ID&&c.state?.project?.title?.trim()==='엄마의 뜰')?c.state:null;
 const message=old?"기존 ‘엄마의 뜰’ 기록을 삼남매 공동 프로젝트로 연결할까요? 원본은 남겨둡니다.":"삼남매가 함께 사용할 ‘엄마의 뜰’ 프로젝트를 지금 새로 만들까요? 예전 기록은 가져오지 않습니다.";
 if(!confirm(message))return;
 try{
  note('가족 공동 프로젝트를 생성하고 있어요…');
  const firstState=old||api.newFamily();
  if(old)await uploadFiles(firstState);
  const first={revision:1,updatedAt:Date.now(),state:JSON.parse(JSON.stringify(firstState))};
  const result=await runTransaction(ref(db,TARGET),current=>current?undefined:first,{applyLocally:false});
  if(!result.committed){note('다른 기기에서 이미 가족 프로젝트를 만들었어요. 동기화를 다시 확인해 주세요.');await bridge.refresh();return}
  live=result.snapshot.val();version=1;pending=live;await apply();
  if(applied===1)note('엄마의 뜰 공동 프로젝트가 만들어졌어요. 삼남매가 함께 기록할 수 있어요.');
  else note('프로젝트는 만들어졌지만 화면 연결을 확인해야 해요. 동기화 다시 확인을 눌러 주세요.');
  ui();
 }catch(e){note('프로젝트 만들기 실패: '+e.message);alert('프로젝트 생성 오류: '+e.message)}
}
async function save(snapshot){if(!role||!live||!api)throw Error('가족 공유가 연결되지 않았어요.');if(pending||version!==applied)throw Error('다른 가족이 수정했어요. 최신 기록을 확인하고 다시 수정해 주세요.');await uploadFiles(snapshot);const base=applied;const result=await runTransaction(ref(db,TARGET),cur=>{if(!cur||cur.revision!==base)return;return{revision:base+1,updatedAt:Date.now(),state:JSON.parse(JSON.stringify(snapshot))}},{applyLocally:false});if(!result.committed)throw Error('다른 가족이 먼저 저장했습니다. 변경 내용을 다시 확인해 주세요.');live=result.snapshot.val();version=applied=live.revision;note('변경사항이 삼남매에게 저장됐어요.')}
const bridge={familyId:ID,save,fetchFile,canView:()=>!!role,hasCloud:()=>!!live,update:ui,login,create:start,
 getStatus:()=>({uid,role,cloud:!!live,revision:version,message:statusText}),
 refresh:async()=>{if(!role)return note('먼저 등록된 가족 계정으로 로그인해 주세요.');try{const snap=await get(ref(db,TARGET));await changed(snap);api?.repaint();}catch(e){note('동기화 확인 실패: '+e.message)}}
};
window.chaeFamilyBridge=bridge;
function mount(){if(api)return;api=window.chaeFamilyApp;if(!api)return;byId('familyLoginBtn')?.addEventListener('click',login);byId('familyStartBtn')?.addEventListener('click',start);
 byId('familyInviteBtn')?.addEventListener('click',async()=>{
  if(!role||!live){note('기존 프로젝트를 먼저 가족에게 공유해 주세요.');return}
  const url=new URL('./index.html#home',location.href).href;
  try{if(navigator.share)await navigator.share({title:'채피움 · 엄마의 뜰',text:'삼남매가 함께 보는 엄마의 뜰 프로젝트예요. 각자 등록된 구글 계정으로 로그인해 주세요.',url});
  else if(navigator.clipboard){await navigator.clipboard.writeText(url);note('가족 공동 프로젝트 주소를 복사했어요.')}
  else {prompt('가족에게 이 주소를 보내 주세요.',url)}
  }catch(e){if(e.name!=='AbortError')note('공유 메뉴 오류: '+e.message)}
 });
 onAuthStateChanged(auth,authorize);setInterval(()=>{if(pending)apply()},1200);ui()}
window.addEventListener('chaepium-ready',mount);if(window.chaeFamilyApp)mount();