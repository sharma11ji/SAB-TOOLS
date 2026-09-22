const n=v=>{const x=Number(v);return Number.isFinite(x)?x:0};
export const units={ft:1,in:1/12,cm:1/30.48,mm:1/304.8,m:3.280839895};
export const toFeet=(v,u)=>n(v)*(units[u]??1);
export const cft=(l,w,t,u="in",q=1)=>toFeet(l,u)*toFeet(w,u)*toFeet(t,u)*n(q);
export const boardFeet=(l,w,t,q=1)=>n(l)*n(w)*n(t)*n(q)/144;
export const area=(l,w,q=1)=>n(l)*n(w)*n(q);
export const volume=(l,w,t,q=1)=>n(l)*n(w)*n(t)*n(q);
export const waste=(qty,p)=>{const a=n(qty),r=n(p)/100;return{waste:a*r,total:a*(1+r)}};
export const feetInchesToInches=(feet,inches=0,fraction=0)=>n(feet)*12+n(inches)+n(fraction);
export const fractionToDecimal=(whole,fraction=0,denominator=1)=>n(whole)+n(fraction)/n(denominator||1);
export const furniture={
door:(h,w,t,q=1,wastePct=0)=>withWaste({area:area(h,w,q),volume:volume(h,w,t,q)},wastePct),
doorFrame:(h,w,frame,q=1)=>({frameRun:2*(n(h)+n(w))*n(q),frameArea:2*(n(h)+n(w))*n(frame)*n(q)}),
windowFrame:(h,w,frame,q=1)=>({outerArea:area(h,w,q),frameRun:2*(n(h)+n(w))*n(q),openingArea:Math.max(0,n(h)-2*n(frame))*Math.max(0,n(w)-2*n(frame))*n(q)}),
tabletop:(l,w,t,q=1,wastePct=0)=>withWaste({area:area(l,w,q),volume:volume(l,w,t,q)},wastePct),
shelf:(l,w,t,count=1,wastePct=0)=>withWaste({area:area(l,w,count),volume:volume(l,w,t,count)},wastePct),
panel:(l,w,t,q=1,wastePct=0)=>withWaste({area:area(l,w,q),volume:volume(l,w,t,q)},wastePct),
drawer:(l,w,h,t,q=1,wastePct=0)=>withWaste({boxVolume:volume(l,w,h,q),panelArea:2*(area(l,w)+area(l,h)+area(w,h))*n(q),panelVolume:2*(volume(l,w,t,q)+volume(l,h,t,q)+volume(w,h,t,q))},wastePct),
cabinet:(parts=[],wastePct=0)=>withWaste(parts.reduce((a,p)=>({pieces:a.pieces+n(p.q),area:a.area+area(p.l,p.w,p.q),volume:a.volume+volume(p.l,p.w,p.t,p.q)}),{pieces:0,area:0,volume:0}),wastePct)
};
function withWaste(result,p){const r=n(p)/100;return{...result,wastePct:n(p),wasteAmount:Object.values(result).filter(x=>typeof x==="number").reduce((a,x)=>a+x*r,0),wasteMultiplier:1+r}};
export const fmt=v=>Number.isFinite(Number(v))?Number(Number(v).toFixed(4)):0;
export const calculate=(type,v={})=>{switch(type){case"CFT":return cft(v.l,v.w,v.t,v.unit,v.q);case"Board Feet":return boardFeet(v.l,v.w,v.t,v.q);case"Area":return area(v.l,v.w,v.q);case"Volume":return volume(v.l,v.w,v.t,v.q);case"Waste":return waste(v.q,v.p).total;default:return 0}};
