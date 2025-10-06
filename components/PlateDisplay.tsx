import React from 'react';
import { getPlatesForDisplay } from '../utils/calculator';

interface PlateDisplayProps {
  weightKg: string;
  includeCollars: boolean;
  size?: 'sm' | 'lg';
}

const PlateDisplay: React.FC<PlateDisplayProps> = ({ weightKg, includeCollars, size = 'sm' }) => {
  const totalWeight = parseFloat(weightKg);
  
  const containerHeightClass = size === 'lg' ? 'h-14' : 'h-10';
  const barSleeveClasses = size === 'lg' ? 'h-4 w-6' : 'h-2.5 w-4';
  const collarClasses = size === 'lg' ? 'h-7 w-3' : 'h-5 w-2';

  if (isNaN(totalWeight) || totalWeight <= 0) {
    return <div className={`${containerHeightClass} flex items-center justify-start text-xs text-slate-400 dark:text-slate-500`}></div>;
  }

  if (totalWeight > 0 && totalWeight < 20) {
     return <div className={`${containerHeightClass} flex items-center justify-start text-xs text-slate-400 dark:text-slate-500`}>Invalid</div>;
  }

  if (includeCollars && totalWeight > 20 && totalWeight < 25) {
    return <div className={`${containerHeightClass} flex items-center justify-start text-xs text-slate-400 dark:text-slate-500`}>Invalid</div>;
  }

  const plates = getPlatesForDisplay(totalWeight, includeCollars, size);
  const canLoadWithCollars = totalWeight >= 25;
  const showCollars = includeCollars && canLoadWithCollars;
  
  if (totalWeight === 20 || (totalWeight > 20 && plates.length === 0 && !canLoadWithCollars)) {
    return <div className={`${containerHeightClass} flex items-center justify-start text-xs text-slate-400 dark:text-slate-500`}>Bar Only</div>;
  }

  return (
    <div className={`flex items-center ${containerHeightClass}`}>
      {/* Bar sleeve */}
      <div className={`${barSleeveClasses} bg-slate-300 dark:bg-slate-600 rounded-r-sm z-10 shadow-inner`}></div>
      {/* Plates */}
      <div className="flex items-center -space-x-px">
        {plates.map((plate, index) => (
          <div
            key={index}
            className={`rounded-md ${plate.size} ${plate.color} flex items-center justify-center shadow`}
            title={`${plate.weight}kg`}
          ></div>
        ))}
      </div>
       {/* Collar */}
      {showCollars &&
        <div className={`${collarClasses} bg-slate-500 dark:bg-slate-400 border border-slate-600 dark:border-slate-500 ml-1 rounded-sm shadow-md`} title="2.5kg Collar"></div>
      }
    </div>
  );
};

export default PlateDisplay;