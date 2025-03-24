// Utility functions for data inspection and manipulation

function inspectData(data) {
  console.log("Data structure:", data);
  if (data && data.books) {
    console.log("Found books array with", data.books.length, "books");
    if (data.books.length > 0) {
      console.log("First book structure:", data.books[0]);
      console.log("Sample genres:", 
        data.books[0].goodreads?.genres,
        data.books[0].goodreads?.bookMetaData?.genre
      );
    }
  } else {
    console.error("Invalid data structure");
  }
}

// Format date to YYYY-MM-DD
function formatDate(dateString) {
    if (!dateString) return 'Unknown';
    
    try {
      // Try to parse the date
      const date = new Date(dateString);
      
      // Check if the date is valid
      if (isNaN(date.getTime())) {
        // If not a valid date, try to extract year from the string
        const yearMatch = dateString.match(/\b(19|20)\d{2}\b/);
        if (yearMatch) {
          return yearMatch[0]; // Return just the year if found
        }
        return dateString; // Return the original string if no year found
      }
      
      // Format as YYYY-MM-DD
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      
      return `${year}-${month}-${day}`;
    } catch (error) {
      console.error("Error formatting date:", error);
      return dateString; // Return the original string if there's an error
    }
  }
