import { useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
} from '@tanstack/react-table';

import { Badge, Avatar, Icon, currency, Skeleton, EmptyState, fmtDate } from '../../../components/common/index.jsx';

export default function AttendanceTable({ 
  data, 
  isLoading,
  pageCount,
  totalRecords,
  pagination,
  setPagination, 
  filters,
  setFilters
}) {
  
  const columns = useMemo(() => [
    {
      header: 'Employee',
      accessorKey: 'employee.firstName',
      cell: ({ row }) => {
        const record = row.original;
        const fullName = `${record.employee?.firstName || ''} ${record.employee?.lastName || ''}`.trim();
        return (
          <div className="flex items-center gap-12">
            <Avatar name={fullName} size={36} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--gray-900)' }}>
                {fullName || 'Unknown Employee'}
              </div>
              <div style={{ fontSize: 11, color: 'var(--gray-400)' }} className="truncate">
                {record.employee?.email || 'No email provided'}
              </div>
            </div>
          </div>
        );
      }
    },
    {
      header: 'Report Period',
      accessorKey: 'startDate',
      cell: ({ row }) => (
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--gray-700)' }}>
          {fmtDate(row.original.startDate)} <span style={{ color: 'var(--gray-400)', fontWeight: 400 }}>to</span> {fmtDate(row.original.endDate)}
        </div>
      )
    },
    {
      header: 'Present',
      accessorKey: 'presentDays',
      cell: ({ getValue }) => <Badge label={`${getValue() || 0} Days`} className="badge-green" />
    },
    {
      header: 'Absent / Leave',
      id: 'absentLeave',
      cell: ({ row }) => (
        <div style={{ fontSize: 12, color: 'var(--gray-600)' }}>
          <strong style={{ color: 'var(--red-600)' }}>{row.original.absentDays || 0}</strong> A / <strong style={{ color: 'var(--purple-600)' }}>{row.original.leaveDays || 0}</strong> L
        </div>
      )
    },
    {
      header: 'Holidays / Offs',
      id: 'holidaysOffs',
      cell: ({ row }) => (
        <div style={{ fontSize: 12, color: 'var(--gray-600)' }}>
          <strong style={{ color: 'var(--blue-600)' }}>{row.original.holidays || 0}</strong> H / <strong style={{ color: 'var(--amber-600)' }}>{row.original.weeklyOffs || 0}</strong> WO
        </div>
      )
    },
    {
      header: 'Overtime (OT)',
      accessorKey: 'overtimeAmount',
      cell: ({ row }) => (
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--gray-800)' }}>
            {row.original.overtimeHours || '0:00'} hrs
          </div>
          <div style={{ fontSize: 11, color: 'var(--gray-500)' }}>
            {currency(row.original.overtimeAmount || 0)}
          </div>
        </div>
      )
    }
  ], []);

  const table = useReactTable({
    data,
    columns,
    state: { pagination },
    pageCount,
    onPaginationChange: setPagination,
    manualPagination: true,
    getCoreRowModel: getCoreRowModel(),
  });

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const hasActiveFilters = filters.month || filters.year !== new Date().getFullYear().toString();

  const firstRow = totalRecords === 0 ? 0 : (pagination.pageIndex * pagination.pageSize) + 1;
  const lastRow = Math.min((pagination.pageIndex + 1) * pagination.pageSize, totalRecords);

  const months = [
    { value: '1', label: 'January' }, { value: '2', label: 'February' }, { value: '3', label: 'March' },
    { value: '4', label: 'April' }, { value: '5', label: 'May' }, { value: '6', label: 'June' },
    { value: '7', label: 'July' }, { value: '8', label: 'August' }, { value: '9', label: 'September' },
    { value: '10', label: 'October' }, { value: '11', label: 'November' }, { value: '12', label: 'December' }
  ];

  return (
    <div className="card">
      
      {/* Table Toolbar */}
      <div className="card-header flex items-center justify-between gap-16 flex-wrap">
        
        {/* Left Side: Filters */}
        <div className="flex flex-wrap items-center gap-12" style={{ flex: '1 1 auto' }}>
          
          <div style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)', display: 'flex' }}>
              <Icon name="calendar" size={14} />
            </div>
            <select 
              className="form-control" 
              style={{ width: 'auto', minWidth: 140, padding: '9px 32px 9px 34px' }}
              value={filters.month} 
              onChange={e => handleFilterChange('month', e.target.value)}
            >
              <option value="">All Months</option>
              {months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
          </div>

          <select 
            className="form-control" 
            style={{ width: 'auto', minWidth: 100, padding: '9px 32px 9px 12px' }}
            value={filters.year} 
            onChange={e => handleFilterChange('year', e.target.value)}
          >
            <option value="2024">2024</option>
            <option value="2025">2025</option>
            <option value="2026">2026</option>
            <option value="2027">2027</option>
          </select>

          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <button 
              className="btn btn-secondary btn-sm"
              onClick={() => setFilters({ month: '', year: new Date().getFullYear().toString() })}
              style={{ padding: '8px 12px' }}
            >
              Clear Filters
            </button>
          )}
        </div>

        {/* Right Side: Page Size Options */}
        <div className="flex items-center gap-8">
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--gray-500)', textTransform: 'uppercase' }}>Rows:</span>
          <select 
            className="form-control"
            value={pagination.pageSize}
            onChange={e => table.setPageSize(Number(e.target.value))}
            style={{ width: 'auto', padding: '6px 32px 6px 12px', fontSize: 13 }}
          >
            {[10, 25, 50, 100].map(size => <option key={size} value={size}>{size}</option>)}
          </select>
        </div>
      </div>

      {/* Data Table */}
      <div className="table-wrap">
        <table>
          <thead>
            {table.getHeaderGroups().map(group => (
              <tr key={group.id}>
                {group.headers.map(header => (
                  <th key={header.id} style={{ textAlign: header.id === 'overtimeAmount' ? 'right' : header.id === 'absentLeave' || header.id === 'holidaysOffs' || header.id === 'presentDays' ? 'center' : 'left' }}>
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {isLoading ? (
              // Skeleton Loading Rows
              Array.from({ length: pagination.pageSize }).map((_, i) => (
                <tr key={`skeleton-${i}`}>
                  <td>
                    <div className="flex items-center gap-12">
                      <Skeleton height={36} width="36px" style={{ borderRadius: '50%' }} />
                      <div className="flex-col gap-4 flex-1">
                        <Skeleton height={14} width="120px" />
                        <Skeleton height={10} width="80px" />
                      </div>
                    </div>
                  </td>
                  <td><Skeleton height={14} width="160px" /></td>
                  <td><Skeleton height={20} width="60px" style={{ borderRadius: 10, margin: '0 auto' }} /></td>
                  <td><Skeleton height={14} width="80px" style={{ margin: '0 auto' }} /></td>
                  <td><Skeleton height={14} width="80px" style={{ margin: '0 auto' }} /></td>
                  <td>
                    <div className="flex flex-col gap-4" style={{ alignItems: 'flex-end' }}>
                      <Skeleton height={14} width="50px" />
                      <Skeleton height={10} width="40px" />
                    </div>
                  </td>
                </tr>
              ))
            ) : table.getRowModel().rows.length === 0 ? (
              // Empty State
              <tr>
                <td colSpan={columns.length} style={{ padding: '60px 20px' }}>
                  <EmptyState 
                    icon="📊" 
                    title="No records found" 
                    sub="No attendance summaries match the selected filters."
                    action={
                      hasActiveFilters && (
                        <button className="btn btn-secondary btn-sm" onClick={() => setFilters({ month: '', year: new Date().getFullYear().toString() })}>
                          Clear Filters
                        </button>
                      )
                    }
                  />
                </td>
              </tr>
            ) : (
              // Data Rows
              table.getRowModel().rows.map(row => (
                <tr key={row.id}>
                  {row.getVisibleCells().map(cell => (
                    <td key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="card-header flex items-center justify-between" style={{ borderTop: '1px solid var(--gray-100)', borderBottom: 'none' }}>
        <span style={{ fontSize: 13, color: 'var(--gray-500)' }}>
          Showing <strong style={{ color: 'var(--gray-900)' }}>{firstRow}</strong> to <strong style={{ color: 'var(--gray-900)' }}>{lastRow}</strong> of <strong style={{ color: 'var(--gray-900)' }}>{totalRecords}</strong> entries
        </span>
        
        <div className="flex gap-8">
          <button 
            className="btn btn-secondary btn-sm"
            disabled={!table.getCanPreviousPage() || isLoading} 
            onClick={() => table.previousPage()} 
          >
            Prev
          </button>
          <button 
            className="btn btn-secondary btn-sm"
            disabled={!table.getCanNextPage() || isLoading} 
            onClick={() => table.nextPage()} 
          >
            Next
          </button>
        </div>
      </div>

    </div>
  );
}