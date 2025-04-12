/**
 * Chart visualization functionality for Kindle library statistics
 * 
 * This file contains the core charting functionality used to visualize
 * genre distributions and other statistical data from the user's Kindle library.
 */

// Add Chart.js plugin for data labels
if (Chart) {
  /**
   * Custom Chart.js plugin for rendering data labels on bubble charts
   * This plugin draws text labels inside bubbles when there's enough space
   */
  Chart.register({
    id: 'datalabels',
    beforeDraw: function(chart) {
      const datasets = chart.data.datasets;
      if (!datasets || chart.config.type !== 'bubble') return;
      
      const ctx = chart.ctx;
      chart.data.datasets.forEach((dataset, datasetIndex) => {
        const meta = chart.getDatasetMeta(datasetIndex);
        if (!meta.visible) return;

        meta.data.forEach((element, index) => {
          // Get the data
          const data = dataset.data[index];
          if (!data) return;
          
          // Check if we should display the label
          const displayLabel = chart.options.plugins.datalabels.display;
          let shouldDisplay = true;
          
          if (typeof displayLabel === 'function') {
            shouldDisplay = displayLabel({dataset: dataset, dataIndex: index});
          }
          
          if (!shouldDisplay) return;
          
          // Calculate text size
          let fontSizeValue = 12;
          
          ctx.font = `${'normal'} ${fontSizeValue}px sans-serif`;
          
          // Get label
          const formatter = chart.options.plugins.datalabels.formatter;
          let text = dataset.label;
          
          if (typeof formatter === 'function') {
            text = formatter(data, {dataset: dataset, dataIndex: index});
          }
          
          // Draw label
          const textWidth = ctx.measureText(text).width;
          const radius = data.r || 0;
          
          if (textWidth < radius * 1.8) {  // Only draw if text fits nicely
            ctx.save();
            ctx.fillStyle = chart.options.plugins.datalabels.color || 'white';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(text, element.x, element.y);
            ctx.restore();
          }
        });
      });
    }
  });
}

// Chart visualization functions

/**
 * Reference to the current genre chart instance
 * Allows destroying and recreating charts when switching visualization types
 * @type {Object|null}
 */
let genreChart = null;

/**
 * Creates the genre distribution chart based on the current library data
 * This function processes book genre data and initializes the appropriate chart type
 * 
 * @returns {undefined} - Creates and renders the genre chart in the appropriate container
 */
function createGenreChart() {
  if (!libraryData || !libraryData.books) return;
  
  console.log("Creating genre chart with", libraryData.books.length, "books");
  
  // Count books per genre
  const genreCounts = {};
  const superGenres = new Set(['Fiction', 'Nonfiction', 'Audiobook']);
  const majorGenreCounts = {};
  const subGenreCounts = {};
  
  libraryData.books.forEach(book => {
    console.log("Processing book:", book.s_title);
    
    let genres = [];
    
    // Get genres from gd_genre
    if (book.goodreads && book.goodreads.gd_genre && Array.isArray(book.goodreads.gd_genre)) {
      book.goodreads.gd_genre.forEach(genreObj => {
        if (genreObj && genreObj.name) {
          genres.push(genreObj.name);
        }
      });
      console.log("Found genres in book.goodreads.gd_genre:", genres);
    }
    
    // If no genres were found, add a default genre
    if (genres.length === 0) {
      genres.push("Unknown Genre");
    }
    
    // Sort genres into super genres and sub-genres
    genres.forEach(genre => {
      if (genre && typeof genre === 'string') {
        // Skip super genres in the main genre count
        if (!superGenres.has(genre)) {
          genreCounts[genre] = (genreCounts[genre] || 0) + 1;
        }
        
        // Check if this is a super genre
        if (superGenres.has(genre)) {
          majorGenreCounts[genre] = (majorGenreCounts[genre] || 0) + 1;
        } else {
          subGenreCounts[genre] = (subGenreCounts[genre] || 0) + 1;
        }
      }
    });
  });
  
  // Get the top N sub-genres (excluding super genres)
  const topSubGenres = Object.entries(subGenreCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 150); // Top 15 sub-genres
  
  // Create the super genres chart in the summary area
  createSuperGenresChart(majorGenreCounts);
  
  // For the main genre chart, use specific genres only (not super genres)
  const sortedGenres = Object.entries(genreCounts)
    .sort((a, b) => b[1] - a[1]);
  
  console.log("Found", sortedGenres.length, "unique specific genres");
  
  // Destroy existing chart if it exists
  if (genreChart) {
    genreChart.destroy();
  }
  
  // Make sure the canvas is visible and has proper dimensions
  const canvas = document.getElementById('genreChart');
  
  // Reset the canvas to ensure clean rendering
  const chartContainer = canvas.parentNode;
  chartContainer.innerHTML = '';
  
  // Create a header for the visualization
  const header = document.createElement('h3');
  header.textContent = 'Genre Distribution';
  chartContainer.appendChild(header);
  
  // Create tabs for different visualizations
  const tabsContainer = document.createElement('div');
  tabsContainer.className = 'chart-tabs';
  tabsContainer.innerHTML = `
    <button class="chart-tab active" data-chart="bar">Bar Chart</button>
    <button class="chart-tab" data-chart="treemap">Polar Chart</button>
    <button class="chart-tab" data-chart="bubble">Bubble Chart</button>
  `;
  chartContainer.appendChild(tabsContainer);
  
  // Create canvas for the chart
  const newCanvas = document.createElement('canvas');
  newCanvas.id = 'genreChart';
  chartContainer.appendChild(newCanvas);
  
  // Add a placeholder for chart description
  const chartDescription = document.createElement('p');
  chartDescription.className = 'chart-description';
  chartDescription.textContent = 'Shows the most significant book genres in your library. Click on a genre to see all books in that category.';
  chartContainer.appendChild(chartDescription);
  
  // Set up tab click handlers
  const tabs = tabsContainer.querySelectorAll('.chart-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      
      const chartType = tab.dataset.chart;
      updateChartType(chartType, newCanvas, topSubGenres, sortedGenres);
    });
  });
  
  // Initialize with bar chart
  updateChartType('bar', newCanvas, topSubGenres, sortedGenres);
}

/**
 * Creates a bar chart specifically for super genres (major categories)
 * This chart appears in the stats summary section
 * 
 * @param {Object} majorGenreCounts - Object with genre names as keys and book counts as values
 * @returns {undefined} - Creates and renders the chart in the superGenresChart container
 */
function createSuperGenresChart(majorGenreCounts) {
  // Convert to array and sort
  const superGenres = Object.entries(majorGenreCounts)
    .sort((a, b) => b[1] - a[1]);
  
  if (superGenres.length === 0) return;
  
  // Get the container
  const container = document.getElementById('superGenresChart');
  if (!container) return;
  
  // Clear existing content
  container.innerHTML = '';
  
  // Create canvas
  const canvas = document.createElement('canvas');
  canvas.id = 'superGenresCanvas';
  container.appendChild(canvas);
  
  // Create chart
  const ctx = canvas.getContext('2d');
  const superGenresChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: superGenres.map(g => g[0]),
      datasets: [{
        label: 'Books per Category',
        data: superGenres.map(g => g[1]),
        backgroundColor: '#9C27B0', // Purple for super genres
        borderWidth: 1
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const value = context.raw || 0;
              return `${value} book${value !== 1 ? 's' : ''}`;
            }
          }
        }
      },
      onClick: function(event, elements) {
        if (!elements || elements.length === 0) return;
        
        const index = elements[0].index;
        const genreLabel = superGenres[index][0];
        
        console.log("Clicked on super genre:", genreLabel);
        
        // Add or remove this genre filter
        if (currentFilter.genres && currentFilter.genres.includes(genreLabel)) {
          removeGenreFilter(genreLabel);
        } else {
          addGenreFilter(genreLabel);
        }
      }
    }
  });
}

/**
 * Updates the chart type based on user tab selection
 * Destroys the existing chart and creates a new one of the selected type
 * 
 * @param {string} chartType - The type of chart to create ('bar', 'treemap', or 'bubble')
 * @param {HTMLCanvasElement} canvas - The canvas element to render the chart on
 * @param {Array<Array<string|number>>} topSubGenres - Array of [genre, count] pairs for sub-genres
 * @param {Array<Array<string|number>>} majorGenres - Array of [genre, count] pairs for major genres
 * @returns {undefined} - Creates and renders the selected chart type
 */
function updateChartType(chartType, canvas, topSubGenres, majorGenres) {
  // Destroy existing chart if it exists
  if (genreChart) {
    genreChart.destroy();
  }
  
  const ctx = canvas.getContext('2d');
  
  switch (chartType) {
    case 'bar':
      createBarChart(ctx, topSubGenres, majorGenres);
      break;
    case 'treemap':
      createTreemapChart(ctx, topSubGenres, majorGenres);
      break;
    case 'bubble':
      createBubbleChart(ctx, topSubGenres, majorGenres);
      break;
    default:
      createBarChart(ctx, topSubGenres, majorGenres);
  }
}

/**
 * Handles click events on chart elements (bars, bubbles, etc.)
 * Filters the book list to show only books in the clicked genre
 * 
 * @param {Event} event - The click event
 * @param {Array} elements - The chart elements that were clicked
 * @param {Object} chart - The Chart.js chart instance
 * @returns {undefined} - Updates filters and refreshes the book display
 */
function handleChartClick(event, elements, chart) {
  if (!elements || elements.length === 0) return;
  
  let genreLabel;
  
  // Extract the genre name based on chart type
  if (chart.config.type === 'polarArea') {
    genreLabel = chart.data.labels[elements[0].index];
  } else if (chart.config.type === 'bubble') {
    const datasetIndex = elements[0].datasetIndex;
    if (chart.data.datasets && 
        datasetIndex !== undefined && 
        chart.data.datasets[datasetIndex] &&
        chart.data.datasets[datasetIndex].label) {
      genreLabel = chart.data.datasets[datasetIndex].label;
    } else {
      console.error("Unable to determine genre from bubble chart click");
      return;
    }
  } else {
    genreLabel = chart.data.labels[elements[0].index];
  }
  
  console.log("Clicked on genre:", genreLabel);
  
  // Update to use the new multi-genre filter system
  if (currentFilter.genres && currentFilter.genres.includes(genreLabel)) {
    removeGenreFilter(genreLabel);
  } else {
    addGenreFilter(genreLabel);
  }
  
  const filteredBooks = filterBooks();
  displayBooks(filteredBooks);
  
  // Scroll to books list
  document.querySelector('.books-container').scrollIntoView({ 
    behavior: 'smooth', 
    block: 'start' 
  });
}

/**
 * Generates an array of colors to use in charts
 * Provides a consistent color palette with fallback to random colors if needed
 * 
 * @param {number} count - The number of colors needed
 * @returns {Array<string>} - Array of color strings (hex or HSL format)
 */
function generateColors(count) {
  const baseColors = [
    '#4CAF50', '#2196F3', '#FFC107', '#F44336', '#9C27B0',
    '#00BCD4', '#FF9800', '#795548', '#607D8B', '#E91E63',
    '#3F51B5', '#009688', '#FFEB3B', '#8BC34A', '#03A9F4',
    '#673AB7', '#CDDC39', '#FF5722', '#9E9E9E', '#FFCDD2',
    '#BBD8FA', '#B2EBF2', '#C8E6C9', '#FFF9C4', '#FFCDD2'
  ];
  
  if (count > baseColors.length) {
    const extraColors = [];
    for (let i = 0; i < count - baseColors.length; i++) {
      const hue = Math.floor(Math.random() * 360);
      const saturation = 70 + Math.floor(Math.random() * 30);
      const lightness = 45 + Math.floor(Math.random() * 10);
      extraColors.push(`hsl(${hue}, ${saturation}%, ${lightness}%)`);
    }
    return [...baseColors, ...extraColors];
  }
  
  return baseColors.slice(0, count);
}
