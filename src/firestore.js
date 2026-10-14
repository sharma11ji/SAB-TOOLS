import{doc,getDoc,serverTimestamp,setDoc}from"firebase/firestore";
import{db}from"./firebase";
const guard=()=>{if(!db)throw new Error("Firebase is not configured.")};
const clean=data=>Object.fromEntries(Object.entries(data||{}).filter(([,v])=>v!==undefined));
const stamp=(data,isNew)=>({...clean(data),updatedAt:serverTimestamp(),...(isNew?{createdAt:serverTimestamp()}:{})});
export async function saveProfile(uid,data){guard();return setDoc(doc(db,"users",uid),stamp(data,false),{merge:true})}
export async function getRecord(uid,path){guard();const ref=doc(db,"users",uid,...path);const s=await getDoc(ref);return s.exists()?{id:s.id,...s.data()}:null}
