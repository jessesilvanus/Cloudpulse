import React, { useState, type ReactNode } from 'react';
import { Sidebar } from './Sidebar.tsx';
import { TopBar } from './TopBar.tsx';
import { CommandPalette } from './CommandPalette.tsx';

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(10000);
  const [timeRange, setTimeRange] = useState('15m');

  return (
    <div
      style={{
        display: 'flex',
        width: '100vw',
        minHeight: '100vh',
        backgroundColor: 'var(--bg-canvas)',
        overflow: 'hidden',
      }}
    >
      <Sidebar />

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          minWidth: 0,
          height: '100vh',
          overflow: 'hidden',
        }}
      >
        <TopBar
          onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
          refreshInterval={refreshInterval}
          onRefreshIntervalChange={setRefreshInterval}
          timeRange={timeRange}
          onTimeRangeChange={setTimeRange}
        />

        <main
          style={{
            flex: 1,
            overflowY: 'auto',
            overflowX: 'hidden',
            backgroundColor: 'var(--bg-canvas)',
          }}
        >
          {children}
        </main>
      </div>

      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
      />
    </div>
  );
}
