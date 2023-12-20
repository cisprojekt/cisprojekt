function mapFunctions(labelsResult, pointsToPlot, n){

//minor change

//initialize
var data = []
var y_coord = 0;
var x_coord = 0;

// width and height are values used for sizing the canvas svg
// take care that axis-widths are within the scope of width an height
const width = 1330;
const height = 750;

//var x_offset= 5; //not needed at the moment
//var y_offset= 5; //not needed at the moment

var currentZoomLevel = 1.0;

var x_axis_width = width; // length of x-axis in pixels
var x_max = 15 //initial domain shown on x axis starting with 0

var y_axis_width = height; // length of y-axis in pixels
var y_max = 15 //initial domain shown on y axis starting with 0

//var mouseCoords = [0,0] // array for storing mouse coords from event listener

var info_height = 30; // gives fixed size to all info svgs
var info_width = 300; // gives fixed size to all info svgs

var newDomainX = [0,0]; // array should not be empty, otherwise it breaks the interactivity before interacting with zoom functionality
var newDomainY = [0,0]; // array should not be empty, otherwise it breaks the interactivity before interacting with zoom functionality

// #### code for generating data points ####

// Function to generate a scaled y coordinate in pixels
function generate_y(){
    var max_y_value = y_max;
    var y_coord = 0
    y_coord = Math.random() * max_y_value //+ y_offset is now obsolete, because points get scaled by scaling func y() anyway
    return y_coord;
}

// Function to generate a scaled x coordinate in pixels
function generate_x(){
    var max_x_value = x_max;
    var x_coord = 0
    x_coord = Math.random() * max_x_value //+ x_offset is now obsolete, because points get scaled by scaling func x() anyway
    return x_coord;
}

//fill data array
for (let i = 0; i < 100; i++) {
    y_coord = generate_y();
    x_coord = generate_x();
    data.push([i, x_coord, y_coord]);
}

//transformation function from pixel to coordinates
function coordFromPixels(x_coord, y_coord) { //_coord=Pix
    var xKoord = xScale.invert(x_coord);
    var yKoord = yScale.invert(y_coord);
    return {x: xKoord, y: yKoord};
}

//fetching points according to current zoom level (out of all points)
function getAverages(currentZoomLevel) {
    var sums = {};
    for (var i = 0; i < n; i++) {
      var label =
        labelsResult[
          i + n * (zoomLevels - 5 - Math.round(currentZoomLevel))
        ];
      var point = pointsToPlot[i];
      if (!sums[label]) {
        sums[label] = { x: 0, y: 0, count: 0 };
      }
      sums[label].x += point.x;
      sums[label].y += point.y;
      sums[label].count++;
    }
    var averages = [];
    for (var label in sums) {
      averages.push({
        x: sums[label].x / sums[label].count,
        y: sums[label].y / sums[label].count,
        r: sums[label].count,
        });
    }

    return averages;
  }

// ##### scaling functions for axis ####

// Declare the y (vertical position) scale.
const y = d3.scaleLinear()
    .domain([-y_max, y_max]) //initial domain shown on y axis [0,...]
    .range([-y_axis_width, y_axis_width]); // //length of axis in pixel on reference svg

// Declare the x (horizontal position) scale.
const x = d3.scaleLinear()
    .domain([-x_max, x_max]) //initial domain shown on x axis [0,...]
    .range([-x_axis_width, x_axis_width]); //length of axis in pixel on reference svg

// #### remaining code: creating svgs and handeling zoom ####

//initialize svg
const svg = d3.select("#chartContainer").append("svg")
    .attr("width", width)
    .attr("height", height)
    .on("mousemove", function(event){
        var mouseCoords = d3.pointer(event);
        var invertedCoords = d3.zoomTransform(this).invert(mouseCoords); // calculating the true mouse coordinates accounting für zoom and drag on a svg
        infoMouse.select("text").text("Mouse coordinates: " + x.invert(invertedCoords[0]).toFixed(3) + ", " +  y.invert(invertedCoords[1]).toFixed(3)); // .invert() accounts for the changes in scaling on the axis
    });

// Add the x-axis.
var xAxis = svg.append("g")
    //.attr("transform", "translate(0,30)")
    //.attr("x", 0) //.attr() of x and y replaces .attr("transform", "translate(x,y)") because of known bug for various browsers
    //.attr("y",y_offset)
    .call(d3.axisBottom(x));

// Add the y-axis.
var yAxis = svg.append("g")
    //.attr("transform", "translate(0,30)")
    //.attr("x", 0) //.attr() of x and y replaces .attr("transform", "translate(x,y)") because of known bug for various browsers
    //.attr("y",y_offset)
    .call(d3.axisRight(y));

// Add a tooltip div. Here we define the general feature of the tooltip: stuff that do not depend on the data point.
// Its opacity is set to 0: we don't see it by default.
// taken from https://d3-graph-gallery.com/graph/scatter_tooltip.html and adapted to the current version of d3js
// supplemented with infos from https://chartio.com/resources/tutorials/how-to-show-data-on-mouseover-in-d3js/
var tooltip_svg = d3.select("#my_dataviz").append("svg")
    .attr("width", 50)
    .attr("height", 50)
    //.style("pointer-events", "none"); // deactivates the possiblity to interact with the svg at all; doesnt work

var tooltip = d3.select("#chartContainer")
    .append("div")
    .style("opacity", 0)
    .attr("class", "tooltip")
    .style("background-color", "white")
    .style("border", "solid")
    .style("border-width", "1px")
    .style("border-radius", "5px")
    .style("padding", "0px")
    .style("position", "absolute");

// Add dots to plot 
svg.selectAll("circle")
    .data(getAverages(1))
    .enter()
    .append("circle")
        .attr("cx", function(d) {return x(d[1]); }) //function x determines the linear scaling factor relativ to the x-axis as defined above
        .attr("cy", function(d) {return y(d[2]); }) //function y determines the linear scaling factor relativ to the y-axis as defined above
        .attr("r", 5)
        .style("fill", "#0000ff") 
        .style("fill-opacity", 0.5)
        .on("mouseover", function(event, d) {
        // A function that change this tooltip when the user hover a point.
        // Its opacity is set to 1: we can now see it. Plus it set the text and position of tooltip depending on the datapoint (d)
            console.log(event)
            tooltip.transition()
                .duration(0)
                .style("opacity", 0.9)
            tooltip.html("x: " + (d[1]).toFixed(3) + " y: " + (d[2]).toFixed(3))
                .style("left", (event.pageX) + "px")
                .style("top", (event.pageY - 28) + "px");
            tooltip.transition()
                .duration(2500)
                .style("opacity", 0)
        })
        /* .on("mouseleave", function(event) {
            // A function that change this tooltip when the leaves a point: just need to set opacity to 0 again
            console.log(event)
            tooltip.transition()
                .duration(1)
                .style("opacity", 0);
        }); */

// Create a zoom behavior function
var zoom = d3.zoom()
    .scaleExtent([0,200])
    .on("zoom", handleZoom);

// Define the event handler function for zoom
function handleZoom(event) {
    
    //variable to store current zoom level 
    currentZoomLevel = event.transform.k;
    infoZoom.select("text").text("Zoom: "+ currentZoomLevel.toFixed(5));
    
    //Enable the rescaling of the axes
    var newX = event.transform.rescaleX(x);
    var newY = event.transform.rescaleY(y);

    // Get the new domains of the x and y scales
    newDomainX = newX.domain();
    newDomainY = newY.domain();

    // update axes with these new boundaries
    xAxis.call(d3.axisBottom(newX))
    yAxis.call(d3.axisRight(newY))

    //attach the dynamic text of Coords to InfoScalingText svg
    //scaled with .ToFixed() method to shorten the whole float
    infoScalingX.select("text").text("Xmin: " + newDomainX[0].toFixed(3) + ", Xmax: " + newDomainX[1].toFixed(3));
    infoScalingY.select("text").text("Ymin: " + newDomainY[0].toFixed(3) + ", Ymax: " + newDomainY[1].toFixed(3));

    // gives and draws new position of drawn circles
    svg.selectAll("circle")
        //.attr('cx', function(d) {return newX(d[1])})
        //.attr('cy', function(d) {return newY(d[2])});
    
        let averages = getAverages(currentZoomLevel);

        var circles = svg.selectAll("circle").data(averages);
        console.log(averages);

        circles.exit().remove();

        circles
          .enter()
          .append("circle")
          .merge(circles)
          .attr("r", function(d){
            return(d.r*2);
          })

          .attr("cx", function (d) {
            return (d.x);
          })
          .attr("cy", function (d) {
            return (d.y);
          })
          .attr("transform", event.transform);
}

// Append a new SVG element to the existing SVG
var infoZoom = svg.append("svg")
    .attr("width", info_width)
    .attr("height", info_height)
    .style("background-color", "white")
    .attr("x", 1030) //.attr() of x and y replaces .attr("transform", "translate(x,y)") because of known bug for various browsers
    .attr("y",15)
    .style("opacity", 0.5);

//frame for infoZoom SVG
infoZoom.append("rect")
    .attr("x", 0)
    .attr("y", 0)
    .attr("width", info_width)
    .attr("height", info_height)
    .style("fill", "white")
    .style("stroke", "black")
    .style("stroke-width", "1px")

//appends text area to Zoom SVG
var InfoZoomText = infoZoom.append("text")
    .attr("x", 5)
    .attr("y", 20)
    .text("Zoom:" + currentZoomLevel.toFixed(5)); // toFixed(x) rounds to x decimal places

// Append a new SVG element to the existing SVG
var infoMouse = svg.append("svg")
    .attr("width", info_width)
    .attr("height", info_height)
    .style("background-color", "white")
    .attr("x", 1030) //.attr() of x and y replaces .attr("transform", "translate(x,y)") because of known bug for various browsers
    .attr("y",45)
    .style("opacity", 0.5);


//frame for infoMouse SVG
infoMouse.append("rect")
    .attr("x", 0)
    .attr("y", 0)
    .attr("width", info_width)
    .attr("height", info_height)
    .style("fill", "white")
    .style("stroke", "black")
    .style("stroke-width", "1px");

//appends text area to MouseInfo SVG
var InfoMouseText = infoMouse.append("text")
    .attr("x", 5)
    .attr("y", 20);

// Append a new SVG element to the existing SVG
var infoScalingX = svg.append("svg")
    .attr("width", info_width)
    .attr("height", info_height)
    .style("background-color", "white")
    .attr("x", 1030) //.attr() of x and y replaces .attr("transform", "translate(x,y)") because of known bug for various browsers
    .attr("y",75)
    .style("opacity", 0.5);

//frame for infoMouse SVG
infoScalingX.append("rect")
    .attr("x", 0)
    .attr("y", 0)
    .attr("width", info_width)
    .attr("height", info_height)
    .style("fill", "white")
    .style("stroke", "black")
    .style("stroke-width", "1px");

//appends text area to MouseInfo SVG
var InfoScaling_X_Text = infoScalingX.append("text")
    .attr("x", 5)
    .attr("y", 20)
    .text("Xmin: " + 0 + ", Xmax: " + x_max);

// Append a new SVG element to the existing SVG
var infoScalingY = svg.append("svg")
    .attr("width", info_width)
    .attr("height", info_height)
    .style("background-color", "white")
    .attr("x", 1030) //.attr() of x and y replaces .attr("transform", "translate(x,y)") because of known bug for various browsers
    .attr("y",105)
    .style("opacity", 0.5);

//frame for infoMouse SVG
infoScalingY.append("rect")
    .attr("x", 0)
    .attr("y", 0)
    .attr("width", info_width)
    .attr("height", info_height)
    .style("fill", "white")
    .style("stroke", "black")
    .style("stroke-width", "1px");

//appends text area to MouseInfo SVG
var InfoScaling_Y_Text = infoScalingY.append("text")
    .attr("x", 5)
    .attr("y", 20)
    .text("Ymin: " + 0 + ", Ymax: " + y_max);

//create html button element and append it to svg
var button_reset_embed = svg.append('foreignObject')
    .attr('x', width-200)
    .attr('y', height-60)
    .attr('width', 200)
    .attr('height', 60)
    .style("opacity", 0.9);

//append reset button to embedding for button
var button_reset = button_reset_embed.append('xhtml:button')
    .text('Reset View')
    .style('color', 'white')
    .style('background-color', '#0080ff')
    .on('mouseover', function() {
        // Change the color of the button when hovered over
        d3.select(this).style('background-color', '#3b9dff'); // Change the background color
    })
    .on('mouseout', function() {
        // Change the color of the button back to its original color when the mouse moves out
        d3.select(this).style('background-color', '#0080ff'); // Change the background color back to blue
    })
    .on('click', function() {
        svg.call(zoom.transform, d3.zoomIdentity); // d3.zoomIdentity conviniently resets all changes to zoom behaviour
    });

    
// Attach the zoom behavior to the SVG element
svg.call(zoom);
}
