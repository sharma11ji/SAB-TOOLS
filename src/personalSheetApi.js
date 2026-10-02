import {receiptFields, FORM_ENTRIES} from './sheetMirror.js';
export const SHEET_SCOPE = 'https://www.googleapis.com/auth/drive.file';
export const SHEET_HEADERS = ['Receipt ID','Date','Receipt no.','Customer','Village','Item','CFT','Rate','Total','Paid','Balance','Labour','Transport'];
export function sheetRow(record) {
  const fields = receiptFields(record);
  return [record.id, ...Object.values(FORM_ENTRIES).map(entry => fields[entry])];
}
export async function sheetRequest(path, token, {method='GET', body, fetcher=globalThis.fetch}={}) {
  if (!token) throw new Error('Reconnect Google to send pending receipts.');
  const response = await fetcher(`https://sheets.googleapis.com/v4/spreadsheets${path}`, {
    method, headers:{Authorization:`Bearer ${token}`, 'Content-Type':'application/json'},
    ...(body ? {body:JSON.stringify(body)} : {}),
  });
  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      const error = new Error(response.status === 401 ? 'Reconnect Google to send pending receipts.' : 'Google denied access. Check the Sheet permission and that Sheets API is enabled.');
      error.definiteNoWrite = true;
      throw error;
    }
    throw new Error(`Google Sheet request failed (${response.status}). Receipt remains pending.`);
  }
  return response.json();
}
export async function createPersonalSheet(token, options={}) {
  return sheetRequest('',token,{...options,method:'POST',body:{
    properties:{title:'SAB TOOLS Rasid Register'},
    sheets:[{properties:{title:'Receipts',gridProperties:{frozenRowCount:1}},
      data:[{rowData:[{values:SHEET_HEADERS.map(value=>({userEnteredValue:{stringValue:value},userEnteredFormat:{textFormat:{bold:true}}}))}]}]}],
  }});
}
export async function writeSheetRow(id, row, record, token, options={}) {
  if (!/^[a-zA-Z0-9_-]+$/.test(id) || !Number.isInteger(row) || row<2) throw new Error('Invalid Sheet destination.');
  // Stable row allocated in Firestore keeps confirmed updates on the same row.
  // Ambiguous sends are NOT retried automatically; the durable lock is retained.
  // RAW keeps customer text beginning with '=' from becoming a spreadsheet formula.
  const range=`Receipts!A${row}:M${row}`;
  const result=await sheetRequest(`/${id}/values/${encodeURIComponent(range)}?valueInputOption=RAW`,token,
    {...options,method:'PUT',body:{range,majorDimension:'ROWS',values:[sheetRow(record)]}});
  if (result.updatedRows !== 1) throw new Error('Google did not confirm the receipt row. It remains pending.');
  return result;
}
