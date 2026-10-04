import {test} from 'node:test';import assert from 'node:assert/strict';
import {APP_VERSION,APP_URL,MENU_MAIN,MENU_SUPPORT,shareApp} from '../src/appMenu.js';
import packageInfo from '../package.json' with {type:'json'};
test('menu has ten unique approved items, app version comes from package',()=>{assert.equal(APP_VERSION,packageInfo.version);assert.equal(new Set([...MENU_MAIN,...MENU_SUPPORT].map(x=>x[0])).size,10);assert.deepEqual(MENU_SUPPORT.map(x=>x[1]),['Share App','Rate this app','Privacy policy','Bug report']);});
test('native share sends only public app title and link',async()=>{let sent;assert.equal(await shareApp({share:async data=>{sent=data}}),'Shared.');assert.deepEqual(sent,{title:'SAB TOOLS',url:APP_URL});});
test('share cancellation does not copy anything',async()=>{let copied=false;assert.equal(await shareApp({share:async()=>{throw Object.assign(new Error(),{name:'AbortError'})},clipboard:{writeText:async()=>copied=true}}),'');assert.equal(copied,false);});
test('share falls back to clipboard or visible link without a false success',async()=>{let text;assert.equal(await shareApp({clipboard:{writeText:async t=>text=t}}),'App link copied.');assert.equal(text,APP_URL);assert.equal(await shareApp({share:async()=>{throw Error()},clipboard:{writeText:async()=>{throw Error()}}}),`Copy this link: ${APP_URL}`);});
