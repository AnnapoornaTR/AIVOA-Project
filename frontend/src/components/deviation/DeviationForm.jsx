import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  updateFormField, 
  resetForm, 
  saveDeviationThunk 
} from '../../store/deviationSlice';
import { 
  Sparkles, 
  UserCheck, 
  AlertCircle, 
  RotateCcw, 
  Save, 
  Search, 
  Calendar, 
  CheckCircle2, 
  Info,
  ShieldAlert
} from 'lucide-react';

export default function DeviationForm({ onSavedSuccess }) {
  const dispatch = useDispatch();
  const { 
    formData, 
    aiPopulatedFields, 
    userEditedFields, 
    missingInformation, 
    isSaving,
    aiAnalysis 
  } = useSelector((state) => state.deviation);

  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Field change handler
  const handleChange = (field, value) => {
    dispatch(updateFormField({ field, value }));
  };

  // Helper to render field status badge
  const renderFieldBadge = (fieldName, isRequired = false) => {
    const isAi = aiPopulatedFields.includes(fieldName);
    const isUser = userEditedFields.includes(fieldName);
    const isMissing = missingInformation.includes(fieldName);
    const isEmpty = !formData[fieldName] || formData[fieldName].trim() === '';

    if (isUser) {
      return (
        <span className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
          <UserCheck className="w-2.5 h-2.5" />
          <span>User edited</span>
        </span>
      );
    }

    if (isAi && !isEmpty) {
      return (
        <span className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-700 border border-blue-200">
          <Sparkles className="w-2.5 h-2.5" />
          <span>AI generated</span>
        </span>
      );
    }

    if (isMissing && isEmpty && isRequired) {
      return (
        <span className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-rose-50 text-rose-700 border border-rose-200 animate-pulse">
          <AlertCircle className="w-2.5 h-2.5" />
          <span>Review required</span>
        </span>
      );
    }

    return null;
  };

  // Validation: required fields must be non-empty
  const requiredFields = [
    'site_plant',
    'date_of_occurrence',
    'title',
    'source',
    'detailed_description',
    'initial_impact',
    'initial_severity',
  ];

  const isValid = requiredFields.every(
    (field) => formData[field] && formData[field].trim() !== ''
  );

  const handleSave = async (e) => {
    e.preventDefault();
    if (!isValid) return;

    const resultAction = await dispatch(saveDeviationThunk(formData));
    if (saveDeviationThunk.fulfilled.match(resultAction)) {
      if (onSavedSuccess) {
        onSavedSuccess(resultAction.payload);
      }
    }
  };

  const handleResetClick = () => {
    const hasData = Object.values(formData).some((v) => v && String(v).trim() !== '');
    if (hasData) {
      setShowResetConfirm(true);
    } else {
      dispatch(resetForm());
    }
  };

  const confirmReset = () => {
    dispatch(resetForm());
    setShowResetConfirm(false);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 md:p-8 relative">
      
      {/* Form Header */}
      <div className="flex items-center justify-between pb-6 border-b border-slate-100">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Log Deviation</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Fill in or review AI-extracted details below. All fields marked with * are mandatory.
          </p>
        </div>
        
        {aiPopulatedFields.length > 0 && (
          <div className="flex items-center space-x-1.5 bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full text-xs font-semibold border border-blue-200">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Populated ({aiPopulatedFields.length} fields)</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="mt-6 space-y-8">
        
        {/* ======================================================== */}
        {/* SECTION 1: DEVIATION INFORMATION */}
        {/* ======================================================== */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              1. Deviation Information
            </h3>
            {missingInformation.length > 0 && (
              <span className="text-[11px] text-amber-600 font-medium flex items-center space-x-1">
                <AlertCircle className="w-3 h-3" />
                <span>AI could not determine {missingInformation.length} field(s)</span>
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Site / Plant */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700">
                  Site / Plant <span className="text-red-500">*</span>
                </label>
                {renderFieldBadge('site_plant', true)}
              </div>
              <div className="relative">
                <select
                  value={formData.site_plant}
                  onChange={(e) => handleChange('site_plant', e.target.value)}
                  className={`w-full px-3 py-2 text-sm bg-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition appearance-none cursor-pointer ${
                    missingInformation.includes('site_plant') && !formData.site_plant
                      ? 'border-amber-400 bg-amber-50/20 ring-1 ring-amber-300'
                      : 'border-slate-300'
                  }`}
                >
                  <option value="">Select site / plant</option>
                  <option value="API Manufacturing Unit">API Manufacturing Unit</option>
                  <option value="Formulation Plant 1">Formulation Plant 1</option>
                  <option value="Sterile Injectable Facility">Sterile Injectable Facility</option>
                  <option value="Biologics Unit - Hyderabad">Biologics Unit - Hyderabad</option>
                  <option value="Chemical Synthesis Block B">Chemical Synthesis Block B</option>
                  <option value="Quality Control Laboratories">Quality Control Laboratories</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-slate-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
              {missingInformation.includes('site_plant') && !formData.site_plant && (
                <p className="text-[11px] text-amber-600 font-medium">Review required — AI could not determine this value.</p>
              )}
            </div>

            {/* Date of Occurrence */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700">
                  Date of Occurrence <span className="text-red-500">*</span>
                </label>
                {renderFieldBadge('date_of_occurrence', true)}
              </div>
              <div className="relative">
                <input
                  type="date"
                  value={formData.date_of_occurrence}
                  onChange={(e) => handleChange('date_of_occurrence', e.target.value)}
                  placeholder="dd-mm-yyyy"
                  className={`w-full px-3 py-2 text-sm bg-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition ${
                    missingInformation.includes('date_of_occurrence') && !formData.date_of_occurrence
                      ? 'border-amber-400 bg-amber-50/20 ring-1 ring-amber-300'
                      : 'border-slate-300'
                  }`}
                />
              </div>
              {missingInformation.includes('date_of_occurrence') && !formData.date_of_occurrence && (
                <p className="text-[11px] text-amber-600 font-medium">Review required — AI could not determine this value.</p>
              )}
            </div>

            {/* Title / Short Description */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700">
                  Title / Short Description <span className="text-red-500">*</span>
                </label>
                {renderFieldBadge('title', true)}
              </div>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleChange('title', e.target.value)}
                placeholder="e.g. OOS result for Assay in Batch ABC-001"
                className={`w-full px-3 py-2 text-sm bg-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition ${
                  missingInformation.includes('title') && !formData.title
                    ? 'border-amber-400 bg-amber-50/20 ring-1 ring-amber-300'
                    : 'border-slate-300'
                }`}
              />
              {missingInformation.includes('title') && !formData.title && (
                <p className="text-[11px] text-amber-600 font-medium">Review required — AI could not determine this value.</p>
              )}
            </div>

            {/* Source */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700">
                  Source <span className="text-red-500">*</span>
                </label>
                {renderFieldBadge('source', true)}
              </div>
              <div className="relative">
                <select
                  value={formData.source}
                  onChange={(e) => handleChange('source', e.target.value)}
                  className={`w-full px-3 py-2 text-sm bg-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition appearance-none cursor-pointer ${
                    missingInformation.includes('source') && !formData.source
                      ? 'border-amber-400 bg-amber-50/20 ring-1 ring-amber-300'
                      : 'border-slate-300'
                  }`}
                >
                  <option value="">Select source</option>
                  <option value="Production">Production</option>
                  <option value="Quality Control">Quality Control</option>
                  <option value="Warehouse">Warehouse</option>
                  <option value="Engineering / Facilities">Engineering / Facilities</option>
                  <option value="Packaging">Packaging</option>
                  <option value="Validation">Validation</option>
                  <option value="Supply Chain">Supply Chain</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-slate-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
              {missingInformation.includes('source') && !formData.source && (
                <p className="text-[11px] text-amber-600 font-medium">Review required — AI could not determine this value.</p>
              )}
            </div>

            {/* Related Product / Material */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700">
                  Related Product / Material
                </label>
                {renderFieldBadge('related_product_material', false)}
              </div>
              <div className="relative">
                <input
                  type="text"
                  value={formData.related_product_material}
                  onChange={(e) => handleChange('related_product_material', e.target.value)}
                  placeholder="Search product or material..."
                  className="w-full pl-3 pr-9 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400">
                  <Search className="w-4 h-4" />
                </div>
              </div>
            </div>

            {/* Batch / Lot Number */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700">
                  Batch/Lot Number
                </label>
                {renderFieldBadge('batch_lot_number', false)}
              </div>
              <input
                type="text"
                value={formData.batch_lot_number}
                onChange={(e) => handleChange('batch_lot_number', e.target.value)}
                placeholder="Enter batch / lot no."
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
            </div>

          </div>
        </section>

        {/* ======================================================== */}
        {/* SECTION 2: DEVIATION DETAILS */}
        {/* ======================================================== */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              2. Deviation Details
            </h3>
          </div>

          {/* Detailed Description */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700">
                Detailed Description <span className="text-red-500">*</span>
              </label>
              {renderFieldBadge('detailed_description', true)}
            </div>
            <div className="relative">
              <textarea
                rows={4}
                maxLength={2000}
                value={formData.detailed_description}
                onChange={(e) => handleChange('detailed_description', e.target.value)}
                placeholder="Describe what happened, where, when and how it was detected..."
                className={`w-full p-3 text-sm bg-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition ${
                  missingInformation.includes('detailed_description') && !formData.detailed_description
                    ? 'border-amber-400 bg-amber-50/20 ring-1 ring-amber-300'
                    : 'border-slate-300'
                }`}
              />
              <div className="text-right text-[11px] text-slate-400 mt-1">
                {formData.detailed_description.length}/2000
              </div>
            </div>
            {missingInformation.includes('detailed_description') && !formData.detailed_description && (
              <p className="text-[11px] text-amber-600 font-medium">Review required — AI could not determine this value.</p>
            )}
          </div>

          {/* Initial Impact & Initial Severity */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Initial Impact */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700">
                  Initial Impact <span className="text-red-500">*</span>
                </label>
                {renderFieldBadge('initial_impact', true)}
              </div>
              <div className="relative">
                <select
                  value={formData.initial_impact}
                  onChange={(e) => handleChange('initial_impact', e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition appearance-none cursor-pointer"
                >
                  <option value="">Select impact</option>
                  <option value="No Impact">No Impact</option>
                  <option value="Minor">Minor</option>
                  <option value="Moderate">Moderate</option>
                  <option value="Major">Major</option>
                  <option value="Critical">Critical</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-slate-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
              {formData.impact_reason && (
                <div className="p-2 rounded bg-slate-50 border border-slate-200 text-[11px] text-slate-600">
                  <span className="font-semibold text-slate-700">Impact Rationale: </span>
                  {formData.impact_reason}
                </div>
              )}
            </div>

            {/* Initial Severity */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700">
                  Initial Severity <span className="text-red-500">*</span>
                </label>
                {renderFieldBadge('initial_severity', true)}
              </div>
              <div className="relative">
                <select
                  value={formData.initial_severity}
                  onChange={(e) => handleChange('initial_severity', e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition appearance-none cursor-pointer"
                >
                  <option value="">Select severity</option>
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Critical">Critical</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-slate-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
              {formData.severity_reason && (
                <div className="p-2 rounded bg-slate-50 border border-slate-200 text-[11px] text-slate-600">
                  <span className="font-semibold text-slate-700">Severity Rationale: </span>
                  {formData.severity_reason}
                </div>
              )}
            </div>

          </div>

          {/* AI Recommendation Banner */}
          {aiAnalysis && (formData.initial_impact || formData.initial_severity) && (
            <div className="bg-blue-50/60 border border-blue-200/80 rounded-lg p-3 text-xs text-blue-900 flex items-start space-x-2.5">
              <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold">AI Recommendation Notice: </span>
                AI-generated recommendation — review and confirm before saving. You can adjust impact and severity classifications as needed.
              </div>
            </div>
          )}
        </section>

        {/* ======================================================== */}
        {/* BOTTOM ACTION BAR */}
        {/* ======================================================== */}
        <div className="flex items-center justify-between pt-6 border-t border-slate-100">
          <button
            type="button"
            onClick={handleResetClick}
            className="inline-flex items-center space-x-2 px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 active:bg-slate-100 transition shadow-xs"
          >
            <RotateCcw className="w-4 h-4 text-slate-500" />
            <span>Reset Form</span>
          </button>

          <button
            type="submit"
            disabled={!isValid || isSaving}
            className={`inline-flex items-center space-x-2 px-6 py-2.5 rounded-lg text-sm font-semibold text-white shadow-xs transition ${
              !isValid || isSaving
                ? 'bg-slate-300 cursor-not-allowed text-slate-500'
                : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 shadow-blue-500/20'
            }`}
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Saving to Database...' : 'Save Deviation'}</span>
          </button>
        </div>

      </form>

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 border border-slate-200 mx-4">
            <div className="flex items-start space-x-3">
              <div className="p-2 rounded-full bg-amber-100 text-amber-600">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-slate-900">Reset Deviation Form?</h3>
                <p className="text-sm text-slate-600 mt-1">
                  Are you sure you want to clear all form fields, AI extraction results, and uploaded notes? Any unconfirmed edits will be lost.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end space-x-3 mt-6">
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="px-4 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmReset}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 transition shadow-xs"
              >
                Yes, Reset Form
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
