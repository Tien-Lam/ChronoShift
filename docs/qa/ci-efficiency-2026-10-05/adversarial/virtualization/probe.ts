import { webkit, chromium, firefox, devices, expect } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
const dir = import.meta.dir;
const results: any[] = [];
async function run(which: string, port: number, profile: string, journey: string, repeat: number) {
  const started = new Date().toISOString();
  const type = profile === 'iphone' ? webkit : profile === 'firefox' ? firefox : chromium;
  const browser = await type.launch();
  const context = await browser.newContext({... (profile === 'iphone' ? devices['iPhone 13'] : profile === 'firefox' ? devices['Desktop Firefox'] : devices['Desktop Chrome']), ...(profile === 'iphone' ? {deviceScaleFactor:1} : {viewport:{width:900,height:640}}),locale:'en-AU', timezoneId:'Australia/Sydney', baseURL:`http://127.0.0.1:${port}`});
  const page = await context.newPage();
  page.setDefaultTimeout(5000);
  const logs:any[]=[];const states:any[]=[];
  page.on('pageerror',e=>logs.push({kind:'pageerror',message:e.message}));
  page.on('console',m=>{if(m.type()==='error')logs.push({kind:'console',message:m.text()})});
  await page.addInitScript(()=>{(window as any).__csp=[];document.addEventListener('securitypolicyviolation',(e)=>(window as any).__csp.push({directive:e.effectiveDirective,blocked:e.blockedURI}));});
  await context.tracing.start({screenshots:true,snapshots:true,sources:false});
  async function snap(label:string){states.push({at:new Date().toISOString(),label,state:await page.evaluate(()=>({
    value:(document.querySelector('#target-zone') as HTMLInputElement)?.value,source:(document.querySelector('#source-zone') as HTMLInputElement)?.value,
    input:[...document.querySelectorAll('[role=combobox][id]')].map(e=>({id:e.id,controls:e.getAttribute('aria-controls'),expanded:e.getAttribute('aria-expanded'),active:e.getAttribute('aria-activedescendant')})),
    lists:[...document.querySelectorAll('[role=listbox]')].map(e=>({id:e.id,scroll:(e as HTMLElement).scrollTop,h:(e as HTMLElement).clientHeight,scrollHeight:e.scrollHeight,bounds:e.getBoundingClientRect().toJSON(),options:[...e.querySelectorAll('[role=option]')].map(o=>({id:o.id,value:o.getAttribute('data-value'),focused:o.getAttribute('data-focused'),hovered:o.getAttribute('data-hovered'),pos:o.getAttribute('aria-posinset'),size:o.getAttribute('aria-setsize'),bounds:o.getBoundingClientRect().toJSON()}))})),
    focused:document.activeElement?.id,scrollY,csp:(window as any).__csp,hero:document.querySelector('.hero-time')?.textContent,
  }))});}
  const enter=async(label:string,value:string)=>{const i=page.getByLabel(label,{exact:true});await i.fill(value);await i.press('Tab');await expect(i).toHaveValue(value)};
  let error;
  try{
    await page.goto('/');await page.getByText('More options',{exact:true}).click();await enter('Source timezone when none is given','UTC');await enter('Convert to','UTC');await page.getByLabel('Message with a date or time').fill('April 9, 2026 3pm UTC');
    if(journey==='hover-reopen'){
      for(const label of ['Convert to','Source timezone when none is given']){
        const input=page.getByLabel(label,{exact:true});const other=page.getByLabel(label==='Convert to'?'Source timezone when none is given':'Convert to',{exact:true});const otherValue=await other.inputValue();
        await enter(label,'CST');await input.fill('Asia/Tokyo');await expect(input).toHaveAttribute('aria-controls',/.+/);
        const listId=await input.getAttribute('aria-controls');const suggestions=page.locator(`[id="${listId}"]`);const alias=suggestions.getByRole('option',{name:'Osaka',exact:true});
        await page.mouse.move(0,0);await alias.hover();await expect(alias).toHaveAttribute('data-hovered','true');await snap(label+' hover');
        await input.press('Tab');await expect(input).toHaveValue('Asia/Tokyo');await expect(other).toHaveValue(otherValue);await expect(page.getByRole('listbox')).toHaveCount(0);await expect(page.locator('.hero-time')).toHaveText(/12:00 am/i);
        await input.fill('Asia/Toky');await input.press('ArrowDown');await input.press('End');await expect(alias).toHaveAttribute('data-focused','true');await snap(label+' focused alias');
        await input.press('Tab');await expect(input).toHaveValue('osaka');await expect(page.getByRole('listbox')).toHaveCount(0);await snap(label+' after tab alias');
        await input.fill('Tokyo');await snap(label+' after fill Tokyo');await suggestions.getByRole('option',{name:'Tokyo',exact:true}).click();await expect(input).toHaveValue('Asia/Tokyo');await expect(other).toHaveValue(otherValue);await snap(label+' pointer commit');
      }
    }else{
      const input=page.getByLabel('Convert to',{exact:true});
      await input.fill('');await input.press('Escape');await page.getByRole('button',{name:'Show target timezones',exact:true}).click();await expect(page.getByRole('listbox')).toBeVisible();await snap('full opened');
      await input.press('End');await snap('full End');
      const focused=page.getByRole('option').filter({has:page.locator(':scope[data-focused=true]')});
      await expect.poll(()=>input.getAttribute('aria-activedescendant')).toBeTruthy();
      const activeId=await input.getAttribute('aria-activedescendant');await expect(page.locator(`[id="${activeId}"]`)).toBeVisible();const value=await page.locator(`[id="${activeId}"]`).getAttribute('data-value');await input.press('Enter');await expect(input).toHaveValue(value!);await snap('full End committed');
      await input.fill('');await input.press('Escape');await page.getByRole('button',{name:'Show target timezones',exact:true}).click();await input.press('End');await input.press('Home');const firstId=await input.getAttribute('aria-activedescendant');await expect(page.locator(`[id="${firstId}"]`)).toHaveAttribute('data-value','UTC');await input.press('Enter');await expect(input).toHaveValue('UTC');
      await page.setViewportSize({width:280,height:960});await input.fill('Pacific/Chatham');await expect(page.getByRole('listbox')).toBeVisible();await snap('narrow filter');await page.screenshot({path:`${dir}/${which}-${profile}-${repeat}-narrow.png`});
      await input.press('Escape');await input.fill('Not/A/Real/Zone');await expect(page.getByText('No matches',{exact:true})).toBeVisible();await expect(page.getByRole('option')).toHaveCount(0);await snap('empty');
      await input.press('Escape');await input.fill('+05:45');await input.press('Tab');await expect(input).toHaveValue('+05:45');await expect(page.locator('.hero-time')).toHaveText(/8:45 pm/i);await snap('custom offset');
      await input.fill('Tokyo');const owned=page.locator(`[id="${await input.getAttribute('aria-controls')}"]`);await expect(owned.getByRole('option',{name:'Tokyo',exact:true})).toBeVisible();await owned.getByRole('option',{name:'Tokyo',exact:true}).click();await expect(input).toHaveValue('Asia/Tokyo');await snap('single pointer');
    }
  }catch(e){error=String(e);await snap('failure').catch(()=>{});await page.screenshot({path:`${dir}/${which}-${profile}-${journey}-${repeat}-failure.png`}).catch(()=>{});}
  const ended=new Date().toISOString();await context.tracing.stop({path:`${dir}/${which}-${profile}-${journey}-${repeat}.zip`});await browser.close();
  const result={which,port,profile,journey,repeat,started,ended,browserVersion:browser.version(),passed:!error,error,logs,states};results.push(result);writeFileSync(`${dir}/results.json`,JSON.stringify(results,null,2));console.log(JSON.stringify({which,profile,journey,repeat,passed:!error,error,started,ended}));
}
for(const which of ['before','prototype'])for(let repeat=0;repeat<2;repeat++)await run(which,which==='before'?4276:4278,'iphone','hover-reopen',repeat);
for(const which of ['before','prototype'])for(const profile of ['chromium','iphone','firefox'])await run(which,which==='before'?4276:4278,profile,'collection',0);
