import {paymentState} from './paymentLedger.js';
const clean = value => String(value || '').trim().replace(/\s+/g, ' ').toLowerCase();
export const customerKey = receipt => `${clean(receipt.customer)}|${clean(receipt.village)}`;
export const phoneDigits = value => String(value || '').replace(/\D/g, '');
export const callable = value => { const d = phoneDigits(value); return d.length >= 7 && d.length <= 15; };
// Customers are derived from saved receipts only: nothing new is stored, so nothing can be overwritten.
export function buildCustomers(receipts) {
 const map = new Map(), invalid = [];
 for (const receipt of receipts) {
  let state;
  try { state = paymentState(receipt); } catch { invalid.push(receipt); continue; }
  const key = customerKey(receipt);
  if (!map.has(key)) map.set(key, {key, name:'', village:'', phone:'', phoneAt:'', receipts:[], total:0, pending:0, lastDate:''});
  const c = map.get(key);
  c.receipts.push({receipt, state});
  c.total = Math.round((c.total + state.total) * 100) / 100;
  c.pending = Math.round((c.pending + state.balance) * 100) / 100;
  if (String(receipt.date) >= c.lastDate) { c.lastDate = String(receipt.date); c.name = receipt.customer.trim(); c.village = String(receipt.village || '').trim(); }
  const stamp = String(receipt.savedAt || receipt.date);
  if (receipt.customerMobile && String(receipt.customerMobile).trim() && stamp >= c.phoneAt) { c.phone = String(receipt.customerMobile).trim(); c.phoneAt = stamp; }
 }
 const customers = [...map.values()];
 for (const c of customers) c.receipts.sort((a, b) => String(b.receipt.date).localeCompare(String(a.receipt.date)) || String(b.receipt.savedAt || '').localeCompare(String(a.receipt.savedAt || '')));
 customers.sort((a, b) => b.lastDate.localeCompare(a.lastDate) || a.name.localeCompare(b.name));
 return {customers, invalid};
}
export function filterCustomers(customers, query) {
 const q = clean(query), digits = phoneDigits(query);
 if (!q) return customers;
 return customers.filter(c => clean(c.name).includes(q) || clean(c.village).includes(q) || (digits.length >= 3 && phoneDigits(c.phone).includes(digits)));
}
