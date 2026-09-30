import React, {useEffect, useState} from "react";
import {firebaseReady} from "./firebase";
import {authError,initAuthPersistence,loginEmail,loginGoogle,logout,registerEmail,resetPassword,watchAuth} from "./authService";
import TimberReceipt from "./TimberReceipt";
import {email} from "./validation";

export default function App(){
 const [user,setUser]=useState(null),[loading,setLoading]=useState(true),[authMode,setAuthMode]=useState("login"),[tab,setTab]=useState("Home"),[online,setOnline]=useState(navigator.onLine);
 useEffect(()=>{initAuthPersistence().catch(()=>{});return watchAuth(u=>{setUser(u);setLoading(false)})},[]);
 useEffect(()=>{const update=()=>setOnline(navigator.onLine);addEventListener("online",update);addEventListener("offline",update);return()=>{removeEventListener("online",update);removeEventListener("offline",update)}},[]);
 if(loading)return <div className="splash"><b>SAB TOOLS</b><span>Checking secure session...</span></div>;
 if(!user&&firebaseReady)return <AuthScreen mode={authMode} setMode={setAuthMode} online={online}/>;
 return <div className="app"><header><div><div className="brand">SAB TOOLS</div><div className="tag">लकड़ी CFT और रसीद</div></div><div className="headerRight"><span className={"status "+(online?"on":"off")}>{online?"Online":"Offline"}</span>{user&&<button className="user" onClick={()=>logout()}>लॉग आउट</button>}</div></header><main>
 {!firebaseReady&&<p className="hint local-mode-banner">स्थानीय मोड: Firebase उपलब्ध नहीं है। रसीद इस डिवाइस पर बनाई जा सकती है।</p>}
 <div hidden={tab!=="Home"}><h1>आपके टूल</h1><div className="grid"><button className="card" onClick={()=>setTab("Receipt")}><b>लकड़ी रसीद / Timber CFT</b><span>लकड़ी का माप और बिल</span><small>2304 सूत्र · हिंदी रसीद · प्रिंट / PDF</small></button></div></div>
 <div hidden={tab!=="Receipt"}><TimberReceipt key={user?.uid||"local"} userId={user?.uid||"local"}/></div>
 </main><nav style={{gridTemplateColumns:"repeat(2,1fr)"}}><button className={tab==="Home"?"active":""} onClick={()=>setTab("Home")}>होम</button><button className={tab==="Receipt"?"active":""} onClick={()=>setTab("Receipt")}>रसीद / CFT</button></nav></div>;
}

function AuthScreen({mode,setMode,online}){
 const[busy,setBusy]=useState(false),[error,setError]=useState(""),[message,setMessage]=useState(""),[form,setForm]=useState({name:"",email:"",password:""});
 const submit=async e=>{e.preventDefault();setError("");setMessage("");const er=email(form.email);if(!er.ok)return setError(er.error);if(mode!=="reset"&&form.password.length<6)return setError("Password must be at least 6 characters.");setBusy(true);try{if(mode==="signup")await registerEmail(form);else if(mode==="reset"){await resetPassword(form.email);setMessage("Password reset email sent. Check your inbox.");}else await loginEmail(form.email,form.password)}catch(e){setError(authError(e))}finally{setBusy(false)}};
 return <div className="authPage"><div className="authCard"><div className="brand dark">SAB TOOLS</div><p>Smart Tools for Carpenters & Furniture Workers</p>{!firebaseReady&&<div className="error">Cloud saving is unavailable because Firebase is not configured for this deployment.</div>}{!online&&<div className="error">You are offline. Sign-in requires a connection.</div>}{error&&<div className="error">{error}</div>}{message&&<div className="success">{message}</div>}{mode!=="login"&&mode!=="reset"&&<label>Name<input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required/></label>}<label>Email<input type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} required/></label>{mode!=="reset"&&<label>Password<input type="password" minLength="6" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} required/></label>}<button className="primary wide" disabled={busy||!online||!firebaseReady} onClick={submit}>{busy?"Please wait...":mode==="signup"?"Create account":mode==="reset"?"Send reset email":"Login"}</button>{mode==="login"&&<button className="google" disabled={busy||!online||!firebaseReady} onClick={async()=>{setError("");setBusy(true);try{await loginGoogle()}catch(e){setError(authError(e))}finally{setBusy(false)}}}>Continue with Google</button>}<div className="authLinks">{mode!=="login"&&<button onClick={()=>setMode("login")}>Back to Login</button>}{mode==="login"&&<><button onClick={()=>setMode("signup")}>Create account</button><button onClick={()=>setMode("reset")}>Forgot password?</button></>}</div></div></div>
}
