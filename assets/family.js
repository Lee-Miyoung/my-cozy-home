import {firebaseConfig} from "./firebase-config.js";
import {initializeApp} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import {getAuth,GoogleAuthProvider,signInWithPopup,signInWithRedirect,getRedirectResult,onAuthStateChanged,signOut} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";
import {getFirestore,doc,setDoc,getDoc,updateDoc,collection,addDoc,getDocs,query,orderBy,deleteDoc,serverTimestamp} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";
import {getStorage,ref,uploadBytes,getBlob,deleteObject} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-storage.js";
const $=s=>document.querySelector(s),status=$('#status');
let auth,db,storage,user,albumId=null,album=null,entries=[],urls=[],uploading=false;
function message(t,kind=''){status.textContent=t;status.className='status '+kind;}
const validId=v=>/^[a-zA-Z0-9_-]{12,120}$/.test(v||'');
const safe=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function show(el,on=true){$(el).hidden=!on;}
function setBusy(v){uploading=v;for(const id of ['upload','create','join','saveSettings'])$(('#'+id)).disabled=v;}
function cleanUrls(){for(const url of urls)URL.revokeObjectURL(url);urls=[];}
function emails(s){return [...new Set(s.split(/[,\n;\s]+/).map(x=>x.trim().toLowerCase()).filter(Boolean))];}
const isOwner=()=>album?.ownerUid===user?.uid;
async function login(){
 try{await signInWithPopup(auth,new GoogleAuthProvider());}
 catch(err){if(['auth/popup-blocked','auth/operation-not-supported-in-this-environment'].includes(err.code)){await signInWithRedirect(auth,new GoogleAuthProvider());return;}message('로그인 실패: '+err.message,'error');}
}
async function loadAlbum(id){
 if(!validId(id)){message('앨범 코드가 올바르지 않아요.','error');return;}
 cleanUrls();albumId=null;album=null;entries=[];
 try{
  const snap=await getDoc(doc(db,'familyProjects',id));
  if(!snap.exists())throw Error('앨범을 찾을 수 없거나 접근 권한이 없습니다.');
  albumId=id;album=snap.data();
  sessionStorage.setItem('chaepium-family-album',id);
  history.replaceState(null,'',location.pathname+'#'+id);
  show('#connectPanel',false);show('#albumPanel');
  $('#albumTitle').textContent=album.title||'우리 가족의 집';
  $('#albumStage').textContent=album.stage||'함께 쌓는 집짓기 기록';
  show('#ownerControls',isOwner());
  $('#memberEmails').value=(album.memberEmails||[]).join(', ');
  $('#stage').value=album.stage||'';
  message('가족 전용 앨범에 연결됐어요. 사진과 기록은 허가된 계정에서만 볼 수 있어요.','ok');
  await loadEntries();
 }catch(e){message('앨범 연결 실패: '+e.message,'error');show('#connectPanel');show('#albumPanel',false);}
}
async function loadEntries(){
 cleanUrls();
 $('#entries').textContent='가족 사진을 불러오는 중이에요.';
 try{
  const snaps=await getDocs(query(collection(db,'familyProjects',albumId,'entries'),orderBy('createdAt','desc')));
  entries=snaps.docs.map(s=>({id:s.id,...s.data()}));
  $('#entryCount').textContent=entries.length+'개의 기록';
  if(!entries.length){$('#entries').innerHTML='<p class="muted">아직 사진이 없어요. 첫 번째 현장 이야기를 남겨주세요.</p>';return;}
  $('#entries').innerHTML=entries.map(e=>'<article class="entry"><div class="entry-top"><strong>'+safe(e.date||'날짜 미정')+'</strong><span class="meta">'+safe(e.authorName||'가족')+'</span></div><div class="meta">'+safe(e.stage||'현장 기록')+'</div><p class="note">'+safe(e.note||'')+'</p><div class="photos" id="pics-'+safe(e.id)+'"></div><div class="rowactions">'+((e.authorUid===user.uid||isOwner())?'<button class="secondary" data-edit="'+safe(e.id)+'">메모 수정</button><button class="secondary" data-remove="'+safe(e.id)+'">기록 삭제</button>':'')+'</div></article>').join('');
  for(const e of entries)for(const path of e.photoPaths||[]){
   const area=document.getElementById('pics-'+e.id);if(!area)continue;
   const img=document.createElement('img');img.alt=(e.date||'')+' 가족 현장 사진';img.loading='lazy';area.append(img);
   try{const blob=await getBlob(ref(storage,path));if(albumId!==location.hash.slice(1))return;const url=URL.createObjectURL(blob);urls.push(url);img.src=url;img.tabIndex=0;img.addEventListener('click',()=>window.open(url,'_blank','noopener'));}catch(err){img.alt='사진을 불러올 수 없어요';}
  }
 }catch(e){message('기록 불러오기 실패: '+e.message,'error');}
}
async function convert(file){
 if(file.size>30*1024*1024)throw Error('30MB 초과 사진은 업로드할 수 없습니다.');
 if(!/^image\/(jpeg|png|webp)$/.test(file.type))throw Error('JPG·PNG·WebP 형식의 사진을 선택해 주세요. HEIC 사진은 기기에서 JPEG로 변환한 뒤 올려주세요.');
 const img=await createImageBitmap(file);const scale=Math.min(1,1600/Math.max(img.width,img.height));
 const c=document.createElement('canvas');c.width=Math.max(1,Math.round(img.width*scale));c.height=Math.max(1,Math.round(img.height*scale));
 c.getContext('2d').drawImage(img,0,0,c.width,c.height);img.close();
 const out=await new Promise(resolve=>c.toBlob(resolve,'image/jpeg',.76));c.width=0;c.height=0;
 if(!out)throw Error('사진을 변환하지 못했습니다.');
 return out;
}
async function createAlbum(){
 setBusy(true);
 try{const id=crypto.randomUUID();await setDoc(doc(db,'familyProjects',id),{ownerUid:user.uid,title:'엄마의 집짓기',stage:'집짓기 준비중',memberEmails:[],createdAt:serverTimestamp(),updatedAt:serverTimestamp()});await loadAlbum(id);}
 catch(e){message('앨범 생성 실패: '+e.message,'error');}
 finally{setBusy(false);}
}
async function saveSettings(){
 if(!isOwner())return;const list=emails($('#memberEmails').value);if(list.length>10)return message('가족은 최대 10명까지 추가할 수 있습니다.','error');
 if(list.some(e=>!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)))return message('이메일 주소를 확인해 주세요.','error');
 setBusy(true);
 try{await updateDoc(doc(db,'familyProjects',albumId),{memberEmails:list,stage:$('#stage').value.trim().slice(0,100),updatedAt:serverTimestamp()});album.memberEmails=list;album.stage=$('#stage').value.trim();$('#albumStage').textContent=album.stage||'함께 쌓는 집짓기 기록';message('초대 계정과 진행 상황을 저장했어요.','ok');}
 catch(e){message('설정 저장 실패: '+e.message,'error');}
 finally{setBusy(false);}
}
async function addEntry(event){
 event.preventDefault();if(uploading||!albumId)return;const fd=new FormData(event.currentTarget);
 const files=[...$('#photos').files];if(files.length>8)return message('사진은 한 번에 8장까지 선택해 주세요.','error');
 if(!files.length&&!String(fd.get('note')||'').trim())return message('사진이나 현장 메모를 남겨주세요.','error');
 setBusy(true);const paths=[];
 try{
  const date=String(fd.get('date')||''),stage=String(fd.get('stage')||'').trim().slice(0,60),note=String(fd.get('note')||'').trim().slice(0,1200);
  for(let i=0;i<files.length;i++){
   message('사진 업로드 중… '+(i+1)+'/'+files.length);const blob=await convert(files[i]);
   const path='familyPhotos/'+albumId+'/'+user.uid+'/'+crypto.randomUUID()+'.jpg';
   await uploadBytes(ref(storage,path),blob,{contentType:'image/jpeg'});paths.push(path);
  }
  await addDoc(collection(db,'familyProjects',albumId,'entries'),{authorUid:user.uid,authorName:user.displayName||user.email||'가족',date,stage,note,photoPaths:paths,createdAt:serverTimestamp(),updatedAt:serverTimestamp()});
  $('#entryForm').reset();$('#entryForm [name=date]').value=new Date().toLocaleDateString('en-CA');$('#chosen').textContent='';
  message('가족 현장일기에 저장했어요.','ok');await loadEntries();
 }catch(e){message('등록 실패: '+e.message,'error');for(const path of paths){try{await deleteObject(ref(storage,path))}catch{}}}
 finally{setBusy(false);}
}
async function changeEntry(eid,mode){
 const e=entries.find(x=>x.id===eid);if(!e||(e.authorUid!==user.uid&&!isOwner()))return;
 if(mode==='edit'){const note=prompt('현장 메모를 수정하세요.',e.note||'');if(note===null)return;if(note.length>1200)return message('메모는 1200자 이하로 입력해 주세요.','error');
 try{await updateDoc(doc(db,'familyProjects',albumId,'entries',eid),{note,updatedAt:serverTimestamp()});await loadEntries();message('메모를 수정했어요.','ok');}catch(err){message(err.message,'error');}}
 else {if(!confirm('이 기록과 첨부 사진을 가족 앨범에서 삭제할까요?'))return;
 try{await deleteDoc(doc(db,'familyProjects',albumId,'entries',eid));for(const path of e.photoPaths||[]){try{await deleteObject(ref(storage,path))}catch{}}await loadEntries();message('기록을 삭제했어요.','ok');}catch(err){message(err.message,'error');}}
}
function start(){
 if(!firebaseConfig.apiKey||!firebaseConfig.authDomain||!firebaseConfig.storageBucket||!firebaseConfig.appId){
  message('Firebase 연결 대기 중: 아직 가족 사진은 서버에 업로드되지 않습니다. 보안 규칙을 먼저 배포한 후 Firebase 설정을 입력하세요.');
  return;
 }
 const app=initializeApp(firebaseConfig);auth=getAuth(app);db=getFirestore(app);storage=getStorage(app);
 $('#signIn').onclick=login;$('#signOut').onclick=()=>signOut(auth);
 $('#create').onclick=createAlbum;$('#join').onclick=()=>loadAlbum($('#joinId').value.trim());
 $('#copyInvite').onclick=async()=>{try{await navigator.clipboard.writeText(location.href);message('앨범 링크를 복사했어요. 가족 이메일을 먼저 초대 목록에 등록해 주세요.','ok');}catch{message('브라우저 주소를 복사해 가족에게 보내주세요.');}};
 $('#leaveAlbum').onclick=()=>{albumId=null;album=null;cleanUrls();sessionStorage.removeItem('chaepium-family-album');history.replaceState(null,'',location.pathname);show('#albumPanel',false);show('#connectPanel');message('다른 앨범을 연결할 수 있어요.');};
 $('#saveSettings').onclick=saveSettings;$('#entryForm').onsubmit=addEntry;
 $('#entryForm [name=date]').value=new Date().toLocaleDateString('en-CA');
 $('#photos').onchange=()=>$('#chosen').textContent=$('#photos').files.length+'장 선택됨';
 $('#entries').addEventListener('click',async ev=>{const edit=ev.target.closest('[data-edit]'),del=ev.target.closest('[data-remove]');if(edit)await changeEntry(edit.dataset.edit,'edit');if(del)await changeEntry(del.dataset.remove,'remove');});
 getRedirectResult(auth).catch(e=>message('로그인 처리 실패: '+e.message,'error'));
 onAuthStateChanged(auth,async u=>{
  user=u;show('#login',!u);show('#workspace',!!u);if(!u){message('가족 구글 계정으로 로그인해 주세요.');show('#albumPanel',false);albumId=null;cleanUrls();return;}
  $('#who').textContent=(u.displayName||u.email)+' · 가족 계정';
  const id=location.hash.slice(1)||sessionStorage.getItem('chaepium-family-album');
  if(validId(id))await loadAlbum(id);else message('가족 앨범을 새로 만들거나 초대 코드를 입력하세요.','ok');
 });
}
try{start();}catch(e){message('Firebase 초기화 오류: '+e.message,'error');}
