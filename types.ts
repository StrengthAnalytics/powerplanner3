export type LiftType = 'squat' | 'bench' | 'deadlift';

export type WarmupStrategy = 'default' | 'dynamic';

export type ScoringFormula = 'ipfgl' | 'wilks' | 'dots';

export interface DynamicWarmupSettings {
  numSets: string;
  startWeight: string;
  finalWarmupPercent: string;
}

export interface CompetitionDetails {
  eventName: string;
  lifterName: string;
  weightClass: string;
  competitionDate: string;
  weighInTime: string;
  bodyWeight: string;
  gender: 'male' | 'female' | '';
  scoringFormula: ScoringFormula;
}

export interface EquipmentSettings {
  squatRackHeight: string;
  squatStands: string;
  benchRackHeight: string;
  handOut: string;
  benchSafetyHeight: string;
}

export interface BrandingState {
  logo: string; // base64 encoded image
  primaryColor: string;
  secondaryColor: string;
}

export interface Attempt {
  '1': string;
  '2': string;
  '3': string;
}

export interface WarmupSet {
  weight: string;
  reps: string;
  completed?: boolean;
}

export interface Plate {
    weight: number;
    color: string;
    size: string;
}

export interface LiftState {
  attempts: Attempt;
  warmups: WarmupSet[];
  cues: string[];
  error: boolean;
  includeCollars: boolean;
  warmupStrategy: WarmupStrategy;
  dynamicWarmupSettings: DynamicWarmupSettings;
  openerForWarmups: string;
}

export type LiftsState = Record<LiftType, LiftState>;

export interface AppState {
  details: CompetitionDetails;
  equipment: EquipmentSettings;
  branding: BrandingState;
  lifts: LiftsState;
  gameDayState: Record<LiftType, GameDayLiftState>;
}

// For Game Day Mode local state
export type AttemptStatus = 'pending' | 'completed' | 'missed';

export interface GameDayLiftState extends LiftState {
    attempts: Attempt & {
        status: { '1': AttemptStatus; '2': AttemptStatus; '3': AttemptStatus };
    };
    warmups: WarmupSet[];
}