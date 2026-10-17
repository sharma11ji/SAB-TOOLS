import React, {useEffect, useState} from 'react';
import {db} from './firebase';
import {watchRecords} from './services/firestoreService';
import {receiptKey, sortReceipts} from './receiptRecords';
import {money} from './paymentLedger';
import {PageHeader,Card,InputField,ResultCard,EmptyState} from './ui';
import {buildCustomers, filterCustomers, callable, phoneDigits} from './customerList';
const dateLabel = date => String(date).split('-').reverse().join('/');
const shortDate = date => {const p=String(date).split('-');return p.length===3?`${p[2]}/${p[1]}/${p[0].slice(2)}`:date;};
export default function CustomerList({userId, active}) {
 const [records,setRecords]=useState([]),[loading,setLoading]=useState(true),[error,setError]=useState(''),[query,setQuery]=useState(''),[openKey,setOpenKey]=useState(null);
 useEffect(()=>{
  setRecords([]);setLoading(true);setError('');setOpenKey(null);setQuery('');
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
 const {customers,invalid}=buildCustomers(records),shown=filterCustomers(customers,query);
 const business=customers.reduce((sum,c)=>sum+c.total,0),pending=customers.reduce((sum,c)=>sum+c.pending,0);
 return <section className="customer-tool"><PageHeader title="Customer list"/>{userId==='local'&&<p className="hint">On this device only. Sign in for your private cloud record.</p>}
 <ResultCard items={[{label:`${customers.length} ${customers.length===1?'customer':'customers'} · Total business`,value:money(business)},{label:'Pending',value:money(pending)}]}/>
 <InputField label="Search customer" type="search" placeholder="Name, village or phone" value={query} onChange={e=>setQuery(e.target.value)}/>
 {loading&&<p role="status">Loading receipts...</p>}{error&&<p className="error" role="alert">{error}</p>}{invalid.length>0&&<p className="error">{invalid.length} receipts have invalid amounts and are not counted. Check them in Saved receipts.</p>}
 {!loading&&!error&&!customers.length&&<EmptyState title="No customers yet">Save a receipt and the customer appears here.</EmptyState>}
 {!loading&&!error&&customers.length>0&&!shown.length&&<EmptyState title="No customer matches your search"/>}
 <div className="saved-list">{shown.map(c=>{const isOpen=openKey===c.key;return <Card as="article" className="baki-card customer-card" key={c.key}><button className="customer-head" aria-expanded={isOpen} onClick={()=>setOpenKey(isOpen?null:c.key)}><span className="customer-name"><b>{c.name}</b>{c.village&&<small>{c.village}</small>}</span><span className={`payment-badge ${c.pending?'':'paid'}`}>{c.pending?`Pending ${money(c.pending)}`:'No pending'}</span></button>
 <p className="hint">{c.phone?(callable(c.phone)?<a className="customer-phone" href={`tel:${c.phone.replace(/[^\d+]/g,'')}`}>Phone: {c.phone}</a>:<span>Phone: {c.phone}</span>):'Phone not added'}</p>
 <div className="customer-stats"><span>Receipts<b>{c.receipts.length}</b></span><span>Total business<b>{money(c.total)}</b></span><span>Last receipt<b>{shortDate(c.lastDate)}</b></span></div>
 {isOpen&&<ul className="customer-receipts">{c.receipts.map(({receipt,state})=><li key={receipt.id}><span>#{receipt.number} · {dateLabel(receipt.date)}</span><span>{money(state.total)}{state.balance>0&&<em> · due {money(state.balance)}</em>}</span></li>)}</ul>}</Card>;})}</div>
 </section>;
}
