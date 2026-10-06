// Browser-history navigation helpers (hash routes work on GitHub Pages refresh).
export const TABS=["Home","Cutting","Receipt","Saved","Baki","Customers","Report","Level","Help","SaveInvoice","Profile","Language","Manual","Share","Rate","Privacy","Bug"];
const KINDS=["size","door","round"],SYSTEMS=["imperial","metric"];
export function buildHash(tab,calc){
 if(tab==="Wood"&&calc)return `#/wood/${calc.kind}/${calc.system}`;
 if(tab==="RoundSaved")return "#/saved/view";
 return `#/${String(tab||"Home").toLowerCase()}`;
}
export function parseHash(hash){
 const parts=String(hash||"").replace(/^#\/?/,"").split("/").filter(Boolean);
 if(!parts.length)return {tab:"Home"};
 const head=parts[0].toLowerCase();
 if(head==="wood"){const [,kind,system]=parts;if(KINDS.includes(kind)&&SYSTEMS.includes(system))return {tab:"Wood",calc:{kind,system}};return {tab:"Home"}}
 if(head==="saved"&&parts[1]==="view")return {tab:"Saved"}; // saved receipt object is memory-only: fall back to the list
 const tab=TABS.find(t=>t.toLowerCase()===head);
 return {tab:tab||"Home"};
}
export const isPreview=state=>Boolean(state&&state.sabPreview);
// Decide how to move to a target: "back" when it is the entry we came from, else "push", or "none" if already there.
export function planNavigation(currentHash,state,targetHash){
 if(currentHash===targetHash)return "none";
 if(state&&state.prev===targetHash)return "back";
 return "push";
}
export function pushRoute(targetHash){
 const cur=location.hash||"#/home",plan=planNavigation(cur,history.state,targetHash);
 if(plan==="back"){history.back();return plan}
 if(plan==="push")history.pushState({sab:1,prev:cur},"",targetHash);
 return plan;
}
export function initHistory(parsed){
 const home="#/home",target=buildHash(parsed.tab,parsed.calc);
 history.replaceState({sab:1},"",home);
 if(target!==home&&parsed.tab!=="Home")history.pushState({sab:1,prev:home},"",target);
}
export function openPreview(){history.pushState({sab:1,sabPreview:true,prev:location.hash||"#/home"},"",location.hash||"#/home")}
export function closePreview(){if(isPreview(history.state))history.back()}
