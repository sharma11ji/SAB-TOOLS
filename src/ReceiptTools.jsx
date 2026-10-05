import React, {useEffect, useRef, useState} from 'react';
import {db} from './firebase';
import {watchRecords} from './services/firestoreService';
import {receiptKey, sortReceipts} from './receiptRecords';
import {sortSavedReceipts} from './roundReceipt';
import {motionTilt} from './levelMath';

export {storeReceipt} from './receiptStorage';
const allReceipts=data=>[...sortReceipts(data),...sortSavedReceipts(data)].sort((a,b)=>String(b.savedAt||b.date).localeCompare(String(a.savedAt||a.date)));
export function SavedReceipts({userId, onOpen, active}) {
  const [receipts, setReceipts] = useState([]), [error, setError] = useState(''), [loading, setLoading] = useState(true);
  useEffect(() => {
    setReceipts([]); setError(''); setLoading(true);
    if (!active) return;
    if (userId === 'local' || !db) {
      try {setReceipts(allReceipts(JSON.parse(localStorage.getItem(receiptKey(userId)) || '[]')));} catch {setError('Saved receipts could not be read on this device.');}
      setLoading(false); return;
    }
    let current=true;
    const unsubscribe=watchRecords(userId, 'history', data => {if(!current)return;setReceipts(allReceipts(data)); setLoading(false); setError('');}, () => {if(!current)return;setReceipts([]);setError('Cloud receipts could not be loaded. Check your connection and account permissions.'); setLoading(false);});
    return ()=>{current=false;unsubscribe();};
  }, [userId, active]);
  return <section><h1>Saved receipts</h1>{(userId === 'local'||!db) && <p className="hint">Stored on this browser only. Clearing site data deletes these receipts.</p>}{loading && <p role="status">Loading receipts...</p>}{error && <p className="error" role="alert">{error}</p>}{!loading && !error && !receipts.length && <p className="empty">No saved receipts yet. Complete a receipt and tap "Save receipt".</p>}<div className="saved-list">{receipts.map(receipt => <button className="saved-receipt" key={receipt.id} onClick={() => onOpen(receipt)}>{receipt.type==='round-wood-receipt'?<><b>Round wood · {receipt.customerName||'No customer added'}</b><span>{new Date(receipt.date).toLocaleString('en-IN',{dateStyle:'medium',timeStyle:'short'})} · {receipt.pieces} pieces · {receipt.volume.toFixed(3)} {receipt.unit}{receipt.amount!==null&&` · ${receipt.amount.toLocaleString('en-IN',{style:'currency',currency:'INR'})}`}</span></>:<><b>Receipt #{receipt.number} · {receipt.customer}</b><span>{receipt.date.split('-').reverse().join('/')} · {receipt.unit === 'CBM' ? `CBM ${Number(receipt.volume ?? receipt.cft / 35.3147).toFixed(4)}` : `CFT ${Number(receipt.cft).toFixed(4)}`} · {Number(receipt.total).toLocaleString('en-IN', {style:'currency', currency:'INR'})}</span></>}<small>Open receipt</small></button>)}</div></section>;
}
export function LevelTool({active}) {
  const [permission, setPermission] = useState('idle'), [tilt, setTilt] = useState(null), [offset, setOffset] = useState({x:0,y:0}), [error, setError] = useState('');
  const received = useRef(false);
  const start = async () => {
    setError(''); setTilt(null); setOffset({x:0,y:0}); received.current = false;
    if (!window.isSecureContext || typeof window.DeviceMotionEvent === 'undefined') {setPermission('idle'); setError('Motion sensors are unavailable. Open this HTTPS page on a supported phone.'); return;}
    try {
      if (typeof window.DeviceMotionEvent.requestPermission === 'function' && await window.DeviceMotionEvent.requestPermission() !== 'granted') {setError('Motion permission was denied. Allow it in browser settings and try again.'); setPermission('idle'); return;}
      setPermission('granted');
    } catch {setError('Could not enable motion sensors. Check browser permission settings.'); setPermission('idle');}
  };
  useEffect(() => {
    if (!active || permission !== 'granted') {setTilt(null); return;}
    received.current = false;
    let lastReading = Date.now();
    const handle = event => {
      const next = motionTilt(event.accelerationIncludingGravity, window.screen.orientation?.angle || window.orientation || 0);
      if (!next) return;
      received.current = true; lastReading = Date.now(); setError(''); setTilt(next);
    };
    window.addEventListener('devicemotion', handle);
    const timer = setInterval(() => {if (!received.current || Date.now() - lastReading > 5000) {setError('No sensor readings received. Use a supported phone with motion permission enabled.'); setTilt(null); setPermission('idle');}}, 5000);
    return () => {clearInterval(timer); window.removeEventListener('devicemotion', handle);};
  }, [active, permission]);
  const x = tilt ? tilt.x - offset.x : 0, y = tilt ? tilt.y - offset.y : 0;
  return <section className="level-tool"><h1>Bubble level</h1><p>Stop the machine first. Place your phone flat on a clean, stationary surface, screen facing up.</p><p className="hint">Phone sensors give an approximate check, not a calibrated machine alignment measurement. Confirm with a proper spirit level before adjusting or operating the sawmill.</p>{permission !== 'granted' && <button className="primary" onClick={start}>Enable motion sensors</button>}{error && <p className="error" role="alert">{error}</p>}<div className="level-box" aria-label="Bubble level display"><div className="crosshair-h"/><div className="crosshair-v"/><div className="level-target"/>{tilt && permission === 'granted' && <div className="bubble" style={{left:`${50 + Math.max(-40,Math.min(40,x*2))}%`,top:`${50 + Math.max(-40,Math.min(40,y*2))}%`}}/>}</div>{tilt && permission === 'granted' ? <><p className="tilt-readout">Left / right: {x.toFixed(1)}° · Front / back: {y.toFixed(1)}°</p><p className="level-status">{Math.abs(x)<2 && Math.abs(y)<2 ? 'Near level (within 2°)' : 'Surface is tilted'}</p><button className="secondary" onClick={() => setOffset(tilt)}>Set zero on a known level surface</button><button className="secondary" onClick={() => setOffset({x:0,y:0})}>Reset zero</button><p className="hint">{offset.x || offset.y ? 'Readings are relative to your zero reference.' : 'Readings use the phone sensor reference.'}</p></> : <p className="hint">{permission === 'granted' ? 'Waiting for motion readings...' : 'Enable sensors to see live tilt. No reading yet.'}</p>}</section>;
}
