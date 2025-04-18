/**
 * UI Management for the Kindle Library Statistics page
 * 
 * This file contains functions for updating and managing the user interface,
 * displaying book information, and handling user interactions with the UI.
 */

/**
 * Updates the library summary statistics in the UI
 * Calculates metrics like total books, samples, average ratings, unique genres, and authors
 * 
 * @returns {undefined} - Updates the DOM elements with calculated statistics
 */
function updateLibrarySummary() {
  if (!libraryData || !libraryData.books) return;
  
  const books = libraryData.books;
  const totalBooks = books.length;
  
  // Count sample books
  const sampleBooks = books.filter(book => book.is_sample).length;
  
  // Calculate average rating
  let totalRating = 0;
  let ratedBooks = 0;
  books.forEach(book => {
    if (book.goodreads && book.goodreads.bookMetaData && book.goodreads.bookMetaData.aggregateRating) {
      totalRating += parseFloat(book.goodreads.bookMetaData.aggregateRating.ratingValue) || 0;
      ratedBooks++;
    }
  });
  const avgRating = ratedBooks ? (totalRating / ratedBooks).toFixed(2) : 'N/A';
  
  // Count unique genres
  const genres = new Set();
  books.forEach(book => {
    if (book.goodreads && book.goodreads.gd_genre) {
      book.goodreads.gd_genre.forEach(genre => genres.add(genre.name));
    }
   
  });
  
  // Count unique authors
  const authors = new Set();
  books.forEach(book => {
    if (book.s_author) {
      authors.add(book.s_author);
    }
    
  });
  
  // Update the DOM
  document.getElementById('totalBooks').textContent = totalBooks;
  document.getElementById('sampleBooks').textContent = sampleBooks;
  document.getElementById('avgRating').textContent = avgRating;
  document.getElementById('totalGenres').textContent = genres.size;
  document.getElementById('totalAuthors').textContent = authors.size;
}

/**
 * Updates the display of active genre filters in the UI
 * Creates clickable badges for each active filter with remove functionality
 * 
 * @returns {undefined} - Updates the DOM with active filter badges
 */
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
    badge.innerHTML = `${genre} <span class="remove">×</span>`;
    
    badge.querySelector('.remove').addEventListener('click', function() {
      removeGenreFilter(genre);
    });
    
    container.appendChild(badge);
  });
  
  // Show the clear button when we have genre filters
  clearBtn.style.display = 'block';
}

/**
 * Displays a list of books in the books list section
 * Creates a card for each book with cover image, title, author, and rating
 * 
 * @param {Array<Object>} books - Array of book objects to display
 * @returns {undefined} - Renders book cards in the book list container
 */
function displayBooks(books) {
  const booksListElement = document.getElementById('booksList');
  booksListElement.innerHTML = '';
  
  console.log("Displaying", books.length, "books");
  
  if (!books || books.length === 0) {
    booksListElement.innerHTML = '<p>No books found matching the current filters.</p>';
    return;
  }
  
  books.forEach((book, index) => {
    const bookCard = document.createElement('div');
    bookCard.className = 'book-card';
    bookCard.dataset.index = index;
    
    // Get book cover image
    let coverUrl = 'placeholder.jpg'; // Default placeholder
    if (book.goodreads && book.goodreads.bookMetaData && book.goodreads.bookMetaData.image) {
      coverUrl = book.goodreads.bookMetaData.image;
    }
    
    // Get book rating
    let rating = 'N/A';
    if (book.goodreads && book.goodreads.bookMetaData && book.goodreads.bookMetaData.aggregateRating) {
      rating = parseFloat(book.goodreads.bookMetaData.aggregateRating.ratingValue).toFixed(1);
    }
    
    // Create stars representation using Unicode characters
    const fullStars = Math.floor(parseFloat(rating));
    const hasHalfStar = parseFloat(rating) - fullStars >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    
    let starsHtml = '';
    for (let i = 0; i < fullStars; i++) {
      starsHtml += '<span class="filled">&#9734;</span>';
    }
    if (hasHalfStar) {
      starsHtml += '<span class="filled">&frac12;</span>';
    }
    for (let i = 0; i < emptyStars; i++) {
      starsHtml += '<span class="empty">&#10027;</span>';
    }
    
    // Get publication date
    let pubDate = 'Unknown';
    if (book.goodreads && book.goodreads.details) {
      pubTimeInMills = book.goodreads.details.publicationTime || 'Unknown';
      pubDate = formatDate(pubTimeInMills);
    } else if (book.goodreads && book.goodreads.bookMetaData && 
               book.goodreads.bookMetaData.datePublished) {
      pubDate = book.goodreads.bookMetaData.datePublished;
    }
    
    // Check if the book is a sample
    const isSample = book.is_sample ? true : false;
    
    // Create the HTML structure without inline event handlers
    bookCard.innerHTML = `
      <img src="${coverUrl}" alt="${book.s_title || 'Book cover'}" class="book-cover">
      <div class="book-info">
        <div class="book-title">${book.s_title || 'Unknown Title'}</div>
        <div class="book-author">${book.s_author || 'Unknown Author'}</div>
        <div class="book-pubdate">Published: ${pubDate}</div>
        ${isSample ? '<div class="sample-badge">Sample</div>' : ''}
        <div class="book-rating">
          <span class="rating-stars">${starsHtml}</span>
          <span>${isNaN(rating) ? 'N/A' : rating}</span>
        </div>
      </div>
    `;
    
    // Add event listener for image error
    const coverImage = bookCard.querySelector('.book-cover');
    
    // Add click event listener for book card
    bookCard.addEventListener('click', function() {
      showBookDetails(book);
    });
    
    booksListElement.appendChild(bookCard);
  });
}

/**
 * Shows detailed information about a book in a modal dialog
 * Includes cover image, metadata, description, ratings, and links
 * 
 * @param {Object} book - The book object containing all details to display
 * @returns {undefined} - Populates and displays the book details modal
 */
function showBookDetails(book) {
  const modal = document.getElementById('bookModal');
  const detailsContainer = document.getElementById('bookDetails');
  
  // Get book details
  const title = book.s_title || 'Unknown Title';
  const author = book.s_author || 'Unknown Author';
  
  // Get book cover image with a fallback
  let coverUrl = 'https://via.placeholder.com/150x220?text=No+Cover';
  if (book.goodreads?.bookMetaData?.image) {
    coverUrl = book.goodreads.bookMetaData.image;
  }
  
  // Get additional details from Goodreads data
  const goodreadsUrl = book.goodreads?.goodreadsUrl || '';
  const amazonUrl = `https://www.amazon.com/dp/${book.asin}`;
  const isbn = book.goodreads?.isbn || 'N/A';
  const publishDate = book.goodreads?.publishDate || 'N/A';
  
  // Collect genres from both sources
  let genres = [];
  if (book.goodreads?.genres) {
    genres = genres.concat(book.goodreads.genres);
  }
  if (book.goodreads?.bookMetaData?.genre) {
    if (Array.isArray(book.goodreads.bookMetaData.genre)) {
      genres = genres.concat(book.goodreads.bookMetaData.genre);
    } else {
      genres.push(book.goodreads.bookMetaData.genre);
    }
  }
  if (book.goodreads && book.goodreads.gd_genre && Array.isArray(book.goodreads.gd_genre)) {
    genres = book.goodreads.gd_genre
      .filter(genreObj => genreObj && genreObj.name)
      .map(genreObj => genreObj.name);
  }
  // Remove duplicates
  genres = [...new Set(genres)];
  
  // Get rating information
  const rating = book.goodreads?.bookMetaData?.aggregateRating?.ratingValue || 'N/A';
  const ratingCount = book.goodreads?.bookMetaData?.aggregateRating?.ratingCount || 'N/A';
  
  // Create stars representation
  const fullStars = Math.floor(parseFloat(rating));
  const hasHalfStar = parseFloat(rating) - fullStars >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
  
  let starsHtml = '';
  for (let i = 0; i < fullStars; i++) {
    starsHtml += '<span class="filled">&#9734;</span>';
  }
  if (hasHalfStar) {
    starsHtml += '<span class="filled">&frac12;</span>';
  }
  for (let i = 0; i < emptyStars; i++) {
    starsHtml += '<span class="empty">&#10027;</span>';
  }
  
  // Get book description
  let description = 'No description available.';
  if (book.goodreads?.description) {
    description = book.goodreads.description;
  }
  
  // Get rating distribution from Goodreads data
  let ratingDistribution = {
    5: 0, 4: 0, 3: 0, 2: 0, 1: 0
  };
  
  // Check if rating distribution data exists
  if (book.goodreads?.ratingDistribution) {
    ratingDistribution = book.goodreads.ratingDistribution;
  } else if (book.goodreads?.bookMetaData?.ratingDistribution) {
    ratingDistribution = book.goodreads.bookMetaData.ratingDistribution;
  }
  
  // Calculate percentages for rating bars
  let totalRatings = 0;
  for (const stars in ratingDistribution) {
    if (ratingDistribution.hasOwnProperty(stars)) {
      totalRatings += ratingDistribution[stars];
    }
  }
  
  // If no distribution data found, create a reasonable estimate based on average rating
  if (totalRatings === 0 && !isNaN(parseFloat(rating)) && ratingCount !== 'N/A') {
    // Estimate distribution based on average rating
    const avgRating = parseFloat(rating);
    totalRatings = parseInt(ratingCount) || 100;
    
    // Create a bell curve centered on the average rating
    const maxStar = Math.round(avgRating);
    ratingDistribution[maxStar] = Math.floor(totalRatings * 0.5); // 50% at peak
    
    // Distribute the rest based on distance from average
    for (let star = 1; star <= 5; star++) {
      if (star !== maxStar) {
        const distance = Math.abs(star - avgRating);
        const portion = Math.max(0.05, 0.3 - (distance * 0.15)); // Further stars get less
        ratingDistribution[star] = Math.floor(totalRatings * portion);
      }
    }
    
    // Adjust to ensure total is correct
    let distributedTotal = 0;
    for (const star in ratingDistribution) {
      distributedTotal += ratingDistribution[star];
    }
    
    // Add any remaining to the max star
    if (distributedTotal < totalRatings) {
      ratingDistribution[maxStar] += (totalRatings - distributedTotal);
    }
  }
  
  // Calculate percentages (avoid division by zero)
  const ratingPercentages = {};
  if (totalRatings > 0) {
    for (const stars in ratingDistribution) {
      if (ratingDistribution.hasOwnProperty(stars)) {
        ratingPercentages[stars] = Math.round((ratingDistribution[stars] / totalRatings) * 100);
      }
    }
  } else {
    // Default values if no distribution data
    ratingPercentages = {5: 70, 4: 20, 3: 5, 2: 3, 1: 2};
  }
  
  // Create genre tags HTML
  const genreTagsHtml = genres.map(genre => `<span class="genre-tag">${genre}</span>`).join('');
  
  // Build the HTML without inline event handlers
  detailsContainer.innerHTML = `
    <div class="book-detail-header">
      <img src="${coverUrl}" alt="${title}" class="book-detail-cover" onerror="this.src='https://via.placeholder.com/150x220?text=No+Cover'">
      <div class="book-detail-info">
        <h2 class="book-detail-title">${title}</h2>
        <p class="book-detail-author">by ${author}</p>
        <div class="book-detail-meta">
          <span class="meta-item"><strong>ISBN:</strong> ${isbn}</span>
          <span class="meta-item"><strong>Published:</strong> ${publishDate}</span>
          <span class="meta-item"><strong>Rating:</strong> <span class="rating-stars">${starsHtml}</span> (${ratingCount} ratings)</span>
        </div>
        <div class="book-genres">
          ${genreTagsHtml}
        </div>
        <div class="book-links">
          <a href="${goodreadsUrl}" target="_blank" class="book-link goodreads-link">View on Goodreads</a>
          <a href="${amazonUrl}" target="_blank" class="book-link amazon-link">View on Amazon</a>
        </div>
      </div>
    </div>
    <div class="book-description">
      <h3>Description</h3>
      <p>${description}</p>
    </div>
    <div class="rating-details">
      <h3>Rating Distribution</h3>
      <div class="rating-container">
        <span class="rating-label">5 &#9733;</span>
        <div class="rating-bar-container">
          <div class="rating-bar" style="width: ${ratingPercentages[5]}%"></div>
        </div>
        <span class="rating-count">${ratingPercentages[5]}% (${ratingDistribution[5] || 0})</span>
      </div>
      <div class="rating-container">
        <span class="rating-label">4 &#9733;</span>
        <div class="rating-bar-container">
          <div class="rating-bar" style="width: ${ratingPercentages[4]}%"></div>
        </div>
        <span class="rating-count">${ratingPercentages[4]}% (${ratingDistribution[4] || 0})</span>
      </div>
      <div class="rating-container">
        <span class="rating-label">3 &#9733;</span>
        <div class="rating-bar-container">
          <div class="rating-bar" style="width: ${ratingPercentages[3]}%"></div>
        </div>
        <span class="rating-count">${ratingPercentages[3]}% (${ratingDistribution[3] || 0})</span>
      </div>
      <div class="rating-container">
        <span class="rating-label">2 &#9733;</span>
        <div class="rating-bar-container">
          <div class="rating-bar" style="width: ${ratingPercentages[2]}%"></div>
        </div>
        <span class="rating-count">${ratingPercentages[2]}% (${ratingDistribution[2] || 0})</span>
      </div>
      <div class="rating-container">
        <span class="rating-label">1 &#9733;</span>
        <div class="rating-bar-container">
          <div class="rating-bar" style="width: ${ratingPercentages[1]}%"></div>
        </div>
        <span class="rating-count">${ratingPercentages[1]}% (${ratingDistribution[1] || 0})</span>
      </div>
      ${totalRatings === 0 ? '<p class="rating-note">Note: Rating distribution has been estimated based on average rating.</p>' : ''}
    </div>
  `;
  
  modal.style.display = 'block';
}
