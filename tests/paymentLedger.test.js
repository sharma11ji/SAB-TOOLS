import test from 'node:test';
import assert from 'node:assert/strict';
import {receiptRecord} from '../src/receiptRecords.js';
import {paymentState,paymentOnSave,receivedPayment,assertRevision} from '../src/paymentLedger.js';
const base={shop:'Test mill',shopAddress:'',mobile:'',number:'1',date:'2026-10-03',customer:'Ramesh',village:'',rate:'50',advance:'100',labour:'0',transport:'0',rows:[{wood:'',length:'10',girth:'48',rate:'50'}]};
const saved=()=>receiptRecord(base,'one');
test('legacy receipt amounts determine pending state without migration',()=>{assert.deepEqual(paymentState(saved()),{total:500,paid:100,balance:400,status:'pending'});});
test('save requires explicit choice; paid and partly paid reflect accurate PDF amounts',()=>{
 assert.throws(()=>paymentOnSave(base,'','0'));
 assert.equal(paymentState(paymentOnSave(base,'paid','0')).balance,0);
 assert.equal(paymentState(paymentOnSave(base,'pending','50.50')).balance,449.5);
 for(const value of ['','-1','500','501','abc','0.001','Infinity']) assert.throws(()=>paymentOnSave(base,'pending',value));
 assert.equal(paymentState(paymentOnSave(base,'pending','0')).balance,500);
});
test('part payments add exactly; mark paid clears pending amount',()=>{
 const first=receivedPayment(saved(),'99.99',0,'2026-10-03T00:00:00Z');
 assert.equal(first.advance,'199.99');assert.equal(first.balance,300.01);assert.equal(first.revision,1);assert.equal(first.settledAt,null);
 const final=receivedPayment(first,'300.01',1,'2026-10-04T00:00:00Z');
 assert.equal(final.advance,'500');assert.equal(final.balance,0);assert.equal(final.paymentStatus,'paid');assert.equal(final.settledAt,'2026-10-04T00:00:00Z');
 assert.throws(()=>receivedPayment(final,'1',2));
});
test('stale and duplicate payment/save attempts are rejected',()=>{
 const updated=receivedPayment(saved(),'100',0);
 assert.throws(()=>receivedPayment(updated,'100',0),/changed/);
 assert.throws(()=>assertRevision(updated,0),/changed/);
 assertRevision(updated,1);assertRevision(null,0);assert.throws(()=>assertRevision(null,1));
});
test('reject zero, negative, excessive and fractional-paise payments; preserve refunds',()=>{
 for(const value of ['0','-1','401','1.001','NaN','Infinity','']) assert.throws(()=>receivedPayment(saved(),value,0));
 assert.equal(paymentState({...base,advance:'550'}).status,'paid');
 assert.equal(paymentOnSave({...base,advance:'550'},'paid','0').advance,'550');
});
