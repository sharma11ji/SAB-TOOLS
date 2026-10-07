import React,{useEffect,useRef,useState} from 'react';
import {db} from './firebase';
import {getRecord,saveProfile} from './firestore';
import {accountIdentity} from './accountIdentity';
import {loadStoreProfile,saveStoreProfile,cleanStoreProfile} from './storeProfile';
import './storeProfile.css';
import {PageHeader,Card,Button,InputField} from './ui';
export default function StoreProfile({user,onBack}) {
 const uid=user?.uid||'local',cloud=Boolean(user&&db),identity=user?accountIdentity(user):{name:'Local mode',email:'Not signed in'};
 const [profile,setProfile]=useState(()=>loadStoreProfile(localStorage,uid).profile),[busy,setBusy]=useState(false),[message,setMessage]=useState('');
 const edited=useRef(false);
 useEffect(()=>{
  let current=true;const cached=loadStoreProfile(localStorage,uid);
  if(cloud&&!cached.pendingCloud)getRecord(uid,[]).then(record=>{if(current&&!edited.current&&record?.storeProfile){const next=cleanStoreProfile(record.storeProfile);setProfile(next);try{saveStoreProfile(localStorage,uid,next)}catch{setMessage('Loaded from your account. Browser storage is unavailable.')}}}).catch(()=>{if(current)setMessage('Using this browser’s saved details. Account details could not be loaded.');});
  return()=>{current=false};
 },[uid,cloud]);
 const save=async()=>{
  edited.current=true;const next=Object.fromEntries(Object.entries(profile).map(([key,value])=>[key,value.trim()]));
  try{saveStoreProfile(localStorage,uid,next,cloud);setProfile(next)}catch{setMessage('Could not save in this browser. Your changes are still on this page.');return}
  if(!cloud){setMessage('Store profile saved in this browser.');return}
  setBusy(true);setMessage('Saved in this browser. Saving to your account...');
  try{await saveProfile(uid,{storeProfile:next});try{saveStoreProfile(localStorage,uid,next,false)}catch{}setMessage('Store profile saved in this browser and your account.');}
  catch{setMessage('Saved in this browser only. Account save failed. Tap Save to try again.');}
  finally{setBusy(false)}
 };
 return <section className="store-profile"><PageHeader title="Profile" onBack={onBack} backLabel="Home"/><form onSubmit={e=>{e.preventDefault();save()}}><Card variant="info" className="store-profile-banner" style={{display:'flex',alignItems:'center',gap:'var(--space-3)',marginBottom:'var(--space-4)'}}><span className="store-profile-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="12" cy="8" r="4"/><path d="M4 22v-2a8 8 0 0 1 16 0v2"/></svg></span><div><h2 style={{margin:0}}>Store profile</h2><p className="ui-hint" style={{margin:0}}>Your shop details</p></div></Card><Card className="store-profile-fields"><div className="ui-stack" style={{gap:'var(--space-3)'}}>{[['storeName','Store Name','text','organization'],['ownerName',"Owner’s Name",'text','name'],['address','Address','text','street-address'],['mobile','Mobile Number','tel','tel']].map(([key,label,type,auto])=><InputField key={key} id={`store-profile-${key}`} label={label} multiline={key==='address'} type={key==='address'?undefined:type} autoComplete={auto} maxLength={key==='address'?500:150} value={profile[key]} disabled={busy} onChange={e=>{edited.current=true;setProfile({...profile,[key]:e.target.value});setMessage('')}}/>)}</div></Card><Button variant="primary" block type="submit" disabled={busy} className="store-save" style={{marginTop:'var(--space-4)'}}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M3 3h15l3 3v15H3Z M7 3v6h10V3 M7 21v-7h10v7"/></svg>{busy?'Saving...':'Save'}</Button></form>{message&&<p className="menu-feedback" role="status" style={{marginTop:'var(--space-3)'}}>{message}</p>}<div className="store-signin"><span>Signed in as</span><b>{identity.name}</b><small>{identity.email}</small></div><p className="ui-hint" style={{margin:'var(--space-3) 0 0'}}>{cloud?'Saved on this browser and, when available, in your account.':'Saved on this browser only.'} Store profile details do not change existing receipts.</p></section>;
}
