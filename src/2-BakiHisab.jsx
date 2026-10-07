import React, {useEffect, useRef, useState} from 'react';
import {db} from './firebase';
import {watchRecords} from './services/firestoreService';
import {receiptKey, sortReceipts} from './receiptRecords';
import {money, paymentState} from './paymentLedger';
import {recordPayment} from './receiptStorage';
import PaymentDialog from './PaymentDialog';
import {PageHeader,Card,Button,InputField,ResultCard,Segmented,EmptyState} from './ui';
const dateLabel = date => date.split('-').reverse().join('/');
export default function BakiHisab({userId,active}) {
 const [records,setRecords]=useState([]),[loading,setLoading]=useState(true),[error,setError]=useState(''),[message,setMessage]=useState(''),[selected,setSelected]=useState(null),[partial,setPartial]=useState(false),[amount,setAmount]=useState(''),[busy,setBusy]=useState(false),[dialogError,setDialogError]=useState(''),[history,setHistory]=useState(false);
 const saving=useRef(false);
 useEffect(()=>{
  setRecords([]);setLoading(true);setError('');setSelected(null);setMessage('');
  if(!active)return;
  let current=true;
  const accept=data=>{if(!current)return;setRecords(sortReceipts(data));setError('');setLoading(false);};
  if(userId==='local'||!db){
   const read=()=>{try{accept(JSON.parse(localStorage.getItem(receiptKey(userId))||'[]'));}catch{setError('Could not read receipts on this device.');setLoading(false);}};
   read();window.addEventListener('storage',read);window.addEventListener('sab-receipts-changed',read);
   return()=>{current=false;window.removeEventListener('storage',read);window.removeEventListener('sab-receipts-changed',read);};
  }
  const unsubscribe=watchRecords(userId,'history',accept,()=>{if(!current)return;setRecords([]);setLoading(false);setError('Could not load cloud receipts. Check your connection and account permissions.');});
  return()=>{current=false;unsubscribe();};
 },[userId,active]);
 const valid=[],invalid=[];
 for(const receipt of records){try{valid.push({receipt,state:paymentState(receipt)});}catch{invalid.push(receipt);}}
 const pending=valid.filter(item=>item.state.balance>0),paid=valid.filter(item=>item.state.balance===0),shown=history?paid:pending;
 const open=(receipt,isPartial)=>{setSelected(receipt);setPartial(isPartial);setAmount('');setDialogError('');};
 const receive=async()=>{
  if(saving.current)return;
  saving.current=true;setBusy(true);setDialogError('');
  try{const updated=await recordPayment(userId,selected,partial?amount:String(paymentState(selected).balance));setRecords(old=>old.map(item=>item.id===updated.id?updated:item));setMessage(`${selected.customer}: ${money(partial?Number(amount):paymentState(selected).balance)} received.${paymentState(updated).balance ? ` Still pending: ${money(paymentState(updated).balance)}.` : ' Receipt is now paid.'}`);setSelected(null);}
  catch(error){setDialogError(error.message);}
  finally{saving.current=false;setBusy(false);}
 };
 return <section className="baki-tool"><PageHeader title="Baki hisab"/>{userId==='local'&&<p className="hint">On this device only. Sign in for your private cloud record.</p>}
 <ResultCard className="baki-total" items={[{label:`Total pending · ${pending.length} ${pending.length===1?'receipt':'receipts'}`,value:money(pending.reduce((sum,item)=>sum+item.state.balance,0))}]}/>
 <Segmented label="Payment lists" value={history} onChange={setHistory} options={[[false,`Pending (${pending.length})`],[true,`Paid (${paid.length})`]]}/>
 {loading&&<p role="status">Loading receipts...</p>}{error&&<p className="error" role="alert">{error}</p>}{message&&<p className="success" role="status">{message}</p>}{invalid.length>0&&<p className="error">{invalid.length} receipts have invalid amounts and are excluded. Check them in Saved receipts.</p>}
 {!loading&&!error&&!shown.length&&<EmptyState title={history?'No paid receipts yet':'No pending payments'}>{history?'Paid receipts will appear here.':'Receipts saved as Pending will appear here.'}</EmptyState>}
 <div className="saved-list">{shown.map(({receipt,state})=><Card as="article" className="baki-card" key={receipt.id}><div className="baki-card-head"><b>{receipt.customer}</b><span className={`payment-badge ${history?'paid':''}`}>{history?'Paid':'Pending'}</span></div><p className="hint">Receipt #{receipt.number} · {dateLabel(receipt.date)}{receipt.village&&` · ${receipt.village}`}</p><strong className="baki-amount">{money(history?state.paid:state.balance)}</strong><p className="hint">Total {money(state.total)} · Paid {money(state.paid)}</p>{!history&&<div className="baki-actions"><Button variant="primary" onClick={()=>open(receipt,false)}>Mark paid</Button><Button onClick={()=>open(receipt,true)}>Part payment</Button></div>}</Card>)}</div>
 <p className="hint">Payment updates change your receipt and PDF. Existing Google Sheet rows are not changed.</p>
 {selected&&<PaymentDialog title={partial?'Part payment':'Mark as paid?'} busy={busy} onClose={()=>setSelected(null)}><p><b>{selected.customer}</b><br/>Receipt #{selected.number}</p><div className="payment-summary"><span>Pending amount</span><strong>{money(paymentState(selected).balance)}</strong></div>{partial?<InputField label="Amount received now (₹)" autoFocus type="number" inputMode="decimal" min="0.01" step="0.01" max={paymentState(selected).balance} value={amount} onChange={event=>setAmount(event.target.value)}/>:<p>Confirm that you received the full pending amount. This receipt will move to Paid.</p>}{dialogError&&<p className="error" role="alert">{dialogError}</p>}<Button variant="primary" block disabled={busy} onClick={receive} style={{marginTop:'var(--space-4)'}}>{busy?'Saving...':partial?'Save payment':'Yes, payment received'}</Button></PaymentDialog>}
 </section>;
}
