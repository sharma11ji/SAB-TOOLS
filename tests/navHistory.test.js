import test from "node:test";
import assert from "node:assert/strict";
import {buildHash,parseHash,planNavigation,isPreview} from "../src/navHistory.js";
test("hash round trip",()=>{
 assert.equal(buildHash("Home"),"#/home");
 assert.deepEqual(parseHash(buildHash("Saved")),{tab:"Saved"});
 const calc={kind:"round",system:"metric"};
 assert.deepEqual(parseHash(buildHash("Wood",calc)),{tab:"Wood",calc});
 for(const t of ["Receipt","Baki","Customers","Report","Level","Help","Profile","Manual"])assert.equal(parseHash(buildHash(t)).tab,t);
});
test("bad or empty hashes fall back to Home",()=>{
 for(const h of ["","#","#/","#/nope","#/wood/x/y","#/wood/round"])assert.deepEqual(parseHash(h),{tab:"Home"});
});
test("saved viewer deep link falls back to Saved list",()=>{
 assert.equal(buildHash("RoundSaved"),"#/saved/view");
 assert.deepEqual(parseHash("#/saved/view"),{tab:"Saved"});
});
test("planNavigation pushes, goes back to previous, or stays",()=>{
 assert.equal(planNavigation("#/home",{sab:1},"#/wood/round/imperial"),"push");
 assert.equal(planNavigation("#/wood/round/imperial",{sab:1,prev:"#/home"},"#/home"),"back");
 assert.equal(planNavigation("#/home",{sab:1},"#/home"),"none");
 assert.equal(planNavigation("#/saved",null,"#/home"),"push");
});
test("preview flag",()=>{assert.equal(isPreview({sabPreview:true}),true);assert.equal(isPreview({sab:1}),false);assert.equal(isPreview(null),false)});
