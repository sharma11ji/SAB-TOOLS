import CuttingOptimizer from './CuttingOptimizer';
import UpdateNotifications from "./UpdateNotifications";
import HeaderBrand from "./HeaderBrand";
import React, {useEffect, useState} from "react";
import {buildHash,parseHash,pushRoute,initHistory} from "./navHistory.js";
import {firebaseReady} from "./firebase";
import {authError,initAuthPersistence,loginEmail,loginGoogle,logout,registerEmail,resetPassword,watchAuth} from "./authService";
import RoundReceiptView from './RoundReceiptView';
import TimberReceipt from "./TimberReceipt";
import BakiHisab from "./BakiHisab";
import CustomerList from "./CustomerList";
import SaleReport from "./SaleReport";
import AccountMenu from "./AccountMenu";
import MenuPage from "./MenuPages";
import {SavedReceipts, LevelTool} from "./ReceiptTools";
import {email} from "./validation";
import WoodCalculator,{WoodHome} from "./WoodCalculators";

const MIN_SPLASH_MS=1500;
function Splash({ready}){
 const [minDone,setMinDone]=useState(false),[gone,setGone]=useState(false);
 useEffect(()=>{const t=setTimeout(()=>setMinDone(true),MIN_SPLASH_MS);return()=>clearTimeout(t)},[]);
 const fade=ready&&minDone;
 useEffect(()=>{if(!fade)return;const t=setTimeout(()=>setGone(true),500);return()=>clearTimeout(t)},[fade]);
 if(gone)return null;
 const base=import.meta.env.BASE_URL;
 return <div className={"splash-overlay"+(fade?" fade":"")} role="status" aria-label="Loading"><img className="splash-logo" src={base+"icons/1-timber-logo.png"} alt="" width="104" height="104"/><div className="splash-bar"><i/></div><small className="splash-text">Loading...</small></div>;
}

export default function App(){
 const [calculator,setCalculator]=useState({kind:"size",system:"imperial"});
 const openCalculator=(kind,system)=>{const calc={kind,system};setCalculator(calc);pushRoute(buildHash("Wood",calc));setTabRaw("Wood");window.scrollTo(0,0)};
 const [user,setUser]=useState(null),[loading,setLoading]=useState(true),[authMode,setAuthMode]=useState("login"),[tab,setTabRaw]=useState(()=>{const p=parseHash(location.hash);return p.tab}),[online,setOnline]=useState(navigator.onLine),[openedReceipt,setOpenedReceipt]=useState(null);
 const setTab=t=>{pushRoute(buildHash(t));setTabRaw(t)};
 useEffect(()=>{const p=parseHash(location.hash);if(p.calc)setCalculator(p.calc);initHistory(p);const onPop=()=>{const q=parseHash(location.hash);if(q.calc)setCalculator(q.calc);setTabRaw(q.tab)};addEventListener("popstate",onPop);return()=>removeEventListener("popstate",onPop)},[]);
 useEffect(()=>{initAuthPersistence().catch(()=>{});let first=true;return watchAuth(u=>{setOpenedReceipt(null);if(!first){history.replaceState({sab:1},"","#/home");setTabRaw("Home")}first=false;setUser(u);setLoading(false)})},[]);
 useEffect(()=>{const update=()=>setOnline(navigator.onLine);addEventListener("online",update);addEventListener("offline",update);return()=>{removeEventListener("online",update);removeEventListener("offline",update)}},[]);
 const splash=<Splash ready={!loading}/>;
 if(loading)return <>{splash}{null}</>;
 if(!user&&firebaseReady)return <>{splash}<AuthScreen mode={authMode} setMode={setAuthMode} online={online}/></>;
 return <>{splash}<div className="app"><header><HeaderBrand user={user} logoSrc={`${import.meta.env.BASE_URL}icons/1-timber-logo.png`}/><div className="headerRight"><span className={"status "+(online?"on":"off")}>{online?"Online":"Offline"}</span>{user&&<div aria-label="Signed-in account"><AccountMenu key={user.uid} user={user} onLogout={logout} items={[["Home","Home"],["SizeWood","Size wood"],["FlushDoor","Flush door"],["RoundImperial","Round wood (ft/in)"],["RoundMetric","Round wood (metric)"],["Cutting","Cutting optimizer"],["Receipt","Receipt"],["Saved","Saved"],["Baki","Baki hisab"],["Customers","Customers"],["Report","Report"],["Level","Level"]]} activeItem={tab} onSelect={id=>id==="SizeWood"?openCalculator("size","imperial"):id==="FlushDoor"?openCalculator("door","imperial"):id==="RoundImperial"?openCalculator("round","imperial"):id==="RoundMetric"?openCalculator("round","metric"):setTab(id)}/></div>}</div></header><main>
 {!firebaseReady&&<p className="hint local-mode-banner">Local mode: Firebase is unavailable. You can create and save receipts on this device.</p>}
 <div hidden={tab!=="Home"}><WoodHome onSelect={setTab} onCalculator={openCalculator}/><UpdateNotifications user={user} active={tab==="Home"}/></div>
 {tab==="Cutting"&&<CuttingOptimizer onBack={()=>setTab("Home")}/>}
 {tab==="Wood"&&<WoodCalculator userId={user?.uid||"local"} key={(user?.uid||"local")+calculator.kind+calculator.system} kind={calculator.kind} initialSystem={calculator.system} onReceipt={()=>setTab("Receipt")} onBack={()=>setTab("Home")}/>}
 {["Help","SaveInvoice","Profile","Language","Manual","Share","Rate","Privacy","Bug"].includes(tab)&&<MenuPage key={tab} page={tab} user={user} onSelect={setTab}/>}
 {tab==="RoundSaved"&&openedReceipt?.uid===(user?.uid||"local")&&<RoundReceiptView key={openedReceipt.receipt.id} receipt={openedReceipt.receipt} userId={user?.uid||"local"} saved onBack={()=>setTab("Saved")}/>}
 <div hidden={tab!=="Receipt"}><TimberReceipt key={user?.uid||"local"} userId={user?.uid||"local"} initialReceipt={openedReceipt?.receipt.type!=="round-wood-receipt"&&openedReceipt?.uid===(user?.uid||"local")?openedReceipt.receipt:null}/></div>
 <div hidden={tab!=="Baki"}><BakiHisab key={user?.uid||"local"} userId={user?.uid||"local"} active={tab==="Baki"}/></div>
 <div hidden={tab!=="Customers"}><CustomerList key={user?.uid||"local"} userId={user?.uid||"local"} active={tab==="Customers"}/></div>
 <div hidden={tab!=="Report"}><SaleReport key={user?.uid||"local"} userId={user?.uid||"local"} active={tab==="Report"}/></div>
 <div hidden={tab!=="Saved"}><SavedReceipts key={user?.uid||"local"} userId={user?.uid||"local"} active={tab==="Saved"} onOpen={receipt=>{if(receipt.type==="round-wood-receipt"){setOpenedReceipt({uid:user?.uid||"local",receipt});setTab("RoundSaved");window.scrollTo(0,0);return}if(!confirm("Open this saved receipt? Current unsaved entries will be replaced."))return;setOpenedReceipt({uid:user?.uid||"local",receipt:{...receipt}});setTab("Receipt")}}/></div><div hidden={tab!=="Level"}><LevelTool active={tab==="Level"}/></div></main></div></>;
}

function AuthScreen({mode,setMode,online}){
 const[busy,setBusy]=useState(false),[error,setError]=useState(""),[message,setMessage]=useState(""),[form,setForm]=useState({name:"",email:"",password:""});
 const submit=async e=>{e.preventDefault();setError("");setMessage("");const er=email(form.email);if(!er.ok)return setError(er.error);if(mode!=="reset"&&form.password.length<6)return setError("Password must be at least 6 characters.");setBusy(true);try{if(mode==="signup")await registerEmail(form);else if(mode==="reset"){await resetPassword(form.email);setMessage("Password reset email sent. Check your inbox.");}else await loginEmail(form.email,form.password)}catch(e){setError(authError(e))}finally{setBusy(false)}};
 return <div className="authPage"><div className="authCard"><div className="brand dark">SAB TOOLS</div><p>Smart Tools for Carpenters & Furniture Workers</p>{!firebaseReady&&<div className="error">Cloud saving is unavailable because Firebase is not configured for this deployment.</div>}{!online&&<div className="error">You are offline. Sign-in requires a connection.</div>}{error&&<div className="error">{error}</div>}{message&&<div className="success">{message}</div>}{mode!=="login"&&mode!=="reset"&&<label>Name<input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required/></label>}<label>Email<input type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} required/></label>{mode!=="reset"&&<label>Password<input type="password" minLength="6" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} required/></label>}<button className="primary wide" disabled={busy||!online||!firebaseReady} onClick={submit}>{busy?"Please wait...":mode==="signup"?"Create account":mode==="reset"?"Send reset email":"Login"}</button>{mode==="login"&&<button className="google" disabled={busy||!online||!firebaseReady} onClick={async()=>{setError("");setBusy(true);try{await loginGoogle()}catch(e){setError(authError(e))}finally{setBusy(false)}}}>Continue with Google</button>}<div className="authLinks">{mode!=="login"&&<button onClick={()=>setMode("login")}>Back to Login</button>}{mode==="login"&&<><button onClick={()=>setMode("signup")}>Create account</button><button onClick={()=>setMode("reset")}>Forgot password?</button></>}</div></div></div>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        }
