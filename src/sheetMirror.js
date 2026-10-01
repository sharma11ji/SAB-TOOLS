import { receiptTotals } from './timberReceipt.js';

export const cleanSheetUrl = value => typeof value === 'string' ? value.trim() : '';
export const validSheetUrl = value => /^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(cleanSheetUrl(value));

export function sheetPayload(record, key) {
  const totals = receiptTotals(record.rows, record.rate, record.advance, record.labour, record.transport);
  if (!totals.valid || !record.id) throw new Error('Invalid receipt');
  const rates = record.rows.map(row => Number(row.rate ?? record.rate));
  return {
    key, id: record.id, date: record.date, receiptNo: record.number,
    customer: record.customer, village: record.village,
    totalCft: totals.cft,
    rate: rates.every(rate => rate === rates[0]) ? rates[0] : 'Mixed',
    totalAmount: totals.total, paid: totals.advance, balance: totals.balance,
  };
}

// Best-effort mirror only. An opaque response is NOT an acknowledgement.
// Key is entered at runtime, never baked into the public bundle. Device setup stores it per account.
export async function mirrorReceipt(record, { endpoint, enabled, key, fetcher = globalThis.fetch }) {
  if (!enabled || !key || !validSheetUrl(endpoint)) return;
  try {
    await fetcher(cleanSheetUrl(endpoint), {
      method: 'POST', mode: 'no-cors', credentials: 'omit',
      headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
      body: JSON.stringify(sheetPayload(record, key)),
    });
  } catch {
    // The primary receipt remains saved. No success claim and no automatic retry.
  }
}
