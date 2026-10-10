import React,{useEffect,useState} from 'react';
import {Button} from './ui';
import {connectPersonalSheet,readPersonalSheet,stopPersonalSheet,forgetSheetToken,replacePersonalSheet} from './personalSheet';
export default function PersonalSheetSetup({userId,message,onMessage}) {
 const [config,setConfig]=useState(null),[busy,setBusy]=useState(false),[recoveryReview,setRecoveryReview]=useState(false);
 useEffect(()=>{let active=true;readPersonalSheet(userId).then(c=>{if(active)setConfig(c)}).catch(e=>onMessage(e.message));return()=>{active=false;forgetSheetToken(userId)}},[userId]);
 const connect=async()=>{setBusy(true);try{const c=await connectPersonalSheet(userId);setConfig(c);onMessage('Your Google Sheet is connected. Pending rows were sent.');}catch(e){try{setConfig(await readPersonalSheet(userId))}catch{}onMessage(e.message)}finally{setBusy(false)}};
 return <details className="form sheet-mirror"><summary>Your Google Sheet register</summary>
 <p className="hint">Create a private register in the Google account you use to sign in. Google asks permission for files this app creates, not all your spreadsheets. Your receipts never go to another shop's register. No Form or manual setup is needed.</p>
 <p className="hint">Cloud saving stays the main backup. Google access expires: reconnect after reopening the app or when asked. Only one device sends at a time. If a send has no confirmed response, sync stops safely instead of retrying or unlocking after a timer. Pending receipts stay in your cloud account. Reconnect sends them when no blocked delivery needs recovery. Saving again updates the same register row. Past receipts are not copied automatically. Do not insert, delete or reorder register rows: the app uses their positions to update receipts.</p>
 <Button disabled={busy} onClick={connect}>{busy?'Connecting...':config?'Reconnect Google and send pending receipts':'Connect my Google Sheet'}</Button>
 {config?.url&&<p><a href={config.url} target="_blank" rel="noreferrer">Open my register</a></p>}
 {config?.enabled&&<Button disabled={busy} onClick={async()=>{setBusy(true);try{await stopPersonalSheet(userId);setConfig({...config,enabled:false});onMessage('Sheet sync stopped. Cloud saving continues. Pending rows stay saved until you reconnect.');}catch(e){onMessage(e.message)}finally{setBusy(false)}}}>Stop Sheet sync</Button>}
 {config&&<Button disabled={busy} onClick={()=>setRecoveryReview(true)}>Review replacement register recovery</Button>}
 {recoveryReview&&<div role="region" aria-label="Replacement register review"><p>Recovery creates a NEW private Google Sheet in your signed-in account and copies your latest cloud receipts to it. The old Sheet is kept, not deleted or unlocked. A delayed send from another device may still reach the old Sheet, so use only the new link after recovery. No new register is made by ordinary reconnect. If replacement setup is interrupted, stop and ask for help; do not make another replacement.</p><Button disabled={busy} onClick={async()=>{setBusy(true);try{const c=await replacePersonalSheet(userId);setConfig(c);setRecoveryReview(false);onMessage('Replacement register connected. Use its new link; the old Sheet is kept.');}catch(e){try{setConfig(await readPersonalSheet(userId))}catch{}onMessage(e.message)}finally{setBusy(false)}}}>Create replacement private Sheet and copy my cloud receipts</Button><Button disabled={busy} onClick={()=>setRecoveryReview(false)}>Cancel recovery</Button></div>}
 {message&&<p role="status">{message}</p>}
 </details>;
}
