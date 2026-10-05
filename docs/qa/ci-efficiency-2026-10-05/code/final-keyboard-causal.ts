import {webkit,devices,expect} from '@playwright/test';
const out:any={began:new Date().toISOString(),head:'8a4ebec0881f8363ffd19f833bbf29a44e77885a',cases:[]};const b=await webkit.launch();
for(const height of [664,1400]) for(const candidate of [false,true]) {
  const c=await b.newContext({...devices['iPhone 13'],viewport:{width:390,height},locale:'en-AU',timezoneId:'Australia/Sydney'});const p=await c.newPage();p.setDefaultTimeout(2500);const r:any={candidate,height,began:new Date().toISOString(),fields:[]};
  await p.addInitScript(()=>{const events:any[]=[];(window as any).events=events;const snap=(type:string)=>{const i=document.getElementById('target-zone') as HTMLInputElement;events.push({time:performance.now(),type,y:scrollY,active:document.activeElement?.id,value:i?.value,open:i?.getAttribute('aria-expanded'),owns:i?.getAttribute('aria-controls')});};for(const type of ['scroll','focus','blur','input','keydown'])document.addEventListener(type,()=>snap(type),true);new MutationObserver(ms=>{if(ms.some(m=>(m.target as Element).id==='target-zone'))snap('attributes')}).observe(document,{subtree:true,attributes:true,attributeFilter:['aria-expanded','aria-controls']});});
  try {
    await p.goto(`http://127.0.0.1:${candidate?4278:4276}`);r.url=p.url();r.scripts=await p.locator('script[src]').evaluateAll(xs=>xs.map(x=>x.getAttribute('src')));await p.getByText('More options',{exact:true}).click();
    for(const id of ['target-zone']) {
      const input=p.locator('#'+id);await input.scrollIntoViewIfNeeded();await input.click();await input.fill('Asia/Toky');await input.press('ArrowDown');await input.press('End');
      const list=p.locator(`[id="${await input.getAttribute('aria-controls')}"]`);await expect(list.getByRole('option',{name:'Osaka',exact:true})).toHaveAttribute('data-focused','true');await input.press('Tab');await expect(input).toHaveValue('osaka');
      const afterTab=await p.evaluate(()=>({id:document.activeElement?.id,y:scrollY}));await p.keyboard.press('Shift+Tab');await expect(input).toBeFocused();await p.keyboard.press('Meta+A');await p.keyboard.type('Tokyo');await expect(input).toHaveValue('Tokyo');await expect(input).toHaveAttribute('aria-expanded','true');
      const fresh=p.locator(`[id="${await input.getAttribute('aria-controls')}"]`);await expect(fresh.getByRole('option',{name:'Tokyo',exact:true})).toBeVisible();await input.press('ArrowDown');await input.press('Home');await input.press('Enter');await expect(input).toHaveValue('Asia/Tokyo');r.fields.push({id,afterTab,keyboardReturned:true,value:await input.inputValue()});
    }r.passed=true;
  }catch(e){r.passed=false;r.error=String(e);}r.events=await p.evaluate(()=>(window as any).events);r.ended=new Date().toISOString();out.cases.push(r);console.log(JSON.stringify({candidate,height,passed:r.passed,error:r.error,fields:r.fields}));await c.close();
}
await b.close();out.ended=new Date().toISOString();await Bun.write('docs/qa/ci-efficiency-2026-10-05/code/final-keyboard-causal.json',JSON.stringify(out,null,2));
