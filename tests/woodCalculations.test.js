import {test} from 'node:test';
import assert from 'node:assert/strict';
import {woodCalculation as calc} from '../src/woodCalculations.js';
import {roundLogCft} from '../src/timberReceipt.js';
const base={length:8,width:6,thickness:1.5,girth:48,pieces:10,rate:750};
test('planks: feet length, inch width and thickness, whole pieces, CFT rate',()=>{
 assert.deepEqual(calc('size','imperial',base),{perPiece:0.5,quantity:5,amount:3750,unit:'CFT'});
});
test('metric planks: metres length and centimetres width and thickness',()=>{
 const r=calc('size','metric',{...base,length:2.5,width:20,thickness:5,pieces:4,rate:12000});
 assert.ok(Math.abs(r.quantity-0.1)<1e-12);assert.equal(r.amount,1200);assert.equal(r.unit,'CBM');
});
test('doors: both dimensions in feet, square-foot rate and pieces',()=>{
 assert.deepEqual(calc('door','imperial',{...base,length:7,width:3,pieces:2,rate:100}),{perPiece:21,quantity:42,amount:4200,unit:'sq ft'});
});
test('metric doors: both dimensions in metres, square-metre rate',()=>{
 const r=calc('door','metric',{...base,length:2.1,width:0.9,pieces:3,rate:1000});
 assert.ok(Math.abs(r.quantity-5.67)<1e-12);assert.equal(r.amount,5670);assert.equal(r.unit,'sq m');
});
test('metric logs retain quarter-girth method, not diameter or cylinder formula',()=>{
 assert.deepEqual(calc('round','metric',{...base,length:2,girth:100,pieces:4,rate:10000}),{perPiece:0.125,quantity:0.5,amount:5000,unit:'CBM'});
 const r=calc('round','metric',{...base,length:0.3048,girth:121.92,pieces:1,rate:0});
 assert.ok(Math.abs(r.quantity-0.028316846592)<1e-12);
 assert.equal(calc('round','imperial',base).quantity,roundLogCft(8,48)*10);
});
test('reject blank, zero, negative, nonfinite dimensions and fractional or unsafe pieces',()=>{
 for(const kind of ['size','door','round']) for(const value of ['',0,-1,'bad',Infinity,'1e308']) assert.equal(calc(kind,'imperial',{...base,length:value}),null);
 for(const pieces of ['',0,-1,1.5,Infinity,Number.MAX_SAFE_INTEGER+1]) assert.equal(calc('size','metric',{...base,pieces}),null);
 for(const rate of ['',-1,NaN,Infinity,'1e308']) assert.equal(calc('size','imperial',{...base,rate}),null);
 assert.equal(calc('unknown','metric',base),null);assert.equal(calc('size','unknown',base),null);
});
test('accept numeric strings, free rate and round money only at the end',()=>{
 assert.equal(calc('size','imperial',{length:'8',width:'6',thickness:'1.5',pieces:'10',rate:'0'}).amount,0);
 assert.equal(calc('door','imperial',{length:'1.1',width:'1.2',pieces:'3',rate:'1.23'}).amount,4.87);
});
