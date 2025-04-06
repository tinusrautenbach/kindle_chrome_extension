// Bubble chart functionality for stats visualization

// Create a bubble chart for genres
function createBubbleChart(ctx, topSubGenres, majorGenres) {
  // Combine genres
  const allGenres = [...topSubGenres].slice(0, 25);
  
  // Generate positions for each bubble with better spacing
  const data = [];
  const bubblePositions = [];
  
  // Scale the radius based on the max count
  const maxCount = Math.max(...allGenres.map(g => g[1]));
  
  // Function to check if a new bubble overlaps with existing ones
  function checkOverlap(x, y, r) {
    for (const pos of bubblePositions) {
      const dx = pos.x - x;
      const dy = pos.y - y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance < r + pos.r + 1) { // Adding 1px buffer
        return true; // Overlap detected
      }
    }
    return false;
  }
  
  allGenres.forEach((g, i) => {
    // Calculate radius based on book count, with a logarithmic scale for better variation
    const radius = 10 + Math.log(g[1]) * 5;
    
    // Initial position based on a spiral
    let angle = i * 0.5;
    let spiralRadius = 5 + i * 0.8;
    let x = Math.cos(angle) * spiralRadius;
    let y = Math.sin(angle) * spiralRadius;
    
    // Attempt to find a non-overlapping position
    let attempts = 0;
    while (checkOverlap(x, y, radius) && attempts < 50) {
      angle += 0.2;
      spiralRadius += 0.2;
      x = Math.cos(angle) * spiralRadius;
      y = Math.sin(angle) * spiralRadius;
      attempts++;
    }
    
    // If still overlapping after attempts, reduce radius
    let finalRadius = radius;
    if (attempts >= 50) {
      finalRadius = radius * 0.7; // Reduce size for overlapping bubbles
    }
    
    // Record the position for future overlap checks
    bubblePositions.push({ x, y, r: finalRadius });
    
    // Add a variance to the colors based on count
    const hue = 210 + (i * 10) % 50; // Blue-ish hues with variation
    const opacity = 0.6 + (g[1] / maxCount) * 0.3; // Higher count = more opacity
    
    data.push({
      label: g[0],
      data: [{
        x: x,
        y: y,
        r: finalRadius
      }],
      backgroundColor: `hsla(${hue}, 80%, 55%, ${opacity})`
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
  
  // Draw labels on the bubbles
  const bubbleLabelPlugin = {
    id: 'bubbleLabels',
    afterDraw: (chart) => {
      const ctx = chart.ctx;
      
      ctx.save();
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = 'white';
      
      chart.data.datasets.forEach((dataset, i) => {
        const meta = chart.getDatasetMeta(i);
        if (!meta.hidden && meta.data.length > 0) {
          const element = meta.data[0];
          const data = dataset.data[0];
          
          // Scale font size based on bubble radius
          const fontSize = Math.min(Math.max(8, data.r / 3), 14);
          ctx.font = `bold ${fontSize}px Arial`;
          
          // Only draw text if bubble is big enough
          if (data.r > 12) {
            const label = dataset.label;
            // Measure text to see if it fits
            const textWidth = ctx.measureText(label).width;
            if (textWidth < data.r * 1.8) {
              ctx.fillText(label, element.x, element.y);
            }
          }
        }
      });
      ctx.restore();
    }
  };
  
  // Register the bubble label plugin
  Chart.register(bubbleLabelPlugin);
}
