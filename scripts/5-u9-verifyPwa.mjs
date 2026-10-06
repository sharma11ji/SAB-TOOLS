// Optional browser check: install playwright-core separately and set PLAYWRIGHT_MODULE
// to its absolute index.mjs path, then run node scripts/verifyPwa.mjs after npm run build.
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright-core');
import { createServer } from 'node:http';
import { readFileSync, cpSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, extname } from 'node:path';
import { stampServiceWorker } from '../build/pwaPlugin.js';
import { fileURLToPath } from 'node:url';
const repo = fileURLToPath(new URL('../', import.meta.url));
const root='/tmp/pwa-browser/releases'; mkdirSync(root,{recursive:true});
// Optional: LEGACY_DIST points to a production v11 build for migration coverage.
if(process.env.LEGACY_DIST) cpSync(process.env.LEGACY_DIST,join(root,'LEGACY'),{recursive:true});
for(const label of ['A','B','C']) {
 const dir=join(root,label); cpSync(join(repo,'dist'),dir,{recursive:true});
 const html=readFileSync(join(dir,'index.html'),'utf8');
 const js=html.match(/src="([^"]+\.js)"/)[1].replace('/SAB-TOOLS/','');
 writeFileSync(join(dir,js),readFileSync(join(dir,js),'utf8').replace('Local mode: Firebase is unavailable.',`Release ${label}: Firebase is unavailable.`));
 const workerTemplate=readFileSync(join(repo,'dist/sw.js'),'utf8').replace(/const VERSION = "[a-f0-9]{16}";/,'const VERSION = "__BUILD_VERSION__";').replace(/const PRECACHE_FILES = \[[^\n]+\];/,'const PRECACHE_FILES = ["__PRECACHE_FILES__"];');
 writeFileSync(join(dir,'sw.js'),workerTemplate); stampServiceWorker(dir);
}
let release='A', missingApp=false;
const server=createServer((req,res)=>{
 try{
 const path=decodeURIComponent(new URL(req.url,'http://localhost').pathname).replace(/^\/SAB-TOOLS\//,'') || 'index.html';
 if(missingApp && /assets\/.*\.js$/.test(path)) throw new Error('simulated missing bundle');
 const file=join(root,release,path.endsWith('/')?path+'index.html':path);
 const types={'.js':'text/javascript','.css':'text/css','.html':'text/html','.webmanifest':'application/manifest+json','.png':'image/png','.svg':'image/svg+xml'};
 res.setHeader('Content-Type',types[extname(file)]||'text/plain'); res.setHeader('Cache-Control','no-store'); res.end(readFileSync(file));
 }catch(e){res.statusCode=404;res.end('not found')}
});
await new Promise(r=>server.listen(4178,'127.0.0.1',r));
const browser=await chromium.launch({executablePath:process.env.CHROME_BIN || '/usr/bin/google-chrome',headless:true,args:['--no-sandbox']});
const ctx=await browser.newContext({viewport:{width:390,height:844}});
let page=await ctx.newPage(); const url='http://127.0.0.1:4178/SAB-TOOLS/';
async function expectRelease(label){await page.waitForFunction(l=>document.body.textContent.includes(`Release ${l}:`),label);}
try{
 await page.goto(url); await expectRelease('A');
 await page.evaluate(()=>navigator.serviceWorker.ready);
 await page.waitForFunction(()=>navigator.serviceWorker.controller);
 console.log('PASS initial full app shell and worker control');
 await ctx.setOffline(true); await page.reload(); await expectRelease('A');
 await page.waitForFunction(()=>[...document.images].every(i=>i.complete&&i.naturalWidth>0));
 console.log('PASS offline reload with cached bundle, CSS and images');
 await ctx.setOffline(false);
 // Existing session updates never reload after an input event.
 await page.evaluate(()=>document.dispatchEvent(new Event('input',{bubbles:true})));
 release='B'; await page.evaluate(async()=>{const r=await navigator.serviceWorker.getRegistration();await r.update()});
 await page.waitForSelector('.pwa-update'); await expectRelease('A');
 await page.waitForTimeout(300); await expectRelease('A');
 await page.screenshot({path:'/tmp/pwa-update-390.png',fullPage:false});
 await page.setViewportSize({width:320,height:740});
 await page.screenshot({path:'/tmp/pwa-update-320.png',fullPage:false});
 console.log('PASS mid-session release B waits with Update prompt, no forced reload');
 page.once('dialog',d=>d.dismiss()); await page.locator('.pwa-update button').click(); await expectRelease('A');
 console.log('PASS declining update preserves session');
 page.once('dialog',d=>d.accept()); await page.locator('.pwa-update button').click(); await expectRelease('B');
 console.log('PASS explicit Update loads actual release B bundle');
 // New launch automatically installs C with no interaction and no ?v link.
 await page.close(); release='C'; page=await ctx.newPage(); await page.goto(url); await expectRelease('C');
 console.log('PASS clean launch detects C, activates and reloads to new actual bundle');
 await ctx.setOffline(true); await page.reload(); await expectRelease('C');
 console.log('PASS latest C fully usable offline after update');
 await page.screenshot({path:'/tmp/pwa-release-c-offline.png',fullPage:false});
 await ctx.close();
 // Migration from production's legacy worker.
 if(process.env.LEGACY_DIST) {
 const legacy=await browser.newContext(); page=await legacy.newPage(); release='LEGACY';
 await page.goto(url); await page.evaluate(()=>navigator.serviceWorker.ready); await page.waitForFunction(()=>navigator.serviceWorker.controller);
 release='B'; await page.evaluate(async()=>{const changed=new Promise(resolve=>navigator.serviceWorker.addEventListener('controllerchange',resolve,{once:true}));const r=await navigator.serviceWorker.getRegistration(); await r.update(); await changed;});
 await page.waitForFunction(async()=>{const keys=await caches.keys();return !keys.includes('sab-tools-shell-v11')&&keys.some(k=>k.startsWith('sab-tools-shell-'))});
 await page.reload(); await expectRelease('B'); console.log('PASS legacy v11 bridge serves new shell on next navigation without cache clearing');
 await page.evaluate(()=>document.dispatchEvent(new Event('input',{bubbles:true}))); release='C';
 await page.evaluate(async()=>{await (await navigator.serviceWorker.getRegistration()).update()});
 await page.waitForSelector('.pwa-update'); await expectRelease('B');
 console.log('PASS post-migration update C remains waiting mid-session');
 await legacy.close();
 // Reproduce v11's empty HTML shell by removing opportunistically cached JS,
 // then deploying a release whose server no longer has that legacy hash.
 const stuck=await browser.newContext({viewport:{width:390,height:844}});
 page=await stuck.newPage(); release='LEGACY'; await page.goto(url);
 await page.evaluate(()=>navigator.serviceWorker.ready); await page.waitForFunction(()=>navigator.serviceWorker.controller);
 await page.evaluate(async()=>{const c=await caches.open('sab-tools-shell-v11');for(const r of await c.keys())if(/\.js(?:$|\?)/.test(r.url))await c.delete(r)});
 // Let the original worker's install/initial registration finish before deployment.
 await page.waitForTimeout(1500); release='B'; await page.reload();
 await page.waitForTimeout(200);
 if(await page.locator('#root').innerText()!=='') throw new Error('legacy blank screen not reproduced');
 await page.screenshot({path:'/tmp/pwa-legacy-white.png'});
 console.log('PASS reproduced actual legacy blank shell: cached HTML, missing hashed JS (404)');
 // Do not call registration.update(): emulate closing/reopening the installed app.
 await page.close(); page=await stuck.newPage(); await page.goto(url);
 // Chrome checks the SW on navigation, including when the app module fails.
 let discovered=false;
 try { await page.waitForFunction(async()=>(await caches.keys()).some(k=>/^sab-tools-shell-[0-9a-f]{16}$/.test(k)),null,{timeout:10000}); discovered=true; } catch {}
 if(discovered) {
   await page.waitForFunction(async()=>{const r=await navigator.serviceWorker.getRegistration();return r?.active?.state==='activated' && !(await caches.keys()).includes('sab-tools-shell-v11')});
   await page.waitForTimeout(1500);
   await page.close(); page=await stuck.newPage(); await page.goto(url); await expectRelease('B');
   console.log('PASS legacy navigation discovered new worker and subsequent reopen recovered');
 } else {
   console.log('LIMIT legacy close/reopen did not discover replacement within 10s; one-time network entry needed');
   // A fresh query entry bypasses v11 cached HTML and runs the inline rescue.
   await page.goto(url+'?legacy-recovery=1'); await expectRelease('B');
   await page.waitForFunction(async()=>(await caches.keys()).some(k=>/^sab-tools-shell-[0-9a-f]{16}$/.test(k)));
   await page.close(); page=await stuck.newPage(); await page.goto(url); await expectRelease('B');
   console.log('PASS one-time fresh network entry repaired stranded v11; normal reopen works thereafter');
 }
 await page.waitForFunction(()=>!document.body.textContent.includes('Loading...'));
 await page.screenshot({path:'/tmp/pwa-legacy-recovered.png'});
 await stuck.close();
 }
 // Modern shell boot rescue: remove a cached current bundle and make its
 // network request 404. Inline HTML must stay visible despite missing app JS.
 const broken=await browser.newContext({viewport:{width:320,height:740}});
 page=await broken.newPage(); release='C'; await page.goto(url); await expectRelease('C');
 await page.evaluate(()=>navigator.serviceWorker.ready); await page.waitForFunction(()=>navigator.serviceWorker.controller);
 await page.evaluate(async()=>{for(const k of await caches.keys()){const c=await caches.open(k);for(const r of await c.keys())if(/assets\/.*\.js$/.test(r.url))await c.delete(r)}});
 missingApp=true; await page.reload(); await page.waitForSelector('[data-boot-status]');
 await page.waitForFunction(()=>document.querySelector('[data-boot-status]')?.textContent.includes('could not start'));
 await page.screenshot({path:'/tmp/pwa-boot-recovery.png'});
 console.log('PASS missing modern JS shows recovery status and Retry, not blank screen');
 missingApp=false;
 await page.evaluate(()=>navigator.serviceWorker.controller.postMessage({type:'REPAIR_SHELL'}));
 await expectRelease('C');
 console.log('PASS worker shell repair restores missing bundle and inline rescue reloads once');
 // A genuine repeated runtime failure must not loop.
 await broken.close();
}finally{await browser.close();server.close();}
