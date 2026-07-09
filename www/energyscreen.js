import { store } from './index2.js';
import { createButton, createCard, createSectionHeader } from './ui.js';
const presets = [
    { label: 'Good sleep', type: 'rest', cost: 35 },
    { label: 'Crowded social event', type: 'social', cost: -24 },
    { label: 'Focused work block', type: 'work', cost: -12 },
    { label: 'Quiet walk', type: 'travel', cost: -6 },
    { label: 'Decompression break', type: 'rest', cost: 18 },
];
function timeAgo(timestamp) {
    const diff = Date.now() - timestamp;
    const hour = 3600000;
    if (diff < hour)
        return `${Math.round(diff / 60000)}m ago`;
    if (diff < 24 * hour)
        return `${Math.round(diff / hour)}h ago`;
    return 'yesterday';
}
export function renderEnergyScreen(navigate) {
    const state = store.getState();
    const todayEntries = state.energyEntries.filter(entry => new Date(entry.timestamp).toDateString() === new Date().toDateString());
    const container = document.createElement('div');
    container.className = 'screen-card';
    container.appendChild(createSectionHeader('Energy budgeting', 'Track activities as energy costs and keep the day sustainable.'));
    // Health integration UI removed for now - kept in framework for future use
    /*
    if (!state.hasSeenHealthOnboarding) {
      const onboarding = createCard();
      onboarding.style.backgroundColor = '#f0f7ff';
      onboarding.style.borderColor = '#007aff';
      onboarding.innerHTML = `
        <div class="stack">
          <h3>✨ Smart Energy Tracking</h3>
          <p>Would you like to automatically estimate your morning energy using sleep and step data from Samsung Health / Google Fit?</p>
          <div class="row" id="onboarding-actions" style="gap: 10px; margin-top: 10px;"></div>
        </div>
      `;
      const actions = onboarding.querySelector('#onboarding-actions');
      if (actions) {
        actions.appendChild(createButton('Enable Health Sync', () => {
          store.setHealthSyncEnabled(true);
          store.setHasSeenHealthOnboarding(true);
          syncMorningEnergy();
        }));
        actions.appendChild(createButton('Maybe Later', () => {
          store.setHasSeenHealthOnboarding(true);
        }, 'secondary'));
      }
      container.appendChild(onboarding);
    } else if (state.healthSyncEnabled) {
      const syncCard = createCard();
      syncCard.innerHTML = `
        <div class="row-between">
          <div class="stack">
            <h3>Health Connect</h3>
            <p class="muted">Connected to Samsung Health</p>
          </div>
          <div id="sync-action"></div>
        </div>
      `;
      syncCard.querySelector('#sync-action')?.appendChild(createButton('Sync Now', () => syncMorningEnergy(), 'secondary'));
      container.appendChild(syncCard);
    } else {
      const banner = createCard();
      banner.innerHTML = `
        <div class="stack">
          <h3>Manual Tracking</h3>
          <p class="muted">Health sync is disabled. You can enable it in Settings.</p>
        </div>
      `;
      container.appendChild(banner);
    }
    */
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
      <div class="row-between" id="energy-actions">
      </div>
    </div>
  `;
    const energyActions = main.querySelector('#energy-actions');
    if (energyActions) {
        energyActions.appendChild(createButton('+5', () => store.setCurrentEnergy(state.currentEnergy + 5)));
        energyActions.appendChild(createButton('-5', () => store.setCurrentEnergy(state.currentEnergy - 5)));
    }
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
    }
    else {
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
