/* Generated at build time. No conversion text is sent to the network. */
const VERSION = '__VERSION__';
const BASE = __BASE__;
const PRECACHE = __PRECACHE__;
const CACHE = `chronoshift-${VERSION}`;
const assetPaths = new Set(PRECACHE);
self.addEventListener('install', event => {
  event.waitUntil((async()=>{
    const cache = await caches.open(CACHE);
    try {
      for (const path of PRECACHE) {
        const response = await fetch(new Request(path,{cache:'reload',credentials:'same-origin'}));
        if (!response.ok || response.type === 'opaque') throw new Error('Incomplete offline assets');
        const type=response.headers.get('content-type')||'';
        if ((path.endsWith('.js')&&!/javascript/.test(type)) || (path.endsWith('.css')&&!/text\/css/.test(type)) || (path.endsWith('.html')&&!/text\/html/.test(type))) throw new Error('Unexpected offline asset type');
        await cache.put(path,response);
      }
    } catch (error) { await caches.delete(CACHE); throw error; }
  })());
});
self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    await self.clients.claim();
    // Keep older versions while other tabs might still need their lazy worker.
    // When there is only one tab, retain the previous version for recovery.
    const clients = await self.clients.matchAll({type:'window',includeUncontrolled:true});
    if (clients.length <= 1) {
      const versions = (await caches.keys()).filter(k=>k.startsWith('chronoshift-'));
      const previous = versions.filter(k=>k!==CACHE).at(-1);
      await Promise.all(versions.filter(k=>k!==CACHE && k!==previous).map(k=>caches.delete(k)));
    }
  })());
});
self.addEventListener('message',event=>{
  if (event.data?.type === 'ACTIVATE_UPDATE') event.waitUntil(self.skipWaiting());
  if (event.data?.type === 'CHECK_READY') event.waitUntil((async()=>{
    const cache = await caches.open(CACHE);
    const ready = (await Promise.all(PRECACHE.map(path=>cache.match(path)))).every(Boolean);
    event.ports[0]?.postMessage({ready,version:VERSION});
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
