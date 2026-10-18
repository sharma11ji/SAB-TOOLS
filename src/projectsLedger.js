// Projects, materials, labour and financial ledger. All money math runs in
// integer paise so repeated additions never drift. Historical receipt data is
// never touched by this module.
import {readCollection, writeCollection, upsertRecord, removeRecord, uid as newId, nowIso} from './businessStore.js';

export const PROJECT_STATUSES = ['planned', 'in-progress', 'completed', 'archived'];
export const STATUS_LABELS = {planned: 'Planned', 'in-progress': 'In Progress', completed: 'Completed', archived: 'Archived'};
export const MATERIAL_UNITS = ['CFT', 'CBM', 'pieces', 'sq ft', 'r ft', 'kg', 'bags', 'other'];
export const PAYMENT_METHODS = ['cash', 'upi', 'bank', 'other'];
export const TX_TYPES = ['payment', 'material', 'labour', 'other-expense'];

const paise = value => {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n * 100);
};
const rupees = p => Math.round(p) / 100;

export function validateMoney(value, {allowZero = true, max = 100000000} = {}) {
  const raw = String(value ?? '').trim();
  if (raw === '') return allowZero ? {ok: true, value: 0} : {ok: false, error: 'Amount is required.'};
  if (!/^\d+(\.\d{1,2})?$/.test(raw)) return {ok: false, error: 'Amount must be a number with up to 2 decimal places.'};
  const p = paise(raw);
  if (p === null || !Number.isSafeInteger(p)) return {ok: false, error: 'Amount is too large.'};
  if (p === 0 && !allowZero) return {ok: false, error: 'Amount must be more than zero.'};
  if (p > Math.round(max * 100)) return {ok: false, error: 'Amount is above the allowed limit.'};
  return {ok: true, value: rupees(p)};
}

export function validateProject(input) {
  const name = String(input.name || '').trim();
  if (!name) return {ok: false, error: 'Project name is required.'};
  if (name.length > 80) return {ok: false, error: 'Project name is too long (max 80 characters).'};
  if (input.budget !== undefined && String(input.budget).trim() !== '') {
    const check = validateMoney(input.budget, {max: 100000000});
    if (!check.ok) return {ok: false, error: `Budget: ${check.error}`};
  }
  for (const field of ['startDate', 'expectedEnd']) {
    if (input[field] && String(input[field]).trim() && !/^\d{4}-\d{2}-\d{2}$/.test(input[field])) return {ok: false, error: 'Dates must use the date picker format.'};
  }
  if (input.startDate && input.expectedEnd && String(input.expectedEnd) < String(input.startDate)) return {ok: false, error: 'Expected completion cannot be before the start date.'};
  if (input.status && !PROJECT_STATUSES.includes(input.status)) return {ok: false, error: 'Unknown project status.'};
  return {ok: true};
}

export function saveProject(uid, input, existingId) {
  const records = readCollection(uid, 'projects') || [];
  const check = validateProject(input);
  if (!check.ok) throw new Error(check.error);
  const now = nowIso();
  const fields = {
    name: String(input.name).trim(), customerId: input.customerId || '', location: String(input.location || '').trim(),
    notes: String(input.notes || '').trim(), startDate: String(input.startDate || ''), expectedEnd: String(input.expectedEnd || ''),
    completedEnd: String(input.completedEnd || ''), status: input.status || 'planned',
    budget: validateMoney(input.budget === undefined || String(input.budget).trim() === '' ? 0 : input.budget).value
  };
  if (existingId) {
    const current = records.find(record => record.id === existingId);
    if (!current) throw new Error('Project no longer exists. Refresh the list.');
    return upsertRecord(uid, 'projects', {...current, ...fields, updatedAt: now}).find(record => record.id === existingId);
  }
  const record = {id: newId(), ...fields, createdAt: now, updatedAt: now};
  writeCollection(uid, 'projects', [...records, record]);
  return record;
}

export function deleteProject(uid, id) {
  // Deleting a project removes its transactions with it, so the caller must
  // have shown an explicit confirmation dialog before reaching this.
  removeRecord(uid, 'projects', id);
  const txs = (readCollection(uid, 'transactions') || []).filter(tx => tx.projectId !== id);
  writeCollection(uid, 'transactions', txs);
  const mats = (readCollection(uid, 'materials') || []).filter(m => m.projectId !== id);
  writeCollection(uid, 'materials', mats);
  const lab = (readCollection(uid, 'labour') || []).filter(l => l.projectId !== id);
  writeCollection(uid, 'labour', lab);
}

export function archiveProject(uid, id, archived) {
  const records = readCollection(uid, 'projects') || [];
  const current = records.find(record => record.id === id);
  if (!current) throw new Error('Project no longer exists. Refresh the list.');
  const status = archived ? 'archived' : (current.status === 'archived' ? 'planned' : current.status);
  return upsertRecord(uid, 'projects', {...current, status, updatedAt: nowIso()}).find(record => record.id === id);
}

export function saveMaterial(uid, input) {
  if (!input.projectId) throw new Error('Choose a project for this material.');
  const projects = readCollection(uid, 'projects') || [];
  if (!projects.find(project => project.id === input.projectId)) throw new Error('Project no longer exists. Refresh the list.');
  const name = String(input.name || '').trim();
  if (!name) throw new Error('Material name is required.');
  const qtyCheck = validateMoney(input.quantity, {allowZero: false, max: 1000000});
  if (!qtyCheck.ok) return (() => { throw new Error(`Quantity: ${qtyCheck.error}`); })();
  const rateCheck = validateMoney(input.unitPrice, {max: 100000000});
  if (!rateCheck.ok) throw new Error(`Unit price: ${rateCheck.error}`);
  // The total is derived at read time from quantity x unit price in paise. A
  // unit change never rewrites a saved price: unitPrice is stored as entered.
  const record = {id: input.id || newId(), projectId: input.projectId, name, woodType: String(input.woodType || '').trim(), dimensions: String(input.dimensions || '').trim(), quantity: qtyCheck.value, unit: MATERIAL_UNITS.includes(input.unit) ? input.unit : 'pieces', unitPrice: rateCheck.value, supplier: String(input.supplier || '').trim(), purchaseDate: String(input.purchaseDate || ''), notes: String(input.notes || '').trim(), createdAt: input.createdAt || nowIso(), updatedAt: nowIso()};
  return upsertRecord(uid, 'materials', record), record;
}

export function saveLabour(uid, input) {
  if (!input.projectId) throw new Error('Choose a project for this labour entry.');
  const projects = readCollection(uid, 'projects') || [];
  if (!projects.find(project => project.id === input.projectId)) throw new Error('Project no longer exists. Refresh the list.');
  const name = String(input.worker || '').trim();
  if (!name) throw new Error('Worker name is required.');
  const qtyCheck = validateMoney(input.quantity, {allowZero: false, max: 10000});
  if (!qtyCheck.ok) throw new Error(`Days/quantity: ${qtyCheck.error}`);
  const rateCheck = validateMoney(input.rate, {max: 10000000});
  if (!rateCheck.ok) throw new Error(`Rate: ${rateCheck.error}`);
  const record = {id: input.id || newId(), projectId: input.projectId, worker: name, description: String(input.description || '').trim(), quantity: qtyCheck.value, rate: rateCheck.value, paymentStatus: input.paymentStatus === 'paid' ? 'paid' : 'pending', date: String(input.date || ''), notes: String(input.notes || '').trim(), createdAt: input.createdAt || nowIso(), updatedAt: nowIso()};
  return upsertRecord(uid, 'labour', record), record;
}

// Idempotent transaction save: submitting the same client-generated id again
// returns the stored record instead of creating a duplicate payment.
export function saveTransaction(uid, input) {
  if (!input.projectId) throw new Error('Choose a project for this transaction.');
  const projects = readCollection(uid, 'projects') || [];
  if (!projects.find(project => project.id === input.projectId)) throw new Error('Project no longer exists. Refresh the list.');
  if (!TX_TYPES.includes(input.type)) throw new Error('Unknown transaction type.');
  const amountCheck = validateMoney(input.amount, {allowZero: false, max: 100000000});
  if (!amountCheck.ok) throw new Error(amountCheck.error);
  const clientId = input.clientId || input.id || newId();
  const records = readCollection(uid, 'transactions') || [];
  const existing = records.find(tx => tx.clientId === clientId);
  if (existing) return existing; // retry-safe: no duplicate payment
  const record = {id: newId(), clientId, projectId: input.projectId, type: input.type, amount: amountCheck.value, date: String(input.date || ''), method: PAYMENT_METHODS.includes(input.method) ? input.method : '', reference: String(input.reference || '').trim(), notes: String(input.notes || '').trim(), status: 'active', createdAt: nowIso(), updatedAt: nowIso()};
  writeCollection(uid, 'transactions', [...records, record]);
  return record;
}

// Corrections never delete: a transaction is voided with a reason and stays
// in the audit trail.
export function voidTransaction(uid, id, reason) {
  const why = String(reason || '').trim();
  if (why.length < 3) throw new Error('A reason is required to void a transaction.');
  const records = readCollection(uid, 'transactions') || [];
  const current = records.find(tx => tx.id === id);
  if (!current) throw new Error('Transaction no longer exists. Refresh the list.');
  if (current.status === 'voided') throw new Error('This transaction is already voided.');
  return upsertRecord(uid, 'transactions', {...current, status: 'voided', voidReason: why, updatedAt: nowIso()}).find(tx => tx.id === id);
}

export function materialCost(materials) {
  return materials.reduce((sum, m) => sum + Math.round(Number(m.quantity) * paise(m.unitPrice)), 0);
}

export function labourCost(labour) {
  return labour.reduce((sum, l) => sum + Math.round(Number(l.quantity) * paise(l.rate)), 0);
}

// The single source of project money truth: active transactions only.
export function projectTotals(project, transactions, materials, labour) {
  const mine = transactions.filter(tx => tx.projectId === project.id);
  const active = mine.filter(tx => tx.status === 'active');
  const payments = active.filter(tx => tx.type === 'payment').reduce((s, tx) => s + paise(tx.amount), 0);
  const autoMaterial = materialCost(materials.filter(m => m.projectId === project.id));
  const autoLabour = labourCost(labour.filter(l => l.projectId === project.id));
  const materialTx = paiseSum(active, 'material'), labourTx = paiseSum(active, 'labour'), otherTx = paiseSum(active, 'other-expense');
  // Cost per bucket: a recorded expense transaction counts once; material and
  // labour records fill the bucket only when no matching transaction exists,
  // so entries are never double-counted.
  const cost = Math.max(materialTx, autoMaterial) + Math.max(labourTx, autoLabour) + otherTx;
  const paid = payments, outstanding = Math.max(0, cost - paid);
  const budgetP = paise(project.budget || 0);
  return {
    cost: rupees(cost), paid: rupees(paid), outstanding: rupees(outstanding),
    material: rupees(Math.max(materialTx, autoMaterial)), labour: rupees(Math.max(labourTx, autoLabour)),
    other: rupees(otherTx), budgetUsed: budgetP ? Math.round((cost / budgetP) * 100) : null,
    budgetRemaining: budgetP ? rupees(Math.max(0, budgetP - cost)) : null,
    transactionCount: active.length
  };
}
function paiseSum(list, type) { return list.filter(tx => tx.type === type).reduce((s, tx) => s + paise(tx.amount), 0); }

export function transactionHistory(transactions, projectId) {
  return transactions
    .filter(tx => tx.projectId === projectId)
    .sort((a, b) => String(b.date).localeCompare(String(a.date)) || String(b.createdAt).localeCompare(String(a.createdAt)));
}
