import test from 'node:test';
import assert from 'node:assert/strict';
class Store { constructor(){this.map=new Map()} getItem(k){return this.map.has(k)?this.map.get(k):null} setItem(k,v){this.map.set(k,String(v))} removeItem(k){this.map.delete(k)} }
globalThis.localStorage = new Store();
globalThis.window = {dispatchEvent: () => {}, addEventListener: () => {}, removeEventListener: () => {}};
globalThis.CustomEvent = class {constructor(){}};
Object.defineProperty(globalThis, 'crypto', {value: {randomUUID: () => 'e-' + Math.random().toString(36).slice(2)}});

const {saveEstimate, estimateTotals, nextEstimateNumber, duplicateEstimate, setEstimateStatus, STATUS_LABELS, ESTIMATE_STATUSES} = await import('../src/estimates.js');
const {saveCustomer} = await import('../src/businessCustomers.js');
const {readCollection} = await import('../src/businessStore.js');

test('estimate totals: lines, transport, discount, no negative total', () => {
  const t = estimateTotals({lines: [{description: 'Ply', quantity: 2, rate: 1500.25}, {description: 'Labour', quantity: 3, rate: 700}], transport: 500, discount: 300});
  assert.equal(t.subtotal, 5100.5);
  assert.equal(t.total, 5300.5);
  const over = estimateTotals({lines: [{description: 'X', quantity: 1, rate: 100}], discount: 500});
  assert.equal(over.total, 0, 'discount never makes the total negative');
  assert.equal(over.discount, 100);
});

test('document numbers are unique and sequential per year', () => {
  assert.equal(nextEstimateNumber([], 2026), 'EST-2026-1');
  const withExisting = [{number: 'EST-2026-4'}, {number: 'EST-2025-9'}];
  assert.equal(nextEstimateNumber(withExisting, 2026), 'EST-2026-5');
  assert.equal(nextEstimateNumber(withExisting, 2027), 'EST-2027-1');
});

test('save estimate requires customer and lines, stores a snapshot', () => {
  const c = saveCustomer('u1', {name: 'Karan Singh', phone: '9998887776', village: 'Barh'});
  assert.throws(() => saveEstimate('u1', {lines: [{description: 'x', quantity: 1, rate: 1}]}), /customer/i);
  assert.throws(() => saveEstimate('u1', {customerId: c.id, lines: []}), /one line/i);
  assert.throws(() => saveEstimate('u1', {customerId: c.id, lines: [{description: '', quantity: 1, rate: 1}]}), /description/i);
  assert.throws(() => saveEstimate('u1', {customerId: c.id, lines: [{description: 'x', quantity: 1, rate: 1.999}]}), /Rate/);
  const est = saveEstimate('u1', {customerId: c.id, lines: [{description: 'Ply board', quantity: '4', rate: '1800'}], transport: '400', discount: '200', businessName: 'Sharma Woodworks'});
  assert.equal(est.number, 'EST-2026-1');
  assert.equal(est.snapshot.customerName, 'Karan Singh');
  assert.equal(est.status, 'draft');
  // change the customer afterwards: the saved snapshot must not change
  saveCustomer('u1', {name: 'Karan Singh Rathore'}, c.id);
  assert.equal(readCollection('u1', 'estimates')[0].snapshot.customerName, 'Karan Singh');
});

test('duplicate creates an independent draft copy with a new number', () => {
  const c = saveCustomer('u2', {name: 'Copy customer'});
  const est = saveEstimate('u2', {customerId: c.id, lines: [{description: 'Bed', quantity: 1, rate: 12000}], status: 'sent'});
  const copy = duplicateEstimate('u2', est.id);
  assert.notEqual(copy.id, est.id);
  assert.notEqual(copy.number, est.number);
  assert.equal(copy.status, 'draft');
  copy.lines[0].rate = 99999;
  assert.equal(readCollection('u2', 'estimates').find(e => e.id === est.id).lines[0].rate, 12000, 'original untouched');
});

test('status transitions validate', () => {
  const c = saveCustomer('u3', {name: 'Status customer'});
  const est = saveEstimate('u3', {customerId: c.id, lines: [{description: 'x', quantity: 1, rate: 10}]});
  assert.throws(() => setEstimateStatus('u3', est.id, 'weird'), /Unknown estimate status/);
  setEstimateStatus('u3', est.id, 'sent');
  assert.equal(readCollection('u3', 'estimates')[0].status, 'sent');
  assert.deepEqual(Object.keys(STATUS_LABELS).sort(), [...ESTIMATE_STATUSES].sort());
});
