import { supabase } from './supabase.js';
const STORAGE_KEY = 'autisim_app_state';
const defaultCrisisPlan = {
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
const defaultEnergyPresets = [
    { id: '1', label: 'Good sleep', type: 'rest', cost: 35 },
    { id: '2', label: 'Crowded social event', type: 'social', cost: -24 },
    { id: '3', label: 'Focused work block', type: 'work', cost: -12 },
    { id: '4', label: 'Quiet walk', type: 'travel', cost: -6 },
    { id: '5', label: 'Decompression break', type: 'rest', cost: 18 },
];
function createInitialState() {
    const defaults = {
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
        }
        catch (e) {
            console.error('Failed to parse saved state', e);
        }
    }
    return defaults;
}
export function createAppStore() {
    let state = createInitialState();
    // Apply initial theme
    if (state.darkMode) {
        document.documentElement.classList.add('dark-mode');
    }
    const listeners = new Set();
    let isSyncing = false;
    let skipNextSync = false;
    const saveToStorage = (nextState) => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));
    };
    const setState = (update) => {
        const next = typeof update === 'function' ? update(state) : update;
        state = { ...state, ...next };
        saveToStorage(state);
        listeners.forEach(listener => listener(state));
        if (state.user && !skipNextSync) {
            debounceSync();
        }
        skipNextSync = false;
    };
    let syncTimeout = null;
    const debounceSync = () => {
        if (syncTimeout)
            clearTimeout(syncTimeout);
        syncTimeout = setTimeout(() => {
            store.syncToCloud();
        }, 5000); // 5 second debounce for stability
    };
    const syncToCloud = async () => {
        if (isSyncing || !state.user)
            return;
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
        }
        catch (e) {
            console.error('Cloud sync network error:', e);
        }
        finally {
            isSyncing = false;
        }
    };
    return {
        getState: () => state,
        setState,
        subscribe: (listener) => {
            listeners.add(listener);
            return () => listeners.delete(listener);
        },
        toggleRecoveryMode: () => setState({ isRecoveryMode: !state.isRecoveryMode }),
        setCurrentEnergy: (value) => setState({ currentEnergy: Math.max(0, Math.min(100, value)) }),
        addEnergyEntry: (entry) => {
            setState({
                energyEntries: [...state.energyEntries, { ...entry, id: Date.now().toString() }],
                currentEnergy: Math.max(0, Math.min(100, state.currentEnergy + entry.cost)),
            });
        },
        addEnergyPreset: (preset) => {
            setState({
                energyPresets: [...state.energyPresets, { ...preset, id: Date.now().toString() }],
            });
        },
        removeEnergyPreset: (id) => {
            setState({
                energyPresets: state.energyPresets.filter(p => p.id !== id),
            });
        },
        addTask: (task) => {
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
        completeStep: (taskId, stepIndex) => {
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
        setActiveTask: (id) => setState({ activeTaskId: id }),
        clearTask: (id) => {
            setState({
                tasks: state.tasks.filter(task => task.id !== id),
                activeTaskId: state.activeTaskId === id ? null : state.activeTaskId,
            });
        },
        addSensoryLog: (log) => {
            setState({
                sensoryLogs: [{ ...log, id: Date.now().toString() }, ...state.sensoryLogs],
            });
        },
        updateCrisisPlan: (plan) => {
            setState({
                crisisPlan: { ...state.crisisPlan, ...plan, lastUpdated: Date.now() },
            });
        },
        addRecoveryPlan: (plan) => {
            setState({
                customRecoveryPlans: [...state.customRecoveryPlans, { ...plan, id: Date.now().toString() }],
            });
        },
        removeRecoveryPlan: (id) => {
            setState({
                customRecoveryPlans: state.customRecoveryPlans.filter(p => p.id !== id),
                activeRecoveryPlanId: state.activeRecoveryPlanId === id ? null : state.activeRecoveryPlanId,
            });
        },
        setActiveRecoveryPlan: (id) => {
            setState({ activeRecoveryPlanId: id });
        },
        addCalendarEvent: (event) => {
            setState({
                calendarEvents: [...state.calendarEvents, { ...event, id: Date.now().toString() }]
            });
        },
        setCalendarEvents: (events) => {
            setState({ calendarEvents: events });
        },
        updateCalendarEvent: (id, update) => {
            setState({
                calendarEvents: state.calendarEvents.map(ev => ev.id === id ? { ...ev, ...update } : ev)
            });
        },
        setHealthSyncEnabled: (enabled) => {
            setState({ healthSyncEnabled: enabled });
        },
        setHasSeenHealthOnboarding: (seen) => {
            setState({ hasSeenHealthOnboarding: seen });
        },
        setDarkMode: (enabled) => {
            setState({ darkMode: enabled });
            if (enabled) {
                document.documentElement.classList.add('dark-mode');
            }
            else {
                document.documentElement.classList.remove('dark-mode');
            }
        },
        clearSensoryHistory: () => {
            setState({ sensoryLogs: [] });
        },
        setUser: async (user) => {
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
                        }
                        else {
                            document.documentElement.classList.remove('dark-mode');
                        }
                    }
                }
                catch (e) {
                    console.error('Initial pull error:', e);
                }
            }
            listeners.forEach(l => l(state));
        },
        syncToCloud
    };
}
export const store = createAppStore();
