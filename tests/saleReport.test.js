import test from 'node:test';
import assert from 'node:assert/strict';
import {buildReport, periodRange} from '../src/saleReport.js';
import {receiptRecord} from '../src/receiptRecords.js';
const base = {shop:'S',shopAddress:'A',mobile:'',number:'1',date:'2026-10-03',customer:'Ramesh',village:'Rampur',rate:'100',advance:'0',labour:'0',transport:'0',rows:[{wood:'Teak',length:'10',girth:'48',rate:'100'}]};
const mk = (id, over) => receiptRecord({...base, ...over}, id);
test('periodRange: today, week starts Monday, month starts on 1st', () => {
 const sat = new Date(2026, 9, 3);
 assert.deepEqual(periodRange('today', sat), {from:'2026-10-03', to:'2026-10-03'});
 assert.deepEqual(periodRange('week', sat), {from:'2026-09-28', to:'2026-10-03'});
 assert.deepEqual(periodRange('week', new Date(2026, 9, 5)), {from:'2026-10-05', to:'2026-10-05'});
 assert.deepEqual(periodRange('month', sat), {from:'2026-10-01', to:'2026-10-03'});
 assert.equal(periodRange('custom', sat), null);
});
test('totals, paid and baki add up within the period only', () => {
 const list = [mk('a',{advance:'400'}), mk('b',{number:'2',date:'2026-10-01',customer:'Sita',village:'X',advance:'1000'}), mk('c',{number:'3',date:'2026-09-20'})];
 const r = buildReport(list, {from:'2026-10-01', to:'2026-10-03'});
 assert.equal(r.count, 2); assert.equal(r.total, 2000); assert.equal(r.paid, 1400); assert.equal(r.pending, 600);
 assert.equal(r.top.length, 2); assert.equal(r.paid + r.pending, r.total);
});
test('range edges are inclusive, empty range gives zeros, null range counts all', () => {
 const list = [mk('a',{date:'2026-10-01'}), mk('b',{date:'2026-10-03'})];
 assert.equal(buildReport(list, {from:'2026-10-01', to:'2026-10-01'}).count, 1);
 assert.equal(buildReport(list, {from:'2026-11-01', to:'2026-11-02'}).total, 0);
 assert.equal(buildReport(list, {from:'', to:''}).count, 2);
 assert.equal(buildReport(list, null).count, 2);
});
test('top customers group by name+village, sorted by total; invalid receipts excluded', () => {
 const bad = {...mk('x',{}), rate:'abc', rows:[{wood:'T',length:'x',girth:'1',rate:'1'}]};
 const r = buildReport([mk('a',{customer:' ramesh '}), mk('b',{number:'2',customer:'RAMESH',advance:'1000'}), mk('c',{customer:'Sita',village:'Y',rows:[{wood:'T',length:'20',girth:'48',rate:'100'}]}), bad], null);
 assert.equal(r.invalid.length, 1); assert.equal(r.top.length, 2);
 assert.equal(r.top[0].count, 2); assert.equal(r.top[0].total, 2000); assert.equal(r.top[0].pending, 1000);
});
