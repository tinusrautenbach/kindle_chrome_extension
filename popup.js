document.addEventListener('DOMContentLoaded', function() {
  const scrapeButton = document.getElementById('scrapeButton');
  const goodreadsButton = document.getElementById('goodreadsButton');
  const statusDiv = document.getElementById('status');
  const statsButton = document.getElementById('statsButton');
  
  let scrapedData = null;
  
  // Function to update status
  function updateStatus(message, type = 'info') {
    statusDiv.textContent = message;
    statusDiv.className = 'status ' + type;
  }
  
  // Scrape Kindle Library
  scrapeButton.addEventListener('click', function() {
    updateStatus('Scraping library...', 'info');
    
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      const activeTab = tabs[0];
      
      // Check if the current page is the Kindle library
      if (!activeTab.url.includes('read.amazon.com/kindle-library')) {
        updateStatus('Please navigate to your Kindle Library first!', 'error');
        return;
      }
      
      // First inject the content script manually to ensure it's available
      chrome.scripting.executeScript({
        target: { tabId: activeTab.id },
        files: ['content.js']
      }).then(() => {
        // Then send message to content script to start scraping
        chrome.tabs.sendMessage(activeTab.id, {action: "scrapepage"}, function(response) {
          if (chrome.runtime.lastError) {
            updateStatus('Error: ' + chrome.runtime.lastError.message, 'error');
            return;
          }
          
          if (response && response.status === 'success') {
            updateStatus('Scraping started! JSON will download when complete.', 'success');
          } else {
            updateStatus('Unknown response from content script.', 'error');
          }
        });
      }).catch(error => {
        updateStatus('Error injecting script: ' + error.message, 'error');
      });
    });
  });
  
  // Search Goodreads for book data
  goodreadsButton.addEventListener('click', function() {
    updateStatus('Loading latest scrape data...', 'info');
    
    // Get the latest scraped data from storage
    chrome.storage.local.get(['kindleLibraryData'], function(result) {
      if (chrome.runtime.lastError) {
        updateStatus('Error retrieving data: ' + chrome.runtime.lastError.message, 'error');
        return;
      }
      
      if (!result.kindleLibraryData || !result.kindleLibraryData.listItems || result.kindleLibraryData.listItems.length === 0) {
        updateStatus('No data available. Please scrape your library first.', 'error');
        return;
      }
      
      updateStatus('Starting Goodreads search for ' + result.kindleLibraryData.listItems.length + ' books...', 'info');
      
      // Create a new tab to process the Goodreads search
      chrome.tabs.create({url: 'goodreads-search.html'});
    });
  });

  // Stats button
  if (statsButton) {
    statsButton.addEventListener('click', function() {
      chrome.tabs.create({url: 'stats.html'});
    });
  }
});
