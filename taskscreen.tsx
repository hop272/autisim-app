import { store } from './index2.js';
import { createBadge, createButton, createCard, createSectionHeader } from './ui.js';

const RULES = [
  {
    keywords: ['pasta', 'cook', 'food', 'dinner', 'make'],
    prep: ['Wash your hands', 'Gather ingredients, pots, and utensils'],
    steps: ['Fill a pot with water', 'Turn on the heat', 'Set a timer so you don’t forget'],
    sensory: 'Kitchen sounds or smells can be strong. Consider headphones or a fan.',
    cleanup: ['Turn off the heat source', 'Rinse used items']
  },
  {
    keywords: ['clean', 'dishes', 'kitchen', 'tidy', 'wash up'],
    prep: ['Put on gloves if you dislike wet textures', 'Clear a space for drying'],
    steps: ['Rinse everything first', 'Put away 5 items that are out of place', 'Wipe just one surface'],
    sensory: 'If the water noise is too much, try listening to music.',
    cleanup: ['Dry your hands', 'Take a 5-minute transition break']
  },
  {
    keywords: ['shower', 'bath', 'wash', 'hygiene'],
    prep: ['Lay out a towel and clean clothes', 'Check the water temperature with your hand'],
    steps: ['Get in', 'Use soap/shampoo', 'Dry off thoroughly'],
    sensory: 'Dim the lights if they are too bright in the bathroom.',
    cleanup: ['Hang up the towel', 'Moisturize if your skin feels tight']
  },
  {
    keywords: ['email', 'message', 'call', 'admin', 'write'],
    prep: ['Open the app or site you need', 'Have a glass of water nearby'],
    steps: ['Write just the greeting', 'Write one main sentence', 'Read it once'],
    sensory: 'Focus on the screen can be tiring. Look at something far away for 20 seconds.',
    cleanup: ['Close the tab or app', 'Check it off your list']
  }
];

function breakGoalIntoSteps(goal: string) {
  const normalized = goal.toLowerCase();
  const rule = RULES.find(r => r.keywords.some(k => normalized.includes(k)));

  if (rule) {
    const sensoryStep = rule.sensory ? [`💡 Sensory: ${rule.sensory}`] : [];
    return [...sensoryStep, ...rule.prep, ...rule.steps, ...rule.cleanup];
  }

  return [
    `Go to the place where you do "${goal}"`,
    `Gather 3 tools you need for this`,
    `Perform one physical action that takes < 2 minutes`,
    `Check if it is "good enough" for now`,
    `Put away any tools you used`,
    `Acknowledge that "${goal}" is complete.`
  ];
}

export function renderTaskScreen(navigate: (screen: string) => void) {
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
