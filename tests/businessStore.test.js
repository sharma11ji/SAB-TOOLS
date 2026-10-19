import test from 'node:test';
import assert from 'node:assert/strict';

// localStorage shim for node:test
class Store { constructor(){this.map=new Map()} getItem(k){return this.map.has(k)?this.map.get(k):null} setItem(k,v){this.map.set(k,String(v))} removeItem(k){this.map.delete(k)} }
globalThis.localStorage = new Store();
const events = [];
globalThis.window = {dispatchEvent: e => events.push(e), addEventListener: () => {}, removeEventListener: () => {}};
globalThis.CustomEvent = class {constructor(type, opts){this.type = type; this.detail = opts?.detail}};
Object.defineProperty(globalThis, 'crypto', {value: {randomUUID: () => 'u-' + Math.random().toString(36).slice(2)}});

const {readCollection, writeCollection, upsertRecord, removeRecord, listAll, COLLECTIONS} = await import('../src/businessStore.js');

test('namespaces are per uid and per collection', () => {
  writeCollection('user-a', 'customers', [{id: '1', name: 'A'}]);
  writeCollection('user-b', 'customers', [{id: '2', name: 'B'}]);
  assert.equal(readCollection('user-a', 'customers').length, 1);
  assert.equal(readCollection('user-b', 'customers').length, 1);
  assert.equal(readCollection('user-a', 'customers')[0].name, 'A');
});

test('corrupt json reads as null, not a crash and not success', () => {
  localStorage.setItem('sab-business-x-customers', '{not json');
  assert.equal(readCollection('x', 'customers'), null);
});

test('unknown collection is rejected', () => {
  assert.throws(() => writeCollection('x', 'nope', []), /Unknown collection/);
  assert.throws(() => readCollection('x', 'nope'), /Unknown collection/);
});

test('upsert replaces by id and keeps others', () => {
  upsertRecord('u', 'projects', {id: 'p1', name: 'old'});
  upsertRecord('u', 'projects', {id: 'p2', name: 'second'});
  upsertRecord('u', 'projects', {id: 'p1', name: 'new'});
  const rows = readCollection('u', 'projects');
  assert.equal(rows.length, 2);
  assert.equal(rows.find(r => r.id === 'p1').name, 'new');
});

test('removeRecord deletes only the target id', () => {
  removeRecord('u', 'projects', 'p2');
  const rows = readCollection('u', 'projects');
  assert.equal(rows.length, 1);
});

test('listAll returns every collection', () => {
  const all = listAll('u');
  for (const c of COLLECTIONS) assert.ok(Array.isArray(all[c]), c);
});

test('quota failure throws a human error, never fake success', () => {
  const original = localStorage.setItem;
  localStorage.setItem = () => { const e = new Error('quota'); e.name = 'QuotaExceededError'; throw e; };
  assert.throws(() => writeCollection('u', 'customers', []), /out of storage|Could not save/s);
  localStorage.setItem = original;
});
