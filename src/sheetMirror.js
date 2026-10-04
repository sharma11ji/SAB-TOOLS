import { receiptTotals } from './timberReceipt.js';

// Set from the verified Firebase Authentication UID, never an email or display name.
export const OWNER_UID = (import.meta.env?.VITE_REGISTER_OWNER_UID || '').trim();
export function isRegisterOwner(uid, ownerUid = OWNER_UID) {
  return Boolean(ownerUid && uid && uid !== 'local' && uid === ownerUid);
}

// Public form action and question IDs read from the published form, not secrets.
export const FORM_ENDPOINT = 'https://docs.google.com/forms/d/e/1FAIpQLSc9xQyk-4_lkGYsMaZIBWA2l7pIST6w0aw6WdmthUcltINyOQ/formResponse';
// Legacy question stays in the form for older deployed clients; new saves use these fields.
export const FORM_ENTRIES = Object.freeze({
  date: 'entry.1469168775',
  number: 'entry.2933509',
  customer: 'entry.250548963',
  village: 'entry.1472688288',
  item: 'entry.320633889',
  cft: 'entry.859064317',
  rate: 'entry.1970523742',
  total: 'entry.1585094186',
  paid: 'entry.2092535714',
  balance: 'entry.141457805',
  labour: 'entry.1913979549',
  transport: 'entry.908651231',
});
// One receipt per response. Multiple wood names stay in one Item cell.
const cell = value => String(value ?? '').replace(/[\t\r\n]/g, ' ');
export function receiptFields(record) {
  const totals = receiptTotals(record.rows, record.rate, record.advance, record.labour, record.transport, record.unit);
  if (!totals.valid || !record.id) throw new Error('Invalid receipt');
  const rates = record.rows.map(row => Number(row.rate ?? record.rate));
  const items = [...new Set(record.rows.map(row => cell(row.wood).trim()).filter(Boolean))];
  return Object.fromEntries(Object.entries({
    date: record.date, number: record.number, customer: record.customer, village: record.village,
    item: items.join(', '), cft: totals.unit === 'CBM' ? `${totals.volume.toFixed(4)} CBM` : totals.cft.toFixed(4),
    rate: rates.every(rate => rate === rates[0]) ? (totals.unit === 'CBM' ? `${rates[0]} /CBM` : rates[0]) : 'Mixed',
    total: totals.total.toFixed(2), paid: totals.advance.toFixed(2), balance: totals.balance.toFixed(2),
    labour: totals.labour.toFixed(2), transport: totals.transport.toFixed(2),
  }).map(([key, value]) => [FORM_ENTRIES[key], cell(value)]));
}
// Best-effort append-only mirror. An opaque response is NOT an acknowledgement.
// Re-saving/printing can create duplicate responses. No keys or cookies sent.
export async function mirrorReceipt(record, { enabled, uid, ownerUid = OWNER_UID, fetcher = globalThis.fetch }) {
  if (!enabled || !isRegisterOwner(uid, ownerUid)) return;
  try {
    await fetcher(FORM_ENDPOINT, {
      method: 'POST', mode: 'no-cors', credentials: 'omit',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
      body: new URLSearchParams(receiptFields(record)).toString(),
    });
  } catch {
    // Primary receipt remains saved. No success claim and no automatic retry.
  }
}
