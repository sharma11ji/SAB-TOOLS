// Estimates and quotations. Each estimate stores a snapshot of customer and
// line-item data, so later edits to customer details or saved prices never
// change an estimate that was already sent.
import {readCollection, writeCollection, upsertRecord, uid as newId, nowIso} from './businessStore.js';
import {validateMoney} from './projectsLedger.js';

export const ESTIMATE_STATUSES = ['draft', 'sent', 'accepted', 'rejected', 'expired'];
export const STATUS_LABELS = {draft: 'Draft', sent: 'Sent', accepted: 'Accepted', rejected: 'Rejected', expired: 'Expired'};

function lineCheck(line) {
  const description = String(line.description || '').trim();
  if (!description) return {ok: false, error: 'Every line needs a description.'};
  const qty = validateMoney(line.quantity, {allowZero: false, max: 1000000});
  if (!qty.ok) return {ok: false, error: `Quantity: ${qty.error}`};
  const rate = validateMoney(line.rate, {max: 100000000});
  if (!rate.ok) return {ok: false, error: `Rate: ${rate.error}`};
  return {ok: true, line: {description, quantity: qty.value, rate: rate.value, unit: String(line.unit || '')}};
}

function lineTotalPaise(line) { return Math.round(Number(line.quantity) * Math.round(Number(line.rate) * 100)); }

export function estimateTotals(estimate) {
  const lines = (estimate.lines || []).map(line => ({...line, total: Math.round(lineTotalPaise(line)) / 100}));
  const subtotal = lines.reduce((sum, line) => sum + lineTotalPaise(line), 0);
  const transport = Math.round(Number(estimate.transport || 0) * 100);
  const discount = Math.min(Math.round(Number(estimate.discount || 0) * 100), subtotal);
  const total = Math.max(0, subtotal + transport - discount);
  return {lines, subtotal: Math.round(subtotal) / 100, transport: Math.round(transport) / 100, discount: Math.round(discount) / 100, total: Math.round(total) / 100};
}

// Unique, collision-free document numbers: EST-<year>-<seq> where seq is the
// highest stored sequence for that year plus one, with a time suffix guard if
// a number was somehow imported from another device.
export function nextEstimateNumber(records, year) {
  const prefix = `EST-${year}-`;
  let max = 0;
  for (const record of records) {
    const n = String(record.number || '');
    if (n.startsWith(prefix)) { const seq = Number(n.slice(prefix.length)); if (Number.isFinite(seq) && seq > max) max = seq; }
  }
  return `${prefix}${max + 1}`;
}

export function validateEstimate(input) {
  if (!String(input.customerId || '').trim()) return {ok: false, error: 'Choose a customer for this estimate.'};
  if (!(input.lines || []).length) return {ok: false, error: 'Add at least one line item.'};
  for (const line of input.lines) {
    const check = lineCheck(line);
    if (!check.ok) return {ok: false, error: check.error};
  }
  for (const field of ['transport', 'discount']) {
    const check = validateMoney(input[field] === undefined ? 0 : input[field], {max: 100000000});
    if (!check.ok) return {ok: false, error: `${field === 'transport' ? 'Transport charge' : 'Discount'}: ${check.error}`};
  }
  if (input.status && !ESTIMATE_STATUSES.includes(input.status)) return {ok: false, error: 'Unknown estimate status.'};
  return {ok: true};
}

export function saveEstimate(uid, input, existingId) {
  const records = readCollection(uid, 'estimates') || [];
  const check = validateEstimate(input);
  if (!check.ok) throw new Error(check.error);
  const customers = readCollection(uid, 'customers') || [];
  const customer = customers.find(c => c.id === input.customerId);
  if (!customer) throw new Error('Customer no longer exists. Refresh the list and choose again.');
  const now = nowIso();
  const snapshot = {
    customerName: customer.name, customerPhone: customer.phone || '', customerVillage: customer.village || '',
    customerAddress: customer.address || '',
    businessName: String(input.businessName || '').trim(), businessPhone: String(input.businessPhone || '').trim(),
    terms: String(input.terms || '').trim(), notes: String(input.notes || '').trim()
  };
  const fields = {
    customerId: input.customerId, projectId: input.projectId || '', status: input.status || 'draft',
    lines: input.lines.map(line => lineCheck(line).line), transport: validateMoney(input.transport === undefined ? 0 : input.transport).value,
    discount: validateMoney(input.discount === undefined ? 0 : input.discount).value,
    estimateDate: String(input.estimateDate || ''), validUntil: String(input.validUntil || ''), snapshot, updatedAt: now
  };
  if (existingId) {
    const current = records.find(record => record.id === existingId);
    if (!current) throw new Error('Estimate no longer exists. Refresh the list.');
    return upsertRecord(uid, 'estimates', {...current, ...fields}).find(record => record.id === existingId);
  }
  const record = {id: newId(), number: nextEstimateNumber(records, new Date().getFullYear()), createdAt: now, ...fields};
  writeCollection(uid, 'estimates', [...records, record]);
  return record;
}

export function duplicateEstimate(uid, id) {
  const records = readCollection(uid, 'estimates') || [];
  const current = records.find(record => record.id === id);
  if (!current) throw new Error('Estimate no longer exists. Refresh the list.');
  const copy = {id: newId(), number: nextEstimateNumber(records, new Date().getFullYear()), createdAt: nowIso(), updatedAt: nowIso(), status: 'draft', estimateDate: '', validUntil: '', customerId: current.customerId, projectId: current.projectId, lines: JSON.parse(JSON.stringify(current.lines)), transport: current.transport, discount: current.discount, snapshot: JSON.parse(JSON.stringify(current.snapshot))};
  writeCollection(uid, 'estimates', [...records, copy]);
  return copy;
}

export function setEstimateStatus(uid, id, status) {
  if (!ESTIMATE_STATUSES.includes(status)) throw new Error('Unknown estimate status.');
  const records = readCollection(uid, 'estimates') || [];
  const current = records.find(record => record.id === id);
  if (!current) throw new Error('Estimate no longer exists. Refresh the list.');
  return upsertRecord(uid, 'estimates', {...current, status, updatedAt: nowIso()}).find(record => record.id === id);
}
