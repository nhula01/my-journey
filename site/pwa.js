/* iOS uses Safari's Share menu; there is no programmatic iPhone install prompt. */
(() => {
  'use strict';
  const button=document.getElementById('install-app'),dialog=document.getElementById('install-dialog');
  const standalone=window.matchMedia('(display-mode: standalone)');
  let installPrompt=null,registration=null,reloading=false;
  const isInstalled=()=>standalone.matches || navigator.standalone===true;
  const syncInstall=()=>{button.hidden=isInstalled();};
  syncInstall();standalone.addEventListener('change',syncInstall);
  button.addEventListener('click',()=>dialog.showModal());
  document.getElementById('close-install').addEventListener('click',()=>dialog.close());
  window.addEventListener('beforeinstallprompt',event=>{
    event.preventDefault();installPrompt=event;
    document.getElementById('native-install').hidden=false;
    document.getElementById('install-steps').hidden=true;
  });
  document.getElementById('native-install').addEventListener('click',async()=>{
    if(!installPrompt)return;
    await installPrompt.prompt();const result=await installPrompt.userChoice;installPrompt=null;
    document.getElementById('native-install').hidden=true;document.getElementById('install-steps').hidden=false;
    if(result.outcome==='accepted')dialog.close();
  });
  window.addEventListener('appinstalled',()=>{button.hidden=true;dialog.close();});
  const connection=document.getElementById('app-connection');
  function connectionStatus(){
    connection.hidden=navigator.onLine;
    connection.textContent='Offline · Your saved workout plan and checklist are available. Videos need internet; journal data may be an older snapshot.';
  }
  window.addEventListener('online',connectionStatus);window.addEventListener('offline',connectionStatus);connectionStatus();
  const links=[...document.querySelectorAll('.app-navigation a')];
  function activeSection(id){links.forEach(link=>{if(link.hash===`#${id}`)link.setAttribute('aria-current','location');else link.removeAttribute('aria-current');});}
  links.forEach(link=>link.addEventListener('click',()=>activeSection(link.hash.slice(1))));
  if('IntersectionObserver' in window){const observer=new IntersectionObserver(entries=>{
    const visible=entries.filter(entry=>entry.isIntersecting).sort((a,b)=>a.boundingClientRect.top-b.boundingClientRect.top);
    if(visible.length)activeSection(visible[0].target.id);
  },{rootMargin:'0px 0px -55% 0px'});links.forEach(link=>observer.observe(document.querySelector(link.hash)));}
  activeSection(location.hash.slice(1)||'nutrition');
  if('serviceWorker' in navigator){
    navigator.serviceWorker.ready.then(()=>{document.getElementById('offline-setup').textContent='Workout guides saved for offline use on this device.';});
    navigator.serviceWorker.addEventListener('controllerchange',()=>{
      // First installation takes control without interrupting a workout.
      if(reloading)location.reload();
    });
    navigator.serviceWorker.register('./sw.js',{scope:'./',updateViaCache:'none'}).then(reg=>{
      registration=reg;
      const showUpdate=()=>{if(reg.waiting && navigator.serviceWorker.controller)document.getElementById('app-update').hidden=false;};
      showUpdate();reg.addEventListener('updatefound',()=>{
        const worker=reg.installing;
        if(worker)worker.addEventListener('statechange',()=>{if(worker.state==='installed')showUpdate();});
      });
      document.addEventListener('visibilitychange',()=>{if(!document.hidden)reg.update().catch(()=>{});});
    }).catch(()=>{
      connection.hidden=false;connection.textContent='Offline setup isn’t ready yet. Reopen the app online to try again.';
      document.getElementById('offline-setup').textContent='Offline setup isn’t ready. Reopen online to try again.';
    });
    document.getElementById('update-app').addEventListener('click',()=>{
      if(registration?.waiting){reloading=true;registration.waiting.postMessage({type:'SKIP_WAITING'});}
    });
  }else document.getElementById('offline-setup').textContent='This browser cannot save offline guides. Open My Journey in Safari on your iPhone.';
})();
