# Kindle Library Chrome Extension


A Chrome extension to enhance your Kindle library by scraping book data, finding additional information on Goodreads, and providing visual statistics and insights.

## Installation

1. Download or clone this repository to your local machine
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" using the toggle in the top-right corner
4. Click "Load unpacked" and select the `/DOWNLOAD_DIRECTORY/kindle_chrome_extension` directory
5. The extension icon should now appear in your Chrome toolbar

## Usage

### Step 1: Download Your Kindle Library

1. Navigate to [read.amazon.com/kindle-library](https://read.amazon.com/kindle-library)
2. Log in to your Amazon account if necessary
3. Click the extension icon in your toolbar to open the popup
4. Click the "Scrape Library" button
5. The extension will automatically:
   - Scroll through your entire library to load all books
   - Extract book details including titles, authors, and ASINs
   - Download a JSON file with your library data

### Step 2: Extract Enhanced Data from Goodreads

1. In the extension popup, click the "Search Goodreads" button
2. A new tab will open showing the search progress
3. The extension will:
   - Process each book from your Kindle library
   - Search for matching books on Goodreads
   - Extract additional data like genres, ISBN, publication dates, and ratings
   - Allow you to stop the process at any time using the "Stop Processing" button
4. You can stop the process mid way and "Download Enhanced Data"
5. When process completed,  the JSON file with data will be automatically downloaded by your browser to your Download folder 


### Step 3: View Library Stats

1. In the extension popup, click the "View Library Stats" button
2. A new tab will open with the stats page
3. Click "Load Data" and select the enhanced JSON file you downloaded in Step 2
4. Explore your library with interactive visualizations:
   - Genre distribution (bar chart, polar chart, or bubble chart)
   - Library summary statistics
   - Searchable and sortable book list
5. Filter books by:
   - Clicking on genres in the charts
   - Searching for titles or authors
   - Toggling the display of sample books
6. Click on any book to view detailed information, including:
   - Book metadata
   - Genres
   - Publication information
   - Links to Goodreads and Amazon
   - Rating information

## Features

- 📊 Visual representation of your library by genre
- 🔍 Enhanced book data from Goodreads
- 📚 Complete library management and exploration
- 🔖 Filter and sort books by multiple criteria
- 📱 Responsive design for various screen sizes
- 🔄 Handles sample books appropriately

## Privacy

All data processing happens on your local machine. The extension does not send your library data to any external servers (other than Goodreads for searching book information).



## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
