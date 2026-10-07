import {test} from 'node:test';
import assert from 'node:assert/strict';
import {claimLaunchSplash,localDay,SPLASH_DAY_KEY} from '../src/launchSplash.js';
const store=()=>{const data=new Map();return {getItem:k=>data.get(k),setItem:(k,v)=>data.set(k,v)}};
test('launch animation is claimed once per local day',()=>{const s=store(),today=new Date(2026,9,7,14);assert.equal(localDay(today),'2026-10-07');assert.equal(claimLaunchSplash(s,today),true);assert.equal(s.getItem(SPLASH_DAY_KEY),'2026-10-07');assert.equal(claimLaunchSplash(s,today),false);assert.equal(claimLaunchSplash(s,new Date(2026,9,8)),true)});
test('reduced motion avoids animation and storage changes',()=>{const s=store();assert.equal(claimLaunchSplash(s,new Date(),true),false);assert.equal(s.getItem(SPLASH_DAY_KEY),undefined)});
test('blocked storage never makes the animation repeat on every launch',()=>{assert.equal(claimLaunchSplash({getItem:()=>{throw Error()}}),false);assert.equal(claimLaunchSplash({getItem:()=>null,setItem:()=>{throw Error()}}),false)});
