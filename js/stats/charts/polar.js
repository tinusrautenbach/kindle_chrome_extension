/**
 * Polar chart functionality for stats visualization
 * 
 * This file provides functionality for creating interactive polar area charts
 * as an alternative to treemap charts for genre distribution visualization.
 */

/**
 * Creates a polar area chart for visualizing book genres distribution
 * This function is named createTreemapChart for consistency with the charting API
 * but actually creates a polar area chart as a replacement for the treemap visualization
 * 
 * @param {CanvasRenderingContext2D} ctx - The canvas rendering context
 * @param {Array<Array<string|number>>} topSubGenres - Array of [genre, count] pairs for sub-genres
 * @param {Array<Array<string|number>>} majorGenres - Array of [genre, count] pairs for major genres
 * @returns {undefined} - Creates and renders the polar chart on the provided canvas context
 */
function createTreemapChart(ctx, topSubGenres, majorGenres) {
  // Replace treemap with a polar area chart since treemap is not available
  console.log("Treemap not available, using polar area chart instead");
  
  // Combine genres
  const allGenres = [...topSubGenres].slice(0, 30);
  
  // Create a dataset for the polar area chart
  const data = {
    labels: allGenres.map(g => g[0]),
    datasets: [{
      data: allGenres.map(g => g[1]),  // Use book counts as sizes
      backgroundColor: allGenres.map(() => 'rgba(54, 162, 235, 0.8)')
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
              // Limit to top 15 for legend to avoid overcrowding
              const original = Chart.registry.getPlugin('legend').defaults.labels.generateLabels;
              const labels = original.call(this, chart);
              
              return labels.slice(0, 15).map(label => {
                // Truncate long labels
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
