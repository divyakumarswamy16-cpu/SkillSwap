import './style.css';

import { auth, authReady } from './firebase/firebase.js';
import { onAuthStateChanged } from 'firebase/auth';
import { renderAuthPage } from './pages/authPage.js';
import { renderNavigation } from './components/navigation.js';
import { logoutUser } from './auth/auth.js';
import { renderRequestsPage } from "./members/requests.js";

const app = document.querySelector('#app');

let currentUser = null;

function renderDashboard() {
  app.innerHTML = `
    <header id="navigation"></header>
    <main class="dashboard">
      <h1>Welcome to SkillSwap!</h1>
      <div id="pageContent">
        <p>Your dashboard is ready.</p>
      </div>
    </main>
  `;

  renderNavigation(
    document.getElementById('navigation'),
    currentUser,
    navigate,
    logoutUser
  );

  navigate('profile');
}

async function navigate(page) {
  const container = document.getElementById('pageContent');

  if (!container) return;

  container.innerHTML = '<p>Loading...</p>';

  try {
    if (page === 'profile') {
      const module = await import('./members/profile.js');
      await module.renderProfilePage(container, currentUser);

    } else if (page === 'discovery') {
      const module = await import('./members/discovery.js');
      await module.renderDiscoveryPage(container, currentUser);

    } else if (page === 'requests') {
      const module = await import('./members/requests.js');
      await module.renderRequestsPage(container, currentUser);
    }

  } catch (error) {
    console.error(error);

    container.innerHTML =
      '<h2>This section is awaiting teammate integration.</h2>';
  }
}

async function startApp() {
  await authReady;

  onAuthStateChanged(auth, (user) => {
    currentUser = user;

    if (user) {
      renderDashboard();
    } else {
      app.innerHTML = '';

      const authContainer = document.createElement('div');
      app.appendChild(authContainer);

      renderAuthPage(authContainer);
    }
  });
}

startApp();