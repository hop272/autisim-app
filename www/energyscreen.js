import { store } from './index2.js';
import { createButton, createCard, createSectionHeader } from './ui.js';
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
    const todayEntries = (state.energyEntries || []).filter(entry => new Date(entry.timestamp).toDateString() === new Date().toDateString());
    const container = document.createElement('div');
    container.className = 'screen-card';
    container.appendChild(createSectionHeader('Energy budgeting', 'Track activities as energy costs and keep the day sustainable.'));
    const main = createCard();
    // ... (unchanged part)
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
    (state.energyPresets || []).forEach(preset => {
        const row = document.createElement('div');
        row.className = 'preset-row-container';
        const useBtn = document.createElement('button');
        useBtn.className = 'preset-row';
        useBtn.style.flex = '1';
        useBtn.textContent = `${preset.label} ${preset.cost > 0 ? `+${preset.cost}` : preset.cost}`;
        useBtn.addEventListener('click', () => store.addEnergyEntry({ timestamp: Date.now(), activity: preset.label, activityType: preset.type, cost: preset.cost }));
        const delBtn = document.createElement('button');
        delBtn.className = 'preset-delete';
        delBtn.innerHTML = '×';
        delBtn.title = 'Remove preset';
        delBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            store.removeEnergyPreset(preset.id);
        });
        row.appendChild(useBtn);
        row.appendChild(delBtn);
        presetList.appendChild(row);
    });
    presetsCard.appendChild(presetList);
    container.appendChild(presetsCard);
    const addPresetCard = createCard();
    addPresetCard.appendChild(createSectionHeader('Create custom preset', 'Add your own activities with unique energy costs.'));
    const addPresetForm = document.createElement('div');
    addPresetForm.className = 'stack compact';
    addPresetForm.innerHTML = `
    <input type="text" id="preset-label" placeholder="Activity name" class="field">
    <div class="row-between">
      <div style="flex: 1">
        <label class="muted" style="font-size: 0.8rem; display: block; margin-bottom: 4px;">Energy change</label>
        <input type="number" id="preset-cost" placeholder="-15" class="field" style="width: 100%">
      </div>
      <div style="flex: 1">
        <label class="muted" style="font-size: 0.8rem; display: block; margin-bottom: 4px;">Category</label>
        <select id="preset-type" class="field" style="width: 100%">
          <option value="rest">Rest</option>
          <option value="work">Work</option>
          <option value="social">Social</option>
          <option value="travel">Travel</option>
          <option value="personal">Personal</option>
          <option value="other">Other</option>
        </select>
      </div>
    </div>
  `;
    const addButton = createButton('Add Preset', () => {
        const labelInput = addPresetForm.querySelector('#preset-label');
        const costInput = addPresetForm.querySelector('#preset-cost');
        const typeSelect = addPresetForm.querySelector('#preset-type');
        const label = labelInput.value.trim();
        const cost = parseInt(costInput.value);
        const type = typeSelect.value;
        if (label && !isNaN(cost)) {
            store.addEnergyPreset({ label, cost, type });
            labelInput.value = '';
            costInput.value = '';
        }
    }, 'secondary');
    addPresetForm.appendChild(addButton);
    addPresetCard.appendChild(addPresetForm);
    container.appendChild(addPresetCard);
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
