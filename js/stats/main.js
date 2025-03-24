// Main entry point for the stats page

// Global variables to store our data
let libraryData = null;
let currentFilter = {
  genre: null,
  author: null,
  searchTerm: '',
  hideSamples: true  // Default to hiding samples
};

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
  initializeEventListeners();
  checkForStoredData();
});

// Set up event listeners
function initializeEventListeners() {
  // Load data button
  document.getElementById('loadDataBtn').addEventListener('click', function() {
    document.getElementById('fileInput').click();
  });
  
  // File input change
  document.getElementById('fileInput').addEventListener('change', function(event) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function(e) {
        try {
          libraryData = JSON.parse(e.target.result);
          processLibraryData();
        } catch (error) {
          alert('Error parsing the file. Please ensure it is a valid JSON file.');
          console.error(error);
        }
      };
      reader.readAsText(file);
    }
  });
  
  // Search button
  document.getElementById('searchBtn').addEventListener('click', performSearch);
  
  // Search input enter key
  document.getElementById('searchInput').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      performSearch();
    }
  });
  
  // Sort options
  document.getElementById('sortOptions').addEventListener('change', function() {
    if (libraryData) {
      displayBooks(filterBooks());
    }
  });
  
  // Modal close button
  document.querySelector('.close-btn').addEventListener('click', function() {
    document.getElementById('bookModal').style.display = 'none';
  });
  
  // Close modal when clicking outside of it
  window.addEventListener('click', function(event) {
    const modal = document.getElementById('bookModal');
    if (event.target === modal) {
      modal.style.display = 'none';
    }
  });
  
  // Add sample books filter toggle
  document.getElementById('toggleSamples').addEventListener('change', function() {
    currentFilter.hideSamples = this.checked;
    
    // Update the interface and refresh the data
    const filtered = filterBooks();
    updateLibrarySummary();
    createGenreChart();
    displayBooks(filtered);
    
    // Update the status text
    const statusElement = document.getElementById('sampleFilterStatus');
    if (statusElement) {
      statusElement.textContent = currentFilter.hideSamples ? 'Hidden' : 'Showing';
    }
  });
}

// Check for data stored in chrome.storage
function checkForStoredData() {
  if (chrome && chrome.storage) {
    chrome.storage.local.get(['enhancedKindleData'], function(result) {
      if (result.enhancedKindleData) {
        libraryData = result.enhancedKindleData;
        processLibraryData();
      }
    });
  }
}

// Process the library data to extract relevant information
function processLibraryData() {
  console.log("Processing library data...");
  
  // Debug the loaded data
  inspectData(libraryData);
  
  // Normalize the data structure
  if (libraryData.books) {
    console.log("Standard data structure detected");
  } else if (libraryData.data && libraryData.data.books) {
    console.log("Nested data structure detected, normalizing");
    libraryData = libraryData.data;
  } else if (Array.isArray(libraryData)) {
    console.log("Array data structure detected, wrapping as books");
    libraryData = { books: libraryData };
  } else {
    console.error("Unknown data structure:", libraryData);
    alert("The loaded data doesn't have the expected format. Please check the file.");
    return;
  }
  
  // Ensure book objects have the expected structure
  libraryData.books.forEach(book => {
    if (!book.goodreads) {
      book.goodreads = {};
    }
    if (!book.goodreads.genres) {
      book.goodreads.genres = [];
    }
    if (!book.goodreads.bookMetaData) {
      book.goodreads.bookMetaData = {};
    }
  });
  
  updateLibrarySummary();
  
  // Add a small delay to ensure DOM is ready
  setTimeout(() => {
    createGenreChart();
    const filtered = filterBooks();
    console.log(`Displaying ${filtered.length} books after filtering`);
    displayBooks(filtered);
  }, 100);
}

// Search function
function performSearch() {
  const searchInput = document.getElementById('searchInput');
  const searchTerm = searchInput.value.trim();
  
  if (searchTerm === '') {
    currentFilter.searchTerm = '';
    currentFilter.author = null;
  } else {
    currentFilter.searchTerm = searchTerm;
  }
  
  document.getElementById('booksListTitle').textContent = searchTerm ? 
    `Search Results for "${searchTerm}"` : 'All Books';
  
  displayBooks(filterBooks());
}
