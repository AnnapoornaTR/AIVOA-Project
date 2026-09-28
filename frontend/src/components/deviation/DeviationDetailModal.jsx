import React from 'react';
import { X, Calendar, Building, Tag, FileText, CheckCircle2, ShieldAlert } from 'lucide-react';

export default function DeviationDetailModal({ deviation, onClose }) {
  if (!deviation) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 border border-slate-200 space-y-5">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-mono text-sm font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded border border-blue-200">
                {deviation.deviation_id}
              </span>
              <span className="px-2 py-0.5 rounded text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                {deviation.status}
              </span>
            </div>
            <h2 className="text-base font-bold text-slate-900 mt-2">{deviation.title}</h2>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Key Attributes */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
            <span className="text-[10px] text-slate-400 block uppercase font-semibold">Site / Plant</span>
            <span className="font-semibold text-slate-800">{deviation.site_plant}</span>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
            <span className="text-[10px] text-slate-400 block uppercase font-semibold">Date of Occurrence</span>
            <span className="font-semibold text-slate-800">{deviation.date_of_occurrence}</span>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
            <span className="text-[10px] text-slate-400 block uppercase font-semibold">Source</span>
            <span className="font-semibold text-slate-800">{deviation.source}</span>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
            <span className="text-[10px] text-slate-400 block uppercase font-semibold">Product / Material</span>
            <span className="font-semibold text-slate-800">{deviation.related_product_material || 'N/A'}</span>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
            <span className="text-[10px] text-slate-400 block uppercase font-semibold">Batch / Lot Number</span>
            <span className="font-mono font-semibold text-slate-800">{deviation.batch_lot_number || 'N/A'}</span>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
            <span className="text-[10px] text-slate-400 block uppercase font-semibold">Logged By</span>
            <span className="font-semibold text-slate-800">{deviation.created_by}</span>
          </div>
        </div>

        {/* Detailed Description */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Detailed Chronological Description
          </label>
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700 whitespace-pre-wrap leading-relaxed max-h-40 overflow-y-auto">
            {deviation.detailed_description}
          </div>
        </div>

        {/* Impact & Severity */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-lg bg-blue-50/50 border border-blue-200 space-y-1">
            <span className="text-[10px] text-blue-600 block uppercase font-bold">Initial Impact: {deviation.initial_impact}</span>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              {deviation.impact_reason || 'No specific rationale provided.'}
            </p>
          </div>
          <div className="p-3 rounded-lg bg-amber-50/50 border border-amber-200 space-y-1">
            <span className="text-[10px] text-amber-700 block uppercase font-bold">Initial Severity: {deviation.initial_severity}</span>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              {deviation.severity_reason || 'No specific rationale provided.'}
            </p>
          </div>
        </div>

        {/* Close Button */}
        <div className="pt-2 text-right">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-800 transition"
          >
            Close Viewer
          </button>
        </div>

      </div>
    </div>
  );
}
