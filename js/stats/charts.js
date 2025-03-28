// Add Chart.js plugin for data labels
if (Chart) {
  // Register the plugin to all charts
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

let genreChart = null;

// Create the genre chart
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
    .slice(0, 15); // Top 15 sub-genres
  
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

// Function to update chart type based on tab selection
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

// Create a horizontal bar chart for genres
function createBarChart(ctx, topSubGenres, sortedGenres) {
  // Combine and sort all genres
  const allGenres = [...sortedGenres, ...topSubGenres].sort((a, b) => b[1] - a[1]).slice(0, 20);
  
  // Prepare data for Chart.js
  const labels = allGenres.map(g => g[0]);
  const data = allGenres.map(g => g[1]);
  
  // Create different colors for major genres
  const backgroundColors = allGenres.map((g, i) => {
    const isMajorGenre = sortedGenres.some(mg => mg[0] === g[0]);
    return isMajorGenre ? '#FF6384' : '#36A2EB';
  });
  
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
}

// Create a treemap chart for genres
function createTreemapChart(ctx, topSubGenres, sortedGenres) {
  // Replace treemap with a polar area chart since treemap is not available
  console.log("Treemap not available, using polar area chart instead");
  
  // Combine genres
  const allGenres = [...sortedGenres, ...topSubGenres].slice(0, 30);
  
  // Create a dataset for the polar area chart
  const data = {
    labels: allGenres.map(g => g[0]),
    datasets: [{
      data: allGenres.map(g => g[1]),  // Use book counts as sizes
      backgroundColor: allGenres.map((g, i) => {
        const isMajorGenre = sortedGenres.some(mg => mg[0] === g[0]);
        return isMajorGenre ? 'rgba(255, 99, 132, 0.8)' : 'rgba(54, 162, 235, 0.8)';
      })
    }]
  };
  
  genreChart = new Chart(ctx, {
    type: 'polarArea',
    data: data,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'right',
          labels: {
            generateLabels: function(chart) {
              const original = Chart.registry.getPlugin('legend').defaults.labels.generateLabels;
              const labels = original.call(this, chart);
              
              return labels.slice(0, 15).map(label => {
                if (label.text && label.text.length > 20) {
                  label.text = label.text.substring(0, 17) + '...';
                }
                return label;
              });
            }
          }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const label = context.chart.data.labels[context.dataIndex];
              const value = context.raw;
              return `${label}: ${value} book${value !== 1 ? 's' : ''}`;
            }
          }
        }
      },
      onClick: handleChartClick
    }
  });
}

function createBubbleChart(ctx, topSubGenres, sortedGenres) {
  // Combine genres
  const allGenres = [...sortedGenres, ...topSubGenres].slice(0, 25);
  
  // Generate positions for each bubble
  const data = [];
  allGenres.forEach((g, i) => {
    const isMajorGenre = sortedGenres.some(mg => mg[0] === g[0]);
    
    // Position bubbles in a sort of spiral
    const angle = i * 0.5;
    const radius = 5 + i * 0.8;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    
    data.push({
      label: g[0],
      data: [{
        x: x,
        y: y,
        r: Math.sqrt(g[1]) * 5 // Size based on count but not overwhelming
      }],
      backgroundColor: isMajorGenre ? 'rgba(255, 99, 132, 0.8)' : 'rgba(54, 162, 235, 0.8)'
    });
  });
  
  genreChart = new Chart(ctx, {
    type: 'bubble',
    data: {
      datasets: data
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          display: false,
          bounds: 'data'
        },
        y: {
          display: false,
          bounds: 'data'
        }
      },
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              if (!context.dataset || !context.dataset.label) return '';
              
              const genreItem = allGenres.find(g => g[0] === context.dataset.label);
              if (!genreItem) return context.dataset.label;
              
              const value = genreItem[1];
              return `${context.dataset.label}: ${value} book${value !== 1 ? 's' : ''}`;
            }
          }
        }
      },
      onClick: handleChartClick
    }
  });
  
  // Add a custom plugin to draw labels on bubbles
  const bubbleLabelPlugin = {
    id: 'bubbleLabels',
    afterDatasetsDraw: function(chart) {
      const ctx = chart.ctx;
      
      chart.data.datasets.forEach((dataset, datasetIndex) => {
        const meta = chart.getDatasetMeta(datasetIndex);
        if (!meta.hidden) {
          meta.data.forEach((element, index) => {
            const data = dataset.data[index];
            if (!data) return;
            
            // Only draw labels for bubbles large enough
            const radius = data.r || 0;
            if (radius < 15) return;
            
            const label = dataset.label;
            if (!label) return;
            
            // Set up text styling
            ctx.save();
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = 'white';
            
            // Calculate font size based on bubble size
            const fontSize = Math.min(Math.max(10, radius / 4), 16);
            ctx.font = `bold ${fontSize}px Arial`;
            
            // Measure text to see if it fits
            const textMetrics = ctx.measureText(label);
            const textWidth = textMetrics.width;
            
            // Only draw text if it fits within the bubble
            if (textWidth < radius * 1.8) {
              ctx.fillText(label, element.x, element.y);
            }
            
            ctx.restore();
          });
        }
      });
    }
  };
  
  // Register the plugin for this chart instance only
  Chart.register(bubbleLabelPlugin);
}

// Handle chart click to filter books
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

// Generate an array of colors for the chart
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
