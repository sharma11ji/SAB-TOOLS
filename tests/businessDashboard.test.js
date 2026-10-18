import test from 'node:test';
import assert from 'node:assert/strict';
class Store { constructor(){this.map=new Map()} getItem(k){return this.map.has(k)?this.map.get(k):null} setItem(k,v){this.map.set(k,String(v))} removeItem(k){this.map.delete(k)} }
globalThis.localStorage = new Store();
globalThis.window = {dispatchEvent: () => {}, addEventListener: () => {}, removeEventListener: () => {}};
globalThis.CustomEvent = class {constructor(){}};
Object.defineProperty(globalThis, 'crypto', {value: {randomUUID: () => 'd-' + Math.random().toString(36).slice(2)}});

const {saveProject, saveTransaction, voidTransaction} = await import('../src/projectsLedger.js');
const {saveCustomer} = await import('../src/businessCustomers.js');
const {saveEstimate} = await import('../src/estimates.js');
const {dashboardStats} = await import('../src/businessDashboard.js');

test('dashboard counts come only from real records', () => {
  saveCustomer('u1', {name: 'Dash customer'});
  const p1 = saveProject('u1', {name: 'Active', status: 'in-progress', expectedEnd: '2026-12-01'});
  const p2 = saveProject('u1', {name: 'Done', status: 'completed'});
  saveProject('u1', {name: 'Archived', status: 'archived'});
  saveTransaction('u1', {projectId: p1.id, type: 'payment', amount: '2000', clientId: 'd1'});
  saveTransaction('u1', {projectId: p1.id, type: 'material', amount: '700', clientId: 'd2'});
  saveTransaction('u1', {projectId: p2.id, type: 'payment', amount: '5000', clientId: 'd3'});
  const c = saveCustomer('u1', {name: 'Est customer'});
  saveEstimate('u1', {customerId: c.id, lines: [{description: 'x', quantity: 1, rate: 1000}], status: 'sent'});
  const stats = dashboardStats('u1');
  assert.equal(stats.totalCustomers, 2);
  assert.equal(stats.activeProjects.length, 1);
  assert.equal(stats.completedProjects.length, 1, 'archived is neither active nor completed');
  assert.equal(stats.totalPaid, 7000);
  assert.equal(stats.totalCost, 700, 'payments received are not costs');
  assert.equal(stats.totalOutstanding, 0, 'no costs beyond recorded expenses, archived excluded');
  assert.equal(stats.pendingEstimates.length, 1);
  assert.equal(stats.pendingEstimateValue, 1000);
  assert.equal(stats.recentTransactions.length, 3);
  assert.equal(stats.recentTransactions[0].projectName, 'Active');
});

test('voided transactions do not appear in dashboard recent list', () => {
  const p = saveProject('u2', {name: 'Void check'});
  const tx = saveTransaction('u2', {projectId: p.id, type: 'payment', amount: '10', clientId: 'v1'});
  voidTransaction('u2', tx.id, 'wrong entry');
  const stats = dashboardStats('u2');
  assert.equal(stats.recentTransactions.length, 0);
});

test('upcoming deadlines include days left, future only ordering', () => {
  saveProject('u3', {name: 'Soon', status: 'in-progress', expectedEnd: '2026-12-15'});
  saveProject('u3', {name: 'Later', status: 'in-progress', expectedEnd: '2027-02-01'});
  saveProject('u3', {name: 'No date', status: 'in-progress'});
  const stats = dashboardStats('u3', new Date('2026-10-18'));
  assert.equal(stats.upcomingDeadlines.length, 2);
  assert.equal(stats.upcomingDeadlines[0].name, 'Soon');
  assert.ok(Number.isFinite(stats.upcomingDeadlines[0].daysLeft));
});
