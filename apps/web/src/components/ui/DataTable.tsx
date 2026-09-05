import React, { useState, useMemo, type ReactNode } from 'react';

export interface Column<T> {
  key: string;
  header: string;
  render: (item: T) => ReactNode;
  sortable?: boolean;
  sortValue?: (item: T) => string | number;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyExtractor: (item: T) => string;
  onRowClick?: (item: T) => void;
  emptyMessage?: string;
  pageSize?: number;
  hoverable?: boolean;
}

export function DataTable<T>({
  data,
  columns,
  keyExtractor,
  onRowClick,
  emptyMessage = 'No records found matching criteria',
  pageSize = 25,
  hoverable = true,
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortAsc, setSortAsc] = useState(true);
  const [page, setPage] = useState(0);

  const sortedData = useMemo(() => {
    if (!sortKey) return data;
    const col = columns.find((c) => c.key === sortKey);
    if (!col || !col.sortValue) return data;

    return [...data].sort((a, b) => {
      const valA = col.sortValue!(a);
      const valB = col.sortValue!(b);
      if (valA < valB) return sortAsc ? -1 : 1;
      if (valA > valB) return sortAsc ? 1 : -1;
      return 0;
    });
  }, [data, sortKey, sortAsc, columns]);

  const totalPages = Math.ceil(sortedData.length / pageSize);
  const paginatedData = useMemo(() => {
    return sortedData.slice(page * pageSize, (page + 1) * pageSize);
  }, [sortedData, page, pageSize]);

  const handleHeaderClick = (col: Column<T>) => {
    if (!col.sortable) return;
    if (sortKey === col.key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(col.key);
      setSortAsc(true);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', minWidth: 0 }}>
      <div style={{ overflowX: 'auto', width: '100%' }}>
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            textAlign: 'left',
            fontSize: '12px',
          }}
        >
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-default)', backgroundColor: 'var(--bg-subtle)' }}>
              {columns.map((col) => {
                const isSorted = sortKey === col.key;
                return (
                  <th
                    key={col.key}
                    onClick={() => handleHeaderClick(col)}
                    style={{
                      padding: '8px 12px',
                      fontSize: '11px',
                      fontWeight: 700,
                      letterSpacing: '0.05em',
                      textTransform: 'uppercase',
                      color: isSorted ? 'var(--brand)' : 'var(--text-muted)',
                      cursor: col.sortable ? 'pointer' : 'default',
                      userSelect: 'none',
                      width: col.width,
                      textAlign: col.align || 'left',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        justifyContent: col.align === 'right' ? 'flex-end' : col.align === 'center' ? 'center' : 'flex-start',
                      }}
                    >
                      {col.header}
                      {col.sortable && (
                        <span style={{ fontSize: '9px', opacity: isSorted ? 1 : 0.4 }}>
                          {isSorted ? (sortAsc ? '▲' : '▼') : '↕'}
                        </span>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {paginatedData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  style={{
                    padding: '32px 16px',
                    textAlign: 'center',
                    color: 'var(--text-muted)',
                    fontSize: '12px',
                  }}
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              paginatedData.map((item) => (
                <tr
                  key={keyExtractor(item)}
                  onClick={() => onRowClick && onRowClick(item)}
                  style={{
                    borderBottom: '1px solid var(--border-subtle)',
                    cursor: onRowClick ? 'pointer' : 'default',
                    transition: 'background-color 0.1s',
                  }}
                  onMouseEnter={(e) => {
                    if (hoverable) e.currentTarget.style.backgroundColor = 'var(--bg-hover)';
                  }}
                  onMouseLeave={(e) => {
                    if (hoverable) e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      style={{
                        padding: '9px 12px',
                        color: 'var(--text-primary)',
                        textAlign: col.align || 'left',
                        whiteSpace: 'nowrap',
                        verticalAlign: 'middle',
                      }}
                    >
                      {col.render(item)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 12px',
            borderTop: '1px solid var(--border-subtle)',
            fontSize: '11.5px',
            color: 'var(--text-muted)',
          }}
        >
          <span>
            Showing {page * pageSize + 1}–{Math.min((page + 1) * pageSize, data.length)} of {data.length} records
          </span>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              disabled={page === 0}
              onClick={() => setPage(page - 1)}
              style={{
                padding: '3px 8px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: page === 0 ? 'transparent' : 'var(--bg-elevated)',
                border: '1px solid var(--border-subtle)',
                color: page === 0 ? 'var(--text-subtle)' : 'var(--text-primary)',
                cursor: page === 0 ? 'not-allowed' : 'pointer',
              }}
            >
              Previous
            </button>
            <button
              disabled={page >= totalPages - 1}
              onClick={() => setPage(page + 1)}
              style={{
                padding: '3px 8px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: page >= totalPages - 1 ? 'transparent' : 'var(--bg-elevated)',
                border: '1px solid var(--border-subtle)',
                color: page >= totalPages - 1 ? 'var(--text-subtle)' : 'var(--text-primary)',
                cursor: page >= totalPages - 1 ? 'not-allowed' : 'pointer',
              }}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
