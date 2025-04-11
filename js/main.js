// Wrap entire script in a self-executing function
(function(){

    // Global variables
    const attrArray = [ "broadband_coverage", "internet_speed","freedom_score", "internet_cost_pct_income", "social_media_penetration"];
    let expressed = attrArray[0];
    
    window.onload = setMap;
    
    function setMap(){
        const width = window.innerWidth * 0.5;
        const height = 500;
    
        const map = d3.select("#map")
            .append("svg")
            .attr("class", "map")
            .attr("width", width)
            .attr("height", height);
    
        const projection = d3.geoAlbers()
            .center([20, 52])
            .rotate([-10, 0])
            .parallels([40, 65])
            .scale(700)
            .translate([width / 2, height / 2]);
    
        const path = d3.geoPath().projection(projection);
    
        Promise.all([
            d3.csv("data/europeInternetData.csv"),
            d3.json("data/europe.topojson")
        ]).then(([csvData, europe]) => {
            const geojsonData = topojson.feature(europe, europe.objects.europe).features;
            joinData(geojsonData, csvData);
            const colorScale = makeColorScale(csvData);
    
            drawMap(geojsonData, map, path, colorScale);
            setChart(csvData, colorScale);
    
            d3.select("#attributeSelect")
                .on("change", function() {
                expressed = this.value;
                updateVisuals(csvData, geojsonData, map, path);
    });

        });
    }
    
    function joinData(geojsonData, csvData){
        csvData.forEach(csvCountry => {
            const csvKey = csvCountry.name;
            geojsonData.forEach(feature => {
                const geoKey = feature.properties.NAME;
                if(csvKey === geoKey){
                    attrArray.forEach(attr => {
                        feature.properties[attr] = parseFloat(csvCountry[attr]);
                    });
                }
            });
        });
    }
    
    function makeColorScale(data){
        const colorClasses = ["#edf8fb", "#b2e2e2", "#66c2a4", "#2ca25f", "#006d2c"];
        const colorScale = d3.scaleQuantile().range(colorClasses);
        colorScale.domain(data.map(d => parseFloat(d[expressed])));
        return colorScale;
    }
    
    function drawMap(geojsonData, map, path, colorScale){
        map.selectAll(".country")
            .data(geojsonData)
            .enter()
            .append("path")
            .attr("class", d => "country " + d.properties.NAME)
            .attr("d", path)
            .style("fill", d => d.properties[expressed] ? colorScale(d.properties[expressed]) : "#ccc")
            .on("mouseover", highlight)
            .on("mouseout", dehighlight);
    }
    
    function setChart(data, colorScale){
        const chartWidth = window.innerWidth * 0.425;
        const chartHeight = 500;
        const padding = 25;
        const innerWidth = chartWidth - padding * 2;
        const innerHeight = chartHeight - padding * 2;
    
        const chart = d3.select("#barChart")
            .append("svg")
            .attr("class", "chart")
            .attr("width", chartWidth)
            .attr("height", chartHeight);
    
        const yScale = d3.scaleLinear()
            .range([innerHeight, 0])
            .domain([0, 150]);
    
        const xScale = d3.scaleBand()
            .domain(data.map(d => d.id))
            .range([padding, chartWidth - padding])
            .padding(0.1);
    
        chart.selectAll(".bar")
            .data(data)
            .enter()
            .append("rect")
            .sort((a, b) => b[expressed] - a[expressed])
            .attr("class", d => "bar " + d.id)
            .attr("width", xScale.bandwidth())
            .attr("x", d => xScale(d.id))
            .attr("y", d => yScale(d[expressed]) + padding)
            .attr("height", d => innerHeight - yScale(d[expressed]))
            .style("fill", d => colorScale(d[expressed]))
            .on("mouseover", highlight)
            .on("mouseout", dehighlight);
    
        chart.append("g")
            .attr("class", "axis")
            .attr("transform", `translate(${padding}, ${padding})`)
            .call(d3.axisLeft(yScale));
    
        chart.append("g")
            .attr("class", "axis x-axis")
            .attr("transform", `translate(0, ${chartHeight - padding})`)
            .call(d3.axisBottom(xScale))
            .selectAll("text")
            .attr("transform", "rotate(-45)")
            .style("text-anchor", "end");
    
        // Add legend
        const legend = chart.append("g")
            .attr("class", "legend")
            .attr("transform", `translate(${chartWidth - 100}, 20)`);
    
        legend.append("text")
            .attr("class", "legendTitle")
            .text("Legend")
            .attr("x", 0)
            .attr("y", 0);
    
        legend.append("rect").attr("x", 0).attr("y", 10).attr("width", 20).attr("height", 20).style("fill", "#006d2c");
        legend.append("text").attr("x", 25).attr("y", 25).text("High");
        legend.append("rect").attr("x", 0).attr("y", 35).attr("width", 20).attr("height", 20).style("fill", "#edf8fb");
        legend.append("text").attr("x", 25).attr("y", 50).text("Low");
    }
    
    function highlight(event, d){
        const id = d.id || d.properties.id;
        d3.selectAll("." + id)
            .style("stroke", "#000")
            .style("stroke-width", "2px");
    }
    
    function dehighlight(event, d){
        const id = d.id || d.properties.id;
        d3.selectAll("." + id)
            .style("stroke", null)
            .style("stroke-width", null);
    }
    
    function updateVisuals(csvData, geojsonData, map, path){
        const colorScale = makeColorScale(csvData);
    
        // Update map colors
        d3.selectAll(".country")
            .transition()
            .duration(1000)
            .style("fill", d => d.properties[expressed] ? colorScale(d.properties[expressed]) : "#ccc");
    
        // Update chart scaling
        const yScale = d3.scaleLinear()
            .range([450, 0])
            .domain([0, d3.max(csvData, d => parseFloat(d[expressed])) * 1.1]);
    
        // Update bar chart
        d3.selectAll(".bar")
            .sort((a, b) => b[expressed] - a[expressed])
            .transition()
            .duration(1000)
            .attr("y", d => yScale(d[expressed]) + 25)
            .attr("height", d => 450 - yScale(d[expressed]))
            .style("fill", d => colorScale(d[expressed]));
    }
    
    
    })();
    