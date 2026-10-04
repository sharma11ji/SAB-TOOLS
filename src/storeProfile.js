export const storeProfileKey = uid => `sab-tools-store-profile-v1:${uid || 'local'}`;
export const emptyStoreProfile = () => ({storeName:'',ownerName:'',address:'',mobile:''});
export function cleanStoreProfile(value) {
 return Object.fromEntries(Object.keys(emptyStoreProfile()).map(key=>[key,typeof value?.[key]==='string'?value[key].slice(0,key==='address'?500:150):'']));
}
export function loadStoreProfile(storage,uid) {
 try {const value=JSON.parse(storage.getItem(storeProfileKey(uid)));return {profile:cleanStoreProfile(value?.profile),pendingCloud:value?.pendingCloud===true};}
 catch {return {profile:emptyStoreProfile(),pendingCloud:false};}
}
export function saveStoreProfile(storage,uid,profile,pendingCloud=false) {
 const clean=cleanStoreProfile(profile);
 storage.setItem(storeProfileKey(uid),JSON.stringify({profile:clean,pendingCloud}));
 return clean;
}
