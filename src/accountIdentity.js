// Firebase's authenticated user is the only source for the header identity.
export function accountIdentity(user){
 const name=user.displayName?.trim()||user.email?.split('@')[0]||'Signed in';
 const initials=Array.from(name.split(/\s+/).slice(0,2).map(part=>Array.from(part)[0]).join('')).join('').toLocaleUpperCase();
 return {name,initials,photoURL:user.photoURL||'',email:user.email||'Signed in'};
}
