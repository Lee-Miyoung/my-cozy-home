import{firebaseConfig}from"./firebase-config.js";
import{initializeApp}from"https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import{getAuth,GoogleAuthProvider,signInWithPopup,signInWithRedirect,onAuthStateChanged,signOut}from"https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";
import{getDatabase,ref,get,onValue,push,set,remove}from"https://www.gstatic.com/firebasejs/11.10.0/firebase-database.js";
const app=initializeApp(firebaseConfig,"chaepium-family-ideas"),auth=getAuth(app),db=getDatabase(app);
const path="familyAlbum/ideas",q=s=>document.querySelector(s),esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
let user=null,role="",items=[],unsub=null,clipboardFiles=[],originalPhotos=[],saving=false,lightPhotos=[],lightIndex=0,touchX=null;
const allowed=()=>role==="owner"||role==="contributor";
function notice(message,error=false){q("#status").textContent=message;q("#status").classList.toggle("error",error)}
function links(value){
 const list=value.split(/[\r\n]+/).map(v=>v.trim()).filter(Boolean);
 if(list.length>5)throw Error("참고 링크는 최대 5개까지만 등록해 주세요.");
 return list.map(v=>{let u;try{u=new URL(v)}catch{throw Error("링크 주소가 올바르지 않아요.");}
 if(!["https:","http:"].includes(u.protocol)||u.href.length>550)throw Error("https:// 또는 http://로 시작하는 주소만 사용할 수 있어요.");return u.href;});
}
function array(v){try{const result=JSON.parse(v||"[]");return Array.isArray(result)?result:[]}catch{return []}}
const photosOf=e=>array(e.photosJson).filter(x=>typeof x==="string"&&/^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(x)&&x.length<120000).slice(0,5);
const linksOf=e=>array(e.linksJson).filter(x=>typeof x==="string"&&/^https?:\/\//.test(x)).slice(0,5);
function reset(){q("#ideasForm").reset();q("#ideasForm").elements.editId.value="";q("#saveIdea").textContent="가족 보드에 올리기";clipboardFiles=[];originalPhotos=[];drawPasted();q("#composePanel").hidden=true;}
function drawPasted(){
 q("#pastedCount").textContent=clipboardFiles.length?"붙여넣은 사진 "+clipboardFiles.length+"장 · 저장하면 등록돼요":"붙여넣은 사진 없음";
 q("#pasteThumbs").replaceChildren();
 for(const file of clipboardFiles){const img=document.createElement("img"),url=URL.createObjectURL(file);img.src=url;img.alt="붙여넣은 사진";img.onload=()=>URL.revokeObjectURL(url);q("#pasteThumbs").append(img);}
}
function addPaste(list){const valid=list.filter(f=>f?.type?.startsWith("image/"));if(!valid.length)return;clipboardFiles.push(...valid);if(clipboardFiles.length>5){clipboardFiles=clipboardFiles.slice(-5);notice("사진은 한 아이디어에 최대 5장까지 올릴 수 있어요.",true);}drawPasted();}
async function compress(file){
 if(!/^image\/(jpeg|png|webp)$/.test(file.type))throw Error("JPG·PNG·WebP 사진만 지원해요.");
 if(file.size>30*1024*1024)throw Error("사진 한 장은 30MB 이하로 올려 주세요.");
 const img=await createImageBitmap(file),canvas=document.createElement("canvas");let result="";
 try{let scale=Math.min(1,900/Math.max(img.width,img.height));
 for(let n=0;n<9;n++){canvas.width=Math.max(1,Math.round(img.width*scale));canvas.height=Math.max(1,Math.round(img.height*scale));canvas.getContext("2d").drawImage(img,0,0,canvas.width,canvas.height);result=canvas.toDataURL("image/jpeg",Math.max(.36,.7-n*.05));if(result.length<=110000)break;scale*=.8;}
 if(result.length>110000)throw Error("사진이 너무 커요. 작은 이미지로 다시 붙여넣어 주세요.");
 return result;}finally{img.close();canvas.width=canvas.height=0;}
}
function render(){
 if(!allowed())return;
 const filter=q("#categoryFilter").value;const visible=items.filter(i=>!filter||i.category===filter);
 q("#ideaTotal").textContent=visible.length+"개 아이디어";
 q("#ideasList").innerHTML=visible.map(i=>{
  const p=photosOf(i),ls=linksOf(i),editable=role==="owner"||i.authorUid===user.uid;
  return `<article class="ideas-card"><div class="idea-meta"><span class="idea-category">${esc(i.category)}</span><span class="idea-author">${esc(i.authorName)} · ${esc(new Date(i.createdAt).toLocaleDateString("ko-KR"))}</span></div><h2>${esc(i.title)}</h2>${i.note?`<p class="idea-note">${esc(i.note)}</p>`:""}${p.length?`<div class="idea-photos">${p.map((_,n)=>`<button type="button" data-act="photo" data-id="${esc(i.id)}" data-index="${n}"><img src="${p[n]}" alt="${esc(i.title)} 참고 사진 ${n+1}" loading="lazy"></button>`).join("")}</div>`:""}${ls.length?`<ul class="idea-links">${ls.map(url=>`<li><a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(url)} ↗</a></li>`).join("")}</ul>`:""}${editable?`<div class="idea-actions"><button data-act="edit" data-id="${esc(i.id)}">수정</button><button data-act="delete" data-id="${esc(i.id)}">삭제</button></div>`:""}</article>`;
 }).join("")||'<div class="ideas-empty">아직 가족이 올린 아이디어가 없어요. 참고 링크나 사진을 첫 번째로 올려보세요.</div>';
}
function edit(id){
 const item=items.find(i=>i.id===id);if(!item||!(role==="owner"||item.authorUid===user.uid))return;
 reset();const form=q("#ideasForm");form.elements.editId.value=id;form.elements.title.value=item.title||"";form.elements.category.value=item.category||"기타";form.elements.note.value=item.note||"";form.elements.links.value=linksOf(item).join("\n");originalPhotos=photosOf(item);q("#saveIdea").textContent="수정 내용 저장";q("#composePanel").hidden=false;q("#composePanel").scrollIntoView({behavior:"smooth"});
 notice("기존 사진은 유지되고, 새로 선택한 사진은 추가돼요.");
}
async function save(event){
 event.preventDefault();if(saving||!allowed())return;
 const form=event.currentTarget,fd=new FormData(form),editId=String(fd.get("editId")||""),old=editId?items.find(i=>i.id===editId):null;
 if(editId&&!old)return notice("수정할 기록이 없어요.",true);
 if(old&&old.authorUid!==user.uid&&role!=="owner")return notice("작성자만 수정할 수 있어요.",true);
 const title=String(fd.get("title")||"").trim(),category=String(fd.get("category")||"기타"),note=String(fd.get("note")||"").trim();
 if(!title)return notice("제목을 입력해 주세요.",true);
 const files=[...q("#ideaFile").files,...clipboardFiles];if(files.length+originalPhotos.length>5)return notice("참고 사진은 한 게시물당 5장까지 등록할 수 있어요.",true);
 saving=true;q("#saveIdea").disabled=true;
 try{const list=links(String(fd.get("links")||""));const pictures=[...originalPhotos];notice("참고 사진을 압축하고 있어요…");
 for(const file of files)pictures.push(await compress(file));
 const linksJson=JSON.stringify(list),photosJson=JSON.stringify(pictures);
 if(photosJson.length>700000||linksJson.length>3000)throw Error("사진 용량 또는 링크가 너무 커요.");
 const now=Date.now(),entry={authorUid:old?.authorUid||user.uid,authorName:old?.authorName||user.displayName||"가족",category,title,note:note.slice(0,1200),linksJson,photosJson,createdAt:old?.createdAt||now,updatedAt:now};
 await set(editId?ref(db,path+"/"+editId):push(ref(db,path)),entry);reset();notice("삼남매 아이디어 보드에 저장했어요.");
 }catch(err){notice("저장 실패: "+err.message,true)}finally{saving=false;q("#saveIdea").disabled=false;}
}
function lightbox(index){if(!lightPhotos.length)return;lightIndex=(index+lightPhotos.length)%lightPhotos.length;q("#lightboxImage").src=lightPhotos[lightIndex];q("#lightboxCounter").textContent=(lightIndex+1)+" / "+lightPhotos.length;q("#ideaLightbox").hidden=false;document.body.style.overflow="hidden";}
function closeLight(){q("#ideaLightbox").hidden=true;document.body.style.overflow="";}
function cardAction(e){
 const b=e.target.closest("button[data-act]");if(!b)return;const id=b.dataset.id,act=b.dataset.act,item=items.find(x=>x.id===id);if(!item)return;
 if(act==="photo"){lightPhotos=photosOf(item);return lightbox(Number(b.dataset.index));}
 if(act==="edit")return edit(id);
 if(act==="delete"&&(role==="owner"||item.authorUid===user.uid)&&confirm("이 아이디어를 삭제할까요? 가족 모두의 화면에서 사라져요.")){remove(ref(db,path+"/"+id)).then(()=>notice("아이디어를 삭제했어요.")).catch(err=>notice("삭제 실패: "+err.message,true));}
}
function signIn(){signInWithPopup(auth,new GoogleAuthProvider()).catch(async err=>{if(["auth/popup-blocked","auth/operation-not-supported-in-this-environment"].includes(err.code)){try{await signInWithRedirect(auth,new GoogleAuthProvider())}catch(e){notice("로그인 실패: "+e.message,true)}}else notice("로그인 실패: "+err.message,true);});}
function initialize(){
 q("#signIn").onclick=signIn;q("#signOut").onclick=()=>signOut(auth);
 q("#composeToggle").onclick=()=>{q("#composePanel").hidden=!q("#composePanel").hidden;if(!q("#composePanel").hidden)q("#ideasForm").elements.title.focus();else reset();};
 q("#resetCompose").onclick=reset;q("#ideasForm").onsubmit=save;q("#categoryFilter").onchange=render;q("#ideasList").onclick=cardAction;
 const zone=q("#ideaPaste");document.addEventListener("paste",e=>{if(!e.target.closest?.("#ideaPaste"))return;const pics=[...(e.clipboardData?.items||[])].filter(x=>x.kind==="file"&&x.type.startsWith("image/")).map(x=>x.getAsFile()).filter(Boolean);if(pics.length){e.preventDefault();addPaste(pics);}});
 zone.addEventListener("drop",e=>{e.preventDefault();addPaste([...(e.dataTransfer?.files||[])]);});zone.addEventListener("dragover",e=>e.preventDefault());
 q("#lightboxClose").onclick=closeLight;q("#lightboxPrev").onclick=()=>lightbox(lightIndex-1);q("#lightboxNext").onclick=()=>lightbox(lightIndex+1);
 q("#ideaLightbox").addEventListener("touchstart",e=>{if(e.touches.length===1)touchX=e.touches[0].clientX;},{passive:true});
 q("#ideaLightbox").addEventListener("touchend",e=>{if(touchX===null)return;const dx=e.changedTouches[0].clientX-touchX;touchX=null;if(Math.abs(dx)>50)lightbox(lightIndex+(dx<0?1:-1));},{passive:true});
 document.addEventListener("keydown",e=>{if(q("#ideaLightbox").hidden)return;if(e.key==="Escape")closeLight();else if(e.key==="ArrowLeft")lightbox(lightIndex-1);else if(e.key==="ArrowRight")lightbox(lightIndex+1);});
 onAuthStateChanged(auth,async u=>{
  if(unsub){unsub();unsub=null;}user=u;role="";items=[];q("#ideasApp").hidden=true;q("#loginPanel").hidden=!!u;if(!u){notice("가족 구글 계정으로 로그인해 주세요.");return;}
  try{const permission=(await get(ref(db,"familyAccess/"+u.uid))).val();if(permission!=="owner"&&permission!=="contributor")return notice("등록된 가족 계정만 사용할 수 있어요. UID: "+u.uid,true);
   role=permission;q("#memberName").textContent=(u.displayName||u.email||"가족")+" · "+(role==="owner"?"관리자":"가족 구성원");q("#ideasApp").hidden=false;
   unsub=onValue(ref(db,path),snapshot=>{items=Object.entries(snapshot.val()||{}).map(([id,val])=>({id,...val})).sort((a,b)=>(b.createdAt||0)-(a.createdAt||0));render();notice("아이디어가 가족과 실시간으로 공유되고 있어요.");},err=>notice("접근 오류: "+err.message+" · 데이터베이스 규칙을 확인해 주세요.",true));
  }catch(err){notice("가족 계정 확인 실패: "+err.message,true);}
 });
}
initialize();