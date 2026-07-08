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

export interface CrisisPlan {
  whatHelps: string[];
  whatToAvoid: string[];
  groundingSteps: string[];
  trustedContacts: Array<{ name: string; phone?: string; note?: string }>;
  safePlace?: string;
  lastUpdated: number;
}

export interface AppState {
  isRecoveryMode: boolean;
  dailyEnergyBudget: number;
  currentEnergy: number;
  energyEntries: EnergyEntry[];
  tasks: Task[];
  activeTaskId: string | null;
  sensoryLogs: SensoryLog[];
  crisisPlan: CrisisPlan;
  today: string;
}

type Listener = (state: AppState) => void;

export interface AppStore {
  getState: () => AppState;
  setState: (update: Partial<AppState> | ((prev: AppState) => Partial<AppState>)) => void;
  subscribe: (listener: Listener) => () => void;
  toggleRecoveryMode: () => void;
  setCurrentEnergy: (value: number) => void;
  addEnergyEntry: (entry: Omit<EnergyEntry, 'id'>) => void;
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'currentStepIndex'>) => void;
  completeStep: (taskId: string, stepIndex: number) => void;
  setActiveTask: (id: string | null) => void;
  clearTask: (id: string) => void;
  addSensoryLog: (log: Omit<SensoryLog, 'id'>) => void;
  updateCrisisPlan: (plan: Partial<CrisisPlan>) => void;
  clearSensoryHistory: () => void;
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

function createInitialState(): AppState {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to parse saved state', e);
    }
  }

  return {
    isRecoveryMode: false,
    dailyEnergyBudget: 100,
    currentEnergy: 72,
    energyEntries: [
      {
        id: '1',
        timestamp: Date.now() - 7200000,
        activity: 'Slept 7 hours',
        activityType: 'rest',
        cost: 40,
        note: 'Restful sleep',
      },
      {
        id: '2',
        timestamp: Date.now() - 3600000,
        activity: 'Team standup',
        activityType: 'social',
        cost: -15,
        note: 'More people than expected',
      },
    ],
    tasks: [],
    activeTaskId: null,
    sensoryLogs: [
      {
        id: '1',
        timestamp: Date.now() - 86400000,
        noise: 7,
        light: 6,
        crowding: 8,
        smell: 4,
        temperature: 5,
        clothing: 3,
        mood: 4,
        energy: 3,
        location: 'Supermarket',
        eventType: 'overload',
        note: 'Too busy at 5pm',
      },
      {
        id: '2',
        timestamp: Date.now() - 43200000,
        noise: 3,
        light: 4,
        crowding: 2,
        smell: 2,
        temperature: 5,
        clothing: 7,
        mood: 7,
        energy: 7,
        location: 'Home office',
        note: 'Comfortable morning',
      },
    ],
    crisisPlan: defaultCrisisPlan,
    today: new Date().toDateString(),
  };
}

export function createAppStore(): AppStore {
  let state = createInitialState();
  const listeners = new Set<Listener>();

  const saveToStorage = (nextState: AppState) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));
  };

  const setState = (update: Partial<AppState> | ((prev: AppState) => Partial<AppState>)) => {
    const next = typeof update === 'function' ? update(state) : update;
    state = { ...state, ...next };
    saveToStorage(state);
    listeners.forEach(listener => listener(state));
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
    clearSensoryHistory: () => {
      setState({ sensoryLogs: [] });
    }
  };
}

export const store = createAppStore();
