/**
 * Filtering and sorting functionality for Kindle Library Statistics
 * 
 * This file contains functions for filtering and sorting book data
 * based on user-selected criteria like genres, authors, and search terms.
 */

/**
 * Filter books based on current filter settings
 * Applies all active filters (genres, samples, search terms, author) to the book collection
 * 
 * @returns {Array<Object>} - Array of book objects that match all filter criteria
 */
function filterBooks() {
  if (!libraryData || !libraryData.books) return [];
  
  console.log("Filtering books with criteria:", currentFilter);
  
  const filtered = libraryData.books.filter(book => {
    // Filter out sample books if the option is enabled
    if (currentFilter.hideSamples && book.is_sample) {
      return false;
    }
    
    // Genre filter - now handling multiple genres
    if (currentFilter.genres && currentFilter.genres.length > 0) {
      let matchesAnyGenre = false;
      
      for (const filterGenre of currentFilter.genres) {
        const normalizedFilterGenre = filterGenre.toLowerCase().trim();
        
        // Check in gd_genre
        if (book.goodreads && book.goodreads.gd_genre && Array.isArray(book.goodreads.gd_genre)) {
          for (const genreObj of book.goodreads.gd_genre) {
            if (genreObj && genreObj.name && genreObj.name.toLowerCase().trim() === normalizedFilterGenre) {
              matchesAnyGenre = true;
              break;
            }
          }
        }
        
        if (matchesAnyGenre) break; // No need to check other genres if we found a match
      }
      
      if (!matchesAnyGenre) return false;
    }
    
    // Single genre filter (legacy support)
    if (currentFilter.genre) {
      let hasGenre = false;
      const normalizedFilterGenre = currentFilter.genre.toLowerCase().trim();
      
      // Debug this book's genres
      console.log(`Checking if book "${book.s_title}" has genre "${normalizedFilterGenre}"`);
      
      // Check in gd_genre
      if (book.goodreads && book.goodreads.gd_genre && Array.isArray(book.goodreads.gd_genre)) {
        for (const genreObj of book.goodreads.gd_genre) {
          if (genreObj && genreObj.name && genreObj.name.toLowerCase().trim() === normalizedFilterGenre) {
            console.log("Match found in goodreads.gd_genre");
            hasGenre = true;
            break;
          }
        }
      }
      
      if (!hasGenre) {
        console.log("No genre match found");
        return false;
      }
    }
    
    // Author filter
    if (currentFilter.author) {
      let matchesAuthor = book.s_author && book.s_author.toLowerCase().includes(currentFilter.author.toLowerCase());
      
      if (!matchesAuthor && book.goodreads && book.goodreads.bookMetaData && book.goodreads.bookMetaData.author) {
        if (Array.isArray(book.goodreads.bookMetaData.author)) {
          matchesAuthor = book.goodreads.bookMetaData.author.some(a => 
            a.name && a.name.toLowerCase().includes(currentFilter.author.toLowerCase())
          );
        } else {
          matchesAuthor = book.goodreads.bookMetaData.author.name && 
            book.goodreads.bookMetaData.author.name.toLowerCase().includes(currentFilter.author.toLowerCase());
        }
      }
      
      if (!matchesAuthor) return false;
    }
    
    // Search term
    if (currentFilter.searchTerm) {
      const term = currentFilter.searchTerm.toLowerCase();
      
      // Search in title
      const titleMatch = book.s_title && book.s_title.toLowerCase().includes(term);
      
      // Search in author
      const authorMatch = book.s_author && book.s_author.toLowerCase().includes(term);
      
      // Search in description
      let descriptionMatch = false;
      if (book.goodreads && book.goodreads.bookMetaData && book.goodreads.bookMetaData.description) {
        descriptionMatch = book.goodreads.bookMetaData.description.toLowerCase().includes(term);
      }
      
      if (!titleMatch && !authorMatch && !descriptionMatch) return false;
    }
    
    return true;
  });
  
  // Apply sorting
  return sortBooks(filtered);
}

/**
 * Sort books based on selected criteria
 * Supports sorting by title, author, rating, or publication date
 * 
 * @param {Array<Object>} books - Array of book objects to sort
 * @returns {Array<Object>} - Sorted array of book objects
 */
function sortBooks(books) {
  const sortOption = document.getElementById('sortOptions').value;
  
  return books.sort((a, b) => {
    switch (sortOption) {
      case 'title':
        return (a.s_title || '').localeCompare(b.s_title || '');
      
      case 'author':
        return (a.s_author || '').localeCompare(b.s_author || '');
      
      case 'rating': {
        const ratingA = a.goodreads?.bookMetaData?.aggregateRating?.ratingValue || 0;
        const ratingB = b.goodreads?.bookMetaData?.aggregateRating?.ratingValue || 0;
        return ratingB - ratingA; // Higher ratings first
      }
      
      case 'date': {
        const dateA = formatDate(a.goodreads?.details?.publicationTime) || '';
        const dateB = formatDate(b.goodreads?.details?.publicationTime) || '';
        return dateB.localeCompare(dateA); // Newer first
      }
      
      default:
        return 0;
    }
  });
}

/**
 * Clear all active genre filters
 * Removes all genre filter criteria and updates the UI
 * 
 * @returns {undefined} - Updates filter state and refreshes book display
 */
function clearAllGenreFilters() {
  if (!currentFilter.genres || currentFilter.genres.length === 0) {
    return;
  }
  
  currentFilter.genres = null;
  
  // Update UI
  updateActiveGenreFilters();
  
  // Apply filters
  displayBooks(filterBooks());
  
  // Update title
  updateFilterTitle();
}

/**
 * Add a genre to the filter criteria
 * 
 * @param {string} genre - The genre to add to the filter
 * @returns {undefined} - Updates filter state and refreshes book display
 */
function addGenreFilter(genre) {
  if (!currentFilter.genres) {
    currentFilter.genres = [];
  }
  
  if (!currentFilter.genres.includes(genre)) {
    currentFilter.genres.push(genre);
  }
  
  // Update UI
  updateActiveGenreFilters();
  
  // Apply filters
  displayBooks(filterBooks());
  
  // Update title
  updateFilterTitle();
}

/**
 * Remove a specific genre from the filter criteria
 * 
 * @param {string} genre - The genre to remove from the filter
 * @returns {undefined} - Updates filter state and refreshes book display
 */
function removeGenreFilter(genre) {
  if (!currentFilter.genres) {
    return;
  }
  
  const index = currentFilter.genres.indexOf(genre);
  if (index !== -1) {
    currentFilter.genres.splice(index, 1);
  }
  
  // Update UI
  updateActiveGenreFilters();
  
  // Apply filters
  displayBooks(filterBooks());
  
  // Update title
  updateFilterTitle();
}

/**
 * Update the books list title based on active filters
 * Shows information about which filters are currently applied
 * 
 * @returns {undefined} - Updates the books list title in the UI
 */
function updateFilterTitle() {
  const titleElement = document.getElementById('filterTitle');
  if (!titleElement) return;
  
  let title = 'Books';
  
  if (currentFilter.genres && currentFilter.genres.length > 0) {
    title += ` - Genres: ${currentFilter.genres.join(', ')}`;
  }
  
  if (currentFilter.author) {
    title += ` - Author: ${currentFilter.author}`;
  }
  
  if (currentFilter.searchTerm) {
    title += ` - Search: "${currentFilter.searchTerm}"`;
  }
  
  titleElement.textContent = title;
}

/**
 * Find all unique genres in the library data
 * This is used for populating genre search results
 * 
 * @returns {Array<string>} - Array of all unique genre names
 */
function findAllGenres() {
  const genres = new Set();
  
  if (!libraryData || !libraryData.books) return [];
  
  libraryData.books.forEach(book => {
    if (book.goodreads && book.goodreads.gd_genre && Array.isArray(book.goodreads.gd_genre)) {
      book.goodreads.gd_genre.forEach(genreObj => {
        if (genreObj && genreObj.name) {
          genres.add(genreObj.name.trim());
        }
      });
    }
  });
  
  return Array.from(genres);
}
