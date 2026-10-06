// Deterministic multi-start guillotine packing. No network or UI dependencies.
const EPS=1e-7;
export const MAX_PARTS=200;
const number=(v,label,min=0)=>{const n=Number(v);if(String(v).trim()===''||!Number.isFinite(n)||n<min||n>100000)throw Error(`${label} must be ${min?'greater than 0':'0 or more'} and at most 100000.`);return n};
const count=(v,label)=>{const n=number(v,label,1);if(!Number.isInteger(n)||n>200)throw Error(`${label} must be a whole number from 1 to 200.`);return n};
export function validateCuttingInput(input){
 if(!input||!Array.isArray(input.stocks)||!input.stocks.length||!Array.isArray(input.parts)||!input.parts.length)throw Error('Add stock and at least one part.');
 const kerf=number(input.kerf,'Kerf'),trim=number(input.trim,'Edge trim');
 if(trim>0&&trim<kerf)throw Error('Edge trim must be zero or at least the kerf. Trim includes the blade loss.');
 const clean=(row,i,type)=>{if(!row.material?.trim())throw Error(`${type} ${i+1}: material is required.`);if(!['Any','Horizontal','Vertical','Locked'].includes(row.grain||'Any'))throw Error('Choose a valid grain direction.');return {...row,id:row.id||`${type}-${i}`,name:row.name?.trim().slice(0,120)||`${type} ${i+1}`,material:row.material.trim().slice(0,120),thickness:number(row.thickness,`${type} ${i+1} thickness`,EPS),length:number(row.length,`${type} ${i+1} length`,EPS),width:number(row.width,`${type} ${i+1} width`,EPS),quantity:count(row.quantity,`${type} ${i+1} quantity`),grain:row.grain||'Any',rotate:row.rotate===true,offcut:row.offcut===true}};
 const stocks=input.stocks.map((r,i)=>clean(r,i,'Stock')),parts=input.parts.map((r,i)=>clean(r,i,'Part'));
 if(stocks.reduce((a,s)=>a+s.quantity,0)>200)throw Error('Use at most 200 stock pieces.');
 if(parts.reduce((a,p)=>a+p.quantity,0)>MAX_PARTS)throw Error(`Use at most ${MAX_PARTS} parts per plan.`);
 for(const s of stocks)if(s.length<=trim*2||s.width<=trim*2)throw Error(`${s.name}: trim leaves no usable material.`);
 return {...input,kerf,trim,stocks,parts};
}
const compatible=(p,s)=>p.material.toLowerCase()===s.material.toLowerCase()&&Math.abs(p.thickness-s.thickness)<EPS&&(p.grain==='Any'||p.grain==='Locked'||s.grain==='Any'||p.grain===s.grain);
const orientations=p=>[{w:p.length,h:p.width,rotated:false},...(p.rotate&&p.grain==='Any'&&p.length!==p.width?[{w:p.width,h:p.length,rotated:true}]:[])];
function split(rect,o,k,axis){
 const dw=rect.w-o.w,dh=rect.h-o.h;if(dw<-EPS||dh<-EPS)return null;
 // A cut needs its full blade width. Exactly fitting edges require no cut.
 if(dw>EPS&&dw+EPS<k||dh>EPS&&dh+EPS<k)return null;
 const children=[],cuts=[];const vertical=(r,pos)=>{if(r.w-pos>EPS){cuts.push({axis:'vertical',x:r.x+pos,y:r.y,span:r.h,distance:pos,region:{...r}});if(r.w-pos-k>EPS)children.push({x:r.x+pos+k,y:r.y,w:r.w-pos-k,h:r.h})}};
 const horizontal=(r,pos)=>{if(r.h-pos>EPS){cuts.push({axis:'horizontal',x:r.x,y:r.y+pos,span:r.w,distance:pos,region:{...r}});if(r.h-pos-k>EPS)children.push({x:r.x,y:r.y+pos+k,w:r.w,h:r.h-pos-k})}};
 if(axis==='vertical'){vertical(rect,o.w);horizontal({...rect,w:o.w},o.h)}else{horizontal(rect,o.h);vertical({...rect,h:o.h},o.w)}
 return {children,cuts};
}
function run(data,order,preference){
 const all=data.stocks.flatMap((s,i)=>Array.from({length:s.quantity},(_,j)=>({...s,stockId:s.id,instance:j+1,key:`${i}:${j}`}))),sheets=[],unplaced=[];
 for(const part of order){let best;
  const candidates=[...sheets.map(s=>({s,opened:true})),...all.filter(s=>!sheets.some(t=>t.key===s.key)).map(s=>({s:{...s,free:[{x:data.trim,y:data.trim,w:s.length-2*data.trim,h:s.width-2*data.trim}],placements:[],cuts:[]},opened:false}))];
  for(const {s,opened}of candidates){if(!compatible(part,s))continue;for(let index=0;index<s.free.length;index++)for(const o of orientations(part))for(const axis of ['vertical','horizontal']){const r=s.free[index],cut=split(r,o,data.kerf,axis);if(!cut)continue;const maxOff=Math.max(0,...cut.children.map(c=>c.w*c.h)),waste=r.w*r.h-o.w*o.h;
   // Existing offcuts before unused sheets; then already-opened sheets. Stable tie-breaks.
   const score=[s.offcut?0:opened?1:2,opened?0:1,opened?0:s.length*s.width,preference===0?waste:-maxOff,Math.min(r.w-o.w,r.h-o.h),axis==='vertical'?0:1];
   if(!best||compare(score,best.score)<0)best={s,opened,index,o,cut,score,r};
  }}
  if(!best){const sameMaterial=all.some(s=>s.material.toLowerCase()===part.material.toLowerCase());const sameThickness=all.some(s=>s.material.toLowerCase()===part.material.toLowerCase()&&Math.abs(s.thickness-part.thickness)<EPS);unplaced.push({...part,reason:!sameMaterial?'No stock for this material.':!sameThickness?'Thickness mismatch.':'Part is larger than usable stock, grain does not match, or available stock is exhausted.'});continue}
  const {s,opened,index,o,cut,r}=best;if(!opened)sheets.push(s);s.free.splice(index,1,...cut.children);s.placements.push({...part,x:r.x,y:r.y,w:o.w,h:o.h,rotated:o.rotated});s.cuts.push(...cut.cuts.map(c=>({...c,partId:part.instanceId,partName:`${part.name} #${part.instance}`})));
 }
 let seq=0;for(let n=0;n<sheets.length;n++){const s=sheets[n];s.sheet=n+1;const trimCuts=[];
 if(data.trim){let r={x:0,y:0,w:s.length,h:s.width};for(const [axis,pos,label,keep]of [['vertical',data.trim-data.kerf,'Left edge trim','right'],['horizontal',data.trim-data.kerf,'Top edge trim','bottom'],['vertical',s.length-2*data.trim,'Right edge trim','left'],['horizontal',s.width-2*data.trim,'Bottom edge trim','top']]){trimCuts.push({axis,distance:pos,region:{...r},x:axis==='vertical'?r.x+pos:r.x,y:axis==='horizontal'?r.y+pos:r.y,span:axis==='vertical'?r.h:r.w,partName:label,trim:true,keep});if(label==='Left edge trim'){r.x=data.trim;r.w-=data.trim}else if(label==='Top edge trim'){r.y=data.trim;r.h-=data.trim}else if(label==='Right edge trim')r.w-=data.trim;else r.h-=data.trim;}}

 s.trimWasteArea=s.length*s.width-(s.length-2*data.trim)*(s.width-2*data.trim)-trimCuts.reduce((a,c)=>a+c.span*data.kerf,0);
 s.cuts=[...trimCuts,...s.cuts].map(c=>({...c,number:++seq,sheet:n+1}));s.offcuts=s.free.filter(r=>r.w>=100&&r.h>=100).map((r,i)=>({...r,id:`${s.key}:offcut:${i}`,material:s.material,thickness:s.thickness,grain:s.grain,sheet:n+1}));
 }
 const totalArea=sheets.reduce((a,s)=>a+s.length*s.width,0),usedArea=sheets.reduce((a,s)=>a+s.placements.reduce((b,p)=>b+p.w*p.h,0),0),offcuts=sheets.flatMap(s=>s.offcuts),reusableArea=offcuts.reduce((a,r)=>a+r.w*r.h,0),wasteArea=totalArea-usedArea;
 return {sheets,unplaced,offcuts,cuts:sheets.flatMap(s=>s.cuts),summary:{sheets:sheets.length,newSheets:sheets.filter(s=>!s.offcut).length,offcutStock:sheets.filter(s=>s.offcut).length,placed:sheets.reduce((a,s)=>a+s.placements.length,0),totalArea,usedArea,wasteArea,reusableArea,discardArea:wasteArea-reusableArea,usedPercent:totalArea?100*usedArea/totalArea:0,wastePercent:totalArea?100*wasteArea/totalArea:0,totalCuts:seq}};
}
function compare(a,b){for(let i=0;i<a.length;i++)if(Math.abs(a[i]-b[i])>EPS)return a[i]-b[i];return 0}
export function optimizeCutting(raw){const data=validateCuttingInput(raw),parts=data.parts.flatMap((p,i)=>Array.from({length:p.quantity},(_,j)=>({...p,instance:j+1,instanceId:`${i}:${j}`})));let best;for(const mode of ['area','long','wide'])for(let pref=0;pref<2;pref++){const sorted=[...parts].sort((a,b)=>{const metric=p=>mode==='area'?p.length*p.width:mode==='long'?Math.max(p.length,p.width):Math.min(p.length,p.width);return metric(b)-metric(a)||a.instanceId.localeCompare(b.instanceId)});const result=run(data,sorted,pref),s=result.summary;const score=[result.unplaced.length,s.newSheets,s.sheets,s.wasteArea,-Math.max(0,...result.offcuts.map(r=>r.w*r.h))];if(!best||compare(score,best.score)<0)best={result,score}}
 return {...best.result,version:1,input:data,algorithm:'Multi-start guillotine best-fit (6 deterministic trials)'};
}
