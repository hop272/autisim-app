import { store } from './index2.js';
import { createBadge, createButton, createCard, createSectionHeader } from './ui.js';
function breakGoalIntoSteps(goal) {
    const normalized = goal.trim();
    return [
        `Gather what you need for ${normalized}`,
        `Start with the first small piece of ${normalized}`,
        `Check whether ${normalized} is complete enough for now`,
    ];
}
export function renderTaskScreen(navigate) {
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
