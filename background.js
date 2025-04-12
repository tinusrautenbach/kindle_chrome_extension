// Background script to handle extension icon clicks
chrome.action.onClicked.addListener(async (tab) => {
  console.log("Extension icon clicked!");
  
  try {
    // First, check if we can inject the content script
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["content.js"]
    });
    
    // Then send the message
    chrome.tabs.sendMessage(tab.id, { action: "scrapepage" }, (response) => {
      // Handle potential error (will prevent unhandled promise rejection)
      if (chrome.runtime.lastError) {
        console.log("Error sending message:", chrome.runtime.lastError.message);
        return;
      }
      
      console.log("Message sent successfully, response:", response);
    });
  } catch (error) {
    console.error("Error executing script:", error);
  }
});

// Listen for messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.status === "script_executed") {
    console.log("Content script executed successfully");
  }
  if (message.result === "scraping_complete") {
    console.log("Scraping completed:", message.data);
    
    // Create a timestamp for the filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `kindle-library-${timestamp}.json`;
    
    // Use the chrome.downloads API to download the data
    const jsonData = JSON.stringify(message.data, null, 2);
    
    // Create a data URL instead of using Blob
    const dataUrl = 'data:application/json;charset=utf-8,' + encodeURIComponent(jsonData);
    
    chrome.downloads.download({
      url: dataUrl,
      filename: filename,
      saveAs: false
    }, (downloadId) => {
      if (chrome.runtime.lastError) {
        console.error("Download failed:", chrome.runtime.lastError);
      } else {
        console.log("Download started with ID:", downloadId);
        
        // After successful download, automatically start the Goodreads search process
        // Short delay to ensure download has started
        setTimeout(() => {
          console.log("Automatically starting Goodreads search...");
          // Create a new tab with the goodreads-search.html page
          chrome.tabs.create({url: 'goodreads-search.html'});
        }, 1000);
      }
    });
  }
});