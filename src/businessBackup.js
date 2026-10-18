// Versioned backup export and validated import for the local business store.
// Import never overwrites or deletes silently: existing ids are skipped and
// conflicts are reported, and nothing is written until the user confirms.
import {listAll, writeCollection, COLLECTIONS} from './businessStore.js';

export const BACKUP_KIND = 'sab-tools-business-backup';
export const BACKUP_VERSION = 1;

export function exportBackup(uid) {
  const data = listAll(uid);
  const payload = {app: BACKUP_KIND, version: BACKUP_VERSION, exportedAt: new Date().toISOString(), uid, records: {}};
  let count = 0;
  for (const collection of COLLECTIONS) { payload.records[collection] = data[collection]; count += data[collection].length; }
  payload.recordCount = count;
  if (count === 0) throw new Error('There are no records to back up yet.');
  return payload;
}

const REQUIRED_FIELDS = {
  customers: ['id', 'name', 'createdAt'],
  projects: ['id', 'name', 'status', 'createdAt'],
  transactions: ['id', 'clientId', 'projectId', 'type', 'amount', 'status'],
  estimates: ['id', 'number', 'customerId', 'lines', 'createdAt'],
  materials: ['id', 'projectId', 'name', 'quantity', 'unitPrice'],
  labour: ['id', 'projectId', 'worker', 'quantity', 'rate']
};

export function validateBackupFile(parsed) {
  if (!parsed || typeof parsed !== 'object') return {ok: false, error: 'This file is not a SAB TOOLS backup.'};
  if (parsed.app !== BACKUP_KIND) return {ok: false, error: 'This file is not a SAB TOOLS business backup.'};
  if (parsed.version !== BACKUP_VERSION) return {ok: false, error: `Backup version ${parsed.version} is not supported. Use version ${BACKUP_VERSION}.`};
  if (!parsed.records || typeof parsed.records !== 'object') return {ok: false, error: 'The backup has no records section.'};
  const counts = {}, problems = [];
  for (const collection of COLLECTIONS) {
    const rows = parsed.records[collection];
    if (!Array.isArray(rows)) { if (rows !== undefined) problems.push(`${collection}: not a list.`); counts[collection] = 0; continue; }
    counts[collection] = rows.length;
    const required = REQUIRED_FIELDS[collection];
    rows.forEach((row, index) => {
      if (!row || typeof row !== 'object') { problems.push(`${collection} #${index + 1}: broken record.`); return; }
      for (const field of required) if (row[field] === undefined) problems.push(`${collection} #${index + 1}: missing ${field}.`);
      if (typeof row.amount === 'number' && (!Number.isFinite(row.amount) || row.amount < 0)) problems.push(`${collection} #${index + 1}: bad amount.`);
    });
    const ids = rows.map(row => row && row.id);
    if (new Set(ids).size !== ids.length) problems.push(`${collection}: duplicate ids inside the backup file.`);
  }
  if (problems.length) return {ok: false, error: `Backup file has problems: ${problems.slice(0, 5).join(' ')}${problems.length > 5 ? ` (${problems.length} issues total)` : ''}`};
  const total = COLLECTIONS.reduce((sum, c) => sum + counts[c], 0);
  if (total === 0) return {ok: false, error: 'This backup contains no records.'};
  return {ok: true, counts, total, uid: parsed.uid || '', exportedAt: parsed.exportedAt || ''};
}

// Preview what an import would do BEFORE anything is written.
export function planImport(uid, parsed) {
  const validation = validateBackupFile(parsed);
  if (!validation.ok) return validation;
  const existing = listAll(uid);
  const plan = {ok: true, counts: validation.counts, total: validation.total, add: {}, skipExisting: {}};
  for (const collection of COLLECTIONS) {
    const rows = parsed.records[collection] || [];
    const known = new Set((existing[collection] || []).map(row => row.id));
    plan.add[collection] = rows.filter(row => !known.has(row.id));
    plan.skipExisting[collection] = rows.length - plan.add[collection].length;
  }
  // Cross-collection integrity: transactions and materials/labour pointing at
  // projects that do not exist in this account or the backup get dropped.
  const projectIds = new Set([...(existing.projects || []).map(p => p.id), ...rows('projects')]);
  function rows(name) { return parsed.records[name] || []; }
  plan.orphans = 0;
  for (const collection of ['transactions', 'materials', 'labour']) {
    const before = plan.add[collection].length;
    plan.add[collection] = plan.add[collection].filter(row => projectIds.has(row.projectId));
    plan.orphans += before - plan.add[collection].length;
  }
  return plan;
}

// Restore. Written only after the user has seen the plan and confirmed.
export function importBackup(uid, parsed) {
  const plan = planImport(uid, parsed);
  if (!plan.ok) throw new Error(plan.error);
  // Read current state once more, then write each collection additively so a
  // failure partway leaves earlier writes intact and nothing is deleted.
  const written = {};
  for (const collection of COLLECTIONS) {
    const additions = plan.add[collection];
    if (!additions.length) { written[collection] = 0; continue; }
    const current = JSON.parse(localStorage.getItem(`sab-business-${uid}-${collection}`) || '[]');
    writeCollection(uid, collection, [...current, ...additions]);
    written[collection] = additions.length;
  }
  return {written, skipped: plan.skipExisting, orphans: plan.orphans};
}
