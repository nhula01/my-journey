/* Only the app shell and authorized public snapshot are cached. Never local APIs. */
'use strict';
const VERSION='20261012-burn1';
const BASE=new URL('./',self.registration.scope);
const PREFIX=`my-journey:${BASE.pathname}:`;
const SHELL=PREFIX+VERSION+':shell',DATA=PREFIX+'public-data';
const ASSETS=[
  'index.html','style.css?v=0bf7b4a2bd65','weight.css?v=20261012burn1',
  'activity-energy.js?v=20261012phone1','nutrition.js?v=502b16f0a8eb','workout-data.js?v=20261012bodygoal',
  'workouts.js?v=20261012burn1','weight.js?v=20261012burn1',
  'pwa.css?v=20261012burn1','pwa.js?v=20261012burn1','manifest.webmanifest',
  'icons/apple-touch-icon.png','icons/icon-192.png','icons/icon-512.png','icons/icon-maskable-512.png',
  ...['warmup','walk','easy','plank','legpress','cooldown','hamstring','rowmachine','chestpress','shoulders'].map(id=>`workout-muscles/${id}.svg`)
];
const URLS=new Set(ASSETS.map(path=>new URL(path,BASE).href));
const JOURNAL=new URL('journal.json',BASE).href;
self.addEventListener('install',event=>event.waitUntil((async()=>{
  const cache=await caches.open(SHELL);
  await cache.addAll(ASSETS.map(path=>new Request(new URL(path,BASE),{cache:'reload'})));
  // Journal data is optional so offline workouts don't depend on this fetch succeeding.
  try{const response=await fetch(JOURNAL,{cache:'no-store'});if(response.ok)await (await caches.open(DATA)).put(JOURNAL,response);}catch{}
})()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{
  const keys=await caches.keys();await Promise.all(keys.filter(key=>key.startsWith(PREFIX)&&key!==SHELL&&key!==DATA).map(key=>caches.delete(key)));
  await self.clients.claim();
})()));
self.addEventListener('message',event=>{if(event.data?.type==='SKIP_WAITING')self.skipWaiting();});
self.addEventListener('fetch',event=>{
  const request=event.request,url=new URL(request.url);
  if(request.method!=='GET'||url.origin!==BASE.origin)return;
  // Explicit exclusions: private local records and photos must not persist in CacheStorage.
  if(url.pathname.startsWith('/api/')||url.pathname.startsWith('/journal-photos/'))return;
  const isHome=request.mode==='navigate'&&(url.pathname===BASE.pathname||url.pathname===new URL('index.html',BASE).pathname);
  if(isHome){event.respondWith(caches.open(SHELL).then(cache=>cache.match(new URL('index.html',BASE).href)).then(cached=>cached||fetch(request)));return;}
  if(URLS.has(url.href)){
    event.respondWith(caches.open(SHELL).then(cache=>cache.match(request)).then(cached=>cached||fetch(request)));return;
  }
  if(url.href===JOURNAL){event.respondWith((async()=>{
    const cache=await caches.open(DATA);
    try{
      const response=await fetch(request);
      if(!response.ok)throw new Error('Journal unavailable');
      await cache.put(JOURNAL,response.clone());return response;
    }catch{
      const cached=await cache.match(JOURNAL);if(!cached)return new Response('Journal unavailable offline',{status:503});
      const headers=new Headers(cached.headers);headers.set('X-Journey-Offline','true');
      return new Response(await cached.arrayBuffer(),{status:200,headers});
    }
  })());}
});
