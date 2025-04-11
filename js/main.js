// Wrap entire script in a self-executing function
(function(){

    var attrArray = ["broadband", "speed", "freedom", "cost", "social"];
    var expressed = attrArray[0];
    
    window.onload = setMap;
    
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
    
        Promise.all(promises).then(function(data){
            var csvData = data[0],
                europe = data[1];
    
            var geojsonData = topojson.feature(europe, europe.objects.europe).features;
    
            joinData(geojsonData, csvData);
            var colorScale = makeColorScale(csvData);
    
            drawMap(geojsonData, map, path, colorScale);
            setChart(csvData, colorScale);
            createDropdown(csvData);
        });
    }
    
    function joinData(geojsonData, csvData){
        csvData.forEach(csvCountry => {
            var csvKey = csvCountry.id;
    
            geojsonData.forEach(geoFeature => {
                if (geoFeature.properties.id === csvKey) {
                    attrArray.forEach(attr => {
                        geoFeature.properties[attr] = parseFloat(csvCountry[attr]);
                    });
                }
            });
        });
    }
    
    function makeColorScale(data){
        var colorClasses = ["#edf8fb", "#b2e2e2", "#66c2a4", "#2ca25f", "#006d2c"];
        var colorScale = d3.scaleQuantile().range(colorClasses);
    
        var domainArray = data.map(d => parseFloat(d[expressed]));
        colorScale.domain(domainArray);
    
        return colorScale;
    }
    
    function drawMap(geojsonData, map, path, colorScale){
        map.selectAll(".country")
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
    
    function setChart(data, colorScale){
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
    
        chart.append("text")
            .attr("class", "chartTitle")
            .attr("x", padding)
            .attr("y", 30)
            .text("Internet " + capitalize(expressed) + " by Country");
    
        var yScale = d3.scaleLinear()
            .range([innerHeight, 0])
            .domain([0, d3.max(data, d => parseFloat(d[expressed])) * 1.1]);
    
        var xScale = d3.scaleBand()
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
            .attr("y", d => yScale(parseFloat(d[expressed])) + padding)
            .attr("height", d => innerHeight - yScale(parseFloat(d[expressed])))
            .style("fill", d => colorScale(d[expressed]))
            .on("mouseover", highlight)
            .on("mouseout", dehighlight);
    
        chart.append("g")
            .attr("class", "axis x-axis")
            .attr("transform", `translate(0, ${chartHeight - padding})`)
            .call(d3.axisBottom(xScale))
            .selectAll("text")
            .attr("transform", "rotate(-45)")
            .style("text-anchor", "end");
    
        chart.append("g")
            .attr("class", "axis")
            .attr("transform", `translate(${padding}, ${padding})`)
            .call(d3.axisLeft(yScale));
    
        drawLegend(colorScale, chartWidth);
    }
    
    function drawLegend(colorScale, chartWidth){
        var legend = d3.select("body")
            .append("svg")
            .attr("class", "legend")
            .attr("width", 150)
            .attr("height", 60)
            .style("position", "absolute")
            .style("top", "20px")
            .style("right", "30px");
    
        legend.append("text")
            .attr("x", 0)
            .attr("y", 15)
            .text("Legend");
    
        var colors = colorScale.range();
    
        legend.append("rect").attr("x", 10).attr("y", 25).attr("width", 20).attr("height", 15).style("fill", colors[colors.length - 1]);
        legend.append("text").attr("x", 35).attr("y", 37).text("High");
    
        legend.append("rect").attr("x", 80).attr("y", 25).attr("width", 20).attr("height", 15).style("fill", colors[0]);
        legend.append("text").attr("x", 105).attr("y", 37).text("Low");
    }
    
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
            .text(d => capitalize(d));
    }
    
    function updateVisuals(data){
        var colorScale = makeColorScale(data);
    
        d3.selectAll(".country")
            .transition()
            .duration(1000)
            .style("fill", d => {
                var val = d.properties[expressed];
                return val ? colorScale(val) : "#ccc";
            });
    
        d3.select(".chartTitle")
            .text("Internet " + capitalize(expressed) + " by Country");
    
        d3.select(".legend").remove();
        drawLegend(colorScale);
    }
    
    function highlight(event, d){
        var id = d.id || d.properties.id;
        d3.selectAll("." + id)
            .style("stroke", "#000")
            .style("stroke-width", "2px");
    }
    
    function dehighlight(event, d){
        var id = d.id || d.properties.id;
        d3.selectAll("." + id)
            .style("stroke", null)
            .style("stroke-width", null);
    }
    
    function capitalize(str){
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
    
    })();
    