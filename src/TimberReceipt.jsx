import React, { useState } from 'react';
import { receiptTotals } from './timberReceipt';
import './timberReceipt.css';

const localDate = () => {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};
const newRow = () => ({ id: crypto.randomUUID(), wood: '', length: '', girth: '' });
const newReceipt = () => ({ shop: '', shopAddress: '', mobile: '', number: '', date: localDate(), customer: '', village: '', rate: '0', advance: '0', rows: [newRow()] });
const decimal = value => value.toLocaleString('en-IN', { minimumFractionDigits: 4, maximumFractionDigits: 4 });
const money = value => value.toLocaleString('en-IN', { style: 'currency', currency: 'INR' });

export default function TimberReceipt({ userId = 'local' }) {
  const [receipt, setReceipt] = useState(newReceipt);
  const [message, setMessage] = useState('');
  const key = `sab-tools-timber-receipt-v1:${userId}`;
  const totals = receiptTotals(receipt.rows, receipt.rate, receipt.advance);
  const set = (field, value) => { setReceipt(old => ({ ...old, [field]: value })); setMessage(''); };
  const setRow = (id, field, value) => set('rows', receipt.rows.map(row => row.id === id ? { ...row, [field]: value } : row));
  const fields = [ ['shop', 'दुकान / आरा मशीन का नाम'], ['shopAddress', 'दुकान का पता'], ['mobile', 'मोबाइल नंबर'], ['number', 'रसीद नंबर'], ['date', 'दिनांक'], ['customer', 'ग्राहक का नाम'], ['village', 'ग्राहक का पता / गाँव'] ];
  const complete = totals.valid && receipt.shop.trim() && receipt.number.trim() && receipt.customer.trim() && receipt.date && receipt.rows.every(row => row.wood.trim());
  const print = () => {
    if (!complete) { setMessage('रसीद के लिए दुकान, रसीद नंबर, दिनांक, ग्राहक और हर पंक्ति की लकड़ी किस्म व सही माप भरें। दर और जमा राशि शून्य या अधिक रखें।'); return; }
    setMessage('');
    window.print();
  };
  const save = () => {
    try { localStorage.setItem(key, JSON.stringify(receipt)); setMessage('ड्राफ्ट इस ब्राउज़र में सेव हुआ। यह क्लाउड बैकअप नहीं है।'); }
    catch { setMessage('इस ब्राउज़र में ड्राफ्ट सेव नहीं हो पाया।'); }
  };
  const load = () => {
    try {
      const value = JSON.parse(localStorage.getItem(key));
      if (!value) { setMessage('इस ब्राउज़र में कोई सेव किया हुआ ड्राफ्ट नहीं मिला।'); return; }
      if (!Array.isArray(value.rows) || !value.rows.length || value.rows.length > 500 || !fields.every(([field]) => typeof value[field] === 'string') || typeof value.rate !== 'string' || typeof value.advance !== 'string' || !value.rows.every(row => ['wood', 'length', 'girth'].every(field => typeof row[field] === 'string'))) throw new Error('Invalid draft');
      if (!confirm('वर्तमान जानकारी हटाकर सेव किया हुआ ड्राफ्ट खोलें?')) return;
      setReceipt({ ...value, rows: value.rows.map(row => ({ ...row, id: crypto.randomUUID() })) });
      setMessage('सेव किया हुआ ड्राफ्ट खुल गया।');
    } catch { setMessage('सेव किया हुआ ड्राफ्ट नहीं खुल पाया।'); }
  };
  return <section className="timber-tool" lang="hi">
    <div className="receipt-editor">
      <h1>लकड़ी CFT और रसीद</h1>
      <p className="hint">गोल लकड़ी का सूत्र: लंबाई (ft) × गोलाई (in) × गोलाई (in) ÷ 2304। गोलाई का मतलब चारों तरफ का घेरा है, व्यास नहीं। यह व्यापारिक 2304 विधि है।</p>
      <div className="form"><h2>रसीद की जानकारी</h2><div className="two">{fields.map(([field, label]) => <label key={field}>{label}<input type={field === 'date' ? 'date' : field === 'mobile' ? 'tel' : 'text'} maxLength={field === 'mobile' ? 20 : 160} value={receipt[field]} onChange={event => set(field, event.target.value)} /></label>)}</div></div>
      <h2>लकड़ी के माप</h2>
      <div className="timber-rows">{receipt.rows.map((row, index) => <div className="timber-row form" key={row.id}>
        <div className="timber-row-head"><b>लकड़ी {index + 1}</b><button type="button" className="secondary" aria-label={`लकड़ी ${index + 1} हटाएँ`} disabled={receipt.rows.length === 1} onClick={() => set('rows', receipt.rows.filter(item => item.id !== row.id))}>हटाएँ</button></div>
        <label>लकड़ी किस्म<input aria-label={`लकड़ी ${index + 1} किस्म`} placeholder="जैसे: शीशम" maxLength={80} value={row.wood} onChange={event => setRow(row.id, 'wood', event.target.value)} /></label>
        <div className="timber-measures">{[['length', 'लंबाई (ft)'], ['girth', 'गोलाई (in)']].map(([field, label]) => <label key={field}>{label}<input aria-label={`लकड़ी ${index + 1} ${label}`} type="number" inputMode="decimal" min="0" step="any" placeholder="0" value={row[field]} onChange={event => setRow(row.id, field, event.target.value)} /></label>)}</div>
        <p className="row-volume">CFT: <b>{totals.volumes[index] === null ? 'माप भरें' : decimal(totals.volumes[index])}</b></p>
      </div>)}</div>
      <button type="button" className="secondary wide" onClick={() => set('rows', [...receipt.rows, newRow()])}>+ लकड़ी जोड़ें</button>
      <div className="result"><span>कुल CFT {totals.volumes.some(volume => volume === null) ? '(अधूरे माप)' : ''}</span><strong>{decimal(totals.cft)}</strong></div>
      <div className="form two"><label>दर (₹ / CFT)<input type="number" inputMode="decimal" min="0" step="0.01" value={receipt.rate} onChange={event => set('rate', event.target.value)} /></label><label>जमा राशि (₹)<input type="number" inputMode="decimal" min="0" step="0.01" value={receipt.advance} onChange={event => set('advance', event.target.value)} /></label></div>
      {!totals.valid && <p className="hint">सभी लंबाई और गोलाई शून्य से अधिक भरें। दर और जमा राशि शून्य या अधिक होनी चाहिए। अधूरी जानकारी से रसीद प्रिंट नहीं होगी।</p>}
      <div className="receipt-actions"><button className="primary" type="button" onClick={print}>प्रिंट / PDF सेव करें</button><button className="secondary" type="button" onClick={save}>ड्राफ्ट सेव</button><button className="secondary" type="button" onClick={load}>ड्राफ्ट खोलें</button><button className="secondary" type="button" onClick={() => { if (confirm('नई रसीद शुरू करें? वर्तमान जानकारी हट जाएगी। सेव किया हुआ ड्राफ्ट नहीं हटेगा।')) { setReceipt(newReceipt()); setMessage(''); } }}>नई रसीद</button></div>
      <p className="hint">प्रिंट मेन्यू में "Save as PDF" चुनें, अगर आपके ब्राउज़र में उपलब्ध हो। फिर सेव की हुई PDF WhatsApp पर भेज सकते हैं। ड्राफ्ट केवल इस डिवाइस के ब्राउज़र में रहता है; साइट डेटा हटाने से मिट सकता है।</p>
      {message && <div className="notice" role="status">{message}</div>}
      <h2>रसीद का प्रीव्यू</h2>
    </div>
    <article className="timber-receipt" aria-label="रसीद का प्रीव्यू">
      <div className="receipt-heading"><h2>{receipt.shop || 'दुकान / आरा मशीन का नाम'}</h2><p>{receipt.shopAddress || 'दुकान का पता'}</p>{receipt.mobile && <p>मो.: {receipt.mobile}</p>}<h3>लकड़ी की रसीद</h3></div>
      <div className="receipt-meta"><span>रसीद नं.: {receipt.number || '-'}</span><span>दिनांक: {receipt.date ? receipt.date.split('-').reverse().join('/') : '-'}</span></div>
      <p>ग्राहक का नाम: {receipt.customer || '-'}</p><p>पता / गाँव: {receipt.village || '-'}</p>
      <table><thead><tr><th scope="col">क्र.सं.</th><th scope="col">लकड़ी किस्म</th><th scope="col">लंबाई<br />(ft)</th><th scope="col">गोलाई<br />(in)</th><th scope="col">CFT</th></tr></thead><tbody>{receipt.rows.map((row, index) => <tr key={row.id}><td>{index + 1}</td><td>{row.wood || '-'}</td><td>{row.length || '-'}</td><td>{row.girth || '-'}</td><td>{totals.volumes[index] === null ? '-' : decimal(totals.volumes[index])}</td></tr>)}</tbody></table>
      <div className="receipt-summary"><p><span>कुल CFT{totals.volumes.some(volume => volume === null) ? ' (अधूरा)' : ''}</span><b>{decimal(totals.cft)}</b></p><p><span>दर / CFT</span><b>{totals.valid ? money(Number(receipt.rate)) : '-'}</b></p><p><span>कुल राशि</span><b>{totals.valid ? money(totals.total) : '-'}</b></p><p><span>जमा राशि</span><b>{totals.valid ? money(totals.advance) : '-'}</b></p><p><span>{totals.balance < 0 ? 'अधिक जमा (वापसी)' : 'बकाया राशि'}</span><b>{totals.valid ? money(Math.abs(totals.balance)) : '-'}</b></p></div>
      <p className="receipt-method">CFT = लंबाई (ft) × गोलाई (in)² ÷ 2304। कुल राशि बिना राउंड किए CFT से निकाली गई है; प्रदर्शित CFT 4 दशमलव और राशि 2 दशमलव तक है।</p>
      <div className="receipt-signature">हस्ताक्षर: ____________________</div>
    </article>
  </section>;
}
