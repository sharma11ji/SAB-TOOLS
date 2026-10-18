import LaunchSplash from './LaunchSplash';
import UpdateNotifications from "./UpdateNotifications";
import HeaderBrand from "./HeaderBrand";
import React, {Suspense, lazy, useEffect, useState} from "react";
const CuttingOptimizer = lazy(() => import('./CuttingOptimizer'));
const TimberReceipt = lazy(() => import("./TimberReceipt"));
const BakiHisab = lazy(() => import("./BakiHisab"));
const CustomerList = lazy(() => import("./CustomerList"));
const SaleReport = lazy(() => import("./SaleReport"));
const Business = lazy(() => import("./Business"));
const MenuPage = lazy(() => import("./MenuPages"));
const RoundReceiptView = lazy(() => import('./RoundReceiptView'));
const SavedReceipts = lazy(() => import("./ReceiptTools").then(m => ({default: m.SavedReceipts})));
const LevelTool = lazy(() => import("./ReceiptTools").then(m => ({default: m.LevelTool})));
import {buildHash,parseHash,pushRoute,initHistory} from "./navHistory.js";
import {firebaseReady} from "./firebase";
import {authError,initAuthPersistence,loginEmail,loginGoogle,logout,registerEmail,resetPassword,watchAuth} from "./authService";
import AccountMenu from "./AccountMenu";
import {email} from "./validation";
import WoodCalculator,{WoodHome} from "./WoodCalculators";

export default function App(){
 const [calculator,setCalculator]=useState({kind:"size",system:"imperial"});
 const openCalculator=(kind,system)=>{const calc={kind,system};setCalculator(calc);pushRoute(buildHash("Wood",calc));setTabRaw("Wood");window.scrollTo(0,0)};
 const [user,setUser]=useState(null),[loading,setLoading]=useState(true),[authMode,setAuthMode]=useState("login"),[tab,setTabRaw]=useState(()=>{const p=parseHash(location.hash);return p.tab}),[online,setOnline]=useState(navigator.onLine),[openedReceipt,setOpenedReceipt]=useState(null);
 const [visited,setVisited]=useState(()=>new Set([parseHash(location.hash).tab]));
 useEffect(()=>{setVisited(v=>{if(v.has(tab))return v;const n=new Set(v);n.add(tab);return n})},[tab]);
 const menuUser=user||(!firebaseReady?{uid:'local',displayName:'Local mode',email:'This device only'}:null);
 const setTab=t=>{pushRoute(buildHash(t));setTabRaw(t)};
 useEffect(()=>{const p=parseHash(location.hash);if(p.calc)setCalculator(p.calc);initHistory(p);const onPop=()=>{const q=parseHash(location.hash);if(q.calc)setCalculator(q.calc);setTabRaw(q.tab)};addEventListener("popstate",onPop);return()=>removeEventListener("popstate",onPop)},[]);
 useEffect(()=>{initAuthPersistence().catch(()=>{});let first=true;return watchAuth(u=>{setOpenedReceipt(null);if(!first){history.replaceState({sab:1},"","#/home");setTabRaw("Home")}first=false;setUser(u);setLoading(false)})},[]);
 useEffect(()=>{const update=()=>setOnline(navigator.onLine);addEventListener("online",update);addEventListener("offline",update);return()=>{removeEventListener("online",update);removeEventListener("offline",update)}},[]);
 const splash=<LaunchSplash/>;
 if(loading)return <>{splash}{null}</>;
 if(!user&&firebaseReady)return <>{splash}<AuthScreen mode={authMode} setMode={setAuthMode} online={online}/></>;
 return <>{splash}<div className="app"><header><HeaderBrand user={user} logoSrc={`${import.meta.env.BASE_URL}icons/1-timber-logo.png`}/><div className="headerRight"><span className={"status "+(online?"on":"off")}>{online?"Online":"Offline"}</span>{menuUser&&<div aria-label="Signed-in account"><AccountMenu key={menuUser.uid} user={menuUser} onLogout={logout} items={[["Home","Home"],["SizeWood","Size wood"],["FlushDoor","Flush door"],["RoundImperial","Round wood (ft/in)"],["RoundMetric","Round wood (metric)"],["Cutting","Cutting optimizer"],["Receipt","Receipt"],["Saved","Saved"],["Baki","Baki hisab"],["Customers","Customers"],["Business","Business"],["Report","Report"],["Level","Level"]]} activeItem={tab} onSelect={id=>id==="SizeWood"?openCalculator("size","imperial"):id==="FlushDoor"?openCalculator("door","imperial"):id==="RoundImperial"?openCalculator("round","imperial"):id==="RoundMetric"?openCalculator("round","metric"):setTab(id)}/></div>}</div></header><main>
 {!firebaseReady&&<p className="hint local-mode-banner">Local mode: Firebase is unavailable. You can create and save receipts on this device.</p>}
 <div hidden={tab!=="Home"}><WoodHome onSelect={setTab} onCalculator={openCalculator}/><UpdateNotifications user={user} active={tab==="Home"}/></div>
 <Suspense fallback={null}>
 {tab==="Cutting"&&<CuttingOptimizer onBack={()=>setTab("Home")}/>}
 {tab==="Wood"&&<WoodCalculator userId={user?.uid||"local"} key={(user?.uid||"local")+calculator.kind+calculator.system} kind={calculator.kind} initialSystem={calculator.system} onReceipt={()=>setTab("Receipt")} onBack={()=>setTab("Home")}/>}
 {["Help","SaveInvoice","Profile","Language","Manual","Share","Rate","Privacy","Bug"].includes(tab)&&<MenuPage key={tab} page={tab} user={user} onSelect={setTab}/>}
 {tab==="RoundSaved"&&openedReceipt?.uid===(user?.uid||"local")&&<RoundReceiptView key={openedReceipt.receipt.id} receipt={openedReceipt.receipt} userId={user?.uid||"local"} saved onBack={()=>setTab("Saved")}/>}
 {visited.has("Receipt")&&<div hidden={tab!=="Receipt"}><TimberReceipt key={user?.uid||"local"} userId={user?.uid||"local"} initialReceipt={openedReceipt?.receipt.type!=="round-wood-receipt"&&openedReceipt?.uid===(user?.uid||"local")?openedReceipt.receipt:null}/></div>}
 {visited.has("Baki")&&<div hidden={tab!=="Baki"}><BakiHisab key={user?.uid||"local"} userId={user?.uid||"local"} active={tab==="Baki"}/></div>}
 {visited.has("Customers")&&<div hidden={tab!=="Customers"}><CustomerList key={user?.uid||"local"} userId={user?.uid||"local"} active={tab==="Customers"}/></div>}
 {visited.has("Business")&&<div hidden={tab!=="Business"}><Business key={user?.uid||"local"} userId={user?.uid||"local"} active={tab==="Business"}/></div>}
 {visited.has("Report")&&<div hidden={tab!=="Report"}><SaleReport key={user?.uid||"local"} userId={user?.uid||"local"} active={tab==="Report"}/></div>}
 {visited.has("Saved")&&<div hidden={tab!=="Saved"}><SavedReceipts key={user?.uid||"local"} userId={user?.uid||"local"} active={tab==="Saved"} onOpen={receipt=>{if(receipt.type==="round-wood-receipt"){setOpenedReceipt({uid:user?.uid||"local",receipt});setTab("RoundSaved");window.scrollTo(0,0);return}if(!confirm("Open this saved receipt? Current unsaved entries will be replaced."))return;setOpenedReceipt({uid:user?.uid||"local",receipt:{...receipt}});setTab("Receipt")}}/></div>}{visited.has("Level")&&<div hidden={tab!=="Level"}><LevelTool active={tab==="Level"}/></div>}</Suspense></main></div></>;
}

function AuthScreen({mode,setMode,online}){
 const[busy,setBusy]=useState(false),[error,setError]=useState(""),[message,setMessage]=useState(""),[form,setForm]=useState({name:"",email:"",password:""});
 const submit=async e=>{e.preventDefault();setError("");setMessage("");const er=email(form.email);if(!er.ok)return setError(er.error);if(mode!=="reset"&&form.password.length<6)return setError("Password must be at least 6 characters.");setBusy(true);try{if(mode==="signup")await registerEmail(form);else if(mode==="reset"){await resetPassword(form.email);setMessage("Password reset email sent. Check your inbox.");}else await loginEmail(form.email,form.password)}catch(e){setError(authError(e))}finally{setBusy(false)}};
 return <div className="authPage"><div className="authCard"><div className="brand dark">SAB TOOLS</div><p>Smart Tools for Carpenters & Furniture Workers</p>{!firebaseReady&&<div className="error">Cloud saving is unavailable because Firebase is not configured for this deployment.</div>}{!online&&<div className="error">You are offline. Sign-in requires a connection.</div>}{error&&<div className="error">{error}</div>}{message&&<div className="success">{message}</div>}{mode!=="login"&&mode!=="reset"&&<label>Name<input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required/></label>}<label>Email<input type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} required/></label>{mode!=="reset"&&<label>Password<input type="password" minLength="6" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} required/></label>}<button className="primary wide" disabled={busy||!online||!firebaseReady} onClick={submit}>{busy?"Please wait...":mode==="signup"?"Create account":mode==="reset"?"Send reset email":"Login"}</button>{mode==="login"&&<button className="google" disabled={busy||!online||!firebaseReady} onClick={async()=>{setError("");setBusy(true);try{await loginGoogle()}catch(e){setError(authError(e))}finally{setBusy(false)}}}>Continue with Google</button>}<div className="authLinks">{mode!=="login"&&<button onClick={()=>setMode("login")}>Back to Login</button>}{mode==="login"&&<><button onClick={()=>setMode("signup")}>Create account</button><button onClick={()=>setMode("reset")}>Forgot password?</button></>}</div></div></div>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        }
