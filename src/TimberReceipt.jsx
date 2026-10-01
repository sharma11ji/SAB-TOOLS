import React, { useEffect, useRef, useState } from 'react';
import { receiptTotals } from './timberReceipt';
import './timberReceipt.css';
import {receiptRecord, validReceipt} from './receiptRecords';
import {storeReceipt} from './ReceiptTools';
import {FORM_ENDPOINT, mirrorReceipt, isRegisterOwner} from './sheetMirror';
import PersonalSheetSetup from './PersonalSheetSetup';
import {queuePersonalReceipt} from './personalSheet';
import {db} from './firebase';

const localDate = () => {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};
const newRow = () => ({ id: crypto.randomUUID(), wood: '', length: '', girth: '', rate: '0' });
const newReceipt = () => ({ shop: '', shopAddress: '', mobile: '', number: '1', date: localDate(), customer: '', village: '', rate: '0', advance: '0', labour: '0', transport: '0', rows: [newRow()] });
const decimal = value => value.toLocaleString('en-IN', { minimumFractionDigits: 4, maximumFractionDigits: 4 });
const money = value => value.toLocaleString('en-IN', { style: 'currency', currency: 'INR' });

const settingsKey = userId => `sab-tools-timber-settings-v1:${userId}`;
const defaultSettings = { shop: '', shopAddress: '', mobile: '', rate: '0' };
const readSettings = userId => {
  try {
    const saved = JSON.parse(localStorage.getItem(settingsKey(userId)));
    if (saved && ['shop', 'shopAddress', 'mobile', 'rate'].every(field => typeof saved[field] === 'string') && saved.rate.trim() !== '' && Number.isFinite(Number(saved.rate)) && Number(saved.rate) >= 0) return saved;
  } catch {}
  return defaultSettings;
};
const receiptWithSettings = userId => {
  const settings = readSettings(userId);
  return { ...newReceipt(), ...settings, rows: [{ ...newRow(), rate: settings.rate }] };
};

export default function TimberReceipt({ userId = 'local', initialReceipt }) {
  const [receipt, setReceipt] = useState(() => receiptWithSettings(userId));
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const ownerRegister = isRegisterOwner(userId);
  const mirrorSettingsKey = `sab-tools-form-enabled-v1:${userId}:${FORM_ENDPOINT}`;
  const [sheetEnabled, setSheetEnabled] = useState(() => { try { return ownerRegister && localStorage.getItem(mirrorSettingsKey) === 'yes'; } catch { return false; } });
  const [sheetSettingsMessage, setSheetSettingsMessage] = useState('');
  const sheetConsent = useRef(sheetEnabled);
  useEffect(() => {
    if (!ownerRegister) {
      sheetConsent.current = false;
      setSheetEnabled(false);
      try { localStorage.removeItem(mirrorSettingsKey); } catch {}
    }
  }, [ownerRegister, mirrorSettingsKey]);
  const recordId = useRef(crypto.randomUUID());
  const saving = useRef(false);
  useEffect(() => {
    if (!initialReceipt || !validReceipt(initialReceipt)) return;
    setReceipt({...initialReceipt, rows: initialReceipt.rows.map(row => ({...row, id: crypto.randomUUID()}))});
    recordId.current = initialReceipt.id || crypto.randomUUID();
    setMessage('Saved receipt opened. Saving again updates this receipt.');
  }, [initialReceipt]);
  const key = `sab-tools-timber-receipt-v1:${userId}`;
  const totals = receiptTotals(receipt.rows, receipt.rate, receipt.advance, receipt.labour, receipt.transport);
  const set = (field, value) => { setReceipt(old => ({ ...old, [field]: value })); setMessage(''); };
  const setRow = (id, field, value) => set('rows', receipt.rows.map(row => row.id === id ? { ...row, [field]: value } : row));
  const fields = [ ['shop', 'Shop / sawmill name'], ['shopAddress', 'Shop address'], ['mobile', 'Mobile number'], ['number', 'Receipt number'], ['date', 'Date'], ['customer', 'Customer name'], ['village', 'Customer address / village'] ];
  const complete = totals.valid && receipt.shop.trim() && receipt.number.trim() && receipt.customer.trim() && receipt.date;
  const print = async () => {
    if (!complete) { setMessage('For a receipt, fill in the shop, receipt number, date, customer and valid measurements for every row. Rates and payments must be zero or more.'); return; }
    if (await saveCloud()) window.print();
  };
  const saveCloud = async () => {
    if (saving.current) return false;
    if (!complete) {setMessage('Complete the shop, receipt number, date, customer and valid measurements first.'); return false;}
    saving.current = true; setBusy(true);
    try {
      const record = receiptRecord(receipt, recordId.current);
      setMessage(await storeReceipt(userId, record));
      if (userId !== 'local' && db) {
        if (ownerRegister) void mirrorReceipt(record, {enabled: sheetConsent.current, uid: userId});
        else {
          try { if (await queuePersonalReceipt(userId, record)) setSheetSettingsMessage('Receipt sent to your Google Sheet.'); }
          catch (error) { setSheetSettingsMessage(`Cloud receipt saved. Sheet sync needs attention: ${error.message}`); }
        }
      }
      return true;
    }
    catch (error) {setMessage(`Receipt was not saved: ${error.message} You can still save a local draft. Printing has not started.`); return false;}
    finally {saving.current = false; setBusy(false);}
  };
  const save = () => {
    try { localStorage.setItem(key, JSON.stringify(receipt)); setMessage('Draft saved in this browser. This is not a cloud backup.'); }
    catch { setMessage('Could not save a draft in this browser.'); }
  };
  const saveSettings = () => {
    if (receipt.rate.trim() === '' || !Number.isFinite(Number(receipt.rate)) || Number(receipt.rate) < 0) { setMessage('Enter a valid rate: zero or more.'); return; }
    try {
      const settings = Object.fromEntries(['shop', 'shopAddress', 'mobile', 'rate'].map(field => [field, receipt[field]]));
      localStorage.setItem(settingsKey(userId), JSON.stringify(settings));
      setMessage('Shop details and rate saved in this browser. They will fill new receipts.');
    } catch { setMessage('Settings could not be saved.'); }
  };
  const load = () => {
    try {
      const value = JSON.parse(localStorage.getItem(key));
      if (!value) { setMessage('No saved draft was found in this browser.'); return; }
      if (!Array.isArray(value.rows) || !value.rows.length || value.rows.length > 500 || !fields.every(([field]) => typeof value[field] === 'string') || typeof value.rate !== 'string' || typeof value.advance !== 'string' || typeof value.labour !== 'string' || typeof value.transport !== 'string' || !value.rows.every(row => ['wood', 'length', 'girth', 'rate'].every(field => typeof row[field] === 'string'))) throw new Error('Invalid draft');
      if (!confirm('Replace current entries with the saved draft?')) return;
      recordId.current = crypto.randomUUID();
      setReceipt({ ...value, rows: value.rows.map(row => ({ ...row, id: crypto.randomUUID() })) });
      setMessage('Saved draft opened.');
    } catch { setMessage('Saved draft could not be opened.'); }
  };
  return <section className="timber-tool" lang="en">
    <div className="receipt-editor">
      <h1>Timber CFT and receipt</h1>
      <p>Enter length, girth and one rate per CFT. Each wood amount and the total update automatically. Tap "+ Add wood" for the next piece.</p>
      <p className="hint">Length is in feet (ft), girth in inches (in). Girth is the circumference, not the diameter.</p>

      <h2>Wood measurements</h2>
      <div className="form timber-rate"><label>Rate for all wood (₹ / CFT)<input aria-label="Rate for all wood (₹ / CFT)" type="number" inputMode="decimal" min="0" step="0.01" placeholder="e.g. 50 or 55" value={receipt.rate} onChange={event => { const rate = event.target.value; setReceipt(old => ({ ...old, rate, rows: old.rows.map(row => ({ ...row, rate })) })); setMessage(''); }} /></label><p className="hint">Enter the rate once. Amount = each wood's CFT × this rate.</p></div>
      {receipt.rows.some(row => row.rate !== receipt.rate) && <p className="notice" role="status">This older receipt has individual wood rates. Its original amounts are preserved below. Enter a rate above to apply it to every wood.</p>}
      <div className="timber-rows">{receipt.rows.map((row, index) => <div className="timber-row form" key={row.id}>
        <div className="timber-row-head"><b>Wood {index + 1}</b><button type="button" className="secondary" aria-label={`Wood ${index + 1} Remove`} disabled={receipt.rows.length === 1} onClick={() => set('rows', receipt.rows.filter(item => item.id !== row.id))}>Remove</button></div>

        <div className="timber-measures">{[['length', 'Length (ft)'], ['girth', 'Girth (in)']].map(([field, label]) => <label key={field}>{label}<input id={field === 'length' ? `timber-length-${row.id}` : undefined} aria-label={`Wood ${index + 1} ${label}`} type="number" inputMode="decimal" min="0" step="any" placeholder="0" value={row[field]} onChange={event => setRow(row.id, field, event.target.value)} /></label>)}</div>
<p className="row-volume">CFT: <b>{totals.volumes[index] === null ? 'Enter measurements' : decimal(totals.volumes[index])}</b> · Amount: <b>{totals.volumes[index] !== null && Number.isFinite(totals.amounts[index]) && Number(row.rate) >= 0 && row.rate !== '' ? money(totals.amounts[index]) : '-'}</b></p>
        <details className="timber-optional"><summary>Wood type (optional)</summary><label>Wood type<input aria-label={`Wood ${index + 1} type`} placeholder="e.g. Teak" maxLength={80} value={row.wood} onChange={event => setRow(row.id, 'wood', event.target.value)} /></label></details>
      </div>)}</div>
      <button type="button" className="secondary wide" onClick={() => { const row = { ...newRow(), rate: receipt.rate }; set('rows', [...receipt.rows, row]); requestAnimationFrame(() => { const input = document.getElementById(`timber-length-${row.id}`); input?.focus(); input?.scrollIntoView({block: 'center', behavior: 'smooth'}); }); }}>+ Add wood</button>
      <div className="result"><span>Total CFT {totals.volumes.some(volume => volume === null) ? '(incomplete measurements)' : ''}</span><strong>{decimal(totals.cft)}</strong></div>
      <div className="result"><span>Wood amount {totals.volumes.some(volume => volume === null) ? '(incomplete measurements)' : ''}</span><strong>{totals.valid ? money(totals.woodValue) : '-'}</strong></div>
      <details className="timber-billing"><summary>Need a receipt? Add names and billing details</summary>
      <div className="form"><h2>Receipt details</h2><div className="two">{fields.map(([field, label]) => <label key={field}>{label}<input type={field === 'date' ? 'date' : field === 'mobile' ? 'tel' : 'text'} maxLength={field === 'mobile' ? 20 : 160} value={receipt[field]} onChange={event => set(field, event.target.value)} /></label>)}</div></div>
      <div className="form two"><label>Amount paid (₹)<input type="number" inputMode="decimal" min="0" step="0.01" value={receipt.advance} onChange={event => set('advance', event.target.value)} /></label><label>Sawing / cutting labour (₹)<input type="number" inputMode="decimal" min="0" step="0.01" value={receipt.labour} onChange={event => set('labour', event.target.value)} /></label><label>Transport (₹)<input type="number" inputMode="decimal" min="0" step="0.01" value={receipt.transport} onChange={event => set('transport', event.target.value)} /></label></div>
      <button className="secondary" type="button" onClick={saveSettings}>Save shop details and rate</button>
      <p className="hint">Saved shop details and this rate fill new receipts on this browser only. Clearing site data removes them.</p>
      </details>
      {!totals.valid && <p className="hint">Enter positive lengths and girths. Rates and payments must be zero or more. Incomplete receipts cannot be saved or printed.</p>}
      {ownerRegister ? <details className="form sheet-mirror">
        <summary>Shared shop register setup</summary>
        <p className="hint">When enabled, every receipt successfully saved to your cloud account automatically sends its date, receipt number, customer, village, wood items, CFT, rate, total, paid, balance, labour and transport to the shop owner's Google Form. If linked to a Sheet, each response fills separate register columns in its Form Responses tab. Older rows may still have a legacy Receipt data cell. Your own saved receipt stays the main record. No PDF is uploaded.</p>
        <p className="hint">Only enable for this shop's work on a trusted device. Setup is saved for your signed-in account on this browser. Closing the app does not stop sharing. Sending may fail; check the responses yourself. Re-saving or printing can add duplicate rows.</p>
        {sheetEnabled ? <><p>Automatic sharing is enabled on this device for this account.</p><button type="button" className="secondary" onClick={() => { try { localStorage.removeItem(mirrorSettingsKey); sheetConsent.current = false; setSheetEnabled(false); setSheetSettingsMessage('Automatic sharing stopped.'); } catch { setSheetSettingsMessage('Could not clear the saved setup.'); } }}>Stop automatic sharing</button></> : <>
          <button type="button" className="secondary" onClick={() => { if (!isRegisterOwner(userId)) return; try { localStorage.setItem(mirrorSettingsKey, 'yes'); sheetConsent.current = true; setSheetEnabled(true); setSheetSettingsMessage('Automatic sharing enabled. Future saves will be sent, but delivery cannot be confirmed here.'); } catch { setSheetSettingsMessage('Setup could not be saved on this device.'); } }}>Enable automatic sharing on this device</button>
          <p className="hint">Without setup, receipts save normally but are not sent to the shared register. Past saves are not sent automatically.</p>
        </>}
        {sheetSettingsMessage && <p role="status">{sheetSettingsMessage}</p>}
      </details> : userId !== 'local' && db ? <PersonalSheetSetup userId={userId} message={sheetSettingsMessage} onMessage={setSheetSettingsMessage}/> : <p className="hint">Sign in with Google to connect a personal register. Local drafts are not sent.</p>}
      <div className="receipt-actions"><button className="primary" type="button" disabled={busy} onClick={print}>Save PDF / print</button><button className="secondary" type="button" disabled={busy} onClick={saveCloud}>{busy ? 'Saving...' : 'Save receipt'}</button><button className="secondary" type="button" onClick={save}>Save draft</button><button className="secondary" type="button" onClick={load}>Open draft</button><button className="secondary" type="button" onClick={() => { if (confirm('Start a new receipt? Current entries will be cleared. Your saved draft and receipts will remain.')) { setReceipt(receiptWithSettings(userId)); recordId.current = crypto.randomUUID(); setMessage(''); } }}>New receipt</button></div>
      <p className="hint">Save receipt stores the complete receipt in your cloud account, or on this browser in local mode. PDF saves the receipt first, then opens the browser print menu. Choose "Save as PDF" if available. Drafts stay on this device only.</p>
      {message && <div className="notice" role="status">{message}</div>}
      <h2>Receipt preview</h2>
    </div>
    <article className="timber-receipt receipt-preview" aria-label="Receipt preview">
      <div className="receipt-heading"><p>Shri Vishwakarma Namah</p><h2>{receipt.shop || 'Shop / sawmill name'}</h2><p>{receipt.shopAddress || 'Shop address'}</p>{receipt.mobile && <p>Mobile: {receipt.mobile}</p>}<h3>Timber receipt</h3></div>
      <div className="receipt-meta"><span>Receipt no.: {receipt.number || '-'}</span><span>Date: {receipt.date ? receipt.date.split('-').reverse().join('/') : '-'}</span></div>
      <p>Customer name: {receipt.customer || '-'}</p><p>Address / village: {receipt.village || '-'}</p>
      <table><thead><tr><th scope="col">No.</th><th scope="col">Wood type</th><th scope="col">Length<br />(ft)</th><th scope="col">Girth<br />(in)</th><th scope="col">CFT</th><th scope="col">Rate<br />(₹/CFT)</th><th scope="col">Amount<br />(₹)</th></tr></thead><tbody>{receipt.rows.map((row, index) => <tr key={row.id}><td>{index + 1}</td><td>{row.wood || '-'}</td><td>{row.length || '-'}</td><td>{row.girth || '-'}</td><td>{totals.volumes[index] === null ? '-' : decimal(totals.volumes[index])}</td><td>{row.rate === '' || !Number.isFinite(Number(row.rate)) || Number(row.rate) < 0 ? '-' : Number(row.rate).toLocaleString('en-IN')}</td><td>{totals.volumes[index] !== null && Number.isFinite(totals.amounts[index]) && row.rate !== '' && Number(row.rate) >= 0 ? totals.amounts[index].toLocaleString('en-IN', {minimumFractionDigits:2,maximumFractionDigits:2}) : '-'}</td></tr>)}</tbody></table>
      <div className="receipt-summary"><p><span>Total pieces</span><b>{receipt.rows.length}</b></p><p><span>Total CFT{totals.volumes.some(volume => volume === null) ? ' (incomplete)' : ''}</span><b>{decimal(totals.cft)}</b></p><p><span>Wood value</span><b>{totals.valid ? money(totals.woodValue) : '-'}</b></p><p><span>Sawing / cutting labour</span><b>{totals.valid ? money(totals.labour) : '-'}</b></p><p><span>Transport</span><b>{totals.valid ? money(totals.transport) : '-'}</b></p><p><span>Grand total</span><b>{totals.valid ? money(totals.total) : '-'}</b></p><p><span>Amount paid</span><b>{totals.valid ? money(totals.advance) : '-'}</b></p><p><span>{totals.balance < 0 ? 'Overpayment (refund)' : 'Balance due'}</span><b>{totals.valid ? money(Math.abs(totals.balance)) : '-'}</b></p></div>
      <p className="receipt-method">CFT = length (ft) × girth (in)² ÷ 2304. Each wood amount uses unrounded CFT and is rounded to paise before adding. Displayed CFT uses 4 decimals; money uses 2.</p>
      <div className="receipt-signature">Signature: ____________________</div>
    </article>
  </section>;
}
