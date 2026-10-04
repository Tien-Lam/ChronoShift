/* Generated at build time. No conversion text is sent to the network. */
const VERSION = '__VERSION__';
const BASE = __BASE__;
const PRECACHE = __PRECACHE__;
const INTEGRITY = __INTEGRITY__;
// Build-owned navigation HTML. Content filters may rewrite network HTML, and
// mutable Pages documents may already belong to a newer deployment.
const SHELL = __SHELL__;
const CACHE = `chronoshift-${VERSION}`;
const assetPaths = new Set(PRECACHE);
async function intact(path, response) {
  if (!response) return false;
  const digest = await crypto.subtle.digest('SHA-256', await response.clone().arrayBuffer());
  const hex = Array.from(new Uint8Array(digest), byte=>byte.toString(16).padStart(2,'0')).join('');
  return hex === INTEGRITY[path];
}
function failure(code, path) {
  // Only bundled paths and this build's version enter installation errors.
  // Preserve these even before a controller exists to answer CHECK_READY.
  const error = new Error(`Offline preparation failed: ${code}, ${path} (expected ${VERSION})`);
  error.code = code;
  return error;
}
async function fill(cache, existing, stats) {
  for (const path of PRECACHE) {
    const retained = await existing.match(path);
    if (await intact(path, retained)) {
      await cache.put(path, retained);
      stats.reused++;
      continue;
    }
    let response;
    if (path === `${BASE}index.html`) {
      response = new Response(SHELL, {headers:{'content-type':'text/html; charset=utf-8'}});
      if (!await intact(path,response)) throw failure('release-mismatch',path);
      await cache.put(path,response);
      stats.reused++;
      continue;
    }
    try { response = await fetch(new Request(path,{cache:'reload',credentials:'same-origin'})); }
    catch { throw failure('fetch-failed',path); }
    if (!response.ok || response.type === 'opaque' || !await intact(path, response)) {
      // A CDN/browser may serve a stale mutable file during a Pages rollout.
      // Fetch a fresh cache key, but still require this release's exact bytes.
      const fresh = new URL(path, self.location.origin);
      fresh.searchParams.set('chronoshift-release', VERSION);
      try { response = await fetch(new Request(fresh,{cache:'no-store',credentials:'same-origin'})); }
      catch { throw failure('fetch-failed',path); }
    }
    if (!response.ok || response.type === 'opaque') throw failure('http-error',path);
    const type=response.headers.get('content-type')||'';
    if ((path.endsWith('.js')&&!/javascript/.test(type)) || (path.endsWith('.css')&&!/text\/css/.test(type)) || (path.endsWith('.html')&&!/text\/html/.test(type))) throw failure('unexpected-type',path);
    if (!await intact(path, response)) throw failure('release-mismatch',path);
    await cache.put(path,response);
    stats.fetched++;
  }
}
let repairing;
function repair() {
  if (repairing) return repairing;
  repairing=(async()=>{
    const stage=`chronoshift-staging-${VERSION}`;
    const stats={reused:0,fetched:0};
    try {
      const active=await caches.open(CACHE);
      const temporary=await caches.open(stage);await fill(temporary,active,stats);
      for (const path of PRECACHE) await active.put(path,await temporary.match(path));
      return stats;
    } catch(error) {
      error.repair={...stats,failure:error.code||'storage-error'};
      throw error;
    } finally {await caches.delete(stage);}
  })().finally(()=>{repairing=undefined;});
  return repairing;
}
self.addEventListener('install', event => {
  event.waitUntil((async()=>{
    const cache = await caches.open(CACHE);
    // A rollback may revisit a cache still serving an old tab. Never delete or
    // overwrite that version if staging is interrupted.
    if ((await Promise.all(PRECACHE.map(async path=>intact(path,await cache.match(path))))).every(Boolean)) return;
    await repair();
  })());
});
self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    await self.clients.claim();
    // Keep older versions while other tabs might still need their lazy worker.
    // When there is only one tab, retain the previous version for recovery.
    const clients = await self.clients.matchAll({type:'window',includeUncontrolled:true});
    if (clients.length <= 1) {
      const versions = (await caches.keys()).filter(k=>k.startsWith('chronoshift-')&&!k.startsWith('chronoshift-staging-'));
      const previous = versions.filter(k=>k!==CACHE).at(-1);
      await Promise.all(versions.filter(k=>k!==CACHE && k!==previous).map(k=>caches.delete(k)));
    }
  })());
});
self.addEventListener('message',event=>{
  if (event.data?.type === 'ACTIVATE_UPDATE') event.waitUntil(self.skipWaiting());
  if (event.data?.type === 'CHECK_READY') event.waitUntil((async()=>{
    const diagnostics={unavailable:[],repair:undefined};
    let claim='not-requested';
    let ready=false;
    try {
      const cache = await caches.open(CACHE);
      const unavailable=async()=>{
        const checked=await Promise.all(PRECACHE.map(async path=>await intact(path,await cache.match(path))?null:path));
        return checked.filter(Boolean);
      };
      diagnostics.unavailable=await unavailable();
      ready=diagnostics.unavailable.length===0;
      if(diagnostics.unavailable.length&&event.data.repairIfMissing){
        try{diagnostics.repair=await repair();}
        catch(error){diagnostics.repair=error.repair||{failure:'storage-error'};}
        ready=(await unavailable()).length===0;
      }
    } catch { diagnostics.repair={failure:'storage-error'}; }
    if(ready && event.data.claimUncontrolled===true && event.source?.type==='window') {
      const clientURL=new URL(event.source.url);
      if(clientURL.origin===self.location.origin && clientURL.pathname.startsWith(BASE)) {
        try {await self.clients.claim();claim='claimed';} catch {claim='failed';}
      }
    }
    event.ports[0]?.postMessage({ready,version:VERSION,claim,...(event.data.detailedLogs===true?{diagnostics}:{})});
  })());
});
async function handoff(request) {
  if (request.headers.get('content-length') && +request.headers.get('content-length') > 65536) return new Response('Share a shorter message.',{status:413});
  const bytes = await request.arrayBuffer();
  if (bytes.byteLength > 65536) return new Response('Share a shorter message.',{status:413});
  let form;
  try { form = await new Response(bytes,{headers:{'content-type':request.headers.get('content-type') || ''}}).formData(); }
  catch { return new Response('Could not receive text. Open ChronoShift and paste it.',{status:400}); }
  const text = ['title','text','url'].map(k=>form.get(k)).filter(v=>typeof v==='string').join('\n');
  if (!text.trim() || text.length>10000) return new Response('Open ChronoShift and paste a message under 10,000 characters.',{status:400});
  try {
    const key = crypto.randomUUID();
    await new Promise((resolve,reject)=>{
      const open = indexedDB.open('chronoshift-handoff',1);
      open.onupgradeneeded = ()=>open.result.createObjectStore('messages');
      open.onerror = ()=>reject(open.error);
      open.onsuccess = ()=>{
        const db = open.result, tx = db.transaction('messages','readwrite'), store=tx.objectStore('messages');
        store.clear(); store.put({text,created:Date.now()},key);
        tx.oncomplete = ()=>{db.close();resolve();};
        tx.onerror = ()=>{db.close();reject(tx.error);};
      };
    });
    return Response.redirect(`${self.location.origin}${BASE}?share=${key}`,303);
  } catch { return new Response('This browser cannot receive shared text. Open ChronoShift and paste it.',{status:503}); }
}
self.addEventListener('fetch',event=>{
  const url = new URL(event.request.url);
  if (url.origin!==self.location.origin) return;
  if (event.request.method==='POST' && url.pathname===`${BASE}share`) {
    event.respondWith(handoff(event.request)); return;
  }
  if (event.request.method!=='GET' || !url.pathname.startsWith(BASE)) return;
  if (event.request.mode==='navigate' && (url.pathname===BASE || url.pathname===`${BASE}index.html`)) {
    event.respondWith((async()=>{
      const cached=await (await caches.open(CACHE)).match(`${BASE}index.html`);
      return cached || fetch(event.request);
    })()); return;
  }
  if (assetPaths.has(url.pathname) || url.pathname.startsWith(`${BASE}assets/`)) {
    event.respondWith((async()=>{
      const own = await (await caches.open(CACHE)).match(url.pathname);
      // Old tabs may request a worker from their own immutable build.
      const cached=own || await caches.match(url.pathname);
      return cached || fetch(event.request);
    })());
  }
});
