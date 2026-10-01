import test from 'node:test';
import assert from 'node:assert/strict';
import {sheetPayload, mirrorReceipt, validSheetUrl, cleanSheetUrl} from '../src/sheetMirror.js';
const receipt = {id: '12345678-1234-1234-1234-123456789012', date: '2026-10-01', number: '1', customer: 'Test', village: 'Village', rate: '50', advance: '10', labour: '5', transport: '2', rows: [{length: '2.37', girth: '48', rate: '50'}]};
const endpoint = 'https://script.google.com/macros/s/DEMO/exec';
test('maps exact calculated totals without sending extra private fields', () => {
  assert.deepEqual(sheetPayload(receipt, 'test'), {key: 'test', id: receipt.id, date: receipt.date, receiptNo: '1', customer: 'Test', village: 'Village', totalCft: 2.37, rate: 50, totalAmount: 125.5, paid: 10, balance: 115.5});
});
test('preserves mixed historical rates without inventing a common rate', () => {
  assert.equal(sheetPayload({...receipt, rows: [...receipt.rows, {length: '1', girth: '48', rate: '55'}]}, 'test').rate, 'Mixed');
});
test('only permits final Apps Script exec endpoint and trims env', () => {
  assert.equal(validSheetUrl(cleanSheetUrl(' '+endpoint+'\n')), true);
  assert.equal(validSheetUrl(endpoint.replace('/exec','/dev')), false);
  assert.equal(validSheetUrl('https://evil.invalid/exec'), false);
});
test('no config, key or permission means no transmission', async () => {
  let calls = 0; const fetcher = () => {calls++;};
  for (const options of [{endpoint, enabled:false, key:'test'}, {endpoint, enabled:true, key:''}, {endpoint:'', enabled:true, key:'test'}]) await mirrorReceipt(receipt, {...options, fetcher});
  assert.equal(calls, 0);
});
test('plain-text JSON no-cors mirror has no cookies and ignores opaque response', async () => {
  let called = false;
  await mirrorReceipt(receipt, {endpoint, enabled:true, key:'test', fetcher: async (url, init) => {
    called = true; assert.equal(url, endpoint); assert.equal(init.mode, 'no-cors'); assert.equal(init.credentials, 'omit');
    assert.equal(init.headers['Content-Type'], 'text/plain;charset=UTF-8'); assert.equal(JSON.parse(init.body).paid, 10);
    return {get ok(){throw new Error('must not inspect opaque response');}};
  }}); assert.equal(called, true);
});
test('failure does not reject primary save or retry', async () => {
  let calls=0;
  await mirrorReceipt(receipt, {endpoint, enabled:true, key:'test', fetcher: async () => {calls++; throw new Error('offline');}});
  assert.equal(calls,1);
});
