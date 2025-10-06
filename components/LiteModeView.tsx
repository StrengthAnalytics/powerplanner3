import React, { useState } from 'react';
import { AppState, LiftType } from '../types';
import Section from './Section';
import PlanTable from './PlanTable';
import IconButton from './IconButton';

interface LiteModeViewProps {
  appState: AppState;
  onBuildPlan: (name: string, thirds: Record<LiftType, string>) => void;
  onLifterNameChange: (name: string) => void;
  onResetPlan: () => void;
  onLaunchGameDay: () => void;
  onExportCSV: () => void;
  onSavePDF: (isMobile: boolean) => void;
  canShare: boolean;
  onSharePDF: (isMobile: boolean) => void;
}

const LiteModeView: React.FC<LiteModeViewProps> = ({ 
    appState, 
    onBuildPlan, 
    onLifterNameChange,
    onResetPlan,
    onLaunchGameDay,
    onExportCSV,
    onSavePDF,
    canShare,
    onSharePDF
}) => {
  const [thirds, setThirds] = useState<Record<LiftType, string>>({ squat: '', bench: '', deadlift: '' });
  
  // Determine if a plan exists in the main app state. This is more reliable than local state.
  const planExistsInState = !!(appState.lifts.squat.attempts['1'] || appState.lifts.bench.attempts['1'] || appState.lifts.deadlift.attempts['1']);

  const handleBuildClick = () => {
    onBuildPlan(appState.details.lifterName, thirds);
  };
  
  const handleResetClick = () => {
    setThirds({ squat: '', bench: '', deadlift: '' });
    onResetPlan();
  };
  
  const allInputsFilled = appState.details.lifterName && thirds.squat && thirds.bench && thirds.deadlift;

  const handleThirdChange = (lift: LiftType, value: string) => {
    setThirds(prev => ({
        ...prev,
        [lift]: value,
    }));
  };

  const renderInput = (label: string, lift: LiftType) => (
      <div className="flex flex-col">
          <label htmlFor={`lite-${lift}`} className="mb-1 text-sm font-medium text-slate-700 dark:text-slate-300 text-center">{label}</label>
          <input
              id={`lite-${lift}`}
              type="number"
              step="2.5"
              placeholder="kg"
              value={thirds[lift]}
              // Fix: Defined the missing 'handleThirdChange' function.
              onChange={e => handleThirdChange(lift, e.target.value)}
              className="w-full text-center p-2 border border-slate-300 rounded-md shadow-sm focus:border-slate-500 focus:ring-1 focus:ring-slate-500 bg-slate-50 text-slate-900 dark:bg-slate-700 dark:text-slate-50 dark:border-slate-600 dark:placeholder-slate-400"
          />
      </div>
  );

  if (planExistsInState) {
    return (
        <main className="flex-1 min-w-0">
            <div className="bg-white dark:bg-slate-700 p-6 rounded-lg shadow-md mb-8">
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Plan for:</p>
                        <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{appState.details.lifterName || 'Lifter'}</h3>
                    </div>
                    <IconButton onClick={handleResetClick} variant="secondary">
                        Start New Plan
                    </IconButton>
                </div>
                <PlanTable lifts={appState.lifts} />
            </div>

            <div className="bg-white dark:bg-slate-700 p-6 rounded-lg shadow-md mt-8">
                <h3 className="text-xl font-bold text-slate-700 dark:text-slate-200 mb-4 text-center">Export & Share Plan</h3>
                <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
                    <button onClick={onExportCSV} className="w-full sm:w-auto px-6 py-3 bg-green-700 hover:bg-green-800 text-white font-bold rounded-lg shadow-md transition-transform transform hover:scale-105">Export to CSV</button>
                    <button onClick={() => onSavePDF(false)} className="w-full sm:w-auto px-6 py-3 bg-red-700 hover:bg-red-800 text-white font-bold rounded-lg shadow-md transition-transform transform hover:scale-105">Export to PDF (Desktop)</button>
                    <button onClick={() => onSavePDF(true)} className="w-full sm:w-auto px-6 py-3 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-lg shadow-md transition-transform transform hover:scale-105">Export to PDF (Mobile)</button>
                    {canShare && (
                        <button onClick={() => onSharePDF(true)} className="w-full sm:w-auto px-6 py-3 bg-purple-700 hover:bg-purple-800 text-white font-bold rounded-lg shadow-md transition-transform transform hover:scale-105">Share PDF</button>
                    )}
                </div>
            </div>

            <div className="bg-indigo-700 text-white p-6 rounded-lg shadow-md mt-8">
              <h3 className="text-2xl font-bold mb-2">Ready for the Platform?</h3>
              <p className="text-indigo-200 mb-4">
                Switch to a simplified, high-contrast view for use during the competition.
              </p>
              <button
                onClick={onLaunchGameDay}
                className="px-8 py-4 bg-white hover:bg-indigo-50 text-indigo-700 font-bold rounded-lg shadow-lg transition-transform transform hover:scale-105 text-xl"
                aria-label="Enter Game Day Mode"
              >
                🚀 Launch Game Day Mode
              </button>
            </div>
        </main>
    );
  }

  return (
    <main className="flex-1 min-w-0">
        <Section title="Create a Quick Plan">
            <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                 <div className="flex flex-col">
                    <label htmlFor="lite-lifterName" className="mb-1 text-sm font-medium text-slate-700 dark:text-slate-300 text-center">Lifter Name</label>
                    <input
                        id="lite-lifterName"
                        type="text"
                        placeholder="e.g., Jane Smith"
                        value={appState.details.lifterName}
                        onChange={e => onLifterNameChange(e.target.value)}
                        className="w-full text-center p-2 border border-slate-300 rounded-md shadow-sm focus:border-slate-500 focus:ring-1 focus:ring-slate-500 bg-slate-50 text-slate-900 dark:bg-slate-700 dark:text-slate-50 dark:border-slate-600 dark:placeholder-slate-400"
                    />
                </div>
                {renderInput("Squat 3rd Attempt", 'squat')}
                {renderInput("Bench 3rd Attempt", 'bench')}
                {renderInput("Deadlift 3rd Attempt", 'deadlift')}
            </div>
        </Section>
        <div className="flex justify-center mt-8">
            <IconButton
                onClick={handleBuildClick}
                disabled={!allInputsFilled}
                className="!text-xl !py-4 !px-12"
            >
                Build My Plan
            </IconButton>
        </div>
    </main>
  );
};

export default LiteModeView;