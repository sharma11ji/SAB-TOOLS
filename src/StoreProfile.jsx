import React,{useEffect,useRef,useState} from 'react';
import {db} from './firebase';
import {getRecord,saveProfile} from './firestore';
import {accountIdentity} from './accountIdentity';
import {loadStoreProfile,saveStoreProfile,cleanStoreProfile} from './storeProfile';
import './storeProfile.css';
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
 return <section className="store-profile"><button className="wood-back" onClick={onBack}>‹ &nbsp; Home</button><h1>Profile</h1><form onSubmit={e=>{e.preventDefault();save()}}><div className="store-profile-banner"><span className="store-profile-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="12" cy="8" r="4"/><path d="M4 22v-2a8 8 0 0 1 16 0v2"/></svg></span><div><h2>Store profile</h2><p>Your shop details</p></div><button type="submit" disabled={busy} className="store-save"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M3 3h15l3 3v15H3Z M7 3v6h10V3 M7 21v-7h10v7"/></svg>{busy?'Saving...':'Save'}</button></div><div className="store-profile-fields">{[['storeName','Store Name','text','organization'],['ownerName',"Owner’s Name",'text','name'],['address','Address','text','street-address'],['mobile','Mobile Number','tel','tel']].map(([key,label,type,auto])=><label key={key} htmlFor={`store-profile-${key}`}>{label}{key==='address'?<textarea aria-label={label} id={`store-profile-${key}`} autoComplete={auto} maxLength={500} value={profile[key]} disabled={busy} onChange={e=>{edited.current=true;setProfile({...profile,[key]:e.target.value});setMessage('')}}/>:<input aria-label={label} id={`store-profile-${key}`} type={type} autoComplete={auto} maxLength={150} value={profile[key]} disabled={busy} onChange={e=>{edited.current=true;setProfile({...profile,[key]:e.target.value});setMessage('')}}/>}</label>)}</div></form>{message&&<p className="menu-feedback" role="status">{message}</p>}<div className="store-signin"><span>Signed in as</span><b>{identity.name}</b><small>{identity.email}</small></div><p className="store-storage-note">{cloud?'Saved on this browser and, when available, in your account.':'Saved on this browser only.'} Store profile details do not change existing receipts.</p></section>;
}
