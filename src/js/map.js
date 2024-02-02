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
  // Export function parameters to a JSON file
  // will be saved as 'result.json'
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
        r: Math.sqrt(sums[label].count) * 1.7,
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

  // Define the event handler function for zoom
  function handleZoom(event) {
    //
    //reset selected point

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

      /* console.log(
        "button_zoom_level_old in handleZoom " + button_zoom_level_old
      );
      console.log("button_zoom_level in handleZoom " + button_zoom_level); */

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
        .style("fill", "#0000ff")
        .style("fill-opacity", 0.5)
        .attr("transform", event.transform)
        .on("click", function (event, d) {
          svg.selectAll("circle").on("click", null);
          d3.select(this).style("fill", "red");
        });
    } else {
      circles
        .attr("transform", event.transform)
        .on("click", function (event, d) {
          //var currentColor = d3.select(this).style("fill"); //gets color of selected Circle
          var clickedCircle = d3.select(this); //gets selected Circle
          //unselect previous point
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

//function to display text in clusterInfoBox depending on selected point
//TODO add nonnumflag and numflag selected column information
function updateClusterInfoBox(
  selectedPoint,
  clusterInfos,
  zoomLevel,
  flagColumnNames,
  numflags_array,
) {
  if (selectedPoint != null) {
    const clusterInfoBox = document.getElementById("clusterInfoBox");
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
      //infotext for the columnFlagMap
      /* displayText += "<br>" + flagColumnNames[0][index] + "<br>";
      for (let [key, value] of columnFlagMap) {
        displayText += key + ": " + value.toString() + "<br>";
      } */
      //piechart for the columnFlagMap
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
      // boxPlotDiv.style.display = "inline-block";
      // boxPlotDiv.style.width = "50%";
      boxPlotDiv.appendChild(boxPlotTitleDiv);
      boxPlotDiv.appendChild(
        createViolinPlotDiv(
          numflags_array,
          cluster.pointIndices,
          flagIndex,
          clusterInfoBox.clientWidth /*  / 2 */,
        ),
      );
      boxPlotDivs.push(boxPlotDiv);
    }
    clusterInfoBox.innerHTML = displayText; // maybe make this a <textbox> so we dont need innerHTML and <br>?
    /* pieDivs.forEach((pieDiv) => {
      clusterInfoBox.appendChild(pieDiv);
    });
    boxPlotDivs.forEach((boxPlotDiv) => {
      clusterInfoBox.appendChild(boxPlotDiv);
    }); */

    // Number of items (charts) per row
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

    // Iterate through boxPlotDivs
    /* boxPlotDivs.forEach((boxPlotDiv) => {
      // Append the boxPlotDiv to the clusterInfoBox
      clusterInfoBox.appendChild(boxPlotDiv);

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

    // Add a line break if the last row is not complete
    if (itemCount !== 0) {
      clusterInfoBox.appendChild(document.createElement("br"));
    } */
  } else {
    const clusterInfoBox = document.getElementById("clusterInfoBox");
    clusterInfoBox.textContent = "No point selected.";
  }
}

function createPieDiv(pie) {
  let pieDiv = document.createElement("div");
  pieDiv.id = "pieDiv" + pie.name;
  // pieDiv.style.display = "inline-block";
  // pieDiv.style.width = "50%"; // Set the width of the div
  // pieDiv.style.height = "150"; // Set the width of the div

  let canvas = document.createElement("canvas");
  canvas.id = "pieChart" + pie.name;
  // canvas.width = 10; // Set the width of the canvas as needed
  // canvas.height = 10; // Set the height of the canvas as needed
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

// clusterPoints: cluster.pointIndices, list of indices of the points in the cluster
function createViolinPlotDiv(
  numflagsArray,
  clusterPoints,
  flagIndex,
  plotWidthPixels,
) {
  // Create a container div for the violin plot
  let violinDiv = document.createElement("div");
  violinDiv.id = `violinPlot_${flagIndex}`;
  // violinDiv.style.display = "inline-block";
  violinDiv.style.width = plotWidthPixels.toString() + "px"; // Set the width of the div
  // violinDiv.style.height = "150px"; // Set the height of the div

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
    // width: violinDiv.clientWidth.toString() + "px",
  };

  var config = { responsive: true };

  console.log(Plotly);

  // Create the violin plot
  Plotly.newPlot(violinDiv, data, layout, config);

  return violinDiv;
}

function createBoxPlotDiv(numflagsArray, clusterPoints, flagIndex) {
  // Create a container div for the box plot
  let boxDiv = document.createElement("div");
  boxDiv.id = `boxDiv_${flagIndex}`;
  boxDiv.style.width = "200px"; // Set the width of the div
  boxDiv.style.height = "100px"; // Set the height of the div

  // Create a canvas element for the box plot
  let canvas = document.createElement("canvas");
  canvas.id = `boxChart_${flagIndex}`;
  canvas.width = 200; // Set the width of the canvas as needed
  canvas.height = 100; // Set the height of the canvas as needed
  boxDiv.appendChild(canvas);

  // Get the 2d context of the canvas
  let ctx = canvas.getContext("2d");

  // Prepare data for the box plot
  let boxData = {
    labels: ["Cluster Points"], // Use a single label for the x-axis
    datasets: [
      {
        label: "Box Plot",
        data: clusterPoints.map(
          (pointIndex) => numflagsArray[pointIndex][flagIndex],
        ),
        backgroundColor: "lightseagreen",
      },
    ],
  };

  // Configuration for the box plot
  let config = {
    type: "boxplot",
    data: boxData,
    options: {
      responsive: true,
      title: {
        display: true,
        text: `Box Plot for Index ${flagIndex}`,
      },
      scales: {
        x: {
          title: {
            display: true,
            text: "Cluster Points",
          },
        },
        y: {
          beginAtZero: true,
        },
      },
    },
  };

  // Initialize the box plot
  let boxChart = new Chart(ctx, config);

  return boxDiv;
}

/* // Example usage:
// Assuming you have nonnumflags_array and clusterPoints defined
let indexToPlot = 0; // Change this to the desired index
let boxPlotDiv = createBoxPlotDiv(nonnumflags_array, clusterPoints, indexToPlot);

// Append the box plot div to the document body or any other container
document.body.appendChild(boxPlotDiv);
 */
