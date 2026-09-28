import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { resetForm, dismissSuccessModal } from '../store/deviationSlice';
import { deviationService } from '../services/api';
import Navbar from '../components/layout/Navbar';
import DeviationForm from '../components/deviation/DeviationForm';
import AiAssistant from '../components/deviation/AiAssistant';
import SuccessModal from '../components/deviation/SuccessModal';
import DeviationsListModal from '../components/deviation/DeviationsListModal';
import DeviationDetailModal from '../components/deviation/DeviationDetailModal';

export default function LogDeviationPage() {
  const dispatch = useDispatch();
  const { savedDeviation, saveSuccess } = useSelector((state) => state.deviation);

  const [isListModalOpen, setIsListModalOpen] = useState(false);
  const [selectedDeviation, setSelectedDeviation] = useState(null);
  const [deviationsCount, setDeviationsCount] = useState(0);

  // Fetch count of logged deviations for navbar badge
  const updateCount = async () => {
    try {
      const data = await deviationService.getDeviations();
      setDeviationsCount(data.length);
    } catch (err) {
      console.warn("Could not fetch deviation count", err);
    }
  };

  useEffect(() => {
    updateCount();
  }, [saveSuccess]);

  const handleSavedSuccess = (newDev) => {
    updateCount();
  };

  const handleViewSaved = () => {
    setSelectedDeviation(savedDeviation);
    dispatch(dismissSuccessModal());
  };

  const handleStartNew = () => {
    dispatch(resetForm());
  };

  const handleSelectFromList = (dev) => {
    setIsListModalOpen(false);
    setSelectedDeviation(dev);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      
      {/* Top Enterprise Navigation */}
      <Navbar 
        onOpenDeviationsList={() => setIsListModalOpen(true)}
        deviationsCount={deviationsCount}
      />

      {/* Main Workspace Container */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* Page Title & Status Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 mb-6 border-b border-slate-200 gap-4">
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                Log Deviation
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 shadow-2xs">
                Draft
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Record any unexpected event, out-of-specification result or non-conformance.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={() => setIsListModalOpen(true)}
              className="px-3.5 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition shadow-xs flex items-center space-x-1.5"
            >
              <span>View All Deviations</span>
              {deviationsCount > 0 && (
                <span className="bg-slate-200 text-slate-800 text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                  {deviationsCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Two-Column Grid: Form (65%) | AI Deviation Assistant (35%) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Column: Form (~65%) */}
          <div className="lg:col-span-7 xl:col-span-8">
            <DeviationForm onSavedSuccess={handleSavedSuccess} />
          </div>

          {/* Right Column: AI Assistant (~35%) */}
          <div className="lg:col-span-5 xl:col-span-4 sticky top-22">
            <AiAssistant />
          </div>

        </div>

      </main>

      {/* Modals & Dialogs */}
      {saveSuccess && savedDeviation && (
        <SuccessModal
          savedDeviation={savedDeviation}
          onViewDeviation={handleViewSaved}
          onStartNew={handleStartNew}
        />
      )}

      {isListModalOpen && (
        <DeviationsListModal
          isOpen={isListModalOpen}
          onClose={() => setIsListModalOpen(false)}
          onSelectDeviation={handleSelectFromList}
        />
      )}

      {selectedDeviation && (
        <DeviationDetailModal
          deviation={selectedDeviation}
          onClose={() => setSelectedDeviation(null)}
        />
      )}

    </div>
  );
}
