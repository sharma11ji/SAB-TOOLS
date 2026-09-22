export function isConflict(e){return e?.message==="CONFLICT"||e?.code==="aborted"||e?.code==="failed-precondition"}
export function conflictText(){return{title:"This item was changed elsewhere.",my:"Your changes",latest:"Latest saved version",actions:["Keep Latest","Use My Changes","Review Changes"]}}
