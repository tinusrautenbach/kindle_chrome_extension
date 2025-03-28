// Main entry point for Goodreads search functionality

// Global variables
let booksData = [];
let enhancedData = [];
let currentBookIndex = 0;
let shouldStopProcessing = false;
let activeThreads = 0;
let MAX_THREADS = 5;
let processingComplete = false;
let startTime;
let timerInterval;
let lastProcessedCount = 0;
let processingRates = [];

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  // Initialize UI elements
  initializeUI();
  
  // Load Kindle data from storage
  loadKindleData();
});

// Load Kindle library data from Chrome storage
function loadKindleData() {
  const statusDiv = document.getElementById('status');
  
  chrome.storage.local.get(['kindleLibraryData'], function(result) {
    if (chrome.runtime.lastError || !result.kindleLibraryData) {
      statusDiv.textContent = 'Error loading book data. Please scrape your library first.';
      return;
    }
    
    booksData = result.kindleLibraryData.listItems;
    
    if (booksData.length === 0) {
      statusDiv.textContent = 'No books found in the scraped data.';
      return;
    }
    
    statusDiv.textContent = `Processing ${booksData.length} books from your Kindle library...`;
    
    // Start the timer
    startTime = Date.now();
    updateTimer();
    timerInterval = setInterval(updateTimer, 1000);
    
    // Start multiple processing threads
    for (let i = 0; i < MAX_THREADS; i++) {
      startProcessingThread();
    }
  });
}
