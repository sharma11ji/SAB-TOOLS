import React,{useEffect,useRef,useState} from 'react';
import {claimLaunchSplash} from './launchSplash';
let launchEligible = false;
try { launchEligible = claimLaunchSplash(localStorage,new Date(),matchMedia('(prefers-reduced-motion: reduce)').matches); } catch {}
export default function LaunchSplash(){
 const [visible,setVisible]=useState(launchEligible),[fading,setFading]=useState(false);
 const video=useRef(null);
 const finish=()=>setFading(true);
 useEffect(()=>{
  if(!visible)return;
  const deadline=setTimeout(finish,2800);
  const playback=video.current?.play();
  playback?.catch(finish);
  return()=>clearTimeout(deadline);
 },[visible]);
 useEffect(()=>{
  if(!fading)return;
  const timer=setTimeout(()=>setVisible(false),200);
  return()=>clearTimeout(timer);
 },[fading]);
 if(!visible)return null;
 const base=import.meta.env.BASE_URL;
 return <button type="button" className={'launch-splash'+(fading?' fade':'')} onClick={finish} aria-label="Skip logo animation and open app"><video ref={video} src={base+'launch/logo.mp4'} poster={base+'launch/logo.jpg'} muted playsInline disableRemotePlayback disablePictureInPicture preload="auto" onEnded={finish} onError={finish} aria-hidden="true"/><span>Tap to skip</span></button>;
}
