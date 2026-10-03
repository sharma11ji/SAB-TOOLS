import {receiptTotals} from './timberReceipt.js';
export const money = value => Number(value).toLocaleString('en-IN', {style:'currency', currency:'INR'});
export function paymentState(receipt) {
 const totals = receiptTotals(receipt.rows, receipt.rate, receipt.advance, receipt.labour, receipt.transport);
 if (!totals.valid) throw new Error('This receipt has invalid amounts. Open it and check the billing details.');
 return {total:totals.total, paid:totals.advance, balance:Math.max(0, totals.balance), status:totals.balance > 0 ? 'pending' : 'paid'};
}
export function assertRevision(current, expected = 0) {
 if ((current?.revision || 0) !== expected) throw new Error('This receipt changed on another screen or device. Reopen it before trying again.');
}
export function paymentOnSave(receipt, choice, paidNow) {
 const {total} = paymentState(receipt);
 if (!['paid','pending'].includes(choice)) throw new Error('Choose Paid or Pending.');
 if (choice === 'paid') return {...receipt, advance:String(Math.max(total, Number(receipt.advance)))};
 if (String(paidNow).trim() === '' || !/^\d+(\.\d{1,2})?$/.test(String(paidNow)) || Number(paidNow) >= total) throw new Error('Enter amount already paid, less than the total (up to 2 decimal places).');
 return {...receipt, advance:String(Number(paidNow))};
}
export function receivedPayment(receipt, amount, expectedRevision, at = new Date().toISOString()) {
 assertRevision(receipt, expectedRevision);
 const state = paymentState(receipt);
 if (!state.balance) throw new Error('This receipt is already paid.');
 if (!/^\d+(\.\d{1,2})?$/.test(String(amount))) throw new Error('Enter a payment with up to 2 decimal places.');
 const paise = Math.round(Number(amount) * 100), due = Math.round(state.balance * 100);
 if (!Number.isSafeInteger(paise) || paise <= 0 || paise > due) throw new Error('Payment must be more than zero and no more than the pending amount.');
 const paid = (Math.round(state.paid*100) + paise)/100, balance = (due-paise)/100;
 return {...receipt, advance:String(paid), balance, paymentStatus:balance ? 'pending' : 'paid', revision:(receipt.revision || 0)+1, lastPaymentAt:at, settledAt:balance ? null : at};
}
