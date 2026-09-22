const KEY="sab-tools-pending-sync";
const read=()=>{try{return JSON.parse(localStorage.getItem(KEY)||"[]")}catch{return[]}};
export const queueWrite=item=>{const q=read();q.push({...item,id:item.id||crypto.randomUUID(),queuedAt:new Date().toISOString()});localStorage.setItem(KEY,JSON.stringify(q));return q.length};
export const pendingWrites=()=>read();
export const clearQueue=()=>localStorage.removeItem(KEY);
export async function flushQueue(handler){const q=read();if(!q.length)return 0;const remaining=[];for(const item of q){try{await handler(item)}catch{remaining.push(item)}}localStorage.setItem(KEY,JSON.stringify(remaining));return q.length-remaining.length}
