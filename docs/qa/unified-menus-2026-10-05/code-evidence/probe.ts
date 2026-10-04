import { chromium, firefox, webkit } from '/Users/tien/Developer/ChronoShift/node_modules/@playwright/test/index.mjs';
const records:any[]=[];
for (const engine of [chromium,firefox,webkit]) {
 const browser=await engine.launch(); const ctx=await browser.newContext({locale:'en-AU',timezoneId:'Australia/Sydney',viewport:{width:1280,height:900}}); const page=await ctx.newPage();page.setDefaultTimeout(6000); console.log('engine',engine.name());const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 const start=Date.now();await page.goto('http://127.0.0.1:4204/');
 const target=page.locator('#target-zone');await target.fill('Chatham');await page.locator('[role=option][data-value="Pacific/Chatham"]').click();
 const arrow=page.getByRole('button',{name:'Show target timezones'});
 const snapshots:any[]=[];console.log('selected',await target.inputValue());
 for (let n=0;n<3;n++) {await arrow.click();await page.waitForTimeout(100);snapshots.push({expanded:await target.getAttribute('aria-expanded'),popovers:await page.locator('.choice-popover').count(),value:await target.inputValue(),options:await page.locator('[role=option]').count()}); await page.keyboard.press('Escape'); await page.waitForTimeout(50);}
 console.log('arrows',JSON.stringify(snapshots));await page.screenshot({path:`/tmp/chronoshift-menu-code/${engine.name()}-arrow.png`});
 await target.fill('+05:45');await target.press('Tab');await page.locator('#message').fill('Tomorrow at 3pm');await page.getByRole('button',{name:'Convert',exact:true}).click();await page.locator('.result').first().waitFor();
 const offset={value:await target.inputValue(),time:await page.locator('.hero-time').allTextContents(),zone:await page.locator('.result-zone').allTextContents()};
 console.log('offset',JSON.stringify(offset));await page.getByText('More options',{exact:true}).click();const year=page.locator('[data-type="year"]'); const month=page.locator('[data-type="month"]');const day=page.locator('[data-type="day"]');
 await day.fill('15');await month.fill('4');await year.fill('2026');await year.press('Tab');await page.getByRole('button',{name:'Convert',exact:true}).click(); await page.locator('.result').first().waitFor(); const dated=await page.locator('.result-date').allTextContents();
 await day.focus();await day.press('Backspace');await day.press('Backspace');await page.getByRole('button',{name:'Convert',exact:true}).click();await page.waitForTimeout(100);const partial={segments:await page.locator('.date-input').innerText(),error:await page.locator('.message.error').allTextContents(),results:await page.locator('.result').count()};
 await page.getByRole('button',{name:'Reset preferences',exact:true}).click();await page.getByRole('button',{name:'Convert',exact:true}).click();await page.locator('.result').first().waitFor();
 const reset={segments:await page.locator('.date-input').innerText(),results:await page.locator('.result').count(),target:await target.inputValue()};
 records.push({engine:engine.name(),version:browser.version(),durationMs:Date.now()-start,arrow:snapshots,offset,dated,partial,reset,errors});await browser.close();
}
await Bun.write('/tmp/chronoshift-menu-code/probe.json',JSON.stringify(records,null,2));console.log(JSON.stringify(records,null,2));
