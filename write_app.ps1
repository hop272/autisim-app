$files = @{
  'index.ts' = @'
export type ScreenName = 'dashboard' | 'tasks' | 'sensory' | 'energy' | 'recovery';

import { renderDashboardScreen } from './dashboardscreen';
import { renderEnergyScreen } from './energyscreen';
import { renderRecoveryScreen } from './recoveryscreen';
import { renderSensoryScreen } from './sensoryscreen';
import { renderTaskScreen } from './taskscreen';
import { createButton, createCard } from './ui';
import { store } from './index2';

const root = document.getElementById('app');
let currentScreen: ScreenName = 'dashboard';

function renderShell() {
  if (!root) {
    return;
  }

  root.innerHTML = '';
  const state = store.getState();
  const app = document.createElement('div');
  app.className = 'app-shell';

  const header = document.createElement('header');
  header.className = 'app-header';
  header.innerHTML = `
    <div>
      <p class="eyebrow">Autism support app</p>
      <h1>Daily support</h1>
      <p class="subtle">Calm tools for energy, sensory regulation, and recovery.</p>
    </div>
  `;

  const nav = document.createElement('nav');
  nav.className = 'nav-list';
  const screens: Array<{ id: ScreenName; label: string }> = [
    { id: 'dashboard', label: 'Home' },
    { id: 'tasks', label: 'Tasks' },
    { id: 'sensory', label: 'Sensory' },
    { id: 'energy', label: 'Energy' },
    { id: 'recovery', label: 'Recovery' },
  ];

  screens.forEach(screen => {
    const button = createButton(screen.label, () => {
      currentScreen = screen.id;
      renderShell();
    }, screen.id === currentScreen ? 'primary' : 'secondary');
    button.classList.add('nav-button');
    nav.appendChild(button);
  });

  const content = document.createElement('main');
  content.className = 'screen-content';
  switch (currentScreen) {
    case 'dashboard':
      content.appendChild(renderDashboardScreen((screen: ScreenName) => {
        currentScreen = screen;
        renderShell();
      }));
      break;
    case 'tasks':
      content.appendChild(renderTaskScreen((screen: ScreenName) => {
        currentScreen = screen;
        renderShell();
      }));
      break;
    case 'sensory':
      content.appendChild(renderSensoryScreen((screen: ScreenName) => {
        currentScreen = screen;
        renderShell();
      }));
      break;
    case 'energy':
      content.appendChild(renderEnergyScreen((screen: ScreenName) => {
        currentScreen = screen;
        renderShell();
      }));
      break;
    case 'recovery':
      content.appendChild(renderRecoveryScreen((screen: ScreenName) => {
        currentScreen = screen;
        renderShell();
      }));
      break;
  }

  const summaryCard = createCard();
  const summary = document.createElement('div');
  summary.className = 'summary-strip';
  summary.innerHTML = `
    <div><strong>Energy</strong><span>${Math.round(state.currentEnergy)}%</span></div>
    <div><strong>Recovery</strong><span>${state.isRecoveryMode ? 'On' : 'Ready'}</span></div>
    <div><strong>Tasks</strong><span>${state.tasks.length}</span></div>
  `;
  summaryCard.appendChild(summary);

  app.appendChild(header);
  app.appendChild(nav);
  app.appendChild(summaryCard);
  app.appendChild(content);
  root.appendChild(app);
}

renderShell();
store.subscribe(() => renderShell());
'@;

  'index2.ts' = @'
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
}

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

  const setState = (update: Partial<AppState> | ((prev: AppState) => Partial<AppState>)) => {
    const next = typeof update === 'function' ? update(state) : update;
    state = { ...state, ...next };
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
  };
}

export const store = createAppStore();
'@;

  'ui.tsx' = @'
export function createButton(label: string, onClick: () => void, variant: 'primary' | 'secondary' = 'primary') {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = `button button-${variant}`;
  button.textContent = label;
  button.addEventListener('click', onClick);
  return button;
}

export function createCard() {
  const card = document.createElement('section');
  card.className = 'card';
  return card;
}

export function createSectionHeader(title: string, subtitle?: string) {
  const wrap = document.createElement('div');
  wrap.className = 'section-header';
  const titleEl = document.createElement('h2');
  titleEl.textContent = title;
  wrap.appendChild(titleEl);
  if (subtitle) {
    const sub = document.createElement('p');
    sub.className = 'section-subtitle';
    sub.textContent = subtitle;
    wrap.appendChild(sub);
  }
  return wrap;
}

export function createBadge(text: string, variant: 'default' | 'success' | 'danger' = 'default') {
  const badge = document.createElement('span');
  badge.className = `badge badge-${variant}`;
  badge.textContent = text;
  return badge;
}

export function createSlider(label: string, value: number, onChange: (value: number) => void) {
  const row = document.createElement('label');
  row.className = 'slider-row';

  const meta = document.createElement('div');
  meta.className = 'slider-meta';
  const labelEl = document.createElement('span');
  labelEl.textContent = label;
  const valueEl = document.createElement('strong');
  valueEl.textContent = String(value);
  meta.appendChild(labelEl);
  meta.appendChild(valueEl);

  const input = document.createElement('input');
  input.type = 'range';
  input.min = '1';
  input.max = '10';
  input.value = String(value);
  input.addEventListener('input', () => {
    const next = Number(input.value);
    valueEl.textContent = String(next);
    onChange(next);
  });

  row.appendChild(meta);
  row.appendChild(input);
  return row;
}
'@;

  'dashboardscreen.tsx' = @'
import { store } from './index2';
import { createBadge, createButton, createCard, createSectionHeader } from './ui';

function getTimeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const hour = 3600000;
  if (diff < hour) return `${Math.round(diff / 60000)}m ago`;
  if (diff < 24 * hour) return `${Math.round(diff / hour)}h ago`;
  return 'yesterday';
}

function energyLabel(value: number): string {
  if (value >= 70) return 'High';
  if (value >= 40) return 'Medium';
  if (value >= 20) return 'Low';
  return 'Very low';
}

export function renderDashboardScreen(navigate: (screen: string) => void) {
  const state = store.getState();
  const latestSensory = state.sensoryLogs[0];
  const activeTask = state.tasks.find(task => task.id === state.activeTaskId);

  const container = document.createElement('div');
  container.className = 'screen-card';
  container.appendChild(createSectionHeader('Today at a glance', 'A calm cockpit for energy, tasks, and sensory state.'));

  const energyCard = createCard();
  energyCard.innerHTML = `
    <div class="stack">
      <div class="row-between">
        <div>
          <h3>Energy today</h3>
          <p class="muted">${energyLabel(state.currentEnergy)} capacity</p>
        </div>
        <div class="energy-pill">${Math.round(state.currentEnergy)}%</div>
      </div>
      <div class="meter"><span style="width:${state.currentEnergy}%"></span></div>
      <p class="muted">${state.currentEnergy >= 60 ? 'You have enough energy for a few meaningful actions.' : 'Protect your energy and keep the day light.'}</p>
    </div>
  `;
  container.appendChild(energyCard);

  const taskCard = createCard();
  if (activeTask) {
    taskCard.innerHTML = `
      <div class="stack">
        <div class="row-between">
          <h3>Current task</h3>
          ${createBadge('In progress', 'success').outerHTML}
        </div>
        <p><strong>${activeTask.goal}</strong></p>
        <p>${activeTask.steps[activeTask.currentStepIndex]?.text ?? 'You are all caught up.'}</p>
      </div>
    `;
  } else {
    taskCard.innerHTML = `
      <div class="stack">
        <h3>Tasks</h3>
        <p class="muted">Break a goal into small steps so it feels manageable.</p>
        ${createButton('Open task support', () => navigate('tasks')).outerHTML}
      </div>
    `;
  }
  container.appendChild(taskCard);

  const sensoryCard = createCard();
  sensoryCard.innerHTML = `
    <div class="stack">
      <div class="row-between">
        <h3>Sensory snapshot</h3>
        ${latestSensory ? `<span class="muted">${getTimeAgo(latestSensory.timestamp)}</span>` : ''}
      </div>
      ${latestSensory ? `<p class="muted">Noise ${latestSensory.noise}/10 • Light ${latestSensory.light}/10 • Crowd ${latestSensory.crowding}/10</p>` : '<p class="muted">No recent check-in yet.</p>'}
    </div>
  `;
  container.appendChild(sensoryCard);

  const actions = createCard();
  actions.innerHTML = `
    <div class="stack">
      <h3>Quick actions</h3>
      <div class="quick-grid">
        <button class="mini-button" data-screen="tasks">Break down a task</button>
        <button class="mini-button" data-screen="sensory">Log sensory state</button>
        <button class="mini-button" data-screen="energy">Log energy</button>
        <button class="mini-button" data-screen="recovery">Recovery mode</button>
      </div>
    </div>
  `;
  actions.querySelectorAll<HTMLElement>('[data-screen]').forEach(button => {
    button.addEventListener('click', () => navigate(button.dataset.screen ?? 'dashboard'));
  });
  container.appendChild(actions);

  return container;
}
'@;

  'taskscreen.tsx' = @'
import { store } from './index2';
import { createBadge, createButton, createCard, createSectionHeader } from './ui';

function breakGoalIntoSteps(goal: string) {
  const normalized = goal.trim();
  return [
    `Gather what you need for ${normalized}`,
    `Start with the first small piece of ${normalized}`,
    `Check whether ${normalized} is complete enough for now`,
  ];
}

export function renderTaskScreen(navigate: (screen: string) => void) {
  const state = store.getState();
  const container = document.createElement('div');
  container.className = 'screen-card';
  container.appendChild(createSectionHeader('Task breakdown', 'Enter a goal and the app turns it into a simple sequence of steps.'));

  const formCard = createCard();
  formCard.innerHTML = '<h3>What do you need to do?</h3>';
  const textarea = document.createElement('textarea');
  textarea.className = 'field';
  textarea.placeholder = 'e.g. clean the kitchen or make pasta';
  const button = createButton('Create steps', () => {
    const goal = textarea.value.trim();
    if (!goal) {
      return;
    }
    const steps = breakGoalIntoSteps(goal).map((text, index) => ({ id: `${Date.now()}_${index}`, text, done: false }));
    store.addTask({ goal, steps, energyCost: 'medium' });
    textarea.value = '';
  });
  formCard.appendChild(textarea);
  formCard.appendChild(button);
  container.appendChild(formCard);

  if (state.tasks.length > 0) {
    const listCard = createCard();
    listCard.appendChild(createSectionHeader('Your tasks'));
    state.tasks.forEach(task => {
      const item = document.createElement('div');
      item.className = 'task-item';
      const done = task.steps.filter(step => step.done).length;
      const summary = `${done}/${task.steps.length} steps done`;
      const nextStep = task.steps.find(step => !step.done);
      item.innerHTML = `
        <div class="row-between">
          <strong>${task.goal}</strong>
          ${createBadge(task.steps.every(step => step.done) ? 'Done' : 'In progress', task.steps.every(step => step.done) ? 'success' : 'default').outerHTML}
        </div>
        <p class="muted">${summary}</p>
        <div class="stack compact">
          ${task.steps.map(step => `<div class="step-row ${step.done ? 'done' : ''}">${step.text}</div>`).join('')}
        </div>
      `;
      const actionRow = document.createElement('div');
      actionRow.className = 'row-between';
      const nextButton = createButton(nextStep ? 'Mark next step done' : 'Completed', () => {
        if (!nextStep) {
          return;
        }
        const stepIndex = task.steps.findIndex(step => step.id === nextStep.id);
        store.completeStep(task.id, stepIndex);
      });
      actionRow.appendChild(nextButton);
      item.appendChild(actionRow);
      listCard.appendChild(item);
    });
    container.appendChild(listCard);
  }

  const footer = document.createElement('div');
  footer.className = 'stack';
  footer.appendChild(createButton('Back to dashboard', () => navigate('dashboard')));
  container.appendChild(footer);

  return container;
}
'@;

  'sensoryscreen.tsx' = @'
import { store } from './index2';
import { createBadge, createButton, createCard, createSectionHeader, createSlider } from './ui';

function analyzePatterns(logs: Array<{ noise: number; mood: number; eventType?: string }>): string[] {
  const insights: string[] = [];
  if (logs.length < 2) {
    return insights;
  }
  const highNoise = logs.filter(log => log.noise >= 7);
  if (highNoise.length >= 2) {
    insights.push(`High-noise moments were linked to lower mood in ${highNoise.length} check-ins.`);
  }
  const overloads = logs.filter(log => log.eventType === 'overload' || log.eventType === 'meltdown');
  if (overloads.length > 0) {
    insights.push(`You logged ${overloads.length} overload events. A quieter place may help next time.`);
  }
  return insights;
}

export function renderSensoryScreen(navigate: (screen: string) => void) {
  const state = store.getState();
  const patterns = analyzePatterns(state.sensoryLogs);
  const container = document.createElement('div');
  container.className = 'screen-card';
  container.appendChild(createSectionHeader('Sensory check-in', 'Use a few taps to log noise, light, crowding, and mood.'));

  const formCard = createCard();
  formCard.innerHTML = '<h3>How are things right now?</h3>';

  const values = {
    noise: 5,
    light: 5,
    crowding: 5,
    smell: 3,
    temperature: 5,
    clothing: 5,
    mood: 5,
    energy: 5,
  };

  const sliderWrap = document.createElement('div');
  sliderWrap.className = 'stack';
  const sliders: Array<[string, keyof typeof values]> = [
    ['Noise', 'noise'],
    ['Light', 'light'],
    ['Crowding', 'crowding'],
    ['Smell', 'smell'],
    ['Temperature', 'temperature'],
    ['Clothing comfort', 'clothing'],
    ['Mood', 'mood'],
    ['Energy', 'energy'],
  ];

  sliders.forEach(([label, key]) => {
    const slider = createSlider(label, values[key], value => {
      values[key] = value;
    });
    sliderWrap.appendChild(slider);
  });

  const note = document.createElement('textarea');
  note.className = 'field';
  note.placeholder = 'Optional note';

  const saveButton = createButton('Save check-in', () => {
    store.addSensoryLog({
      timestamp: Date.now(),
      noise: values.noise,
      light: values.light,
      crowding: values.crowding,
      smell: values.smell,
      temperature: values.temperature,
      clothing: values.clothing,
      mood: values.mood,
      energy: values.energy,
      note: note.value.trim() || undefined,
      location: 'Current spot',
    });
    note.value = '';
  });

  formCard.appendChild(sliderWrap);
  formCard.appendChild(note);
  formCard.appendChild(saveButton);
  container.appendChild(formCard);

  const patternCard = createCard();
  patternCard.appendChild(createSectionHeader('Pattern hints'));
  if (patterns.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'muted';
    empty.textContent = 'Log a few entries and the app will start noticing useful trends.';
    patternCard.appendChild(empty);
  } else {
    patterns.forEach(pattern => {
      const item = document.createElement('div');
      item.className = 'hint-row';
      item.textContent = pattern;
      patternCard.appendChild(item);
    });
  }
  container.appendChild(patternCard);

  const historyCard = createCard();
  historyCard.appendChild(createSectionHeader('Recent history'));
  state.sensoryLogs.slice(0, 4).forEach(log => {
    const entry = document.createElement('div');
    entry.className = 'history-entry';
    entry.innerHTML = `
      <div class="row-between">
        <strong>${log.location ?? 'Check-in'}</strong>
        ${createBadge(log.eventType ?? 'Logged').outerHTML}
      </div>
      <p class="muted">Noise ${log.noise}/10 • Light ${log.light}/10 • Mood ${log.mood}/10</p>
    `;
    historyCard.appendChild(entry);
  });
  container.appendChild(historyCard);

  const footer = document.createElement('div');
  footer.className = 'stack';
  footer.appendChild(createButton('Back to dashboard', () => navigate('dashboard')));
  container.appendChild(footer);

  return container;
}
'@;

  'energyscreen.tsx' = @'
import { store } from './index2';
import { createButton, createCard, createSectionHeader } from './ui';

const presets = [
  { label: 'Good sleep', type: 'rest' as const, cost: 35 },
  { label: 'Crowded social event', type: 'social' as const, cost: -24 },
  { label: 'Focused work block', type: 'work' as const, cost: -12 },
  { label: 'Quiet walk', type: 'travel' as const, cost: -6 },
  { label: 'Decompression break', type: 'rest' as const, cost: 18 },
];

function timeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const hour = 3600000;
  if (diff < hour) return `${Math.round(diff / 60000)}m ago`;
  if (diff < 24 * hour) return `${Math.round(diff / hour)}h ago`;
  return 'yesterday';
}

export function renderEnergyScreen(navigate: (screen: string) => void) {
  const state = store.getState();
  const todayEntries = state.energyEntries.filter(entry => new Date(entry.timestamp).toDateString() === new Date().toDateString());

  const container = document.createElement('div');
  container.className = 'screen-card';
  container.appendChild(createSectionHeader('Energy budgeting', 'Track activities as energy costs and keep the day sustainable.'));

  const banner = createCard();
  banner.innerHTML = `
    <div class="stack">
      <h3>Connect health data</h3>
      <p class="muted">Sleep, resting heart rate, and steps from Apple Health, Google Fit, Garmin, or Oura can feed this view later.</p>
    </div>
  `;
  container.appendChild(banner);

  const main = createCard();
  main.innerHTML = `
    <div class="stack">
      <div class="row-between">
        <div>
          <h3>Current energy</h3>
          <p class="muted">${state.currentEnergy >= 60 ? 'Enough for a few meaningful actions.' : 'Light tasks and rest blocks only right now.'}</p>
        </div>
        <div class="energy-pill">${Math.round(state.currentEnergy)}%</div>
      </div>
      <div class="meter"><span style="width:${state.currentEnergy}%"></span></div>
      <div class="row-between">
        ${createButton('+5', () => store.setCurrentEnergy(state.currentEnergy + 5)).outerHTML}
        ${createButton('-5', () => store.setCurrentEnergy(state.currentEnergy - 5)).outerHTML}
      </div>
    </div>
  `;
  container.appendChild(main);

  const presetsCard = createCard();
  presetsCard.appendChild(createSectionHeader('Quick presets'));
  const presetList = document.createElement('div');
  presetList.className = 'stack compact';
  presets.forEach(preset => {
    const row = document.createElement('button');
    row.className = 'preset-row';
    row.textContent = `${preset.label} ${preset.cost > 0 ? `+${preset.cost}` : preset.cost}`;
    row.addEventListener('click', () => store.addEnergyEntry({ timestamp: Date.now(), activity: preset.label, activityType: preset.type, cost: preset.cost }));
    presetList.appendChild(row);
  });
  presetsCard.appendChild(presetList);
  container.appendChild(presetsCard);

  const entriesCard = createCard();
  entriesCard.appendChild(createSectionHeader('Today’s entries'));
  if (todayEntries.length === 0) {
    entriesCard.appendChild(document.createTextNode('No entries yet.'));
  } else {
    const list = document.createElement('div');
    list.className = 'stack compact';
    todayEntries.slice().reverse().forEach(entry => {
      const item = document.createElement('div');
      item.className = 'history-entry';
      item.innerHTML = `
        <div class="row-between">
          <strong>${entry.activity}</strong>
          <span class="energy-value ${entry.cost >= 0 ? 'positive' : 'negative'}">${entry.cost >= 0 ? '+' : ''}${entry.cost}</span>
        </div>
        <p class="muted">${timeAgo(entry.timestamp)}</p>
      `;
      list.appendChild(item);
    });
    entriesCard.appendChild(list);
  }
  container.appendChild(entriesCard);

  const footer = document.createElement('div');
  footer.className = 'stack';
  footer.appendChild(createButton('Back to dashboard', () => navigate('dashboard')));
  container.appendChild(footer);

  return container;
}
'@;

  'recoveryscreen.tsx' = @'
import { store } from './index2';
import { createButton, createCard, createSectionHeader } from './ui';

export function renderRecoveryScreen(navigate: (screen: string) => void) {
  const state = store.getState();
  const container = document.createElement('div');
  container.className = 'screen-card';

  if (state.isRecoveryMode) {
    const modeCard = createCard();
    modeCard.innerHTML = `
      <div class="stack">
        <h3>Recovery mode</h3>
        <p class="muted">You are safe. One instruction at a time.</p>
        <ol>
          ${state.crisisPlan.groundingSteps.map(step => `<li>${step}</li>`).join('')}
        </ol>
        ${createButton('Return to app', () => store.toggleRecoveryMode()).outerHTML}
      </div>
    `;
    container.appendChild(modeCard);
    return container;
  }

  container.appendChild(createSectionHeader('Recovery mode', 'A calm, minimal layer for overwhelm and shutdown.'));

  const activateCard = createCard();
  activateCard.innerHTML = `
    <div class="stack">
      <h3>Feeling overwhelmed?</h3>
      <p class="muted">Switch to a higher-contrast, one-step-at-a-time view that reduces decision load.</p>
      ${createButton('Enter recovery mode', () => store.toggleRecoveryMode()).outerHTML}
    </div>
  `;
  container.appendChild(activateCard);

  const planCard = createCard();
  planCard.appendChild(createSectionHeader('Your crisis plan'));
  const helps = document.createElement('ul');
  state.crisisPlan.whatHelps.forEach(item => {
    const li = document.createElement('li');
    li.textContent = item;
    helps.appendChild(li);
  });
  planCard.appendChild(helps);
  container.appendChild(planCard);

  const footer = document.createElement('div');
  footer.className = 'stack';
  footer.appendChild(createButton('Back to dashboard', () => navigate('dashboard')));
  container.appendChild(footer);

  return container;
}
'@;

  'package.json' = @'
{
  "name": "autisim-app",
  "private": true,
  "scripts": {
    "build": "tsc -p tsconfig.json"
  },
  "devDependencies": {
    "typescript": "^5.9.3"
  }
}
'@;

  'tsconfig.json' = @'
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ES2020",
    "moduleResolution": "node",
    "lib": ["ES2020", "DOM"],
    "strict": true,
    "skipLibCheck": true,
    "rootDir": ".",
    "outDir": "dist"
  },
  "include": ["*.ts", "*.tsx"]
}
'@;

  'styles.css' = @'
:root {
  color-scheme: light;
  font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  background: #f4f6fb;
  color: #1c2536;
}

body {
  margin: 0;
  background: linear-gradient(180deg, #f7f8fa 0%, #eef3f7 100%);
}

* { box-sizing: border-box; }

button, textarea, input { font: inherit; }

#app { min-height: 100vh; }

.app-shell {
  max-width: 900px;
  margin: 0 auto;
  padding: 24px 16px 48px;
}

.app-header {
  background: #ffffff;
  border: 1px solid #e5ebf2;
  border-radius: 24px;
  padding: 20px 24px;
  box-shadow: 0 8px 24px rgba(13, 27, 42, 0.06);
  margin-bottom: 16px;
}

.eyebrow {
  text-transform: uppercase;
  letter-spacing: 0.2em;
  font-size: 0.75rem;
  color: #5c6c80;
  margin: 0 0 6px;
}

h1, h2, h3, p { margin: 0; }

.subtle, .muted, .section-subtitle {
  color: #6b7890;
}

.nav-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 16px;
}

.button {
  border: none;
  border-radius: 999px;
  padding: 10px 16px;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.button:hover { transform: translateY(-1px); }

.button-primary {
  background: #3d7a8a;
  color: white;
}

.button-secondary {
  background: #eef3f7;
  color: #29404f;
}

.card, .screen-card {
  background: white;
  border: 1px solid #e5ebf2;
  border-radius: 20px;
  padding: 18px;
  box-shadow: 0 8px 24px rgba(13, 27, 42, 0.05);
  margin-bottom: 16px;
}

.section-header {
  margin-bottom: 10px;
}

.section-header h2 {
  font-size: 1.1rem;
  margin-bottom: 4px;
}

.summary-strip {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin-bottom: 16px;
}

.summary-strip > div {
  background: white;
  border: 1px solid #e5ebf2;
  border-radius: 16px;
  padding: 12px 14px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stack { display: flex; flex-direction: column; gap: 10px; }
.stack.compact { gap: 6px; }
.row-between { display: flex; justify-content: space-between; align-items: center; gap: 10px; }

.energy-pill {
  background: #e6f2f4;
  color: #2b5965;
  border-radius: 999px;
  padding: 6px 10px;
  font-weight: 600;
}

.meter {
  height: 10px;
  background: #edf2f7;
  border-radius: 999px;
  overflow: hidden;
}

.meter > span {
  display: block;
  height: 100%;
  background: linear-gradient(90deg, #4a8c6a 0%, #3d7a8a 100%);
  border-radius: inherit;
}

.badge {
  display: inline-block;
  border-radius: 999px;
  padding: 4px 8px;
  font-size: 0.82rem;
  font-weight: 600;
}

.badge-default { background: #eef3f7; color: #4f5e6f; }
.badge-success { background: #ebf7ee; color: #356a46; }
.badge-danger { background: #faeaea; color: #9c4040; }

.field, textarea {
  width: 100%;
  border: 1px solid #d9e2eb;
  border-radius: 12px;
  padding: 10px 12px;
  resize: vertical;
  min-height: 44px;
}

.slider-row {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.slider-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.slider-row input { accent-color: #3d7a8a; }

.task-item, .history-entry, .hint-row {
  border: 1px solid #e9eef4;
  border-radius: 14px;
  padding: 12px;
  background: #fbfcfe;
}

.step-row {
  border-radius: 10px;
  padding: 8px 10px;
  background: #f3f7fb;
}

.step-row.done { text-decoration: line-through; color: #7a8698; }

.quick-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.mini-button, .preset-row {
  border: 1px solid #dfe7ef;
  border-radius: 12px;
  background: #f7fafc;
  color: #29404f;
  padding: 10px 12px;
  cursor: pointer;
  text-align: left;
}

.energy-value.positive { color: #356a46; }
.energy-value.negative { color: #9c4040; }

@media (max-width: 640px) {
  .summary-strip, .quick-grid { grid-template-columns: 1fr; }
  .app-shell { padding: 12px 10px 40px; }
}
'@;

  'docs/CHANGE_SUMMARY.md' = @'
# Change summary

## What changed
- Replaced the broken React Native-style screen modules with a browser-first TypeScript implementation that runs from the existing HTML shell.
- Added a lightweight local store so task, sensory, energy, and recovery state are shared across screens.
- Introduced a simple DOM-based UI layer so the app can run without external React or React Native dependencies.
- Added build configuration and a stylesheet so the app can be built and opened in a browser.

## Why these changes matter
- The app now matches the MVP focus from the product spec: task breakdown, sensory check-ins, energy budgeting, and recovery mode.
- The structure is easier to port to a mobile wrapper later while still supporting a web version now.
- The implementation keeps the tone calm, low-friction, and privacy-aware rather than over-engineered.
'@;

  'docs/FILE_STRUCTURE.md' = @'
# File structure diagram

```mermaid
flowchart TD
  A[index.html] --> B[index.ts]
  B --> C[index2.ts]
  B --> D[dashboardscreen.tsx]
  B --> E[taskscreen.tsx]
  B --> F[sensoryscreen.tsx]
  B --> G[energyscreen.tsx]
  B --> H[recoveryscreen.tsx]
  B --> I[ui.tsx]
  C --> J[store state]
  D --> J
  E --> J
  F --> J
  G --> J
  H --> J
  J --> K[future mobile wrapper / native shell]
```

## Notes
- The current app is web-first, but the shared state and screen modules are isolated so they can be reused in a future mobile build.
- Health integrations from phones, wearables, and rings can be added as future extensions without rewriting the core experience.
'@;
}

foreach ($entry in $files.GetEnumerator()) {
  $path = $entry.Key
  $content = $entry.Value
  Set-Content -Path $path -Value $content -Encoding utf8
}
