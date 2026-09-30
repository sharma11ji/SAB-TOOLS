import { test } from 'node:test';
import assert from 'node:assert/strict';
import { roundLogCft, receiptTotals } from '../src/timberReceipt.js';
test('2304 round-log formula uses ft and circumference in inches', () => {
  assert.equal(roundLogCft(1, 48), 1);
  assert.equal(roundLogCft('2.5', '29'), 2.5 * 29 * 29 / 2304);
});
test('four-piece sample and money use full precision', () => {
  const rows = [[7,38],[3.5,27],[2.5,23],[8,28]].map(([length,girth]) => ({length,girth}));
  const result = receiptTotals(rows, '1000', '2000');
  assert.ok(result.valid);
  assert.equal(result.cft.toFixed(4), '8.7908');
  assert.equal(result.total, 8790.79);
  assert.equal(result.balance, 6790.79);
});
test('invalid, empty, nonfinite, negative measurements cannot be finalized', () => {
  for (const value of ['',0,-1,'bad',Infinity,'1e308']) assert.equal(roundLogCft(value, 48), null);
  for (const value of ['',-1,'bad',Infinity]) assert.equal(receiptTotals([{length:1,girth:48}],value,0).valid,false);
  assert.equal(receiptTotals([],0,0).valid,false);
  assert.equal(receiptTotals([{length:1,girth:48}],0,-1).valid,false);
});
test('zero price, paise rounding, advance above total', () => {
  assert.equal(receiptTotals([{length:1,girth:48}],0,0).valid,true);
  assert.equal(receiptTotals([{length:1,girth:48}], '10.23','20').balance,-9.77);
});
test('row-specific rates, labour, transport and piece count', () => {
 const result = receiptTotals([{length:1,girth:48,rate:'100'}, {length:2,girth:48,rate:'200'}],0,50,30,20);
 assert.deepEqual(result.amounts,[100,400]);
 assert.equal(result.woodValue,500);
 assert.equal(result.total,550);
 assert.equal(result.balance,500);
 assert.equal(receiptTotals([{length:1,girth:48,rate:'-1'}],0,0).valid,false);
 assert.equal(receiptTotals([{length:1,girth:48}],0,0,-1,0).valid,false);
});
