let scanner;

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
      document.getElementById("result").innerText = qrCodeMessage;
      showToast("QR detected. Data read!");
      scanner.stop(); // stop after 1 read
    },
    errorMessage => {
      // Optionally log scanning errors here
    }
  ).catch(err => {
    document.getElementById("result").innerText = "Error: " + err;
    showToast("Camera error");
  });
}

document.getElementById("start-btn").addEventListener("click", () => {
  if (!scanner || scanner.getState() !== Html5QrcodeScannerState.SCANNING) {
    startScanner();
  }
});
