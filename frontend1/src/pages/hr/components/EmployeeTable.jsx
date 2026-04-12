// src/pages/hr/components/EmployeeTable.jsx
import { Avatar, Badge, Icon, fmt } from '../../../components/common/index.jsx';
export default function EmployeeTable({ employees, onEdit, canDeactivate, onDeactivate }) {
  return (
    <div className="tbl-wrap">
      <table className="tbl">
        <thead><tr><th>Employee</th><th>ID</th><th>Dept</th><th>Role</th><th>Joined</th><th>Salary</th><th>Type</th><th></th></tr></thead>
        <tbody>
          {employees.map(e => (
            <tr key={e._id}>
              <td>
                <div className="flex items-center gap-2.5">
                  <Avatar name={`${e.firstName} ${e.lastName}`} size={8} />
                  <div>
                    <div className="text-sm font-700 text-gray-900">{e.firstName} {e.lastName}</div>
                    <div className="text-xs text-gray-400">{e.email}</div>
                  </div>
                </div>
              </td>
              <td><code className="text-xs bg-gray-100 px-2 py-0.5 rounded font-600">{e.employeeNumber || e.payCode || '—'}</code></td>
              <td className="text-sm">{e.department?.name || '—'}</td>
              <td><Badge label={e.role} /></td>
              <td className="text-xs text-gray-400">{fmt.date(e.joiningDate)}</td>
              <td className="font-700 text-sm">{e.currentSalary ? fmt.currency(e.currentSalary) : '—'}</td>
              <td><Badge label={e.employmentType || 'Full-Time'} /></td>
              <td>
                <div className="flex gap-1.5">
                  <button className="btn btn-secondary btn-sm" onClick={() => onEdit(e)}><Icon name="edit" size={12} /></button>
                  {canDeactivate && e.isActive && <button className="btn btn-danger btn-sm" onClick={() => onDeactivate(e)}><Icon name="trash" size={12} /></button>}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
