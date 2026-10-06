import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { notificationOffer, updateNotification } from '../src/pushPolicy.js';
import { pushMessage, eligibleSubscription } from '../scripts/sendUpdatePush.mjs';
test('permission offer is owner-only, after use, opt-in, with denial respected',()=>{
 const base={configured:true,owner:true,permission:'default',used:true,dismissed:false};
 assert.equal(notificationOffer(base),true);
 for(const override of [{configured:false},{owner:false},{used:false},{dismissed:true},{permission:'denied'},{permission:'granted'}])
   assert.equal(notificationOffer({...base,...override}),false);
});
test('notification accepts only update payload and valid release with fixed safe click target',()=>{
 assert.equal(updateNotification({type:'OTHER',release:'1234567890abcdef'},'https://a.test/app/'),null);
 assert.equal(updateNotification({type:'APP_UPDATE',release:'bad'},'https://a.test/app/'),null);
 const n=updateNotification({type:'APP_UPDATE',release:'1234567890abcdef',url:'https://evil.test'},'https://a.test/app/');
 assert.equal(n.title,'New update available');assert.equal(n.options.icon,'https://a.test/app/icons/icon-192.png');
 assert.equal(n.options.data.sabUpdate,true);assert.equal(n.options.data.url,undefined);
});
test('sender targets token using data-only push, skips stale/disabled/already notified devices',()=>{
 const release='1234567890abcdef',now=Date.parse('2026-10-06T00:00:00Z');
 const f={enabled:{booleanValue:true},token:{stringValue:'device'},updatedAt:{timestampValue:'2026-10-05T00:00:00Z'}};
 assert.equal(eligibleSubscription(f,release,now),true);
 assert.equal(eligibleSubscription({...f,sentRelease:{stringValue:release}},release,now),false);
 assert.equal(eligibleSubscription({...f,enabled:{booleanValue:false}},release,now),false);
 assert.equal(eligibleSubscription({...f,updatedAt:{timestampValue:'2025-10-05T00:00:00Z'}},release,now),false);
 const m=pushMessage('device',release).message;assert.equal(m.token,'device');assert.equal(m.notification,undefined);
 assert.equal(m.webpush.headers.TTL,'86400');
});
test('worker background notification and click preserve existing form or open normal app URL',async()=>{
 const events={},shown=[],opened=[];let handler,focused=0,messages=[],windows=[];
 const self={registration:{scope:'https://a.test/SAB-TOOLS/',showNotification:async(t,o)=>shown.push([t,o])},
  addEventListener:(t,f)=>events[t]=f,clients:{matchAll:async()=>windows,openWindow:async u=>opened.push(u)}};
 const source=readFileSync(new URL('../src/pushWorker.js',import.meta.url),'utf8').replace(/^import .*;\n/gm,'').replace('__FIREBASE_PUSH_CONFIG__','{}');
 runInNewContext(source,{self,URL,VERSION:'aaaaaaaaaaaaaaaa',initializeApp:c=>c,getMessaging:a=>a,onBackgroundMessage:(_,f)=>handler=f,updateNotification});
 await handler({data:{type:'APP_UPDATE',release:'aaaaaaaaaaaaaaaa'}});assert.equal(shown.length,0);
 await handler({data:{type:'APP_UPDATE',release:'bbbbbbbbbbbbbbbb'}});assert.equal(shown.length,1);
 let waited;const click=()=>events.notificationclick({notification:{data:{sabUpdate:true},close:()=>{}},stopImmediatePropagation:()=>{},waitUntil:p=>waited=p});
 click();await waited;assert.deepEqual(opened,['https://a.test/SAB-TOOLS/']);
 windows=[{url:'https://a.test/SAB-TOOLS/#/receipt',focus:async()=>focused++,postMessage:m=>messages.push(m)}];
 click();await waited;assert.equal(focused,1);assert.equal(opened.length,1);assert.equal(messages[0].type,'UPDATE_FROM_NOTIFICATION');
});

test('sender verifies live release, authenticates privately, and sends only owner subscriptions',async()=>{
 const { main }=await import('../scripts/sendUpdatePush.mjs');
 const {generateKeyPairSync}=await import('node:crypto');const {mkdtempSync,writeFileSync,rmSync}=await import('node:fs');
 const dir=mkdtempSync('/tmp/sab-sender-test-'),file=dir+'/sw.js',release='1234567890abcdef';writeFileSync(file,`const VERSION = "${release}";`);
 const savedEnv={...process.env},savedFetch=globalThis.fetch;const calls=[];
 const {privateKey}=generateKeyPairSync('rsa',{modulusLength:2048,privateKeyEncoding:{type:'pkcs8',format:'pem'},publicKeyEncoding:{type:'spki',format:'pem'}});
 process.env.FIREBASE_PUSH_SERVICE_ACCOUNT=JSON.stringify({project_id:'test-project',client_email:'sender@test-project.iam.gserviceaccount.com',private_key:privateKey});
 process.env.PUSH_PROJECT_ID='test-project';process.env.PUSH_OWNER_UID='owner-only';process.env.RELEASE_WORKER=file;process.env.PUSH_LIVE_URL='https://live.test/app/';
 globalThis.fetch=async(url,opts={})=>{
  const u=String(url);calls.push({u,opts});
  if(u.startsWith('https://live.test/'))return new Response(`const VERSION = "${release}";`);
  if(u.includes('oauth2.googleapis.com'))return Response.json({access_token:'test-access'});
  if(u.includes('pushSubscriptions')&&!opts.method)return Response.json({documents:[{name:'projects/test-project/databases/(default)/documents/users/owner-only/pushSubscriptions/device',fields:{enabled:{booleanValue:true},token:{stringValue:'private-device-token'},updatedAt:{timestampValue:new Date().toISOString()}}}]});
  return Response.json({name:'accepted'});
 };
 try{
  await main();assert.ok(calls[0].u.startsWith('https://live.test/'));
  const sends=calls.filter(c=>c.u.includes('messages:send'));assert.equal(sends.length,1);assert.equal(JSON.parse(sends[0].opts.body).message.token,'private-device-token');
  assert.ok(calls.find(c=>c.u.includes('/users/owner-only/pushSubscriptions')));
  assert.ok(calls.find(c=>c.opts.method==='PATCH'));
 }finally{globalThis.fetch=savedFetch;process.env=savedEnv;rmSync(dir,{recursive:true,force:true})}
});

test('push identity config is separate from unchanged register owner behavior',()=>{
 const service=readFileSync(new URL('../src/pushNotifications.js',import.meta.url),'utf8');
 const ui=readFileSync(new URL('../src/UpdateNotifications.jsx',import.meta.url),'utf8');
 const workflow=readFileSync(new URL('../.github/workflows/build.yml',import.meta.url),'utf8');
 assert.ok(service.includes('VITE_PUSH_OWNER_UID'));assert.ok(ui.includes('VITE_PUSH_OWNER_UID'));
 assert.ok(!service.includes('VITE_REGISTER_OWNER_UID'));assert.ok(!ui.includes('VITE_REGISTER_OWNER_UID'));
 assert.ok(workflow.includes('PUSH_OWNER_UID: ${{ secrets.VITE_PUSH_OWNER_UID }}'));
 assert.ok(workflow.includes('VITE_REGISTER_OWNER_UID: ${{ secrets.VITE_REGISTER_OWNER_UID }}'));
});
