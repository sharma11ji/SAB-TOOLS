import { receiptTotals } from './timberReceipt.js';

// Public form action and question ID read from the published form, not secrets.
export const FORM_ENDPOINT = 'https://docs.google.com/forms/d/e/1FAIpQLSc9xQyk-4_lkGYsMaZIBWA2l7pIST6w0aw6WdmthUcltINyOQ/formResponse';
export const FORM_ENTRY = 'entry.1178599720';
// One physical TSV line: names containing tabs/newlines must not create columns.
const cell = value => String(value ?? '').replace(/[\t\r\n]/g, ' ');
export function receiptLine(record) {
  const totals = receiptTotals(record.rows, record.rate, record.advance, record.labour, record.transport);
  if (!totals.valid || !record.id) throw new Error('Invalid receipt');
  const rates = record.rows.map(row => Number(row.rate ?? record.rate));
  return [record.date, record.number, record.customer, record.village,
    totals.cft.toFixed(4), rates.every(rate => rate === rates[0]) ? rates[0] : 'Mixed',
    totals.total.toFixed(2), totals.advance.toFixed(2), totals.balance.toFixed(2)].map(cell).join('\t');
}
// Best-effort append-only mirror. An opaque response is NOT an acknowledgement.
// Re-saving/printing can create duplicate responses. No keys or cookies sent.
export async function mirrorReceipt(record, { enabled, fetcher = globalThis.fetch }) {
  if (!enabled) return;
  try {
    await fetcher(FORM_ENDPOINT, {
      method: 'POST', mode: 'no-cors', credentials: 'omit',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
      body: new URLSearchParams({ [FORM_ENTRY]: receiptLine(record) }).toString(),
    });
  } catch {
    // Primary receipt remains saved. No success claim and no automatic retry.
  }
}
