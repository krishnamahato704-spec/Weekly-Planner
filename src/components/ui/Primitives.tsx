import React from 'react';

export function PageHeader({ eyebrow, title, description, actions }: {
  eyebrow?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div className="page-header">
      <div className="min-w-0">
        {eyebrow && <p className="eyebrow mb-2">{eyebrow}</p>}
        <h1 className="page-title">{title}</h1>
        {description && <p className="page-description">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function StatCard({ label, value, detail, icon }: {
  label: string;
  value: React.ReactNode;
  detail: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <div className="surface stat-card">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-muted">{label}</p>
        <span className="stat-icon" aria-hidden="true">{icon}</span>
      </div>
      <p className="stat-value">{value}</p>
      <p className="text-xs leading-relaxed text-muted">{detail}</p>
    </div>
  );
}

// These are independent toggle buttons, so keyboard users can Tab to every option.
export function SegmentedControl<T extends string>({ label, value, options, onChange }: {
  label: string;
  value: T;
  options: ReadonlyArray<{ value: T; label: React.ReactNode }>;
  onChange: (value: T) => void;
}) {
  return (
    <div className="segmented-control" role="group" aria-label={label}>
      {options.map(option => (
        <button key={option.value} type="button" aria-pressed={value === option.value}
          onClick={() => onChange(option.value)} className="segment">
          {option.label}
        </button>
      ))}
    </div>
  );
}
