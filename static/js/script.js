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

// Create an audio context for the sound effects
let audioContext = null;

// Play barcode scanner sound (cooler with more dynamic frequencies)
function playBarcodeScanSound() {
  try {
    // Initialize audio context if not already done
    if (!audioContext) {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Set the oscillator to a square wave for a more "beep"-like sound
    oscillator.type = 'square';
    gainNode.gain.value = 0.4; // Slightly quieter to make it less harsh
    
    oscillator.start();
    
    // Start with a high frequency and gradually lower it in a more sweeping motion
    oscillator.frequency.setValueAtTime(2000, audioContext.currentTime); // Initial high frequency
    oscillator.frequency.exponentialRampToValueAtTime(400, audioContext.currentTime + 0.15); // Sweep down in a cool way
    
    // Add a quick rise and fall in frequency for a scanner-like rhythm
    setTimeout(() => {
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.2); // Slight rise
      oscillator.frequency.exponentialRampToValueAtTime(1800, audioContext.currentTime + 0.3); // Then rise again
    }, 100);
    
    // Stop after a very short time to mimic the beep of a scanner
    setTimeout(() => {
      oscillator.stop();
    }, 350);
  } catch (error) {
    console.error("Error playing scan sound:", error);
  }
}

// Play success sound (two-tone with smoother transitions and harmonic richness)
function playSuccessSound() {
  try {
    // Initialize audio context if not already done
    if (!audioContext) {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    
    const oscillator1 = audioContext.createOscillator();
    const oscillator2 = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator1.connect(gainNode);
    oscillator2.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Set oscillator properties for richer sound
    oscillator1.type = 'sine';
    oscillator2.type = 'sine';
    gainNode.gain.value = 0.4; // Slightly softer volume for smoother sound
    
    // Success sound: start with two different frequencies to add harmonic depth
    oscillator1.frequency.value = 1200;
    oscillator2.frequency.value = 1600; // Higher note for harmonic richness
    oscillator1.start();
    oscillator2.start();
    
    // Create a smooth fade from one frequency to another
    setTimeout(() => {
      oscillator1.frequency.exponentialRampToValueAtTime(1500, audioContext.currentTime + 0.15); // Raise 1st oscillator
      oscillator2.frequency.exponentialRampToValueAtTime(1900, audioContext.currentTime + 0.15); // Raise 2nd oscillator
    }, 100);
    
    // Stop the oscillators after both notes have been played
    setTimeout(() => {
      oscillator1.stop();
      oscillator2.stop();
    }, 300);
  } catch (error) {
    console.error("Error playing success sound:", error);
  }
}


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
      // Play barcode scanner sound
      playBarcodeScanSound();
      
      // Vibrate device if supported
      if (navigator.vibrate) {
        navigator.vibrate(300);
      }
      
      showToast("QR detected.");
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
  // Hide scan view
  document.getElementById("scan-view").classList.add("hidden");
  
  currentParticipantId = participantId;
  
  // Get reference to participant data
  const participantRef = database.ref('participants/' + participantId);
  
  participantRef.once('value')
    .then((snapshot) => {
      const data = snapshot.val();
      if (data) {
        // Show participant info section
        document.getElementById("participant-info").classList.remove("hidden");
        
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
        // Keep participant info hidden
        document.getElementById("participant-info").classList.add("hidden");
        showToast("Participant not found");
        
        // Show not found message or return to scan
        setTimeout(() => {
          document.getElementById("scan-view").classList.remove("hidden");
          startScanner(); // Restart scanner
        }, 2000);
      }
    })
    .catch(error => {
      // Keep participant info hidden
      document.getElementById("participant-info").classList.add("hidden");
      showToast("Database error: " + error.message);
      
      // Return to scan view after error
      setTimeout(() => {
        document.getElementById("scan-view").classList.remove("hidden");
        startScanner(); // Restart scanner
      }, 2000);
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
      // Play success sound when update completes
      playSuccessSound();
      
      // Vibrate with different pattern to indicate success
      if (navigator.vibrate) {
        navigator.vibrate([100, 50, 100]);
      }
      
      showToast("Update successful");
      updateCpDisplay();
    })
    .catch((error) => {
      showToast("Update failed: " + error.message);
    });
}

function resetAndScanAgain() {
  currentParticipantId = null;
  document.getElementById("participant-info").classList.add("hidden");
  document.getElementById("scan-view").classList.remove("hidden");
  startScanner();
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
  
  // Add event listener for scan again button if you have one
  const scanAgainBtn = document.getElementById("scan-again-btn");
  if (scanAgainBtn) {
    scanAgainBtn.addEventListener("click", resetAndScanAgain);
  }
});