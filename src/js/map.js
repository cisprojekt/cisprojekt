function mapFunctions(labelsResult, pointsToPlot, n, zoomLevels, clusterInfos) {
  //initialize
  var data = [];
  var y_coord = 0;
  var x_coord = 0;

  // width and height are values used for sizing the canvas svg
  // take care that axis-widths are within the scope of width an height
  const width = 1330;
  const height = 750;

  //var help_var = 1;
  var transform = 0; //variable to store current event.transform from handleZoom
  var button_zoom_level_old = 0.0; //starting var button_zoom_level -1 so that the if case in Event handler is taken and thus the points get loaded
  var currentZoomLevel = 1.0;
  var button_zoom_level = 1.0; // starting layer of points which are generated
  var x_axis_width = width; // length of x-axis in pixels
  var x_max = 15; //initial domain shown on x axis starting with 0

  var y_axis_width = height; // length of y-axis in pixels
  var y_max = 15; //initial domain shown on y axis starting with 0

  var info_height = 30; // gives fixed size to all info svgs
  var info_width = 150; // gives fixed size to all info svgs

  var newDomainX = [0, 0]; // array should not be empty, otherwise it breaks the interactivity before interacting with zoom functionality
  var newDomainY = [0, 0]; // array should not be empty, otherwise it breaks the interactivity before interacting with zoom functionality

  //transformation function from pixel to coordinates
  function coordFromPixels(x_coord, y_coord) {
    //_coord=Pix
    var xKoord = xScale.invert(x_coord);
    var yKoord = yScale.invert(y_coord);
    return { x: xKoord, y: yKoord };
  }

  //fetching points according to current zoom level (out of all points)
  function getAverages(currentZoomLevel) {
    var sums = {};
    for (var i = 0; i < n; i++) {
      var label =
        labelsResult[i + n * (zoomLevels - 5 - Math.round(currentZoomLevel))];
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

    console.log(averages);
    return averages;
  }

  // ##### scaling functions for axis ####

  // Declare the y (vertical position) scale.
  const y = d3
    .scaleLinear()
    .domain([-y_max, y_max]) //initial domain shown on y axis
    .range([-y_axis_width, y_axis_width]); // //length of axis in pixel on reference svg

  // Declare the x (horizontal position) scale.
  const x = d3
    .scaleLinear()
    .domain([-x_max, x_max]) //initial domain shown on x axis
    .range([-x_axis_width, x_axis_width]); //length of axis in pixel on reference svg

  // #### remaining code: creating svgs and handeling zoom ####

  //initialize svg
  var svg = d3
    .select("#chartContainer")
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .on("mousemove", function (event) {
      var mouseCoords = d3.pointer(event);
      var invertedCoords = d3.zoomTransform(this).invert(mouseCoords); // calculating the true mouse coordinates accounting für zoom and drag on a svg
      /* infoMouse
        .select("text")
        .text(
          "Mouse coordinates: " +
            x.invert(invertedCoords[0]).toFixed(3) +
            ", " +
            y.invert(invertedCoords[1]).toFixed(3),
        ); // .invert() accounts for the changes in scaling on the axis */
    });

  // Add the x-axis.
  var xAxis = svg.append("g").call(d3.axisBottom(x));

  // Add the y-axis.
  var yAxis = svg.append("g").call(d3.axisRight(y));

  // Add a tooltip div. Here we define the general feature of the tooltip: stuff that do not depend on the data point.
  // Its opacity is set to 0: we don't see it by default.
  // taken from https://d3-graph-gallery.com/graph/scatter_tooltip.html and adapted to the current version of d3js
  // supplemented with infos from https://chartio.com/resources/tutorials/how-to-show-data-on-mouseover-in-d3js/
  var tooltip_svg = d3
    .select("#my_dataviz")
    .append("svg")
    .attr("width", 50)
    .attr("height", 50);

  var tooltip = d3
    .select("#chartContainer")
    .append("div")
    .style("opacity", 0)
    .attr("class", "tooltip")
    .style("background-color", "white")
    .style("border", "solid")
    .style("border-width", "1px")
    .style("border-radius", "5px")
    .style("padding", "0px")
    .style("position", "absolute");

  // Create a zoom behavior function
  var zoom = d3
    .zoom()
    .scaleExtent([1, zoomLevels - 5])
    .on("zoom", handleZoom);

  // Add (initial) circles to plot
  svg
    .selectAll("circle")
    .data(getAverages(1))
    .enter()
    .append("circle")
    .attr("cx", function (d) {
      return d.x;
    })
    .attr("cy", function (d) {
      return d.y;
    })
    .attr("r", function (d) {
      return d.r * 1;
    })
    .style("fill", "#0000ff")
    .style("fill-opacity", 0.5)
    .on("click", function (event, d) {
      console.log(event);
      svg.selectAll("circle").on("click", null);
      d3.select(this).style("fill", "red");
    });

  // Define the event handler function for zoom
  function handleZoom(event) {
    //variable to store current zoom level
    currentZoomLevel = event.transform.k;

    transform = event.transform;

    // Apply the transform to the desired element
    //button_change_layer_in.attr("transform", event.transform);
    //button_change_layer_out.attr("transform", event.transform);

    /* if (help_var == 1) {
      button_zoom_level_old = 0; //starting var button_zoom_level -1 so that the if case in Event handler is taken and thus the points get loaded
      help_var += 1;
    } */
    //infoZoom.select("text").text("Zoom: " + currentZoomLevel.toFixed(5));

    //Enable the rescaling of the axes
    var newX = event.transform.rescaleX(x);
    var newY = event.transform.rescaleY(y);

    // Get the new domains of the x and y scales
    newDomainX = newX.domain();
    newDomainY = newY.domain();

    // update axes with these new boundaries
    xAxis.call(d3.axisBottom(newX));
    yAxis.call(d3.axisRight(newY));

    infoHierarchyLevel
      .select("text")
      .text("hierarchy level: " + button_zoom_level);

    //button_zoom_level_old +=1;

    //let averages = getAverages(button_zoom_level);
    var circles = svg.selectAll("circle");

    // if case for determining if new points need to be loaded
    if (button_zoom_level_old !== button_zoom_level) {
      //let averages = getAverages(button_zoom_level);
      let averages = getAverages(button_zoom_level);
      var circles = svg.selectAll("circle").data(averages);

      button_zoom_level_old = button_zoom_level;
      //button_zoom_level_old = 1 + button_zoom_level_old;

      console.log(
        "button_zoom_level_old in handleZoom " + button_zoom_level_old,
      );
      console.log("button_zoom_level in handleZoom " + button_zoom_level);

      circles.exit().remove();

      circles
        .enter()
        .append("circle")
        .merge(circles)
        .attr("r", function (d) {
          return d.r * 1;
        })

        .attr("cx", function (d) {
          return d.x;
        })
        .attr("cy", function (d) {
          return d.y;
        })
        .style("fill", "#0000ff")
        .style("fill-opacity", 0.5)
        .attr("transform", event.transform)
        .on("click", function (event, d) {
          console.log(event);
          svg.selectAll("circle").on("click", null);
          d3.select(this).style("fill", "red");
        });
    } else {
      circles
        .attr("transform", event.transform)
        .on("click", function (event, d) {
          console.log(event);
          svg.selectAll("circle").on("click", null);
          d3.select(this).style("fill", "red");
        });
    }
  }

  // Append a new SVG element to the existing SVG
  var infoHierarchyLevel = svg
    .append("svg")
    .attr("width", info_width)
    .attr("height", info_height)
    .style("background-color", "white")
    .attr("x", width - 200) //.attr() of x and y replaces .attr("transform", "translate(x,y)") because of known bug for various browsers
    .attr("y", 30)
    .style("opacity", 1);

  //frame for infoZoom SVG
  infoHierarchyLevel
    .append("rect")
    .attr("x", 0)
    .attr("y", 0)
    .attr("width", info_width)
    .attr("height", info_height)
    .style("fill", "white")
    .style("stroke", "black")
    .style("stroke-width", "2px");

  //appends text area to Zoom SVG
  var infoHierarchyLevelText = infoHierarchyLevel
    .append("text")
    .attr("x", 5)
    .attr("y", 20)
    .text("hierarchy level: " + button_zoom_level);

  //create html button element and append it to svg
  var button_reset_embed = svg
    .append("foreignObject")
    .attr("x", width - 200)
    .attr("y", height - 60)
    .attr("width", 200)
    .attr("height", 60)
    .style("opacity", 0.9);

  //append reset button to embedding for button
  var button_reset = button_reset_embed
    .append("xhtml:button")
    .text("Reset View")
    .style("color", "white")
    .style("background-color", "#0080ff")
    .on("mouseover", function () {
      // Change the color of the button when hovered over
      d3.select(this).style("background-color", "#3b9dff"); // Change the background color
    })
    .on("mouseout", function () {
      // Change the color of the button back to its original color when the mouse moves out
      d3.select(this).style("background-color", "#0080ff"); // Change the background color back to blue
    })
    .on("click", function () {
      svg.call(zoom.transform, d3.zoomIdentity); // d3.zoomIdentity conviniently resets all changes to zoom behaviour
    });

  //create html button element and append it to svg
  var button_change_layer_in_embed = svg
    .append("foreignObject")
    .attr("x", width - 200)
    .attr("y", height - 120)
    .attr("width", 200)
    .attr("height", 60)
    .style("opacity", 0.9);

  var button_change_layer_in = button_change_layer_in_embed
    .append("xhtml:button")
    .text("-")
    .style("color", "white")
    .style("background-color", "#0080ff")
    .on("mouseover", function () {
      // Change the color of the button when hovered over
      d3.select(this).style("background-color", "#3b9dff"); // Change the background color
    })
    .on("mouseout", function () {
      // Change the color of the button back to its original color when the mouse moves out
      d3.select(this).style("background-color", "#0080ff"); // Change the background color back to blue
    })
    .on("click", function () {
      button_zoom_level -= 1;
    });

  var button_change_layer_out_embed = svg
    .append("foreignObject")
    .attr("x", width - 200)
    .attr("y", height - 180)
    .attr("width", 200)
    .attr("height", 60)
    .style("opacity", 0.9);

  var button_change_layer_out = button_change_layer_out_embed
    .append("xhtml:button")
    .text("+")
    .style("color", "white")
    .style("background-color", "#0080ff")
    .on("mouseover", function () {
      // Change the color of the button when hovered over
      d3.select(this).style("background-color", "#3b9dff"); // Change the background color
    })
    .on("mouseout", function () {
      // Change the color of the button back to its original color when the mouse moves out
      d3.select(this).style("background-color", "#0080ff"); // Change the background color back to blue
    })
    .on("click", function () {
      button_zoom_level += 1;
    });

  // Attach the zoom behavior to the SVG element and change zoom on double click so that it is not possible to zoom in further but handleZoom is still called
  d3.select("svg")
    .call(zoom)
    .on("click.zoom", function (event) {
      // Get the current transform
      //transform = event.transform; // variable is already set in handleZoom and just creates errors here
      // Define the scale factor for the minimal zoom
      var scaleFactor = 1;
      // Apply the minimal zoom by a specific value
      svg
        .transition()
        .duration(0)
        .call(zoom.transform, transform.scale(scaleFactor));
    });

  // Attach the zoom behavior to the SVG element and disable zoom on double click
  d3.select("svg").call(zoom).on("dblclick.zoom", null);
}
