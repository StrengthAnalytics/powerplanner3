import React, { useState, useEffect, useCallback } from 'react';
import Section from './components/Section';
import LiftSection from './components/LiftSection';
import SaveLoadSection from './components/SaveLoadSection';
import BrandingSection from './components/BrandingSection';
import CollapsibleSection from './components/CollapsibleSection';
import Popover from './components/Popover';
import SummarySidebar from './components/SummarySidebar';
import MobileSummarySheet from './components/MobileSummarySheet';
import GameDayMode from './components/GameDayMode';
import SaveAsModal from './components/SaveAsModal';
import SettingsModal from './components/SettingsModal';
import SettingsMenu from './components/SettingsMenu';
import ToolsModal from './components/ToolsModal';
import ViewToggle from './components/ViewToggle';
import LiteModeView from './components/LiteModeView';
import { calculateAttempts, generateWarmups, calculateScore } from './utils/calculator';
import { exportToCSV, exportToPDF, exportToMobilePDF, savePdf, sharePdf } from './utils/exportHandler';
import type { AppState, LiftType, LiftState, CompetitionDetails, EquipmentSettings, BrandingState, WarmupStrategy, GameDayLiftState, LiftsState, Attempt } from './types';

const initialLiftsState: LiftsState = {
    squat: { attempts: { '1': '', '2': '', '3': '' }, warmups: Array(8).fill({ weight: '', reps: '' }), cues: ['', '', ''], error: false, includeCollars: false, warmupStrategy: 'default', dynamicWarmupSettings: { numSets: '6', startWeight: '20', finalWarmupPercent: '92' }, openerForWarmups: '' },
    bench: { attempts: { '1': '', '2': '', '3': '' }, warmups: Array(8).fill({ weight: '', reps: '' }), cues: ['', '', ''], error: false, includeCollars: false, warmupStrategy: 'default', dynamicWarmupSettings: { numSets: '6', startWeight: '20', finalWarmupPercent: '92' }, openerForWarmups: '' },
    deadlift: { attempts: { '1': '', '2': '', '3': '' }, warmups: Array(8).fill({ weight: '', reps: '' }), cues: ['', '', ''], error: false, includeCollars: false, warmupStrategy: 'default', dynamicWarmupSettings: { numSets: '6', startWeight: '20', finalWarmupPercent: '92' }, openerForWarmups: '' },
};

const deriveGameDayStateFromLifts = (lifts: LiftsState): Record<LiftType, GameDayLiftState> => {
    const gameDayState: Partial<Record<LiftType, GameDayLiftState>> = {};
    (Object.keys(lifts) as LiftType[]).forEach(lift => {
        gameDayState[lift] = {
            ...lifts[lift],
            attempts: {
                ...lifts[lift].attempts,
                status: { '1': 'pending', '2': 'pending', '3': 'pending' }
            },
            warmups: lifts[lift].warmups.map(w => ({ ...w, completed: false }))
        };
    });
    return gameDayState as Record<LiftType, GameDayLiftState>;
};

const initialAppState: AppState = {
  details: {
    eventName: '', lifterName: '', weightClass: '', competitionDate: '', weighInTime: '', bodyWeight: '', gender: '', scoringFormula: 'ipfgl',
  },
  equipment: {
    squatRackHeight: '', squatStands: '', benchRackHeight: '', handOut: '', benchSafetyHeight: '',
  },
  branding: {
    logo: '',
    primaryColor: '#111827', // slate-900
    secondaryColor: '#1e293b', // slate-800
  },
  lifts: initialLiftsState,
  gameDayState: deriveGameDayStateFromLifts(initialLiftsState),
};

const helpContent = {
    lifterName: {
        title: 'Lifter Name',
        content: <p>Enter the name of the lifter this plan is for. This name is the primary identifier and will be prominently displayed on all PDF and CSV exports.</p>
    },
    details: {
        title: 'Competition Details',
        content: (
            <>
                <p className="mb-2">Enter the main details for your competition here. This information will be displayed at the top of your exported PDF plan.</p>
                <ul className="list-disc list-inside text-slate-600 dark:text-slate-400 space-y-1">
                    <li><strong>Event Name:</strong> The name of the powerlifting meet.</li>
                    <li><strong>Weight Class:</strong> Your registered weight class (e.g., 83kg).</li>
                    <li><strong>Competition Date:</strong> Helps you keep track of your plans.</li>
                    <li><strong>Weigh-in Time:</strong> Important for your game-day schedule.</li>
                    <li><strong>Body Weight & Gender:</strong> Required to calculate your score based on the formula selected in the Tools menu (⚙️).</li>
                </ul>
            </>
        )
    },
    equipment: {
        title: 'Equipment Settings',
        content: (
            <p>Note your personal equipment settings here to have everything in one place on meet day. These settings will be listed on your PDF export for quick reference during warm-ups.</p>
        )
    },
    saveLoad: {
        title: 'Save & Load Plans',
        content: (
            <>
                <p className="mb-2">This section allows you to save, load, and delete your competition plans.</p>
                <ul className="list-disc list-inside text-slate-600 dark:text-slate-400 space-y-2">
                    <li><strong>Load Saved Plan:</strong> Select a plan from the dropdown to immediately load it into the editor. Select "-- New Plan --" to start fresh.</li>
                    <li><strong>Save Changes:</strong> This button is only active when you've made changes to a loaded plan (indicated by a <span className="text-amber-600 font-bold">*</span>). It updates the current plan.</li>
                    <li><strong>Save As...:</strong> Click this to save the current plan (whether new or existing) under a new name. A modal will ask you for a name.</li>
                    <li><strong>Delete Current Plan:</strong> This will delete the plan that is currently loaded in the editor.</li>
                </ul>
            </>
        )
    },
    branding: {
        title: 'Branding & Theming',
        content: (
             <p>Personalize your exported PDF plan. You can upload your own logo (team, gym, or personal) and choose primary and secondary colors for the PDF headers to match your brand. These settings are saved in your browser for future use.</p>
        )
    },
    lifts: {
        title: 'Lift Attempts & Cues',
        content: (
             <>
                <p className="mb-2">Plan your competition attempts for this lift:</p>
                <ul className="list-disc list-inside text-slate-600 dark:text-slate-400 space-y-2">
                    <li><strong>Enter an Attempt:</strong> Input either your planned <strong>Opener (1st)</strong> or your goal <strong>3rd Attempt</strong>.</li>
                    <li><strong>Calculate:</strong> Click to automatically fill in the other two attempts based on common progression strategies.</li>
                    <li><strong>Add Cues:</strong> A space for personal technical cues that will appear on your PDF.</li>
                </ul>
                <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">All warm-up settings and generation are handled in the "Warm-up Strategy" section below.</p>
            </>
        )
    },
    warmupStrategy: {
        title: 'Warm-up Strategy',
        content: (
            <>
                <p className="mb-2">Choose how your warm-up sets are generated based on your opener.</p>
                <ul className="list-disc list-inside text-slate-600 dark:text-slate-400 space-y-2">
                    <li><strong>Default (Recommended):</strong> Uses pre-defined warm-up tables based on years of coaching experience. This is a reliable and tested method suitable for most lifters.</li>
                    <li>
                        <strong>Dynamic:</strong> Provides full control over your warm-up progression. This is great for advanced lifters or coaches who want to tailor the warm-up to specific needs.
                        <ul className="list-['-_'] list-inside ml-4 mt-1 text-sm space-y-1">
                            <li><strong># of Sets:</strong> The total number of warm-up sets you want to perform.</li>
                            <li><strong>Start Weight:</strong> The weight for your very first warm-up set (usually the empty bar, 20kg).</li>
                            <li><strong>Final WU % of Opener:</strong> Sets your last and heaviest warm-up relative to your opening attempt. A common value is 90-95%.</li>
                        </ul>
                    </li>
                </ul>
            </>
        )
    }
};

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(initialAppState);
  const [viewMode, setViewMode] = useState<'pro' | 'lite'>('pro');
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [canShare, setCanShare] = useState(false);
  const [savedPlans, setSavedPlans] = useState<Record<string, AppState>>({});
  const [currentPlanName, setCurrentPlanName] = useState('');
  const [isDirty, setIsDirty] = useState(false);
  const [isSaveAsModalOpen, setIsSaveAsModalOpen] = useState(false);
  const [isBrandingModalOpen, setIsBrandingModalOpen] = useState(false);
  const [isToolsModalOpen, setIsToolsModalOpen] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [popoverState, setPopoverState] = useState<{ isOpen: boolean; title: string; content: React.ReactNode }>({ isOpen: false, title: '', content: null });
  const [isSummarySheetOpen, setIsSummarySheetOpen] = useState(false);
  const [isGameDayModeActive, setIsGameDayModeActive] = useState(false);
  const [activeLiftTab, setActiveLiftTab] = useState<LiftType>('squat');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem('plp_theme') as 'light' | 'dark' | null;
      if (savedTheme) {
        setTheme(savedTheme);
      }

      const savedDetails = localStorage.getItem('plp_details');
      const savedEquipment = localStorage.getItem('plp_equipment');
      const savedBranding = localStorage.getItem('plp_branding');
      const allPlans = localStorage.getItem('plp_allPlans');
      
      const details = savedDetails ? JSON.parse(savedDetails) : initialAppState.details;
      const equipment = savedEquipment ? JSON.parse(savedEquipment) : initialAppState.equipment;
      const branding = savedBranding ? JSON.parse(savedBranding) : initialAppState.branding;

      setAppState(prev => ({ ...prev, details, equipment, branding }));
      if (allPlans) {
        setSavedPlans(JSON.parse(allPlans));
      }

      if ('share' in navigator) {
        setCanShare(true);
      }

    } catch (error) {
      console.error("Failed to load state from localStorage", error);
    }
  }, []);
  
  // Persist details and equipment changes to localStorage when they change
  useEffect(() => {
    try {
        localStorage.setItem('plp_details', JSON.stringify(appState.details));
        localStorage.setItem('plp_equipment', JSON.stringify(appState.equipment));
    } catch (error) {
        console.error("Failed to save state to localStorage", error);
    }
  }, [appState.details, appState.equipment]);

  // Handle dark mode
  useEffect(() => {
      if (theme === 'dark') {
          document.documentElement.classList.add('dark');
      } else {
          document.documentElement.classList.remove('dark');
      }
      localStorage.setItem('plp_theme', theme);
  }, [theme]);

  const handleToggleTheme = () => {
      setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const showFeedback = (message: string) => {
    setFeedbackMessage(message);
    setTimeout(() => setFeedbackMessage(''), 3000);
  };
  
  const showPopover = (title: string, content: React.ReactNode) => {
    setPopoverState({ isOpen: true, title, content });
  };
  
  const hidePopover = () => {
    setPopoverState({ isOpen: false, title: '', content: null });
  };

  const handleSelectAndLoadPlan = (name: string) => {
    if (name === '') { // Selected "-- New Plan --"
        setAppState(prev => ({ ...initialAppState, branding: prev.branding })); // Keep branding settings
        setCurrentPlanName('');
        setIsDirty(false);
        showFeedback('New plan started.');
        return;
    }

    const planToLoad = savedPlans[name];
    if (planToLoad) {
      const newGameDayState = deriveGameDayStateFromLifts(planToLoad.lifts);
      setAppState({ ...planToLoad, gameDayState: newGameDayState });
      setCurrentPlanName(name);
      setIsDirty(false);
      showFeedback(`Plan "${name}" loaded.`);
    }
  };

  const handleUpdatePlan = () => {
    if (!currentPlanName) {
        showFeedback('Cannot update an unsaved plan. Use "Save As..." instead.');
        return;
    }
    const newSavedPlans = { ...savedPlans, [currentPlanName]: appState };
    setSavedPlans(newSavedPlans);
    localStorage.setItem('plp_allPlans', JSON.stringify(newSavedPlans));
    setIsDirty(false);
    showFeedback(`Plan "${currentPlanName}" updated successfully!`);
  };

  const handleSaveAs = (newName: string) => {
      const newSavedPlans = { ...savedPlans, [newName]: appState };
      setSavedPlans(newSavedPlans);
      localStorage.setItem('plp_allPlans', JSON.stringify(newSavedPlans));
      
      setCurrentPlanName(newName); // The newly saved plan is now the active one.
      setIsDirty(false);
      setIsSaveAsModalOpen(false);
      showFeedback(`Plan saved as "${newName}".`);
  };

  const handleDeletePlan = (name: string) => {
    if (!name || !savedPlans[name]) {
        showFeedback('No plan selected to delete.');
        return;
    }
    const newSavedPlans = { ...savedPlans };
    delete newSavedPlans[name];
    setSavedPlans(newSavedPlans);
    localStorage.setItem('plp_allPlans', JSON.stringify(newSavedPlans));
    
    // If the deleted plan was the one being edited, reset the form.
    if (name === currentPlanName) {
        setAppState(prev => ({ ...initialAppState, branding: prev.branding }));
        setCurrentPlanName('');
        setIsDirty(false);
    }
    
    showFeedback(`Plan "${name}" deleted.`);
  };


  const handleDetailChange = (field: keyof CompetitionDetails, value: string) => {
    setAppState(prev => ({
      ...prev,
      details: { ...prev.details, [field]: value },
    }));
    setIsDirty(true);
  };
  
  const handleEquipmentChange = (field: keyof EquipmentSettings, value: string) => {
    setAppState(prev => ({
        ...prev,
        equipment: { ...prev.equipment, [field]: value },
    }));
    setIsDirty(true);
  };
  
  const handleBrandingChange = (field: keyof BrandingState, value: string) => {
    setAppState(prev => ({
        ...prev,
        branding: { ...prev.branding, [field]: value },
    }));
  };

  const handleSaveBranding = () => {
    try {
        localStorage.setItem('plp_branding', JSON.stringify(appState.branding));
        showFeedback('Branding settings saved!');
    } catch (error) {
        console.error("Failed to save branding to localStorage", error);
        showFeedback('Error saving settings.');
    }
  };

  const handleResetBranding = () => {
      setAppState(prev => ({ ...prev, branding: initialAppState.branding }));
      localStorage.removeItem('plp_branding');
      showFeedback('Branding reset to defaults.');
  };
  
  const resetGameDayForLift = (prev: AppState, lift: LiftType, updatedLiftState: LiftState): AppState => {
    const newGameDayLiftState: GameDayLiftState = {
        ...updatedLiftState,
        attempts: {
            ...updatedLiftState.attempts,
            status: { '1': 'pending', '2': 'pending', '3': 'pending' }
        },
        warmups: updatedLiftState.warmups.map(w => ({ ...w, completed: false }))
    };

    return {
        ...prev,
        lifts: {
            ...prev.lifts,
            [lift]: updatedLiftState
        },
        gameDayState: {
            ...prev.gameDayState,
            [lift]: newGameDayLiftState
        }
    };
  };

  const handleAttemptChange = (lift: LiftType, attempt: '1' | '2' | '3', value: string) => {
    setAppState(prev => {
        const updatedLiftState = {
            ...prev.lifts[lift],
            attempts: { ...prev.lifts[lift].attempts, [attempt]: value },
            error: false,
        };
        // Resetting game day state because the plan has changed.
        return resetGameDayForLift(prev, lift, updatedLiftState);
    });
    setIsDirty(true);
  };
  
  const handleWarmupChange = (lift: LiftType, index: number, field: 'weight' | 'reps', value: string) => {
    setAppState(prev => {
        const newLiftsWarmups = [...prev.lifts[lift].warmups];
        newLiftsWarmups[index] = {...newLiftsWarmups[index], [field]: value};
        
        const newGameDayWarmups = [...prev.gameDayState[lift].warmups];
        newGameDayWarmups[index] = {...newGameDayWarmups[index], [field]: value};

        return {
            ...prev,
            lifts: {
                ...prev.lifts,
                [lift]: {
                    ...prev.lifts[lift],
                    warmups: newLiftsWarmups
                }
            },
            gameDayState: {
              ...prev.gameDayState,
              [lift]: {
                ...prev.gameDayState[lift],
                warmups: newGameDayWarmups
              }
            }
        };
    });
    setIsDirty(true);
  };

  const handleCueChange = (lift: LiftType, index: number, value: string) => {
    setAppState(prev => {
        const newCues = [...prev.lifts[lift].cues];
        newCues[index] = value;
        return {
            ...prev,
            lifts: {
                ...prev.lifts,
                [lift]: {
                    ...prev.lifts[lift],
                    cues: newCues
                }
            },
            gameDayState: {
                ...prev.gameDayState,
                [lift]: {
                    ...prev.gameDayState[lift],
                    cues: newCues
                }
            }
        };
    });
    setIsDirty(true);
  };

  const handleCollarToggle = (lift: LiftType) => {
    setAppState(prev => ({
        ...prev,
        lifts: {
            ...prev.lifts,
            [lift]: {
                ...prev.lifts[lift],
                includeCollars: !prev.lifts[lift].includeCollars,
            }
        },
        gameDayState: {
            ...prev.gameDayState,
            [lift]: {
                ...prev.gameDayState[lift],
                includeCollars: !prev.gameDayState[lift].includeCollars,
            }
        }
    }));
    setIsDirty(true);
};

  const handleWarmupStrategyChange = (lift: LiftType, strategy: WarmupStrategy) => {
    setAppState(prev => ({
      ...prev,
      lifts: {
        ...prev.lifts,
        [lift]: { ...prev.lifts[lift], warmupStrategy: strategy },
      },
    }));
    setIsDirty(true);
  };

  const handleDynamicWarmupSettingsChange = (lift: LiftType, field: keyof AppState['lifts'][LiftType]['dynamicWarmupSettings'], value: string) => {
    setAppState(prev => ({
      ...prev,
      lifts: {
        ...prev.lifts,
        [lift]: {
          ...prev.lifts[lift],
          dynamicWarmupSettings: {
            ...prev.lifts[lift].dynamicWarmupSettings,
            [field]: value,
          },
        },
      },
    }));
    setIsDirty(true);
  };

  const handleCalculateAttempts = useCallback((lift: LiftType) => {
    setAppState(prev => {
      const currentAttempts = prev.lifts[lift].attempts;
      const newAttempts = calculateAttempts(lift, currentAttempts);
      if (newAttempts) {
        const updatedLiftState = { ...prev.lifts[lift], attempts: newAttempts, error: false };
        return resetGameDayForLift(prev, lift, updatedLiftState);
      }
      return { ...prev, lifts: { ...prev.lifts, [lift]: { ...prev.lifts[lift], error: true } } };
    });
    setIsDirty(true);
  }, []);

  const handleGenerateWarmups = useCallback((lift: LiftType) => {
    setAppState(prev => {
      const { attempts, warmupStrategy, dynamicWarmupSettings } = prev.lifts[lift];
      const opener = attempts['1'];
      if (!opener) {
        return { ...prev, lifts: { ...prev.lifts, [lift]: { ...prev.lifts[lift], error: true } } };
      }
      const newWarmups = generateWarmups(lift, opener, warmupStrategy, dynamicWarmupSettings);
      if (newWarmups) {
        const updatedLiftState = { ...prev.lifts[lift], warmups: newWarmups, error: false, openerForWarmups: opener };
        return resetGameDayForLift(prev, lift, updatedLiftState);
      }
      return prev;
    });
    setIsDirty(true);
  }, []);

  const handleReset = useCallback((lift: LiftType) => {
    setAppState(prev => {
        const initialLiftState = initialAppState.lifts[lift];
        // also reset game day state for this lift
        const newGameDayLiftState: GameDayLiftState = {
            ...initialLiftState,
            attempts: {
                ...initialLiftState.attempts,
                status: { '1': 'pending', '2': 'pending', '3': 'pending' }
            },
            warmups: initialLiftState.warmups.map(w => ({...w, completed: false}))
        };

        return {
            ...prev,
            lifts: {
                ...prev.lifts,
                [lift]: initialLiftState
            },
            gameDayState: {
                ...prev.gameDayState,
                [lift]: newGameDayLiftState
            }
        };
    });
    setIsDirty(true);
  }, []);
  

  const handleFullReset = useCallback(() => {
    const plans = localStorage.getItem('plp_allPlans');
    localStorage.clear();
    if(plans) localStorage.setItem('plp_allPlans', plans);
    
    setAppState(prev => ({...initialAppState, branding: prev.branding })); // Keep branding settings on full reset
    setCurrentPlanName('');
    setIsDirty(false);
    setIsResetModalOpen(false);
  }, []);

  const handleGameDayUpdate = (newGameDayState: Record<LiftType, GameDayLiftState>) => {
    setAppState(prev => ({
        ...prev,
        gameDayState: newGameDayState,
    }));
  };

  const handleSavePdf = (isMobile: boolean) => {
    const blob = isMobile ? exportToMobilePDF(appState) : exportToPDF(appState);
    const fileName = `${appState.details.lifterName || 'Lifter'}_Competition_Plan${isMobile ? '_Mobile' : ''}.pdf`;
    savePdf(blob, fileName);
  };

  const handleSharePdf = (isMobile: boolean) => {
    const blob = isMobile ? exportToMobilePDF(appState) : exportToPDF(appState);
    const fileName = `${appState.details.lifterName || 'Lifter'}_Competition_Plan${isMobile ? '_Mobile' : ''}.pdf`;
    sharePdf(blob, fileName, appState.details);
  };

  const handleBuildLitePlan = (name: string, thirds: Record<LiftType, string>) => {
    let newLiftsState: LiftsState = JSON.parse(JSON.stringify(initialLiftsState));

    // Set lifter name in the main state
    handleDetailChange('lifterName', name);

    (['squat', 'bench', 'deadlift'] as LiftType[]).forEach(lift => {
        const third = thirds[lift];
        if (third && !isNaN(parseFloat(third))) {
            const attemptsFromThird: Attempt = { '1': '', '2': '', '3': third };
            const calculatedAttempts = calculateAttempts(lift, attemptsFromThird);

            if (calculatedAttempts && calculatedAttempts['1']) {
                const opener = calculatedAttempts['1'];
                const { warmupStrategy, dynamicWarmupSettings } = initialLiftsState[lift];
                const generatedWarmups = generateWarmups(lift, opener, warmupStrategy, dynamicWarmupSettings);

                newLiftsState[lift] = {
                    ...initialLiftsState[lift],
                    attempts: calculatedAttempts,
                    warmups: generatedWarmups || initialLiftsState[lift].warmups,
                    openerForWarmups: opener,
                };
            }
        }
    });
    
    const newGameDayState = deriveGameDayStateFromLifts(newLiftsState);
    setAppState(prev => ({
        ...prev,
        details: { ...prev.details, lifterName: name },
        lifts: newLiftsState,
        gameDayState: newGameDayState,
    }));
  };

  const handleResetLitePlan = () => {
    setAppState(prev => ({
        ...prev,
        details: { ...prev.details, lifterName: '' },
        lifts: initialLiftsState,
        gameDayState: deriveGameDayStateFromLifts(initialLiftsState),
    }));
  };


  const renderFormGroup = (label: string, id: keyof CompetitionDetails | keyof EquipmentSettings, placeholder: string, type: string = "text") => {
    const value = id in appState.details ? appState.details[id as keyof CompetitionDetails] : appState.equipment[id as keyof EquipmentSettings];
    
    return (
        <div className="flex flex-col">
            <label htmlFor={id} className="mb-1 text-sm font-medium text-slate-700 dark:text-slate-300 text-center">{label}</label>
            <input
                id={id}
                type={type}
                placeholder={placeholder}
                value={value as string}
                onChange={e => {
                  if (id in appState.details) {
                    handleDetailChange(id as keyof CompetitionDetails, e.target.value);
                  } else {
                    handleEquipmentChange(id as keyof EquipmentSettings, e.target.value);
                  }
                }}
                className="w-full text-center p-2 border border-slate-300 rounded-md shadow-sm focus:border-slate-500 focus:ring-1 focus:ring-slate-500 bg-slate-50 text-slate-900 dark:bg-slate-700 dark:text-slate-50 dark:border-slate-600 dark:placeholder-slate-400"
            />
        </div>
    );
  };
  
    const renderSelectGroup = (label: string, id: keyof EquipmentSettings, options: string[]) => {
      return (
        <div className="flex flex-col">
          <label htmlFor={id} className="mb-1 text-sm font-medium text-slate-700 dark:text-slate-300 text-center">{label}</label>
          <select
            id={id}
            value={appState.equipment[id]}
            onChange={e => handleEquipmentChange(id, e.target.value)}
            className="w-full text-center p-2 border border-slate-300 rounded-md shadow-sm focus:border-slate-500 focus:ring-1 focus:ring-slate-500 bg-slate-50 text-slate-900 dark:bg-slate-700 dark:text-slate-50 dark:border-slate-600"
          >
            <option value="">Select option</option>
            {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        </div>
      );
    };

    const { details, lifts } = appState;
    const s3 = parseFloat(lifts.squat.attempts['3']);
    const b3 = parseFloat(lifts.bench.attempts['3']);
    const d3 = parseFloat(lifts.deadlift.attempts['3']);
    const bw = parseFloat(details.bodyWeight);
    const gender = details.gender;

    const predictedTotal = (isNaN(s3) ? 0 : s3) + (isNaN(b3) ? 0 : b3) + (isNaN(d3) ? 0 : d3);
    const score = calculateScore(predictedTotal, bw, gender, details.scoringFormula);
    
    const isAttemptValid = (value: string) => !isNaN(parseFloat(value)) && parseFloat(value) > 0;
    
    const allNineAttemptsFilled =
        isAttemptValid(lifts.squat.attempts['1']) && isAttemptValid(lifts.squat.attempts['2']) && isAttemptValid(lifts.squat.attempts['3']) &&
        isAttemptValid(lifts.bench.attempts['1']) && isAttemptValid(lifts.bench.attempts['2']) && isAttemptValid(lifts.bench.attempts['3']) &&
        isAttemptValid(lifts.deadlift.attempts['1']) && isAttemptValid(lifts.deadlift.attempts['2']) && isAttemptValid(lifts.deadlift.attempts['3']);

    const checkLiftCompletion = (liftState: LiftState): boolean => {
        const attemptsComplete = 
            isAttemptValid(liftState.attempts['1']) &&
            isAttemptValid(liftState.attempts['2']) &&
            isAttemptValid(liftState.attempts['3']);
        
        const warmupsStarted = liftState.warmups.some(w => isAttemptValid(w.weight));

        return attemptsComplete && warmupsStarted;
    };

    const liftCompletionStatus = {
        squat: checkLiftCompletion(appState.lifts.squat),
        bench: checkLiftCompletion(appState.lifts.bench),
        deadlift: checkLiftCompletion(appState.lifts.deadlift),
    };

    const renderMobileScore = () => {
        if (predictedTotal <= 0) {
            return '--';
        }
        if (isNaN(bw) || bw <= 0) {
            return <span className="text-base text-yellow-400">Enter BW</span>;
        }
        if (!gender) {
            return <span className="text-base text-yellow-400">Select Gender</span>;
        }
        return score.toFixed(2);
    };


  if (isGameDayModeActive) {
    return <GameDayMode 
        gameDayState={appState.gameDayState}
        onGameDayUpdate={handleGameDayUpdate}
        lifterName={appState.details.lifterName}
        onExit={() => setIsGameDayModeActive(false)} 
    />;
  }

  return (
    <div className="font-sans">
      <header className="bg-slate-900 text-white p-6 rounded-lg shadow-xl mb-8 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-center text-center sm:text-left">
            <div className='flex-1'>
                <h1 className="text-3xl font-extrabold tracking-tight">POWERLIFTING MEET PLANNER</h1>
                <p className="text-slate-300 mt-1">Strategise Your Game Day Performance</p>
            </div>
             <div className="flex items-center gap-4 mt-4 sm:mt-0">
                <ViewToggle mode={viewMode} onToggle={setViewMode} />
                <SettingsMenu 
                    onBrandingClick={() => setIsBrandingModalOpen(true)}
                    onToolsClick={() => setIsToolsModalOpen(true)}
                    onToggleDarkMode={handleToggleTheme}
                    isDarkMode={theme === 'dark'}
                />
            </div>
        </div>
      </header>
      
      <Popover 
        isOpen={popoverState.isOpen}
        title={popoverState.title}
        onClose={hidePopover}
      >
        {popoverState.content}
      </Popover>

      <SettingsModal
        isOpen={isBrandingModalOpen}
        onClose={() => setIsBrandingModalOpen(false)}
        title="PDF Branding & Theming"
      >
        <BrandingSection
            branding={appState.branding}
            onBrandingChange={handleBrandingChange}
            onSave={() => {
                handleSaveBranding();
                setIsBrandingModalOpen(false);
            }}
            onReset={handleResetBranding}
        />
      </SettingsModal>

      <ToolsModal
        isOpen={isToolsModalOpen}
        onClose={() => setIsToolsModalOpen(false)}
        scoringFormula={appState.details.scoringFormula}
        onScoringFormulaChange={(value) => handleDetailChange('scoringFormula', value)}
      />
      
      {isSaveAsModalOpen && (
        <SaveAsModal
            isOpen={isSaveAsModalOpen}
            onClose={() => setIsSaveAsModalOpen(false)}
            onSave={handleSaveAs}
            existingPlanNames={Object.keys(savedPlans)}
        />
      )}

      <div className="flex flex-col xl:flex-row gap-8 max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 pb-24 xl:pb-8">
        {viewMode === 'pro' ? (
        <>
            <main className="flex-1 min-w-0">
              <>
                <CollapsibleSection 
                    title="Save & Load Plans"
                    onHelpClick={() => showPopover(helpContent.saveLoad.title, helpContent.saveLoad.content)}
                >
                    <SaveLoadSection
                        currentPlanName={currentPlanName}
                        isDirty={isDirty}
                        savedPlans={savedPlans}
                        feedbackMessage={feedbackMessage}
                        onSelectAndLoadPlan={handleSelectAndLoadPlan}
                        onUpdatePlan={handleUpdatePlan}
                        onOpenSaveAsModal={() => setIsSaveAsModalOpen(true)}
                        onDeletePlan={handleDeletePlan}
                    />
                </CollapsibleSection>

                <Section
                    title="Lifter Name"
                    onHelpClick={() => showPopover(helpContent.lifterName.title, helpContent.lifterName.content)}
                    headerAction={
                        <button
                        onClick={() => setIsResetModalOpen(true)}
                        className="px-3 py-1 text-sm bg-red-600 hover:bg-red-700 text-white font-semibold rounded-md shadow-sm transition-colors"
                        aria-label="Clear the entire form"
                        >
                        Clear Form
                        </button>
                    }
                >
                    {renderFormGroup("Lifter Name", "lifterName", "e.g., John Doe", "text")}
                </Section>
                
                <CollapsibleSection 
                  title="Competition Details"
                  onHelpClick={() => showPopover(helpContent.details.title, helpContent.details.content)}
                >
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {renderFormGroup("Event Name", "eventName", "e.g., National Championships")}
                        {renderFormGroup("Weight Class", "weightClass", "e.g., 83kg")}
                        {renderFormGroup("Competition Date", "competitionDate", "YYYY-MM-DD", "date")}
                        {renderFormGroup("Weigh-in Time", "weighInTime", "HH:MM", "time")}
                        {renderFormGroup("Weigh-in Body Weight (kg)", "bodyWeight", "e.g., 82.5", "number")}
                        <div className="flex flex-col">
                            <label htmlFor="gender" className="mb-1 text-sm font-medium text-slate-700 dark:text-slate-300 text-center">Gender</label>
                            <select
                                id="gender"
                                value={appState.details.gender}
                                onChange={e => handleDetailChange('gender', e.target.value as 'male' | 'female' | '')}
                                className="w-full text-center p-2 border border-slate-300 rounded-md shadow-sm focus:border-slate-500 focus:ring-1 focus:ring-slate-500 bg-slate-50 text-slate-900 dark:bg-slate-700 dark:text-slate-50 dark:border-slate-600"
                            >
                                <option value="">Select Gender</option>
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                            </select>
                        </div>
                    </div>
                </CollapsibleSection>

                <CollapsibleSection 
                  title="Equipment Settings"
                  onHelpClick={() => showPopover(helpContent.equipment.title, helpContent.equipment.content)}
                >
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {renderFormGroup("Squat Rack Height", "squatRackHeight", "e.g., 12")}
                        {renderSelectGroup("Squat Stands", "squatStands", ["In", "Out"])}
                        {renderFormGroup("Bench Rack Height", "benchRackHeight", "e.g., 8")}
                        {renderSelectGroup("Hand Out", "handOut", ["Self", "Yes"])}
                        {renderFormGroup("Bench Safety Height", "benchSafetyHeight", "e.g., 4")}
                    </div>
                </CollapsibleSection>

                <div className="rounded-lg shadow-md mb-8">
                  {/* Tab Navigation */}
                  <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-t-lg gap-1">
                    {(['squat', 'bench', 'deadlift'] as LiftType[]).map(lift => (
                      <button
                        key={lift}
                        onClick={() => setActiveLiftTab(lift)}
                        className={`flex-1 py-3 px-2 text-center font-semibold text-base capitalize transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 dark:focus-visible:ring-indigo-400 rounded-md flex items-center justify-center gap-2 ${
                          activeLiftTab === lift
                            ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm'
                            : 'bg-transparent text-slate-600 dark:text-slate-400 hover:bg-white/60 dark:hover:bg-slate-700/60'
                        }`}
                      >
                        <span>{lift}</span>
                        {liftCompletionStatus[lift] && (
                            <span className="w-2.5 h-2.5 bg-green-500 rounded-full" title={`${lift} plan complete`}></span>
                        )}
                      </button>
                    ))}
                  </div>

                  {/* Tab Content */}
                  <LiftSection
                    key={activeLiftTab}
                    containerClassName="p-6 bg-white dark:bg-slate-700 rounded-b-lg animate-fadeIn"
                    liftType={activeLiftTab}
                    liftState={appState.lifts[activeLiftTab]}
                    onAttemptChange={handleAttemptChange}
                    onWarmupChange={handleWarmupChange}
                    onCueChange={handleCueChange}
                    onCalculateAttempts={handleCalculateAttempts}
                    onGenerateWarmups={handleGenerateWarmups}
                    onReset={handleReset}
                    onCollarToggle={handleCollarToggle}
                    onHelpClick={() => showPopover(helpContent.lifts.title, helpContent.lifts.content)}
                    onWarmupStrategyChange={handleWarmupStrategyChange}
                    onDynamicWarmupSettingsChange={handleDynamicWarmupSettingsChange}
                    onWarmupHelpClick={() => showPopover(helpContent.warmupStrategy.title, helpContent.warmupStrategy.content)}
                  />
                </div>
                
                <div>
                     <div className="bg-white dark:bg-slate-700 p-6 rounded-lg shadow-md mt-8">
                        <h3 className="text-xl font-bold text-slate-700 dark:text-slate-200 mb-4 text-center">Export & Share Plan</h3>
                        <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
                            <button onClick={() => exportToCSV(appState)} className="w-full sm:w-auto px-6 py-3 bg-green-700 hover:bg-green-800 text-white font-bold rounded-lg shadow-md transition-transform transform hover:scale-105">Export to CSV</button>
                            <button onClick={() => handleSavePdf(false)} className="w-full sm:w-auto px-6 py-3 bg-red-700 hover:bg-red-800 text-white font-bold rounded-lg shadow-md transition-transform transform hover:scale-105">Export to PDF (Desktop)</button>
                            <button onClick={() => handleSavePdf(true)} className="w-full sm:w-auto px-6 py-3 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-lg shadow-md transition-transform transform hover:scale-105">Export to PDF (Mobile)</button>
                            {canShare && (
                                <button onClick={() => handleSharePdf(true)} className="w-full sm:w-auto px-6 py-3 bg-purple-700 hover:bg-purple-800 text-white font-bold rounded-lg shadow-md transition-transform transform hover:scale-105">Share PDF</button>
                            )}
                        </div>
                    </div>

                    <div className="bg-indigo-700 text-white p-6 rounded-lg shadow-md mt-8">
                      <h3 className="text-2xl font-bold mb-2">Ready for the Platform?</h3>
                      <p className="text-indigo-200 mb-4">
                        Switch to a simplified, high-contrast view for use during the competition.
                      </p>
                      <button
                        onClick={() => setIsGameDayModeActive(true)}
                        className="px-8 py-4 bg-white hover:bg-indigo-50 text-indigo-700 font-bold rounded-lg shadow-lg transition-transform transform hover:scale-105 text-xl"
                        aria-label="Enter Game Day Mode"
                      >
                        🚀 Launch Game Day Mode
                      </button>
                    </div>
                </div>
              </>
            </main>
            
            <aside className="hidden xl:block w-full xl:w-96 xl:sticky xl:top-8 self-start">
                <SummarySidebar 
                    lifterName={details.lifterName}
                    total={predictedTotal}
                    score={score}
                    lifts={lifts}
                    bodyWeight={details.bodyWeight}
                    gender={details.gender}
                    allAttemptsFilled={allNineAttemptsFilled}
                    scoringFormula={details.scoringFormula}
                />
            </aside>
        </>
        ) : (
            <LiteModeView
                appState={appState}
                onBuildPlan={handleBuildLitePlan}
                onLifterNameChange={(name) => handleDetailChange('lifterName', name)}
                onResetPlan={handleResetLitePlan}
                onLaunchGameDay={() => setIsGameDayModeActive(true)}
                onExportCSV={() => exportToCSV(appState)}
                onSavePDF={handleSavePdf}
                canShare={canShare}
                onSharePDF={handleSharePdf}
            />
        )}
      </div>

      {viewMode === 'pro' && (
        <div className="block xl:hidden">
            <button 
                onClick={() => setIsSummarySheetOpen(true)}
                className="fixed bottom-0 left-0 right-0 w-full h-16 bg-slate-900/80 backdrop-blur-sm text-white p-2 shadow-lg flex justify-between items-center z-30"
                aria-label="Open plan summary"
            >
                <div className="flex-1 text-center">
                    <p className="text-xs font-medium text-slate-300">Total</p>
                    <p className={`text-xl font-bold tracking-tight ${predictedTotal > 0 && !allNineAttemptsFilled ? 'text-yellow-400' : ''}`}>
                        {predictedTotal > 0 ? `${predictedTotal} kg` : '--'}
                    </p>
                </div>
                <div className="border-l border-slate-600 h-3/5"></div>
                <div className="flex-1 text-center">
                    <p className="text-xs font-medium text-slate-300">Score</p>
                    <p className="text-xl font-bold tracking-tight">{renderMobileScore()}</p>
                </div>
                <div className="px-4 text-slate-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                    </svg>
                </div>
            </button>
            
            <MobileSummarySheet 
                isOpen={isSummarySheetOpen}
                onClose={() => setIsSummarySheetOpen(false)}
                lifterName={details.lifterName}
                total={predictedTotal}
                score={score}
                lifts={lifts}
                bodyWeight={details.bodyWeight}
                gender={details.gender}
                allAttemptsFilled={allNineAttemptsFilled}
                scoringFormula={details.scoringFormula}
            />
      </div>
      )}

        {isResetModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-slate-700 p-8 rounded-lg shadow-2xl max-w-sm w-full">
              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4">Confirm Clear Form</h3>
              <p className="text-slate-600 dark:text-slate-300 mb-6">Are you sure you want to clear the form? This will remove all details and equipment settings, but will not delete your saved plans.</p>
              <div className="flex justify-end gap-4">
                <button onClick={() => setIsResetModalOpen(false)} className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold rounded-md transition-colors dark:bg-slate-600 dark:hover:bg-slate-500 dark:text-slate-100">Cancel</button>
                <button onClick={handleFullReset} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-md transition-colors">Yes, Clear Form</button>
              </div>
            </div>
          </div>
        )}
    </div>
  );
};

export default App;