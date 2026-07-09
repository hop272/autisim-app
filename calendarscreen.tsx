import { store } from './index2.js';
import { createBadge, createButton, createCard, createSectionHeader } from './ui.js';
import { syncPhoneCalendar } from './calendarService.js';

export function renderCalendarScreen(navigate: (screen: string) => void) {
  const state = store.getState();
  const container = document.createElement('div');
  container.className = 'screen-card';
  container.appendChild(createSectionHeader('Visual Planner', 'A sensory-aware view of your day.'));

  const syncCard = createCard();
  syncCard.style.backgroundColor = '#f0f4f8';
  syncCard.innerHTML = `
    <div class="row-between">
      <div style="flex: 1">
        <h3>Phone Calendar Sync</h3>
        <p class="muted">Connect to your device's calendar to see appointments here.</p>
      </div>
      <div id="sync-button-container"></div>
    </div>
  `;

  const syncBtn = createButton('Sync Now', async () => {
    const btn = syncBtn as HTMLButtonElement;
    const originalText = btn.textContent;
    btn.textContent = 'Syncing...';
    btn.disabled = true;

    const success = await syncPhoneCalendar();

    btn.textContent = originalText;
    btn.disabled = false;

    if (success) {
      // Re-render handled by store subscription in index.ts
    } else {
      alert('Sync failed. Please ensure permissions are granted and the plugin is correctly configured.');
    }
  }, 'secondary');
  syncCard.querySelector('#sync-button-container')?.appendChild(syncBtn);
  container.appendChild(syncCard);

  const eventsList = document.createElement('div');
  eventsList.className = 'stack';
  eventsList.style.marginTop = '20px';

  if (state.calendarEvents.length === 0) {
    eventsList.innerHTML = `<p class="muted" style="text-align: center; padding: 40px;">No events scheduled for today.</p>`;
  } else {
    // Sort events by start time
    const sortedEvents = [...state.calendarEvents].sort((a, b) => a.startTime - b.startTime);

    sortedEvents.forEach(event => {
      const eventCard = createCard();
      const startTime = new Date(event.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const endTime = new Date(event.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      let sensoryInfo = '';
      if (event.sensoryProfile) {
        const { noise, light, crowding } = event.sensoryProfile;
        const totalLoad = (noise + light + crowding) / 3;
        const severity = totalLoad > 7 ? 'danger' : totalLoad > 4 ? 'default' : 'success';
        const severityText = totalLoad > 7 ? 'High Load' : totalLoad > 4 ? 'Moderate' : 'Low Load';

        sensoryInfo = `
          <div class="sensory-mini-report">
            <div class="row-between">
               <span class="subtle" style="font-size: 0.8rem">Sensory Prediction</span>
               <span class="badge badge-${severity}" style="font-size: 0.7rem; padding: 2px 8px;">${severityText}</span>
            </div>
            <div class="mini-bars">
              <div class="mini-bar-item"><span>🔊</span> <div class="bar-bg"><div class="bar-fill" style="width: ${noise * 10}%"></div></div></div>
              <div class="mini-bar-item"><span>💡</span> <div class="bar-bg"><div class="bar-fill" style="width: ${light * 10}%"></div></div></div>
              <div class="mini-bar-item"><span>👥</span> <div class="bar-bg"><div class="bar-fill" style="width: ${crowding * 10}%"></div></div></div>
            </div>
          </div>
        `;
      }

      eventCard.innerHTML = `
        <div class="event-visual-row">
          <div class="event-icon-box">${event.icon || '📅'}</div>
          <div class="event-details stack compact">
            <div class="row-between">
              <h3 style="font-size: 1.1rem">${event.title}</h3>
              <span class="event-time">${startTime}</span>
            </div>
            ${event.location ? `<p class="muted" style="font-size: 0.9rem; margin: 0">📍 ${event.location}</p>` : ''}
            ${sensoryInfo}
            ${event.energyCost ? `<p class="energy-impact ${event.energyCost < 0 ? 'negative' : 'positive'}">Energy: ${event.energyCost}%</p>` : ''}
          </div>
        </div>
      `;

      if (event.sensoryProfile && (event.sensoryProfile.noise > 7 || event.sensoryProfile.crowding > 7)) {
          const warning = document.createElement('div');
          warning.className = 'sensory-warning-pill';
          warning.innerHTML = `⚠️ High sensory event. Suggesting noise cancellation.`;
          eventCard.appendChild(warning);
      }

      eventsList.appendChild(eventCard);
    });
  }

  container.appendChild(eventsList);

  const addBtn = createButton('+ Add Routine Block', () => {
    alert('Custom routine blocks can be added here.');
  }, 'primary');
  addBtn.style.marginTop = '20px';
  addBtn.style.width = '100%';
  container.appendChild(addBtn);

  return container;
}
