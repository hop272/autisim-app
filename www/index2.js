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
function createInitialState() {
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
export function createAppStore() {
    let state = createInitialState();
    const listeners = new Set();
    const setState = (update) => {
        const next = typeof update === 'function' ? update(state) : update;
        state = { ...state, ...next };
        listeners.forEach(listener => listener(state));
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
    };
}
export const store = createAppStore();
