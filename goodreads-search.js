// Function to process Goodreads search for each book
let booksData = [];
let enhancedData = [];
let currentBookIndex = 0;
let shouldStopProcessing = false;

// Load the saved Kindle library data
document.addEventListener('DOMContentLoaded', function () {
    const statusDiv = document.getElementById('status');
    const progressBar = document.getElementById('progress-bar');
    const resultsDiv = document.getElementById('results');
    const downloadBtn = document.getElementById('downloadBtn');
    const stopBtn = document.getElementById('stopBtn');

    // Check if elements exist before adding event listeners
    if (!stopBtn) {
        console.error("Stop button not found in the DOM");
    } else {
        // Add stop button click handler
        stopBtn.addEventListener('click', function () {
            shouldStopProcessing = true;
            statusDiv.textContent = 'Stopping processing...';
            stopBtn.disabled = true;
            stopBtn.textContent = 'Stopping...';
        });
    }

    if (!downloadBtn) {
        console.error("Download button not found in the DOM");
    } else {
        // Add download button click handler
        downloadBtn.addEventListener('click', downloadEnhancedData);
    }

    chrome.storage.local.get(['kindleLibraryData'], function (result) {
        if (chrome.runtime.lastError || !result.kindleLibraryData) {
            statusDiv.textContent = 'Error loading book data. Please scrape your library first.';
            return;
        }

        booksData = result.kindleLibraryData.listItems;

        if (booksData.length === 0) {
            statusDiv.textContent = 'No books found in the scraped data.';
            return;
        }

        statusDiv.textContent = `Processing ${booksData.length} books from your Kindle library...`;
        processNextBook();
    });
});

// Process books one by one to avoid rate limiting
function processNextBook() {
    const statusDiv = document.getElementById('status');
    const progressBar = document.getElementById('progress-bar');
    const resultsDiv = document.getElementById('results');
    const downloadBtn = document.getElementById('downloadBtn');
    const stopBtn = document.getElementById('stopBtn');

    // Check if elements exist before using them
    if (stopBtn && shouldStopProcessing) {
        statusDiv.textContent = `Processing stopped. Processed ${enhancedData.length} of ${booksData.length} books.`;
        stopBtn.classList.add('hidden');
        if (downloadBtn) {
            downloadBtn.classList.remove('hidden');
        }
        return;
    }

    if (currentBookIndex >= booksData.length) {
        statusDiv.textContent = `Completed! Processed ${enhancedData.length} books.`;
        stopBtn.classList.add('hidden');
        
        // Automatically download the data when complete
        downloadEnhancedData();
        
        return;
    }

    const book = booksData[currentBookIndex];
    const progress = Math.floor((currentBookIndex / booksData.length) * 100);
    progressBar.style.width = `${progress}%`;

    statusDiv.textContent = `Processing book ${currentBookIndex + 1} of ${booksData.length}: ${book.s_title || 'Unknown Title'}`;

    // Skip books without ASIN
    if (!book.asin) {
        const bookItem = document.createElement('div');
        bookItem.className = 'book-item';
        bookItem.textContent = `Skipped: ${book.s_title || 'Unknown Title'} - No ASIN available`;
        resultsDiv.appendChild(bookItem);

        currentBookIndex++;
        setTimeout(processNextBook, 100);
        return;
    }

    // Search Goodreads for the book by ASIN
    searchGoodreads(book).then(goodreadsData => {
        const enhancedBook = {
            ...book,
            goodreads: goodreadsData
        };

        enhancedData.push(enhancedBook);

        // Display result
        const bookItem = document.createElement('div');
        bookItem.className = 'book-item';
        const nameString = goodreadsData.gd_genre.map(item => item.name).join(", ");
        if (goodreadsData.found) {
            bookItem.innerHTML = `
        <strong>${book.s_title || 'Unknown Title'}</strong> by ${book.s_author || 'Unknown Author'}<br>
        <strong>ISBN:</strong> ${goodreadsData.isbn || 'N/A'}<br>
        <strong>First Published:</strong> ${goodreadsData.publishDate || 'N/A'}<br>
      
        <strong>Genres:</strong> ${goodreadsData.gd_genre ? nameString : 'N/A'}<br>
        <strong>Language:</strong> ${goodreadsData.language || 'N/A'}
      `;
        } else {
            bookItem.innerHTML = `
        <strong>${book.s_title || 'Unknown Title'}</strong> by ${book.s_author || 'Unknown Author'}<br>
        <em>No Goodreads data found.</em>
      `;
        }

        resultsDiv.appendChild(bookItem);

        currentBookIndex++;
        setTimeout(processNextBook, 1000); // Add delay to avoid hitting rate limits
    }).catch(error => {
        console.error("Error processing book:", error);

        const bookItem = document.createElement('div');
        bookItem.className = 'book-item';
        bookItem.textContent = `Error processing: ${book.s_title || 'Unknown Title'} - ${error.message}`;
        resultsDiv.appendChild(bookItem);

        currentBookIndex++;
        setTimeout(processNextBook, 1000);
    });
}

// Function to download the enhanced data
function downloadEnhancedData() {
    // Create the enhanced data object
    const enhancedDataObj = {
        scrapeDate: new Date().toISOString(),
        totalBooks: enhancedData.length,
        books: enhancedData
    };

    // Convert to JSON and download
    const jsonData = JSON.stringify(enhancedDataObj, null, 2);
    const dataUrl = 'data:application/json;charset=utf-8,' + encodeURIComponent(jsonData);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

    chrome.downloads.download({
        url: dataUrl,
        filename: `enhanced-kindle-data-${timestamp}.json`,
        saveAs: false
    });
}

// Search Goodreads for book data
async function searchGoodreads(book) {
    try {
        // First search for the book by ASIN or title+author
        let searchTerm = book.asin || `${book.s_title} ${book.s_author}`;
        let searchUrl = `https://www.goodreads.com/search?q=${encodeURIComponent(searchTerm)}`;

        console.log(`Searching Goodreads for: ${searchTerm}`);

        // Fetch the search results page
        const searchResponse = await fetch(searchUrl);

        if (!searchResponse.ok) {
            throw new Error(`HTTP error ${searchResponse.status}`);
        }

        const searchHtml = await searchResponse.text();

        // Extract the BOOKID from the first u-anchorTarget div in the search results
        const bookIdMatch = searchHtml.match(/<div\s+id="(\d+)"\s+class="[^"]*u-anchorTarget[^"]*"/);

        if (!bookIdMatch) {
            console.log(`No BOOKID found for: ${searchTerm}`);
            return {
                found: false,
                searchUrl: searchUrl
            };
        }

        const bookId = bookIdMatch[1];
        console.log(`Found BOOKID: ${bookId}`);

        // Construct the book detail page URL using the bookId
        const bookDetailUrl = `https://www.goodreads.com/book/show/${bookId}`;
        console.log(`Navigating to book detail page: ${bookDetailUrl}`);

        // Fetch the book detail page
        const detailResponse = await fetch(bookDetailUrl);

        if (!detailResponse.ok) {
            throw new Error(`HTTP error ${detailResponse.status}`);
        }

        const detailHtml = await detailResponse.text();

        // Extract the JSON data from the book detail page
        // Look for a script with JSON that starts with {"props":
        const jsonMatch = detailHtml.match(/<script[^>]*>(\s*{\s*"props"\s*:.*?})\s*<\/script>/s);

        // Also extract the application/ld+json metadata
        const metaDataMatch = detailHtml.match(/<script type="application\/ld\+json">(\s*{.*?})\s*<\/script>/s);

        let bookMetaData = null;
        let language = null;
        if (metaDataMatch) {
            try {
                bookMetaData = JSON.parse(metaDataMatch[1]);
                language = bookMetaData.inLanguage || null;
            } catch (metaError) {
                console.error(`Error parsing meta data JSON: ${metaError.message}`);
            }
        }

        if (!jsonMatch) {
            console.log(`No JSON data found for book: ${bookId}`);
            return {
                found: true,
                bookId: bookId,
                goodreadsUrl: bookDetailUrl,
                error: "No JSON data found"
            };
        }

        try {
            // Parse the JSON data
            const jsonString = jsonMatch[1];
            const bookData = JSON.parse(jsonString);

            // Extract specific fields from the JSON data
            let id = null;
            let legacyId = null;
            let publishDate = null;
            let genres = [];
            
            let description = null;
            let details = null;
            let bookGenres = null;
            let gd_contributor = [];
            let gd_genre = [];

            // Attempt to extract ISBN and ISBN13
            if (bookData.props && bookData.props.pageProps && bookData.props.pageProps.apolloState) {
                const apolloState = bookData.props.pageProps.apolloState;

                // Find the book object in apolloState
                const bookKeys = Object.keys(apolloState).filter(key =>
                    key.startsWith('Book:'));
                const contributorKeys = Object.keys(apolloState).filter(key =>
                    key.startsWith('Contributor:'));


                contributorKeys.forEach(key => {
                    const contributorObj = apolloState[key];
                    if (contributorObj.legacyId && contributorObj.name) {
                        // Check if the contributor is a Goodreads author
                        
                        const contrib = {
                            name: contributorObj.name,
                            id: contributorObj.id,
                            legacyId: contributorObj.legacyId,
                            description: contributorObj.description,
                            webUrl: contributorObj.webUrl
                        };
                        gd_contributor.push(contrib);
                    }

                });

                const genreKeys = Object.keys(apolloState).filter(key =>
                    key.startsWith('Genre:'));
                genreKeys.forEach(key => {
                    const genreObj = apolloState[key];
                    if (genreObj.id && genreObj.name) {
                        // Check if the contributor is a Goodreads author
                        
                        const contrib = {
                            name: genreObj.name,
                            id: genreObj.id,
             
                            webUrl: genreObj.webUrl
                        };
                        gd_genre.push(contrib);
                    }

                });

                if (bookKeys.length > 0) {
                    const bookObj = apolloState[bookKeys[0]];
                    id = bookObj.id || null;
                    legacyId = bookObj.legacyId || null;
                    publishDate = bookObj.publicationTime || null;
                    
                    description = bookObj.description || null;
                    details = bookObj.details || null;
                    bookGenres = bookObj.bookGenres || null;
                    // Try to extract genres

                    bookGenres.forEach(genreRef => {
                        genres.push(
                            {name : genreRef.genre.name,
                            webUrl : genreRef.genre.webUrl}
                        );

                    });

                }
            }

            // Return the found book data with extracted fields
            return {
                found: true,
                bookId: bookId,
                goodreadsUrl: bookDetailUrl,
                id: id,
                legacyId: legacyId,
                publishDate: publishDate,
                //genres: genres,
                language: language,
                description: description,
                details: details,
                gd_contributor: gd_contributor,
                gd_genre: genres,
                //bookGenres:bookGenres,
                bookMetaData: bookMetaData, // Add the extracted meta data
                //rawData: bookData // Keep the full data for reference
            };
        } catch (jsonError) {
            console.error(`Error parsing JSON data: ${jsonError.message}`);
            return {
                found: true,
                bookId: bookId,
                goodreadsUrl: bookDetailUrl,
                bookMetaData: bookMetaData, // Include meta data even if main JSON parsing fails
                error: `JSON parse error: ${jsonError.message}`
            };
        }
    } catch (error) {
        console.error("Error searching Goodreads:", error);
        return {
            found: false,
            error: error.message
        };
    }
}
