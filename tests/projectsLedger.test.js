import test from 'node:test';
import assert from 'node:assert/strict';
class Store { constructor(){this.map=new Map()} getItem(k){return this.map.has(k)?this.map.get(k):null} setItem(k,v){this.map.set(k,String(v))} removeItem(k){this.map.delete(k)} }
globalThis.localStorage = new Store();
globalThis.window = {dispatchEvent: () => {}, addEventListener: () => {}, removeEventListener: () => {}};
globalThis.CustomEvent = class {constructor(){}};
Object.defineProperty(globalThis, 'crypto', {value: {randomUUID: () => 'r-' + Math.random().toString(36).slice(2)}});

const {saveProject, saveTransaction, voidTransaction, projectTotals, saveMaterial, saveLabour, deleteProject, archiveProject, validateMoney, transactionHistory, materialCost} = await import('../src/projectsLedger.js');
const {readCollection} = await import('../src/businessStore.js');

test('money validation rejects unsafe values', () => {
  assert.equal(validateMoney('abc').ok, false);
  assert.equal(validateMoney('-5').ok, false);
  assert.equal(validateMoney('1.999').ok, false);
  assert.equal(validateMoney('100000000001').ok, false);
  assert.equal(validateMoney('123.45').ok, true);
  assert.equal(validateMoney('').value, 0);
  assert.equal(validateMoney('', {allowZero: false}).ok, false);
});

test('project CRUD with validation', () => {
  const p = saveProject('u1', {name: 'Wardrobe set', budget: '50000', startDate: '2026-10-01', expectedEnd: '2026-11-01'});
  assert.ok(p.id);
  assert.throws(() => saveProject('u1', {name: ''}), /name is required/i);
  assert.throws(() => saveProject('u1', {name: 'X', budget: 'abc'}), /Budget/);
  assert.throws(() => saveProject('u1', {name: 'X', startDate: '2026-10-10', expectedEnd: '2026-10-01'}), /before the start/i);
  assert.throws(() => saveProject('u1', {name: 'X', status: 'weird'}), /status/i);
});

test('transactions are idempotent by clientId (retry-safe payments)', () => {
  const p = saveProject('u2', {name: 'Door work'});
  const input = {projectId: p.id, type: 'payment', amount: '5000', date: '2026-10-10', method: 'upi', clientId: 'attempt-1'};
  const first = saveTransaction('u2', input);
  const retry = saveTransaction('u2', input);
  assert.equal(first.id, retry.id, 'retry must return the same record');
  assert.equal(readCollection('u2', 'transactions').length, 1);
  assert.throws(() => saveTransaction('u2', {projectId: p.id, type: 'payment', amount: '0'}), /more than zero/i);
  assert.throws(() => saveTransaction('u2', {projectId: p.id, type: 'nope', amount: '10'}), /Unknown transaction/);
});

test('projectTotals: payments, recorded expenses, outstanding, paise precision', () => {
  const p = saveProject('u3', {name: 'Kitchen', budget: '10000'});
  saveTransaction('u3', {projectId: p.id, type: 'payment', amount: '2500.50', clientId: 'pay1'});
  saveTransaction('u3', {projectId: p.id, type: 'payment', amount: '1234.25', clientId: 'pay2'});
  saveTransaction('u3', {projectId: p.id, type: 'material', amount: '3000', clientId: 'm1'});
  saveTransaction('u3', {projectId: p.id, type: 'labour', amount: '1000.25', clientId: 'l1'});
  saveTransaction('u3', {projectId: p.id, type: 'other-expense', amount: '99.99', clientId: 'o1'});
  const t = projectTotals(p, readCollection('u3', 'transactions'), [], []);
  assert.equal(t.paid, 3734.75);
  assert.equal(t.cost, 4100.24);
  assert.equal(t.outstanding, 365.49);
  assert.equal(t.budgetRemaining, 5899.76);
});

test('voided transactions stay in history but leave the totals', () => {
  const p = saveProject('u4', {name: 'Table'});
  const tx = saveTransaction('u4', {projectId: p.id, type: 'payment', amount: '1000', clientId: 'v1'});
  assert.throws(() => voidTransaction('u4', tx.id, ''), /reason is required/i);
  voidTransaction('u4', tx.id, 'entered twice by mistake');
  const t = projectTotals(p, readCollection('u4', 'transactions'), [], []);
  assert.equal(t.paid, 0);
  assert.equal(readCollection('u4', 'transactions').length, 1, 'voided record is kept, not deleted');
  assert.throws(() => voidTransaction('u4', tx.id, 'again'), /already voided/);
});

test('materials compute cost from quantity x unit price in paise', () => {
  const p = saveProject('u5', {name: 'Shelf'});
  saveMaterial('u5', {projectId: p.id, name: 'Ply 19mm', quantity: '3.33', unitPrice: '1650.55', unit: 'CFT'});
  const rows = readCollection('u5', 'materials');
  assert.equal(materialCost(rows), Math.round(3.33 * 165055));
  assert.throws(() => saveMaterial('u5', {projectId: p.id, name: 'X', quantity: '0', unitPrice: '5'}), /more than zero/i);
  assert.throws(() => saveMaterial('u5', {projectId: 'ghost', name: 'X', quantity: '1', unitPrice: '5'}), /no longer exists/i);
});

test('labour entries validate days and rate', () => {
  const p = saveProject('u6', {name: 'Polish'});
  saveLabour('u6', {projectId: p.id, worker: 'Sanjay', quantity: '4', rate: '700'});
  assert.equal(readCollection('u6', 'labour')[0].paymentStatus, 'pending');
  assert.throws(() => saveLabour('u6', {projectId: p.id, worker: '', quantity: '1', rate: '10'}), /name is required/i);
});

test('projectTotals never double counts materials when transactions exist', () => {
  const p = saveProject('u7', {name: 'Bed'});
  saveMaterial('u7', {projectId: p.id, name: 'Wood', quantity: '2', unitPrice: '500', unit: 'CFT'});
  const rows = readCollection('u7', 'materials');
  const t1 = projectTotals(p, [], rows, []);
  assert.equal(t1.material, 1000, 'material records count when no material transactions exist');
  saveTransaction('u7', {projectId: p.id, type: 'material', amount: '1500', clientId: 'mt1'});
  const t2 = projectTotals(p, readCollection('u7', 'transactions'), rows, []);
  assert.equal(t2.material, 1500, 'recorded transaction wins over auto-calc (no double count)');
  assert.equal(t2.cost, 1500);
});

test('deleteProject removes its transactions too, after explicit confirmation upstream', () => {
  const p = saveProject('u8', {name: 'Gone'});
  saveTransaction('u8', {projectId: p.id, type: 'payment', amount: '10', clientId: 'x1'});
  saveProject('u8', {name: 'Keep'});
  deleteProject('u8', p.id);
  assert.equal(readCollection('u8', 'transactions').length, 0);
  assert.equal(readCollection('u8', 'projects').length, 1);
});

test('archive and restore', () => {
  const p = saveProject('u9', {name: 'Cabinet'});
  archiveProject('u9', p.id, true);
  assert.equal(readCollection('u9', 'projects')[0].status, 'archived');
  archiveProject('u9', p.id, false);
  assert.equal(readCollection('u9', 'projects')[0].status, 'planned');
});

test('transaction history is newest first and scoped to the project', () => {
  const a = saveProject('u10', {name: 'A'}), b = saveProject('u10', {name: 'B'});
  saveTransaction('u10', {projectId: a.id, type: 'payment', amount: '10', date: '2026-10-01', clientId: 'h1'});
  saveTransaction('u10', {projectId: a.id, type: 'payment', amount: '20', date: '2026-10-05', clientId: 'h2'});
  saveTransaction('u10', {projectId: b.id, type: 'payment', amount: '30', date: '2026-10-06', clientId: 'h3'});
  const history = transactionHistory(readCollection('u10', 'transactions'), a.id);
  assert.equal(history.length, 2);
  assert.equal(history[0].date, '2026-10-05');
});

test('cost includes material and labour records when no matching transactions exist', () => {
  const p = saveProject('u11', {name: 'Records only'});
  saveMaterial('u11', {projectId: p.id, name: 'Wood', quantity: '2', unitPrice: '500', unit: 'CFT'});
  saveLabour('u11', {projectId: p.id, worker: 'Worker', quantity: '1', rate: '300'});
  const rows = readCollection('u11', 'materials'), lab = readCollection('u11', 'labour');
  const t = projectTotals(p, [], rows, lab);
  assert.equal(t.cost, 1300, 'material 1000 + labour 300, not zero');
  assert.equal(t.outstanding, 1300);
  // partial: a material expense transaction for the same work is not double-counted
  saveTransaction('u11', {projectId: p.id, type: 'material', amount: '1200', clientId: 'mm1'});
  const t2 = projectTotals(p, readCollection('u11', 'transactions'), rows, lab);
  assert.equal(t2.material, 1200, 'recorded transaction wins the bucket');
  assert.equal(t2.cost, 1500, '1200 material + 300 labour, counted once each');
});

test('guest and account ledgers are isolated', () => {
  const g = saveProject('local', {name: 'Guest project'});
  const a = saveProject('acct-9', {name: 'Account project'});
  assert.notEqual(g.id, a.id);
  assert.equal(readCollection('local', 'projects').length, 1);
  assert.equal(readCollection('acct-9', 'projects').length, 1);
});
