import { store } from './index2.js';
import { createButton, createCard, createSectionHeader } from './ui.js';
export function renderRecoveryScreen(navigate) {
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
      </div>
    `;
        modeCard.querySelector('.stack')?.appendChild(createButton('Return to app', () => store.toggleRecoveryMode()));
        container.appendChild(modeCard);
        return container;
    }
    container.appendChild(createSectionHeader('Recovery mode', 'A calm, minimal layer for overwhelm and shutdown.'));
    const activateCard = createCard();
    activateCard.innerHTML = `
    <div class="stack">
      <h3>Feeling overwhelmed?</h3>
      <p class="muted">Switch to a higher-contrast, one-step-at-a-time view that reduces decision load.</p>
    </div>
  `;
    activateCard.querySelector('.stack')?.appendChild(createButton('Enter recovery mode', () => store.toggleRecoveryMode()));
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
