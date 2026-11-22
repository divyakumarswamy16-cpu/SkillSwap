export async function renderProfilePage(container, user) {
  container.innerHTML = `
    <h2>SkillSwap Dashboard</h2>
    <p>Welcome, ${user.email}!</p>
    <p>Student profile module will be integrated soon.</p>
  `;
}