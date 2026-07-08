export type ScreenName = 'dashboard' | 'tasks' | 'sensory' | 'energy' | 'recovery';

import { renderDashboardScreen } from './dashboardscreen.js';
import { renderEnergyScreen } from './energyscreen.js';
import { renderRecoveryScreen } from './recoveryscreen.js';
import { renderSensoryScreen } from './sensoryscreen.js';
import { renderTaskScreen } from './taskscreen.js';
import { createButton, createCard } from './ui.js';
import { store } from './index2.js';

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

  if (state.isRecoveryMode && currentScreen !== 'recovery') {
      currentScreen = 'recovery';
  }

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
      content.appendChild(renderDashboardScreen((screen: string) => {
        currentScreen = screen as ScreenName;
        renderShell();
      }));
      break;
    case 'tasks':
      content.appendChild(renderTaskScreen((screen: string) => {
        currentScreen = screen as ScreenName;
        renderShell();
      }));
      break;
    case 'sensory':
      content.appendChild(renderSensoryScreen((screen: string) => {
        currentScreen = screen as ScreenName;
        renderShell();
      }));
      break;
    case 'energy':
      content.appendChild(renderEnergyScreen((screen: string) => {
        currentScreen = screen as ScreenName;
        renderShell();
      }));
      break;
    case 'recovery':
      content.appendChild(renderRecoveryScreen((screen: string) => {
        currentScreen = screen as ScreenName;
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
  if (!state.isRecoveryMode) {
    app.appendChild(nav);
  }
  app.appendChild(summaryCard);
  app.appendChild(content);
  root.appendChild(app);
}

renderShell();
store.subscribe(() => renderShell());
