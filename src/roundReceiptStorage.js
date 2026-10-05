import {doc, runTransaction, serverTimestamp} from 'firebase/firestore';
import {db} from './firebase';
import {receiptKey} from './receiptRecords';
import {validRoundReceipt,saveRoundReceiptLocal} from './roundReceipt';
// Same Saved history, a separate snapshot type. Never call the payment/Sheet save flow.
export async function storeRoundReceipt(uid,record) {
 if(!validRoundReceipt(record)||!record.id)throw new Error('Invalid round wood receipt.');
 if(uid==='local'||!db){saveRoundReceiptLocal(localStorage,uid,record,receiptKey(uid));window.dispatchEvent(new Event('sab-receipts-changed'));return 'Saved on this device only. Clearing site data deletes it.';}
 if(!navigator.onLine)throw new Error('You are offline. Connect and try saving again. You can still download the PNG.');
 await runTransaction(db,async tx=>{const ref=doc(db,'users',uid,'history',record.id),old=await tx.get(ref);if(old.exists())return;const {id,...snapshot}=record;tx.set(ref,{...snapshot,createdAt:serverTimestamp(),updatedAt:serverTimestamp()});});
 return 'Saved to your cloud account. Open it later from Saved.';
}
