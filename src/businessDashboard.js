// Dashboard figures, computed live from actual stored records. No statistics
// are invented, and guest data and account data are never combined.
import {listAll} from './businessStore.js';
import {projectTotals} from './projectsLedger.js';
import {estimateTotals} from './estimates.js';

export function dashboardStats(uid, today = new Date()) {
  const all = listAll(uid);
  const projects = all.projects, transactions = all.transactions, materials = all.materials, labour = all.labour, estimates = all.estimates, customers = all.customers;
  const active = projects.filter(p => p.status === 'planned' || p.status === 'in-progress');
  const completed = projects.filter(p => p.status === 'completed');
  const totals = new Map();
  for (const project of projects) totals.set(project.id, projectTotals(project, transactions, materials, labour));
  let outstanding = 0, paid = 0, cost = 0;
  for (const project of projects) {
    if (project.status === 'archived') continue;
    const t = totals.get(project.id);
    outstanding += Math.round(t.outstanding * 100); paid += Math.round(t.paid * 100); cost += Math.round(t.cost * 100);
  }
  const pendingEstimates = estimates.filter(e => e.status === 'draft' || e.status === 'sent');
  const pendingValue = pendingEstimates.reduce((sum, e) => sum + Math.round(estimateTotals(e).total * 100), 0);
  const recent = transactions.filter(tx => tx.status === 'active')
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt))).slice(0, 5);
  const upcoming = active
    .filter(p => p.expectedEnd)
    .sort((a, b) => String(a.expectedEnd).localeCompare(String(b.expectedEnd)))
    .slice(0, 5)
    .map(p => ({...p, daysLeft: Math.ceil((new Date(p.expectedEnd) - today) / 86400000), total: totals.get(p.id)}));
  return {
    activeProjects: active, completedProjects: completed, totalCustomers: customers.length,
    pendingEstimates, pendingEstimateValue: Math.round(pendingValue) / 100,
    totalCost: Math.round(cost) / 100, totalPaid: Math.round(paid) / 100, totalOutstanding: Math.round(outstanding) / 100,
    recentTransactions: recent.map(tx => ({...tx, projectName: (projects.find(p => p.id === tx.projectId) || {}).name || ''})),
    upcomingDeadlines: upcoming, projectTotals: totals, projects, estimates, transactions, customers, materials, labour
  };
}
