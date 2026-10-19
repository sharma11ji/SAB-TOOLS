// Business manager: dashboard, projects, saved customers, estimates and
// backup. All data is stored locally on this device, namespaced per account.
// This is NOT cloud sync: signed-in and guest data never mix.
import React, {useEffect, useState} from 'react';
import {readCollection, watchBusiness} from './businessStore.js';
import {saveCustomer, searchCustomers, findDuplicates, deleteCustomer, sortCustomers} from './businessCustomers.js';
import {saveProject, saveMaterial, saveLabour, saveTransaction, voidTransaction, deleteProject, archiveProject, projectTotals, transactionHistory, STATUS_LABELS, MATERIAL_UNITS, PAYMENT_METHODS} from './projectsLedger.js';
import {saveEstimate, duplicateEstimate, setEstimateStatus, estimateTotals, STATUS_LABELS as ESTIMATE_LABELS} from './estimates.js';
import {dashboardStats} from './businessDashboard.js';
import {exportBackup, planImport, importBackup, validateBackupFile} from './businessBackup.js';
import {money} from './paymentLedger';
import PaymentDialog from './PaymentDialog';

const today = () => new Date().toISOString().slice(0, 10);
const dateLabel = value => value ? String(value).slice(0, 10).split('-').reverse().join('/') : '';

function Notice({uid}) {
  return uid === 'local'
    ? <p className="hint">Saved on this device only. Sign in to keep guest data and account data separate. Local only. Not a cloud backup.</p>
    : <p className="hint">Saved on this device. Local only. Not a cloud backup.</p>;
}

export default function Business({userId, active}) {
  const [section, setSection] = useState('dashboard');
  const [refreshKey, setRefreshKey] = useState(0);
  useEffect(() => {
    if (!active) return;
    return watchBusiness(userId, () => setRefreshKey(k => k + 1));
  }, [userId, active]);
  const bump = () => setRefreshKey(k => k + 1);
  const tabs = [['dashboard', 'Dashboard'], ['projects', 'Projects'], ['customers', 'Customers'], ['estimates', 'Estimates'], ['backup', 'Backup']];
  return (
    <section className="baki-tool">
      <h1>My business</h1>
      <Notice uid={userId} />
      <div className="tabs" aria-label="Business sections">
        {tabs.map(([id, label]) => <button key={id} aria-pressed={section === id} onClick={() => setSection(id)}>{label}</button>)}
      </div>
      {section === 'dashboard' && <DashboardSection userId={userId} onOpenProjects={() => setSection('projects')} />}
      {section === 'projects' && <ProjectsSection userId={userId} refreshKey={refreshKey} bump={bump} />}
      {section === 'customers' && <CustomersSection userId={userId} refreshKey={refreshKey} bump={bump} />}
      {section === 'estimates' && <EstimatesSection userId={userId} refreshKey={refreshKey} bump={bump} />}
      {section === 'backup' && <BackupSection userId={userId} bump={bump} />}
    </section>
  );
}

function DashboardSection({userId, onOpenProjects}) {
  const stats = dashboardStats(userId);
  const rows = stats.projects.map(project => ({project, t: stats.projectTotals.get(project.id)}));
  return (
    <div>
      <div className="report-split">
        <div className="report-box received"><span>Total received</span><strong>{money(stats.totalPaid)}</strong></div>
        <div className="report-box pending"><span>Outstanding</span><strong>{money(stats.totalOutstanding)}</strong></div>
      </div>
      <div className="miniStats">
        <div><span>Active projects</span><b>{stats.activeProjects.length}</b></div>
        <div><span>Completed</span><b>{stats.completedProjects.length}</b></div>
        <div><span>Saved customers</span><b>{stats.totalCustomers}</b></div>
        <div><span>Pending estimates</span><b>{stats.pendingEstimates.length} · {money(stats.pendingEstimateValue)}</b></div>
        <div><span>Recorded cost</span><b>{money(stats.totalCost)}</b></div>
        <div><span>Spent vs received</span><b>{money(stats.totalCost)} / {money(stats.totalPaid)}</b></div>
      </div>
      <h2>Recent transactions</h2>
      {!stats.recentTransactions.length && <p className="empty">No transactions yet. Add payments or expenses inside a project.</p>}
      {stats.recentTransactions.map(tx => (
        <div className="history" key={tx.id}>
          <div><b>{TX_LABELS[tx.type]} · {money(tx.amount)}</b><span>{tx.projectName || 'Project removed'} · {dateLabel(tx.date)}{tx.status === 'voided' ? ' · voided' : ''}</span></div>
        </div>
      ))}
      <h2>Upcoming deadlines</h2>
      {!stats.upcomingDeadlines.length && <p className="empty">No project deadlines set. Set an expected completion date on a project.</p>}
      {stats.upcomingDeadlines.map(p => (
        <div className="history" key={p.id}><div><b>{p.name}</b><span>{dateLabel(p.expectedEnd)} · {p.daysLeft >= 0 ? `${p.daysLeft} days left` : `${Math.abs(p.daysLeft)} days overdue`}</span></div><span>{money(p.total.outstanding)}</span></div>
      ))}
      <h2>Project money</h2>
      {!rows.length && <p className="empty">No projects yet. Add your first project to start tracking money.</p>}
      {rows.map(({project, t}) => (
        <div className="history" key={project.id}><div><b>{project.name}</b><span>{STATUS_LABELS[project.status]} · cost {money(t.cost)} · paid {money(t.paid)}</span></div><span>{money(t.outstanding)}</span></div>
      ))}
      <button className="secondary" onClick={onOpenProjects}>Go to projects</button>
    </div>
  );
}
const TX_LABELS = {payment: 'Payment received', material: 'Material expense', labour: 'Labour expense', 'other-expense': 'Other expense'};

function CustomersSection({userId, refreshKey, bump}) {
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({name: '', phone: '', village: '', address: '', notes: ''});
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [dupes, setDupes] = useState([]);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const records = sortCustomers(readCollection(userId, 'customers') || []);
  const shown = searchCustomers(records, query);
  const openNew = () => { setEditing(null); setForm({name: '', phone: '', village: '', address: '', notes: ''}); setError(''); setDupes([]); setMessage(''); };
  const openEdit = record => { setEditing(record); setForm({name: record.name, phone: record.phone || '', village: record.village || '', address: record.address || '', notes: record.notes || ''}); setError(''); setDupes([]); setMessage(''); };
  const checkDupes = nextForm => setDupes(findDuplicates(records, nextForm, editing?.id));
  const submit = () => {
    setError(''); setMessage('');
    try {
      const saved = saveCustomer(userId, form, editing?.id);
      setMessage(editing ? `${saved.name} updated.` : `${saved.name} saved.`);
      setEditing(null); bump();
    } catch (e) { setError(e.message); }
  };
  return (
    <div>
      {!records.length && <p className="empty">No saved customers yet. Add one below, or keep using receipt customers, which are separate.</p>}
      {records.length > 0 && <input className="search" placeholder="Search by name, village or phone" value={query} onChange={e => setQuery(e.target.value)} aria-label="Search customers" />}
      <div className="actions"><button className="primary" onClick={openNew}>Add customer</button></div>
      {message && <p className="success" role="status">{message}</p>}
      <div className="saved-list">
        {shown.map(record => (
          <article className="baki-card" key={record.id}>
            <div className="baki-card-head"><b>{record.name}</b>{record.village && <span className="payment-badge">{record.village}</span>}</div>
            {record.phone && <p className="hint">📞 <a className="customer-phone" href={`tel:${record.phone}`}>{record.phone}</a></p>}
            {record.address && <p className="hint">{record.address}</p>}
            {record.notes && <p className="hint">Notes: {record.notes}</p>}
            <p className="hint">Added {dateLabel(record.createdAt.slice(0, 10))} · edited {dateLabel(record.updatedAt.slice(0, 10))}</p>
            <div className="baki-actions"><button className="secondary" onClick={() => openEdit(record)}>Edit</button><button className="secondary" onClick={() => setConfirmDelete(record)}>Delete</button></div>
          </article>
        ))}
        {!shown.length && records.length > 0 && <p className="empty">No customers match "{query}".</p>}
      </div>
      <CustomerForm form={form} setForm={setForm} editing={editing} error={error} dupes={dupes} checkDupes={checkDupes} submit={submit} />
      {confirmDelete && <PaymentDialog title={`Delete ${confirmDelete.name}?`} onClose={() => setConfirmDelete(null)}>
        <p>This removes the saved customer. Receipt records are not touched. This cannot be undone.</p>
        <button className="primary wide" onClick={() => { deleteCustomer(userId, confirmDelete.id); setConfirmDelete(null); setMessage('Customer deleted.'); bump(); }}>Yes, delete customer</button>
      </PaymentDialog>}
    </div>
  );
}
function CustomerForm({form, setForm, editing, error, dupes, checkDupes, submit, onDone}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="module">
      <div className="sectionHead"><h2>{editing ? `Edit ${editing.name}` : 'Add customer'}</h2><button className="secondary" onClick={() => setOpen(!open)}>{open ? 'Close' : (editing ? 'Editing…' : 'Open form')}</button></div>
      {open && <div className="form">
        <label>Name<input value={form.name} onChange={e => { setForm({...form, name: e.target.value}); checkDupes({...form, name: e.target.value}); }} /></label>
        <label>Mobile number<input inputMode="tel" value={form.phone} onChange={e => { setForm({...form, phone: e.target.value}); checkDupes({...form, phone: e.target.value}); }} /></label>
        <label>Village<input value={form.village} onChange={e => setForm({...form, village: e.target.value})} /></label>
        <label>Address<input value={form.address} onChange={e => setForm({...form, address: e.target.value})} /></label>
        <label>Notes<textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} /></label>
        {dupes.length > 0 && <p className="error" role="alert">Possible duplicate: {dupes.map(d => d.name).join(', ')} already exists. Check the spelling, or save with a middle name to keep them separate. Customers are never merged automatically.</p>}
        {error && <p className="error" role="alert">{error}</p>}
        <div className="actions"><button className="primary" onClick={submit}>{editing ? 'Save changes' : 'Save customer'}</button></div>
      </div>}
    </div>
  );
}

function ProjectsSection({userId, refreshKey, bump}) {
  const [openId, setOpenId] = useState(null);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [editing, setEditing] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const projects = readCollection(userId, 'projects') || [];
  const shown = projects
    .filter(p => !statusFilter || p.status === statusFilter)
    .filter(p => !query || p.name.toLowerCase().includes(query.toLowerCase()) || (p.location || '').toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)));
  const customers = readCollection(userId, 'customers') || [];
  if (openId) return <ProjectDetail userId={userId} id={openId} onBack={() => setOpenId(null)} bump={bump} customers={customers} />;
  return (
    <div>
      <div className="actions"><button className="primary" onClick={() => { setEditing(null); setFormOpen(true); }}>Add project</button></div>
      {projects.length > 0 && <div className="filters">
        <input placeholder="Search projects" value={query} onChange={e => setQuery(e.target.value)} aria-label="Search projects" />
        <select aria-label="Filter by status" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">All statuses</option>
          {Object.entries(STATUS_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
      </div>}
      {!projects.length && <p className="empty">No projects yet. A project holds the customer, materials, labour and money for one job.</p>}
      {shown.map(project => {
        const t = projectTotals(project, readCollection(userId, 'transactions') || [], readCollection(userId, 'materials') || [], readCollection(userId, 'labour') || []);
        return (
          <article className="baki-card" key={project.id}>
            <div className="baki-card-head"><b>{project.name}</b><span className="payment-badge">{STATUS_LABELS[project.status]}</span></div>
            <p className="hint">{customers.find(c => c.id === project.customerId)?.name || 'No customer set'}{project.location && ` · ${project.location}`}</p>
            <p className="hint">Cost {money(t.cost)} · paid {money(t.paid)} · outstanding <strong>{money(t.outstanding)}</strong></p>
            <div className="baki-actions"><button className="primary" onClick={() => setOpenId(project.id)}>Open</button><button className="secondary" onClick={() => { setEditing(project); setFormOpen(true); }}>Edit</button></div>
          </article>
        );
      })}
      {!shown.length && projects.length > 0 && <p className="empty">No projects match the filter.</p>}
      <ProjectForm userId={userId} customers={customers} editing={editing} open={formOpen} onClose={() => { setFormOpen(false); setEditing(null); }} bump={bump} />
    </div>
  );
}

function ProjectForm({userId, customers, editing, open, onClose, bump}) {
  const [error, setError] = useState('');
  const fields = editing || {name: '', customerId: '', location: '', notes: '', startDate: '', expectedEnd: '', completedEnd: '', status: 'planned', budget: ''};
  const [form, setForm] = useState(fields);
  useEffect(() => { setForm(editing || {name: '', customerId: '', location: '', notes: '', startDate: '', expectedEnd: '', completedEnd: '', status: 'planned', budget: ''}); setError(''); }, [editing, open]);
  if (!open) return null;
  const submit = () => {
    setError('');
    try { saveProject(userId, form, editing?.id); bump(); onClose(); } catch (e) { setError(e.message); }
  };
  return <PaymentDialog title={editing ? 'Edit project' : 'New project'} onClose={onClose}>
    <div className="form">
      <label>Project name<input value={form.name} onChange={e => setForm({...form, name: e.target.value})} /></label>
      <label>Customer<select value={form.customerId} onChange={e => setForm({...form, customerId: e.target.value})}>
        <option value="">No customer selected</option>
        {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
      </select></label>
      <label>Site or location<input value={form.location} onChange={e => setForm({...form, location: e.target.value})} /></label>
      <div className="two">
        <label>Start date<input type="date" value={form.startDate} onChange={e => setForm({...form, startDate: e.target.value})} /></label>
        <label>Expected finish<input type="date" value={form.expectedEnd} onChange={e => setForm({...form, expectedEnd: e.target.value})} /></label>
      </div>
      <label>Status<select value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
        {Object.entries(STATUS_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
      </select></label>
      <label>Budget (₹)<input inputMode="decimal" value={form.budget} onChange={e => setForm({...form, budget: e.target.value})} /></label>
      <label>Notes<textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} /></label>
      {error && <p className="error" role="alert">{error}</p>}
      <button className="primary wide" onClick={submit}>{editing ? 'Save changes' : 'Create project'}</button>
    </div>
  </PaymentDialog>;
}

function ProjectDetail({userId, id, onBack, bump, customers}) {
  const [tab, setTab] = useState('overview');
  const [dialog, setDialog] = useState(null); // {kind, item}
  const [voidTarget, setVoidTarget] = useState(null);
  const [voidReason, setVoidReason] = useState('');
  const [error, setError] = useState('');
  const projects = readCollection(userId, 'projects') || [];
  const project = projects.find(p => p.id === id);
  if (!project) return <p className="empty">This project no longer exists. <button className="secondary" onClick={onBack}>Back to projects</button></p>;
  const materials = (readCollection(userId, 'materials') || []).filter(m => m.projectId === id);
  const labour = (readCollection(userId, 'labour') || []).filter(l => l.projectId === id);
  const transactions = transactionHistory(readCollection(userId, 'transactions') || [], id);
  const t = projectTotals(project, readCollection(userId, 'transactions') || [], materials, labour);
  const customer = customers.find(c => c.id === project.customerId);
  const doVoid = () => {
    setError('');
    try { voidTransaction(userId, voidTarget.id, voidReason); setVoidTarget(null); setVoidReason(''); bump(); } catch (e) { setError(e.message); }
  };
  return (
    <div>
      <button className="back" onClick={onBack}>← All projects</button>
      <div className="projectHero"><b>{project.name}</b><span>{STATUS_LABELS[project.status]}{customer && ` · ${customer.name}`}{project.location && ` · ${project.location}`}{project.startDate && ` · started ${dateLabel(project.startDate)}`}{project.expectedEnd && ` · due ${dateLabel(project.expectedEnd)}`}</span></div>
      <div className="report-split">
        <div className="report-box pending"><span>Outstanding</span><strong>{money(t.outstanding)}</strong></div>
        <div className="report-box received"><span>Received</span><strong>{money(t.paid)}</strong></div>
      </div>
      <p className="hint">Total cost {money(t.cost)}{project.budget ? ` · budget ${money(project.budget)}${t.budgetUsed !== null ? ` (${t.budgetUsed}% used)` : ''}` : ''} · materials {money(t.material)} · labour {money(t.labour)} · other {money(t.other)}</p>
      <div className="tabs">
        <button aria-pressed={tab === 'overview'} onClick={() => setTab('overview')}>Overview</button>
        <button aria-pressed={tab === 'money'} onClick={() => setTab('money')}>Money ({t.transactionCount})</button>
        <button aria-pressed={tab === 'materials'} onClick={() => setTab('materials')}>Materials ({materials.length})</button>
        <button aria-pressed={tab === 'labour'} onClick={() => setTab('labour')}>Labour ({labour.length})</button>
      </div>
      {error && <p className="error" role="alert">{error}</p>}
      {tab === 'overview' && <div className="module">
        {project.notes && <p>{project.notes}</p>}
        <div className="totals"><strong>Project actions</strong>
          <div className="actions">
            <button className="primary" onClick={() => setDialog({kind: 'payment'})}>Record payment received</button>
            <button className="secondary" onClick={() => setDialog({kind: 'expense'})}>Add expense</button>
          </div>
          <div className="actions">
            <button className="secondary" onClick={() => { archiveProject(userId, id, project.status !== 'archived'); bump(); }}>{project.status === 'archived' ? 'Restore project' : 'Archive project'}</button>
            <button className="secondary" onClick={() => { saveProject(userId, {...project, status: 'completed', completedEnd: today()}, id); bump(); }}>Mark completed</button>
          </div>
          <DeleteProject userId={userId} project={project} onBack={onBack} bump={bump} />
        </div>
      </div>}
      {tab === 'money' && <MoneyTab transactions={transactions} onAdd={() => setDialog({kind: 'payment'})} onAddExpense={() => setDialog({kind: 'expense'})} onVoid={tx => { setVoidTarget(tx); setVoidReason(''); }} />}
      {tab === 'materials' && <MaterialsTab userId={userId} projectId={id} materials={materials} bump={bump} />}
      {tab === 'labour' && <LabourTab userId={userId} projectId={id} labour={labour} bump={bump} />}
      {dialog && <TransactionDialog userId={userId} projectId={id} kind={dialog.kind} onClose={() => setDialog(null)} bump={bump} />}
      {voidTarget && <PaymentDialog title="Void this transaction?" onClose={() => setVoidTarget(null)}>
        <p>{TX_LABELS[voidTarget.type]} · {money(voidTarget.amount)} · {dateLabel(voidTarget.date)}</p>
        <p>The record is kept for your history but stops counting. A reason is required.</p>
        <label className="payment-input">Reason<textarea value={voidReason} onChange={e => setVoidReason(e.target.value)} /></label>
        <button className="primary wide" disabled={voidReason.trim().length < 3} onClick={doVoid}>Void transaction</button>
      </PaymentDialog>}
    </div>
  );
}

function DeleteProject({userId, project, onBack, bump}) {
  const [confirm, setConfirm] = useState(false);
  return <>
    <div className="actions"><button className="secondary" onClick={() => setConfirm(true)}>Delete project</button></div>
    {confirm && <PaymentDialog title={`Delete ${project.name}?`} onClose={() => setConfirm(false)}>
      <p>This deletes the project and all its recorded payments, expenses, materials and labour. Receipts are not touched. This cannot be undone.</p>
      <button className="primary wide" onClick={() => { deleteProject(userId, project.id); setConfirm(false); bump(); onBack(); }}>Yes, delete everything for this project</button>
    </PaymentDialog>}
  </>;
}

function MoneyTab({transactions, onAdd, onAddExpense, onVoid}) {
  return <div className="module">
    <div className="actions"><button className="primary" onClick={onAdd}>Record payment</button><button className="secondary" onClick={onAddExpense}>Add expense</button></div>
    {!transactions.length && <p className="empty">No transactions yet.</p>}
    {transactions.map(tx => (
      <div className="history" key={tx.id}>
        <div><b>{TX_LABELS[tx.type]} · {money(tx.amount)}</b><span>{dateLabel(tx.date)}{tx.method && ` · ${tx.method}`}{tx.reference && ` · ${tx.reference}`}{tx.notes && ` · ${tx.notes}`}</span></div>
        {tx.status === 'active'
          ? <button onClick={() => onVoid(tx)}>Void</button>
          : <span className="payment-badge">voided: {tx.voidReason}</span>}
      </div>
    ))}
  </div>;
}

function TransactionDialog({userId, projectId, kind, onClose, bump}) {
  const isPayment = kind === 'payment';
  const [form, setForm] = useState({type: isPayment ? 'payment' : 'material', amount: '', date: today(), method: 'cash', reference: '', notes: ''});
  const [error, setError] = useState('');
  const submit = () => {
    setError('');
    try { saveTransaction(userId, {...form, projectId, clientId: `tx-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`}); bump(); onClose(); } catch (e) { setError(e.message); }
  };
  return <PaymentDialog title={isPayment ? 'Payment received' : 'Add expense'} onClose={onClose}>
    <div className="form">
      {!isPayment && <label>Expense type<select value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
        <option value="material">Material</option><option value="labour">Labour</option><option value="other-expense">Other expense</option>
      </select></label>}
      <label>Amount (₹)<input autoFocus inputMode="decimal" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} /></label>
      <label>Date<input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} /></label>
      {isPayment && <label>Method<select value={form.method} onChange={e => setForm({...form, method: e.target.value})}>
        {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
      </select></label>}
      <label>Reference (optional)<input value={form.reference} onChange={e => setForm({...form, reference: e.target.value})} /></label>
      <label>Notes (optional)<textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} /></label>
      {error && <p className="error" role="alert">{error}</p>}
      <button className="primary wide" onClick={submit}>Save</button>
    </div>
  </PaymentDialog>;
}

function MaterialsTab({userId, projectId, materials, bump}) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({name: '', woodType: '', dimensions: '', quantity: '', unit: 'CFT', unitPrice: '', supplier: '', purchaseDate: '', notes: ''});
  const [error, setError] = useState('');
  const submit = () => {
    setError('');
    try { saveMaterial(userId, {...form, projectId}); bump(); setOpen(false); setForm({name: '', woodType: '', dimensions: '', quantity: '', unit: 'CFT', unitPrice: '', supplier: '', purchaseDate: '', notes: ''}); } catch (e) { setError(e.message); }
  };
  return <div className="module">
    <div className="sectionHead"><h2>Materials</h2><button className="primary" onClick={() => setOpen(!open)}>{open ? 'Close' : 'Add material'}</button></div>
    {open && <div className="form">
      <label>Material name<input value={form.name} onChange={e => setForm({...form, name: e.target.value})} /></label>
      <div className="two">
        <label>Wood type<input value={form.woodType} onChange={e => setForm({...form, woodType: e.target.value})} /></label>
        <label>Dimensions<input value={form.dimensions} onChange={e => setForm({...form, dimensions: e.target.value})} /></label>
      </div>
      <div className="two">
        <label>Quantity<input inputMode="decimal" value={form.quantity} onChange={e => setForm({...form, quantity: e.target.value})} /></label>
        <label>Unit<select value={form.unit} onChange={e => setForm({...form, unit: e.target.value})}>{MATERIAL_UNITS.map(u => <option key={u} value={u}>{u}</option>)}</select></label>
      </div>
      <p className="hint">Changing the unit later does not rewrite a saved price. Enter the price for the unit you choose.</p>
      <div className="two">
        <label>Unit price (₹)<input inputMode="decimal" value={form.unitPrice} onChange={e => setForm({...form, unitPrice: e.target.value})} /></label>
        <label>Supplier<input value={form.supplier} onChange={e => setForm({...form, supplier: e.target.value})} /></label>
      </div>
      <label>Purchase date<input type="date" value={form.purchaseDate} onChange={e => setForm({...form, purchaseDate: e.target.value})} /></label>
      {error && <p className="error" role="alert">{error}</p>}
      <button className="primary wide" onClick={submit}>Save material</button>
    </div>}
    {!materials.length && <p className="empty">No materials recorded for this project.</p>}
    {materials.map(m => <div className="history" key={m.id}><div><b>{m.name} · {money(Math.round(Number(m.quantity) * Math.round(Number(m.unitPrice) * 100)) / 100)}</b><span>{m.quantity} {m.unit} @ {money(m.unitPrice)}{m.supplier && ` · ${m.supplier}`}{m.purchaseDate && ` · ${dateLabel(m.purchaseDate)}`}</span></div></div>)}
  </div>;
}

function LabourTab({userId, projectId, labour, bump}) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({worker: '', description: '', quantity: '', rate: '', paymentStatus: 'pending', date: today(), notes: ''});
  const [error, setError] = useState('');
  const submit = () => {
    setError('');
    try { saveLabour(userId, {...form, projectId}); bump(); setOpen(false); setForm({worker: '', description: '', quantity: '', rate: '', paymentStatus: 'pending', date: today(), notes: ''}); } catch (e) { setError(e.message); }
  };
  return <div className="module">
    <div className="sectionHead"><h2>Labour</h2><button className="primary" onClick={() => setOpen(!open)}>{open ? 'Close' : 'Add labour'}</button></div>
    {open && <div className="form">
      <label>Worker name<input value={form.worker} onChange={e => setForm({...form, worker: e.target.value})} /></label>
      <label>Work description<input value={form.description} onChange={e => setForm({...form, description: e.target.value})} /></label>
      <div className="two">
        <label>Days / quantity<input inputMode="decimal" value={form.quantity} onChange={e => setForm({...form, quantity: e.target.value})} /></label>
        <label>Rate (₹)<input inputMode="decimal" value={form.rate} onChange={e => setForm({...form, rate: e.target.value})} /></label>
      </div>
      <div className="two">
        <label>Payment status<select value={form.paymentStatus} onChange={e => setForm({...form, paymentStatus: e.target.value})}><option value="pending">Pending</option><option value="paid">Paid</option></select></label>
        <label>Date<input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} /></label>
      </div>
      {error && <p className="error" role="alert">{error}</p>}
      <button className="primary wide" onClick={submit}>Save labour entry</button>
    </div>}
    {!labour.length && <p className="empty">No labour recorded for this project.</p>}
    {labour.map(l => <div className="history" key={l.id}><div><b>{l.worker} · {money(Math.round(Number(l.quantity) * Math.round(Number(l.rate) * 100)) / 100)}</b><span>{l.quantity} days @ {money(l.rate)} · {dateLabel(l.date)} · {l.paymentStatus === 'paid' ? 'Paid' : 'Pending'}</span></div><span className={`payment-badge ${l.paymentStatus === 'paid' ? 'paid' : ''}`}>{l.paymentStatus === 'paid' ? 'Paid' : 'Pending'}</span></div>)}
  </div>;
}

function EstimatesSection({userId, refreshKey, bump}) {
  const [editingId, setEditingId] = useState(null);
  const [printId, setPrintId] = useState(null);
  const estimates = (readCollection(userId, 'estimates') || []).sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  const customers = readCollection(userId, 'customers') || [];
  const projects = readCollection(userId, 'projects') || [];
  if (printId) return <EstimatePrint userId={userId} id={printId} onBack={() => setPrintId(null)} />;
  if (editingId) return <EstimateEditor userId={userId} id={editingId === 'new' ? null : editingId} onBack={() => setEditingId(null)} bump={bump} customers={customers} projects={projects} />;
  return (
    <div>
      <div className="actions"><button className="primary" disabled={!customers.length} onClick={() => setEditingId('new')}>New estimate</button></div>
      {!customers.length && <p className="empty">Save a customer first. Estimates need a customer.</p>}
      {customers.length > 0 && !estimates.length && <p className="empty">No estimates yet. Create a quotation with material and labour lines, then print or share it.</p>}
      {estimates.map(est => {
        const t = estimateTotals(est);
        return (
          <article className="baki-card" key={est.id}>
            <div className="baki-card-head"><b>{est.number}</b><span className="payment-badge">{ESTIMATE_LABELS[est.status]}</span></div>
            <p className="hint">{est.snapshot.customerName} · {dateLabel((est.estimateDate || est.createdAt).slice(0, 10))}</p>
            <strong className="baki-amount">{money(t.total)}</strong>
            <div className="baki-actions">
              <button className="secondary" onClick={() => setEditingId(est.id)}>Edit</button>
              <button className="secondary" onClick={() => setPrintId(est.id)}>Print / PDF</button>
              <button className="secondary" onClick={() => { duplicateEstimate(userId, est.id); bump(); }}>Duplicate</button>
            </div>
            <div className="actions" style={{marginTop: 8}}>
              {['draft', 'sent', 'accepted', 'rejected', 'expired'].map(status => (
                <button key={status} className="secondary small" disabled={est.status === status} onClick={() => { setEstimateStatus(userId, est.id, status); bump(); }}>{ESTIMATE_LABELS[status]}</button>
              ))}
            </div>
          </article>
        );
      })}
    </div>
  );
}

function EstimateEditor({userId, id, onBack, bump, customers, projects}) {
  const current = id ? (readCollection(userId, 'estimates') || []).find(e => e.id === id) : null;
  const [form, setForm] = useState(current ? {...current, businessName: current.snapshot?.businessName || '', businessPhone: current.snapshot?.businessPhone || '', terms: current.snapshot?.terms || '', notes: current.snapshot?.notes || ''} : {customerId: '', projectId: '', lines: [{description: '', quantity: '', rate: '', unit: ''}], transport: '', discount: '', estimateDate: today(), validUntil: '', businessName: '', businessPhone: '', terms: '', notes: '', status: 'draft'});
  const [error, setError] = useState('');
  const totals = estimateTotals({...form, lines: form.lines.map(line => ({...line, quantity: line.quantity || 0, rate: line.rate || 0}))});
  const setLine = (index, field, value) => setForm({...form, lines: form.lines.map((line, i) => i === index ? {...line, [field]: value} : line)});
  const submit = () => {
    setError('');
    try {
      saveEstimate(userId, form, id);
      bump(); onBack();
    } catch (e) { setError(e.message); }
  };
  return (
    <div>
      <button className="back" onClick={onBack}>← All estimates</button>
      <h2>{current ? `Edit ${current.number}` : 'New estimate'}</h2>
      <div className="form">
        <label>Customer<select value={form.customerId} onChange={e => setForm({...form, customerId: e.target.value})}>
          <option value="">Choose customer</option>
          {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select></label>
        <label>Link to project (optional)<select value={form.projectId} onChange={e => setForm({...form, projectId: e.target.value})}>
          <option value="">No project</option>
          {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select></label>
        <div className="two">
          <label>Estimate date<input type="date" value={form.estimateDate} onChange={e => setForm({...form, estimateDate: e.target.value})} /></label>
          <label>Valid until<input type="date" value={form.validUntil} onChange={e => setForm({...form, validUntil: e.target.value})} /></label>
        </div>
        <h2>Line items</h2>
        {form.lines.map((line, index) => (
          <div className="form" key={index}>
            <label>Description<input value={line.description} onChange={e => setLine(index, 'description', e.target.value)} /></label>
            <div className="two">
              <label>Quantity<input inputMode="decimal" value={line.quantity} onChange={e => setLine(index, 'quantity', e.target.value)} /></label>
              <label>Rate (₹)<input inputMode="decimal" value={line.rate} onChange={e => setLine(index, 'rate', e.target.value)} /></label>
            </div>
            <label>Unit (optional)<input value={line.unit || ''} onChange={e => setLine(index, 'unit', e.target.value)} /></label>
            {form.lines.length > 1 && <button className="secondary" onClick={() => setForm({...form, lines: form.lines.filter((_, i) => i !== index)})}>Remove line</button>}
          </div>
        ))}
        <button className="secondary" onClick={() => setForm({...form, lines: [...form.lines, {description: '', quantity: '', rate: '', unit: ''}]})}>Add line item</button>
        <div className="two">
          <label>Transport / other charge (₹)<input inputMode="decimal" value={form.transport} onChange={e => setForm({...form, transport: e.target.value})} /></label>
          <label>Discount (₹)<input inputMode="decimal" value={form.discount} onChange={e => setForm({...form, discount: e.target.value})} /></label>
        </div>
        <div className="totals">
          <p>Subtotal <strong>{money(totals.subtotal)}</strong></p>
          <p>Transport +{money(totals.transport)} · Discount -{money(totals.discount)}</p>
          <p>Total <strong>{money(totals.total)}</strong></p>
        </div>
        <label>Your business name<input value={form.businessName} onChange={e => setForm({...form, businessName: e.target.value})} /></label>
        <label>Your phone<input value={form.businessPhone} onChange={e => setForm({...form, businessPhone: e.target.value})} /></label>
        <label>Terms<textarea value={form.terms} onChange={e => setForm({...form, terms: e.target.value})} /></label>
        <label>Notes<textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} /></label>
        {error && <p className="error" role="alert">{error}</p>}
        <button className="primary wide" onClick={submit}>Save estimate</button>
      </div>
    </div>
  );
}

// Print view: the browser's print dialog makes the PDF (Save as PDF on
// Android). No paid library, works offline, and there is a readable fallback
// if printing is unavailable: the document is plain readable HTML.
function EstimatePrint({userId, id, onBack}) {
  const est = (readCollection(userId, 'estimates') || []).find(e => e.id === id);
  if (!est) return <p className="empty">This estimate no longer exists. <button className="secondary" onClick={onBack}>Back</button></p>;
  const t = estimateTotals(est);
  return (
    <div>
      <button className="back" onClick={onBack}>← All estimates</button>
      <div className="actions" style={{marginBottom: 10}}><button className="primary" onClick={() => window.print()}>Print / Save as PDF</button></div>
      <div className="module print-doc">
        <h2 style={{marginTop: 0}}>{est.snapshot.businessName || 'Estimate'}</h2>
        {est.snapshot.businessPhone && <p className="hint">Phone: {est.snapshot.businessPhone}</p>}
        <hr />
        <p><b>{est.number}</b> · Date: {dateLabel((est.estimateDate || est.createdAt).slice(0, 10))}{est.validUntil && ` · Valid until: ${dateLabel(est.validUntil)}`}</p>
        <p><b>Customer:</b> {est.snapshot.customerName}{est.snapshot.customerPhone && `, ${est.snapshot.customerPhone}`}{est.snapshot.customerVillage && `, ${est.snapshot.customerVillage}`}{est.snapshot.customerAddress && `, ${est.snapshot.customerAddress}`}</p>
        <table style={{width: '100%', borderCollapse: 'collapse', marginTop: 10}}>
          <thead><tr><th style={{textAlign: 'left', borderBottom: '1px solid #ccc'}}>Item</th><th style={{textAlign: 'right', borderBottom: '1px solid #ccc'}}>Qty</th><th style={{textAlign: 'right', borderBottom: '1px solid #ccc'}}>Rate</th><th style={{textAlign: 'right', borderBottom: '1px solid #ccc'}}>Amount</th></tr></thead>
          <tbody>
            {t.lines.map((line, i) => (
              <tr key={i}><td>{line.description}{line.unit && ` (${line.unit})`}</td><td style={{textAlign: 'right'}}>{line.quantity}</td><td style={{textAlign: 'right'}}>{money(line.rate)}</td><td style={{textAlign: 'right'}}>{money(line.total)}</td></tr>
            ))}
          </tbody>
        </table>
        <div className="totals">
          <p>Subtotal: <strong>{money(t.subtotal)}</strong></p>
          {t.transport > 0 && <p>Transport / other charges: <strong>{money(t.transport)}</strong></p>}
          {t.discount > 0 && <p>Discount: <strong>-{money(t.discount)}</strong></p>}
          <p>Total: <strong>{money(t.total)}</strong></p>
        </div>
        {est.snapshot.notes && <p><b>Notes:</b> {est.snapshot.notes}</p>}
        {est.snapshot.terms && <p className="hint"><b>Terms:</b> {est.snapshot.terms}</p>}
      </div>
    </div>
  );
}

function BackupSection({userId, bump}) {
  const [plan, setPlan] = useState(null);
  const [fileError, setFileError] = useState('');
  const [result, setResult] = useState('');
  const [error, setError] = useState('');
  const download = () => {
    setError(''); setResult('');
    try {
      const backup = exportBackup(userId);
      const blob = new Blob([JSON.stringify(backup, null, 2)], {type: 'application/json'});
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sab-tools-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setResult(`Backup downloaded with ${backup.recordCount} records. Keep this file safe. Local data is NOT backed up automatically.`);
    } catch (e) { setError(e.message); }
  };
  const readFile = file => {
    setFileError(''); setError(''); setPlan(null); setResult('');
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        const validation = validateBackupFile(parsed);
        if (!validation.ok) { setFileError(validation.error); return; }
        const importPlan = planImport(userId, parsed);
        if (!importPlan.ok) { setFileError(importPlan.error); return; }
        setPlan({parsed, importPlan});
      } catch { setFileError('This file could not be read as a backup.'); }
    };
    reader.readAsText(file);
  };
  const restore = () => {
    try {
      const outcome = importBackup(userId, plan.parsed);
      const added = Object.values(outcome.written).reduce((a, b) => a + b, 0);
      setResult(`Restored ${added} records. Skipped ${Object.values(outcome.skipped).reduce((a, b) => a + b, 0)} that already exist.${outcome.orphans ? ` Dropped ${outcome.orphans} records pointing at projects not in this account.` : ''}`);
      setPlan(null); bump();
    } catch (e) { setError(e.message); }
  };
  const counts = plan ? Object.entries(plan.importPlan.add).filter(([, rows]) => rows.length) : [];
  return (
    <div className="module">
      <h2 style={{marginTop: 0}}>Backup</h2>
      <p className="hint">Your business records live only on this device. Export a backup file regularly and keep a copy in Google Drive or email it to yourself. Local only. Not a cloud backup.</p>
      <div className="actions"><button className="primary" onClick={download}>Download backup file</button></div>
      <h2>Restore</h2>
      <p className="hint">Restoring adds records from the file. Existing records with the same id are kept and never overwritten. Nothing is deleted.</p>
      <input type="file" accept="application/json" aria-label="Choose backup file" onChange={e => e.target.files?.[0] && readFile(e.target.files[0])} />
      {fileError && <p className="error" role="alert">{fileError}</p>}
      {plan && <div>
        <div className="totals">
          <p><strong>Restore plan</strong></p>
          <p>{plan.importPlan.total} records in the file. To be added:</p>
          {counts.map(([collection, rows]) => <p key={collection}>{collection}: {rows.length} new</p>)}
          <p>Skipped (already exist): {Object.values(plan.importPlan.skipExisting).reduce((a, b) => a + b, 0)}</p>
          {plan.importPlan.orphans > 0 && <p>Dropped: {plan.importPlan.orphans} records point at projects that are not in this account.</p>}
        </div>
        <div className="actions"><button className="primary" onClick={restore}>Yes, restore these records</button><button className="secondary" onClick={() => setPlan(null)}>Cancel</button></div>
      </div>}
      {result && <p className="success" role="status">{result}</p>}
      {error && <p className="error" role="alert">{error}</p>}
    </div>
  );
}
