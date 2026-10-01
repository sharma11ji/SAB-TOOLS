import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {SHEET_SCOPE,SHEET_HEADERS,sheetRow,createPersonalSheet,writeSheetRow} from '../src/personalSheetApi.js';
const receipt={id:'test-1',date:'2026-10-01',number:'1',customer:'=IMPORTXML("bad")',village:'Badhaiyan',rate:'50',advance:'10',labour:'5',transport:'2',rows:[{wood:'Teak',length:'2.37',girth:'48',rate:'50'}]};
test('private sheet uses least privilege and thirteen columns',async()=>{
 let request;
 const created=await createPersonalSheet('test-token',{fetcher:async(url,init)=>{request={url,init};return{ok:true,json:async()=>({spreadsheetId:'sheet-1',spreadsheetUrl:'https://example.invalid/sheet'})}}});
 assert.equal(SHEET_SCOPE,'https://www.googleapis.com/auth/drive.file');
 assert.equal(created.spreadsheetId,'sheet-1');
 const body=JSON.parse(request.init.body);
 assert.equal(body.sheets[0].data[0].rowData[0].values.length,13);
 assert.equal(body.sheets[0].properties.gridProperties.frozenRowCount,1);
 assert.equal(request.init.headers.Authorization,'Bearer test-token');
 assert.equal(SHEET_HEADERS.length,13);
 assert.ok(!JSON.stringify(body).includes('permissions'));
});
test('stable row PUT with RAW safely preserves formula-looking names and retry destination',async()=>{
 const requests=[];
 const fetcher=async(url,init)=>{requests.push({url,init});return{ok:true,json:async()=>({updatedRows:1})}};
 await writeSheetRow('sheet-1',2,receipt,'test-token',{fetcher});
 await writeSheetRow('sheet-1',2,receipt,'test-token',{fetcher});
 assert.deepEqual(requests[0],requests[1]);
 assert.equal(requests[0].init.method,'PUT');
 assert.ok(requests[0].url.endsWith('?valueInputOption=RAW'));
 assert.equal(JSON.parse(requests[0].init.body).values[0][3],receipt.customer);
 assert.equal(sheetRow(receipt)[8],'125.50');
});
test('expired or denied Google access is surfaced, never claimed as sent',async()=>{
 for(const status of [401,403,500]) await assert.rejects(writeSheetRow('sheet',2,receipt,'test-token',{fetcher:async()=>({ok:false,status})}));
 await assert.rejects(writeSheetRow('sheet',2,receipt,'',{}),/Reconnect/);
 await assert.rejects(writeSheetRow('sheet',1,receipt,'test-token'),/Invalid/);
 await assert.rejects(writeSheetRow('../other',2,receipt,'test-token'),/Invalid/);
 await assert.rejects(writeSheetRow('sheet',2,receipt,'test-token',{fetcher:async()=>({ok:true,json:async()=>({updatedRows:0})})}),/confirm/);
});
test('per-user configuration, OAuth reauth and queue never persist tokens',()=>{
 const source=readFileSync(new URL('../src/personalSheet.js',import.meta.url),'utf8');
 assert.match(source,/reauthenticateWithPopup\(user,provider\)/);
 assert.match(source,/auth.currentUser.uid !== uid/);
 assert.match(source,/config.uid!==uid/);
 assert.match(source,/sheetProvisioning/);
 assert.match(source,/version===data.version/);
 assert.ok(!source.includes('localStorage.'));
 assert.ok(!/setDoc[^;]+token/.test(source));
});
