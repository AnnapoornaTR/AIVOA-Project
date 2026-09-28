import React from 'react';
import { CheckCircle, ExternalLink, PlusCircle, X, ShieldCheck } from 'lucide-react';

export default function SuccessModal({ savedDeviation, onViewDeviation, onStartNew }) {
  if (!savedDeviation) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200 text-center space-y-5">
        
        {/* Success Icon */}
        <div className="mx-auto w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center ring-8 ring-emerald-50">
          <CheckCircle className="w-8 h-8" />
        </div>

        {/* Success Title & Details */}
        <div className="space-y-2">
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
            Record Saved to Database
          </span>
          <h3 className="text-xl font-bold text-slate-900">
            Deviation Created Successfully
          </h3>
          <p className="text-sm text-slate-600">
            Deviation record <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">{savedDeviation.deviation_id}</span> has been logged and assigned status <span className="font-semibold text-amber-700">{savedDeviation.status || 'Draft'}</span>.
          </p>
        </div>

        {/* Summary Card */}
        <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 text-left text-xs space-y-1.5">
          <div className="flex justify-between">
            <span className="text-slate-500">Title:</span>
            <span className="font-semibold text-slate-800 truncate max-w-[220px]">{savedDeviation.title}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Site:</span>
            <span className="font-semibold text-slate-800">{savedDeviation.site_plant}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Batch / Lot:</span>
            <span className="font-mono font-semibold text-slate-800">{savedDeviation.batch_lot_number || 'N/A'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Impact / Severity:</span>
            <span className="font-semibold text-slate-800">{savedDeviation.initial_impact} / {savedDeviation.initial_severity}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            type="button"
            onClick={onViewDeviation}
            className="flex items-center justify-center space-x-1.5 py-2.5 px-4 rounded-xl border border-slate-300 font-semibold text-xs text-slate-700 hover:bg-slate-50 transition shadow-xs"
          >
            <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
            <span>View Deviation</span>
          </button>
          <button
            type="button"
            onClick={onStartNew}
            className="flex items-center justify-center space-x-1.5 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 font-semibold text-xs text-white shadow-xs transition"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Start New Deviation</span>
          </button>
        </div>

      </div>
    </div>
  );
}
