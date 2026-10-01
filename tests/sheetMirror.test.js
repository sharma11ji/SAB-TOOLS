import test from 'node:test';
import assert from 'node:assert/strict';
import {receiptLine, mirrorReceipt, FORM_ENDPOINT, FORM_ENTRY} from '../src/sheetMirror.js';
const receipt = {id: '12345678-1234-1234-1234-123456789012', date: '2026-10-01', number: '1', customer: 'Test', village: 'Village', rate: '50', advance: '10', labour: '5', transport: '2', rows: [{length: '2.37', girth: '48', rate: '50'}]};
test('maps nine ordered tab-separated fields with exact money', () => {
  assert.equal(receiptLine(receipt), '2026-10-01\t1\tTest\tVillage\t2.3700\t50\t125.50\t10.00\t115.50');
});
test('preserves mixed historical rates and negative balance', () => {
  assert.equal(receiptLine({...receipt, rows: [...receipt.rows, {length:'1',girth:'48',rate:'55'}]}).split('\t')[5], 'Mixed');
  assert.equal(receiptLine({...receipt,advance:'200'}).split('\t')[8], '-74.50');
});
test('tabs and newlines in names cannot change field count', () => {
  const line=receiptLine({...receipt,customer:'Test\tName\nNext',village:'One\rTwo'});
  assert.equal(line.split('\t').length,9);assert.equal(line.includes('\n'),false);assert.ok(line.includes('Test Name Next'));
});
test('no permission means no transmission', async () => {
  let calls=0; await mirrorReceipt(receipt,{enabled:false,fetcher:()=>{calls++;}});assert.equal(calls,0);
});
test('url-encoded no-cors form POST includes exactly one entry and no key or cookies', async () => {
  let called=false;await mirrorReceipt(receipt,{enabled:true,fetcher:async(url,init)=>{
    called=true;assert.equal(url,FORM_ENDPOINT);assert.equal(init.mode,'no-cors');assert.equal(init.credentials,'omit');
    const params=new URLSearchParams(init.body);assert.deepEqual([...params.keys()],[FORM_ENTRY]);assert.equal(params.get(FORM_ENTRY),receiptLine(receipt));
    return {get ok(){throw new Error('must not inspect opaque response');}};
  }});assert.equal(called,true);
});
test('network failure never rejects or retries the primary save', async () => {
  let calls=0;await mirrorReceipt(receipt,{enabled:true,fetcher:async()=>{calls++;throw Error('offline');}});assert.equal(calls,1);
});
