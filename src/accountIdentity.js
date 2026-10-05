// Firebase's authenticated user is the only source for the header identity.
export function accountIdentity(user){
 const name=user.displayName?.trim()||user.email?.split('@')[0]||'Signed in';
 return {name,email:user.email||'Signed in'};
}

// Header avatar: Google photo if present, else first initial; null user = app logo.
export function headerAvatar(user){
 if(!user)return {kind:'logo'};
 const photo=(user.photoURL||user.providerData?.find(p=>p?.photoURL)?.photoURL||'').trim();
 if(/^https:\/\//i.test(photo))return {kind:'photo',src:photo};
 const base=user.displayName?.trim()||user.email?.trim()||'';
 const initial=(Array.from(base)[0]||'?').toUpperCase();
 return {kind:'initial',initial};
}

// Header name: display name, else email prefix, else '' (tagline only).
export function headerName(user){
 if(!user)return '';
 return user.displayName?.trim()||user.email?.split('@')[0]?.trim()||'';
}
