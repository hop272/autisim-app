import { store, User } from './index2.js';
import { createButton, createCard, createSectionHeader } from './ui.js';
import { supabase } from './supabase.js';

export function renderAccountScreen(navigate: (screen: string) => void) {
  const state = store.getState();
  const container = document.createElement('div');
  container.className = 'stack';

  // 1. Profile Section
  const authCard = createCard();
  if (state.user && state.user.id !== 'local-user') {
    authCard.innerHTML = `
      <div class="stack" style="align-items: center; text-align: center;">
        <div style="font-size: 3rem; margin-bottom: 10px;">${state.user.imageUrl || '👤'}</div>
        <h3>${state.user.name || 'User'}</h3>
        <p class="muted">${state.user.email}</p>
      </div>
    `;
    const logoutBtn = createButton('Sign Out', async () => {
      try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        store.setUser(null);
      } catch (e: any) {
        console.error('Logout failed', e);
        alert('Logout failed: ' + e.message);
      }
    }, 'secondary');
    authCard.querySelector('.stack')?.appendChild(logoutBtn);
  } else {
    authCard.innerHTML = `
      <div class="stack">
        <h3>Sign In / Create Account</h3>
        <p class="muted">Sync your progress and routines across devices.</p>

        <div class="field-group">
          <label>Email</label>
          <input type="email" id="auth-email" class="field" placeholder="email@example.com" />
        </div>

        <div class="field-group">
          <label>Password</label>
          <input type="password" id="auth-password" class="field" placeholder="••••••••" />
        </div>

        <div class="row-between" style="gap: 10px; margin-top: 10px;">
          <div id="signin-container" style="flex: 1"></div>
          <div id="signup-container" style="flex: 1"></div>
        </div>
      </div>
    `;

    const signInBtn = createButton('Sign In', async () => {
      const email = (document.getElementById('auth-email') as HTMLInputElement).value;
      const password = (document.getElementById('auth-password') as HTMLInputElement).value;

      try {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        if (data.user) {
          store.setUser({
            id: data.user.id,
            email: data.user.email || '',
            name: data.user.user_metadata?.full_name || email.split('@')[0],
            imageUrl: '👤'
          });
          alert('Signed in successfully!');
        }
      } catch (e: any) {
        alert('Error: ' + e.message);
      }
    }, 'primary');

    const signUpBtn = createButton('Create Account', async () => {
      const email = (document.getElementById('auth-email') as HTMLInputElement).value;
      const password = (document.getElementById('auth-password') as HTMLInputElement).value;

      try {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        alert('Check your email for the confirmation link!');
      } catch (e: any) {
        alert('Error: ' + e.message);
      }
    }, 'secondary');

    authCard.querySelector('#signin-container')?.appendChild(signInBtn);
    authCard.querySelector('#signup-container')?.appendChild(signUpBtn);
  }
  container.appendChild(authCard);

  // 2. Settings Section
  const settingsCard = createCard();
  settingsCard.appendChild(createSectionHeader('App Settings', 'Customise your experience.'));

  const settingsList = document.createElement('div');
  settingsList.className = 'stack compact';

  // Health Sync Toggle removed from active settings
  /*
  const healthRow = document.createElement('div');
  healthRow.className = 'row-between';
  healthRow.style.padding = '8px 0';
  healthRow.innerHTML = `
    <span>Health Sync (Samsung Health)</span>
    <div id="health-toggle-container"></div>
  `;

  const toggleBtn = createButton(state.healthSyncEnabled ? 'Enabled' : 'Disabled', () => {
    store.setHealthSyncEnabled(!state.healthSyncEnabled);
    if (!state.healthSyncEnabled) {
      // If we are turning it on for the first time or from settings
      store.setHasSeenHealthOnboarding(true);
    }
    navigate('account'); // Re-render this screen
  }, state.healthSyncEnabled ? 'primary' : 'secondary');
  toggleBtn.style.padding = '4px 12px';
  toggleBtn.style.fontSize = '0.8rem';
  healthRow.querySelector('#health-toggle-container')?.appendChild(toggleBtn);

  settingsList.appendChild(healthRow);
  */

  // Other Settings
  const darkModeRow = document.createElement('div');
  darkModeRow.className = 'row-between';
  darkModeRow.style.padding = '8px 0';
  darkModeRow.innerHTML = `
    <span>Dark Mode</span>
    <div id="dark-mode-toggle-container"></div>
  `;

  const darkModeBtn = createButton(state.darkMode ? 'On' : 'Off', () => {
    store.setDarkMode(!state.darkMode);
    navigate('account'); // Re-render this screen
  }, state.darkMode ? 'primary' : 'secondary');
  darkModeBtn.style.padding = '4px 12px';
  darkModeBtn.style.fontSize = '0.8rem';
  darkModeRow.querySelector('#dark-mode-toggle-container')?.appendChild(darkModeBtn);

  settingsList.appendChild(darkModeRow);

  const notificationsRow = document.createElement('div');
  notificationsRow.className = 'row-between';
  notificationsRow.style.opacity = '0.6';
  notificationsRow.style.padding = '8px 0';
  notificationsRow.innerHTML = `
    <span>Notification Reminders</span>
    <div style="background: #eef3f7; width: 40px; height: 20px; border-radius: 20px;"></div>
  `;
  settingsList.appendChild(notificationsRow);

  settingsCard.appendChild(settingsList);
  container.appendChild(settingsCard);

  // 2.5 Coming Soon Section
  const comingSoonCard = createCard();
  comingSoonCard.style.opacity = '0.8';
  comingSoonCard.appendChild(createSectionHeader('Coming Soon', 'Features currently in development.'));
  const comingSoonList = document.createElement('div');
  comingSoonList.className = 'stack compact';
  comingSoonList.innerHTML = `
    <div class="row-between" style="padding: 8px 0;">
      <span>Samsung Health Sync</span>
      <span class="badge badge-default" style="font-size: 0.7rem;">Planned</span>
    </div>
    <div class="row-between" style="padding: 8px 0;">
      <span>Smart Watch Integration</span>
      <span class="badge badge-default" style="font-size: 0.7rem;">Planned</span>
    </div>
    <div class="row-between" style="padding: 8px 0;">
      <span>Custom Themes</span>
      <span class="badge badge-default" style="font-size: 0.7rem;">Planned</span>
    </div>
  `;
  comingSoonCard.appendChild(comingSoonList);
  container.appendChild(comingSoonCard);

  // 3. Preferences Section
  const preferenceCard = createCard();
  preferenceCard.appendChild(createSectionHeader('Preferences', 'Manage your daily targets.'));
  preferenceCard.innerHTML += `
    <div class="stack compact">
      <div class="field-group">
        <label>Daily Energy Goal (%)</label>
        <input type="number" class="field" value="${state.dailyEnergyBudget}" disabled style="background: #fbfcfe;" />
      </div>
    </div>
  `;
  container.appendChild(preferenceCard);

  return container;
}
