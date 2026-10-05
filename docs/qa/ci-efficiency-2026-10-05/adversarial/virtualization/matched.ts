import {writeFileSync} from 'node:fs';
const records=[];
for(const [which,port] of [['before','4276'],['prototype','4278']]){
 const start=new Date().toISOString();const cmd=['bunx','--bun','playwright','test','--config=docs/qa/ci-efficiency-2026-10-05/adversarial/virtualization/matched.config.ts','--grep','hovering timezone suggestions'];
 const p=Bun.spawn(cmd,{env:{...process.env,CI:'1',CHRONOSHIFT_CI_TIMING:'0',PLAYWRIGHT_PORT:port,REVIEW_VARIANT:which},stdout:'pipe',stderr:'pipe'});const [out,err,code]=await Promise.all([new Response(p.stdout).text(),new Response(p.stderr).text(),p.exited]);writeFileSync(`${import.meta.dir}/matched-${which}.log`,out+err);const r={which,port,start,end:new Date().toISOString(),cmd,code};records.push(r);writeFileSync(`${import.meta.dir}/matched-results.json`,JSON.stringify(records,null,2));console.log(JSON.stringify(r));
}
