import test from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {mkdtemp,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
const root='users/test-user';
const clone=x=>structuredClone(x);
const receipt={id:'r1',customer:'latest',rows:[],rate:'0',advance:'0',labour:'0',transport:'0'};
const deferred=()=>{let resolve;const promise=new Promise(r=>resolve=r);return {promise,resolve}};
async function fixture(){
 const e={data:new Map(),writes:[],created:0,chain:Promise.resolve(),auth:{currentUser:{uid:'test-user',email:'test@example.invalid',providerData:[{providerId:'google.com'}]}}};
 e.data.set(root,{personalSheet:{uid:'test-user',enabled:true,spreadsheetId:'old',url:'https://example.invalid/old',nextRow:3}});
 e.data.set(root+'/history/r1',receipt);
 e.data.set(root+'/preferences/sheet-row-r1',{row:2,record:receipt,version:1,pending:false,deliveredDestination:'old'});
 const snapshot=ref=>({id:ref.path.split('/').at(-1),ref,exists:()=>e.data.has(ref.path),data:()=>clone(e.data.get(ref.path))});
 e.get=async ref=>snapshot(ref);
 e.list=async ref=>({docs:[...e.data.keys()].filter(p=>p.startsWith(ref.path+'/')&&!p.slice(ref.path.length+1).includes('/')).map(path=>snapshot({path}))});
 e.transaction=async(db,fn)=>{const before=e.chain,gate=deferred();e.chain=gate.promise;await before;try{return await fn({get:e.get,set:(r,v)=>e.data.set(r.path,clone(v)),update:(r,v)=>{const data=clone(e.data.get(r.path));for(const [k,x]of Object.entries(v)){const parts=k.split('.');let d=data;for(const p of parts.slice(0,-1))d=d[p];d[parts.at(-1)]=clone(x)}e.data.set(r.path,data)}})}finally{gate.resolve()}};
 e.create=async()=>({spreadsheetId:'new-'+(++e.created),spreadsheetUrl:'https://example.invalid/new'});
 e.write=async(id,row,record)=>e.writes.push({id,row,record:clone(record)});
 globalThis.sheetFixture=e;
 const mocks={
 'firebase/auth':`export class GoogleAuthProvider{addScope(){}setCustomParameters(){}static credentialFromResult(){return {accessToken:'token'}}}export async function reauthenticateWithPopup(){return {}}`,
 'firebase/firestore':`const e=globalThis.sheetFixture;export const collection=(db,...p)=>({path:p.join('/')});export const doc=(db,...p)=>({path:db?.path?[db.path,...p].join('/'):p.join('/')});export const getDoc=e.get,getDocs=e.list,runTransaction=e.transaction,serverTimestamp=()=>123;`,
 './firebase':`export const auth=globalThis.sheetFixture.auth,db={};`,
 './personalSheetApi':`export const SHEET_SCOPE='drive.file',createPersonalSheet=(...a)=>globalThis.sheetFixture.create(...a),writeSheetRow=(...a)=>globalThis.sheetFixture.write(...a);`};
 const out=await build({entryPoints:[new URL('../src/personalSheet.js',import.meta.url).pathname],bundle:true,write:false,format:'esm',platform:'node',plugins:[{name:'mock',setup(b){b.onResolve({filter:/.*/},a=>mocks[a.path]?{path:a.path,namespace:'mock'}:null);b.onLoad({filter:/.*/,namespace:'mock'},a=>({contents:mocks[a.path],loader:'js'}))}}]});
 const dir=await mkdtemp(tmpdir()+'/sheet-test-');await writeFile(dir+'/a.mjs',out.outputFiles[0].text);await writeFile(dir+'/b.mjs',out.outputFiles[0].text);return {e,a:await import(dir+'/a.mjs'),b:await import(dir+'/b.mjs')};
}
test('real module serializes two devices and sends newest pending version',{timeout:4000},async()=>{
 const {e,a,b}=await fixture();await a.connectPersonalSheet('test-user');await b.connectPersonalSheet('test-user');
 const sent=deferred(),response=deferred();let first=true;
 e.write=async(id,row,r)=>{e.writes.push({id,row,record:clone(r)});if(first){first=false;sent.resolve();await response.promise}};
 e.data.set(root+'/history/r1',{...receipt,customer:'old'});const old=a.queuePersonalReceipt('test-user',{...receipt,customer:'old'});await sent.promise;
 e.data.set(root+'/history/r1',{...receipt,customer:'new'});await assert.rejects(b.queuePersonalReceipt('test-user',{...receipt,customer:'new'}),/paused/);response.resolve();await old;
 assert.deepEqual(e.writes.map(w=>w.record.customer),['old','new']);assert.equal(e.data.get(root).sheetDelivery,null);
});
test('real replacement preserves abandoned lock and copies cloud source',{timeout:4000},async()=>{
 const {e,a}=await fixture();e.data.get(root).sheetDelivery={attempt:'abandoned',spreadsheetId:'old'};
 await assert.rejects(a.connectPersonalSheet('test-user'),/paused/);await a.replacePersonalSheet('test-user');
 assert.equal(e.created,1);assert.equal(e.writes.at(-1).id,'new-1');assert.equal(e.writes.at(-1).record.customer,'latest');
 const retired=[...e.data.entries()].find(([p])=>p.includes('/retired-sheet-'))[1];assert.equal(retired.deliveryLock.attempt,'abandoned');assert.equal(retired.config.spreadsheetId,'old');
 await a.connectPersonalSheet('test-user');assert.equal(e.created,1);
});
test('real ambiguous replacement never retries creation',{timeout:4000},async()=>{
 const {e,a}=await fixture();e.create=async()=>{e.created++;throw new Error('timeout')};
 await assert.rejects(a.replacePersonalSheet('test-user'),/recovery stopped/);assert.ok(e.data.get(root).sheetRecovery);
 await assert.rejects(a.replacePersonalSheet('test-user'),/already in progress/);await assert.rejects(a.connectPersonalSheet('test-user'),/paused/);assert.equal(e.created,1);
});
test('real delayed writer is fenced to retired destination during replacement',{timeout:4000},async()=>{
 const {e,a,b}=await fixture();await a.connectPersonalSheet('test-user');await b.connectPersonalSheet('test-user');
 const sent=deferred(),response=deferred();let first=true;
 e.write=async(id,row,r)=>{if(first){first=false;sent.resolve();await response.promise}e.writes.push({id,row,record:clone(r)})};
 e.data.set(root+'/history/r1',{...receipt,customer:'old'});const old=a.queuePersonalReceipt('test-user',{...receipt,customer:'old'});const rejected=assert.rejects(old,/paused/);await sent.promise;
 e.data.set(root+'/history/r1',receipt);await b.replacePersonalSheet('test-user');response.resolve();await rejected;
 assert.deepEqual(e.writes.map(w=>[w.id,w.record.customer]),[['new-1','latest'],['old','old']]);assert.equal(e.data.get(root).personalSheet.spreadsheetId,'new-1');assert.equal(e.data.get(root).sheetDelivery,null);
});
test('same device replacement proceeds without waiting on hung retired PUT',{timeout:4000},async()=>{
 const {e,a}=await fixture();await a.connectPersonalSheet('test-user');
 const sent=deferred(),response=deferred();let first=true;
 e.write=async(id,row,r)=>{if(first){first=false;sent.resolve();await response.promise}e.writes.push({id,row,record:clone(r)})};
 e.data.set(root+'/history/r1',{...receipt,customer:'old'});const old=a.queuePersonalReceipt('test-user',{...receipt,customer:'old'});const rejected=assert.rejects(old,/paused/);await sent.promise;
 e.data.set(root+'/history/r1',receipt);await a.replacePersonalSheet('test-user');assert.equal(e.writes.at(-1).id,'new-1');response.resolve();await rejected;
 assert.equal(e.data.get(root).sheetDelivery,null);
});
test('delayed queue caller cannot override newer cloud record',{timeout:4000},async()=>{
 const {e,a}=await fixture();await a.connectPersonalSheet('test-user');
 await a.queuePersonalReceipt('test-user',{...receipt,customer:'stale caller'});
 assert.equal(e.writes.at(-1).record.customer,'latest');
});
