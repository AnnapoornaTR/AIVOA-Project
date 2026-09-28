import React, { useEffect, useState } from 'react';
import { deviationService } from '../../services/api';
import { X, RefreshCw, FileText, Calendar, Building, AlertTriangle, ShieldCheck, Search } from 'lucide-react';

export default function DeviationsListModal({ isOpen, onClose, onSelectDeviation }) {
  const [deviations, setDeviations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchDeviations = async () => {
    try {
      setLoading(true);
      const data = await deviationService.getDeviations();
      setDeviations(data);
    } catch (err) {
      console.error("Failed to load deviations:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchDeviations();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filtered = deviations.filter((dev) => {
    const q = searchTerm.toLowerCase();
    return (
      (dev.deviation_id && dev.deviation_id.toLowerCase().includes(q)) ||
      (dev.title && dev.title.toLowerCase().includes(q)) ||
      (dev.batch_lot_number && dev.batch_lot_number.toLowerCase().includes(q)) ||
      (dev.site_plant && dev.site_plant.toLowerCase().includes(q))
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[85vh] flex flex-col border border-slate-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-blue-50 text-blue-700">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Logged Deviations Registry</h2>
              <p className="text-xs text-slate-500">Live records retrieved directly from the database</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={fetchDeviations}
              className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter / Search Bar */}
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center">
          <div className="relative w-full">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Deviation ID, Batch #, Plant, or Title..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Content Table / List */}
        <div className="overflow-y-auto flex-1 p-4">
          {loading ? (
            <div className="py-12 text-center text-slate-400 text-xs flex flex-col items-center">
              <RefreshCw className="w-6 h-6 animate-spin text-blue-500 mb-2" />
              <span>Fetching deviation records...</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              <FileText className="w-8 h-8 mx-auto text-slate-300 mb-2" />
              <p className="font-semibold text-slate-600">No deviation records found</p>
              <p className="text-slate-400 mt-1">Log a new deviation to populate the database registry.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                    <th className="py-2.5 px-3">Deviation ID</th>
                    <th className="py-2.5 px-3">Title / Description</th>
                    <th className="py-2.5 px-3">Site / Plant</th>
                    <th className="py-2.5 px-3">Batch / Lot</th>
                    <th className="py-2.5 px-3">Impact</th>
                    <th className="py-2.5 px-3">Severity</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Logged At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((dev) => (
                    <tr 
                      key={dev.id} 
                      onClick={() => onSelectDeviation && onSelectDeviation(dev)}
                      className="hover:bg-blue-50/40 cursor-pointer transition"
                    >
                      <td className="py-3 px-3 font-mono font-bold text-blue-700">
                        {dev.deviation_id}
                      </td>
                      <td className="py-3 px-3 font-semibold text-slate-800 max-w-[200px] truncate">
                        {dev.title}
                      </td>
                      <td className="py-3 px-3 text-slate-600">
                        {dev.site_plant}
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-600">
                        {dev.batch_lot_number || '—'}
                      </td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          dev.initial_impact === 'Critical' ? 'bg-red-50 text-red-700' :
                          dev.initial_impact === 'Major' ? 'bg-orange-50 text-orange-700' :
                          dev.initial_impact === 'Moderate' ? 'bg-amber-50 text-amber-700' :
                          'bg-slate-100 text-slate-700'
                        }`}>
                          {dev.initial_impact}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          dev.initial_severity === 'Critical' ? 'bg-red-50 text-red-700' :
                          dev.initial_severity === 'High' ? 'bg-rose-50 text-rose-700' :
                          dev.initial_severity === 'Medium' ? 'bg-amber-50 text-amber-700' :
                          'bg-slate-100 text-slate-700'
                        }`}>
                          {dev.initial_severity}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-amber-50 text-amber-800 border border-amber-200">
                          {dev.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right text-slate-400 text-[11px]">
                        {new Date(dev.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-200 bg-slate-50 flex justify-between items-center text-xs text-slate-500">
          <span>Total Records: {filtered.length}</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg border border-slate-300 font-medium text-slate-700 hover:bg-slate-100 transition"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
