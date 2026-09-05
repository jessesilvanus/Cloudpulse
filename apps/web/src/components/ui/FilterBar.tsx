import React, { type ReactNode } from 'react';
import { SearchIcon } from './Icons.tsx';

interface FilterBarProps {
  searchValue?: string;
  onSearchChange?: (val: string) => void;
  searchPlaceholder?: string;
  filters?: ReactNode;
  actions?: ReactNode;
  totalCount?: number;
  filteredCount?: number;
}

export function FilterBar({
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Search...',
  filters,
  actions,
  totalCount,
  filteredCount,
}: FilterBarProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '10px',
        padding: '10px 12px',
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-md)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '240px', flexWrap: 'wrap' }}>
        {onSearchChange !== undefined && (
          <div
            style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              minWidth: '220px',
              flex: '0 1 320px',
            }}
          >
            <span style={{ position: 'absolute', left: '10px', color: 'var(--text-muted)', display: 'flex' }}>
              <SearchIcon />
            </span>
            <input
              type="text"
              value={searchValue || ''}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={searchPlaceholder}
              style={{
                width: '100%',
                padding: '6px 10px 6px 32px',
                fontSize: '12px',
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text-primary)',
                outline: 'none',
              }}
              onFocus={(e) => (e.target.style.borderColor = 'var(--brand)')}
              onBlur={(e) => (e.target.style.borderColor = 'var(--border-subtle)')}
            />
          </div>
        )}

        {filters}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {totalCount !== undefined && (
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
            {filteredCount !== undefined && filteredCount !== totalCount
              ? `Showing ${filteredCount} of ${totalCount}`
              : `${totalCount} total`}
          </span>
        )}
        {actions}
      </div>
    </div>
  );
}

interface SelectFilterProps {
  label?: string;
  value: string;
  onChange: (val: string) => void;
  options: { label: string; value: string }[];
}

export function SelectFilter({ label, value, onChange, options }: SelectFilterProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
      {label && <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{label}:</span>}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          padding: '5px 8px',
          fontSize: '11.5px',
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-sm)',
          color: 'var(--text-primary)',
          outline: 'none',
          cursor: 'pointer',
        }}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} style={{ backgroundColor: 'var(--bg-elevated)', color: 'var(--text-primary)' }}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
