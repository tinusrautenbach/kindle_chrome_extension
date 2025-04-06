// Contains UI update logic and display functions

// Update the library summary statistics
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
    badge.innerHTML = `${genre} <span class="remove">×</span>`;
    
    badge.querySelector('.remove').addEventListener('click', function() {
      removeGenreFilter(genre);
    });
    
    container.appendChild(badge);
  });
  
  // Show the clear button when we have genre filters
  clearBtn.style.display = 'block';
}

// Display books in the book list
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

// Show book details in modal
function showBookDetails(book) {
  const modal = document.getElementById('bookModal');
  const detailsContainer = document.getElementById('bookDetails');
  
  // Get book details
  const title = book.s_title || 'Unknown Title';
  const author = book.s_author || 'Unknown Author';
  const coverUrl = book.goodreads?.bookMetaData?.image;
  
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
  
  // Create genre tags HTML
  const genreTagsHtml = genres.map(genre => `<span class="genre-tag">${genre}</span>`).join('');
  
  // Build the HTML without inline event handlers
  detailsContainer.innerHTML = `
    <div class="book-detail-header">
      <img src="${coverUrl}" alt="${title}" class="book-detail-cover">
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
      <h3>Rating Details</h3>
      <div class="rating-container">
        <span class="rating-label">5 ★</span>
        <div class="rating-bar-container">
          <div class="rating-bar" style="width: 70%"></div>
        </div>
        <span class="rating-count">70%</span>
      </div>
      <div class="rating-container">
        <span class="rating-label">4 ★</span>
        <div class="rating-bar-container">
          <div class="rating-bar" style="width: 20%"></div>
        </div>
        <span class="rating-count">20%</span>
      </div>
      <div class="rating-container">
        <span class="rating-label">3 ★</span>
        <div class="rating-bar-container">
          <div class="rating-bar" style="width: 5%"></div>
        </div>
        <span class="rating-count">5%</span>
      </div>
      <div class="rating-container">
        <span class="rating-label">2 ★</span>
        <div class="rating-bar-container">
          <div class="rating-bar" style="width: 3%"></div>
        </div>
        <span class="rating-count">3%</span>
      </div>
      <div class="rating-container">
        <span class="rating-label">1 ★</span>
        <div class="rating-bar-container">
          <div class="rating-bar" style="width: 2%"></div>
        </div>
        <span class="rating-count">2%</span>
      </div>
    </div>
  `;
  
  // Add event listener for book cover image error
  const detailCover = detailsContainer.querySelector('.book-detail-cover');
  detailCover.addEventListener('error', function() {
    this.src = 'https://via.placeholder.com/150x200?text=No+Cover';
  });
  
  modal.style.display = 'block';
}
