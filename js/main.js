// Wrap entire script in a self-executing function
(function(){

    // Pseudo-global variables
    var attrArray = ["broadband", "speed", "freedom", "cost", "social"];
    var expressed = attrArray[0];
    
    window.onload = setMap;
    
    // Main function to initiate the map
    function setMap(){
        var width = window.innerWidth * 0.5,
            height = 500;
    
        var map = d3.select("body")
            .append("svg")
            .attr("class", "map")
            .attr("width", width)
            .attr("height", height);
    
        var projection = d3.geoAlbers()
            .center([20, 52])
            .rotate([-10, 0])
            .parallels([40, 65])
            .scale(700)
            .translate([width / 2, height / 2]);
    
        var path = d3.geoPath().projection(projection);
    
        var promises = [
            d3.csv("data/europeInternetData.csv"),
            d3.json("data/europe.topojson")
        ];
    
        Promise.all(promises).then(callback);
    
        // Callback to process data once loaded
        function callback(data){
            var csvData = data[0],
                europe = data[1];
    
            // Convert TopoJSON to GeoJSON
            var geojsonData = topojson.feature(europe, europe.objects.europe).features;
            var colorScale = makeColorScale(csvData);
    
            geojsonData = joinData(geojsonData, csvData);
            drawMap(geojsonData, map, path, colorScale);
            setChart(csvData, colorScale);
            createDropdown(csvData);
        }
    }
    
    // Join CSV data to GeoJSON features
    function joinData(geojsonData, csvData){
        for (var i = 0; i < csvData.length; i++){
            var csvCountry = csvData[i],
                csvKey = csvCountry.id;
    
            for (var j = 0; j < geojsonData.length; j++){
                var geoProps = geojsonData[j].properties,
                    geoKey = geoProps.id;
    
                if (csvKey === geoKey){
                    attrArray.forEach(attr => {
                        geoProps[attr] = parseFloat(csvCountry[attr]);
                    });
                }
            }
        }
        return geojsonData;
    }
    
    // Create color scale based on selected attribute
    function makeColorScale(data){
        var colorClasses = ["#edf8fb", "#b2e2e2", "#66c2a4", "#2ca25f", "#006d2c"];
        var colorScale = d3.scaleQuantile().range(colorClasses);
        var domainArray = data.map(d => parseFloat(d[expressed]));
        colorScale.domain(domainArray);
        return colorScale;
    }
    
    // Draw countries on the map
    function drawMap(geojsonData, map, path, colorScale){
        var countries = map.selectAll(".country")
            .data(geojsonData)
            .enter()
            .append("path")
            .attr("class", d => "country " + d.properties.id)
            .attr("d", path)
            .style("fill", d => {
                var val = d.properties[expressed];
                return val ? colorScale(val) : "#ccc";
            })
            .on("mouseover", highlight)
            .on("mouseout", dehighlight);
    }
    
    // Create the bar chart
    function setChart(data, colorScale){
        
        //test
        console.log("Currently expressed:", expressed);
            data.forEach(d => {
                console.log(d.id, d[expressed], parseFloat(d[expressed]));
            });

        var chartWidth = window.innerWidth * 0.425,
            chartHeight = 500,
            padding = 25,
            innerWidth = chartWidth - padding * 2,
            innerHeight = chartHeight - padding * 2;
    
        var chart = d3.select("body")
            .append("svg")
            .attr("class", "chart")
            .attr("width", chartWidth)
            .attr("height", chartHeight);
    
        // Title above the chart
        chart.append("text")
            .attr("class", "chartTitle")
            .attr("x", padding)
            .attr("y", 30)
            .text("Internet " + expressed.charAt(0).toUpperCase() + expressed.slice(1) + " by Country");
    
        var yScale = d3.scaleLinear()
            .range([innerHeight, 0])
            .domain([0, d3.max(data, d => parseFloat(d[expressed])) * 1.1]);
    
        chart.selectAll(".bar")
            .data(data)
            .enter()
            .append("rect")
            .sort((a, b) => b[expressed] - a[expressed])
            .attr("class", d => "bar " + d.id)
            .attr("width", innerWidth / data.length - 1)
            .attr("x", (d, i) => i * (innerWidth / data.length) + padding)
            .attr("y", d => yScale(parseFloat(d[expressed])) + padding)
            .attr("height", d => innerHeight - yScale(parseFloat(d[expressed])))
            .style("fill", d => colorScale(d[expressed]))
            .on("mouseover", highlight)
            .on("mouseout", dehighlight);
    
        // Add vertical axis to the chart
        chart.append("g")
            .attr("class", "axis")
            .attr("transform", `translate(${padding}, ${padding})`)
            .call(d3.axisLeft(yScale));

            // Create x-axis scale
        var xScale = d3.scaleBand()
            .domain(data.map(d => d.id))  // Or use d.name if you prefer full names
            .range([padding, chartWidth - padding])
            .padding(0.1);

            // Create x-axis
        var xAxis = d3.axisBottom()
            .scale(xScale);

        // Append x-axis to chart
            chart.append("g")
            .attr("class", "axis x-axis")
            .attr("transform", `translate(0, ${chartHeight - padding})`)
            .call(xAxis)
            .selectAll("text")
            .attr("transform", "rotate(-45)")  // Optional: tilt labels
            .style("text-anchor", "end");


            // Create legend container
        var legend = chart.append("g")
            .attr("class", "legend")
            .attr("transform", `translate(${chartWidth - 150}, 40)`); // Position legend

            // Legend title
            legend.append("text")
            .attr("class", "legendTitle")
            .text("Higher Value → Darker Color");

            // Create legend color boxes
        var colorClasses = colorScale.range();

            colorClasses.forEach((color, i) => {
            legend.append("rect")
                .attr("x", 0)
                .attr("y", i * 20)
                .attr("width", 20)
                .attr("height", 20)
                .style("fill", color);
            });


    }
    
    // Highlight function for interaction
    function highlight(event, d){
        var id = d.id || d.properties.id;
        d3.selectAll("." + id)
            .style("stroke", "#000")
            .style("stroke-width", "2px");
    }
    
    // Remove highlight
    function dehighlight(event, d){
        var id = d.id || d.properties.id;
        d3.selectAll("." + id)
            .style("stroke", null)
            .style("stroke-width", null);
    }
    
    // Create dropdown for attribute switching
    function createDropdown(data){
        var dropdown = d3.select("body")
            .append("select")
            .attr("class", "dropdown")
            .on("change", function() {
                expressed = this.value;
                updateVisuals(data);
            });
    
        dropdown.selectAll("option")
            .data(attrArray)
            .enter()
            .append("option")
            .attr("value", d => d)
            .text(d => d.charAt(0).toUpperCase() + d.slice(1));
    }
    
    // Update map and chart when attribute is changed
    function updateVisuals(data){
        var colorScale = makeColorScale(data);
    
        d3.selectAll(".country")
            .transition()
            .duration(1000)
            .style("fill", d => {
                var val = d.properties[expressed];
                return val ? colorScale(val) : "#ccc";
            });
    
        var yScale = d3.scaleLinear()
            .range([450, 0])
            .domain([0, d3.max(data, d => parseFloat(d[expressed])) * 1.1]);
    
        d3.selectAll(".bar")
            .sort((a, b) => b[expressed] - a[expressed])
            .transition()
            .duration(1000)
            .attr("y", d => yScale(d[expressed]) + 25)
            .attr("height", d => 450 - yScale(d[expressed]))
            .style("fill", d => colorScale(d[expressed]));
    
        d3.select(".chartTitle")
            .text("Internet " + expressed.charAt(0).toUpperCase() + expressed.slice(1) + " by Country");
    }
    
    })();
    