import { LiftType, Attempt, WarmupSet, Plate, DynamicWarmupSettings, ScoringFormula } from '../types';
import { 
    ATTEMPT_PERCENTAGES, 
    SQUAT_WARMUPS, BENCH_WARMUPS, DEADLIFT_WARMUPS,
    SQUAT_REP_SCHEMES, BENCH_REP_SCHEMES, DEADLIFT_REP_SCHEMES 
} from '../constants';

export const roundToNearest2point5 = (value: number): number => {
  return Math.round(value / 2.5) * 2.5;
};

export const calculateAttempts = (liftType: LiftType, attempts: Attempt): Attempt | null => {
  const opener = parseFloat(attempts['1']);
  const third = parseFloat(attempts['3']);
  const percentages = ATTEMPT_PERCENTAGES[liftType];

  if (!opener && !third) {
    return null;
  }

  const newAttempts: Attempt = { ...attempts };

  if (third && !opener) {
    newAttempts['1'] = roundToNearest2point5(third * percentages.fromThird.first).toString();
    newAttempts['2'] = roundToNearest2point5(third * percentages.fromThird.second).toString();
  } else if (opener) {
    newAttempts['2'] = roundToNearest2point5(opener * percentages.fromOpener.second).toString();
    newAttempts['3'] = roundToNearest2point5(opener * percentages.fromOpener.third).toString();
  }

  return newAttempts;
};

export const generateDynamicWarmups = (liftType: LiftType, openerValue: number, settings: DynamicWarmupSettings): WarmupSet[] => {
    const numSets = parseInt(settings.numSets, 10);
    const startWeight = parseFloat(settings.startWeight);
    const finalWarmupPercent = parseFloat(settings.finalWarmupPercent) / 100;

    const emptyResult = () => Array(8).fill({ weight: '', reps: '' });

    if (isNaN(numSets) || isNaN(startWeight) || isNaN(finalWarmupPercent) || numSets < 2) {
        return emptyResult();
    }

    const targetFinalWarmup = openerValue * finalWarmupPercent;
    const weightRange = targetFinalWarmup - startWeight;
    
    if (weightRange <= 0) {
        return emptyResult();
    }

    const numJumps = numSets - 1;
    // Create a series of "weights" for each jump, e.g., for 5 jumps: [5, 4, 3, 2, 1]
    const jumpWeights = Array.from({ length: numJumps }, (_, i) => numJumps - i);
    const totalParts = jumpWeights.reduce((sum, part) => sum + part, 0);

    const partSize = weightRange / totalParts;

    const warmups: number[] = [startWeight];
    let currentWeight = startWeight;

    for (let i = 0; i < numJumps; i++) {
        const jumpSize = jumpWeights[i] * partSize;
        currentWeight += jumpSize;
        warmups.push(currentWeight);
    }
    
    const roundedWarmups = warmups.map(w => roundToNearest2point5(w));

    const repSchemes: Record<number, number[]> = {
        squat: SQUAT_REP_SCHEMES,
        bench: BENCH_REP_SCHEMES,
        deadlift: DEADLIFT_REP_SCHEMES
    }[liftType];

    const reps = repSchemes[roundedWarmups.length] || [];

    const result: WarmupSet[] = [];
    for (let i = 0; i < 8; i++) {
        if (i < roundedWarmups.length) {
            result.push({
                weight: roundedWarmups[i].toString(),
                reps: (reps[i] !== undefined ? reps[i].toString() : '1')
            });
        } else {
            result.push({ weight: '', reps: '' });
        }
    }
    return result;
};


export const generateWarmups = (
    liftType: LiftType, 
    opener: string, 
    strategy: 'default' | 'dynamic',
    dynamicSettings: DynamicWarmupSettings
): WarmupSet[] | null => {
    const openerValue = parseFloat(opener);
    if (isNaN(openerValue)) {
        return null;
    }

    if (strategy === 'dynamic') {
        return generateDynamicWarmups(liftType, openerValue, dynamicSettings);
    }

    // Default strategy
    const roundedOpener = roundToNearest2point5(openerValue);

    const lookup: Record<number, number[]> = {
        squat: SQUAT_WARMUPS,
        bench: BENCH_WARMUPS,
        deadlift: DEADLIFT_WARMUPS
    }[liftType];

    const repSchemes: Record<number, number[]> = {
        squat: SQUAT_REP_SCHEMES,
        bench: BENCH_REP_SCHEMES,
        deadlift: DEADLIFT_REP_SCHEMES
    }[liftType];

    const warmups = lookup[roundedOpener];
    if (!warmups) {
        return [];
    }

    const reps = repSchemes[warmups.length] || [];

    const result: WarmupSet[] = [];
    for(let i=0; i<8; i++){
        if(i < warmups.length) {
            result.push({
                weight: warmups[i].toString(),
                reps: (reps[i] || '').toString()
            });
        } else {
             result.push({ weight: '', reps: '' });
        }
    }
    return result;
};


export const getPlateBreakdown = (totalKg: number, includeCollars: boolean): string => {
  const barWeight = 20;
  const collarWeight = includeCollars ? 5 : 0; // 2.5kg per side
  const baseText = `Bar only (${barWeight}kg)${includeCollars ? ' + 5kg Collars' : ''}`;
  
  const plateSet = [25, 20, 15, 10, 5, 2.5, 1.25];
  
  const totalWeightIncludingBar = barWeight + collarWeight;
  if (isNaN(totalKg) || totalKg < totalWeightIncludingBar) {
      if (totalKg === barWeight) return `Bar only (${barWeight}kg)`;
      return baseText;
  }
  
  let weightPerSide = (totalKg - barWeight) / 2;
  if(includeCollars) {
      weightPerSide -= 2.5;
  }

  const breakdown: string[] = [];

  for (const plate of plateSet) {
    const count = Math.floor(weightPerSide / plate);
    if (count > 0) {
      breakdown.push(`${count}×${plate}kg`);
      weightPerSide -= count * plate;
    }
  }

  return breakdown.length ? breakdown.join(' + ') : `Bar only (${barWeight}kg)`;
};

export const PLATE_COLORS: Record<number, string> = {
    25: 'bg-red-500',
    20: 'bg-blue-600',
    15: 'bg-yellow-400',
    10: 'bg-green-500',
    5: 'bg-slate-100 border-2 border-slate-400',
    2.5: 'bg-slate-800',
    1.25: 'bg-slate-400',
    0.5: 'bg-slate-300',
    0.25: 'bg-slate-200',
};

export const PLATE_SIZES: Record<number, string> = {
    25: 'h-10 w-3',
    20: 'h-10 w-2.5',
    15: 'h-9 w-2.5',
    10: 'h-9 w-2',
    5: 'h-8 w-2',
    2.5: 'h-7 w-1.5',
    1.25: 'h-6 w-1',
    0.5: 'h-5 w-1',
    0.25: 'h-4 w-1',
};

const PLATE_SIZES_LARGE: Record<number, string> = {
    25: 'h-14 w-5',
    20: 'h-14 w-4',
    15: 'h-12 w-4',
    10: 'h-12 w-3',
    5: 'h-11 w-3',
    2.5: 'h-10 w-2',
    1.25: 'h-8 w-2',
    0.5: 'h-7 w-2',
    0.25: 'h-6 w-2',
};

export const getPlatesForDisplay = (totalKg: number, includeCollars: boolean, size: 'sm' | 'lg' = 'sm'): Plate[] => {
    const barWeight = 20;
    
    if (isNaN(totalKg) || totalKg < barWeight) {
        return [];
    }

    let weightPerSide = (totalKg - barWeight) / 2;

    if (includeCollars) {
        weightPerSide -= 2.5; // Account for one collar on one side
    }

    if (weightPerSide < 0) {
        return []; // Not possible to load this with collars
    }
    
    const plateSet = [25, 20, 15, 10, 5, 2.5, 1.25, 0.5, 0.25];
    const plates: Plate[] = [];
    const plateSizeMap = size === 'lg' ? PLATE_SIZES_LARGE : PLATE_SIZES;

    for (const plateWeight of plateSet) {
        // Use a tolerance for floating point issues
        const count = Math.floor(weightPerSide / plateWeight + 1e-9);
        if (count > 0) {
            for (let i = 0; i < count; i++) {
                plates.push({
                    weight: plateWeight,
                    color: PLATE_COLORS[plateWeight],
                    size: plateSizeMap[plateWeight],
                });
            }
            weightPerSide -= count * plateWeight;
        }
    }
    return plates;
};

const WILKS_COEFFICIENTS = {
    male: { a: -216.0475144, b: 16.2606339, c: -0.002388645, d: -0.00113732, e: 7.01863e-6, f: -1.291e-8 },
    female: { a: 594.31747775582, b: -27.23842536447, c: 0.82112226871, d: -0.00930733913, e: 4.731582e-5, f: -9.054e-8 }
};

const DOTS_COEFFICIENTS = {
    male: { a: -0.0000010930, b: 0.0007391293, c: -0.0017887, d: 0.0737973, e: -3.80172, f: 521.6422 },
    female: { a: -0.0000010192, b: 0.0005158589, c: -0.0011363, d: 0.0315354, e: -2.3444, f: 409.5093 }
};

const calculateIPFGLScore = (total: number, bodyWeight: number, gender: 'male' | 'female'): number => {
    const A = gender === 'male' ? 1236.26169 : 512.23235;
    const B = gender === 'male' ? 1232.89536 : 533.28766;
    const C = gender === 'male' ? 0.00898 : 0.01633;
    const denominator = A - B * Math.exp(-C * bodyWeight);
    return (100 / denominator) * total;
};

const calculateWilksScore = (total: number, bodyWeight: number, gender: 'male' | 'female'): number => {
    const { a, b, c, d, e, f } = WILKS_COEFFICIENTS[gender];
    const denominator = a + (b * bodyWeight) + (c * Math.pow(bodyWeight, 2)) + (d * Math.pow(bodyWeight, 3)) + (e * Math.pow(bodyWeight, 4)) + (f * Math.pow(bodyWeight, 5));
    return total * (500 / denominator);
};

const calculateDOTSScore = (total: number, bodyWeight: number, gender: 'male' | 'female'): number => {
    const { a, b, c, d, e, f } = DOTS_COEFFICIENTS[gender];
    const denominator = (a * Math.pow(bodyWeight, 5)) + (b * Math.pow(bodyWeight, 4)) + (c * Math.pow(bodyWeight, 3)) + (d * Math.pow(bodyWeight, 2)) + (e * bodyWeight) + f;
    return total * (500 / denominator);
};

export const calculateScore = (total: number, bodyWeight: number, gender: 'male' | 'female' | '', formula: ScoringFormula): number => {
    if (total <= 0 || bodyWeight <= 0 || !gender) {
        return 0;
    }

    let score: number;
    switch (formula) {
        case 'wilks':
            score = calculateWilksScore(total, bodyWeight, gender);
            break;
        case 'dots':
            score = calculateDOTSScore(total, bodyWeight, gender);
            break;
        case 'ipfgl':
        default:
            score = calculateIPFGLScore(total, bodyWeight, gender);
            break;
    }
    
    if (isNaN(score) || !isFinite(score)) {
        return 0;
    }
    
    return parseFloat(score.toFixed(2));
};