// Bar chart functionality for stats visualization

// Create a horizontal bar chart for genres
function createBarChart(ctx, topSubGenres, majorGenres) {
  // Combine and sort all genres - show more genres since we'll have scrolling
  // Fix duplicates by ensuring each genre appears only once
  const uniqueGenres = new Map();
  
  // Add all genres to the map, with the count as the value
  topSubGenres.forEach(([genre, count]) => {
    // If the genre is already in the map, only update if the new count is higher
    if (!uniqueGenres.has(genre) || uniqueGenres.get(genre) < count) {
      uniqueGenres.set(genre, count);
    }
  });
  
  // Convert back to array and sort
  const allGenres = Array.from(uniqueGenres.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 50);
  
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
        borderWidth: 1
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
          max: 9, // Show 10 items (0-9)
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

// Add scrolling controls for the bar chart
function addScrollingControls(canvas, totalItems) {
  const container = canvas.parentNode;
  
  // Create the controls container
  const controlsContainer = document.createElement('div');
  controlsContainer.className = 'chart-controls';
  controlsContainer.innerHTML = `
    <button class="scroll-btn" data-direction="up">▲</button>
    <div class="scroll-info">Showing 1-10 of ${totalItems}</div>
    <button class="scroll-btn" data-direction="down">▼</button>
  `;
  
  // Insert after the canvas
  container.appendChild(controlsContainer);
  
  // Add event listeners
  const upButton = controlsContainer.querySelector('[data-direction="up"]');
  const downButton = controlsContainer.querySelector('[data-direction="down"]');
  const scrollInfo = controlsContainer.querySelector('.scroll-info');
  
  // Current view window
  let startIndex = 0;
  const viewSize = 10;
  
  upButton.addEventListener('click', () => {
    if (startIndex > 0) {
      startIndex--;
      updateChartView();
    }
  });
  
  downButton.addEventListener('click', () => {
    if (startIndex + viewSize < totalItems) {
      startIndex++;
      updateChartView();
    }
  });
  
  function updateChartView() {
    // Update the chart's scale options
    genreChart.options.scales.y.min = startIndex;
    genreChart.options.scales.y.max = startIndex + viewSize - 1;
    genreChart.update();
    
    // Update the scroll info
    scrollInfo.textContent = `Showing ${startIndex + 1}-${Math.min(startIndex + viewSize, totalItems)} of ${totalItems}`;
    
    // Update button states
    upButton.disabled = startIndex === 0;
    downButton.disabled = startIndex + viewSize >= totalItems;
  }
  
  // Initialize button states
  upButton.disabled = startIndex === 0;
  downButton.disabled = startIndex + viewSize >= totalItems;
}

// Create a bar chart for super genres
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
