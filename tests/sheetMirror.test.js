import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {receiptFields, mirrorReceipt, FORM_ENDPOINT, FORM_ENTRIES} from '../src/sheetMirror.js';
const receipt = {id: '12345678-1234-1234-1234-123456789012', date: '2026-10-01', number: '1', customer: 'Test', village: 'Village', rate: '50', advance: '10', labour: '5', transport: '2', rows: [{wood: 'Teak', length: '2.37', girth: '48', rate: '50'}]};
const values = record => Object.fromEntries(Object.entries(FORM_ENTRIES).map(([key, entry]) => [key, receiptFields(record)[entry]]));
test('maps twelve separate fields with CFT and exact money', () => {
  assert.deepEqual(values(receipt), {date:'2026-10-01', number:'1', customer:'Test', village:'Village', item:'Teak', cft:'2.3700', rate:'50', total:'125.50', paid:'10.00', balance:'115.50', labour:'5.00', transport:'2.00'});
  assert.equal(new Set(Object.values(FORM_ENTRIES)).size,12);
});
test('preserves mixed historical rates, wood items and negative balance', () => {
  const fields=values({...receipt, rows:[...receipt.rows,{wood:'Pine',length:'1',girth:'48',rate:'55'}]});
  assert.equal(fields.rate,'Mixed'); assert.equal(fields.item,'Teak, Pine');
  assert.equal(values({...receipt,advance:'200'}).balance,'-74.50');
});
test('tabs/newlines, Unicode and ampersands are safely encoded without extra entries', () => {
  const fields=values({...receipt,customer:'Test\tName\nNext & कुमार',village:'One\rTwo'});
  assert.equal(fields.customer,'Test Name Next & कुमार'); assert.equal(fields.village,'One Two');
});
test('no permission means no transmission', async () => {
  let calls=0; await mirrorReceipt(receipt,{enabled:false,fetcher:()=>{calls++;}}); assert.equal(calls,0);
});
test('url-encoded no-cors POST uses all separate entries and no legacy entry or cookies', async () => {
  let request; await mirrorReceipt(receipt,{enabled:true,fetcher:async(url,init)=>{
    request={url,init}; return {get ok(){throw new Error('must not inspect opaque response');}};
  }});
  assert.ok(request); assert.equal(request.url,FORM_ENDPOINT); assert.equal(request.init.mode,'no-cors'); assert.equal(request.init.credentials,'omit');
  const params=new URLSearchParams(request.init.body);
  assert.deepEqual(Object.fromEntries(params),receiptFields(receipt)); assert.equal(params.has('entry.1178599720'),false);
});
test('network failure never rejects or retries the primary save', async () => {
  let calls=0;await mirrorReceipt(receipt,{enabled:true,fetcher:async()=>{calls++;throw Error('offline');}});assert.equal(calls,1);
});
test('invalid receipt is never transmitted', async () => {
  let calls=0;await mirrorReceipt({...receipt,id:''},{enabled:true,fetcher:async()=>{calls++;}});assert.equal(calls,0);
});
test('mirror stays after awaited save and excludes local-only saves', () => {
  const source=readFileSync(new URL('../src/TimberReceipt.jsx',import.meta.url),'utf8');
  assert.match(source,/await storeReceipt\(userId, record\)/);
  assert.match(source,/if \(userId !== 'local' && db\) void mirrorReceipt/);
  assert.ok(source.indexOf('await storeReceipt(userId, record)') < source.indexOf('void mirrorReceipt(record'));
});
