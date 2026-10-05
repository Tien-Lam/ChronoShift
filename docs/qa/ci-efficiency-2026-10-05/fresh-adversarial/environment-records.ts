const startedAt=new Date().toISOString(),commands:any[]=[];
async function get(path:string){const began=new Date().toISOString(),p=Bun.spawn(['gh','api',path],{stdout:'pipe',stderr:'pipe'});const [text,error,code]=await Promise.all([new Response(p.stdout).text(),new Response(p.stderr).text(),p.exited]);commands.push({args:['gh','api',path],began,ended:new Date().toISOString(),error,code});if(code)throw Error(error);return JSON.parse(text);}
const root='repos/Tien-Lam/ChronoShift',deployments=await get(root+'/deployments?sha=28059a91ec9984dea4d079b3f684b3a27af669f0&environment=github-pages&per_page=10');
const statuses=await Promise.all(deployments.map(async(d:any)=>({deployment:d,statuses:await get(root+'/deployments/'+d.id+'/statuses')})));
await Bun.write(new URL('./environment-records.json',import.meta.url),JSON.stringify({startedAt,endedAt:new Date().toISOString(),commands,statuses},null,2));
console.log(JSON.stringify(statuses.map(s=>({id:s.deployment.id,ref:s.deployment.ref,created:s.deployment.created_at,statuses:s.statuses.map((x:any)=>({state:x.state,url:x.environment_url,logUrl:x.log_url,created:x.created_at}))})),null,2));
