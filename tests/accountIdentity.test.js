import test from 'node:test';
import assert from 'node:assert/strict';
import {accountIdentity} from '../src/accountIdentity.js';
test('Menu identity uses the authenticated name and email',()=>{
 assert.deepEqual(accountIdentity({displayName:' Amarjeet Kumar ',email:'demo@example.com',photoURL:'https://example.com/photo.png'}),{name:'Amarjeet Kumar',email:'demo@example.com'});
});
test('unnamed accounts get readable fallbacks',()=>{
 assert.equal(accountIdentity({email:'worker@example.com'}).name,'worker');
 assert.equal(accountIdentity({}).name,'Signed in');
});
