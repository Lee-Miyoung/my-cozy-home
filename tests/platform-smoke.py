"""Browser regression checks for the local CHAEPIUM platform.
Run against a local static server; test data lives only in isolated browser contexts.
"""
import base64
import json
import os
import shutil
from pathlib import Path
import tempfile
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
URL = os.environ.get('CHAEPIUM_TEST_URL', 'http://127.0.0.1:8002/my-cozy-home/')
OUT = Path(os.environ.get('CHAEPIUM_TEST_ARTIFACTS', tempfile.mkdtemp(prefix='chaepium-platform-')))
OUT.mkdir(parents=True, exist_ok=True)
READ = '''async(key)=>{const db=await new Promise((ok,bad)=>{const r=indexedDB.open('house_time_private_v1',1);r.onsuccess=()=>ok(r.result);r.onerror=()=>bad(r.error)});const value=await new Promise((ok,bad)=>{const r=db.transaction('meta').objectStore('meta').get(key);r.onsuccess=()=>ok(r.result);r.onerror=()=>bad(r.error)});db.close();return value}'''

def get(page, key='state'):
    return page.evaluate(READ, key)

def nav(page, key):
    visible = page.locator(f'[data-nav="{key}"]:visible')
    if not visible.count():
        if page.locator('[data-nav="more"]:visible').count(): page.locator('[data-nav="more"]:visible').first.click()
        else:
            page.locator('[data-action="start-project"]:visible').first.click()
            if not page.locator(f'[data-nav="{key}"]:visible').count(): page.locator('[data-nav="more"]:visible').first.click()
    page.locator(f'[data-nav="{key}"]:visible').first.click()

def form(page, kind, key=None):
    selector = f'[data-open="{kind}"]' + (f'[data-id="{key}"]' if key else ':not([data-id])') + ':visible'
    if not page.locator(selector).count():
        if kind == 'new-project': nav(page, 'projects')
        elif kind == 'project': nav(page, 'home')
        elif kind == 'stage': nav(page, 'stages')
        else: nav(page, {'task':'stages','expense':'budget','journal':'journal','document':'files','design':'design','contact':'contacts','care':'care'}[kind])
    page.locator(selector).first.click()
    target=page.locator(f'form[data-form="{kind}"]')
    target.wait_for()
    return target

def fill(target, values):
    for key,value in values.items():
        node=target.locator(f'[name="{key}"]')
        if node.evaluate('(e)=>e.tagName') == 'SELECT': node.select_option(str(value))
        else: node.fill(str(value))

def save(page, target):
    target.locator('[type="submit"]').click()
    page.locator('#modalRoot').wait_for(state='hidden')
    # Wait until persistence and post-save reference cleanup finish before next action.
    page.wait_for_function('!document.querySelector("#modalRoot form [type=submit][disabled]")')

def export(page, name):
    nav(page,'settings')
    with page.expect_download() as d: page.locator('[data-action="backup"]').click()
    path=OUT/name;d.value.save_as(path)
    return path,json.loads(path.read_text())

def restore(page, path, expected='home'):
    nav(page,'settings');page.locator('#restoreInput').set_input_files(str(path))
    page.wait_for_function('(hash)=>location.hash==="#"+hash',arg=expected)
    page.locator('.project-hero h2' if expected=='home' else '.projects-grid').wait_for()

def legacy_fixture():
    stamp='2026-10-18T00:00:00.000Z'
    ref=lambda id,name,type,data:dict(id=id,name=name,type=type,size=len(data),data='data:'+type+';base64,'+base64.b64encode(data).decode())
    photo=ref('legacy-photo','legacy.png','image/png',(ROOT/'assets/brand/icon-192.png').read_bytes())
    doc=ref('legacy-doc','legacy.txt','text/plain',b'legacy private document')
    compact=lambda d:{k:v for k,v in d.items() if k!='data'}
    state=dict(schema=1,project=dict(title='기존 프로젝트',location='기존 예정지',area='원래 규모',target='2027-09-30',description='변경하면 안 되는 소개',budgetGoal=10000000),
        tasks=[dict(id='legacy-task',stage='land',title='기존 할 일',status='todo',due='',memo='원래 메모',created=stamp),dict(id='legacy-move',stage='move',title='입주 이후 점검',status='done',due='',memo='',created=stamp)],
        expenses=[dict(id='legacy-expense',type='payment',category='기타',amount=50000,date='2026-10-18',title='기존 지급',vendor='',memo='',created=stamp)],
        journals=[dict(id='legacy-journal',title='기존 사진일기',date='2026-10-18',type='현장일기',stage='land',body='원래 기록',photos=[compact(photo)],created=stamp)],
        documents=[dict(id='legacy-document',title='기존 서류',category='기타',memo='기존 메모',added=stamp,file=compact(doc),created=stamp)],
        designs=[dict(id='legacy-design',title='기존 자재',space='거실',status='후보',price=12000,note='기존 비교',photo=compact(photo),created=stamp)],contacts=[],care=[])
    return dict(app='house-time',version=1,exported=stamp,state=state,files=[photo,doc])

with sync_playwright() as p:
    if os.environ.get('CDP_URL'):
        browser=p.chromium.connect_over_cdp(os.environ['CDP_URL'])
    else:
        executable=os.environ.get('CHROMIUM_PATH') or shutil.which('chromium')
        browser=p.chromium.launch(executable_path=executable,args=['--no-sandbox','--disable-dev-shm-usage'])
    context=browser.new_context(accept_downloads=True,viewport={'width':1366,'height':900})
    page=context.new_page();page.set_default_timeout(12000);errors=[]
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.on('dialog',lambda d:d.accept())
    page.goto(URL);page.locator('.platform-hero h1').wait_for()
    assert get(page,'workspace')['ids']==[]
    assert get(page) is None
    print('PASS: clean install has a public landing page and no invented project data')
    legacy=legacy_fixture();fixture=OUT/'legacy.json';fixture.write_text(json.dumps(legacy,ensure_ascii=False))
    page.evaluate('''async(data)=>{const db=await new Promise(ok=>{const r=indexedDB.open('house_time_private_v1',1);r.onsuccess=()=>ok(r.result)});await new Promise((ok,bad)=>{const t=db.transaction(['meta','attachments'],'readwrite');t.objectStore('meta').clear();t.objectStore('meta').put(data.state,'state');t.objectStore('attachments').clear();for(const f of data.files){const raw=atob(f.data.split(',')[1]);const bytes=Uint8Array.from(raw,c=>c.charCodeAt(0));t.objectStore('attachments').put({...f,blob:new Blob([bytes],{type:f.type})},f.id)}t.oncomplete=ok;t.onerror=()=>bad(t.error)});db.close()}''',legacy)
    page.reload();page.get_by_role('heading',name='기존 프로젝트',exact=True).wait_for()
    assert get(page)==legacy['state'];assert get(page,'legacy-original-v1')==legacy['state']
    assert page.locator('.progress-ring strong').inner_text()=='50%'
    first_id=get(page,'workspace')['activeId']
    print('PASS: legacy single-project data and an immutable original snapshot survive migration')
    nav(page,'stages');assert page.get_by_role('heading',name='입주·생활',exact=True).is_visible()
    page.locator('[data-filter="stageStatus"]').select_option('done');assert page.locator('.phase-card').count()==1
    page.locator('[data-filter="stageStatus"]').select_option('all')
    target=form(page,'task','legacy-task');fill(target,{'title':'수정한 기존 할 일','due':'2026-11-01','owner':'담당자'});save(page,target)
    assert get(page)['tasks'][0]['owner']=='담당자'
    page.locator('[data-action="toggle-task"][data-id="legacy-task"]').click()
    page.wait_for_function("document.querySelector('[data-action=\"toggle-task\"][data-id=\"legacy-task\"]').classList.contains('checked')")
    target=form(page,'task');fill(target,{'title':'삭제할 테스트 할 일'});save(page,target)
    delete_id=next(t['id'] for t in get(page)['tasks'] if t['title']=='삭제할 테스트 할 일')
    page.locator(f'[data-action="delete"][data-kind="task"][data-id="{delete_id}"]').click()
    page.locator(f'[data-open="task"][data-id="{delete_id}"]').wait_for(state='detached')
    target=form(page,'stage');fill(target,{'name':'추가 공정','status':'doing','start':'2026-10-19','target':'2026-11-03','owner':'현장 담당','memo':'추가 단계 메모'})
    target.locator('[name="file"]').set_input_files({'name':'stage.txt','mimeType':'text/plain','buffer':b'stage file'})
    save(page,target);stage_id=next(s['id'] for s in get(page)['stages'] if s['name']=='추가 공정')
    target=form(page,'stage',stage_id);fill(target,{'visibility':'hide'});save(page,target)
    assert get(page)['stages'][-1]['hidden'] is True
    target=form(page,'stage',stage_id);fill(target,{'visibility':'show','completed':'2026-11-03'});save(page,target)
    print('PASS: task add/edit/toggle/delete and custom stage dates/owner/file/hide/show')
    nav(page,'budget');target=form(page,'expense');fill(target,{'title':'창호 공사','category':'창호','vendor':'테스트 업체','estimate':2000000,'contract':1800000,'paid':600000,'date':'2026-10-19','installment':'계약금'})
    target.locator('[name="receipt"]').set_input_files({'name':'receipt.txt','mimeType':'text/plain','buffer':b'receipt bytes'})
    save(page,target);assert get(page)['expenses'][0]['paid']==600000
    assert '650,000원' in page.locator('.budget-totals').inner_text()
    assert '1,800,000원' in page.locator('.budget-totals').inner_text()
    assert '2026-10' in page.locator('.monthly-chart').inner_text()
    print('PASS: estimate/contract/actual totals stay distinct; legacy payment, category and monthly aggregation included')
    nav(page,'journal');target=form(page,'journal');fill(target,{'title':'골조가 올라간 날','date':'2026-10-19','stage':'build','body':'작업 내용','siteNotes':'현장 메모','decision':'창호 색상 확정','memo':'개인 메모'})
    target.locator('[name="photos"]').set_input_files([str(ROOT/'assets/brand/icon-192.png'),str(ROOT/'assets/brand/apple-touch-icon.png')]);save(page,target)
    jid=get(page)['journals'][0]['id'];assert len(get(page)['journals'][0]['photos'])==2
    page.locator('[data-filter="journalMonth"]').select_option('2026-10');page.locator('[data-filter="journalStage"]').select_option('build')
    assert page.locator('.journal-entry').count()==1
    page.locator('.photo-thumb').first.click();page.locator('.viewer').wait_for();page.get_by_role('button',name='닫기',exact=True).click()
    target=form(page,'journal',jid);target.locator('[name="removePhotos"]').first.check();fill(target,{'title':'수정한 골조 기록'});save(page,target)
    assert len(get(page)['journals'][0]['photos'])==1
    print('PASS: multi-photo journal, month/stage filters, zoom, edit and individual photo removal')
    nav(page,'files');target=form(page,'document');fill(target,{'title':'공사 계약서','category':'계약서','date':'2026-10-19','memo':'검색 가능한 계약 메모'})
    target.locator('[name="file"]').set_input_files({'name':'contract.txt','mimeType':'text/plain','buffer':b'private construction contract'})
    save(page,target);did=get(page)['documents'][0]['id']
    page.locator('.search-input input').fill('검색 가능한');page.locator('.search-form button').click();assert page.locator('.doc-card').count()==1
    page.locator('[data-action="preview-file"]').first.click();assert 'private construction contract' in page.locator('.text-preview').inner_text()
    with page.expect_download() as dl: page.locator('.file-preview [data-action="download-file"]').click()
    dl.value.save_as(OUT/'downloaded-contract.txt');assert (OUT/'downloaded-contract.txt').read_bytes()==b'private construction contract'
    page.get_by_role('button',name='닫기',exact=True).click();target=form(page,'document',did);fill(target,{'title':'수정한 계약서'});save(page,target)
    print('PASS: document upload/search/category/date/preview/download/rename')
    nav(page,'design');target=form(page,'design');fill(target,{'title':'주방 상판','space':'주방','status':'확정','brand':'테스트 브랜드','materialType':'상판','spec':'20mm','price':450000,'note':'두 후보 비교','reason':'관리하기 편해서','link':'https://example.com/product'})
    target.locator('[name="photo"]').set_input_files(str(ROOT/'assets/brand/icon-192.png'));save(page,target)
    page.locator('[data-filter="designStatus"]').select_option('확정');assert page.locator('.design-card').count()==1
    assert get(page)['designs'][0]['reason']=='관리하기 편해서'
    target=form(page,'contact');fill(target,{'name':'현장 담당 업체','person':'담당자','phone':'010-0000-0000'});save(page,target)
    target=form(page,'care');fill(target,{'title':'입주 후 설비 점검','due':'2027-10-01'});save(page,target)
    page.locator('[data-action="toggle-care"]').first.click()
    page.wait_for_function("document.querySelector('[data-action=\"toggle-care\"]').textContent==='완료 취소'")
    print('PASS: material fields/final choice/image/filter, contacts, maintenance record')
    target=form(page,'project');fill(target,{'landArea':330,'buildingArea':99,'floorArea':150,'buildingType':'단독주택','budgetGoal':300000000,'start':'2026-10-20','target':'2027-06-30'})
    target.locator('[name="cover"]').set_input_files(str(ROOT/'assets/brand/icon-192.png'));save(page,target)
    first_state=get(page);assert first_state['project']['landArea']=='330'
    target=form(page,'new-project');fill(target,{'title':'두 번째 프로젝트','location':'새 건축 예정지'});save(page,target)
    second_id=get(page,'workspace')['activeId'];assert first_id!=second_id and get(page)['journals']==[]
    page.reload();page.get_by_role('heading',name='두 번째 프로젝트',exact=True).wait_for()
    page.locator('[data-project-switch]').select_option(first_id);page.get_by_role('heading',name='기존 프로젝트',exact=True).wait_for()
    assert get(page)==first_state
    print('PASS: project fields/cover, multiple independent projects, switching and reload persistence')
    backup_path,payload=export(page,'full-v2-backup.json');assert payload['version']==2 and len(payload['workspace']['projects'])==2
    expected={p['id']:p['state'] for p in payload['workspace']['projects']}
    refs=set()
    for item in payload['workspace']['projects']:
        s=item['state'];refs.update(p['id'] for j in s['journals'] for p in j.get('photos',[]))
        refs.update(d['file']['id'] for d in s['documents']);refs.update(d['photo']['id'] for d in s['designs'] if d.get('photo'))
        refs.update(e['receipt']['id'] for e in s['expenses'] if e.get('receipt'));refs.update(st['file']['id'] for st in s.get('stages',[]) if st.get('file'))
        if s['project'].get('cover'):refs.add(s['project']['cover']['id'])
    assert refs=={f['id'] for f in payload['files']}
    restore(page,fixture);assert get(page)==legacy['state']
    nav(page,'settings')
    with page.expect_download() as recovered:page.locator('[data-action="recovery"]').click()
    recovered.value.save_as(OUT/'recovery.json');assert len(json.loads((OUT/'recovery.json').read_text())['workspace']['projects'])==2
    restore(page,backup_path);assert get(page)==first_state
    cat=get(page,'workspace');assert len(cat['ids'])==2
    for key,value in expected.items():assert get(page,'project:'+key)==value
    bad=json.loads(backup_path.read_text());bad['files']=[];(OUT/'invalid-missing-files.json').write_text(json.dumps(bad))
    nav(page,'settings');page.locator('#restoreInput').set_input_files(str(OUT/'invalid-missing-files.json'))
    page.locator('#toast').filter(has_text='누락').wait_for();assert get(page)==first_state and get(page,'workspace')==cat
    bad_date=json.loads(backup_path.read_text());bad_date['workspace']['projects'][0]['state']['journals'][0]['date']=12345
    (OUT/'invalid-date.json').write_text(json.dumps(bad_date))
    page.locator('#restoreInput').set_input_files(str(OUT/'invalid-date.json'))
    page.locator('#toast').filter(has_text='문자').wait_for();assert get(page)==first_state and get(page,'workspace')==cat
    print('PASS: full v2 backup covers cover/photo/document/material/receipt/stage blobs; v1 import, v2 restore, pre-restore recovery, missing files and malformed dates rejected without data changes')
    restore(page,backup_path)
    for width in [1440,1024,820,780,390,360,320]:
        page.set_viewport_size({'width':width,'height':900})
        for key in ['home','stages','journal','budget','files','design','contacts','care','projects','settings','brand','landing']:
            nav(page,key)
            page.locator('#mainContent').wait_for()
            assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),(width,key)
            assert page.locator('#mainContent').inner_text().strip()
            if width in [1440,390] and key in ['home','stages','journal','budget','files','design','landing']:
                page.screenshot(path=str(OUT/f'{key}-{width}.png'),full_page=True)
    page.set_viewport_size({'width':390,'height':844});nav(page,'home');page.locator('#quickAdd').click()
    page.locator('.quick-add-options [data-open="journal"]').click();page.locator('form[data-form="journal"]').wait_for();page.keyboard.press('Escape');page.locator('#modalRoot').wait_for(state='hidden')
    nav(page,'budget');nav(page,'journal');page.go_back();assert page.locator('.budget-layout').is_visible()
    nav(page,'files');page.locator('.search-input input').fill('');page.locator('.search-form button').click()
    page.locator(f'[data-action="delete"][data-kind="document"][data-id="{did}"]').click();page.locator(f'[data-open="document"][data-id="{did}"]').wait_for(state='detached')
    nav(page,'journal');page.locator('[data-filter="journalStage"]').select_option('all');page.locator(f'[data-action="delete"][data-kind="journal"][data-id="{jid}"]').click();page.locator(f'[data-open="journal"][data-id="{jid}"]').wait_for(state='detached')
    nav(page,'projects');page.locator(f'[data-action="delete-project"][data-id="{second_id}"]').click();page.locator(f'[data-action="switch-project"][data-id="{second_id}"]').wait_for(state='detached')
    assert len(get(page,'workspace')['ids'])==1
    # Imported projects can intentionally share a Blob; deleting one must keep the other's file.
    shared=json.loads(backup_path.read_text());source=next(p for p in shared['workspace']['projects'] if p['id']==first_id);destination=next(p for p in shared['workspace']['projects'] if p['id']==second_id)
    destination['state']['project']['cover']=source['state']['project']['cover'];shared_id=source['state']['project']['cover']['id']
    (OUT/'shared-cover.json').write_text(json.dumps(shared));restore(page,OUT/'shared-cover.json')
    nav(page,'projects');page.locator(f'[data-action="delete-project"][data-id="{first_id}"]').click();page.locator(f'[data-action="switch-project"][data-id="{first_id}"]').wait_for(state='detached')
    assert get(page,'workspace')['activeId']==second_id
    blob_bytes=page.evaluate('''async(key)=>{const db=await new Promise(ok=>{const r=indexedDB.open('house_time_private_v1',1);r.onsuccess=()=>ok(r.result)});const f=await new Promise(ok=>{const r=db.transaction('attachments').objectStore('attachments').get(key);r.onsuccess=()=>ok(r.result)});const bytes=Array.from(new Uint8Array(await f.blob.arrayBuffer()));db.close();return bytes}''',shared_id)
    assert bytes(blob_bytes)==base64.b64decode(next(f['data'] for f in shared['files'] if f['id']==shared_id).split(',')[1])
    print('PASS: deleting a project preserves file bytes shared by another project')
    # Missing source files must abort a new write, but a complete archive can still repair the store.
    restore(page,OUT/'shared-cover.json');before_missing=get(page)
    page.evaluate('''async(key)=>{const db=await new Promise(ok=>{const r=indexedDB.open('house_time_private_v1',1);r.onsuccess=()=>ok(r.result)});await new Promise(ok=>{const tx=db.transaction('attachments','readwrite');tx.objectStore('attachments').delete(key);tx.oncomplete=ok});db.close()}''',shared_id)
    target=form(page,'contact');fill(target,{'name':'첨부 누락 중 저장하면 안 되는 기록'});target.locator('[type="submit"]').click()
    page.locator('#toast').filter(has_text='첨부파일을 읽을 수 없어').wait_for();assert get(page)==before_missing
    page.get_by_role('button',name='닫기',exact=True).click();restore(page,OUT/'shared-cover.json')
    assert get(page)==source['state']
    nav(page,'settings')
    with page.expect_download() as diagnostic:page.locator('[data-action="recovery"]').click()
    diagnostic.value.save_as(OUT/'recovery-missing.json');diagnostic_data=json.loads((OUT/'recovery-missing.json').read_text())
    assert diagnostic_data['app']=='house-time-recovery' and shared_id in diagnostic_data['missingFileIds']
    print('PASS: missing attachments abort writes without metadata loss; complete backup repairs files and preserves a labeled diagnostic snapshot')
    # A stale tab must not overwrite a newer save from another tab.
    nav(page,'home');other=context.new_page();other.set_default_timeout(12000);other.goto(URL+'#home');other.locator('.project-hero').wait_for()
    target=form(page,'contact');fill(target,{'name':'다른 탭에서 새로 저장한 연락처'});save(page,target)
    target=form(other,'contact');fill(target,{'name':'오래된 탭의 입력'});target.locator('[type="submit"]').click()
    other.locator('#toast').filter(has_text='다른 탭').wait_for()
    assert '다른 탭에서 새로 저장한 연락처' in [c['name'] for c in get(page)['contacts']]
    assert '오래된 탭의 입력' not in [c['name'] for c in get(page)['contacts']]
    other.close()
    nav(page,'home')
    # Simulate an old v1 tab updating only meta.state after the v2 migration.
    prior_catalog=get(page,'workspace');prior_state=get(page);late=json.loads(json.dumps(prior_state));late['project']['description']='이전 탭에서 뒤늦게 저장한 소개'
    page.evaluate('''async(value)=>{const db=await new Promise(ok=>{const r=indexedDB.open('house_time_private_v1',1);r.onsuccess=()=>ok(r.result)});await new Promise((ok,bad)=>{const t=db.transaction('meta','readwrite');t.objectStore('meta').put(value,'state');t.oncomplete=ok;t.onerror=()=>bad(t.error)});db.close()}''',late)
    page.reload();page.locator('.project-hero').wait_for()
    recovered_catalog=get(page,'workspace');assert len(recovered_catalog['ids'])==len(prior_catalog['ids'])+1
    assert get(page,'project:'+prior_catalog['activeId'])==prior_state and get(page)==late
    page.goto(URL+'#__proto__');page.locator('.project-hero').wait_for()
    print('PASS: stale tab writes rejected; late v1 tab changes preserved; unknown routes fall back safely')
    assert not errors,errors
    print('PASS: 12 pages at 7 viewport widths, floating add, Escape, browser back, document/journal/project deletion; zero page errors')
    print('Artifacts:',OUT)
    context.close();browser.close()
