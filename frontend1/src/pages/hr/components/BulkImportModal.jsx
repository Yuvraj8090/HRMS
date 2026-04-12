// src/pages/hr/components/BulkImportModal.jsx
import { useState } from 'react';
import { attendAPI } from '../../../services/api.js';
import { useToast } from '../../../context/ToastContext.jsx';
import { Modal, Spinner, Icon, Badge } from '../../../components/common/index.jsx';

export default function BulkImportModal({ onClose }) {
  const toast = useToast();
  const [file,    setFile]    = useState(null);
  const [loading, setLoading] = useState(false);
  const [result,  setResult]  = useState(null);

  const submit = async () => {
    if (!file) return toast.error('Please select an Excel file.');
    setLoading(true);
    try {
      const fd = new FormData(); fd.append('file', file);
      const { data } = await attendAPI.importExcel(fd);
      setResult(data);
      toast.success(data.message);
    } catch (e) { toast.error(e.message); }
    setLoading(false);
  };

  return (
    <Modal title="Import Attendance from Excel" onClose={() => onClose(!!result)} size="md"
      footer={!result ? <><button className="btn btn-secondary" onClick={() => onClose(false)}>Cancel</button><button className="btn btn-primary" onClick={submit} disabled={loading || !file}>{loading ? <Spinner size="sm" /> : <><Icon name="upload" size={13} />Import</>}</button></> : <button className="btn btn-primary" onClick={() => onClose(true)}>Done</button>}>
      {!result ? (
        <>
          <div className="rounded-xl border-2 border-dashed border-gray-200 p-8 text-center bg-gray-50 mb-4">
            <Icon name="upload" size={28} className="text-gray-300 mx-auto mb-3" />
            <p className="text-sm font-700 text-gray-700 mb-1">Upload Excel/CSV File</p>
            <p className="text-xs text-gray-400 mb-4">USDMA format: SNo, PayCode, CardNo, Name, Present, Absent, Weekly Off, Holiday, Leave, OT, OT Amount</p>
            <input type="file" accept=".xls,.xlsx,.csv" onChange={e => setFile(e.target.files[0])} className="text-sm text-gray-500" />
          </div>
          {file && <div className="flex items-center gap-2 text-sm text-success-700 bg-success-50 px-4 py-2.5 rounded-lg"><Icon name="check" size={14} />{file.name}</div>}
        </>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            {[['Total',result.summary?.total,'badge-blue'],['Matched',result.summary?.imported,'badge-green'],['Unmatched',result.summary?.unmatched,'badge-amber']].map(([l,v,cls])=>(
              <div key={l} className="text-center p-3 bg-gray-50 rounded-xl">
                <div className="text-2xl font-800 text-gray-900">{v}</div>
                <div className="text-xs text-gray-400 mt-0.5">{l}</div>
              </div>
            ))}
          </div>
          {result.results?.filter(r => !r.matched).length > 0 && (
            <div>
              <p className="text-xs font-700 text-gray-400 uppercase tracking-wide mb-2">Unmatched rows</p>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {result.results.filter(r => !r.matched).map((r,i) => (
                  <div key={i} className="text-xs text-gray-600 bg-warning-50 border border-warning-200 rounded-lg px-3 py-2">
                    <span className="font-700">{r.payCode}</span> — {r.employeeName}: {r.reason}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
