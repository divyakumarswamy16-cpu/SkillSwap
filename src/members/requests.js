
import {
  collection,
  getDocs,
  getDoc,
  addDoc,
  doc,
  query,
  where,
  updateDoc,
  serverTimestamp
} from "firebase/firestore";

import { db } from "../firebase/firebase.js";

// Keep skill comparisons case-insensitive.
function normalizeSkill(skill) {
  return String(skill).trim().toLowerCase();
}

// Create an HTML element and insert text safely.
function createTextElement(tagName, text, className = "") {
  const element = document.createElement(tagName);
  element.textContent = text;

  if (className) {
    element.className = className;
  }

  return element;
}

// Add options to a select element.
function fillSelect(select, values, placeholder) {
  select.replaceChildren();

  const firstOption = document.createElement("option");
  firstOption.value = "";
  firstOption.textContent = placeholder;
  select.appendChild(firstOption);

  values.forEach(value => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = value;
    select.appendChild(option);
  });
}

// Main function called by Member 1's application.
export async function renderRequestsPage(container, user) {
  if (!user) {
    container.textContent = "Please log in to manage skill requests.";
    return;
  }

  container.innerHTML = `
    <section class="requests-section">

      <div class="requests-heading">
        <h2>Skill Exchange Requests</h2>
        <p>Connect with students and exchange your knowledge.</p>
      </div>

      <div class="request-form-card">
        <h3>Send a New Request</h3>

        <form id="requestForm">

          <label for="receiverSelect">Choose a student</label>
          <select id="receiverSelect" required>
            <option value="">Loading students...</option>
          </select>

          <label for="offeredSkill">Skill I can teach</label>
          <select id="offeredSkill" required>
            <option value="">Select a skill you can teach</option>
          </select>

          <label for="requestedSkill">Skill I want to learn</label>
          <select id="requestedSkill" required>
            <option value="">Select a skill they can teach</option>
          </select>

          <button type="submit" id="sendRequestButton">
            Send Request
          </button>

        </form>

        <p id="requestMessage" role="status"></p>
      </div>

      <div class="requests-list-card">
        <h3>Received Requests</h3>
        <div id="receivedRequests">
          Loading received requests...
        </div>
      </div>

      <div class="requests-list-card">
        <h3>Sent Requests</h3>
        <div id="sentRequests">
          Loading sent requests...
        </div>
      </div>

      <button type="button" id="refreshRequests">
        Refresh Requests
      </button>

    </section>
  `;

  const form = container.querySelector("#requestForm");
  const receiverSelect = container.querySelector("#receiverSelect");
  const offeredSkillSelect = container.querySelector("#offeredSkill");
  const requestedSkillSelect = container.querySelector("#requestedSkill");
  const sendButton = container.querySelector("#sendRequestButton");
  const requestMessage = container.querySelector("#requestMessage");
  const receivedContainer = container.querySelector("#receivedRequests");
  const sentContainer = container.querySelector("#sentRequests");
  const refreshButton = container.querySelector("#refreshRequests");

  let currentProfile = {};
  let students = new Map();

  // Load the logged-in student's profile.
  async function loadCurrentProfile() {
    const profileRef = doc(db, "users", user.uid);
    const profileSnapshot = await getDoc(profileRef);

    if (!profileSnapshot.exists()) {
      throw new Error("Your student profile was not found.");
    }

    currentProfile = profileSnapshot.data();

    if (!Array.isArray(currentProfile.skillsTeach)) {
      currentProfile.skillsTeach = [];
    }
  }

  // Load students for the request form.
  async function loadStudents() {
    const usersSnapshot = await getDocs(collection(db, "users"));

    students = new Map();

    usersSnapshot.forEach(studentDocument => {
      if (studentDocument.id === user.uid) return;

      const profile = studentDocument.data();

      students.set(studentDocument.id, {
        id: studentDocument.id,
        name: profile.name || "Student",
        skillsTeach: Array.isArray(profile.skillsTeach)
          ? profile.skillsTeach
          : [],
        skillsLearn: Array.isArray(profile.skillsLearn)
          ? profile.skillsLearn
          : []
      });
    });

    receiverSelect.replaceChildren();

    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = "Choose a student";
    receiverSelect.appendChild(placeholder);

    students.forEach(student => {
      const option = document.createElement("option");
      option.value = student.id;
      option.textContent = student.name;
      receiverSelect.appendChild(option);
    });

    fillSelect(
      offeredSkillSelect,
      currentProfile.skillsTeach,
      "Select a skill you can teach"
    );

    fillSelect(
      requestedSkillSelect,
      [],
      "Select a student first"
    );
  }

  // Update the skills the selected student can teach.
  receiverSelect.addEventListener("change", () => {
    const selectedStudent = students.get(receiverSelect.value);

    if (!selectedStudent) {
      fillSelect(
        requestedSkillSelect,
        [],
        "Select a student first"
      );
      return;
    }

    fillSelect(
      requestedSkillSelect,
      selectedStudent.skillsTeach,
      "Choose a skill to learn"
    );
  });

  // Create a request in Firestore.
  form.addEventListener("submit", async event => {
    event.preventDefault();

    const receiverId = receiverSelect.value;
    const offeredSkill = offeredSkillSelect.value;
    const requestedSkill = requestedSkillSelect.value;

    const receiver = students.get(receiverId);

    if (!receiver) {
      requestMessage.textContent = "Please choose a valid student.";
      return;
    }

    if (!offeredSkill || !requestedSkill) {
      requestMessage.textContent = "Please select both skills.";
      return;
    }

    // Confirm the selected skills still belong to the profiles.
    const canTeach = currentProfile.skillsTeach.some(
      skill => normalizeSkill(skill) === normalizeSkill(offeredSkill)
    );

    const receiverCanTeach = receiver.skillsTeach.some(
      skill => normalizeSkill(skill) === normalizeSkill(requestedSkill)
    );

    if (!canTeach || !receiverCanTeach) {
      requestMessage.textContent =
        "One of the selected skills is no longer available. Refresh and try again.";
      return;
    }

    sendButton.disabled = true;
    requestMessage.textContent = "Sending your request...";

    try {
      // Prevent duplicate pending requests for the same skill exchange.
      const sentQuery = query(
        collection(db, "requests"),
        where("senderId", "==", user.uid)
      );

      const sentSnapshot = await getDocs(sentQuery);

      const duplicate = sentSnapshot.docs.some(requestDocument => {
        const request = requestDocument.data();

        return (
          request.receiverId === receiverId &&
          normalizeSkill(request.offeredSkill) === normalizeSkill(offeredSkill) &&
          normalizeSkill(request.requestedSkill) === normalizeSkill(requestedSkill) &&
          request.status === "pending"
        );
      });

      if (duplicate) {
        requestMessage.textContent =
          "You already have a pending request for this skill exchange.";
        return;
      }

      await addDoc(collection(db, "requests"), {
        senderId: user.uid,
        receiverId,
        offeredSkill,
        requestedSkill,
        status: "pending",
        createdAt: serverTimestamp()
      });

      requestMessage.textContent = "Your skill exchange request was sent!";
      form.reset();

      fillSelect(
        requestedSkillSelect,
        [],
        "Select a student first"
      );

      await loadRequests();

    } catch (error) {
      console.error("Request sending error:", error);
      requestMessage.textContent =
        "Unable to send the request. Please try again.";
    } finally {
      sendButton.disabled = false;
    }
  });

  // Show one request as a card.
  function createRequestCard(request, otherStudentName, type) {
    const card = document.createElement("article");
    card.className = "request-card";

    const heading = createTextElement(
      "h4",
      otherStudentName
    );

    const exchange = createTextElement(
      "p",
      `Offers to teach: ${request.offeredSkill}`
    );

    const wanted = createTextElement(
      "p",
      `Wants to learn: ${request.requestedSkill}`
    );

    const status = createTextElement(
      "span",
      `Status: ${request.status}`,
      `request-status status-${request.status}`
    );

    card.append(heading, exchange, wanted, status);

    // Only received pending requests get action buttons.
    if (type === "received" && request.status === "pending") {
      const actions = document.createElement("div");
      actions.className = "request-actions";

      const acceptButton = createTextElement(
        "button",
        "Accept",
        "accept-request-button"
      );

      acceptButton.type = "button";

      const rejectButton = createTextElement(
        "button",
        "Reject",
        "reject-request-button"
      );

      rejectButton.type = "button";

      acceptButton.addEventListener("click", () => {
        updateRequestStatus(request.id, "accepted", acceptButton, rejectButton);
      });

      rejectButton.addEventListener("click", () => {
        updateRequestStatus(request.id, "rejected", acceptButton, rejectButton);
      });

      actions.append(acceptButton, rejectButton);
      card.appendChild(actions);
    }

    return card;
  }

  // Accept or reject a received request.
  async function updateRequestStatus(
    requestId,
    newStatus,
    acceptButton,
    rejectButton
  ) {
    acceptButton.disabled = true;
    rejectButton.disabled = true;

    try {
      const requestRef = doc(db, "requests", requestId);

      // Recheck the request before changing its status.
      const requestSnapshot = await getDoc(requestRef);

      if (!requestSnapshot.exists()) {
        throw new Error("This request no longer exists.");
      }

      const request = requestSnapshot.data();

      if (request.receiverId !== user.uid) {
        throw new Error("Only the recipient can respond to this request.");
      }

      if (request.status !== "pending") {
        throw new Error("This request has already been handled.");
      }

      await updateDoc(requestRef, {
        status: newStatus
      });

      await loadRequests();

    } catch (error) {
      console.error("Request status update error:", error);
      alert(error.message || "Unable to update the request.");
      acceptButton.disabled = false;
      rejectButton.disabled = false;
    }
  }

  // Load sent and received requests.
  async function loadRequests() {
    receivedContainer.textContent = "Loading received requests...";
    sentContainer.textContent = "Loading sent requests...";

    try {
      const requestsCollection = collection(db, "requests");

      const receivedQuery = query(
        requestsCollection,
        where("receiverId", "==", user.uid)
      );

      const sentQuery = query(
        requestsCollection,
        where("senderId", "==", user.uid)
      );

      const [receivedSnapshot, sentSnapshot] = await Promise.all([
        getDocs(receivedQuery),
        getDocs(sentQuery)
      ]);

      receivedContainer.replaceChildren();
      sentContainer.replaceChildren();

      if (receivedSnapshot.empty) {
        receivedContainer.textContent = "No requests received yet.";
      } else {
        receivedSnapshot.forEach(requestDocument => {
          const request = {
            id: requestDocument.id,
            ...requestDocument.data()
          };

          const sender = students.get(request.senderId);

          const card = createRequestCard(
            request,
            sender?.name || "Student",
            "received"
          );

          receivedContainer.appendChild(card);
        });
      }

      if (sentSnapshot.empty) {
        sentContainer.textContent = "You have not sent any requests yet.";
      } else {
        sentSnapshot.forEach(requestDocument => {
          const request = {
            id: requestDocument.id,
            ...requestDocument.data()
          };

          const receiver = students.get(request.receiverId);

          const card = createRequestCard(
            request,
            receiver?.name || "Student",
            "sent"
          );

          sentContainer.appendChild(card);
        });
      }

    } catch (error) {
      console.error("Request loading error:", error);

      receivedContainer.textContent =
        "Unable to load received requests.";

      sentContainer.textContent =
        "Unable to load sent requests.";
    }
  }

  refreshButton.addEventListener("click", async () => {
    refreshButton.disabled = true;

    try {
      await loadStudents();
      await loadRequests();
      requestMessage.textContent = "Requests refreshed.";
    } catch (error) {
      console.error("Refresh error:", error);
      requestMessage.textContent = "Unable to refresh requests.";
    } finally {
      refreshButton.disabled = false;
    }
  });

  // Initial loading.
  try {
    await loadCurrentProfile();
    await loadStudents();
    await loadRequests();
  } catch (error) {
    console.error("Request page loading error:", error);
    requestMessage.textContent =
      error.message || "Unable to load the request page.";
  }
}

export function renderRequestsPage(container, user) {
    container.innerHTML = `
        <h2>Skill Exchange Requests</h2>
        <p>Welcome to Member 4's module!</p>
    `;
}