import test from 'node:test';
import assert from 'node:assert/strict';
class Store { constructor(){this.map=new Map()} getItem(k){return this.map.has(k)?this.map.get(k):null} setItem(k,v){this.map.set(k,String(v))} removeItem(k){this.map.delete(k)} }
globalThis.localStorage = new Store();
globalThis.window = {dispatchEvent: () => {}, addEventListener: () => {}, removeEventListener: () => {}};
globalThis.CustomEvent = class {constructor(){}};
Object.defineProperty(globalThis, 'crypto', {value: {randomUUID: () => 'b-' + Math.random().toString(36).slice(2)}});

const {saveProject, saveTransaction} = await import('../src/projectsLedger.js');
const {saveCustomer} = await import('../src/businessCustomers.js');
const {exportBackup, validateBackupFile, planImport, importBackup} = await import('../src/businessBackup.js');
const {readCollection} = await import('../src/businessStore.js');

test('export produces a versioned backup with counts', () => {
  saveCustomer('u1', {name: 'B Customer'});
  const p = saveProject('u1', {name: 'B Project'});
  saveTransaction('u1', {projectId: p.id, type: 'payment', amount: '500', clientId: 'bk1'});
  const backup = exportBackup('u1');
  assert.equal(backup.app, 'sab-tools-business-backup');
  assert.equal(backup.version, 1);
  assert.equal(backup.recordCount, 3);
  assert.equal(validateBackupFile(backup).ok, true);
});

test('export with no records refuses honestly', () => {
  assert.throws(() => exportBackup('u-empty'), /no records to back up/i);
});

test('validation rejects foreign files, bad records, duplicate ids', () => {
  assert.equal(validateBackupFile({app: 'other'}).ok, false);
  assert.equal(validateBackupFile({app: 'sab-tools-business-backup', version: 99, records: {}}).ok, false);
  assert.equal(validateBackupFile({app: 'sab-tools-business-backup', version: 1, records: {customers: [{id: 'x', name: 'n', createdAt: 't'}, {id: 'x', name: 'n2', createdAt: 't'}]}, }).ok, false, 'duplicate ids inside file');
  assert.equal(validateBackupFile({app: 'sab-tools-business-backup', version: 1, records: {customers: [{name: 'no id'}]}}).ok, false, 'missing id');
  assert.equal(validateBackupFile({app: 'sab-tools-business-backup', version: 1, records: {}}).ok, false, 'empty backup');
});

test('import plan reports additions and skips without writing', () => {
  saveCustomer('u2', {name: 'Existing customer'});
  const backup = exportBackup('u2');
  const plan = planImport('u2', backup);
  assert.equal(plan.ok, true);
  assert.equal(plan.add.customers.length, 0, 'existing id is skipped, not overwritten');
  assert.equal(plan.skipExisting.customers, 1);
  assert.equal(readCollection('u2', 'customers').length, 1, 'nothing written during planning');
});

test('import merges new records and keeps existing ones', () => {
  saveCustomer('u3', {name: 'Keep me'});
  saveProject('u3', {name: 'Proj'});
  const backup = exportBackup('u3');
  backup.records.customers.push({id: 'new-c', name: 'New customer', createdAt: '2026-10-18T00:00:00Z'});
  const result = importBackup('u3', backup);
  assert.equal(result.written.customers, 1);
  assert.equal(result.written.projects, 0);
  const rows = readCollection('u3', 'customers');
  assert.equal(rows.length, 2);
  assert.ok(rows.find(r => r.name === 'Keep me'), 'existing data untouched');
});

test('orphan transactions pointing at unknown projects are dropped on import', () => {
  const backup = {app: 'sab-tools-business-backup', version: 1, exportedAt: 't', records: {transactions: [{id: 'tx1', clientId: 'c1', projectId: 'ghost-project', type: 'payment', amount: 100, status: 'active'}]}};
  const plan = planImport('u4', backup);
  assert.equal(plan.ok, true);
  assert.equal(plan.add.transactions.length, 0);
  assert.equal(plan.orphans, 1);
});

test('imported estimate number collisions get the next free number', () => {
  const backup = {app: 'sab-tools-business-backup', version: 1, exportedAt: 't', records: {
    estimates: [
      {id: 'e1', number: 'EST-2026-1', customerId: 'c', lines: [{description: 'a', quantity: 1, rate: 100}], createdAt: 't'},
      {id: 'e2', number: 'EST-2026-1', customerId: 'c', lines: [{description: 'b', quantity: 1, rate: 200}], createdAt: 't'}
    ]}};
  const plan = planImport('u6', backup);
  assert.equal(plan.ok, true);
  assert.equal(plan.add.estimates.length, 2);
  const numbers = plan.add.estimates.map(e => e.number);
  assert.equal(new Set(numbers).size, 2, 'numbers must be unique after renumbering');
  assert.equal(plan.renumbered, 1);
  const result = importBackup('u6', backup);
  assert.equal(result.written.estimates, 2);
});

test('invalid backup import throws and writes nothing', () => {
  assert.throws(() => importBackup('u5', {app: 'nope'}), /not a SAB TOOLS/);
  assert.equal(readCollection('u5', 'customers').length, 0);
});
