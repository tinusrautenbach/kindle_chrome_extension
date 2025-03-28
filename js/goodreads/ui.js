// UI-related functionality for Goodreads search

// Initialize UI elements and event listeners
function initializeUI() {
  const statusDiv = document.getElementById('status');
  const progressBar = document.getElementById('progress-bar');
  const resultsDiv = document.getElementById('results');
  const downloadBtn = document.getElementById('downloadBtn');
  const stopBtn = document.getElementById('stopBtn');
  const threadCountInput = document.getElementById('threadCount');
  const updateThreadsBtn = document.getElementById('updateThreads');
  
  // Hide download button initially
  downloadBtn.classList.add('hidden');
  
  // Add stop button click handler
  stopBtn.addEventListener('click', function() {
    shouldStopProcessing = true;
    statusDiv.textContent = 'Stopping processing...';
    this.disabled = true;
    this.textContent = 'Stopping...';
  });
  
  // Add download button click handler
  downloadBtn.addEventListener('click', downloadEnhancedData);
  
  // Add thread count update handler
  updateThreadsBtn.addEventListener('click', function() {
    const newThreadCount = parseInt(threadCountInput.value);
    
    if (isNaN(newThreadCount) || newThreadCount < 1 || newThreadCount > 50) {
      alert('Please enter a valid number between 1 and 50');
      threadCountInput.value = MAX_THREADS;
      return;
    }
    
    // Update the thread count
    MAX_THREADS = newThreadCount;
    
    // Start additional threads if needed and we're still processing
    const additionalThreads = MAX_THREADS - activeThreads;
    if (additionalThreads > 0 && currentBookIndex < booksData.length && !shouldStopProcessing) {
      statusDiv.textContent = `Updated to ${MAX_THREADS} threads. Starting ${additionalThreads} new threads...`;
      
      for (let i = 0; i < additionalThreads; i++) {
        startProcessingThread();
      }
    } else {
      statusDiv.textContent = `Thread count updated to ${MAX_THREADS}. Will apply to new processing.`;
    }
  });
}

// Update the timer and estimate remaining time
function updateTimer() {
  const timerDiv = document.getElementById('timer');
  const estimateDiv = document.getElementById('time-estimate');
  if (!timerDiv || !estimateDiv) return;
  
  // Update elapsed time
  const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
  const hours = Math.floor(elapsedSeconds / 3600);
  const minutes = Math.floor((elapsedSeconds % 3600) / 60);
  const seconds = elapsedSeconds % 60;
  
  timerDiv.textContent = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  
  // Calculate and update estimated remaining time
  if (elapsedSeconds > 5 && enhancedData.length > 0) {
    // Calculate processing rate (books per second)
    const booksPerSecond = enhancedData.length / elapsedSeconds;
    
    // Calculate remaining books and time
    const remainingBooks = booksData.length - enhancedData.length;
    if (booksPerSecond > 0) {
      const remainingSeconds = Math.ceil(remainingBooks / booksPerSecond);
      
      // Format remaining time
      const remHours = Math.floor(remainingSeconds / 3600);
      const remMinutes = Math.floor((remainingSeconds % 3600) / 60);
      const remSeconds = remainingSeconds % 60;
      
      const remainingTime = `${remHours.toString().padStart(2, '0')}:${remMinutes.toString().padStart(2, '0')}:${remSeconds.toString().padStart(2, '0')}`;
      estimateDiv.textContent = `Est. remaining: ${remainingTime}`;
    }
  } else {
    estimateDiv.textContent = 'Est. remaining: calculating...';
  }
}

// Display a book result in the results list
function displayBookResult(book, goodreadsData) {
  const resultsDiv = document.getElementById('results');
  
  // Create book result item
  const bookItem = document.createElement('div');
  bookItem.className = 'book-item';
  
  const itemNumber = enhancedData.length;
  
  // Create clickable links
  const readUrl = book.read_url || '';
  const goodreadsUrl = goodreadsData.goodreadsUrl || '';
  
  const readLink = readUrl ? `<a href="${readUrl}" target="_blank" class="read-link">Read</a>` : '';
  const goodreadsLink = goodreadsUrl ? `<a href="${goodreadsUrl}" target="_blank" class="goodreads-link">Goodreads</a>` : '';
  
  if (goodreadsData.found) {
    bookItem.innerHTML = `
      <span class="item-number">#${itemNumber}</span>
      <strong>${book.s_title || 'Unknown Title'}</strong> by ${book.s_author || 'Unknown Author'}<br>
      <strong>Genres:</strong> ${goodreadsData.gd_genre ? goodreadsData.gd_genre.join(', ') : 'N/A'}<br>
      <strong>Language:</strong> ${goodreadsData.language || 'N/A'}<br>
      <div class="book-links">${readLink} ${goodreadsLink}</div>
    `;
  } else {
    bookItem.innerHTML = `
      <span class="item-number">#${itemNumber}</span>
      <strong>${book.s_title || 'Unknown Title'}</strong> by ${book.s_author || 'Unknown Author'}<br>
      <em>No Goodreads data found.</em><br>
      <div class="book-links">${readLink}</div>
    `;
  }
  
  // Prepend the new item to the top of the results
  if (resultsDiv.firstChild) {
    resultsDiv.insertBefore(bookItem, resultsDiv.firstChild);
  } else {
    resultsDiv.appendChild(bookItem);
  }
}

// Display error message in the results list
function displayErrorResult(book, errorMessage) {
  const resultsDiv = document.getElementById('results');
  
  const bookItem = document.createElement('div');
  bookItem.className = 'book-item error-item';
  bookItem.innerHTML = `
    <strong>Error processing:</strong> ${book.s_title || 'Unknown Title'} - ${errorMessage}
  `;
  
  // Prepend to top of list
  if (resultsDiv.firstChild) {
    resultsDiv.insertBefore(bookItem, resultsDiv.firstChild);
  } else {
    resultsDiv.appendChild(bookItem);
  }
}
