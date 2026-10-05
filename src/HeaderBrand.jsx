import {useEffect,useState} from 'react';
import {headerAvatar,headerName} from './accountIdentity';

export default function HeaderBrand({user,logoSrc}){
 const a=headerAvatar(user),name=headerName(user);
 const [failed,setFailed]=useState(false);
 useEffect(()=>setFailed(false),[a.src]);
 let mark;
 if(a.kind==='logo')mark=<img className="brand-logo" src={logoSrc} alt="SAB TOOLS" width="40" height="40"/>;
 else if(a.kind==='photo'&&!failed)mark=<img className="header-avatar" src={a.src} alt="" width="40" height="40" referrerPolicy="no-referrer" onError={()=>setFailed(true)}/>;
 else mark=<span className="header-avatar header-avatar-initial" aria-hidden="true">{a.initial||'?'}</span>;
 return <div className="header-brand">{mark}<div className="header-text">{name&&<div className="header-name" title={name}>{name}</div>}<div className="tag">Timber CFT and receipts</div></div></div>;
}
