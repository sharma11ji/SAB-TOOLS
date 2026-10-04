import React,{useEffect,useRef,useState} from 'react';
import {accountIdentity} from './accountIdentity';

export default function AccountMenu({user,onLogout,items=[],activeItem,onSelect}){
 const {name,email}=accountIdentity(user);
 const [open,setOpen]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const container=useRef(null),trigger=useRef(null),logoutButton=useRef(null);
 useEffect(()=>{setOpen(false);setError('')},[user.uid]);
 useEffect(()=>{
  if(!open)return;
  (container.current?.querySelector('.menu-item.active')||logoutButton.current)?.focus();
  const outside=e=>{if(!container.current?.contains(e.target))setOpen(false)};
  const escape=e=>{if(e.key==='Escape'){setOpen(false);trigger.current?.focus()}};
  document.addEventListener('pointerdown',outside);
  document.addEventListener('keydown',escape);
  return()=>{document.removeEventListener('pointerdown',outside);document.removeEventListener('keydown',escape)};
 },[open]);
 const signOut=async()=>{setBusy(true);setError('');try{await onLogout();setOpen(false)}catch{setError('Could not log out. Please try again.')}finally{setBusy(false)}};
 return <div className="account-menu" ref={container} onBlur={e=>{if(!e.currentTarget.contains(e.relatedTarget))setOpen(false)}}>
  <button className="account-trigger" ref={trigger} aria-label={`Account menu for ${name}`} aria-expanded={open} aria-controls="account-dropdown" onClick={()=>setOpen(value=>!value)}>
   <svg className="account-hamburger" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16"/></svg>
  </button>
  {open&&<div className="account-dropdown" id="account-dropdown" aria-label="Account options">
   <div className="account-menu-identity"><span className="account-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="8" r="4"/><path d="M4 21v-2a8 8 0 0 1 16 0v2"/></svg></span><div className="account-menu-text"><b>{name}</b><span>{email}</span></div></div>
   {items.length>0&&<div className="menu-items" role="menu" aria-label="Pages">{items.map(([id,label])=><button key={id} role="menuitem" className={"menu-item"+(activeItem===id?" active":"")} aria-current={activeItem===id?"page":undefined} onClick={()=>{onSelect?.(id);setOpen(false);trigger.current?.focus()}}>{label}</button>)}</div>}
   <button className="account-logout" ref={logoutButton} disabled={busy} onClick={signOut}>{busy?'Logging out...':'Log out'}</button>
   {error&&<p className="account-menu-error" role="alert">{error}</p>}
  </div>}
 </div>;
}
