import { store } from './index2.js';
import { createBadge, createButton, createCard, createSectionHeader } from './ui.js';

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
    button.addEventListener('click', () => navigate(button.dataset.screen ?? ('dashboard' as any)));
  });
  container.appendChild(actions);

  return container;
}
