// Polar chart functionality for stats visualization

// Create a polar area chart for genres (replacement for treemap)
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
