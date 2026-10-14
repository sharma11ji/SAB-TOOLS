import{collection,onSnapshot}from"firebase/firestore";import{db}from"../firebase";
const path=(uid,type)=>collection(db,"users",uid,type);
export const watchRecords=(uid,type,onData,onError)=>{if(!db){onError?.(new Error("Firebase is not configured."));return()=>{}};return onSnapshot(path(uid,type),s=>onData(s.docs.map(d=>({id:d.id,...d.data()}))),onError)};
