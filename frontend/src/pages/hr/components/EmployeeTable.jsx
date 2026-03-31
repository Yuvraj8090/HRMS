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
  filters,
  setFilters,
  departments,
  designations,
  onEdit,
  onDeactivate // This prop name is fine, it now acts as a generic "Toggle" handler passed from parent
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
      cell: ({ getValue }) => {
        const status = getValue() || 'Active';
        return <Badge label={status} />;
      }
    },
    {
      header: 'Actions',
      id: 'actions',
      cell: ({ row }) => {
        const emp = row.original;
        // Determine if currently active based on User flag or Profile status
        // Adjust this logic if your backend relies purely on emp.status === 'Active'
        const isActive = emp.status !== 'Terminated' && emp.status !== 'Resigned'; 

        return (
          <div className="flex items-center gap-8">
            <button 
              onClick={() => onEdit(emp)} 
              className="btn btn-secondary btn-sm"
              title="Edit Employee"
              style={{ padding: '6px 10px' }}
            >
              <Icon name="edit" size={16} />
            </button>

            {isActive ? (
              // DEACTIVATE BUTTON (Red)
              <button 
                onClick={() => {
                  if (window.confirm(`Are you sure you want to DEACTIVATE ${emp.user?.firstName || 'this employee'}?`)) {
                    onDeactivate(emp);
                  }
                }} 
                className="btn btn-secondary btn-sm"
                title="Deactivate Employee"
                style={{ padding: '6px 10px', color: 'var(--red-600)', borderColor: 'var(--red-200)' }}
              >
                <Icon name="trash" size={16} />
              </button>
            ) : (
              // ACTIVATE BUTTON (Green)
              <button 
                onClick={() => {
                  if (window.confirm(`Are you sure you want to RE-ACTIVATE ${emp.user?.firstName || 'this employee'}?`)) {
                    onDeactivate(emp);
                  }
                }} 
                className="btn btn-secondary btn-sm"
                title="Activate Employee"
                style={{ padding: '6px 10px', color: 'var(--green-600)', borderColor: 'var(--green-200)' }}
              >
                <Icon name="check-circle" size={16} /> 
              </button>
            )}
          </div>
        );
      }
    }
  ], [onEdit, onDeactivate]);

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

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const hasActiveFilters = filters.department || filters.designation || filters.status;

  const firstRow = totalRecords === 0 ? 0 : (pagination.pageIndex * pagination.pageSize) + 1;
  const lastRow = Math.min((pagination.pageIndex + 1) * pagination.pageSize, totalRecords);

  return (
    <div className="card">
      
      {/* Table Toolbar */}
      <div className="card-header flex items-center justify-between gap-16 flex-wrap">
        
        {/* Left Side: Search & Filters */}
        <div className="flex flex-wrap items-center gap-12" style={{ flex: '1 1 auto' }}>
          
          {/* Search */}
          <div style={{ position: 'relative', width: 280 }}>
            <div style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)', display: 'flex' }}>
              <Icon name="search" size={16} />
            </div>
            <input 
              type="text"
              className="form-control"
              placeholder="Search by name, email..."
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              style={{ paddingLeft: 38 }}
            />
          </div>

          {/* Department Filter */}
          <select 
            className="form-control" 
            style={{ width: 'auto', minWidth: 160, padding: '9px 32px 9px 12px' }}
            value={filters.department} 
            onChange={e => handleFilterChange('department', e.target.value)}
          >
            <option value="">All Departments</option>
            {departments?.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
          </select>

          {/* Designation Filter */}
          <select 
            className="form-control" 
            style={{ width: 'auto', minWidth: 160, padding: '9px 32px 9px 12px' }}
            value={filters.designation} 
            onChange={e => handleFilterChange('designation', e.target.value)}
          >
            <option value="">All Designations</option>
            {designations?.map(d => <option key={d._id} value={d._id}>{d.title}</option>)}
          </select>

          {/* Status Filter */}
          <select 
            className="form-control" 
            style={{ width: 'auto', minWidth: 140, padding: '9px 32px 9px 12px' }}
            value={filters.status} 
            onChange={e => handleFilterChange('status', e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="Active">Active</option>
            <option value="On Leave">On Leave</option>
            <option value="Resigned">Resigned</option>
            <option value="Terminated">Terminated</option>
          </select>

          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <button 
              className="btn btn-secondary btn-sm"
              onClick={() => setFilters({ department: '', designation: '', status: '' })}
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
                  <td><Skeleton height={28} width="80px" style={{ borderRadius: 6 }} /></td>
                </tr>
              ))
            ) : table.getRowModel().rows.length === 0 ? (
              // Empty State
              <tr>
                <td colSpan={columns.length} style={{ padding: '48px 20px' }}>
                  <EmptyState 
                    icon="🔍" 
                    title="No personnel found" 
                    sub="We couldn't find anyone matching your current filters and search."
                    action={
                      (searchInput || hasActiveFilters) && (
                        <button className="btn btn-secondary btn-sm" onClick={() => {
                          setSearchInput('');
                          setFilters({ department: '', designation: '', status: '' });
                        }}>
                          Clear All Filters
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