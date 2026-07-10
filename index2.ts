import { supabase } from './supabase.js';

export interface SensoryLog {
  id: string;
  timestamp: number;
  noise: number;
  light: number;
  crowding: number;
  smell: number;
  temperature: number;
  clothing: number;
  mood: number;
  energy: number;
  note?: string;
  eventType?: 'meltdown' | 'shutdown' | 'overload' | 'regulated';
  location?: string;
}

export interface TaskStep {
  id: string;
  text: string;
  done: boolean;
  energyCost?: number;
  durationMinutes?: number;
}

export interface Task {
  id: string;
  goal: string;
  steps: TaskStep[];
  currentStepIndex: number;
  createdAt: number;
  completedAt?: number;
  energyCost: 'low' | 'medium' | 'high';
}

export interface EnergyEntry {
  id: string;
  timestamp: number;
  activity: string;
  activityType: 'work' | 'social' | 'travel' | 'rest' | 'personal' | 'other';
  cost: number;
  actual?: number;
  note?: string;
}

export interface EnergyPreset {
  id: string;
  label: string;
  type: 'work' | 'social' | 'travel' | 'rest' | 'personal' | 'other';
  cost: number;
}

export interface CrisisPlan {
  whatHelps: string[];
  whatToAvoid: string[];
  groundingSteps: string[];
  trustedContacts: Array<{ name: string; phone?: string; note?: string }>;
  safePlace?: string;
  lastUpdated: number;
}

export interface RecoveryPlan {
  id: string;
  name: string;
  steps: string[];
}

export interface CalendarEvent {
  id: string;
  title: string;
  startTime: number;
  endTime: number;
  location?: string;
  description?: string;
  isSynced: boolean;
  externalId?: string;
  sensoryProfile?: {
    noise: number;
    light: number;
    crowding: number;
    smell?: number;
    temperature?: number;
  };
  energyCost?: number;
  icon?: string;
}

export interface User {
  id: string;
  email: string;
  name?: string;
  imageUrl?: string;
}

export interface AppState {
  isRecoveryMode: boolean;
  dailyEnergyBudget: number;
  currentEnergy: number;
  energyEntries: EnergyEntry[];
  energyPresets: EnergyPreset[];
  tasks: Task[];
  activeTaskId: string | null;
  sensoryLogs: SensoryLog[];
  crisisPlan: CrisisPlan;
  customRecoveryPlans: RecoveryPlan[];
  activeRecoveryPlanId: string | null;
  calendarEvents: CalendarEvent[];
  healthSyncEnabled: boolean;
  hasSeenHealthOnboarding: boolean;
  darkMode: boolean;
  today: string;
  user: User | null;
}

type Listener = (state: AppState) => void;

export interface AppStore {
  getState: () => AppState;
  setState: (update: Partial<AppState> | ((prev: AppState) => Partial<AppState>)) => void;
  subscribe: (listener: Listener) => () => void;
  toggleRecoveryMode: () => void;
  setCurrentEnergy: (value: number) => void;
  addEnergyEntry: (entry: Omit<EnergyEntry, 'id'>) => void;
  addEnergyPreset: (preset: Omit<EnergyPreset, 'id'>) => void;
  removeEnergyPreset: (id: string) => void;
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'currentStepIndex'>) => void;
  completeStep: (taskId: string, stepIndex: number) => void;
  setActiveTask: (id: string | null) => void;
  clearTask: (id: string) => void;
  addSensoryLog: (log: Omit<SensoryLog, 'id'>) => void;
  updateCrisisPlan: (plan: Partial<CrisisPlan>) => void;
  addRecoveryPlan: (plan: Omit<RecoveryPlan, 'id'>) => void;
  removeRecoveryPlan: (id: string) => void;
  setActiveRecoveryPlan: (id: string | null) => void;
  addCalendarEvent: (event: Omit<CalendarEvent, 'id'>) => void;
  setCalendarEvents: (events: CalendarEvent[]) => void;
  updateCalendarEvent: (id: string, update: Partial<CalendarEvent>) => void;
  setHealthSyncEnabled: (enabled: boolean) => void;
  setHasSeenHealthOnboarding: (seen: boolean) => void;
  setDarkMode: (enabled: boolean) => void;
  clearSensoryHistory: () => void;
  setUser: (user: User | null) => Promise<void>;
  syncToCloud: () => Promise<void>;
}

const STORAGE_KEY = 'autisim_app_state';

const defaultCrisisPlan: CrisisPlan = {
  whatHelps: ['Headphones + music', 'Move to quiet room', 'Drink cold water', 'Weighted blanket'],
  whatToAvoid: ['Bright lights', 'Crowds', 'Loud conversations', 'Making decisions'],
  groundingSteps: [
    'Find somewhere to sit or lie down',
    'Put on headphones if available',
    'Take 5 slow breaths',
    'Drink some water',
    'Rest — no tasks needed right now',
  ],
  trustedContacts: [{ name: 'Alex', phone: '', note: 'Call if overwhelmed' }],
  safePlace: 'Bedroom with blackout curtains',
  lastUpdated: Date.now(),
};

const defaultEnergyPresets: EnergyPreset[] = [
  { id: '1', label: 'Good sleep', type: 'rest', cost: 35 },
  { id: '2', label: 'Crowded social event', type: 'social', cost: -24 },
  { id: '3', label: 'Focused work block', type: 'work', cost: -12 },
  { id: '4', label: 'Quiet walk', type: 'travel', cost: -6 },
  { id: '5', label: 'Decompression break', type: 'rest', cost: 18 },
];

function createInitialState(): AppState {
  const defaults: AppState = {
    isRecoveryMode: false,
    dailyEnergyBudget: 100,
    currentEnergy: 100,
    energyEntries: [],
    energyPresets: defaultEnergyPresets,
    tasks: [],
    activeTaskId: null,
    sensoryLogs: [],
    crisisPlan: defaultCrisisPlan,
    customRecoveryPlans: [],
    activeRecoveryPlanId: null,
    calendarEvents: [],
    healthSyncEnabled: false,
    hasSeenHealthOnboarding: false,
    darkMode: false,
    today: new Date().toDateString(),
    user: null,
  };

  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      // Ensure all arrays exist even in older saved states
      return {
        ...defaults,
        ...parsed,
        energyEntries: parsed.energyEntries || defaults.energyEntries,
        energyPresets: parsed.energyPresets || defaults.energyPresets,
        tasks: parsed.tasks || defaults.tasks,
        sensoryLogs: parsed.sensoryLogs || defaults.sensoryLogs,
        customRecoveryPlans: parsed.customRecoveryPlans || defaults.customRecoveryPlans,
        calendarEvents: parsed.calendarEvents || defaults.calendarEvents,
      };
    } catch (e) {
      console.error('Failed to parse saved state', e);
    }
  }

  return defaults;
}

export function createAppStore(): AppStore {
  let state = createInitialState();

  // Apply initial theme
  if (state.darkMode) {
    document.documentElement.classList.add('dark-mode');
  }

  const listeners = new Set<Listener>();
  let isSyncing = false;
  let skipNextSync = false;

  const saveToStorage = (nextState: AppState) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));
  };

  const setState = (update: Partial<AppState> | ((prev: AppState) => Partial<AppState>)) => {
    const next = typeof update === 'function' ? update(state) : update;
    state = { ...state, ...next };
    saveToStorage(state);
    listeners.forEach(listener => listener(state));

    if (state.user && !skipNextSync) {
      debounceSync();
    }
    skipNextSync = false;
  };

  let syncTimeout: any = null;
  const debounceSync = () => {
    if (syncTimeout) clearTimeout(syncTimeout);
    syncTimeout = setTimeout(() => {
      store.syncToCloud();
    }, 5000); // 5 second debounce for stability
  };

  const syncToCloud = async () => {
    if (isSyncing || !state.user) return;
    isSyncing = true;

    try {
      const { user, ...syncableState } = state;
      const { error } = await supabase
        .from('user_state')
        .upsert({
          user_id: user.id,
          state: {
            currentEnergy: syncableState.currentEnergy,
            energyEntries: syncableState.energyEntries,
            energyPresets: syncableState.energyPresets,
            tasks: syncableState.tasks,
            activeTaskId: syncableState.activeTaskId,
            sensoryLogs: syncableState.sensoryLogs,
            crisisPlan: syncableState.crisisPlan,
            customRecoveryPlans: syncableState.customRecoveryPlans,
            activeRecoveryPlanId: syncableState.activeRecoveryPlanId,
            calendarEvents: syncableState.calendarEvents,
            healthSyncEnabled: syncableState.healthSyncEnabled,
            hasSeenHealthOnboarding: syncableState.hasSeenHealthOnboarding,
            darkMode: syncableState.darkMode,
          },
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.error('Cloud sync error:', error.message);
      }
    } catch (e) {
      console.error('Cloud sync network error:', e);
    } finally {
      isSyncing = false;
    }
  };

  return {
    getState: () => state,
    setState,
    subscribe: (listener: Listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    toggleRecoveryMode: () => setState({ isRecoveryMode: !state.isRecoveryMode }),
    setCurrentEnergy: (value: number) => setState({ currentEnergy: Math.max(0, Math.min(100, value)) }),
    addEnergyEntry: (entry: Omit<EnergyEntry, 'id'>) => {
      setState({
        energyEntries: [...state.energyEntries, { ...entry, id: Date.now().toString() }],
        currentEnergy: Math.max(0, Math.min(100, state.currentEnergy + entry.cost)),
      });
    },
    addEnergyPreset: (preset: Omit<EnergyPreset, 'id'>) => {
      setState({
        energyPresets: [...state.energyPresets, { ...preset, id: Date.now().toString() }],
      });
    },
    removeEnergyPreset: (id: string) => {
      setState({
        energyPresets: state.energyPresets.filter(p => p.id !== id),
      });
    },
    addTask: (task: Omit<Task, 'id' | 'createdAt' | 'currentStepIndex'>) => {
      setState({
        tasks: [
          ...state.tasks,
          {
            ...task,
            id: Date.now().toString(),
            createdAt: Date.now(),
            currentStepIndex: 0,
          },
        ],
      });
    },
    completeStep: (taskId: string, stepIndex: number) => {
      setState({
        tasks: state.tasks.map(task => {
          if (task.id !== taskId) {
            return task;
          }
          return {
            ...task,
            steps: task.steps.map((step, index) => (index === stepIndex ? { ...step, done: true } : step)),
            currentStepIndex: Math.min(stepIndex + 1, task.steps.length - 1),
            completedAt: stepIndex === task.steps.length - 1 ? Date.now() : undefined,
          };
        }),
      });
    },
    setActiveTask: (id: string | null) => setState({ activeTaskId: id }),
    clearTask: (id: string) => {
      setState({
        tasks: state.tasks.filter(task => task.id !== id),
        activeTaskId: state.activeTaskId === id ? null : state.activeTaskId,
      });
    },
    addSensoryLog: (log: Omit<SensoryLog, 'id'>) => {
      setState({
        sensoryLogs: [{ ...log, id: Date.now().toString() }, ...state.sensoryLogs],
      });
    },
    updateCrisisPlan: (plan: Partial<CrisisPlan>) => {
      setState({
        crisisPlan: { ...state.crisisPlan, ...plan, lastUpdated: Date.now() },
      });
    },
    addRecoveryPlan: (plan: Omit<RecoveryPlan, 'id'>) => {
      setState({
        customRecoveryPlans: [...state.customRecoveryPlans, { ...plan, id: Date.now().toString() }],
      });
    },
    removeRecoveryPlan: (id: string) => {
      setState({
        customRecoveryPlans: state.customRecoveryPlans.filter(p => p.id !== id),
        activeRecoveryPlanId: state.activeRecoveryPlanId === id ? null : state.activeRecoveryPlanId,
      });
    },
    setActiveRecoveryPlan: (id: string | null) => {
      setState({ activeRecoveryPlanId: id });
    },
    addCalendarEvent: (event: Omit<CalendarEvent, 'id'>) => {
      setState({
        calendarEvents: [...state.calendarEvents, { ...event, id: Date.now().toString() }]
      });
    },
    setCalendarEvents: (events: CalendarEvent[]) => {
      setState({ calendarEvents: events });
    },
    updateCalendarEvent: (id: string, update: Partial<CalendarEvent>) => {
      setState({
        calendarEvents: state.calendarEvents.map(ev => ev.id === id ? { ...ev, ...update } : ev)
      });
    },
    setHealthSyncEnabled: (enabled: boolean) => {
      setState({ healthSyncEnabled: enabled });
    },
    setHasSeenHealthOnboarding: (seen: boolean) => {
      setState({ hasSeenHealthOnboarding: seen });
    },
    setDarkMode: (enabled: boolean) => {
      setState({ darkMode: enabled });
      if (enabled) {
        document.documentElement.classList.add('dark-mode');
      } else {
        document.documentElement.classList.remove('dark-mode');
      }
    },
    clearSensoryHistory: () => {
      setState({ sensoryLogs: [] });
    },
    setUser: async (user: User | null) => {
      state.user = user; // Set directly to avoid loop
      saveToStorage(state);

      if (user) {
        try {
          const { data, error } = await supabase
            .from('user_state')
            .select('state')
            .eq('user_id', user.id)
            .single();

          if (data && data.state) {
            skipNextSync = true;
            setState({
              currentEnergy: data.state.currentEnergy,
              energyEntries: data.state.energyEntries,
              energyPresets: data.state.energyPresets || defaultEnergyPresets,
              tasks: data.state.tasks,
              activeTaskId: data.state.activeTaskId,
              sensoryLogs: data.state.sensoryLogs,
              crisisPlan: data.state.crisisPlan,
              customRecoveryPlans: data.state.customRecoveryPlans || [],
              activeRecoveryPlanId: data.state.activeRecoveryPlanId || null,
              calendarEvents: data.state.calendarEvents || [],
              healthSyncEnabled: data.state.healthSyncEnabled || false,
              hasSeenHealthOnboarding: data.state.hasSeenHealthOnboarding || false,
              darkMode: data.state.darkMode || false,
            });

            // Apply theme after cloud sync
            if (data.state.darkMode) {
              document.documentElement.classList.add('dark-mode');
            } else {
              document.documentElement.classList.remove('dark-mode');
            }
          }
        } catch (e) {
          console.error('Initial pull error:', e);
        }
      }

      listeners.forEach(l => l(state));
    },
    syncToCloud
  };
}

export const store = createAppStore();
