import { renderDashboardScreen } from './dashboardscreen.js';
import { renderEnergyScreen } from './energyscreen.js';
import { renderRecoveryScreen } from './recoveryscreen.js';
import { renderSensoryScreen } from './sensoryscreen.js';
import { renderTaskScreen } from './taskscreen.js';
import { renderAccountScreen } from './accountscreen.js';
import { renderCalendarScreen } from './calendarscreen.js';
import { createButton, createCard, renderLoginPrompt } from './ui.js';
import { store } from './index2.js';
import { supabase } from './supabase.js';
const getRoot = () => document.getElementById('app');
let currentScreen = 'dashboard';
// Initialize session and sync
async function initSession() {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
            await store.setUser({
                id: session.user.id,
                email: session.user.email || '',
                name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0],
                imageUrl: '👤'
            });
        }
    }
    catch (e) {
        console.error('Session init error:', e);
    }
}
function renderShell() {
    const root = getRoot();
    if (!root) {
        console.error('Root element #app not found');
        return;
    }
    root.innerHTML = '';
    const state = store.getState();
    if (state.isRecoveryMode && currentScreen !== 'recovery') {
        currentScreen = 'recovery';
    }
    // Specialized view for Account Dashboard
    if (currentScreen === 'account') {
        const accountView = document.createElement('div');
        accountView.className = 'app-shell account-dashboard';
        const backHeader = document.createElement('header');
        backHeader.className = 'app-header';
        backHeader.style.padding = '15px 24px';
        backHeader.innerHTML = `<div><h1>Account & Settings</h1></div>`;
        const backBtn = createButton('← Back to App', () => {
            currentScreen = 'dashboard';
            renderShell();
        }, 'secondary');
        backBtn.style.borderRadius = '12px';
        backHeader.appendChild(backBtn);
        const content = document.createElement('main');
        content.className = 'screen-content';
        content.appendChild(renderAccountScreen((screen) => {
            currentScreen = screen;
            renderShell();
        }));
        accountView.appendChild(backHeader);
        accountView.appendChild(content);
        root.appendChild(accountView);
        return;
    }
    const app = document.createElement('div');
    const header = document.createElement('header');
    header.className = 'app-header';
    header.innerHTML = `
    <div>
      <p class="eyebrow">Autism support app</p>
      <h1>Daily support</h1>
      <p class="subtle">Calm tools for energy, sensory regulation, and recovery.</p>
    </div>
  `;
    const accountBtn = document.createElement('button');
    accountBtn.className = `account-button ${currentScreen === 'account' ? 'active' : ''}`;
    accountBtn.innerHTML = state.user?.imageUrl || '👤';
    accountBtn.title = 'Account';
    accountBtn.addEventListener('click', () => {
        currentScreen = 'account';
        renderShell();
    });
    header.appendChild(accountBtn);
    const nav = document.createElement('nav');
    nav.className = 'nav-list';
    const screens = [
        { id: 'dashboard', label: 'Home' },
        { id: 'calendar', label: 'Planner' },
        { id: 'tasks', label: 'Tasks' },
        { id: 'sensory', label: 'Sensory' },
        { id: 'energy', label: 'Energy' },
        { id: 'recovery', label: 'Recovery' },
    ];
    screens.forEach(screen => {
        const button = createButton(screen.label, () => {
            currentScreen = screen.id;
            renderShell();
        }, screen.id === currentScreen ? 'primary' : 'secondary');
        button.classList.add('nav-button');
        nav.appendChild(button);
    });
    const content = document.createElement('main');
    content.className = 'screen-content';
    const protectedScreens = ['dashboard', 'tasks', 'sensory', 'energy', 'recovery', 'calendar'];
    if (protectedScreens.includes(currentScreen) && !state.user) {
        content.appendChild(renderLoginPrompt(() => {
            currentScreen = 'account';
            renderShell();
        }));
    }
    else {
        switch (currentScreen) {
            case 'dashboard':
                content.appendChild(renderDashboardScreen((screen) => {
                    currentScreen = screen;
                    renderShell();
                }));
                break;
            case 'tasks':
                content.appendChild(renderTaskScreen((screen) => {
                    currentScreen = screen;
                    renderShell();
                }));
                break;
            case 'sensory':
                content.appendChild(renderSensoryScreen((screen) => {
                    currentScreen = screen;
                    renderShell();
                }));
                break;
            case 'energy':
                content.appendChild(renderEnergyScreen((screen) => {
                    currentScreen = screen;
                    renderShell();
                }));
                break;
            case 'recovery':
                content.appendChild(renderRecoveryScreen((screen) => {
                    currentScreen = screen;
                    renderShell();
                }));
                break;
            case 'calendar':
                content.appendChild(renderCalendarScreen((screen) => {
                    currentScreen = screen;
                    renderShell();
                }));
                break;
        }
    }
    app.appendChild(header);
    if (state.currentEnergy <= 0 && !state.isRecoveryMode) {
        const warning = createCard();
        warning.style.backgroundColor = '#FAEAEA';
        warning.style.borderColor = '#A64040';
        warning.innerHTML = `
      <div class="stack">
        <h3 style="color: #A64040">⚡ Energy Depleted</h3>
        <p>Your battery is at 0%. Please prioritize immediate rest and avoid new tasks.</p>
      </div>
    `;
        app.appendChild(warning);
    }
    if (!state.isRecoveryMode) {
        app.appendChild(nav);
    }
    app.appendChild(content);
    root.appendChild(app);
}
// Initial render
renderShell();
store.subscribe(() => renderShell());
// Background session init
initSession();
