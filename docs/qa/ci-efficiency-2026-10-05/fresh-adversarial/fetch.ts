import {join} from 'node:path';
const directory=import.meta.dir;
const commands:object[]=[];
async function fetch(name:string,args:string[]) {
 const startedAt=new Date().toISOString();
 const proc=Bun.spawn(['gh',...args],{stdout:'pipe',stderr:'pipe'});
 const [stdout,stderr,code]=await Promise.all([new Response(proc.stdout).text(),new Response(proc.stderr).text(),proc.exited]);
 const endedAt=new Date().toISOString();
 await Bun.write(join(directory,name),stdout);
 commands.push({name,command:['gh',...args],startedAt,endedAt,code,stderr});
}
await Promise.all([37274709527,37131752983,37131749773].flatMap(id=>[
 fetch(`${id}-run.json`,['api',`repos/Tien-Lam/ChronoShift/actions/runs/${id}`]),
 fetch(`${id}-jobs.json`,['api',`repos/Tien-Lam/ChronoShift/actions/runs/${id}/jobs?per_page=100`]),
 fetch(`${id}-artifacts.json`,['api',`repos/Tien-Lam/ChronoShift/actions/runs/${id}/artifacts?per_page=100`]),
 fetch(`${id}.log`,['run','view',String(id),'--repo','Tien-Lam/ChronoShift','--log']),
]));
await fetch('pages-environment.json',['api','repos/Tien-Lam/ChronoShift/environments/github-pages']);
await fetch('pages-environment-branches.json',['api','repos/Tien-Lam/ChronoShift/environments/github-pages/deployment-branch-policies']);
await Bun.write(join(directory,'fetch-commands.json'),JSON.stringify(commands,null,2));
console.log(commands.map(c=>({name:(c as any).name,code:(c as any).code})));
