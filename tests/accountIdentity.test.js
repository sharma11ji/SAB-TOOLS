import test from 'node:test';
import assert from 'node:assert/strict';
import {accountIdentity} from '../src/accountIdentity.js';
test('Google identity uses the authenticated name and photo',()=>{
 assert.deepEqual(accountIdentity({displayName:' Amarjeet Kumar ',email:'demo@example.com',photoURL:'https://example.com/photo.png'}),{name:'Amarjeet Kumar',initials:'AK',email:'demo@example.com',photoURL:'https://example.com/photo.png'});
});
test('password and photo-less accounts get readable fallbacks',()=>{
 assert.equal(accountIdentity({email:'worker@example.com'}).name,'worker');
 assert.equal(accountIdentity({email:'worker@example.com'}).initials,'W');
 assert.equal(accountIdentity({}).name,'Signed in');
 assert.equal(accountIdentity({displayName:'अमरजीत कुमार'}).initials,'अक');
});
