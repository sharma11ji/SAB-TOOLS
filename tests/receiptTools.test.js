import test from 'node:test';
import assert from 'node:assert/strict';
import {motionTilt} from '../src/levelMath.js';
import {validReceipt, receiptRecord, sortReceipts} from '../src/receiptRecords.js';
const receipt = {shop:'Test sawmill',shopAddress:'Test address',mobile:'',number:'1',date:'2026-09-30',customer:'Test customer',village:'',rate:'100',advance:'50',labour:'20',transport:'30',rows:[{wood:'Teak',length:'10',girth:'48',rate:'100'}]};
test('motion sensor: flat, tilted, rotated and absent readings',()=>{
 assert.deepEqual(motionTilt({x:0,y:0,z:9.81}),{x:0,y:0});
 assert.equal(motionTilt(null),null); assert.equal(motionTilt({x:null,y:0,z:0}),null); assert.equal(motionTilt({x:0,y:0,z:0}),null);
 assert.ok(Math.abs(motionTilt({x:4.905,y:0,z:8.4957}).x-30)<.01);
 assert.ok(Math.abs(motionTilt({x:4.905,y:0,z:8.4957},90).y+30)<.01);
});
test('receipt stores all fields and full-precision totals, rejects incomplete data',()=>{
 assert.ok(validReceipt(receipt)); const saved=receiptRecord(receipt,'one');
 assert.equal(saved.cft,10); assert.equal(saved.total,1050); assert.equal(saved.balance,1000); assert.equal(saved.id,'one');
 assert.equal(saved.type,'receipt'); assert.deepEqual(saved.rows,receipt.rows);
 assert.throws(()=>receiptRecord({...receipt,customer:''},'bad'));
 assert.throws(()=>receiptRecord({...receipt,rows:[]},'bad'));
});
test('saved list filters other history and sorts newest first',()=>{
 const one={...receiptRecord(receipt,'one'),savedAt:'2026-09-29'};
 const two={...receiptRecord(receipt,'two'),savedAt:'2026-09-30'};
 assert.deepEqual(sortReceipts([one,{type:'other'},two,{type:'receipt'}]).map(item=>item.id),['two','one']);
});

test('wood type is optional and a single rate survives save and reopen',()=>{
 const value = {...receipt,rate:'55',rows:[{wood:'',length:'2.37',girth:'48',rate:'55'}],advance:'0',labour:'0',transport:'0'};
 const saved = receiptRecord(value,'single');
 assert.equal(saved.total,130.35); assert.ok(validReceipt(saved));
 assert.equal(receiptRecord(saved,'single').total,130.35);
});
