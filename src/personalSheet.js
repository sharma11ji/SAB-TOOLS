import {GoogleAuthProvider, reauthenticateWithPopup} from 'firebase/auth';
import {collection, doc, getDoc, getDocs, runTransaction, serverTimestamp} from 'firebase/firestore';
import {auth, db} from './firebase';
import {deliverSerially, DELIVERY_PAUSED} from './sheetDelivery.js';
import {SHEET_SCOPE, createPersonalSheet, writeSheetRow} from './personalSheetApi';
const tokens = new Map(); // Never persisted in localStorage or Firestore.
const configRef = uid => doc(db,'users',uid);
const rowsRef = uid => collection(db,'users',uid,'preferences');
const historyRef = uid => collection(db,'users',uid,'history');
const assertUser = uid => {
  if (!auth?.currentUser || auth.currentUser.uid !== uid || !db) throw new Error('Sign in to your own account first.');
};
export async function readPersonalSheet(uid) {
  assertUser(uid);
  return (await getDoc(configRef(uid))).data()?.personalSheet || null;
}
async function authorizeSheet(uid) {
  assertUser(uid);
  const user=auth.currentUser;
  if (!user.providerData.some(p=>p.providerId==='google.com')) throw new Error('Use Google sign-in to connect a personal Sheet.');
  const provider=new GoogleAuthProvider(); provider.addScope(SHEET_SCOPE);
  provider.setCustomParameters({login_hint:user.email,include_granted_scopes:'true'});
  // Reauthentication rejects another Firebase identity, rather than switching accounts.
  const result=await reauthenticateWithPopup(user,provider);
  assertUser(uid);
  const token=GoogleAuthProvider.credentialFromResult(result)?.accessToken;
  if (!token) throw new Error('Google did not return Sheet access. Try connecting again.');
  tokens.set(uid,token);
  return token;
}
export async function connectPersonalSheet(uid) {
  const token=await authorizeSheet(uid);
  let config=await readPersonalSheet(uid);
  if (!config) {
    // Durable one-time provisioning lock across devices. Never auto-expire a
    // lock: a timed-out create may already have produced a Sheet in Google.
    const attempt=crypto.randomUUID();
    await runTransaction(db,async tx=>{
      const profile=await tx.get(configRef(uid));
      if(profile.data()?.personalSheet) return;
      if(profile.data()?.sheetProvisioning) throw new Error('Sheet setup is already in progress or needs recovery. Do not create another Sheet.');
      tx.set(configRef(uid),{sheetProvisioning:{attempt,startedAt:serverTimestamp()}},{merge:true});
    });
    config=await readPersonalSheet(uid);
    if(!config) {
      try {
        const sheet=await createPersonalSheet(token);
        if (!sheet.spreadsheetId || !sheet.spreadsheetUrl) throw new Error('Google did not return the new Sheet.');
        config={uid,spreadsheetId:sheet.spreadsheetId,url:sheet.spreadsheetUrl,nextRow:2,enabled:true};
        await runTransaction(db,async tx=>{
          const profile=await tx.get(configRef(uid));
          if(profile.data()?.sheetProvisioning?.attempt!==attempt) throw new Error('Provisioning lock changed.');
          tx.set(configRef(uid),{personalSheet:config,sheetProvisioning:null},{merge:true});
        });
      } catch(error) {
        const link=config?.url ? ` Sheet created at ${config.url}.` : '';
        throw new Error(`Setup needs recovery.${link} ${error.message} Do not reconnect to create another Sheet until this is checked.`);
      }
    }
  }
  if (config.uid !== uid) throw new Error('Sheet account mismatch. Nothing was sent.');
  await runTransaction(db,async tx=>{
    const profile=await tx.get(configRef(uid));
    const current=profile.data()?.personalSheet;
    if(current?.uid!==uid) throw new Error('Sheet account mismatch.');
    tx.update(configRef(uid),{'personalSheet.enabled':true});
  });
  await flushPersonalSheet(uid);
  return {...config,enabled:true};
}
export async function stopPersonalSheet(uid) {
  assertUser(uid); const config=await readPersonalSheet(uid);
  if(config) await runTransaction(db,async tx=>{
    const profile=await tx.get(configRef(uid));
    if(profile.data()?.personalSheet?.uid!==uid) throw new Error('Sheet account mismatch.');
    tx.update(configRef(uid),{'personalSheet.enabled':false});
  });
  tokens.delete(uid);
}
export async function queuePersonalReceipt(uid, record) {
  assertUser(uid);
  if (!/^[a-zA-Z0-9_-]+$/.test(record.id)) throw new Error('Invalid receipt ID.');
  const ref=doc(rowsRef(uid),`sheet-row-${record.id}`);
  const queued=await runTransaction(db,async tx=>{
    const [profile,row]=await Promise.all([tx.get(configRef(uid)),tx.get(ref)]);
    const config=profile.data()?.personalSheet;
    if (!config?.enabled) return false;
    if(config.uid!==uid) throw new Error('Sheet account mismatch. Nothing was sent.');
    const allocated=row.data()?.row || config.nextRow;
    if(!Number.isInteger(allocated)||allocated<2) throw new Error('Invalid Sheet setup.');
    if(!row.exists()) tx.set(configRef(uid),{personalSheet:{...config,nextRow:allocated+1}},{merge:true});
    tx.set(ref,{row:allocated,record,pending:true,version:(row.data()?.version||0)+1,
      createdAt:row.data()?.createdAt||serverTimestamp(),updatedAt:serverTimestamp()});
    return true;
  });
  if (queued) {
    await flushPersonalSheet(uid);
    if((await getDoc(ref)).data()?.pending) throw new Error('Receipt is queued. Reconnect Google to finish syncing.');
  }
  return queued;
}
// Recovery never clears the old writer's lock. A replacement destination fences
// a delayed old PUT away from the new register. The retired record is preserved.
export async function replacePersonalSheet(uid) {
  const token=await authorizeSheet(uid);
  const attempt=crypto.randomUUID();
  const retiredRef=doc(rowsRef(uid),`retired-sheet-${attempt}`);
  await runTransaction(db,async tx=>{
    const profile=await tx.get(configRef(uid));
    const data=profile.data(),config=data?.personalSheet;
    if(config?.uid!==uid) throw new Error('No personal register to replace.');
    if(data.sheetRecovery) throw new Error('Register recovery is already in progress or needs support. No new Sheet was created.');
    tx.set(retiredRef,{config,deliveryLock:data.sheetDelivery||null,retiredAt:serverTimestamp()});
    tx.update(configRef(uid),{sheetRecovery:{attempt,previousId:config.spreadsheetId,startedAt:serverTimestamp()}});
    return config;
  });
  let sheet;
  try {
    sheet=await createPersonalSheet(token);
    if(!sheet.spreadsheetId || !sheet.spreadsheetUrl) throw new Error('Google did not return the replacement Sheet.');
    await runTransaction(db,async tx=>{
      const profile=await tx.get(configRef(uid));
      if(profile.data()?.sheetRecovery?.attempt!==attempt) throw new Error('Recovery state changed.');
      const current=profile.data()?.personalSheet;
      tx.update(configRef(uid),{personalSheet:{...current,spreadsheetId:sheet.spreadsheetId,url:sheet.spreadsheetUrl,enabled:true},sheetDelivery:null,'sheetRecovery.replacementId':sheet.spreadsheetId});
    });
    const history=await getDocs(historyRef(uid));
    for(const saved of history.docs) {
      // Read each source again transactionally. Saving remains available while
      // recovery runs; queue updates and row allocation use the same profile.
      await runTransaction(db,async tx=>{
        const rowRef=doc(rowsRef(uid),`sheet-row-${saved.id}`);
        const [profile,latest,row]=await Promise.all([tx.get(configRef(uid)),tx.get(saved.ref),tx.get(rowRef)]);
        const config=profile.data()?.personalSheet;
        if(profile.data()?.sheetRecovery?.attempt!==attempt || config?.spreadsheetId!==sheet.spreadsheetId) throw new Error('Recovery state changed.');
        if(!latest.exists()) return;
        const allocated=row.data()?.row||config.nextRow;
        if(!Number.isInteger(allocated)||allocated<2) throw new Error('Invalid register row.');
        if(!row.exists())tx.update(configRef(uid),{'personalSheet.nextRow':allocated+1});
        tx.set(rowRef,{row:allocated,record:{...latest.data(),id:saved.id},pending:true,version:(row.data()?.version||0)+1,createdAt:row.data()?.createdAt||serverTimestamp(),updatedAt:serverTimestamp()});
      });
    }
    await runTransaction(db,async tx=>{
      const profile=await tx.get(configRef(uid));
      if(profile.data()?.sheetRecovery?.attempt!==attempt) throw new Error('Recovery state changed.');
      tx.update(configRef(uid),{sheetRecovery:null});
    });
    // A hung old request may still occupy this device's local promise. Its
    // destination is retired, so let the replacement acquire its own lock.
    flushing.delete(uid);
    await flushPersonalSheet(uid);
    return await readPersonalSheet(uid);
  } catch(error) {
    const link=sheet?.spreadsheetUrl?` Replacement Sheet: ${sheet.spreadsheetUrl}.`:'';
    throw new Error(`Register recovery stopped.${link} ${error.message} Do not create another replacement. Cloud receipts stay safe; support must check the stored recovery state.`);
  }
}
const flushing=new Map();
export async function flushPersonalSheet(uid) {
  if(flushing.has(uid)) return flushing.get(uid);
  const job=(async()=>{
    assertUser(uid);
    const token=tokens.get(uid);
    if(!token) throw new Error('Reconnect Google to send pending receipts. Your cloud receipts are safe.');
    await deliverSerially({
      acquire:()=>runTransaction(db,async tx=>{
        const profile=await tx.get(configRef(uid));
        const config=profile.data()?.personalSheet;
        if(!config?.enabled) return null;
        if(config.uid!==uid) throw new Error('Sheet account mismatch. Nothing was sent.');
        if(profile.data()?.sheetDelivery || profile.data()?.sheetRecovery) throw new Error(DELIVERY_PAUSED);
        const lock={attempt:crypto.randomUUID(),spreadsheetId:config.spreadsheetId,startedAt:serverTimestamp()};
        tx.update(configRef(uid),{sheetDelivery:lock});
        return lock;
      }),
      check:async lock=>{
        assertUser(uid);
        if(tokens.get(uid)!==token) throw new Error('Google session changed. Reconnect to send pending receipts.');
        const profile=(await getDoc(configRef(uid))).data();
        if(profile?.sheetRecovery || profile?.sheetDelivery?.attempt!==lock.attempt || profile?.personalSheet?.spreadsheetId!==lock.spreadsheetId) throw new Error(DELIVERY_PAUSED);
      },
      next:async lock=>{
        const profile=(await getDoc(configRef(uid))).data();
        if(!profile?.personalSheet?.enabled) return null;
        const rows=await getDocs(rowsRef(uid));
        // Read current pending rows anew after each acknowledged write. A newer
        // version queued during an older write is sent next by this one writer.
        const row=rows.docs.find(r=>r.id.startsWith('sheet-row-') && (r.data().pending || r.data().deliveredDestination!==lock.spreadsheetId));
        return row ? {ref:row.ref,...row.data()} : null;
      },
      write:(lock,row)=>writeSheetRow(lock.spreadsheetId,row.row,row.record,token),
      acknowledge:(lock,row)=>runTransaction(db,async tx=>{
        const [profile,latest]=await Promise.all([tx.get(configRef(uid)),tx.get(row.ref)]);
        if(profile.data()?.sheetRecovery || profile.data()?.sheetDelivery?.attempt!==lock.attempt || profile.data()?.personalSheet?.spreadsheetId!==lock.spreadsheetId) throw new Error(DELIVERY_PAUSED);
        if(latest.data()?.version===row.version) tx.update(row.ref,{pending:false,deliveredDestination:lock.spreadsheetId,updatedAt:serverTimestamp()});
      }),
      release:lock=>runTransaction(db,async tx=>{
        const profile=await tx.get(configRef(uid));
        if(profile.data()?.sheetDelivery?.attempt===lock.attempt) tx.update(configRef(uid),{sheetDelivery:null});
      }),
    });
  })();
  flushing.set(uid,job);
  try {await job;} finally {if(flushing.get(uid)===job)flushing.delete(uid);}
}
export function forgetSheetToken(uid) {tokens.delete(uid);}
