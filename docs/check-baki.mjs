// Optional: npm install --no-save --package-lock=false playwright, npm run dev, then node docs/check-baki.mjs
// Runs only against local-mode synthetic receipts. Never point it at production.
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',headless:true,args:['--no-sandbox']});
const page=await browser.newPage({viewport:{width:390,height:844}});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.goto(process.env.BAKI_TEST_URL || 'http://127.0.0.1:5173');
await page.getByRole('button',{name:'Timber receipt / CFT',exact:false}).click();
await page.getByLabel('Rate for all wood').fill('50');
await page.getByLabel('Wood 1 Length').fill('10');await page.getByLabel('Wood 1 Girth').fill('48');
await page.getByText('Need a receipt? Add names and billing details',{exact:true}).click();
await page.getByLabel('Shop / sawmill name',{exact:true}).fill('Vishwakarma Sawmill');
await page.getByLabel('Customer name',{exact:true}).fill('Ramesh Kumar');
await page.getByLabel('Customer address / village',{exact:true}).fill('Rampur');
await page.getByRole('button',{name:'Save receipt',exact:true}).click();
const dialog=page.getByRole('dialog');await dialog.waitFor();
assert.equal(await dialog.getByRole('button',{name:'Save receipt',exact:true}).isDisabled(),true);
await page.screenshot({path:'/downloads/baki-save-choice.png'});
await dialog.getByRole('button',{name:'Pending',exact:true}).click();await page.getByLabel('Already paid').fill('100');
await page.screenshot({path:'/downloads/baki-save-pending.png'});
await dialog.getByRole('button',{name:'Save receipt',exact:true}).click();await dialog.waitFor({state:'hidden'});
await page.getByRole('button',{name:'Baki hisab',exact:true}).click();
await page.getByText('Ramesh Kumar',{exact:true}).waitFor();
assert.match(await page.locator('.baki-amount').innerText(),/400/);
await page.screenshot({path:'/downloads/baki-pending-list.png'});
await page.getByRole('button',{name:'Part payment',exact:true}).click();await page.getByLabel('Amount received now').fill('100');await dialog.getByRole('button',{name:'Save payment',exact:true}).click();await dialog.waitFor({state:'hidden'});
assert.match(await page.locator('.baki-amount').innerText(),/300/);
await page.getByRole('button',{name:'Mark paid',exact:true}).click();await dialog.waitFor();
await page.screenshot({path:'/downloads/baki-mark-paid.png'});
await page.getByRole('button',{name:'Yes, payment received',exact:true}).click();await dialog.waitFor({state:'hidden'});
await page.getByText('No pending payments.',{exact:false}).waitFor();
await page.getByRole('button',{name:'Paid (1)',exact:true}).click();assert.match(await page.locator('.baki-amount').innerText(),/500/);
await page.screenshot({path:'/downloads/baki-paid-list.png'});
// Stale editor must not overwrite payment recorded from ledger.
await page.getByRole('button',{name:'Receipt / CFT',exact:true}).click();await page.getByRole('button',{name:'Save receipt',exact:true}).click();await dialog.getByRole('button',{name:'Pending',exact:true}).click();await dialog.getByRole('button',{name:'Save receipt',exact:true}).click();await dialog.getByRole('alert').filter({hasText:'changed'}).waitFor();await dialog.getByRole('button',{name:'Cancel'}).click();
assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);assert.deepEqual(errors,[]);
console.log('390px flow passes: explicit choice, partial payment, settlement, stale editor rejected; no console errors or horizontal overflow.');await browser.close();
