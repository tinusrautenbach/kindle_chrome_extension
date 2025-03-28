// Main entry point for the stats page

// Global variables to store our data
let libraryData = null;
let currentFilter = {
  genre: null,
  author: null,
  searchTerm: '',
  hideSamples: true,  // Default to hiding samples
  genres: null
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
  
  // Search input auto-update when typing
  document.getElementById('searchInput').addEventListener('input', performSearch);
  
  // Remove the previous event listener for the search button since it's redundant now
  // (Kept for backward compatibility)
  document.getElementById('searchBtn').addEventListener('click', performSearch);
  
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
  
  // Genre search functionality
  const genreSearch = document.getElementById('genreSearch');
  const genreResults = document.getElementById('genreResults');
  const activeGenreFilters = document.getElementById('activeGenreFilters');
  
  genreSearch.addEventListener('input', function() {
    const searchTerm = this.value.trim().toLowerCase();
    if (searchTerm.length < 2) {
      genreResults.classList.remove('active');
      return;
    }
    
    // Find matching genres
    const allGenres = findAllGenres();
    const matches = allGenres.filter(genre => 
      genre.toLowerCase().includes(searchTerm)
    ).sort();
    
    // Display results
    genreResults.innerHTML = '';
    if (matches.length === 0) {
      genreResults.innerHTML = '<div class="genre-item">No matching genres found</div>';
    } else {
      matches.forEach(genre => {
        const item = document.createElement('div');
        item.className = 'genre-item';
        item.textContent = genre;
        item.addEventListener('click', function() {
          addGenreFilter(genre);
          genreSearch.value = '';
          genreResults.classList.remove('active');
        });
        genreResults.appendChild(item);
      });
    }
    
    genreResults.classList.add('active');
  });
  
  // Hide genre results when clicking outside
  document.addEventListener('click', function(e) {
    if (!genreSearch.contains(e.target) && !genreResults.contains(e.target)) {
      genreResults.classList.remove('active');
    }
  });
  
  // Clear all genres button
  document.getElementById('clearGenresBtn').addEventListener('click', function() {
    clearAllGenreFilters();
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

// Find all unique genres in the library
function findAllGenres() {
  if (!libraryData || !libraryData.books) return [];
  
  const genres = new Set();
  libraryData.books.forEach(book => {
    if (book.goodreads && book.goodreads.gd_genre && Array.isArray(book.goodreads.gd_genre)) {
      book.goodreads.gd_genre.forEach(genreObj => {
        if (genreObj && genreObj.name) {
          genres.add(genreObj.name);
        }
      });
    }
  });
  
  return Array.from(genres);
}

// Add a genre filter
function addGenreFilter(genre) {
  // Check if we already have this genre filter
  if (currentFilter.genres && currentFilter.genres.includes(genre)) {
    return;
  }
  
  // Initialize genres array if needed
  if (!currentFilter.genres) {
    currentFilter.genres = [];
  }
  
  // Add the genre
  currentFilter.genres.push(genre);
  
  // Update UI
  updateActiveGenreFilters();
  
  // Apply filters
  displayBooks(filterBooks());
  
  // Update title
  updateFilterTitle();
}

// Remove a genre filter
function removeGenreFilter(genre) {
  if (!currentFilter.genres) return;
  
  const index = currentFilter.genres.indexOf(genre);
  if (index !== -1) {
    currentFilter.genres.splice(index, 1);
    
    // If no more genres, set to null
    if (currentFilter.genres.length === 0) {
      currentFilter.genres = null;
    }
    
    // Update UI
    updateActiveGenreFilters();
    
    // Apply filters
    displayBooks(filterBooks());
    
    // Update title
    updateFilterTitle();
  }
}

// Clear all genre filters
function clearAllGenreFilters() {
  currentFilter.genres = null;
  
  // Update UI
  updateActiveGenreFilters();
  
  // Apply filters
  displayBooks(filterBooks());
  
  // Update title
  updateFilterTitle();
}

// Update active genre filters display
function updateActiveGenreFilters() {
  const container = document.getElementById('activeGenreFilters');
  const clearBtn = document.getElementById('clearGenresBtn');
  container.innerHTML = '';
  
  if (!currentFilter.genres || currentFilter.genres.length === 0) {
    clearBtn.style.display = 'none';
    return;
  }
  
  container.innerHTML = '<strong>Active Genre Filters:</strong> ';
  
  currentFilter.genres.forEach(genre => {
    const badge = document.createElement('span');
    badge.className = 'genre-badge';
    badge.innerHTML = `${genre} <span class="remove">x</span>`;
    
    badge.querySelector('.remove').addEventListener('click', function() {
      removeGenreFilter(genre);
    });
    
    container.appendChild(badge);
  });
  
  // Show the clear button when we have genre filters
  clearBtn.style.display = 'inline-block';
}

// Update the title based on filters
function updateFilterTitle() {
  const titleElement = document.getElementById('booksListTitle');
  
  if (currentFilter.searchTerm) {
    titleElement.textContent = `Search Results for "${currentFilter.searchTerm}"`;
  } else if (currentFilter.genres && currentFilter.genres.length > 0) {
    if (currentFilter.genres.length === 1) {
      titleElement.textContent = `Books in "${currentFilter.genres[0]}" Genre`;
    } else {
      titleElement.textContent = `Books in Multiple Genres (${currentFilter.genres.length})`;
    }
  } else {
    titleElement.textContent = 'All Books';
  }
}
