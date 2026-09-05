import React, { type ReactNode } from 'react';

interface TabItem {
  id: string;
  label: string;
  badge?: ReactNode;
  icon?: ReactNode;
}

interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (tabId: string) => void;
}

export function Tabs({ tabs, activeTab, onChange }: TabsProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        borderBottom: '1px solid var(--border-subtle)',
        paddingBottom: '0',
        overflowX: 'auto',
        width: '100%',
      }}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 12px',
              fontSize: '12px',
              fontWeight: isActive ? 600 : 500,
              color: isActive ? 'var(--brand)' : 'var(--text-secondary)',
              borderBottom: isActive ? '2px solid var(--brand)' : '2px solid transparent',
              backgroundColor: 'transparent',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'color 0.12s',
            }}
            onMouseEnter={(e) => {
              if (!isActive) e.currentTarget.style.color = 'var(--text-primary)';
            }}
            onMouseLeave={(e) => {
              if (!isActive) e.currentTarget.style.color = 'var(--text-secondary)';
            }}
          >
            {tab.icon}
            {tab.label}
            {tab.badge}
          </button>
        );
      })}
    </div>
  );
}
