import { webkit, firefox, devices, expect } from '@playwright/test';
const dir = 'docs/qa/ci-efficiency-2026-10-05/code';
const out:any = {head:'8a4ebec0881f8363ffd19f833bbf29a44e77885a', began:new Date().toISOString(), cases:[]};
for (const profile of ['firefox']) {
  const browser=await (profile==='iphone'?webkit:firefox).launch();
  let logical:number|undefined, last:string|undefined;
  for(const candidate of [false,true]) {
    const context=await browser.newContext({...devices[profile==='iphone'?'iPhone 13':'Desktop Firefox'],locale:'en-AU',timezoneId:'Australia/Sydney'});
    const page=await context.newPage();page.setDefaultTimeout(3000);
    const r:any={profile,candidate,began:new Date().toISOString(),browser:browser.version(),fields:[]};
    await page.addInitScript(()=>{(window as any).csp=[];document.addEventListener('securitypolicyviolation',e=>(window as any).csp.push(e.effectiveDirective));});
    try {
      await page.goto(`http://127.0.0.1:${candidate?4278:4276}`);
      r.served=await page.evaluate(async()=>({url:location.href,scripts:[...document.scripts].map(s=>s.src).filter(Boolean),release:await fetch('/release.json').then(x=>x.json()),worker:await fetch('/sw.js').then(x=>x.text()).then(x=>({sha:x.match(/(?:BUILD_VERSION|VERSION)\s*=\s*["']([^"']+)/)?.[1]||null,hash:null,textPrefix:x.slice(0,240)}))}));
      await page.getByText('More options',{exact:true}).click();
      const target=page.locator('#target-zone'),source=page.locator('#source-zone');
      for(const input of [source,target]) {await input.scrollIntoViewIfNeeded();await input.click();await input.fill('UTC');await input.press('Tab');}
      await page.locator('#message').fill('April 9, 2026 3pm UTC');
      if(profile==='firefox') {
        await target.scrollIntoViewIfNeeded();await page.getByRole('button',{name:'Show target timezones',exact:true}).click();
        const list=page.locator(`[id="${await target.getAttribute('aria-controls')}"]`);
        await expect(list).toBeVisible();
        const rows=list.locator('[role=option][data-value]');await expect(rows.first()).toBeVisible();
        if(!candidate) {logical=await rows.count();last=await rows.last().getAttribute('data-value')||undefined;}
        r.full={domRows:await rows.count(),expectedLogical:logical,expectedLast:last};
        if(candidate) expect(await rows.first().getAttribute('aria-setsize')).toBe(String(logical));
        await target.press('End');
        await expect.poll(()=>page.evaluate(()=>document.getElementById(document.getElementById('target-zone')!.getAttribute('aria-activedescendant')||'')?.getAttribute('data-value'))).toBe(last!);
        if(candidate) {const active=page.locator(`[id="${await target.getAttribute('aria-activedescendant')}"]`);await expect(active).toHaveAttribute('aria-posinset',String(logical));await expect(active).toBeVisible();}
        await target.press('Enter');await expect(target).toHaveValue(last!);await expect(target).toHaveAttribute('aria-expanded','false');
      }
      for(const input of [target,source]) {
        const other=input===target?source:target, otherValue=await other.inputValue();
        await input.scrollIntoViewIfNeeded();await input.click();await input.fill('Asia/Tokyo');await expect(input).toHaveAttribute('aria-expanded','true');
        const list=page.locator(`[id="${await input.getAttribute('aria-controls')}"]`),alias=list.getByRole('option',{name:'Osaka',exact:true});
        await page.mouse.move(0,0);await alias.hover();await expect(alias).toHaveAttribute('data-hovered','true');await input.press('Tab');await expect(input).toHaveValue('Asia/Tokyo');
        await input.fill('Asia/Toky');await input.press('ArrowDown');await input.press('End');await expect(alias).toHaveAttribute('data-focused','true');await input.press('Tab');await expect(input).toHaveValue('osaka');
        await input.scrollIntoViewIfNeeded();await input.click();await expect(input).toHaveAttribute('aria-expanded','false');await input.fill('Tokyo');await expect(input).toHaveAttribute('aria-expanded','true');
        const fresh=page.locator(`[id="${await input.getAttribute('aria-controls')}"]`);await expect(fresh).toBeVisible();await fresh.getByRole('option',{name:'Tokyo',exact:true}).click();await expect(input).toHaveValue('Asia/Tokyo');await expect(other).toHaveValue(otherValue);
        // Intentional real ancestor scrolling dismisses the popup, preserving text.
        await input.scrollIntoViewIfNeeded();await input.click();await input.fill('Tokyo');await expect(input).toHaveAttribute('aria-expanded','true');
        const hero=await page.locator('.hero-time').textContent(), y=await page.evaluate(()=>scrollY);
        await page.evaluate(()=>window.scrollTo(0,scrollY>10?0:120));
        await expect(input).toHaveAttribute('aria-expanded','false');await expect(input).toHaveValue('Tokyo');expect(await page.locator('.hero-time').textContent()).toBe(hero);
        await input.scrollIntoViewIfNeeded();await input.click();await input.fill('Asia/Toky');await expect(input).toHaveAttribute('aria-expanded','true');
        const recovered=page.locator(`[id="${await input.getAttribute('aria-controls')}"]`);await recovered.getByRole('option',{name:'Tokyo',exact:true}).click();await expect(input).toHaveValue('Asia/Tokyo');await expect(other).toHaveValue(otherValue);
        r.fields.push({id:await input.getAttribute('id'),ancestorScrollY:y,recovered:await input.inputValue(),otherUnchanged:await other.inputValue()});
      }
      r.csp=await page.evaluate(()=>(window as any).csp);expect(r.csp).toEqual([]);r.passed=true;
    } catch(e) {r.passed=false;r.error=String(e);}
    r.ended=new Date().toISOString();out.cases.push(r);console.log(JSON.stringify({profile,candidate,passed:r.passed,error:r.error,fields:r.fields,full:r.full}));await context.close();await Bun.write(`${dir}/final-candidate-firefox-corrected.json`,JSON.stringify(out,null,2));
  }
  await browser.close();
}
out.ended=new Date().toISOString();await Bun.write(`${dir}/final-candidate-firefox-corrected.json`,JSON.stringify(out,null,2));
