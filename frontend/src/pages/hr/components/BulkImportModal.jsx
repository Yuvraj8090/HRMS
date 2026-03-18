import { Icon, Spinner } from '../../../components/common/index.jsx';

export default function BulkImportModal({
  isOpen,
  onClose,
  onSubmit,
  onFileChange,
  isSubmitting
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[1000] p-4 backdrop-blur-sm">
      <article className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-scale-up">
        <header className="border-b border-gray-100 p-6">
          <h2 className="text-xl font-bold text-gray-900">Bulk Import Employees</h2>
        </header>
        
        <div className="p-6">
          <form onSubmit={onSubmit} className="flex flex-col gap-6">
            <div className="p-8 border-2 border-dashed border-gray-300 rounded-xl text-center bg-gray-50 hover:bg-gray-100 transition-colors">
              <Icon name="upload" size={32} className="mx-auto text-gray-400 mb-4" />
              <p className="text-sm font-medium text-gray-600 mb-4">
                Select the U-Prepare Current Strength CSV/Excel file.
              </p>
              <input 
                type="file" 
                onChange={onFileChange} 
                accept=".xlsx,.xls,.csv" 
                required 
                className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" 
              />
            </div>
            
            <div className="flex justify-end gap-3 mt-2">
              <button type="button" onClick={onClose} className="px-5 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg font-bold hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button type="submit" disabled={isSubmitting} className="px-5 py-2.5 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700 transition-colors disabled:opacity-70 flex items-center justify-center min-w-[140px]">
                {isSubmitting ? <Spinner size={18} color="#fff" /> : 'Start Import'}
              </button>
            </div>
          </form>
        </div>
      </article>
    </div>
  );
}