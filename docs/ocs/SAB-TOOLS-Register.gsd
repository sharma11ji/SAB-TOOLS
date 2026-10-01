/**
 * SAB TOOLS receipt register. Paste into Extensions > Apps Script.
 * Script Properties required: REGISTER_KEY (private key, at least 24 characters).
 * Do not put that key in GitHub, a VITE_ variable or the public bundle.
 * A shared runtime key provides only light access control, not user identity.
 * Anyone who has it can submit/alter rows. Only give it to trusted staff.
 * The Sheet must remain private. This endpoint never reads receipts back.
 * no-cors clients cannot see our response: this is a best-effort mirror,
 * not proof of saving. Firestore/local receipts remain the main record.
 */
const REGISTER_ID = '1Xk9KVw2paGPkjMVtjB_Sp62uQFMGZlF3uUDkbsa5SsE';
const REGISTER_TAB = 'Receipts';
const HEADERS = ['Date', 'Receipt No', 'Customer', 'Village', 'Total CFT', 'Rate', 'Total Amount', 'Paid', 'Balance'];

function doPost(e) {
  let lock;
  try {
    const raw = e && e.postData && e.postData.contents;
    if (!raw || raw.length > 12000) throw new Error('Invalid body');
    const data = JSON.parse(raw);
    const expected = PropertiesService.getScriptProperties().getProperty('REGISTER_KEY');
    if (!expected || expected.length < 24 || typeof data.key !== 'string' || data.key !== expected) {
      return reply({ok: false, error: 'Unauthorized'});
    }
    const id = String(data.id || '');
    if (!/^[A-Za-z0-9_-]{16,100}$/.test(id)) throw new Error('Invalid receipt ID');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(data.date) || !Number.isFinite(Date.parse(data.date)) || new Date(data.date).toISOString().slice(0, 10) !== data.date) throw new Error('Invalid date');
    const row = [textCell(data.date, 10, true), textCell(data.receiptNo, 160, true), textCell(data.customer, 160, true), textCell(data.village, 160, false),
      numberCell(data.totalCft, false), data.rate === 'Mixed' ? 'Mixed' : numberCell(data.rate, false),
      numberCell(data.totalAmount, false), numberCell(data.paid, false), numberCell(data.balance, true)];
    if (Math.abs(row[6] - row[7] - row[8]) > 0.011) throw new Error('Invalid balance');
    lock = LockService.getScriptLock();
    lock.waitLock(10000);
    const sheet = SpreadsheetApp.openById(REGISTER_ID).getSheetByName(REGISTER_TAB);
    if (!sheet || sheet.getRange(1, 1, 1, 9).getValues()[0].some((value, i) => value !== HEADERS[i])) throw new Error('Check register headers');
    const last = sheet.getLastRow();
    const note = 'SAB receipt ID: ' + id;
    // Notes preserve stable IDs without exposing extra columns. Saving again
    // updates the same receipt instead of duplicating Save PDF + Save receipt.
    const notes = last > 1 ? sheet.getRange(2, 1, last - 1, 1).getNotes() : [];
    const found = notes.findIndex(value => value[0] === note);
    const target = found < 0 ? last + 1 : found + 2;
    if (found < 0) sheet.appendRow(row);
    else sheet.getRange(target, 1, 1, 9).setValues([row]);
    sheet.getRange(target, 1).setNote(note);
    sheet.getRange(target, 5).setNumberFormat('0.0000');
    sheet.getRange(target, 6, 1, 4).setNumberFormat('0.00');
    SpreadsheetApp.flush();
    return reply({ok: true});
  } catch (_) {
    // Do not echo names, keys or internal account details into public responses.
    return reply({ok: false, error: 'Receipt not accepted'});
  } finally {
    if (lock && lock.hasLock()) lock.releaseLock();
  }
}
function textCell(value, max, required) {
  if (typeof value !== 'string' || value.length > max || (required && !value.trim())) throw new Error('Invalid text');
  // User text must never become a spreadsheet formula.
  return /^[\s]*[=+\-@]/.test(value) ? "'" + value : value;
}
function numberCell(value, signed) {
  if (typeof value !== 'number' || !Number.isFinite(value) || Math.abs(value) > 1e12 || (!signed && value < 0)) throw new Error('Invalid number');
  return value;
}
function reply(value) {
  return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON);
}
