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
            d3.csv("data/internetData.csv"),
            d3.json("data/europe.topojson")
        ];
    
        Promise.all(promises).then(function(data) {
            var csvData = data[0],
                europe = data[1];
    
            var geojsonData = topojson.feature(europe, europe.objects.europe).features;
            joinData(geojsonData, csvData);
            var colorScale = makeColorScale(csvData);
    
            drawMap(geojsonData, map, path, colorScale);
            setChart(csvData, colorScale);
            createDropdown(csvData);
            drawLegend(colorScale);
        });
    }
    
    function joinData(geojsonData, csvData){
        for (let i = 0; i < csvData.length; i++){
            var csvCountry = csvData[i],
                csvKey = csvCountry.id;
    
            for (let j = 0; j < geojsonData.length; j++){
                var geoProps = geojsonData[j].properties,
                    geoKey = geoProps.id;
    
                if (csvKey === geoKey){
                    attrArray.forEach(attr => {
                        geoProps[attr] = parseFloat(csvCountry[attr]);
                    });
                }
            }
        }
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
    
        var xLabels = data.map(d => d.id);
        var xScale = d3.scaleBand()
            .domain(xLabels)
            .range([0, innerWidth]);
    
        chart.append("g")
            .attr("class", "x axis")
            .attr("transform", `translate(${padding}, ${chartHeight - padding})`)
            .call(d3.axisBottom(xScale))
            .selectAll("text")
            .style("text-anchor", "end")
            .attr("dx", "-0.5em")
            .attr("dy", "0.15em")
            .attr("transform", "rotate(-45)");
    
        chart.append("g")
            .attr("class", "axis")
            .attr("transform", `translate(${padding}, ${padding})`)
            .call(d3.axisLeft(yScale));
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
            .text("Internet " + capitalize(expressed) + " by Country");
    
        d3.select(".legend").remove(); // Remove old legend
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
    
    function drawLegend(colorScale){
        var legendWidth = 150,
            legendHeight = 50;
    
        var legend = d3.select("body")
            .append("svg")
            .attr("class", "legend")
            .attr("width", legendWidth)
            .attr("height", legendHeight)
            .style("position", "absolute")
            .style("top", "20px")
            .style("right", "30px");
    
        legend.append("text")
            .attr("x", 0)
            .attr("y", 15)
            .attr("class", "legendTitle")
            .style("font-weight", "bold")
            .text("Legend");
    
        var colors = colorScale.range();
    
        legend.append("rect")
            .attr("x", 10)
            .attr("y", 25)
            .attr("width", 30)
            .attr("height", 15)
            .style("fill", colors[colors.length - 1]);
    
        legend.append("text")
            .attr("x", 45)
            .attr("y", 37)
            .text("High");
    
        legend.append("rect")
            .attr("x", 90)
            .attr("y", 25)
            .attr("width", 30)
            .attr("height", 15)
            .style("fill", colors[0]);
    
        legend.append("text")
            .attr("x", 125)
            .attr("y", 37)
            .text("Low");
    }
    
    })();
    