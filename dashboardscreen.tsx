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
  const latestSensory = (state.sensoryLogs || [])[0];
  const activeTask = (state.tasks || []).find(task => task.id === state.activeTaskId);

  const container = document.createElement('div');
  container.className = 'screen-card';
  container.appendChild(createSectionHeader('Today at a glance', 'A calm cockpit for energy, tasks, and sensory state.'));

  // Early Warning Banner (§3.6)
  if (state.overloadRisk && state.overloadRisk !== 'low') {
    const warningBanner = createCard();
    const isHigh = state.overloadRisk === 'high';
    warningBanner.style.backgroundColor = isHigh ? '#FFF5F5' : '#FFFBEB';
    warningBanner.style.borderColor = isHigh ? '#FEB2B2' : '#FDE68A';
    warningBanner.style.marginBottom = '16px';
    warningBanner.innerHTML = `
      <div class="row-between">
        <div class="stack compact">
          <h4 style="color: ${isHigh ? '#C53030' : '#92400E'}; margin: 0;">
            ${isHigh ? '⚠️ High Overload Risk' : '💡 Moderate Overload Risk'}
          </h4>
          <p class="muted" style="font-size: 0.85rem; margin: 0;">
            ${isHigh
              ? 'Multiple stress indicators detected. Consider entering Recovery Mode now.'
              : 'Your data suggests you might be heading toward overwhelm. Take a sensory break?'}
          </p>
        </div>
        ${isHigh ? createButton('Recovery', () => navigate('recovery'), 'primary').outerHTML : ''}
      </div>
    `;
    // If it's high, the button HTML above won't have the event listener, so I need to re-bind or do it differently.
    const recoveryBtn = warningBanner.querySelector('button');
    if (recoveryBtn) {
        recoveryBtn.addEventListener('click', () => navigate('recovery'));
    }
    container.appendChild(warningBanner);
  }

  const energyCard = createCard();
  energyCard.style.cursor = 'pointer';
  energyCard.addEventListener('click', () => navigate('energy'));
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
    const isDone = activeTask.steps.every(s => s.done);
    taskCard.innerHTML = `
      <div class="stack">
        <div class="row-between">
          <h3>Current task</h3>
          ${createBadge(isDone ? 'Done' : 'In progress', isDone ? 'success' : 'default').outerHTML}
        </div>
        <p><strong>${activeTask.goal}</strong></p>
        <p>${!isDone ? activeTask.steps[activeTask.currentStepIndex]?.text : 'You have completed all steps.'}</p>
        <div id="task-dashboard-actions"></div>
      </div>
    `;
    const dashboardTaskActions = taskCard.querySelector('#task-dashboard-actions');
    if (dashboardTaskActions) {
      if (isDone) {
        dashboardTaskActions.appendChild(createButton('Clear finished task', () => store.clearTask(activeTask.id), 'secondary'));
      } else {
        dashboardTaskActions.appendChild(createButton('Open task details', () => navigate('tasks'), 'secondary'));
      }
    }
  } else {
    taskCard.innerHTML = `
      <div class="stack">
        <h3>Tasks</h3>
        <p class="muted">Break a goal into small steps so it feels manageable.</p>
      </div>
    `;
    taskCard.querySelector('.stack')?.appendChild(createButton('Open task support', () => navigate('tasks')));
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

  const nextEvent = (state.calendarEvents || [])
    .filter(e => e.startTime > Date.now())
    .sort((a, b) => a.startTime - b.startTime)[0];

  if (nextEvent) {
    const plannerCard = createCard();
    plannerCard.style.cursor = 'pointer';
    plannerCard.addEventListener('click', () => navigate('calendar'));
    plannerCard.innerHTML = `
      <div class="stack">
        <div class="row-between">
          <h3>Next in Planner</h3>
          <span class="event-time">${new Date(nextEvent.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
        <p><strong>${nextEvent.icon || '📅'} ${nextEvent.title}</strong></p>
        ${nextEvent.sensoryProfile && (nextEvent.sensoryProfile.noise > 7) ? '<p class="energy-impact negative">⚠️ High sensory expected</p>' : ''}
      </div>
    `;
    container.appendChild(plannerCard);
  }

  const actions = createCard();
  actions.innerHTML = `
    <div class="stack">
      <h3>Quick actions</h3>
      <div class="quick-grid">
        <button class="mini-button" data-screen="calendar">Visual planner</button>
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
