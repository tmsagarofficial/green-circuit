let scanner;
let currentParticipantId = null;

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCfKC0pYqb0RwWHyHwP1scqVyE8Xsrxgqk",
  authDomain: "green-ciruit.firebaseapp.com",
  databaseURL: "https://green-ciruit-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "green-ciruit",
  storageBucket: "green-ciruit.firebasestorage.app",
  messagingSenderId: "701325700675",
  appId: "1:701325700675:web:0d23f21eae2178166a2ef6"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

function showToast(message) {
  const toast = document.getElementById('toast');
  toast.innerText = message;
  toast.classList.add('show');
  toast.classList.remove('hidden');

  setTimeout(() => {
    toast.classList.remove('show');
    toast.classList.add('hidden');
  }, 2500);
}

function startScanner() {
  const reader = document.getElementById("reader");
  reader.classList.remove("hidden");
  showToast("Scanner started...");

  scanner = new Html5Qrcode("reader");

  scanner.start(
    { facingMode: "environment" },
    { fps: 10, qrbox: { width: 250, height: 250 } },
    qrCodeMessage => {
      showToast("QR detected. Fetching data...");
      scanner.stop(); // stop after 1 read
      
      // Fetch participant data using the QR code
      fetchParticipantData(qrCodeMessage);
    },
    errorMessage => {
      // Optionally log scanning errors here
    }
  ).catch(err => {
    showToast("Camera error: " + err);
  });
}

function fetchParticipantData(participantId) {
  // Hide scan view and show participant info
  document.getElementById("scan-view").classList.add("hidden");
  document.getElementById("participant-info").classList.remove("hidden");
  
  currentParticipantId = participantId;
  
  // Get reference to participant data
  const participantRef = database.ref('participants/' + participantId);
  
  participantRef.once('value')
    .then((snapshot) => {
      const data = snapshot.val();
      if (data) {
        // Populate the participant info on the page
        document.getElementById("name-value").innerText = data.Name || "-";
        document.getElementById("phone-value").innerText = data.PH_NO || data["PH NO"] || "-"; // Try both field formats
        document.getElementById("event-value").innerText = data.Event || "-";
        document.getElementById("category-value").innerText = data.Category || "-";
        
        // Set the state of CP checkboxes
        document.getElementById("cp-1").checked = data["CP-1"] === true;
        document.getElementById("cp-2").checked = data["CP-2"] === true;
        document.getElementById("cp-3").checked = data["CP-3"] === true;
        document.getElementById("cp-4").checked = data["CP-4"] === true;
        
        // Update the display of CP states
        updateCpDisplay();
        
        showToast("Data loaded");
      } else {
        showToast("Participant not found");
      }
    })
    .catch(error => {
      showToast("Database error: " + error.message);
    });
}

function updateCpDisplay() {
  // Update the visual state of each checkpoint
  for (let i = 1; i <= 4; i++) {
    const cpElement = document.getElementById(`cp-${i}-display`);
    const isChecked = document.getElementById(`cp-${i}`).checked;
    
    if (isChecked) {
      cpElement.classList.add("true");
      cpElement.classList.remove("false");
      cpElement.innerText = "TRUE";
    } else {
      cpElement.classList.add("false");
      cpElement.classList.remove("true");
      cpElement.innerText = "FALSE";
    }
  }
}

function updateCheckpoints() {
  if (!currentParticipantId) {
    showToast("No participant selected");
    return;
  }
  
  // Get the current state of all checkpoints
  const cp1 = document.getElementById("cp-1").checked;
  const cp2 = document.getElementById("cp-2").checked;
  const cp3 = document.getElementById("cp-3").checked;
  const cp4 = document.getElementById("cp-4").checked;
  
  // Create an update object
  const updates = {
    [`participants/${currentParticipantId}/CP-1`]: cp1,
    [`participants/${currentParticipantId}/CP-2`]: cp2,
    [`participants/${currentParticipantId}/CP-3`]: cp3,
    [`participants/${currentParticipantId}/CP-4`]: cp4
  };
  
  // Update the database
  database.ref().update(updates)
    .then(() => {
      showToast("Update successful");
      updateCpDisplay();
    })
    .catch((error) => {
      showToast("Update failed: " + error.message);
    });
}

// Make CP displays clickable to toggle the checkbox
document.addEventListener('DOMContentLoaded', () => {
  for (let i = 1; i <= 4; i++) {
    const display = document.getElementById(`cp-${i}-display`);
    if (display) {
      display.addEventListener('click', () => {
        const checkbox = document.getElementById(`cp-${i}`);
        checkbox.checked = !checkbox.checked;
        updateCpDisplay();
      });
    }
  }
  
  // Add event listener for update button
  const updateBtn = document.getElementById("update-btn");
  if (updateBtn) {
    updateBtn.addEventListener("click", updateCheckpoints);
  }
});