const KEY="sab-tools-pending-v2";
const id=()=>crypto.randomUUID();
export const isOnline=()=>navigator.onLine;
export function readPending(){try{return JSON.parse(localStorage.getItem(KEY)||"[]")}catch{return[]}}
export function queueSave(item){const list=readPending();const operationId=item.operationId||id();if(list.some(x=>x.operationId===operationId))return operationId;list.push({...item,operationId,queuedAt:Date.now(),attempts:0});localStorage.setItem(KEY,JSON.stringify(list));return operationId}
export function removePending(operationId){const list=readPending().filter(x=>x.operationId!==operationId);localStorage.setItem(KEY,JSON.stringify(list))}
export function clearPending(){localStorage.removeItem(KEY)}
export function updatePending(items){localStorage.setItem(KEY,JSON.stringify(items))}
