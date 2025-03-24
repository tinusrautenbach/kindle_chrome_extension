// Log when content script is loaded
console.log("Content script loaded");

// Function to scrape the page
function scrapepage() {
  console.log("Scraping the page...");
  
  // Create a loading indicator
  const loadingIndicator = document.createElement("div");
  loadingIndicator.style.position = "fixed";
  loadingIndicator.style.top = "10px";
  loadingIndicator.style.right = "10px";
  loadingIndicator.style.padding = "10px";
  loadingIndicator.style.backgroundColor = "blue";
  loadingIndicator.style.color = "white";
  loadingIndicator.style.zIndex = "9999";
  loadingIndicator.textContent = "Scrolling to load all content...";
  document.body.appendChild(loadingIndicator);
  
  // Function to scroll to the bottom of the library div
  function scrollToBottom() {
    return new Promise(resolve => {
      const libraryDiv = document.getElementById('library');
      
      // If library div doesn't exist, resolve immediately
      if (!libraryDiv) {
        console.error("Library div not found!");
        resolve();
        return;
      }
      
      let lastHeight = libraryDiv.scrollHeight;
      let scrollAttempts = 0;
      const maxScrollAttempts = 20; // Limit scrolling attempts
      
      function tryScroll() {
        // Scroll the library div instead of the window
        libraryDiv.scrollTo(0, libraryDiv.scrollHeight);
        scrollAttempts++;
        
        setTimeout(() => {
          const newHeight = libraryDiv.scrollHeight;
          
          // If height hasn't changed or we've reached max attempts, we've likely reached the bottom
          if (newHeight === lastHeight || scrollAttempts >= maxScrollAttempts) {
            // Scroll back to top for better UX
            libraryDiv.scrollTo(0, 0);
            resolve();
          } else {
            lastHeight = newHeight;
            tryScroll();
          }
        }, 800); // Wait for content to load
      }
      
      tryScroll();
    });
  }
  
  // First scroll to load all content, then do the scraping
  scrollToBottom().then(() => {
    // Update loading indicator
    loadingIndicator.textContent = "Content loaded! Scraping page...";
    loadingIndicator.style.backgroundColor = "green";
    
    // Get the page title
    const title = document.title;
    
    // Get all ul li items on the page
    const listItems = Array.from(document.querySelectorAll('ul li'));
    const listItemsContent = listItems.map((item, index) => {
      const id_f = item.id || '';
      let asin = '';
      let is_sample = false;
      // Extract ASIN from id_f if it contains hyphens
      if (id_f && id_f.includes('-')) {
        const parts = id_f.split('-');
        asin = parts[parts.length - 1]; // Get the last part after the final hyphen
      }else
      {
        return null;
      }
      if (id_f && id_f.includes('sample')) {
        is_sample = true;
      }
      // Find div elements within the list item
      const divElements = item.querySelectorAll('div');
      let s_title = '';
      let s_author = '';
      
      // Attempt to find title and author from divs
      // This is a simple approach - you may need to adjust based on the actual structure
      if (divElements.length >= 1) {
          for (let i = 0; i < divElements.length; i++) {
              const divID = divElements[i].id.trim();
              if (divID.includes('title-')) {
                  s_title = divElements[i].textContent.trim();
              } else if (divID.includes('author')) {
                  s_author = divElements[i].textContent.trim();
              }
          }
        
      }
      
      return   {
        index: index,
        text: item.textContent.trim(),
        html: item.innerHTML,
        id_f: id_f,
        asin: asin,
        s_title: s_title,
        s_author: s_author,
        is_sample: is_sample,
        read_url: "https://read.amazon.com/?asin=" + asin,
        az_url: "https://www.amazon.com/dp/" + asin,
      };
    });
    

    // Filter out null values from the listItemsContent
    const filteredListItemsContent = listItemsContent.filter(item => item !== null);
    // Create a result object with the scraped data
    const scrapedData = {
      title: title,
      url: window.location.href,
      listItems: filteredListItemsContent,
      totalItems: filteredListItemsContent.length,
      scrapeDate: new Date().toISOString()
    };
    
    // Store the scraped data in chrome.storage
    chrome.storage.local.set({kindleLibraryData: scrapedData}, function() {
      if (chrome.runtime.lastError) {
        console.error("Error storing data:", chrome.runtime.lastError);
      } else {
        console.log("Data stored successfully");
      }
    });
    
    // Send the scraped data back to the background script
    chrome.runtime.sendMessage({
      result: "scraping_complete",
      data: scrapedData
    });
    
    // Update feedback
    loadingIndicator.textContent = `Page scraped successfully! Found ${listItemsContent.length} list items.`;
    
    // Remove the feedback after 3 seconds
    setTimeout(() => {
      loadingIndicator.remove();
    }, 3000);
  });
}

// Listen for messages from the background script or popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("Message received in content script:", message);
  if (message.action === "scrapepage") {
    // Immediately send a response to prevent the "could not communicate with page" error
    sendResponse({ status: 'success' });
    
    // Then execute the scraping function
    scrapepage();
    
    // Return true to indicate we will be sending a response asynchronously
    return true;
  }
});