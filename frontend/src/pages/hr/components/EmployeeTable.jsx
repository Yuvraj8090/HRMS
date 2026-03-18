import { useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
} from '@tanstack/react-table';

import { Badge, Avatar, Icon, currency, Skeleton, EmptyState } from '../../../components/common/index.jsx';

export default function EmployeeTable({ 
  data, 
  isLoading,
  pageCount,
  totalRecords,
  pagination,
  setPagination, 
  sorting, 
  setSorting, 
  searchInput,
  setSearchInput, 
  onEdit 
}) {
  
  const columns = useMemo(() => [
    {
      header: 'Employee',
      accessorKey: 'user.firstName',
      cell: ({ row }) => {
        const emp = row.original;
        const fullName = `${emp.user?.firstName || ''} ${emp.user?.lastName || ''}`.trim();
        return (
          <div className="flex items-center gap-12">
            <Avatar name={fullName} size={36} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--gray-900)' }}>
                {fullName || 'Unknown'}
              </div>
              <div style={{ fontSize: 11, color: 'var(--gray-400)' }} className="truncate">
                {emp.user?.email}
              </div>
            </div>
          </div>
        );
      }
    },
    {
      header: 'Department & Unit',
      accessorKey: 'department.name',
      cell: ({ row }) => (
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--gray-800)' }}>
            {row.original.department?.name || 'Unassigned'}
          </div>
          <div style={{ fontSize: 11, color: 'var(--blue-600)', fontFamily: 'monospace', marginTop: 2 }}>
            {row.original.department?.code || 'N/A'}
          </div>
        </div>
      )
    },
    { 
      header: 'Designation', 
      accessorFn: row => row.designation?.title || 'N/A', 
      id: 'designation',
      cell: ({ getValue }) => <span style={{ fontSize: 13, color: 'var(--gray-700)' }}>{getValue()}</span>
    },
    { 
      header: 'Salary', 
      accessorKey: 'currentSalary', 
      cell: ({ getValue }) => <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--gray-700)' }}>{currency(getValue() || 0)}</span> 
    },
    {
      header: 'Status',
      accessorKey: 'status',
      cell: ({ getValue }) => <Badge label={getValue() || 'Active'} />
    },
    {
      header: 'Actions',
      id: 'actions',
      cell: ({ row }) => (
        <button 
          onClick={() => onEdit(row.original)} 
          className="btn btn-secondary btn-sm"
          title="Edit Employee"
          style={{ padding: '6px 10px' }}
        >
          <Icon name="edit" size={16} />
        </button>
      )
    }
  ], [onEdit]);

  const table = useReactTable({
    data,
    columns,
    state: { pagination, sorting },
    pageCount,
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    manualPagination: true,
    manualFiltering: true,
    getCoreRowModel: getCoreRowModel(),
  });

  const firstRow = totalRecords === 0 ? 0 : (pagination.pageIndex * pagination.pageSize) + 1;
  const lastRow = Math.min((pagination.pageIndex + 1) * pagination.pageSize, totalRecords);

  return (
    <div className="card">
      
      {/* Table Toolbar */}
      <div className="card-header flex items-center justify-between gap-16 flex-wrap">
        {/* Search */}
        <div style={{ position: 'relative', flex: 1, minWidth: 260, maxWidth: 400 }}>
          <div style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)', display: 'flex' }}>
            <Icon name="search" size={16} />
          </div>
          <input 
            type="text"
            className="form-control"
            placeholder="Search roster by name, email..."
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            style={{ paddingLeft: 38 }}
          />
        </div>

        {/* Page Size Options */}
        <div className="flex items-center gap-8">
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--gray-500)', textTransform: 'uppercase' }}>Rows:</span>
          <select 
            className="form-control"
            value={pagination.pageSize}
            onChange={e => table.setPageSize(Number(e.target.value))}
            style={{ width: 'auto', padding: '6px 32px 6px 12px', fontSize: 13 }}
          >
            {[10, 20, 50, 100].map(size => <option key={size} value={size}>{size}</option>)}
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
                  <th key={header.id}>
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
                  <td><Skeleton height={14} width="100px" /></td>
                  <td><Skeleton height={14} width="140px" /></td>
                  <td><Skeleton height={14} width="80px" /></td>
                  <td><Skeleton height={20} width="60px" style={{ borderRadius: 10 }} /></td>
                  <td><Skeleton height={28} width="36px" style={{ borderRadius: 6 }} /></td>
                </tr>
              ))
            ) : table.getRowModel().rows.length === 0 ? (
              // Empty State
              <tr>
                <td colSpan={columns.length} style={{ padding: '48px 20px' }}>
                  <EmptyState 
                    icon="🔍" 
                    title="No personnel found" 
                    sub={`We couldn't find anyone matching "${searchInput}".`}
                    action={
                      searchInput && (
                        <button className="btn btn-secondary btn-sm" onClick={() => setSearchInput('')}>
                          Clear Search
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