
import {
  doc,
  getDoc,
  updateDoc
} from "firebase/firestore";

import { db } from "../firebase/firebase.js";

export async function renderProfilePage(container, user) {

  if (!user) {
    container.textContent = "Please log in to view your profile.";
    return;
  }

  const userRef = doc(db, "users", user.uid);

  container.innerHTML = `
    <section class="profile-section">

      <div class="profile-heading">
        <h2>My Student Profile</h2>
        <p>Manage your information and exchange skills.</p>
      </div>

      <div class="profile-card">

        <h3>Personal Information</h3>

        <form id="profileForm">

          <label for="studentName">Full Name</label>
          <input
            type="text"
            id="studentName"
            placeholder="Enter your name"
            required
            maxlength="60"
          />

          <label for="studentEmail">Email Address</label>
          <input
            type="email"
            id="studentEmail"
            disabled
          />

          <label for="studentBio">About Me</label>
          <textarea
            id="studentBio"
            placeholder="Tell others about yourself..."
            maxlength="300"
          ></textarea>

          <label for="skillsTeach">Skills I Can Teach</label>
          <input
            type="text"
            id="skillsTeach"
            placeholder="Python, C++, HTML"
          />

          <small>Separate skills using commas.</small>

          <label for="skillsLearn">Skills I Want to Learn</label>
          <input
            type="text"
            id="skillsLearn"
            placeholder="JavaScript, UI Design"
          />

          <small>Separate skills using commas.</small>

          <button type="submit" id="saveProfile">
            Save Profile
          </button>

        </form>

        <p id="profileMessage" role="status"></p>

      </div>

      <div class="profile-card">

        <h3>My Skills Overview</h3>

        <div>
          <h4>Skills I Teach</h4>
          <div id="teachDisplay"></div>
        </div>

        <div>
          <h4>Skills I Want to Learn</h4>
          <div id="learnDisplay"></div>
        </div>

      </div>

    </section>
  `;

  const nameInput = container.querySelector("#studentName");
  const emailInput = container.querySelector("#studentEmail");
  const bioInput = container.querySelector("#studentBio");
  const teachInput = container.querySelector("#skillsTeach");
  const learnInput = container.querySelector("#skillsLearn");

  const message = container.querySelector("#profileMessage");

  const teachDisplay = container.querySelector("#teachDisplay");
  const learnDisplay = container.querySelector("#learnDisplay");

  function convertToArray(value) {
    return [...new Set(
      value
        .split(",")
        .map(skill => skill.trim())
        .filter(Boolean)
    )];
  }

  function displaySkills(element, skills) {

    element.replaceChildren();

    if (!skills.length) {
      element.textContent = "No skills added yet.";
      return;
    }

    skills.forEach(skill => {

      const tag = document.createElement("span");

      tag.className = "skill-tag";
      tag.textContent = skill;

      element.appendChild(tag);

    });
  }

  try {

    const snapshot = await getDoc(userRef);

    let profile = {};

    if (snapshot.exists()) {
      profile = snapshot.data();
    }

    nameInput.value = profile.name || "";
    emailInput.value = user.email || "";
    bioInput.value = profile.bio || "";

    teachInput.value = (profile.skillsTeach || []).join(", ");
    learnInput.value = (profile.skillsLearn || []).join(", ");

    displaySkills(
      teachDisplay,
      profile.skillsTeach || []
    );

    displaySkills(
      learnDisplay,
      profile.skillsLearn || []
    );

  } catch (error) {

    console.error("Profile loading error:", error);

    message.textContent = "Unable to load your profile.";

    return;
  }

  container.querySelector("#profileForm")
    .addEventListener("submit", async (event) => {

      event.preventDefault();

      const button = container.querySelector("#saveProfile");

      const name = nameInput.value.trim();
      const bio = bioInput.value.trim();

      const skillsTeach = convertToArray(teachInput.value);
      const skillsLearn = convertToArray(learnInput.value);

      if (!name) {
        message.textContent = "Please enter your name.";
        return;
      }

      if (skillsTeach.length > 15 || skillsLearn.length > 15) {
        message.textContent = "You can add a maximum of 15 skills in each category.";
        return;
      }

      button.disabled = true;
      message.textContent = "Saving your profile...";

      try {

        await updateDoc(userRef, {
          name: name,
          bio: bio,
          skillsTeach: skillsTeach,
          skillsLearn: skillsLearn
        });

        displaySkills(teachDisplay, skillsTeach);
        displaySkills(learnDisplay, skillsLearn);

        message.textContent = "Profile saved successfully!";

      } catch (error) {

        console.error("Profile saving error:", error);

        message.textContent = "Unable to save profile. Please try again.";

      } finally {

        button.disabled = false;
      }
    });
}
