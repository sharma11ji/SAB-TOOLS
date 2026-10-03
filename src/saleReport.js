import {paymentState} from './paymentLedger.js';
import {customerKey} from './customerList.js';
const pad = n => String(n).padStart(2, '0');
export const isoDate = d => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const r2 = n => Math.round(n * 100) / 100;
// Period boundaries are receipt dates (YYYY-MM-DD, local). Week starts Monday.
export function periodRange(period, now = new Date()) {
 const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
 if (period === 'today') return {from:isoDate(today), to:isoDate(today)};
 if (period === 'week') { const back = (today.getDay() + 6) % 7; return {from:isoDate(new Date(today.getFullYear(), today.getMonth(), today.getDate() - back)), to:isoDate(today)}; }
 if (period === 'month') return {from:isoDate(new Date(today.getFullYear(), today.getMonth(), 1)), to:isoDate(today)};
 return null;
}
export function buildReport(receipts, range) {
 const invalid = [], rows = [];
 for (const receipt of receipts) {
  const date = String(receipt.date || '');
  if (range && ((range.from && date < range.from) || (range.to && date > range.to))) continue;
  try { rows.push({receipt, state:paymentState(receipt)}); } catch { invalid.push(receipt); }
 }
 let total = 0, paid = 0, pending = 0;
 const map = new Map();
 for (const {receipt, state} of rows) {
  total += state.total; paid += state.paid; pending += state.balance;
  const key = customerKey(receipt);
  if (!map.has(key)) map.set(key, {key, name:String(receipt.customer || '').trim(), village:String(receipt.village || '').trim(), count:0, total:0, pending:0});
  const c = map.get(key); c.count++; c.total = r2(c.total + state.total); c.pending = r2(c.pending + state.balance);
 }
 const top = [...map.values()].sort((a, b) => b.total - a.total || a.name.localeCompare(b.name));
 return {count:rows.length, total:r2(total), paid:r2(paid), pending:r2(pending), top, invalid};
}
