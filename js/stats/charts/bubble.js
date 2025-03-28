// Bubble chart functionality for stats visualization

// Create a bubble chart for genres
function createBubbleChart(ctx, topSubGenres, majorGenres) {
  // Combine genres
  const allGenres = [...topSubGenres].slice(0, 25);
  
  // Generate positions for each bubble
  const data = [];
  allGenres.forEach((g, i) => {
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
      backgroundColor: 'rgba(54, 162, 235, 0.8)'
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
          // In Chart.js 4.x, we need to explicitly set bounds
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
  
  // Draw labels on the bubbles - Updated for Chart.js 4.x
  // Instead of using mousedown event, use the afterDraw plugin
  const bubbleLabelPlugin = {
    id: 'bubbleLabels',
    afterDraw: (chart) => {
      const ctx = chart.ctx;
      
      ctx.save();
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = 'white';
      ctx.font = 'bold 12px Arial';
      
      chart.data.datasets.forEach((dataset, i) => {
        const meta = chart.getDatasetMeta(i);
        if (!meta.hidden && meta.data.length > 0) {
          const element = meta.data[0];
          const data = dataset.data[0];
          
          // Only draw text if bubble is big enough
          if (data.r > 15) {
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
