// Firebase's authenticated user is the only source for the header identity.
export function accountIdentity(user){
 const name=user.displayName?.trim()||user.email?.split('@')[0]||'Signed in';
 return {name,email:user.email||'Signed in'};
}
