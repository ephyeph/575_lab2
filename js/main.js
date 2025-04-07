// Wrap the script in a self-executing function to avoid polluting the global namespace
(function() {
    // Define dimensions for the map and bar chart
    const width = 800, height = 500;
  
    // Append the SVG for the map
    const mapSvg = d3.select("#map").append("svg")
      .attr("width", width)
      .attr("height", height);
  
    // Append the SVG for the bar chart
    const barChartSvg = d3.select("#barChart").append("svg")
      .attr("width", width)
      .attr("height", height);
  
    // Define a projection and path generator for the map
    const projection = d3.geoMercator()
      .scale(500)
      .translate([width / 2, height / 1.5]);
  
    const path = d3.geoPath().projection(projection);
  
    // Load the TopoJSON and CSV data
    Promise.all([
      d3.json("data/europe.topojson"),
      d3.csv("data/europeInternetData.csv")
    ]).then(([europe, data]) => {
      // Process and join the data here
      // Render the map and bar chart
    }).catch(error => {
      console.error("Error loading the data: ", error);
    });
  
  })();
  