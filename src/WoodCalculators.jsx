import React, { useMemo, useState } from 'react';
import { woodCalculation } from './woodCalculations';
import './woodCalculators.css';
import RoundWood from './RoundWood';

const types = {
  round: { title: 'Round wood', art: 'logs', desc: 'Quarter-girth volume & log batch pricing' },
  size: { title: 'Size wood', art: 'planks', desc: 'Plank & sawn timber CFT/CBM calculator' },
  door: { title: 'Flush door', art: 'door', desc: 'Square area & sheet unit pricing' }
};

const image = kind => `${import.meta.env.BASE_URL}icons/wood-${types[kind].art}.svg`;

const catalogItems = [
  {
    id: 'calc-round-imperial',
    category: 'calculators',
    tag: 'Calculator · Imperial',
    badge: 'F³',
    title: 'Round wood',
    subtitle: 'Foot, Inch · Quarter-Girth CFT',
    description: 'Calculate log volume in cubic feet using standard 2304 quarter-girth formula with multi-row billing.',
    kind: 'round',
    system: 'imperial',
    art: 'round'
  },
  {
    id: 'calc-size-imperial',
    category: 'calculators',
    tag: 'Calculator · Imperial',
    badge: 'F³',
    title: 'Size wood',
    subtitle: 'Foot, Inch · Plank CFT',
    description: 'Precision sawn plank and scantling cubic foot calculator with piece multiplier and rate.',
    kind: 'size',
    system: 'imperial',
    art: 'size'
  },
  {
    id: 'calc-round-metric',
    category: 'calculators',
    tag: 'Calculator · Metric',
    badge: 'M³',
    title: 'Round wood',
    subtitle: 'Meter, cm · Quarter-Girth CBM',
    description: 'Metric round log cubic meter calculation with circumference in centimeters and length in meters.',
    kind: 'round',
    system: 'metric',
    art: 'round'
  },
  {
    id: 'calc-size-metric',
    category: 'calculators',
    tag: 'Calculator · Metric',
    badge: 'M³',
    title: 'Size wood',
    subtitle: 'Meter, cm · Plank CBM',
    description: 'Metric sawn timber volume in cubic meters with length in meters and cross-section in cm.',
    kind: 'size',
    system: 'metric',
    art: 'size'
  },
  {
    id: 'calc-door-imperial',
    category: 'calculators',
    tag: 'Calculator · Imperial',
    badge: 'F²',
    title: 'Flush door',
    subtitle: 'Foot, Inch · Area Sq.Ft',
    description: 'Square footage area and unit pricing for doors, plywood boards, and blockboards.',
    kind: 'door',
    system: 'imperial',
    art: 'door'
  },
  {
    id: 'calc-door-metric',
    category: 'calculators',
    tag: 'Calculator · Metric',
    badge: 'M²',
    title: 'Flush door',
    subtitle: 'Meter, cm · Area Sq.M',
    description: 'Metric surface area calculation in square meters for architectural panels and doors.',
    kind: 'door',
    system: 'metric',
    art: 'door'
  },
  {
    id: 'biz-receipt',
    category: 'billing',
    tag: 'Billing & Invoicing',
    badge: 'INV',
    title: 'Timber receipt',
    subtitle: 'Multi-row CFT/CBM invoice generator',
    description: 'Create print-ready customer receipts with row-level or uniform rates, labour, transport, and advance.',
    route: 'Receipt'
  },
  {
    id: 'biz-baki',
    category: 'billing',
    tag: 'Ledger & Dues',
    badge: '₹',
    title: 'Baki hisab',
    subtitle: 'Customer balance & payment ledger',
    description: 'Track outstanding customer balances, record partial or full collections, and view payment history.',
    route: 'Baki'
  },
  {
    id: 'biz-customers',
    category: 'billing',
    tag: 'CRM Directory',
    badge: 'DIR',
    title: 'Customer list',
    subtitle: 'Client accounts & lifetime totals',
    description: 'Unified directory grouped by customer and village with total billed, received, and pending dues.',
    route: 'Customers'
  },
  {
    id: 'biz-saved',
    category: 'billing',
    tag: 'Archive',
    badge: 'DOC',
    title: 'Saved receipts',
    subtitle: 'Cloud & offline invoice archive',
    description: 'Search, reopen, and print historical timber and round-log receipts stored on your device or cloud.',
    route: 'Saved'
  },
  {
    id: 'biz-report',
    category: 'billing',
    tag: 'Analytics',
    badge: 'KPI',
    title: 'Sale report',
    subtitle: 'Daily, weekly & monthly revenue',
    description: 'Financial overview of total sales, payments collected, pending baki, and top customers by period.',
    route: 'Report'
  },
  {
    id: 'work-cutting',
    category: 'workshop',
    tag: 'Optimization',
    badge: 'OPT',
    title: 'Cutting optimizer',
    subtitle: '2D sheet & board nesting engine',
    description: 'Minimize wastage with kerf-aware guillotine cutting layouts, workshop step-by-step mode, and offcut reuse.',
    route: 'Cutting'
  },
  {
    id: 'work-level',
    category: 'workshop',
    tag: 'Precision Utility',
    badge: '0.0°',
    title: 'Bubble level',
    subtitle: '2-axis surface spirit level',
    description: 'Calibrated horizontal and vertical inclination sensor for workbench and machinery alignment.',
    route: 'Level'
  }
];

const filterPills = [
  ['all', 'All Suite'],
  ['calculators', 'Wood Calculators'],
  ['billing', 'Billing & Ledger'],
  ['workshop', 'Workshop & Nesting']
];

export function WoodHome({ onSelect, onCalculator }) {
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');

  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    return catalogItems.filter(item => {
      const matchesCategory = activeFilter === 'all' || item.category === activeFilter;
      if (!matchesCategory) return false;
      if (!q) return true;
      return (
        item.title.toLowerCase().includes(q) ||
        item.subtitle.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.tag.toLowerCase().includes(q) ||
        item.badge.toLowerCase().includes(q)
      );
    });
  }, [query, activeFilter]);

  const calcItems = filteredItems.filter(i => i.category === 'calculators');
  const businessItems = filteredItems.filter(i => i.category !== 'calculators');

  return (
    <section className="wood-home saas-landing">
      {/* Centered Editorial Hero */}
      <div className="saas-hero">
        <div className="saas-eyebrow-pill">
          <span className="saas-dot" aria-hidden="true" />
          <span>PRECISION TIMBER &amp; WORKSHOP OPERATING SYSTEM</span>
        </div>
        <h1 className="saas-hero-title">
          Crafted for modern timber &amp; furniture commerce.
        </h1>
        <p className="saas-hero-subtitle">
          Exact Quarter-Girth CFT &amp; CBM measurement, automated sheet nesting, print-ready client billing, and real-time baki ledger—engineered in a clean, distraction-free workspace.
        </p>
        <div className="saas-hero-cta">
          <button
            type="button"
            className="saas-btn-primary"
            onClick={() => onSelect('Receipt')}
          >
            New Timber Receipt
          </button>
          <button
            type="button"
            className="saas-btn-secondary"
            onClick={() => onSelect('Cutting')}
          >
            Open Cutting Optimizer
          </button>
        </div>

        {/* Pill-shaped search and filter bar */}
        <div className="saas-controls-bar">
          <div className="saas-search-pill">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" strokeLinecap="round" />
            </svg>
            <input
              type="search"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search calculators, CFT, receipts, baki ledger, or cutting optimizer..."
              aria-label="Search tools and modules"
            />
            {query && (
              <button
                type="button"
                className="saas-search-clear"
                onClick={() => setQuery('')}
                aria-label="Clear search"
              >
                ×
              </button>
            )}
          </div>

          <div className="saas-filter-pills" role="tablist" aria-label="Filter workspace modules">
            {filterPills.map(([id, label]) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={activeFilter === id}
                className={'saas-pill' + (activeFilter === id ? ' active' : '')}
                onClick={() => setActiveFilter(id)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Calculators Card Grid */}
      {calcItems.length > 0 && (
        <div className="saas-section">
          <div className="saas-section-header">
            <div>
              <span className="saas-section-kicker">MEASUREMENT ENGINE</span>
              <h2>Your tools</h2>
            </div>
            <span className="saas-section-count">{calcItems.length} modules</span>
          </div>

          <div className="wood-grid saas-card-grid">
            {calcItems.map(item => (
              <button
                key={item.id}
                type="button"
                className={'wood-card saas-card ' + item.system}
                onClick={() => onCalculator(item.kind, item.system)}
                aria-label={`${types[item.kind].title}, ${item.system === 'metric' ? 'Meter, centimetre' : 'Foot, Inch'}`}
              >
                <div className="saas-card-top">
                  <span className="wood-unit">{item.system === 'metric' ? 'Meter, cm' : 'Foot, Inch'}</span>
                  <span className="wood-dimension" aria-hidden="true">
                    {item.system === 'metric' ? 'M' : 'F'}
                    <sup>{item.kind === 'door' ? '2' : '3'}</sup>
                  </span>
                </div>
                <div className="saas-card-art">
                  <img src={image(item.kind)} alt="" />
                </div>
                <div className="saas-card-body">
                  <b>{types[item.kind].title}</b>
                  <p>{item.description}</p>
                </div>
                <div className="saas-card-footer">
                  <span>Launch calculator</span>
                  <span aria-hidden="true">→</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Business & Workshop Card Grid */}
      {businessItems.length > 0 && (
        <div className="saas-section">
          <div className="saas-section-header">
            <div>
              <span className="saas-section-kicker">OPERATIONS &amp; LEDGER</span>
              <h2>Your business</h2>
            </div>
            <span className="saas-section-count">{businessItems.length} modules</span>
          </div>

          <div className="saas-card-grid">
            {businessItems.map(item => (
              <button
                key={item.id}
                type="button"
                className="saas-card saas-biz-card"
                onClick={() => onSelect(item.route)}
              >
                <div className="saas-card-top">
                  <span className="saas-card-tag">{item.tag}</span>
                  <span className="saas-card-badge">{item.badge}</span>
                </div>
                <div className="saas-card-body">
                  <b>{item.title}</b>
                  <span className="saas-card-sub">{item.subtitle}</span>
                  <p>{item.description}</p>
                </div>
                <div className="saas-card-footer">
                  <span>Open workspace</span>
                  <span aria-hidden="true">→</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {filteredItems.length === 0 && (
        <div className="saas-empty-state">
          <b>No matching modules found</b>
          <p>Try clearing your search query or switching to &ldquo;All Suite&rdquo;.</p>
          <button
            type="button"
            className="saas-btn-secondary"
            onClick={() => {
              setQuery('');
              setActiveFilter('all');
            }}
          >
            Reset Filters
          </button>
        </div>
      )}
    </section>
  );
}

export default function WoodCalculator(props) {
  return props.kind === 'round' ? (
    <RoundWood userId={props.userId} system={props.initialSystem} onBack={props.onBack} />
  ) : (
    <SingleWoodCalculator {...props} />
  );
}

function SingleWoodCalculator({ kind, initialSystem, onBack, onReceipt }) {
  const [system, setSystem] = useState(initialSystem),
    [fields, setFields] = useState({ length: '', width: '', thickness: '', girth: '', pieces: '1', rate: '' }),
    [attempted, setAttempted] = useState(false);
  const metric = system === 'metric',
    door = kind === 'door',
    result = woodCalculation(kind, system, fields);
  const unit = door ? (metric ? 'sq m' : 'sq ft') : metric ? 'CBM' : 'CFT';
  const dimensionUnit = metric ? 'm' : 'ft';
  const inputs =
    kind === 'size'
      ? [
          ['length', 'Length', dimensionUnit],
          ['width', 'Width', metric ? 'cm' : 'in'],
          ['thickness', 'Thickness', metric ? 'cm' : 'in']
        ]
      : door
      ? [
          ['length', 'Length', dimensionUnit],
          ['width', 'Width', dimensionUnit]
        ]
      : [
          ['length', 'Length', dimensionUnit],
          ['girth', 'Girth', metric ? 'cm' : 'in']
        ];
  const switchSystem = value => {
    if (value === system) return;
    if (kind === 'round' && value === 'imperial') {
      onReceipt();
      return;
    }
    setSystem(value);
    setFields({ length: '', width: '', thickness: '', girth: '', pieces: '1', rate: '' });
    setAttempted(false);
  };
  return (
    <section className="wood-calculator">
      <button className="wood-back" onClick={onBack}>
        ‹ &nbsp; Your tools
      </button>
      <h1>
        {types[kind].title}
        <span className="wood-title-badge">
          {metric ? 'M' : 'F'}
          <sup>{door ? '2' : '3'}</sup>
        </span>
      </h1>
      <div className="wood-system" aria-label="Measurement system">
        {[
          ['imperial', 'Foot, Inch'],
          ['metric', 'Meter, cm']
        ].map(([value, label]) => (
          <button
            key={value}
            aria-pressed={system === value}
            className={system === value ? 'selected' : ''}
            onClick={() => switchSystem(value)}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="wood-diagram">
        <img src={image(kind)} alt="" />
        <span>{kind === 'size' ? 'L × W × T' : door ? 'L × W' : 'Length × (girth ÷ 4)²'}</span>
      </div>
      <form
        className="wood-measure-form"
        onSubmit={e => {
          e.preventDefault();
          setAttempted(true);
        }}
        noValidate
      >
        <h2>{kind === 'size' ? 'Plank measurements' : door ? 'Door measurements' : 'Log measurements'}</h2>
        <div className="wood-fields">
          {[...inputs, ['pieces', 'Pieces', 'pcs'], ['rate', `Rate per ${unit}`, `₹ / ${unit}`]].map(
            ([key, label, suffix]) => (
              <label className={key === 'rate' ? 'wood-wide' : ''} key={key}>
                {label}
                <span className="wood-input">
                  <input
                    aria-label={label}
                    type="number"
                    inputMode={key === 'pieces' ? 'numeric' : 'decimal'}
                    min={key === 'rate' ? 0 : 0.000001}
                    step={key === 'pieces' ? 1 : 'any'}
                    value={fields[key]}
                    onChange={e => {
                      setFields({ ...fields, [key]: e.target.value });
                      setAttempted(false);
                    }}
                    required
                  />
                  <span>{suffix}</span>
                </span>
              </label>
            )
          )}
        </div>
        <button type="submit" className="wood-calculate">
          Calculate
        </button>
      </form>
      {attempted && !result && (
        <p className="wood-error" role="alert">
          Enter positive measurements, whole pieces and a rate of 0 or more.
        </p>
      )}
      <div className="wood-result" aria-live="polite">
        <div>
          <span>{door ? 'Total area' : 'Total volume'}</span>
          <strong>
            {result ? result.quantity.toFixed(3) : '0.000'} <small>{unit}</small>
          </strong>
        </div>
        <div>
          <span>Total amount</span>
          <strong>
            {result
              ? result.amount.toLocaleString('en-IN', {
                  style: 'currency',
                  currency: 'INR',
                  maximumFractionDigits: 2
                })
              : '₹0'}
          </strong>
        </div>
      </div>
      {kind === 'round' && <p className="wood-method">Quarter-girth method · Girth = circumference</p>}
    </section>
  );
}
