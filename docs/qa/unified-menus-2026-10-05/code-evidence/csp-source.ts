import {createHash} from 'node:crypto';
import {WEB_CSP,PREVIEW_CSP} from '/Users/tien/Developer/ChronoShift/scripts/csp.ts';
const root='/Users/tien/Developer/ChronoShift/';
const nodes=['interactions/usePress.mjs','overlays/usePreventScroll.mjs'];
const records=[];
for(const path of nodes){const source=await Bun.file(root+'node_modules/react-aria/dist/private/'+path).text();const template=source.match(/style.textContent = `([\s\S]*?)`\.trim\(\)/)![1];const text=template.replace(/\$\{[^}]+PRESSABLE_ATTRIBUTE\}/g,'data-react-aria-pressable').trim();const hash='sha256-'+createHash('sha256').update(text).digest('base64');records.push({path,text,hash,whitelisted:WEB_CSP.includes(hash)});if(!WEB_CSP.includes(hash))throw new Error('Dependency bytes mismatch');}
console.log(JSON.stringify({records,WEB_CSP,PREVIEW_CSP},null,2));await Bun.write('/tmp/chronoshift-menu-code/csp-source.json',JSON.stringify({records,WEB_CSP,PREVIEW_CSP},null,2));
