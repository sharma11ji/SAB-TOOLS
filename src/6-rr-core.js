import {roundRowTotals} from './roundRows.js';
export function makeRoundReceipt(rows,system,rate,store={},now=new Date(),customer={}) {
 const totals=roundRowTotals(rows,system,rate);
 if(!rows.length||rows.length>500||!totals.valid||(totals.hasPrice&&totals.amount===null)||!Number.isFinite(now.getTime()))return null;
 return {type:'round-wood-receipt',customerName:String(customer.name||'').trim().slice(0,120),customerAddress:String(customer.address||'').trim().slice(0,400),customerPhone:String(customer.phone||'').trim().slice(0,40),unit:totals.unit,lengthUnit:system==='metric'?'m':'ft',girthUnit:system==='metric'?'cm':'in',date:now.toISOString(),storeName:typeof store.storeName==='string'?store.storeName:'',rows:rows.map((r,i)=>({number:i+1,length:Number(r.length),girth:Number(r.girth),pieces:Number(r.pieces),volume:totals.volumes[i]})),pieces:totals.pieces,volume:totals.volume,rate:totals.hasPrice?Number(rate):null,amount:totals.amount};
}
export const roundReceiptFilename = receipt => `round-wood-${receipt.unit.toLowerCase()}-${receipt.date.replace(/[:.]/g,'-')}.png`;
export async function shareRoundReceipt(file,platform=navigator) {
 if(typeof platform.share!=='function'||typeof platform.canShare!=='function'||!platform.canShare({files:[file]}))return false;
 try {await platform.share({files:[file],title:'Round wood receipt'});return true;}catch(error){if(error.name==='AbortError')return true;return false;}
}

export function validRoundReceipt(r) {
 if(!r||r.type!=='round-wood-receipt'||!['CFT','CBM'].includes(r.unit)||!Number.isFinite(new Date(r.date).getTime())||!['storeName','customerName','customerAddress','customerPhone'].every(k=>typeof r[k]==='string')||!Array.isArray(r.rows)||!r.rows.length||r.rows.length>500)return false;
 const metric=r.unit==='CBM';
 if(r.lengthUnit!==(metric?'m':'ft')||r.girthUnit!==(metric?'cm':'in'))return false;
 const t=roundRowTotals(r.rows,metric?'metric':'imperial',r.rate===null?'':r.rate);
 return t.valid&&(!t.hasPrice||t.amount!==null)&&t.volume===r.volume&&t.pieces===r.pieces&&t.amount===r.amount&&r.rows.every((row,i)=>row.number===i+1&&row.volume===t.volumes[i])&&(r.rate===null||(typeof r.rate==='number'&&Number.isFinite(r.rate)&&r.rate>=0));
}
export function saveRoundReceiptLocal(storage,uid,record,key=`sab-tools-saved-receipts-v1:${uid}`) {
 if(!record.id||!validRoundReceipt(record))throw new Error('Invalid round wood receipt.');
 const old=JSON.parse(storage.getItem(key)||'[]');if(!Array.isArray(old))throw new Error('Saved receipts could not be read.');
 if(old.some(r=>r.id===record.id))return false;
 storage.setItem(key,JSON.stringify([record,...old]));return true;
}
export function sortSavedReceipts(records) {
 return records.filter(validRoundReceipt).sort((a,b)=>String(b.savedAt||b.date).localeCompare(String(a.savedAt||a.date)));
}
