import { useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  flexRender,
} from '@tanstack/react-table';
import { Badge, Spinner, Avatar, Icon, currency } from '../../../components/common/index.jsx';

const STATUS_CONFIG = {
  'Active': { bg: '#ecfdf5', color: '#059669' },
  'On Leave': { bg: '#fffbeb', color: '#d97706' },
  'Resigned': { bg: '#fef2f2', color: '#dc2626' },
  'Terminated': { bg: '#f3f4f6', color: '#4b5563' }
};

export default function EmployeeTable({ 
  data, 
  isLoading, 
  sorting, 
  setSorting, 
  globalFilter, 
  setGlobalFilter, 
  searchInput, 
  onEdit 
}) {
  const columns = useMemo(() => [
    {
      header: 'Employee',
      accessorKey: 'user.firstName',
      cell: ({ row }) => {
        const emp = row.original;
        return (
          <div className="flex items-center gap-3">
            <Avatar name={`${emp.user?.firstName || ''} ${emp.user?.lastName || ''}`} size={40} />
            <div>
              <div className="font-bold text-gray-900">{emp.user?.firstName} {emp.user?.lastName}</div>
              <div className="text-xs text-gray-500">{emp.user?.email}</div>
            </div>
          </div>
        );
      }
    },
    {
      header: 'ID & Unit',
      accessorKey: 'employeeId',
      cell: ({ row }) => (
        <div>
          <span className="font-mono text-blue-600 font-semibold">{row.original.employeeId}</span>
          <div className="text-xs text-gray-500">{row.original.department?.name || 'Unassigned'}</div>
        </div>
      )
    },
    { header: 'Designation', accessorFn: row => row.designation?.title || 'N/A', id: 'designation' },
    { header: 'Salary', accessorKey: 'currentSalary', cell: ({ getValue }) => <span className="font-medium text-gray-700">{currency(getValue() || 0)}</span> },
    {
      header: 'Status',
      accessorKey: 'status',
      cell: ({ getValue }) => {
        const status = getValue() || 'Active';
        return <Badge label={status} style={STATUS_CONFIG[status] || STATUS_CONFIG['Active']} />;
      }
    },
    {
      header: 'Actions',
      id: 'actions',
      cell: ({ row }) => (
        <button onClick={() => onEdit(row.original)} className="p-2 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors text-gray-400">
          <Icon name="edit" size={18} />
        </button>
      )
    }
  ], [onEdit]);

  const table = useReactTable({
    data,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  });

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Icon name="search" size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            value={searchInput}
            onChange={e => setGlobalFilter(e.target.value)}
            className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none shadow-sm"
            placeholder="Search roster by name, ID or role..."
          />
        </div>
        <select 
          className="border border-gray-200 rounded-xl px-4 py-3 bg-white shadow-sm font-medium text-gray-700 outline-none focus:ring-2 focus:ring-blue-500"
          onChange={e => table.setPageSize(Number(e.target.value))}
        >
          {[10, 25, 50].map(size => <option key={size} value={size}>Show {size} rows</option>)}
        </select>
      </div>

      {/* Table Body */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead className="bg-gray-50/80 border-b border-gray-200">
            {table.getHeaderGroups().map(group => (
              <tr key={group.id}>
                {group.headers.map(header => (
                  <th 
                    key={header.id} 
                    className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors select-none"
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    <div className="flex items-center gap-2">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {{ asc: ' 🔼', desc: ' 🔽' }[header.column.getIsSorted()] ?? null}
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading ? (
              <tr><td colSpan={columns.length} className="p-12 text-center"><Spinner large /></td></tr>
            ) : table.getRowModel().rows.length === 0 ? (
              <tr><td colSpan={columns.length} className="p-12 text-center text-gray-500 font-medium">No personnel found matching your criteria.</td></tr>
            ) : table.getRowModel().rows.map(row => (
              <tr key={row.id} className="hover:bg-blue-50/40 transition-colors group">
                {row.getVisibleCells().map(cell => (
                  <td key={cell.id} className="p-4 text-sm text-gray-700">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination Controls */}
        <div className="p-4 border-t border-gray-200 flex items-center justify-between bg-gray-50/50">
          <span className="text-sm text-gray-600 font-medium">
            Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount() || 1}
          </span>
          <div className="flex gap-2">
            <button disabled={!table.getCanPreviousPage()} onClick={() => table.previousPage()} className="px-4 py-2 bg-white border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50 font-medium text-sm transition-colors">Prev</button>
            <button disabled={!table.getCanNextPage()} onClick={() => table.nextPage()} className="px-4 py-2 bg-white border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50 font-medium text-sm transition-colors">Next</button>
          </div>
        </div>
      </div>
    </div>
  );
}