import React, {useEffect, useState} from 'react';
import {db} from './firebase';
import {watchRecords} from './services/firestoreService';
import {receiptKey, sortReceipts} from './receiptRecords';
import {money} from './paymentLedger';
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
 return <section className="report-tool"><h1>Sale report</h1>{userId==='local'&&<p className="hint">On this device only. Sign in for your private cloud record.</p>}
 <div className="tabs report-tabs" aria-label="Report period">{Object.keys(NAMES).map(k=><button key={k} aria-pressed={period===k} onClick={()=>setPeriod(k)}>{NAMES[k]}</button>)}</div>
 {custom&&<div className="report-dates"><label className="payment-input">From<input type="date" value={from} max={to||isoDate(new Date())} onChange={e=>setFrom(e.target.value)}/></label><label className="payment-input">To<input type="date" value={to} min={from} onChange={e=>setTo(e.target.value)}/></label></div>}
 {badRange&&<p className="error" role="alert">"From" date is after "To" date.</p>}
 <p className="hint report-range">{NAMES[period]} · {shownRange}</p>
 {loading&&<p role="status">Loading receipts...</p>}{error&&<p className="error" role="alert">{error}</p>}{report.invalid.length>0&&<p className="error">{report.invalid.length} receipts have invalid amounts and are not counted. Check them in Saved receipts.</p>}
 <div className="result baki-total"><span>Total business · {report.count} {report.count===1?'receipt':'receipts'}</span><strong>{money(report.total)}</strong></div>
 <div className="report-split"><div className="report-box received"><span>Received</span><strong>{money(report.paid)}</strong></div><div className="report-box pending"><span>Baki (pending)</span><strong>{money(report.pending)}</strong></div></div>
 {!loading&&!error&&!report.count&&<p className="empty">No receipts in this period.</p>}
 {report.top.length>0&&<><h2 className="report-h">Top customers</h2><ol className="report-top">{report.top.slice(0,5).map(c=><li key={c.key}><span><b>{c.name}</b>{c.village&&<small>{c.village}</small>}<small>{c.count} {c.count===1?'receipt':'receipts'}</small></span><span><b>{money(c.total)}</b>{c.pending>0&&<em>due {money(c.pending)}</em>}</span></li>)}</ol></>}
 <p className="hint">Receipts are counted by receipt date. Payment received later is counted in the original receipt's period.</p></section>;
}
