"""Dashboard presentation regression. Synthetic fixtures in isolated browser contexts only.
Run with the same static server and Playwright setup as platform-smoke.py.
"""
import ast
import copy
import os
from pathlib import Path
import shutil
import tempfile
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
URL = os.environ.get('CHAEPIUM_TEST_URL', 'http://127.0.0.1:8002/my-cozy-home/')
# Reuse the existing synthetic legacy fixture without executing the smoke suite.
source = ast.parse((ROOT/'tests/platform-smoke.py').read_text())
fixture_fn = next(n for n in source.body if isinstance(n, ast.FunctionDef) and n.name == 'legacy_fixture')
import base64
exec(compile(ast.Module(body=[fixture_fn], type_ignores=[]), '<fixture>', 'exec'))
BASE = legacy_fixture()['state']
BASE.update(stages=[dict(id='prep', name='준비'), dict(id='build', name='착공·시공'), dict(id='hidden', name='숨긴 단계', hidden=True)], tasks=[], journals=[], expenses=[], documents=[], designs=[])
BASE['project'] = dict(title='실제로 저장한 프로젝트 이름', description='', start='', target='')
OUT = Path(tempfile.mkdtemp(prefix='chaepium-summary-'))
SEED = '''async(state)=>{const db=await new Promise(ok=>{const r=indexedDB.open('house_time_private_v1',1);r.onsuccess=()=>ok(r.result)});await new Promise(ok=>{const tx=db.transaction(['meta','attachments'],'readwrite');tx.objectStore('meta').clear();tx.objectStore('attachments').clear();tx.objectStore('meta').put(state,'state');tx.oncomplete=ok});db.close()}'''
READ = '''async()=>{const db=await new Promise(ok=>{const r=indexedDB.open('house_time_private_v1',1);r.onsuccess=()=>ok(r.result)});return await new Promise(ok=>{const r=db.transaction('meta').objectStore('meta').get('state');r.onsuccess=()=>ok(r.result)})}'''
with sync_playwright() as p:
    browser = p.chromium.launch(executable_path=shutil.which('chromium'), args=['--no-sandbox','--disable-dev-shm-usage'])
    for case in ['empty','zero','middle','complete','partial','start','target','both','long']:
        state = copy.deepcopy(BASE)
        expected = 0
        if case in ['zero','middle','complete','partial','long']:
            state['tasks']=[dict(id='a', stage='prep', title='기록한 작업', status='done' if case != 'zero' else 'todo'), dict(id='b', stage='build', title='시공 작업', status='done' if case=='complete' else 'doing' if case in ['middle','long'] else 'todo')]
            expected = 100 if case=='complete' else 0 if case=='zero' else 50
        if case in ['start','both']: state['project']['start']='2026-11-03'
        if case in ['target','both']: state['project']['target']='2027-06-30'
        if case=='long':
            state['project'].update(title='긴프로젝트이름'*30, description='원래 저장된 소개\n'+('긴설명'*50), location='긴주소'*100)
            state['stages'][0]['name']='사용자가 정한 긴 단계 이름'*10
        ctx=browser.new_context(viewport={'width':1440,'height':1000})
        # No cloud credentials: exercise local UI without contacting Firebase services.
        ctx.route('**/assets/family-sync.js*', lambda route: route.abort())
        page=ctx.new_page(); errors=[];page.on('pageerror', lambda e:errors.append(str(e)))
        page.goto(URL);page.locator('.family-onboarding').wait_for()
        page.evaluate(SEED,state);page.reload();page.locator('.project-summary').wait_for()
        assert page.locator('.project-summary h2').inner_text()==state['project']['title']
        assert page.locator('.summary-description').inner_text()==(state['project']['description'] or '가족이 함께 기록하는 집짓기 과정')
        assert page.locator('.summary-progress').get_attribute('aria-valuenow')==str(expected)
        assert page.locator('.progress-ring').count()==0
        assert page.locator('.summary-stage').count()==2
        assert '숨긴 단계' not in page.locator('.summary-stages').inner_text()
        assert page.locator('.project-photo img').count()==0
        assert page.locator('.summary-status').inner_text()=={'empty':'진행 상황을 기록해 보세요','zero':'집짓기 준비 중','middle':'착공·시공 단계 진행 중','complete':'집짓기 완료','partial':'공사 준비 중','long':'착공·시공 단계 진행 중'}.get(case,'진행 상황을 기록해 보세요')
        schedule=page.locator('.summary-schedule').inner_text()
        if case in ['start','both']:assert '2026.11.03' in schedule
        if case in ['target','both']:assert '2027.06.30' in schedule
        if case not in ['start','target','both']:assert '일정 미설정' in schedule
        for width in [1440,780,390,320]:
            page.set_viewport_size({'width':width,'height':1000})
            assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),(case,width)
            assert page.locator('.project-summary').evaluate('(el)=>el.scrollWidth<=el.clientWidth'),(case,width,'card')
            assert page.locator('.summary-progress').evaluate('(el)=>el.getBoundingClientRect().height')==7
            if case in ['empty','middle','long'] and width in [1440,320]:page.screenshot(path=str(OUT/f'{case}-{width}.png'),full_page=True)
        assert page.evaluate(READ)==state, 'Rendering must not rewrite stored data'
        page.locator('.summary-photo-empty').click();page.locator('form[data-form="project"]').wait_for()
        page.keyboard.press('Escape')
        if case=='empty':
            for nav,kind,label in [('journal','journal','사진 등록하기'),('budget','expense','비용 등록하기'),('files','document','서류 등록하기'),('design','design','자재 추가하기'),('stages','task','일정 등록하기')]:
                page.goto(URL+'#'+nav);page.locator('.empty button',has_text=label).click();page.locator(f'form[data-form="{kind}"]').wait_for();page.keyboard.press('Escape')
        assert not errors,errors
        ctx.close();print('PASS:',case)
    browser.close()
print('Screenshots:',OUT)
