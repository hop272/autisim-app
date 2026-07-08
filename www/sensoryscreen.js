import { store } from './index2.js';
import { createBadge, createButton, createCard, createSectionHeader, createSlider } from './ui.js';
function analyzePatterns(logs) {
    const insights = [];
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
export function renderSensoryScreen(navigate) {
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
    const sliders = [
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
    }
    else {
        patterns.forEach(pattern => {
            const item = document.createElement('div');
            item.className = 'hint-row';
            item.textContent = pattern;
            patternCard.appendChild(item);
        });
    }
    container.appendChild(patternCard);
    const historyCard = createCard();
    const historyHeader = createSectionHeader('Recent history');
    historyCard.appendChild(historyHeader);
    if (state.sensoryLogs.length > 0) {
        historyHeader.appendChild(createButton('Clear history', () => {
            if (confirm('Clear all sensory logs?')) {
                store.clearSensoryHistory();
            }
        }, 'secondary'));
    }
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
