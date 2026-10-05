import {chromium} from 'playwright';
import {writeFile} from 'node:fs/promises';
const out='docs/qa/live-motion-2026-10-05/adversarial';
const browser=await chromium.launch();
const records:any[]=[];
for(const reduced of [false,true]) {
 const c=await browser.newContext({viewport:{width:280,height:900},locale:'en-AU',timezoneId:'Australia/Sydney',reducedMotion:reduced?'reduce':'no-preference',serviceWorkers:reduced?'allow':'block'});
 const p=await c.newPage();
 p.setDefaultTimeout(5000);
 if(!reduced)await p.route('**/assets/worker-*.js',async route=>{await new Promise(r=>setTimeout(r,500));await route.continue();});
 const errors:any[]=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto('http://127.0.0.1:4254');await p.waitForTimeout(500);
 async function snap(label:string){
  const data=await p.evaluate(()=>({at:performance.now(),state:document.querySelector('.live-indicator')?.getAttribute('data-state'),text:document.querySelector('.live-indicator')?.textContent,copies:document.querySelectorAll('.copy-button').length,times:[...document.querySelectorAll('.hero-time')].map(e=>e.textContent),width:document.documentElement.scrollWidth,viewport:innerWidth,
   elements:[...document.querySelectorAll('body *')].filter(e=>{const r=e.getBoundingClientRect();return r.width&&r.height&&getComputedStyle(e).visibility!=='hidden'}).map(e=>({className:e.className,box:e.getBoundingClientRect().toJSON(),animation:getComputedStyle(e).animationName,transition:getComputedStyle(e).transitionDuration,translate:getComputedStyle(e).translate,before:getComputedStyle(e,'::before').animationName,after:getComputedStyle(e,'::after').animationName})),
   animations:document.getAnimations().map(a=>({target:((a.effect as KeyframeEffect).target as Element).className,name:(a as CSSAnimation).animationName,property:(a as CSSTransition).transitionProperty,state:a.playState,duration:a.effect?.getComputedTiming().duration}))}));
  records.push({label,reduced,injection:reduced?'none':'500ms worker response route delay; service workers blocked to force interception',...data,errors});await p.screenshot({path:`${out}/${label}.png`,fullPage:true});
 }
 await p.locator('textarea').fill('July 15 2026 at 3:05:07.123pm UTC');
 await p.waitForTimeout(70);await snap(reduced?'reduced-fresh-pending':'280-pending-debounce');
 await p.waitForTimeout(270);await snap(reduced?'reduced-fresh-ready':'280-pending-processing');
 await p.waitForTimeout(800);await snap(reduced?'reduced-fresh-idle':'280-processing-complete');
 await p.getByRole('button',{name:'Show target timezones',exact:true}).click();await snap(reduced?'reduced-fresh-popup':'280-popup-enter');
 await p.keyboard.press('Escape');
 await p.locator('summary').filter({hasText:'More options'}).click();await p.getByRole('button',{name:/Choose reference date/}).click();await snap(reduced?'reduced-fresh-calendar':'280-calendar-enter');
 await c.close();
}
await writeFile(`${out}/extra-observations.json`,JSON.stringify({browser:browser.version(),finished:new Date().toISOString(),records},null,2));
console.log(records.map(r=>({label:r.label,state:r.state,copies:r.copies,width:r.width,animations:r.animations})));await browser.close();
