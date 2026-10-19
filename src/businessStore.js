// Generic local business-record store. Every collection lives under its own
// namespaced key so guest (local) data and signed-in account data never mix.
// Cloud mirroring is deliberately NOT implemented here: this store is a local
// record, not a cloud backup, and callers must say so in the UI.
const PREFIX = 'sab-business';
export const COLLECTIONS = ['customers', 'projects', 'transactions', 'estimates', 'materials', 'labour'];

export const collectionKey = (uid, collection) => `${PREFIX}-${uid}-${collection}`;

export function readCollection(uid, collection) {
  if (!COLLECTIONS.includes(collection)) throw new Error(`Unknown collection ${collection}.`);
  try {
    const raw = localStorage.getItem(collectionKey(uid, collection));
    const parsed = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) throw new Error('corrupt');
    return parsed;
  } catch {
    // A corrupted read must never crash the app or look like success.
    return null;
  }
}

export function writeCollection(uid, collection, records) {
  if (!COLLECTIONS.includes(collection)) throw new Error(`Unknown collection ${collection}.`);
  if (!Array.isArray(records)) throw new Error('Records must be an array.');
  try {
    localStorage.setItem(collectionKey(uid, collection), JSON.stringify(records));
  } catch (error) {
    if (String(error?.name || '').includes('Quota')) throw new Error('This device is out of storage space. Export a backup and remove old receipts to free space.', {cause: error});
    throw new Error('Could not save on this device. Storage may be blocked by your browser.', {cause: error});
  }
  window.dispatchEvent(new CustomEvent('sab-business-changed', {detail: {uid, collection}}));
}

export function listAll(uid) {
  const all = {};
  for (const collection of COLLECTIONS) all[collection] = readCollection(uid, collection) || [];
  return all;
}

export function watchBusiness(uid, onChange) {
  const handler = event => {
    const detail = event.detail || {};
    if (detail.uid && detail.uid !== uid) return; // account-switch guard
    onChange(detail.collection);
  };
  window.addEventListener('sab-business-changed', handler);
  window.addEventListener('storage', handler);
  return () => {
    window.removeEventListener('sab-business-changed', handler);
    window.removeEventListener('storage', handler);
  };
}

export function uid() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function nowIso() { return new Date().toISOString(); }

// Insert or replace by stable id. Returns the full updated list.
export function upsertRecord(uid, collection, record) {
  const records = readCollection(uid, collection) || [];
  const next = [...records.filter(item => item.id !== record.id), record];
  writeCollection(uid, collection, next);
  return next;
}

export function removeRecord(uid, collection, id) {
  const records = readCollection(uid, collection) || [];
  writeCollection(uid, collection, records.filter(item => item.id !== id));
  return records.filter(item => item.id !== id);
}
