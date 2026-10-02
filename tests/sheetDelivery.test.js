import test from 'node:test';
import assert from 'node:assert/strict';
import {deliverSerially, DELIVERY_PAUSED} from '../src/sheetDelivery.js';
const deferred=()=>{let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b});return {promise,resolve,reject}};
function store() {
 const s={lock:null,version:1,pending:true,value:'old',sheet:'old-sheet',writes:[]};
 const adapters={
  acquire:async()=>{if(s.lock)throw new Error(DELIVERY_PAUSED);s.lock={attempt:'a',spreadsheetId:s.sheet};return s.lock},
  check:async l=>{if(s.lock?.attempt!==l.attempt || s.sheet!==l.spreadsheetId)throw new Error(DELIVERY_PAUSED)},
  next:async()=>s.pending?{version:s.version,value:s.value}:null,
  write:async(l,r)=>s.writes.push([l.spreadsheetId,r.value]),
  acknowledge:async(l,r)=>{if(s.lock?.attempt!==l.attempt)throw new Error(DELIVERY_PAUSED);if(s.version===r.version)s.pending=false},
  release:async l=>{if(s.lock?.attempt===l.attempt)s.lock=null},
 };
 return {s,adapters};
}
test('two devices cannot overlap; newer version drains after older response',async()=>{
 const {s,adapters}=store(),sent=deferred(),response=deferred();
 let first=true;adapters.write=async(l,r)=>{s.writes.push([l.spreadsheetId,r.value]);if(first){first=false;sent.resolve();await response.promise}};
 const deviceA=deliverSerially(adapters);await sent.promise;
 s.value='new';s.version++;
 await assert.rejects(deliverSerially(adapters),/paused/);
 response.resolve();await deviceA;
 assert.deepEqual(s.writes,[['old-sheet','old'],['old-sheet','new']]);
 assert.equal(s.pending,false);assert.equal(s.lock,null);
});
test('ambiguous network failure retains durable lock; reconnect cannot unlock it',async()=>{
 const {s,adapters}=store();adapters.write=async()=>{throw new Error('network timeout')};
 await assert.rejects(deliverSerially(adapters),/timeout/);
 assert.ok(s.lock);assert.equal(s.pending,true);
 await assert.rejects(deliverSerially(adapters),/paused/);
});
test('explicit 401/403 rejection releases lock but retains pending receipt',async()=>{
 const {s,adapters}=store();adapters.write=async()=>{throw Object.assign(new Error('Reconnect'),{definiteNoWrite:true})};
 await assert.rejects(deliverSerially(adapters),/Reconnect/);
 assert.equal(s.lock,null);assert.equal(s.pending,true);
});
test('replacement destination fences delayed writer away from new register',async()=>{
 const {s,adapters}=store(),sent=deferred(),response=deferred();
 adapters.write=async(l,r)=>{sent.resolve();await response.promise;s.writes.push([l.spreadsheetId,r.value])};
 const oldJob=deliverSerially(adapters);await sent.promise;
 const retired={...s.lock};s.sheet='new-sheet';s.lock={attempt:'new',spreadsheetId:s.sheet};s.version++;s.value='new';
 response.resolve();await assert.rejects(oldJob,/paused/);
 assert.deepEqual(s.writes,[['old-sheet','old']]);assert.equal(s.lock.attempt,'new');assert.equal(retired.spreadsheetId,'old-sheet');assert.equal(s.pending,true);
});
test('failed durable release never permits a second writer',async()=>{
 const {s,adapters}=store();adapters.release=async()=>{throw new Error('Firestore offline')};
 await assert.rejects(deliverSerially(adapters),/offline/);
 assert.ok(s.lock);await assert.rejects(deliverSerially(adapters),/paused/);
});
