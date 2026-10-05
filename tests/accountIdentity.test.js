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

import {headerAvatar} from '../src/accountIdentity.js';
test('headerAvatar uses Google photo, then initial, then logo',()=>{
 assert.deepEqual(headerAvatar(null),{kind:'logo'});
 assert.deepEqual(headerAvatar({displayName:'A',photoURL:'https://lh3.googleusercontent.com/a.jpg'}),{kind:'photo',src:'https://lh3.googleusercontent.com/a.jpg'});
 assert.deepEqual(headerAvatar({displayName:'A',providerData:[{photoURL:'https://x.test/p.png'}]}),{kind:'photo',src:'https://x.test/p.png'});
 assert.deepEqual(headerAvatar({displayName:' amar ',photoURL:null}),{kind:'initial',initial:'A'});
 assert.deepEqual(headerAvatar({email:'zed@x.com'}),{kind:'initial',initial:'Z'});
 assert.deepEqual(headerAvatar({photoURL:'http://insecure/p.png',displayName:'B'}),{kind:'initial',initial:'B'});
});

import {headerName} from '../src/accountIdentity.js';
test('headerName falls back from display name to email prefix to empty',()=>{
 assert.equal(headerName(null),'');
 assert.equal(headerName({displayName:' Amarjeet Kumar ',email:'a@b.com'}),'Amarjeet Kumar');
 assert.equal(headerName({email:'zed@x.com'}),'zed');
 assert.equal(headerName({}),'');
});
