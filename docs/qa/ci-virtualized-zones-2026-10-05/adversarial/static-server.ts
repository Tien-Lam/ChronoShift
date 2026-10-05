import { resolve, extname } from "node:path";
import { PREVIEW_CSP } from "../../../../scripts/csp";
const root = resolve(process.argv[2]);
const mime: Record<string,string> = { ".html":"text/html; charset=utf-8", ".js":"text/javascript; charset=utf-8", ".css":"text/css; charset=utf-8", ".json":"application/json", ".webmanifest":"application/manifest+json", ".svg":"image/svg+xml", ".png":"image/png" };
const server=Bun.serve({hostname:"127.0.0.1", port:Number(process.argv[3]), async fetch(request){
  const path=resolve(root, new URL(request.url).pathname.slice(1)||"index.html");
  if(!path.startsWith(root+"/"))return new Response("Not found",{status:404});
  const file=Bun.file(path);
  if(!await file.exists())return new Response("Not found",{status:404});
  return new Response(file,{headers:{"Content-Type":mime[extname(path)]||"application/octet-stream", "Content-Security-Policy":PREVIEW_CSP,"Cache-Control":"no-cache","X-Content-Type-Options":"nosniff"}});
}});
console.log(JSON.stringify({utc:new Date().toISOString(), root, url:server.url.toString(),csp:PREVIEW_CSP}));
