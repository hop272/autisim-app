import { create } from 'zustand';
// ── Default values ────────────────────────────────────────────────────────────
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
    trustedContacts: [
        { name: 'Alex', phone: '', note: 'Call if overwhelmed' },
    ],
    safePlace: 'Bedroom with blackout curtains',
    lastUpdated: Date.now(),
};
// ── Store ─────────────────────────────────────────────────────────────────────
export const useStore = create((set, get) => ({
    isRecoveryMode: false,
    toggleRecoveryMode: () => set(s => ({ isRecoveryMode: !s.isRecoveryMode })),
    dailyEnergyBudget: 100,
    currentEnergy: 72,
    energyEntries: [
        {
            id: '1',
            timestamp: Date.now() - 7200000,
            activity: 'Slept 7 hours',
            activityType: 'rest',
            cost: 40,
            note: 'Restless but slept',
        },
        {
            id: '2',
            timestamp: Date.now() - 3600000,
            activity: 'Team standup',
            activityType: 'social',
            cost: -15,
            note: 'More people than expected',
        },
        {
            id: '3',
            timestamp: Date.now() - 1800000,
            activity: 'Lunch (alone)',
            activityType: 'rest',
            cost: 8,
        },
    ],
    setCurrentEnergy: (val) => set({ currentEnergy: Math.max(0, Math.min(100, val)) }),
    addEnergyEntry: (entry) => set(s => ({
        energyEntries: [
            ...s.energyEntries,
            { ...entry, id: Date.now().toString() },
        ],
        currentEnergy: Math.max(0, Math.min(100, s.currentEnergy + entry.cost)),
    })),
    tasks: [],
    activeTaskId: null,
    addTask: (task) => set(s => ({
        tasks: [
            ...s.tasks,
            {
                ...task,
                id: Date.now().toString(),
                createdAt: Date.now(),
                currentStepIndex: 0,
            },
        ],
    })),
    completeStep: (taskId, stepIndex) => set(s => ({
        tasks: s.tasks.map(t => t.id !== taskId
            ? t
            : {
                ...t,
                steps: t.steps.map((step, i) => i === stepIndex ? { ...step, done: true } : step),
                currentStepIndex: Math.min(stepIndex + 1, t.steps.length - 1),
                completedAt: stepIndex === t.steps.length - 1 ? Date.now() : undefined,
            }),
    })),
    setActiveTask: (id) => set({ activeTaskId: id }),
    clearTask: (id) => set(s => ({
        tasks: s.tasks.filter(t => t.id !== id),
        activeTaskId: s.activeTaskId === id ? null : s.activeTaskId,
    })),
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
        {
            id: '3',
            timestamp: Date.now() - 7200000,
            noise: 5,
            light: 5,
            crowding: 4,
            smell: 3,
            temperature: 5,
            clothing: 6,
            mood: 6,
            energy: 5,
            location: 'Coffee shop',
        },
    ],
    addSensoryLog: (log) => set(s => ({
        sensoryLogs: [{ ...log, id: Date.now().toString() }, ...s.sensoryLogs],
    })),
    crisisPlan: defaultCrisisPlan,
    updateCrisisPlan: (plan) => set(s => ({
        crisisPlan: { ...s.crisisPlan, ...plan, lastUpdated: Date.now() },
    })),
    today: new Date().toDateString(),
}));
