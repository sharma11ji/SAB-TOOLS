import {GoogleAuthProvider, reauthenticateWithPopup} from 'firebase/auth';
import {collection, doc, getDoc, getDocs, runTransaction, serverTimestamp, setDoc} from 'firebase/firestore';
import {auth, db} from './firebase';
import {SHEET_SCOPE, createPersonalSheet, writeSheetRow} from './personalSheetApi';
const tokens = new Map(); // Never persisted in localStorage or Firestore.
const configRef = uid => doc(db,'users',uid);
const rowsRef = uid => collection(db,'users',uid,'preferences');
const assertUser = uid => {
  if (!auth?.currentUser || auth.currentUser.uid !== uid || !db) throw new Error('Sign in to your own account first.');
};
export async function readPersonalSheet(uid) {
  assertUser(uid);
  return (await getDoc(configRef(uid))).data()?.personalSheet || null;
}
export async function connectPersonalSheet(uid) {
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
const flushing=new Map();
export async function flushPersonalSheet(uid) {
  if(flushing.has(uid)) return flushing.get(uid);
  const job=(async()=>{
    assertUser(uid); const config=await readPersonalSheet(uid);
    if(!config?.enabled) return;
    if(config.uid!==uid) throw new Error('Sheet account mismatch. Nothing was sent.');
    const token=tokens.get(uid);
    if(!token) throw new Error('Reconnect Google to send pending receipts. Your cloud receipts are safe.');
    const rows=await getDocs(rowsRef(uid));
    for(const row of rows.docs) {
      const data=row.data();
      if(!row.id.startsWith('sheet-row-') || !data.pending) continue;
      assertUser(uid);
      // Recheck stop-state before each network write. Already in-flight writes cannot be recalled.
      if(!(await readPersonalSheet(uid))?.enabled) return;
      await writeSheetRow(config.spreadsheetId,data.row,data.record,token);
      await runTransaction(db,async tx=>{
        const latest=await tx.get(row.ref);
        if(latest.data()?.version===data.version) tx.update(row.ref,{pending:false,updatedAt:serverTimestamp()});
      });
    }
  })();
  flushing.set(uid,job);
  try {await job;} finally {flushing.delete(uid);}
}
export function forgetSheetToken(uid) {tokens.delete(uid);}
