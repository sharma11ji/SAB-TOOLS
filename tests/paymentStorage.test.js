import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {receiptRecord} from '../src/receiptRecords.js';
import {assertRevision, receivedPayment, paymentState} from '../src/paymentLedger.js';
const base={shop:'Test mill',shopAddress:'',mobile:'',number:'1',date:'2026-10-03',customer:'Test customer',village:'',rate:'50',advance:'0',labour:'0',transport:'0',rows:[{wood:'',length:'10',girth:'48',rate:'50'}]};
const source=readFileSync(new URL('../src/receiptStorage.js',import.meta.url),'utf8');
const docs=new Map(), paths=[];
const h={db:{},assertRevision,receivedPayment,paymentState,receiptKey:uid=>`test:${uid}`,
 doc:(db,...path)=>{paths.push(path.join('/'));return path.join('/');},serverTimestamp:()=>({seconds:123}),
 runTransaction:async(db,fn)=>fn({get:async ref=>({exists:()=>docs.has(ref),data:()=>docs.get(ref)}),set:(ref,data)=>docs.set(ref,data),update:(ref,data)=>docs.set(ref,{...docs.get(ref),...data})})};
globalThis.__bakiHarness=h;
const replaced=source.replace(/^import .*;\n/gm,'')+'\n';
const {storeReceipt,recordPayment}=await import('data:text/javascript;base64,'+Buffer.from('const {doc,runTransaction,serverTimestamp,db,receiptKey,assertRevision,receivedPayment,paymentState}=globalThis.__bakiHarness;\n'+replaced).toString('base64'));
Object.defineProperty(globalThis,'navigator',{value:{onLine:true},configurable:true});
const local=new Map();globalThis.localStorage={getItem:k=>local.get(k)||null,setItem:(k,v)=>local.set(k,v)};globalThis.window={dispatchEvent:()=>{}};
test('cloud save and payment operate only on requested user-owned history and preserve creation timestamp',async()=>{
 const record=receiptRecord(base,'one');await storeReceipt('alice',record);
 const path='users/alice/history/one';assert.equal(docs.get(path).revision,1);const created=docs.get(path).createdAt;
 const updated=await recordPayment('alice',{...record,revision:1},'100');assert.equal(updated.balance,400);assert.equal(docs.get(path).advance,'100');assert.equal(docs.get(path).createdAt,created);
 await assert.rejects(storeReceipt('alice',record,1),/changed/);
 await assert.rejects(recordPayment('alice',{...record,revision:1},'100'),/changed/);
 await storeReceipt('bob',record);assert.equal(docs.get('users/bob/history/one').advance,'0');
 assert.ok(paths.every(path=>/^users\/(alice|bob)\/history\/one$/.test(path)));
});
test('cloud offline and missing receipt fail without queued optimistic settlement',async()=>{
 navigator.onLine=false;await assert.rejects(storeReceipt('alice',receiptRecord(base,'offline')),/offline/);await assert.rejects(recordPayment('alice',receiptRecord(base,'one'),'50'),/offline/);navigator.onLine=true;
 await assert.rejects(recordPayment('alice',receiptRecord(base,'missing'),'50'),/no longer exists/);assert.equal(docs.has('users/alice/history/offline'),false);
});
test('local save, received payment and stale editor use revisions too',async()=>{
 const record=receiptRecord(base,'localone');await storeReceipt('local',record);
 const updated=await recordPayment('local',{...record,revision:1},'200');assert.equal(updated.balance,300);
 await assert.rejects(storeReceipt('local',record,1),/changed/);
 assert.equal(JSON.parse(local.get('test:local'))[0].advance,'200');
});
