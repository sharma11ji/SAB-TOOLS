import test from 'node:test';
import assert from 'node:assert/strict';
class Store { constructor(){this.map=new Map()} getItem(k){return this.map.has(k)?this.map.get(k):null} setItem(k,v){this.map.set(k,String(v))} removeItem(k){this.map.delete(k)} }
globalThis.localStorage = new Store();
globalThis.window = {dispatchEvent: () => {}, addEventListener: () => {}, removeEventListener: () => {}};
globalThis.CustomEvent = class {constructor(){}};
Object.defineProperty(globalThis, 'crypto', {value: {randomUUID: () => 'c-' + Math.random().toString(36).slice(2)}});

const {saveCustomer, searchCustomers, findDuplicates, deleteCustomer, sortCustomers} = await import('../src/businessCustomers.js');
const {readCollection} = await import('../src/businessStore.js');

test('save and reload a customer with timestamps', () => {
  const saved = saveCustomer('u1', {name: 'Ramesh Kumar', phone: '9876543210', village: 'Bhagalpur'});
  assert.ok(saved.id);
  assert.equal(saved.name, 'Ramesh Kumar');
  assert.ok(saved.createdAt && saved.updatedAt);
  assert.equal(readCollection('u1', 'customers').length, 1);
});

test('name is required and phone format is checked', () => {
  assert.throws(() => saveCustomer('u1', {name: ''}), /name is required/i);
  assert.throws(() => saveCustomer('u1', {name: 'X', phone: 'abc'}), /valid mobile/i);
});

test('duplicate detection warns but never merges', () => {
  saveCustomer('u2', {name: 'Suresh', phone: '9812345678'});
  const dupes = findDuplicates(readCollection('u2', 'customers'), {name: 'suresh', phone: ''});
  assert.equal(dupes.length, 1);
  // saving a near-duplicate name is allowed: user decides, nothing merges
  saveCustomer('u2', {name: 'Suresh Yadav', phone: ''});
  assert.equal(readCollection('u2', 'customers').length, 2);
});

test('phone duplicate is found across spelling differences', () => {
  saveCustomer('u3', {name: 'A', phone: '+91 98765 43210'});
  const dupes = findDuplicates(readCollection('u3', 'customers'), {name: '', phone: '9876543210'});
  assert.equal(dupes.length, 1);
});

test('edit keeps stable id and refreshes updatedAt', async () => {
  const saved = saveCustomer('u4', {name: 'Gita Devi'});
  const first = saved.updatedAt;
  await new Promise(r => setTimeout(r, 5));
  const edited = saveCustomer('u4', {name: 'Gita Devi Sharma'}, saved.id);
  assert.equal(edited.id, saved.id);
  assert.notEqual(edited.updatedAt, first);
  assert.equal(readCollection('u4', 'customers').length, 1);
});

test('edit on a missing customer fails clearly', () => {
  assert.throws(() => saveCustomer('u4', {name: 'Ghost'}, 'missing-id'), /no longer exists/i);
});

test('search matches name, village and phone digits', () => {
  const rows = readCollection('u1', 'customers');
  assert.equal(searchCustomers(rows, 'ramesh').length, 1);
  assert.equal(searchCustomers(rows, '98765').length, 1);
  assert.equal(searchCustomers(rows, 'nomatch').length, 0);
});

test('guest and account namespaces are separate', () => {
  saveCustomer('local', {name: 'Guest Only'});
  saveCustomer('acct-123', {name: 'Account Only'});
  assert.equal(readCollection('local', 'customers')[0].name, 'Guest Only');
  assert.equal(readCollection('acct-123', 'customers')[0].name, 'Account Only');
});

test('delete removes exactly one record', () => {
  const saved = saveCustomer('u5', {name: 'To Delete'});
  saveCustomer('u5', {name: 'Keep Me'});
  deleteCustomer('u5', saved.id);
  assert.equal(readCollection('u5', 'customers').length, 1);
});

test('sortCustomers is alphabetical', () => {
  const sorted = sortCustomers([{name: 'Zoya'}, {name: 'Amit'}]);
  assert.equal(sorted[0].name, 'Amit');
});
