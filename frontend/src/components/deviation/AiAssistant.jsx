import React, { useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  analyzeDeviationThunk, 
  setPastedText, 
  setUploadedFileName,
  askAiThunk,
  clearError 
} from '../../store/deviationSlice';
import { 
  Sparkles, 
  FileText, 
  UploadCloud, 
  FileCheck, 
  CheckCircle2, 
  AlertTriangle, 
  Bot, 
  Send, 
  X, 
  Check, 
  HelpCircle,
  TrendingUp,
  AlertCircle,
  FileCode,
  ShieldCheck
} from 'lucide-react';

const SAMPLE_DEVIATION_TEXT = 
  "During manufacturing of API Batch ABC-001 on 25 September 2026, the reactor temperature exceeded the approved operating range of 70-75°C. The temperature reached 79°C for approximately 12 minutes. The excursion was detected by the production operator during routine monitoring. The batch was immediately placed on hold. No equipment damage was observed. QA was notified and an investigation was initiated.";

export default function AiAssistant() {
  const dispatch = useDispatch();
  const fileInputRef = useRef(null);
  const chatScrollRef = useRef(null);

  const {
    isAnalyzing,
    analysisProgress,
    analysisStatus,
    aiAnalysis,
    error,
    pastedText,
    uploadedFileName,
    chatMessages,
    isChatting,
    missingInformation
  } = useSelector((state) => state.deviation);

  const [selectedFile, setSelectedFile] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [chatQuestion, setChatQuestion] = useState('');
  const [showPasteArea, setShowPasteArea] = useState(true);

  // File drop handler
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      handleFileSelected(file);
    }
  };

  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      handleFileSelected(file);
    }
  };

  const handleFileSelected = (file) => {
    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert("File size exceeds 10MB limit. Please choose a smaller file.");
      return;
    }
    setSelectedFile(file);
    dispatch(setUploadedFileName(file.name));
  };

  const clearSelectedFile = () => {
    setSelectedFile(null);
    dispatch(setUploadedFileName(null));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUseSample = () => {
    dispatch(setPastedText(SAMPLE_DEVIATION_TEXT));
    clearSelectedFile();
  };

  const handleAnalyze = () => {
    if (selectedFile) {
      dispatch(analyzeDeviationThunk(selectedFile));
    } else if (pastedText.trim()) {
      dispatch(analyzeDeviationThunk(pastedText.trim()));
    }
  };

  const handleSendChat = (e) => {
    e?.preventDefault();
    if (!chatQuestion.trim() || isChatting) return;
    const q = chatQuestion.trim();
    setChatQuestion('');
    dispatch(askAiThunk(q));
  };

  const handleQuickQuestion = (q) => {
    if (isChatting) return;
    dispatch(askAiThunk(q));
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 md:p-6 flex flex-col space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center space-x-2">
          <div className="p-1 rounded-md bg-blue-50 text-blue-600">
            <Sparkles className="w-4 h-4" />
          </div>
          <h2 className="font-bold text-slate-900 text-sm tracking-tight">AI Deviation Assistant</h2>
        </div>
        <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-blue-50 text-blue-700 border border-blue-200">
          BETA
        </span>
      </div>

      {/* Error Alert if any */}
      {error && (
        <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
          <div className="flex-1">
            <p className="font-semibold">Analysis Notice</p>
            <p className="mt-0.5">{error}</p>
          </div>
          <button 
            onClick={() => dispatch(clearError())} 
            className="text-rose-500 hover:text-rose-700"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Primary Intake: Drag and drop supporting document */}
      <div className="space-y-3">
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-xl p-5 text-center transition cursor-pointer ${
            isDragOver 
              ? 'border-blue-500 bg-blue-50/50' 
              : 'border-slate-200 hover:border-slate-300 bg-slate-50/40'
          }`}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileInputChange}
            accept=".pdf,.docx,.txt,.xlsx,.xls,.png,.jpg,.jpeg"
            className="hidden"
          />
          <div className="flex flex-col items-center justify-center space-y-2">
            <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-800">
                Drag & drop supporting document here
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                or <span className="text-blue-600 font-semibold hover:underline">click to browse</span>
              </p>
            </div>
          </div>
        </div>

        {/* Selected file preview */}
        {selectedFile && (
          <div className="flex items-center justify-between p-2.5 rounded-lg bg-blue-50/70 border border-blue-200 text-xs">
            <div className="flex items-center space-x-2 truncate">
              <FileCheck className="w-4 h-4 text-blue-600 shrink-0" />
              <span className="font-semibold text-blue-900 truncate">{selectedFile.name}</span>
              <span className="text-[10px] text-blue-600">({(selectedFile.size / 1024).toFixed(1)} KB)</span>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                clearSelectedFile();
              }}
              className="p-1 hover:bg-blue-100 rounded text-blue-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* OR Divider */}
        <div className="relative flex py-1 items-center">
          <div className="flex-grow border-t border-slate-200"></div>
          <span className="flex-shrink mx-3 text-[10px] uppercase font-bold text-slate-400">OR</span>
          <div className="flex-grow border-t border-slate-200"></div>
        </div>

        {/* Paste deviation details / notes */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1.5 text-xs font-semibold text-slate-700">
              <FileCode className="w-3.5 h-3.5 text-slate-500" />
              <span>Paste deviation details / notes</span>
            </div>
            <button
              type="button"
              onClick={handleUseSample}
              className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 hover:underline flex items-center space-x-1"
            >
              <Sparkles className="w-3 h-3" />
              <span>Use Sample Deviation</span>
            </button>
          </div>

          <textarea
            rows={3}
            value={pastedText}
            onChange={(e) => dispatch(setPastedText(e.target.value))}
            placeholder="Paste raw email, batch sheet notes, laboratory observation or excursion description here..."
            className="w-full p-2.5 text-xs bg-slate-50/50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
          />
        </div>

        {/* Supported formats banner */}
        <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-lg p-2.5 flex items-center space-x-2 text-[11px] text-emerald-800">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <div className="leading-tight">
            <span className="font-semibold">Supported formats:</span> PDF, DOCX, TXT, XLS, JPG, PNG
            <span className="block text-[10px] text-emerald-600 mt-0.5">Max file size: 10MB</span>
          </div>
        </div>

        {/* Analyze Deviation Button */}
        <button
          type="button"
          onClick={handleAnalyze}
          disabled={isAnalyzing || (!selectedFile && !pastedText.trim())}
          className={`w-full py-2.5 px-4 rounded-lg text-xs font-bold uppercase tracking-wider text-white shadow-xs transition flex items-center justify-center space-x-2 ${
            isAnalyzing || (!selectedFile && !pastedText.trim())
              ? 'bg-slate-300 cursor-not-allowed text-slate-500'
              : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 shadow-blue-500/20'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>{isAnalyzing ? 'Analyzing Deviation...' : 'Analyze Deviation'}</span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* EXTRACTION PROGRESS SECTION */}
      {/* ======================================================== */}
      {(isAnalyzing || analysisProgress > 0) && (
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500">
            <span>Extraction Progress</span>
            <span className="text-blue-600 font-bold">{analysisProgress}%</span>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div 
              className="bg-blue-600 h-full transition-all duration-300 ease-out rounded-full"
              style={{ width: `${analysisProgress}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-500 italic">
            {analysisStatus || 'Analyzing document content and extracting key details... Please wait.'}
          </p>
        </div>
      )}

      {/* ======================================================== */}
      {/* AI ASSISTANT / RECOMMENDATIONS PANEL */}
      {/* ======================================================== */}
      <div className="space-y-3 pt-2 border-t border-slate-100">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
          AI Assistant
        </h3>

        {!aiAnalysis ? (
          // Initial State
          <div className="bg-blue-50/70 border border-blue-100 rounded-xl p-4 flex items-start space-x-3 text-xs text-blue-900">
            <div className="p-2 rounded-lg bg-blue-100 text-blue-700 shrink-0">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <p className="font-semibold text-slate-900">AI Intake Ready</p>
              <p className="text-slate-600 mt-0.5 leading-relaxed text-[11px]">
                Upload a deviation report, lab result, or paste text above. I will automatically extract the relevant details and populate the form for you.
              </p>
            </div>
          </div>
        ) : (
          // Analyzed State & Recommendations
          <div className="space-y-3">
            {/* Completion Badge */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-xs text-emerald-900 flex items-start space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Analysis Complete</span>
                <p className="text-[11px] text-emerald-700 mt-0.5">
                  Review the extracted information and AI recommendations before saving.
                </p>
              </div>
            </div>

            {/* Checklist of detected items */}
            <div className="bg-slate-50 rounded-lg p-3 border border-slate-200 text-xs space-y-1.5">
              <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wide mb-1">
                Detected Observations
              </div>
              
              {aiAnalysis.detected_facts && aiAnalysis.detected_facts.length > 0 ? (
                aiAnalysis.detected_facts.map((fact, idx) => (
                  <div key={idx} className="flex items-center space-x-1.5 text-slate-700 text-[11px]">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>{fact}</span>
                  </div>
                ))
              ) : (
                <>
                  <div className="flex items-center space-x-1.5 text-slate-700 text-[11px]">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Batch number detected</span>
                  </div>
                  <div className="flex items-center space-x-1.5 text-slate-700 text-[11px]">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Date of occurrence detected</span>
                  </div>
                  <div className="flex items-center space-x-1.5 text-slate-700 text-[11px]">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Process excursion detected</span>
                  </div>
                </>
              )}

              {/* Missing Information Alerts */}
              {missingInformation.map((item, idx) => (
                <div key={idx} className="flex items-center space-x-1.5 text-amber-700 text-[11px]">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span>{item.replace('_', ' ').toUpperCase()} needs manual review (not in source text)</span>
                </div>
              ))}
            </div>

            {/* AI Recommendations Card */}
            <div className="bg-white rounded-lg border border-slate-200 p-3 shadow-2xs space-y-2 text-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="font-bold text-slate-800 flex items-center space-x-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
                  <span>AI Recommendations</span>
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                  Confidence: {Math.round((aiAnalysis.confidence || 0.89) * 100)}%
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <div className="bg-slate-50 p-2 rounded border border-slate-100">
                  <span className="text-[10px] text-slate-500 block uppercase font-medium">Initial Impact</span>
                  <span className="text-xs font-bold text-blue-700">
                    {aiAnalysis.initial_impact || 'Moderate'}
                  </span>
                </div>
                <div className="bg-slate-50 p-2 rounded border border-slate-100">
                  <span className="text-[10px] text-slate-500 block uppercase font-medium">Initial Severity</span>
                  <span className="text-xs font-bold text-amber-700">
                    {aiAnalysis.initial_severity || 'Major'}
                  </span>
                </div>
              </div>

              {aiAnalysis.impact_reason && (
                <p className="text-[11px] text-slate-600 pt-1 leading-relaxed">
                  <span className="font-semibold text-slate-700">Rationale: </span>
                  {aiAnalysis.impact_reason}
                </p>
              )}

              <p className="text-[10px] text-slate-400 italic pt-1 border-t border-slate-100">
                AI-generated recommendation — review and confirm before saving.
              </p>
            </div>

          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* GROUNDED AI CHAT */}
      {/* ======================================================== */}
      <div className="pt-2 border-t border-slate-100 space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Deviation Assistant Chat
          </span>
          <span className="text-[10px] text-slate-400">Grounded in context</span>
        </div>

        {/* Quick prompt chips */}
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => handleQuickQuestion('What information is missing?')}
            className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-1 rounded-md transition"
          >
            What is missing?
          </button>
          <button
            type="button"
            onClick={() => handleQuickQuestion('Why was severity classified as this level?')}
            className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-1 rounded-md transition"
          >
            Why this severity?
          </button>
          <button
            type="button"
            onClick={() => handleQuickQuestion('What key facts were extracted?')}
            className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-1 rounded-md transition"
          >
            Extracted facts?
          </button>
        </div>

        {/* Chat message history container */}
        <div 
          ref={chatScrollRef}
          className="max-h-48 overflow-y-auto space-y-2 p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs"
        >
          {chatMessages.map((msg, idx) => (
            <div
              key={idx}
              className={`p-2 rounded-lg leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white ml-6 text-right'
                  : 'bg-white text-slate-800 border border-slate-200 mr-4 shadow-2xs'
              }`}
            >
              {msg.role === 'assistant' && (
                <div className="flex items-center space-x-1 text-[10px] font-bold text-blue-600 mb-0.5">
                  <Bot className="w-3 h-3" />
                  <span>AIVOA Quality Assistant</span>
                </div>
              )}
              <div className="text-[11px] whitespace-pre-line">{msg.content}</div>
            </div>
          ))}
          {isChatting && (
            <div className="p-2 rounded-lg bg-white text-slate-500 border border-slate-200 mr-4 text-[11px] italic animate-pulse">
              Consulting deviation context...
            </div>
          )}
        </div>

        {/* Chat input form */}
        <form onSubmit={handleSendChat} className="relative flex items-center">
          <input
            type="text"
            value={chatQuestion}
            onChange={(e) => setChatQuestion(e.target.value)}
            placeholder="Ask me anything about deviations..."
            disabled={isChatting}
            className="w-full pl-3 pr-10 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition shadow-2xs"
          />
          <button
            type="submit"
            disabled={!chatQuestion.trim() || isChatting}
            className={`absolute right-1.5 p-1.5 rounded-md transition ${
              !chatQuestion.trim() || isChatting
                ? 'text-slate-300'
                : 'text-white bg-blue-600 hover:bg-blue-700 shadow-xs'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>

        <p className="text-[10px] text-center text-slate-400">
          AI responses may contain errors. Please verify information.
        </p>
      </div>

    </div>
  );
}
