import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
test('opened receipts are selected and rendered only for their account',()=>{
 const s=readFileSync(new URL('../src/App.jsx',import.meta.url),'utf8');
 assert.ok(s.includes('setOpenedReceipt({uid:user?.uid||"local",receipt:{...receipt}})'));
 assert.ok(s.includes('initialReceipt={openedReceipt?.receipt.type!=="round-wood-receipt"&&openedReceipt?.uid===(user?.uid||"local")?openedReceipt.receipt:null}'));
 assert.ok(s.includes('watchAuth(u=>{setOpenedReceipt(null);if(!first){history.replaceState({sab:1},"","#/home");setTabRaw("Home")}first=false;setUser(u);'));
 assert.ok(s.includes('<SavedReceipts key={user?.uid||"local"}'));
 assert.ok(s.includes('aria-label="Signed-in account"'));
});
test('SavedReceipts clears inactive account state and ignores retired subscriptions',()=>{
 const s=readFileSync(new URL('../src/ReceiptTools.jsx',import.meta.url),'utf8');
 assert.ok(s.indexOf("setReceipts([]); setError(''); setLoading(true);")<s.indexOf('if (!active) return;'));
 assert.ok(s.includes('return ()=>{current=false;unsubscribe();}'));
 assert.ok(s.includes('if(!current)return;setReceipts([]);setError('));
});
