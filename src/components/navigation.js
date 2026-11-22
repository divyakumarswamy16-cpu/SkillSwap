export function renderNavigation(
  container,
  user,
  onNavigate,
  onLogout
) {
  container.innerHTML = `
    <nav class="navbar">
      <h2>SkillSwap</h2>

      <div class="nav-links">
        <button data-page="profile">My Profile</button>
        <button data-page="discovery">Discover Skills</button>
        <button data-page="requests">My Requests</button>
        <button id="logoutButton">Logout</button>
      </div>
    </nav>
  `;

  container.querySelectorAll("[data-page]")
    .forEach(button => {
      button.addEventListener("click", () => {
        onNavigate(button.dataset.page);
      });
    });

  document.getElementById("logoutButton")
    .addEventListener("click", onLogout);
}