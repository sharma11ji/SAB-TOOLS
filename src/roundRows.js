import {woodCalculation} from './woodCalculations.js';
export function addRoundRow(rows,system,fields,id) {
 const result=woodCalculation('round',system,{...fields,rate:0});
 if(!result||rows.some(row=>row.id===id))return null;
 const next=[...rows,{id,length:Number(fields.length),girth:Number(fields.girth),pieces:Number(fields.pieces)}];
 return roundRowTotals(next,system).valid?next:null;
}
export const deleteRoundRow=(rows,id)=>rows.filter(row=>row.id!==id);
export function roundRowTotals(rows,system,rate='') {
 const volumes=rows.map(row=>woodCalculation('round',system,{...row,rate:0})?.quantity??null);
 const pieces=rows.reduce((sum,row)=>sum+Number(row.pieces),0),volume=volumes.reduce((sum,v)=>sum+(v??0),0);
 const valid=['imperial','metric'].includes(system)&&volumes.every(v=>v!==null)&&Number.isSafeInteger(pieces)&&Number.isFinite(volume);
 const hasPrice=String(rate).trim()!=='';
 const priceValid=hasPrice&&Number.isFinite(Number(rate))&&Number(rate)>=0;
 const raw=priceValid?Math.round((volume*Number(rate)+Number.EPSILON)*100)/100:null;
 const amount=valid&&raw!==null&&Number.isSafeInteger(Math.round(raw*100))?raw:null;
 return {valid,volumes,pieces,volume,unit:system==='metric'?'CBM':'CFT',hasPrice,amount};
}
