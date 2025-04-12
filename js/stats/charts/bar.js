/**
 * Bar chart functionality for stats visualization
 * 
 * This file contains functions for creating and managing horizontal bar charts that display
 * genre distribution data with scrollable navigation controls.
 */

/**
 * Creates a horizontal bar chart for visualizing book genres distribution
 * 
 * @param {CanvasRenderingContext2D} ctx - The canvas rendering context
 * @param {Array<Array<string|number>>} topSubGenres - Array of [genre, count] pairs for sub-genres
 * @param {Array<Array<string|number>>} majorGenres - Array of [genre, count] pairs for major genres
 * @returns {undefined} - Creates and renders the chart on the provided canvas context
 */
function createBarChart(ctx, topSubGenres, majorGenres) {
  // Create a Set of genre names to track duplicates
  const seenGenres = new Set();
  
  // Filter out duplicates by only including each genre once
  const uniqueSubGenres = topSubGenres.filter(([genre]) => {
    if (seenGenres.has(genre)) {
      return false; // Skip this duplicate
    }
    seenGenres.add(genre);
    return true;
  });
  
  // Combine and sort all genres
  const allGenres = uniqueSubGenres
    .sort((a, b) => b[1] - a[1])
    .slice(0, 200); // Increased from 100 to 200 to include more genres
  
  // Prepare data for Chart.js
  const labels = allGenres.map(g => g[0]);
  const data = allGenres.map(g => g[1]);
  
  // Create different colors for major genres
  const backgroundColors = allGenres.map(() => '#36A2EB');
  
  genreChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Books per Genre',
        data: data,
        backgroundColor: backgroundColors,
        borderWidth: 1,
        barThickness: 'flex',
        barPercentage: 0.5 // Reduce bar height by half
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          // Set min and max to control how many bars are visible at once
          min: 0,
          max: 14, // Show 15 items (0-14)
          ticks: {
            autoSkip: false
          }
        }
      },
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
      onClick: handleChartClick
    }
  });
  
  // Add scrolling controls
  addScrollingControls(ctx.canvas, allGenres.length);
}

/**
 * Adds interactive scrolling controls below the bar chart
 * This allows users to navigate through all genres when there are more than can fit on screen
 * 
 * @param {HTMLCanvasElement} canvas - The canvas element of the chart
 * @param {number} totalItems - Total number of items/bars in the complete dataset
 * @returns {undefined} - Appends control elements to the DOM after the canvas
 */
function addScrollingControls(canvas, totalItems) {
  const container = canvas.parentNode;
  
  // Remove any existing controls first to avoid duplicates
  const existingControls = container.querySelector('.chart-controls');
  if (existingControls) {
    existingControls.remove();
  }
  
  // Create the controls container
  const controlsContainer = document.createElement('div');
  controlsContainer.className = 'chart-controls';
  
  // Apply styles directly to ensure visibility
  controlsContainer.style.display = 'flex';
  controlsContainer.style.alignItems = 'center';
  controlsContainer.style.justifyContent = 'center';
  controlsContainer.style.marginTop = '20px';
  controlsContainer.style.width = '100%';
  controlsContainer.style.padding = '10px 0';
  
  // Create buttons and info elements directly instead of using innerHTML
  const upButton = document.createElement('button');
  upButton.className = 'scroll-btn';
  upButton.setAttribute('data-direction', 'up');
  upButton.textContent = '-';  // Changed to '-'
  upButton.style.backgroundColor = '#4285f4';
  upButton.style.color = 'white';
  upButton.style.border = 'none';
  upButton.style.borderRadius = '50%';
  upButton.style.width = '36px';
  upButton.style.height = '36px';
  upButton.style.display = 'flex';
  upButton.style.alignItems = 'center';
  upButton.style.justifyContent = 'center';
  upButton.style.margin = '0 5px';
  upButton.style.cursor = 'pointer';
  upButton.style.fontSize = '18px';
  upButton.style.fontWeight = 'bold';
  upButton.style.zIndex = '100';
  
  const scrollInfo = document.createElement('div');
  scrollInfo.className = 'scroll-info';
  scrollInfo.textContent = `Showing 1-15 of ${totalItems}`;  // Updated to show 15
  scrollInfo.style.margin = '0 15px';
  scrollInfo.style.fontSize = '13px';
  scrollInfo.style.color = '#555';
  
  const downButton = document.createElement('button');
  downButton.className = 'scroll-btn';
  downButton.setAttribute('data-direction', 'down');
  downButton.textContent = '+';  // Changed to '+'
  downButton.style.backgroundColor = '#4285f4';
  downButton.style.color = 'white';
  downButton.style.border = 'none';
  downButton.style.borderRadius = '50%';
  downButton.style.width = '36px';
  downButton.style.height = '36px';
  downButton.style.display = 'flex';
  downButton.style.alignItems = 'center';
  downButton.style.justifyContent = 'center';
  downButton.style.margin = '0 5px';
  downButton.style.cursor = 'pointer';
  downButton.style.fontSize = '18px';
  downButton.style.fontWeight = 'bold';
  downButton.style.zIndex = '100';
  
  // Append elements to the container
  controlsContainer.appendChild(upButton);
  controlsContainer.appendChild(scrollInfo);
  controlsContainer.appendChild(downButton);
  
  // Insert after the canvas
  container.appendChild(controlsContainer);
  
  // Current view window
  let startIndex = 0;
  const viewSize = 15; // Changed to 15 to match the chart display
  
  // Add event listeners
  upButton.addEventListener('click', () => {
    if (startIndex > 0) {
      // Scroll by 15 at a time
      startIndex = Math.max(0, startIndex - 15);
      updateChartView();
    }
  });
  
  downButton.addEventListener('click', () => {
    if (startIndex + viewSize < totalItems) {
      // Scroll by 15 at a time
      startIndex = Math.min(totalItems - viewSize, startIndex + 15);
      updateChartView();
    }
  });
  
  /**
   * Updates the chart view when scrolling
   * Changes which bars are visible and updates the info text and button states
   */
  function updateChartView() {
    // Update the chart's scale options
    genreChart.options.scales.y.min = startIndex;
    genreChart.options.scales.y.max = startIndex + viewSize - 1;
    genreChart.update();
    
    // Update the scroll info
    scrollInfo.textContent = `Showing ${startIndex + 1}-${Math.min(startIndex + viewSize, totalItems)} of ${totalItems}`;
    
    // Update button states
    upButton.disabled = startIndex === 0;
    upButton.style.backgroundColor = startIndex === 0 ? '#ccc' : '#4285f4';
    
    downButton.disabled = startIndex + viewSize >= totalItems;
    downButton.style.backgroundColor = startIndex + viewSize >= totalItems ? '#ccc' : '#4285f4';
  }
  
  // Initialize button states
  upButton.disabled = startIndex === 0;
  upButton.style.backgroundColor = startIndex === 0 ? '#ccc' : '#4285f4';
  
  downButton.disabled = startIndex + viewSize >= totalItems;
  downButton.style.backgroundColor = startIndex + viewSize >= totalItems ? '#ccc' : '#4285f4';
}

/**
 * Creates a horizontal bar chart specifically for super genres (major categories)
 * These are displayed separately in the stats summary section
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
