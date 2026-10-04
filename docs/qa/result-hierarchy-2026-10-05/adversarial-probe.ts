import { chromium, firefox, webkit } from '/Users/tien/Developer/ChronoShift/node_modules/@playwright/test/index.mjs';
const out='/tmp/chronoshift-result-adversarial-captures';
const cases=[
 ['single','April 9, 2026 at 3pm EST'],
 ['range','April 9, 2026 11pm-1am UTC'],
 ['ambiguity','April 9, 2026 at 3pm CST'],
 ['dateonly','April 9, 2026'],
 ['fractional','2026-04-09T15:00:30.123456789+02:00'],
 ['longcontext','This is the all-hands planning note. April 9, 2026 11:00pm America/Los_Angeles - April 10, 2026 1:00am America/Los_Angeles. '+ 'We need enough context to retain the original and inspect long input. '.repeat(10)],
];
const results=[];
for(const [engine,api] of Object.entries({chromium,firefox,webkit})) {
 const browser=await api.launch();
 for(const [width,theme] of [[1440,'light'],[1440,'dark'],[320,'light'],[320,'dark']]){
  const context=await browser.newContext({viewport:{width,height:width===320?740:900},colorScheme:theme,timezoneId:'Australia/Sydney',locale:'en-AU'});
  const page=await context.newPage(); const errors=[]; page.on('pageerror', e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
  await page.goto('http://127.0.0.1:4254/');await page.locator('main[data-offline-ready=true]').waitFor();
  await page.getByLabel('Appearance',{exact:true}).click();await page.getByRole('button',{name:/Theme$/}).click();await page.locator(`[role=option][data-value="${theme}"]`).click();await page.getByLabel('Appearance',{exact:true}).click();
  for(const [name,input] of cases){
   await page.getByLabel('Message with a date or time').fill(input); await page.getByRole('button',{name:'Convert',exact:true}).click();await page.waitForFunction(()=>document.querySelectorAll('.result').length>0 && document.querySelector('.result-panel')?.getAttribute('aria-busy')==='false');
   await page.locator('.result-panel').scrollIntoViewIfNeeded();
   const measured=await page.evaluate(()=>{
    const describe=(el)=>{const r=el.getBoundingClientRect(),s=getComputedStyle(el);return {text:el.textContent,tag:el.tagName,rect:{x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom},fontSize:s.fontSize,fontWeight:s.fontWeight,lineHeight:s.lineHeight,color:s.color,scrollWidth:el.scrollWidth,clientWidth:el.clientWidth}};
    return {viewport:{width:innerWidth,height:innerHeight},documentWidth:document.documentElement.scrollWidth,theme:document.documentElement.dataset.theme,groups:[...document.querySelectorAll('.result-group')].map(g=>({order:[...g.children].map(e=>e.className),original:describe(g.querySelector('.result-source')),results:[...g.querySelectorAll('.result')].map(r=>({time:r.querySelector('.hero-time')?describe(r.querySelector('.hero-time')):null,date:describe(r.querySelector('.result-date')),zone:describe(r.querySelector('.result-zone')),context:describe(r.querySelector('.result-context')),copy:describe(r.querySelector('.copy-button')),copyLabel:r.querySelector('.copy-button').getAttribute('aria-label'),order:[...r.children].map(e=>e.className)}))}))};
   });
   const path=`${out}/${engine}-${width}-${theme}-${name}.png`;
   await page.locator('.result-panel').screenshot({path});
   results.push({engine,browserVersion:browser.version(),width,theme,name,input,measured,capture:path,errors:[...errors]});
   console.log(engine,width,theme,name, measured.groups.flatMap(g=>g.results.map(r=>r.time?.text||r.date.text)).join(' | '));
  }
  await context.close();
 }
 await browser.close();
}
await Bun.write(`${out}/measurements.json`,JSON.stringify({head:'ba32383c5609f72a6fa551bbddd6b53df74bd80e',captured:new Date().toISOString(),results},null,2));
