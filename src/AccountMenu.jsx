import React,{useEffect,useRef,useState} from 'react';
import {accountIdentity} from './accountIdentity';

export default function AccountMenu({user,onLogout}){
 const {name,initials,photoURL,email}=accountIdentity(user);
 const [open,setOpen]=useState(false),[photoFailed,setPhotoFailed]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const container=useRef(null),trigger=useRef(null),logoutButton=useRef(null);
 useEffect(()=>{setOpen(false);setPhotoFailed(false);setError('')},[user.uid,photoURL]);
 useEffect(()=>{
  if(!open)return;
  logoutButton.current?.focus();
  const outside=e=>{if(!container.current?.contains(e.target))setOpen(false)};
  const escape=e=>{if(e.key==='Escape'){setOpen(false);trigger.current?.focus()}};
  document.addEventListener('pointerdown',outside);
  document.addEventListener('keydown',escape);
  return()=>{document.removeEventListener('pointerdown',outside);document.removeEventListener('keydown',escape)};
 },[open]);
 const signOut=async()=>{setBusy(true);setError('');try{await onLogout();setOpen(false)}catch{setError('Could not log out. Please try again.')}finally{setBusy(false)}};
 return <div className="account-menu" ref={container} onBlur={e=>{if(!e.currentTarget.contains(e.relatedTarget))setOpen(false)}}>
  <button className="account-trigger" ref={trigger} aria-label={`Account menu for ${name}`} aria-expanded={open} aria-controls="account-dropdown" onClick={()=>setOpen(value=>!value)}>
   <span className="account-avatar" aria-hidden="true">{photoURL&&!photoFailed?<img src={photoURL} alt="" referrerPolicy="no-referrer" onError={()=>setPhotoFailed(true)}/>:initials}</span>
   <span className="account-details"><span className="account-name" title={name}>{name}</span><span className="signed-in-account" aria-label="Signed-in account" title={email}>{email}</span></span>
   <span className="account-chevron" aria-hidden="true">▾</span>
  </button>
  {open&&<div className="account-dropdown" id="account-dropdown" aria-label="Account options">
   <div className="account-menu-identity"><b>{name}</b><span>{email}</span></div>
   <button className="account-logout" ref={logoutButton} disabled={busy} onClick={signOut}>{busy?'Logging out...':'Log out'}</button>
   {error&&<p className="account-menu-error" role="alert">{error}</p>}
  </div>}
 </div>;
}
