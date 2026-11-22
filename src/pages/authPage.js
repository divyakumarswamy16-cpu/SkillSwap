import {
  registerUser,
  loginUser
} from "../auth/auth.js";

export function renderAuthPage(container) {

  let mode = "login";

  function showForm() {

    const isRegister = mode === "register";

    container.innerHTML = `
      <section class="auth-container">
        <div class="auth-card">

          <h1>SkillSwap</h1>
          <p>Learn together. Grow together.</p>

          <h2>
            ${isRegister ? "Create Account" : "Welcome Back"}
          </h2>

          <form id="authForm">

            ${isRegister ? `
              <input
                id="name"
                type="text"
                placeholder="Full Name"
                required
              />
            ` : ""}

            <input
              id="email"
              type="email"
              placeholder="Email Address"
              required
            />

            <input
              id="password"
              type="password"
              placeholder="Password (minimum 6 characters)"
              minlength="6"
              required
            />

            <button type="submit">
              ${isRegister ? "Register" : "Login"}
            </button>

          </form>

          <p id="message" role="status"></p>

          <button id="switchMode" class="secondary-button">
            ${isRegister
              ? "Already have an account? Login"
              : "New student? Register"}
          </button>

        </div>
      </section>
    `;

    document.getElementById("switchMode")
      .addEventListener("click", () => {
        mode = isRegister ? "login" : "register";
        showForm();
      });

    document.getElementById("authForm")
      .addEventListener("submit", async (event) => {

        event.preventDefault();

        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value;
        const message = document.getElementById("message");

        const button = event.currentTarget.querySelector(
          'button[type="submit"]'
        );

        button.disabled = true;
        message.textContent = "Please wait...";

        try {

          if (isRegister) {

            const name = document.getElementById("name").value.trim();

            await registerUser(name, email, password);

          } else {

            await loginUser(email, password);

          }

        } catch (error) {

          message.textContent = error.message;
          button.disabled = false;

        }

      });

  }

  showForm();

}