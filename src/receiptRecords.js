import { receiptTotals } from './timberReceipt.js';
export const receiptKey = uid => `sab-tools-saved-receipts-v1:${uid}`;
export function validReceipt(value) {
  return value && ['shop', 'shopAddress', 'mobile', 'number', 'date', 'customer', 'village', 'rate', 'advance', 'labour', 'transport'].every(field => typeof value[field] === 'string') && Array.isArray(value.rows) && value.rows.length > 0 && value.rows.length <= 500 && value.rows.every(row => row && ['wood', 'length', 'girth', 'rate'].every(field => typeof row[field] === 'string'));
}
export function receiptRecord(receipt, id) {
  if (!validReceipt(receipt)) throw new Error('Invalid receipt.');
  const totals = receiptTotals(receipt.rows, receipt.rate, receipt.advance, receipt.labour, receipt.transport, receipt.unit);
  if (!totals.valid || !receipt.shop.trim() || !receipt.number.trim() || !receipt.customer.trim() || !receipt.date) throw new Error('Complete all receipt details first.');
  return { ...receipt, id, type: 'receipt', savedAt: new Date().toISOString(), unit: totals.unit, volume: totals.volume, cft: totals.cft, total: totals.total, balance: totals.balance };
}
export function sortReceipts(records) {
  return records.filter(record => record.type === 'receipt' && validReceipt(record)).sort((a, b) => String(b.savedAt || b.date).localeCompare(String(a.savedAt || a.date)));
}
