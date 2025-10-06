import React, { useState, useMemo } from 'react';
import { LiftType, GameDayLiftState, AttemptStatus } from '../types';
import IconButton from './IconButton';

interface GameDayModeProps {
  gameDayState: Record<LiftType, GameDayLiftState>;
  onGameDayUpdate: (newState: Record<LiftType, GameDayLiftState>) => void;
  lifterName: string;
  onExit: () => void;
}

const EditAttemptModal: React.FC<{
    lift: string;
    attempt: '1'|'2'|'3';
    currentValue: string;
    onSave: (newValue: string) => void;
    onClose: () => void;
}> = ({ lift, attempt, currentValue, onSave, onClose }) => {
    const [value, setValue] = useState(currentValue);
    const attemptLabel = attempt === '1' ? 'Opener' : attempt === '2' ? 'Second' : 'Third';

    const handleSave = () => {
        if(value && parseFloat(value) > 0) {
            onSave(value);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[100] p-4">
            <div className="bg-slate-700 p-6 rounded-lg w-full max-w-xs text-white">
                <h3 className="text-xl font-bold mb-1 capitalize">{lift} - {attemptLabel}</h3>
                <p className="text-slate-400 mb-4">Update attempt weight:</p>
                <input
                    type="number"
                    step="2.5"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    className="w-full text-center p-3 border-2 border-slate-500 rounded-md shadow-sm bg-slate-800 text-white text-2xl font-bold focus:border-indigo-500 focus:ring-indigo-500"
                    autoFocus
                />
                <div className="flex justify-end gap-3 mt-6">
                    <button onClick={onClose} className="px-4 py-2 bg-slate-500 hover:bg-slate-600 font-semibold rounded-md transition-colors">Cancel</button>
                    <button onClick={handleSave} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 font-semibold rounded-md transition-colors">Save</button>
                </div>
            </div>
        </div>
    );
};


const GameDayMode: React.FC<GameDayModeProps> = ({ gameDayState, onGameDayUpdate, lifterName, onExit }) => {
  const [activeLift, setActiveLift] = useState<LiftType>('squat');
  const [editingAttempt, setEditingAttempt] = useState<{lift: LiftType, attempt: '1'|'2'|'3'} | null>(null);

  const currentTotal = useMemo(() => {
      let total = 0;
      (['squat', 'bench', 'deadlift'] as LiftType[]).forEach(lift => {
          const liftData = gameDayState[lift];
          let bestLift = 0;
          if (liftData.attempts.status['3'] === 'completed' && liftData.attempts['3']) {
              bestLift = parseFloat(liftData.attempts['3']);
          } else if (liftData.attempts.status['2'] === 'completed' && liftData.attempts['2']) {
              bestLift = parseFloat(liftData.attempts['2']);
          } else if (liftData.attempts.status['1'] === 'completed' && liftData.attempts['1']) {
              bestLift = parseFloat(liftData.attempts['1']);
          }
          if (!isNaN(bestLift)) {
              total += bestLift;
          }
      });
      return total;
  }, [gameDayState]);
  
  const handleAttemptValueChange = (lift: LiftType, attempt: '1' | '2' | '3', value: string) => {
    const newState = {
      ...gameDayState,
      [lift]: {
        ...gameDayState[lift],
        attempts: { ...gameDayState[lift].attempts, [attempt]: value },
      },
    };
    onGameDayUpdate(newState);
    setEditingAttempt(null);
  };


  const toggleWarmupCompletion = (lift: LiftType, index: number) => {
    const newState = { ...gameDayState };
    const newWarmups = [...newState[lift].warmups];
    newWarmups[index] = { ...newWarmups[index], completed: !newWarmups[index].completed };
    newState[lift] = { ...newState[lift], warmups: newWarmups };
    onGameDayUpdate(newState);
  };

  const setAttemptStatus = (lift: LiftType, attempt: '1' | '2' | '3', status: AttemptStatus) => {
    const newState = JSON.parse(JSON.stringify(gameDayState)); // Deep copy to avoid mutation issues
    const liftState = newState[lift];
    
    // Update status
    liftState.attempts.status[attempt] = status;

    // Auto-increment next attempt on success
    if (status === 'completed') {
        const successfulWeight = parseFloat(liftState.attempts[attempt]);
        if (!isNaN(successfulWeight)) {
            if (attempt === '1' && liftState.attempts['2']) {
                const secondAttemptWeight = parseFloat(liftState.attempts['2']);
                const minNextWeight = successfulWeight + 2.5;
                if (isNaN(secondAttemptWeight) || secondAttemptWeight < minNextWeight) {
                    liftState.attempts['2'] = String(minNextWeight);
                }
            } else if (attempt === '2' && liftState.attempts['3']) {
                const thirdAttemptWeight = parseFloat(liftState.attempts['3']);
                const minNextWeight = successfulWeight + 2.5;
                if (isNaN(thirdAttemptWeight) || thirdAttemptWeight < minNextWeight) {
                    liftState.attempts['3'] = String(minNextWeight);
                }
            }
        }
    }
    
    onGameDayUpdate(newState);
  };
  
  const currentLiftData = gameDayState[activeLift];
  const populatedWarmups = currentLiftData.warmups.filter(w => w.weight && w.reps);
  const populatedCues = currentLiftData.cues.filter(c => c.trim() !== '');

  const getStatusClasses = (status: AttemptStatus): string => {
      switch (status) {
          case 'completed': return 'bg-green-500/20 border-l-4 border-green-500';
          case 'missed': return 'bg-red-500/20 border-l-4 border-red-500';
          default: return 'bg-slate-800 border-l-4 border-slate-700';
      }
  };

  return (
    <div className="fixed inset-0 bg-slate-900 text-white font-sans flex flex-col z-50">
      
      {editingAttempt && (
        <EditAttemptModal
            lift={editingAttempt.lift}
            attempt={editingAttempt.attempt}
            currentValue={gameDayState[editingAttempt.lift].attempts[editingAttempt.attempt]}
            onSave={(newValue) => handleAttemptValueChange(editingAttempt.lift, editingAttempt.attempt, newValue)}
            onClose={() => setEditingAttempt(null)}
        />
      )}

      <header className="flex-shrink-0 p-4">
        <h1 className="text-2xl font-bold text-center capitalize">{lifterName || 'Game Day'}</h1>
        <p className="text-center text-slate-400 text-sm capitalize">{activeLift} Plan</p>
      </header>

      <nav className="flex-shrink-0 grid grid-cols-3 gap-2 mb-6 px-4">
        {(['squat', 'bench', 'deadlift'] as LiftType[]).map(lift => (
          <button
            key={lift}
            onClick={() => setActiveLift(lift)}
            className={`py-3 rounded-lg font-bold text-lg capitalize transition-colors ${
              activeLift === lift ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-700 text-slate-300'
            }`}
          >
            {lift}
          </button>
        ))}
      </nav>

      <main className="flex-1 space-y-8 overflow-y-auto px-4 pb-32">
        <section>
          <h2 className="text-xl font-bold text-slate-300 mb-3">Attempts</h2>
          <div className="space-y-3">
            {(['1', '2', '3'] as const).map(attemptNum => {
                const attemptValue = currentLiftData.attempts[attemptNum];
                const status = currentLiftData.attempts.status[attemptNum];
                if (!attemptValue) return null;
                return (
                    <div key={attemptNum} className={`flex items-center p-3 rounded-lg transition-all ${getStatusClasses(status)}`}>
                        <div className="flex-1 cursor-pointer" onClick={() => setEditingAttempt({lift: activeLift, attempt: attemptNum})}>
                            <span className="text-xl font-semibold text-slate-300">
                                {attemptNum === '1' ? 'Opener' : attemptNum === '2' ? 'Second' : 'Third'}
                            </span>
                            <div className="flex items-baseline gap-2">
                                <span className="text-4xl font-bold tracking-tighter text-white">{attemptValue}</span>
                                <span className="text-2xl font-semibold text-slate-400">kg</span>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => setAttemptStatus(activeLift, attemptNum, 'completed')} className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${status === 'completed' ? 'bg-green-500 text-white' : 'bg-slate-700 text-slate-400 hover:bg-green-600'}`} aria-label="Good Lift">✔️</button>
                            <button onClick={() => setAttemptStatus(activeLift, attemptNum, 'missed')} className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${status === 'missed' ? 'bg-red-500 text-white' : 'bg-slate-700 text-slate-400 hover:bg-red-600'}`} aria-label="Missed Lift">❌</button>
                             <button onClick={() => setAttemptStatus(activeLift, attemptNum, 'pending')} className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${status === 'pending' ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-400 hover:bg-indigo-600'}`} aria-label="Reset Status">↩️</button>
                        </div>
                    </div>
                );
            })}
          </div>
        </section>

        {populatedWarmups.length > 0 && (
            <section>
                <h2 className="text-xl font-bold text-slate-300 mb-3">Warm-ups</h2>
                <div className="space-y-2">
                {populatedWarmups.map((warmup, index) => (
                    <div 
                        key={index}
                        onClick={() => toggleWarmupCompletion(activeLift, index)}
                        className={`flex items-center gap-4 p-3 rounded-lg cursor-pointer transition-all ${warmup.completed ? 'bg-green-500/20' : 'bg-slate-800'}`}
                    >
                        <div className={`w-6 h-6 rounded-md flex items-center justify-center border-2 ${warmup.completed ? 'bg-green-500 border-green-400' : 'border-slate-600'}`}>
                             {warmup.completed && <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                        </div>
                        <span className={`text-2xl font-bold tracking-tighter ${warmup.completed ? 'text-slate-500 line-through' : 'text-white'}`}>
                            {warmup.weight} kg
                        </span>
                        <span className={`text-xl font-semibold ${warmup.completed ? 'text-slate-500 line-through' : 'text-slate-300'}`}>
                            x {warmup.reps}
                        </span>
                    </div>
                ))}
                </div>
            </section>
        )}
        
        {populatedCues.length > 0 && (
            <section>
                 <h2 className="text-xl font-bold text-slate-300 mb-3">Technical Cues</h2>
                 <ul className="space-y-2">
                    {populatedCues.map((cue, index) => (
                        <li key={index} className="text-lg text-slate-200 bg-slate-800 p-3 rounded-lg">
                            <span className="text-indigo-400 mr-2">•</span>{cue}
                        </li>
                    ))}
                 </ul>
            </section>
        )}
      </main>

      <footer className="fixed bottom-0 left-0 right-0 bg-slate-900/80 backdrop-blur-sm border-t border-slate-700 p-4 flex items-center justify-between">
        <div>
            <span className="text-sm font-semibold text-slate-400">Current Total</span>
            <p className="text-4xl font-bold text-white tracking-tight">{currentTotal > 0 ? `${currentTotal} kg` : '--'}</p>
        </div>
        <IconButton
          onClick={onExit}
          variant="danger"
          className="!py-3 !px-6"
        >
          Exit
        </IconButton>
      </footer>
    </div>
  );
};

export default GameDayMode;
