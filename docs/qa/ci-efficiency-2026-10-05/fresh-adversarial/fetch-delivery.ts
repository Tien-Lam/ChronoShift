import {join} from 'node:path';
const id=Bun.argv[2];if(!/^\d+$/.test(id||''))throw Error('run id required');
const commands:any[]=[];const dir=import.meta.dir;
async function get(name:string,args:string[]){const began=new Date().toISOString();const p=Bun.spawn(['gh',...args],{stdout:'pipe',stderr:'pipe'});const [bytes,error,code]=await Promise.all([new Response(p.stdout).arrayBuffer(),new Response(p.stderr).text(),p.exited]);await Bun.write(join(dir,id+'-'+name),new Uint8Array(bytes));commands.push({args:['gh',...args],began,ended:new Date().toISOString(),code,error});}
await Promise.all([get('run.json',['api',`repos/Tien-Lam/ChronoShift/actions/runs/${id}`]),get('jobs.json',['api',`repos/Tien-Lam/ChronoShift/actions/runs/${id}/jobs?per_page=100`]),get('artifacts.json',['api',`repos/Tien-Lam/ChronoShift/actions/runs/${id}/artifacts?per_page=100`]),get('run.log',['run','view',id,'--repo','Tien-Lam/ChronoShift','--log'])]);
await Bun.write(join(dir,id+'-commands.json'),JSON.stringify(commands,null,2));console.log(commands.map(c=>({file:id+'-'+c.args.at(-1),code:c.code})));
