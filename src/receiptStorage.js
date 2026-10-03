import {doc, runTransaction, serverTimestamp} from 'firebase/firestore';
import {db} from './firebase';
import {receiptKey} from './receiptRecords';
import {assertRevision, receivedPayment, paymentState} from './paymentLedger';
const localRecords = uid => JSON.parse(localStorage.getItem(receiptKey(uid)) || '[]');
const writeLocal = (uid, record, old) => {
 localStorage.setItem(receiptKey(uid), JSON.stringify([record, ...old.filter(item => item.id !== record.id)]));
 window.dispatchEvent(new Event('sab-receipts-changed'));
};
export async function storeReceipt(uid, record, expectedRevision = 0) {
 const data = {...record, paymentStatus:paymentState(record).status, revision:expectedRevision+1};
 if (uid === 'local' || !db) {
  const old = localRecords(uid); assertRevision(old.find(item=>item.id===record.id), expectedRevision);
  writeLocal(uid, data, old);
  return 'Receipt saved on this device only. This is not a cloud backup.';
 }
 if (!navigator.onLine) throw new Error('You are offline. Save a draft and try cloud saving when online.');
 await runTransaction(db, async transaction => {
  const ref = doc(db,'users',uid,'history',record.id), snapshot = await transaction.get(ref);
  const current = snapshot.exists() ? snapshot.data() : null;
  assertRevision(current, expectedRevision);
  const {id, ...fields} = data;
  transaction.set(ref, {...fields, createdAt:current?.createdAt || serverTimestamp(), updatedAt:serverTimestamp()});
 });
 return 'Receipt saved to your cloud account.';
}
export async function recordPayment(uid, receipt, amount) {
 if (uid === 'local' || !db) {
  const old = localRecords(uid), current = old.find(item=>item.id===receipt.id);
  if (!current) throw new Error('Receipt no longer exists. Refresh the list.');
  const updated = receivedPayment(current, amount, receipt.revision || 0);
  writeLocal(uid, updated, old); return updated;
 }
 if (!navigator.onLine) throw new Error('You are offline. Connect before recording a payment.');
 return runTransaction(db, async transaction => {
  const ref = doc(db,'users',uid,'history',receipt.id), snapshot = await transaction.get(ref);
  if (!snapshot.exists()) throw new Error('Receipt no longer exists. Refresh the list.');
  const updated = receivedPayment({id:receipt.id,...snapshot.data()}, amount, receipt.revision || 0);
  transaction.update(ref, {advance:updated.advance, balance:updated.balance, paymentStatus:updated.paymentStatus, revision:updated.revision, lastPaymentAt:updated.lastPaymentAt, settledAt:updated.settledAt, updatedAt:serverTimestamp()});
  return updated;
 });
}
