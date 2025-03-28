// Processing logic for Goodreads search

// Start a processing thread
function startProcessingThread() {
  if (currentBookIndex < booksData.length && !shouldStopProcessing) {
    activeThreads++;
    processNextBook();
  }
}

// Process the next book in the queue
function processNextBook() {
  const statusDiv = document.getElementById('status');
  const progressBar = document.getElementById('progress-bar');
  
  // Get current book index and increment it atomically
  const bookIndex = currentBookIndex++;
  
  // Check if we've reached the end or should stop
  if (bookIndex >= booksData.length || shouldStopProcessing) {
    activeThreads--;
    
    // If this was the last active thread, finalize the process
    if (activeThreads === 0) {
      finalizeProcessing();
    }
    
    return;
  }
  
  // Update progress
  const progress = Math.floor((bookIndex / booksData.length) * 100);
  progressBar.style.width = `${progress}%`;
  
  const book = booksData[bookIndex];
  statusDiv.textContent = `Processing ${bookIndex + 1} of ${booksData.length}: ${book.s_title || 'Unknown Title'} (${activeThreads} active threads)`;
  
  // Skip books without ASIN
  if (!book.asin) {
    const skippedData = {
      found: false,
      reason: 'No ASIN available'
    };
    
    // Store and display the result
    storeAndDisplayResult(book, skippedData);
    
    // Start next book in this thread
    setTimeout(processNextBook, 50);
    return;
  }
  
  // Search Goodreads for the book by ASIN
  searchGoodreads(book).then(goodreadsData => {
    // Store and display the result
    storeAndDisplayResult(book, goodreadsData);
    
    // Start processing next book in this thread after a delay
    setTimeout(processNextBook, 1000);
  }).catch(error => {
    console.error("Error processing book:", error);
    
    // Display error in results
    displayErrorResult(book, error.message);
    
    // Start next book in this thread
    setTimeout(processNextBook, 1000);
  });
}

// Store enhanced book data and display the result
function storeAndDisplayResult(book, goodreadsData) {
  // Store the enhanced book data
  const enhancedBook = {
    ...book,
    goodreads: goodreadsData
  };
  
  // Add to enhanced data array
  enhancedData.push(enhancedBook);
  
  // Display result in UI
  displayBookResult(book, goodreadsData);
}

// Finalize the processing when all threads are done
function finalizeProcessing() {
  const statusDiv = document.getElementById('status');
  const stopBtn = document.getElementById('stopBtn');
  const downloadBtn = document.getElementById('downloadBtn');
  
  // Stop the timer
  clearInterval(timerInterval);
  updateTimer(); // Update one last time for accuracy
  
  // Set the estimate to zero when done
  const estimateDiv = document.getElementById('time-estimate');
  if (estimateDiv) {
    estimateDiv.textContent = 'Est. remaining: 00:00:00';
  }
  
  if (shouldStopProcessing) {
    statusDiv.textContent = `Processing stopped. Processed ${enhancedData.length} of ${booksData.length} books.`;
    stopBtn.classList.add('hidden');
  } else {
    processingComplete = true;
    statusDiv.textContent = `Completed! Processed all ${enhancedData.length} books. Opening stats page...`;
    stopBtn.classList.add('hidden');
    
    // Automatically download and open stats
    downloadEnhancedData();
  }
  
  // Make sure download button is visible in either case
  downloadBtn.disabled = false;
  downloadBtn.classList.remove('hidden');
}

// Function to download the enhanced data
function downloadEnhancedData() {
  // Create the enhanced data object
  const enhancedDataObj = {
    scrapeDate: new Date().toISOString(),
    totalBooks: enhancedData.length,
    books: enhancedData
  };
  
  // Store the data for the stats page to access
  chrome.storage.local.set({enhancedKindleData: enhancedDataObj}, function() {
    console.log("Enhanced data saved to storage");
    
    // Convert to JSON and download
    const jsonData = JSON.stringify(enhancedDataObj, null, 2);
    const dataUrl = 'data:application/json;charset=utf-8,' + encodeURIComponent(jsonData);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    
    chrome.downloads.download({
      url: dataUrl,
      filename: `enhanced-kindle-data-${timestamp}.json`,
      saveAs: false
    }, function(downloadId) {
      // Open the stats page after download starts
      chrome.tabs.create({url: 'stats.html'});
    });
  });
}
