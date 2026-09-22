import{addDoc,collection,deleteDoc,doc,getDocs,onSnapshot,serverTimestamp,setDoc,updateDoc,query,orderBy}from"firebase/firestore";import{db}from"./firebase";
const guard=()=>{if(!db)throw new Error("Firebase is not configured.")};
const col=(uid,name)=>collection(db,"users",uid,name);
const clean=data=>Object.fromEntries(Object.entries(data).filter(([,v])=>v!==undefined));
export async function saveProfile(uid,data){guard();return setDoc(doc(db,"users",uid),clean({...data,updatedAt:serverTimestamp()}),{merge:true})}
export async function saveHistory(uid,data){guard();return addDoc(col(uid,"history"),{...clean(data),createdAt:serverTimestamp(),updatedAt:serverTimestamp()})}
export async function listHistory(uid){guard();const s=await getDocs(query(col(uid,"history"),orderBy("createdAt","desc")));return s.docs.map(d=>({id:d.id,...d.data()}))}
export function watchHistory(uid,cb){guard();return onSnapshot(query(col(uid,"history"),orderBy("createdAt","desc")),s=>cb(s.docs.map(d=>({id:d.id,...d.data()}))))}
export async function removeHistory(uid,id){guard();return deleteDoc(doc(db,"users",uid,"history",id))}
export async function saveProject(uid,data,id){guard();const ref=id?doc(db,"users",uid,"projects",id):doc(col(uid,"projects"));await setDoc(ref,{...clean(data),updatedAt:serverTimestamp(),...(id?{}:{createdAt:serverTimestamp()})},{merge:true});return ref.id}
export async function deleteProject(uid,id){guard();return deleteDoc(doc(db,"users",uid,"projects",id))}
export function watchProjects(uid,cb){guard();return onSnapshot(query(col(uid,"projects"),orderBy("updatedAt","desc")),s=>cb(s.docs.map(d=>({id:d.id,...d.data()}))))}
export async function saveCuttingList(uid,projectId,data,id){guard();const ref=id?doc(db,"users",uid,"projects",projectId,"cuttingLists",id):doc(db,"users",uid,"projects",projectId,"cuttingLists",id||crypto.randomUUID());await setDoc(ref,{...clean(data),updatedAt:serverTimestamp(),...(id?{}:{createdAt:serverTimestamp()})},{merge:true});return ref.id}
export async function deleteCuttingList(uid,projectId,id){guard();return deleteDoc(doc(db,"users",uid,"projects",projectId,"cuttingLists",id))}
export async function saveEstimate(uid,projectId,data,id){guard();const ref=id?doc(db,"users",uid,"estimates",id):doc(col(uid,"estimates"));await setDoc(ref,{...clean(data),projectId:projectId||null,updatedAt:serverTimestamp(),...(id?{}:{createdAt:serverTimestamp()})},{merge:true});return ref.id}
export async function deleteEstimate(uid,id){guard();return deleteDoc(doc(db,"users",uid,"estimates",id))}

export async function listCuttingLists(uid,projectId){guard();const s=await getDocs(query(collection(db,"users",uid,"projects",projectId,"cuttingLists"),orderBy("updatedAt","desc")));return s.docs.map(d=>({id:d.id,...d.data()}))}
export async function listEstimates(uid,projectId){guard();const s=await getDocs(query(col(uid,"estimates"),orderBy("updatedAt","desc")));return s.docs.map(d=>({id:d.id,...d.data()})).filter(x=>x.projectId===projectId)}
