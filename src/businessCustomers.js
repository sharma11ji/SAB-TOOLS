// Stored local customers. Deliberately separate from the receipt-derived
// customer list in customerList.js: receipt customers stay derived from saved
// receipts and are never touched by this module.
import {readCollection, writeCollection, upsertRecord, removeRecord, uid, nowIso} from './businessStore.js';

const clean = value => String(value || '').trim().replace(/\s+/g, ' ');
const digits = value => String(value || '').replace(/\D/g, '');
// Phone comparison ignores country codes: the last 10 digits are the match key.
const phoneKey = value => { const d = digits(value); return d.length > 10 ? d.slice(-10) : d; };

export function validateCustomer(input) {
  const name = clean(input.name);
  if (!name) return {ok: false, error: 'Customer name is required.'};
  if (name.length > 60) return {ok: false, error: 'Customer name is too long (max 60 characters).'};
  const phone = clean(input.phone);
  if (phone && !/^[+\d][\d\s-]{5,17}$/.test(phone)) return {ok: false, error: 'Enter a valid mobile number.'};
  if (clean(input.village).length > 60) return {ok: false, error: 'Village name is too long (max 60 characters).'};
  if (clean(input.address).length > 200) return {ok: false, error: 'Address is too long (max 200 characters).'};
  if (clean(input.notes).length > 500) return {ok: false, error: 'Notes are too long (max 500 characters).'};
  return {ok: true};
}

// Warn (never merge) when the same name or phone already exists.
export function findDuplicates(records, input, ignoreId) {
  const phone = phoneKey(input.phone), name = clean(input.name).toLowerCase();
  return records.filter(record => record.id !== ignoreId && (
    (name && clean(record.name).toLowerCase() === name) ||
    (phone.length >= 7 && phoneKey(record.phone) === phone)
  ));
}

export function saveCustomer(uid, input, existingId) {
  const records = readCollection(uid, 'customers') || [];
  const check = validateCustomer(input);
  if (!check.ok) throw new Error(check.error);
  const now = nowIso();
  if (existingId) {
    const current = records.find(record => record.id === existingId);
    if (!current) throw new Error('Customer no longer exists. Refresh the list.');
    const updated = {...current, name: clean(input.name), phone: clean(input.phone), village: clean(input.village), address: clean(input.address), notes: clean(input.notes), updatedAt: now};
    return upsertRecord(uid, 'customers', updated).find(record => record.id === existingId);
  }
  const record = {id: uid2(), name: clean(input.name), phone: clean(input.phone), village: clean(input.village), address: clean(input.address), notes: clean(input.notes), createdAt: now, updatedAt: now};
  const next = [...records, record];
  writeCollection(uid, 'customers', next);
  return record;
}

function uid2() { return uid(); }

export function deleteCustomer(uid, id) {
  return removeRecord(uid, 'customers', id);
}

export function searchCustomers(records, query) {
  const q = clean(query).toLowerCase(), d = digits(query);
  if (!q) return records;
  return records.filter(record =>
    clean(record.name).toLowerCase().includes(q) ||
    clean(record.village).toLowerCase().includes(q) ||
    clean(record.address).toLowerCase().includes(q) ||
    (d.length >= 3 && digits(record.phone).includes(d))
  );
}

export function sortCustomers(records) {
  return [...records].sort((a, b) => clean(a.name).localeCompare(clean(b.name)));
}
