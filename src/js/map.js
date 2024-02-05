var exportFile;

function mapFunctions(
  labelsResult,
  pointsToPlot,
  n,
  zoomLevels,
  clusterInfos,
  flagColumnNames,
  numflags_array,
) {
  /**
   * This function exports the function parameters to a JSON file, which will be saved as 'result.json'
   **/
  exportFile = function () {
    var a = window.document.createElement("a");
    var jsonText = JSON.stringify([
      labelsResult,
      pointsToPlot,
      n,
      zoomLevels,
      clusterInfos,
    ]);
    a.href = window.URL.createObjectURL(
      new Blob([jsonText], { type: "application/json" }),
    );
    a.download = "result.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };
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
  var x_max = 2; //initial domain shown on x axis starting with 0

  var y_axis_width = height; // length of y-axis in pixels
  var y_max = 2; //initial domain shown on y axis starting with 0

  var info_height = 30; // gives fixed size to all info svgs
  var info_width = 150; // gives fixed size to all info svgs

  var newDomainX = [0, 0]; // array should not be empty, otherwise it breaks the interactivity before interacting with zoom functionality
  var newDomainY = [0, 0]; // array should not be empty, otherwise it breaks the interactivity before interacting with zoom functionality

  // we create a variable to store the label of the previous selected point
  // for some reason this has to be a global variable, otherwise it does not work
  var selectedPoint = null;

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
      var label = labelsResult[i + n * (zoomLevels - currentZoomLevel)];
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
        r: Math.log2(sums[label].count + 1) / Math.log2(5),
        l: label,
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
    .style("background-color", "white")
    .on("mousemove", function (event) {
      var mouseCoords = d3.pointer(event);
      var invertedCoords = d3.zoomTransform(this).invert(mouseCoords); // calculating the true mouse coordinates accounting for zoom and drag on a svg
    });

  // Add the x-axis.
  var xAxis = svg.append("g").call(d3.axisBottom(x));

  // Add the y-axis.
  var yAxis = svg.append("g").call(d3.axisRight(y));

  // Create a zoom behavior function
  var zoom = d3.zoom().scaleExtent([1, zoomLevels]).on("zoom", handleZoom);

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
    //save the label of the point
    .attr("data-id", function (d) {
      return d.l;
    })
    .style("fill", "#0000ff")
    .style("fill-opacity", 0.5)
    .on("click", function (event, d) {
      svg.selectAll("circle").on("click", null);
      d3.select(this).style("fill", "red");
    });

  /* This function handles zoom in all its details.
   *
   * @param {Object} event - abstract object of the zoom method which saves and handles all interactions with svg regarding the zoom functionality
   * @returns {Object} - implicit return of changed event due to interaction with user
   */
  function handleZoom(event) {
    //variable to store current zoom level
    currentZoomLevel = event.transform.k;

    transform = event.transform;

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

    var circles = svg.selectAll("circle");

    // if case for determining if new points need to be loaded
    if (button_zoom_level_old !== button_zoom_level) {
      let averages = getAverages(button_zoom_level);
      var circles = svg.selectAll("circle").data(averages);

      button_zoom_level_old = button_zoom_level;

      circles.exit().remove();

      circles
        .enter()
        .append("circle")
        .merge(circles)
        .attr("r", function (d) {
          return d.r * 1;
        })

        .attr("cx", function (d) {
          return x(d.x);
        })
        .attr("cy", function (d) {
          return y(d.y);
        })
        //save the label of the point
        .attr("data-id", function (d) {
          return d.l;
        })
        .style("fill", "#0000ff") //blue
        .style("fill-opacity", 0.5) //to visualize overlaps of clusters, since the colour will darken when it overlaps
        .attr("transform", event.transform)
        .on("click", function (event, d) {
          svg.selectAll("circle").on("click", null);
          d3.select(this).style("fill", "red");
        });
    } else {
      circles
        .attr("transform", event.transform)
        .on("click", function (event, d) {
          //unselect previous clicked point if there is one
          if (selectedPoint != null) {
            svg
              .selectAll("circle")
              .filter(function (d) {
                return d.l == selectedPoint;
              })
              .transition()
              .style("fill", "rgb(0, 0, 255)"); // Set the color of the previous point to blue
            d3.select(this).lower();
          }
          //if the same point is clicked again dont select it again
          //else select the point
          if (selectedPoint == d.l) {
            selectedPoint = null;
          } else {
            d3.select(this).style("fill", "red");
            selectedPoint = d.l;
          }
          //update the cluster info box with the information of the selected point
          updateClusterInfoBox(
            selectedPoint,
            clusterInfos,
            button_zoom_level,
            flagColumnNames,
            numflags_array,
          );
          // Now you can get any attribute of the clicked circle
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

/**
 * This function updates the cluster information box with the information of the selected cluster.
 *
 * @param {number} selectedPoint - The label of the selected cluster
 * @param {Array<Array<Cluster>>} clusterInfos - The cluster information for each zoom level
 * @param {number} zoomLevel - The current zoom level
 * @param {Array<Array<string>>} flagColumnNames - The names of the flag columns first element is array for nonnumflags, second element is array for numflags
 * @param {Array<Array<number>>} numflags_array - The array of numflag values for each point
 *
 */
function updateClusterInfoBox(
  selectedPoint,
  clusterInfos,
  zoomLevel,
  flagColumnNames,
  numflags_array,
) {
  if (selectedPoint != null) {
    const clusterInfoBox = document.getElementById("clusterInfoBox");
    //diplay cluster label and number of points as text
    let displayText =
      "ClusterLabel: " +
      clusterInfos[zoomLevel - 1][selectedPoint].label +
      "<br>" +
      "Number of points: " +
      clusterInfos[zoomLevel - 1][selectedPoint].numPoints +
      "<br>";

    //display nonnumflag information
    cluster = clusterInfos[zoomLevel - 1][selectedPoint];
    let pieDivs = [];
    // Create pieDivs (WITH titles) for the nonnumflags
    cluster.nonnumflagCounters.forEach((columnFlagMap, index) => {
      let pieDiv = document.createElement("div");
      let pieTitleDiv = document.createElement("div");
      pieTitleDiv.innerHTML = "<br>" + flagColumnNames[0][index] + ":" + "<br>";
      pieDiv.style.display = "inline-block";
      pieDiv.style.width = "50%";
      pieDiv.appendChild(pieTitleDiv);
      pieDiv.appendChild(createPieDiv(cluster.getPie(index)));
      pieDivs.push(pieDiv);
    });

    let boxPlotDivs = [];
    // Create violinPlotDivs (WITH titles) for the numflags
    for (
      let flagIndex = 0;
      flagIndex < flagColumnNames[1].length;
      flagIndex++
    ) {
      let boxPlotDiv = document.createElement("div");
      let boxPlotTitleDiv = document.createElement("div");
      boxPlotTitleDiv.innerHTML =
        "<br>" + flagColumnNames[1][flagIndex] + ":" + "<br>";
      boxPlotDiv.appendChild(boxPlotTitleDiv);
      boxPlotDiv.appendChild(
        createViolinPlotDiv(
          numflags_array,
          cluster.pointIndices,
          flagIndex,
          clusterInfoBox.clientWidth,
        ),
      );
      boxPlotDivs.push(boxPlotDiv);
    }
    clusterInfoBox.innerHTML = displayText;
    const chartsPerRow = 2;

    // Counter to keep track of the items added
    let itemCount = 0;

    // Iterate through pieDivs
    pieDivs.forEach((pieDiv) => {
      // Append the pieDiv to the clusterInfoBox
      clusterInfoBox.appendChild(pieDiv);

      // Increment the item count
      itemCount++;

      // Check if it's time to start a new row
      if (itemCount === chartsPerRow) {
        // Add a line break to start a new row
        clusterInfoBox.appendChild(document.createElement("br"));

        // Reset the item count for the new row
        itemCount = 0;
      }
    });

    if (itemCount != 0) {
      // Add a line break to start a new row after pies
      // if last row had < chartsPerRow charts
      clusterInfoBox.appendChild(document.createElement("br"));
    }

    boxPlotDivs.forEach((boxPlotDiv) => {
      clusterInfoBox.appendChild(boxPlotDiv);
    });
  } else {
    const clusterInfoBox = document.getElementById("clusterInfoBox");
    clusterInfoBox.textContent = "No point selected.";
  }
}
/**
 * This function creates a div containing a pie chart for the given pie.
 * @param {Pie} pie - The pie chart to display
 * @returns {HTMLDivElement} The div containing the pie chart
 */
function createPieDiv(pie) {
  let pieDiv = document.createElement("div");
  pieDiv.id = "pieDiv" + pie.name;

  let canvas = document.createElement("canvas");
  canvas.id = "pieChart" + pie.name;
  pieDiv.appendChild(canvas);

  // Get the 2d context of the canvas
  let ctx = canvas.getContext("2d");

  // Prepare data for the Chart.js pie chart
  let defaultBackgroundColors = [
    "red",
    "blue",
    "green",
    "yellow",
    "purple",
    "orange",
    "pink",
    "brown",
    "gray",
  ];
  let backgroundColor = defaultBackgroundColors.slice(0, pie.length - 1);
  backgroundColor.push("gray");
  for (let i = backgroundColor.length; i < pie.length; i++) {
    backgroundColor.push("gray");
  }

  let chartData = {
    labels: pie.map((slice) => slice.name),
    datasets: [
      {
        data: pie.map((slice) => slice.value),
        backgroundColor: backgroundColor,
      },
    ],
  };

  // Initialize the pie chart
  let pieChart = new Chart(ctx, {
    type: "pie",
    data: chartData,
  });

  return pieDiv;
}

/**
 * This function creates a div containing a violin plot for the given flag.
 * @param {Array<Array<number>>} numflagsArray - The array of numflag values for each point
 * @param {Array<number>} clusterPoints - The indices of the points in the cluster
 * @param {number} flagIndex - The index of the flag to display
 * @param {number} plotWidthPixels - The width of the plot in pixels
 * @returns {HTMLDivElement} The div containing the violin plot
 */
function createViolinPlotDiv(
  numflagsArray,
  clusterPoints,
  flagIndex,
  plotWidthPixels,
) {
  // Create a container div for the violin plot
  let violinDiv = document.createElement("div");
  violinDiv.id = `violinPlot_${flagIndex}`;
  violinDiv.style.width = plotWidthPixels.toString() + "px"; // Set the width of the div

  // Prepare data for the violin plot
  const data = [
    {
      type: "violin",
      y: clusterPoints.map(
        (pointIndex) => numflagsArray[pointIndex][flagIndex],
      ),
      // points: "none",
      box: {
        visible: true,
      },
      boxpoints: false,
      line: {
        color: "black",
      },
      fillcolor: "#8dd3c7",
      opacity: 0.6,
      meanline: {
        visible: true,
      },
      x0: `Flag ${flagIndex}`,
    },
  ];

  // Layout configuration
  const layout = {
    title: `Violin Plot for Flag ${flagIndex}`,
    yaxis: {
      zeroline: false,
    },
    autosize: true,
  };

  var config = { responsive: true };

  // Create the violin plot
  Plotly.newPlot(violinDiv, data, layout, config);

  return violinDiv;
}
