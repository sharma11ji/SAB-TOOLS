import test from 'node:test';
import assert from 'node:assert/strict';
import {buildCustomers, filterCustomers, callable} from '../src/customerList.js';
import {receiptRecord} from '../src/receiptRecords.js';
const base = {shop:'S',shopAddress:'A',mobile:'',number:'1',date:'2026-09-30',customer:'Ramesh',village:'Rampur',rate:'100',advance:'0',labour:'0',transport:'0',rows:[{wood:'Teak',length:'10',girth:'48',rate:'100'}]};
const mk = (id, over) => ({...receiptRecord({...base, ...over}, id), savedAt: over.savedAt || '2026-09-30T00:00:00Z'});
test('groups receipts by name+village ignoring case/spaces, sums total and pending', () => {
 const {customers, invalid} = buildCustomers([mk('a',{advance:'400'}), mk('b',{number:'2',date:'2026-10-01',customer:'  ramesh ',village:'RAMPUR',advance:'1000'}), mk('c',{customer:'Ramesh',village:'Other'})]);
 assert.equal(invalid.length, 0); assert.equal(customers.length, 2);
 const r = customers.find(c => c.village === 'RAMPUR');
 assert.equal(r.receipts.length, 2); assert.equal(r.total, 2000); assert.equal(r.pending, 600); assert.equal(r.name, 'ramesh'); assert.equal(r.lastDate, '2026-10-01');
 assert.equal(customers[0].key, r.key);
});
test('latest non-empty phone wins; missing phone stays blank', () => {
 const {customers} = buildCustomers([mk('a',{customerMobile:'9811111111',savedAt:'2026-09-01T00:00:00Z'}), mk('b',{customerMobile:'',savedAt:'2026-09-05T00:00:00Z'}), mk('c',{customerMobile:'9822222222',savedAt:'2026-09-03T00:00:00Z'})]);
 assert.equal(customers[0].phone, '9822222222');
 assert.equal(buildCustomers([mk('d',{})]).customers[0].phone, '');
});
test('invalid receipts are excluded and reported, not counted', () => {
 const bad = {...mk('x',{}), rate:'abc', rows:[{wood:'T',length:'x',girth:'1',rate:'1'}]};
 const {customers, invalid} = buildCustomers([bad, mk('y',{customer:'Sita'})]);
 assert.equal(invalid.length, 1); assert.equal(customers.length, 1);
});
test('search by name, village, phone digits; callable check', () => {
 const {customers} = buildCustomers([mk('a',{customerMobile:'+91 98111 11111'}), mk('b',{customer:'Sita',village:'Dhanbad'})]);
 assert.equal(filterCustomers(customers,'ram').length,1); assert.equal(filterCustomers(customers,'dhan').length,1);
 assert.equal(filterCustomers(customers,'9811111').length,1); assert.equal(filterCustomers(customers,'').length,2); assert.equal(filterCustomers(customers,'zzz').length,0);
 assert.ok(callable('9811111111')); assert.ok(!callable('123'));
});
