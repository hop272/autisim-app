import { store, User } from './index2.js';
import { createButton, createCard, createSectionHeader } from './ui.js';
import { supabase } from './supabase.js';

export function renderAccountScreen(navigate: (screen: string) => void) {
  const state = store.getState();
  const container = document.createElement('div');
  container.className = 'screen-card';
  container.appendChild(createSectionHeader('Account', 'Sign in to sync your data across devices.'));

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
        <p class="muted">Enter your email and password to sync your progress.</p>

        <div class="field-group">
          <label style="font-size: 0.85rem; color: var(--text-secondary);">Email</label>
          <input type="email" id="auth-email" class="field" placeholder="email@example.com" />
        </div>

        <div class="field-group">
          <label style="font-size: 0.85rem; color: var(--text-secondary);">Password</label>
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

  const footer = document.createElement('div');
  footer.className = 'stack';
  footer.appendChild(createButton('Back to dashboard', () => navigate('dashboard')));
  container.appendChild(footer);

  return container;
}
