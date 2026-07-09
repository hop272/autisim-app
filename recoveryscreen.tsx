import { store } from './index2.js';
import { createButton, createCard, createSectionHeader } from './ui.js';

export function renderRecoveryScreen(navigate: (screen: string) => void) {
  const state = store.getState();
  const container = document.createElement('div');
  container.className = 'screen-card';

  if (state.isRecoveryMode) {
    const activePlan = state.activeRecoveryPlanId
      ? state.customRecoveryPlans.find(p => p.id === state.activeRecoveryPlanId)
      : null;

    const steps = activePlan ? activePlan.steps : state.crisisPlan.groundingSteps;
    const planName = activePlan ? activePlan.name : 'Recovery mode';

    const modeCard = createCard();
    modeCard.innerHTML = `
      <div class="stack">
        <h3>${planName}</h3>
        <p class="muted">You are safe. One instruction at a time.</p>
        <ol>
          ${steps.map(step => `<li>${step}</li>`).join('')}
        </ol>
      </div>
    `;
    modeCard.querySelector('.stack')?.appendChild(createButton('Return to app', () => store.toggleRecoveryMode()));
    container.appendChild(modeCard);
    return container;
  }

  container.appendChild(createSectionHeader('Recovery mode', 'A calm, minimal layer for overwhelm and shutdown.'));

  // Active Plan Selection
  const planSelectionCard = createCard();
  planSelectionCard.appendChild(createSectionHeader('Active Recovery Plan', 'Select which plan to show in recovery mode.'));

  const selectStack = document.createElement('div');
  selectStack.className = 'stack compact';

  const defaultOption = document.createElement('label');
  defaultOption.className = 'row-between';
  defaultOption.style.padding = '8px 0';
  defaultOption.innerHTML = `
    <span>Default Grounding</span>
    <input type="radio" name="activePlan" value="default" ${!state.activeRecoveryPlanId ? 'checked' : ''}>
  `;
  defaultOption.querySelector('input')?.addEventListener('change', () => store.setActiveRecoveryPlan(null));
  selectStack.appendChild(defaultOption);

  state.customRecoveryPlans.forEach(plan => {
    const option = document.createElement('label');
    option.className = 'row-between';
    option.style.padding = '8px 0';
    option.innerHTML = `
      <span>${plan.name}</span>
      <input type="radio" name="activePlan" value="${plan.id}" ${state.activeRecoveryPlanId === plan.id ? 'checked' : ''}>
    `;
    option.querySelector('input')?.addEventListener('change', () => store.setActiveRecoveryPlan(plan.id));
    selectStack.appendChild(option);
  });

  planSelectionCard.appendChild(selectStack);
  container.appendChild(planSelectionCard);

  const activateCard = createCard();
  activateCard.innerHTML = `
    <div class="stack">
      <h3>Feeling overwhelmed?</h3>
      <p class="muted">Switch to a higher-contrast, one-step-at-a-time view that reduces decision load.</p>
    </div>
  `;
  activateCard.querySelector('.stack')?.appendChild(createButton('Enter recovery mode', () => store.toggleRecoveryMode()));
  container.appendChild(activateCard);

  // Custom Plans Management
  const managePlansCard = createCard();
  managePlansCard.appendChild(createSectionHeader('Your Custom Plans'));

  const plansList = document.createElement('div');
  plansList.className = 'stack compact';
  state.customRecoveryPlans.forEach(plan => {
    const item = document.createElement('div');
    item.className = 'row-between';
    item.style.padding = '10px';
    item.style.background = '#f9f9f9';
    item.style.borderRadius = '8px';
    item.innerHTML = `
      <div>
        <strong>${plan.name}</strong>
        <div class="muted" style="font-size: 0.8rem">${plan.steps.length} steps</div>
      </div>
    `;
    const deleteBtn = createButton('Remove', () => store.removeRecoveryPlan(plan.id), 'secondary');
    deleteBtn.style.padding = '4px 8px';
    deleteBtn.style.fontSize = '0.8rem';
    item.appendChild(deleteBtn);
    plansList.appendChild(item);
  });
  managePlansCard.appendChild(plansList);

  const addForm = document.createElement('div');
  addForm.className = 'stack';
  addForm.style.marginTop = '16px';
  addForm.style.borderTop = '1px solid #eee';
  addForm.style.paddingTop = '16px';
  addForm.innerHTML = `
    <h4>Add New Plan</h4>
    <input type="text" id="new-plan-name" placeholder="Plan Name (e.g. At Work)" class="field">
    <textarea id="new-plan-steps" placeholder="Steps (one per line)" class="field" rows="4"></textarea>
  `;
  const addBtn = createButton('Save Plan', () => {
    const nameInput = document.getElementById('new-plan-name') as HTMLInputElement;
    const stepsInput = document.getElementById('new-plan-steps') as HTMLTextAreaElement;
    if (nameInput.value && stepsInput.value) {
      const steps = stepsInput.value.split('\n').map(s => s.trim()).filter(s => s.length > 0);
      store.addRecoveryPlan({ name: nameInput.value, steps });
      nameInput.value = '';
      stepsInput.value = '';
    }
  });
  addForm.appendChild(addBtn);
  managePlansCard.appendChild(addForm);
  container.appendChild(managePlansCard);

  const planCard = createCard();
  planCard.appendChild(createSectionHeader('Your crisis plan (Original)'));
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
