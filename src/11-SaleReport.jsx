import React, {useEffect, useState} from 'react';
import {db} from './firebase';
import {watchRecords} from './services/firestoreService';
import {receiptKey, sortReceipts} from './receiptRecords';
import {money} from './paymentLedger';
import {PageHeader,Segmented,InputField,ResultCard,EmptyState,SectionHeader} from './ui';
import {buildReport, periodRange, isoDate} from './saleReport';
const label = d => String(d).split('-').reverse().join('/');
const NAMES = {today:'Today', week:'This week', month:'This month', custom:'Custom'};
export default function SaleReport({userId, active}) {
 const [records,setRecords]=useState([]),[loading,setLoading]=useState(true),[error,setError]=useState(''),[period,setPeriod]=useState('month'),[from,setFrom]=useState(''),[to,setTo]=useState('');
 useEffect(()=>{
  setRecords([]);setLoading(true);setError('');
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
 const custom=period==='custom',range=custom?{from,to}:periodRange(period),badRange=custom&&from&&to&&from>to;
 const report=buildReport(records,badRange?{from:'9999',to:'0000'}:range);
 const shownRange=custom?(from||to?`${from?label(from):'start'} to ${to?label(to):'today'}`:'All dates'):range.from===range.to?label(range.from):`${label(range.from)} to ${label(range.to)}`;
 return <section className="report-tool"><PageHeader title="Sale report"/>{userId==='local'&&<p className="hint">On this device only. Sign in for your private cloud record.</p>}
 <Segmented label="Report period" value={period} onChange={setPeriod} options={Object.keys(NAMES).map(k=>[k,NAMES[k]])}/>
 {custom&&<div className="report-dates"><InputField label="From" type="date" value={from} max={to||isoDate(new Date())} onChange={e=>setFrom(e.target.value)}/><InputField label="To" type="date" value={to} min={from} onChange={e=>setTo(e.target.value)}/></div>}
 {badRange&&<p className="error" role="alert">"From" date is after "To" date.</p>}
 <p className="hint report-range">{NAMES[period]} · {shownRange}</p>
 {loading&&<p role="status">Loading receipts...</p>}{error&&<p className="error" role="alert">{error}</p>}{report.invalid.length>0&&<p className="error">{report.invalid.length} receipts have invalid amounts and are not counted. Check them in Saved receipts.</p>}
 <ResultCard items={[{label:`Total business · ${report.count} ${report.count===1?'receipt':'receipts'}`,value:money(report.total)}]}/>
 <ResultCard items={[{label:'Received',value:money(report.paid)},{label:'Baki (pending)',value:money(report.pending)}]}/>
 {!loading&&!error&&!report.count&&<EmptyState title="No receipts in this period"/>}
 {report.top.length>0&&<><SectionHeader title="Top customers"/><ol className="report-top">{report.top.slice(0,5).map(c=><li key={c.key}><span><b>{c.name}</b>{c.village&&<small>{c.village}</small>}<small>{c.count} {c.count===1?'receipt':'receipts'}</small></span><span><b>{money(c.total)}</b>{c.pending>0&&<em>due {money(c.pending)}</em>}</span></li>)}</ol></>}
 <p className="hint">Receipts are counted by receipt date. Payment received later is counted in the original receipt's period.</p></section>;
}
