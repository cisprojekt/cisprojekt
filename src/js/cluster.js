// Promisify onRuntimeInitialized
let wasmReady = new Promise((resolve) => {
  Module.onRuntimeInitialized = resolve;
});

// inputPointsis NOT flattened!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
async function calculateClusters(
  inputPoints,
  type,
  nonnumflags_array,
  numflags_array,
  names_array,
  scalingMethod,
  distMethod,
  flagColumnNames,
  zoomMode,
  zoomNumber,
  colorLegend,
) {
  await wasmReady; // Make sure module is loaded
  console.log("Starting Clustering Program");
  console.log(type);

  var totalprogress = 0.0;
  var partialprogress = 0.0;
  var pProgressStep = 0.0;
  var tProgressStep = 0.0;
  //open progress_bar
	  
  let n = inputPoints.length;
  var zoomLevels = 1;
  if (zoomMode == 0) {
	  zoomLevels = zoomNumber;
  }
  else if (zoomMode == 1) {
	  zoomLevels = Math.ceil(n/zoomNumber);
  }
  else if (zoomMode == 2) {
	  zoomLevels = Math.ceil(Math.log(n/2)/Math.log(zoomNumber));
  }
  // For custom inputs
  if (type == "custom") {
    console.log(inputPoints);

    

    // Custom distance function
    let customFunction;

    // Read functon from textarea and eval
    customFunction = eval(document.getElementById("distFunction").value);

    console.log(n);
    let pointsToPlot = [];
    let maxIterations = 5;

    let resultPoints = new Float64Array(n * 2);

    let resultPointsBuf = Module._malloc(
      n * 2 * Float64Array.BYTES_PER_ELEMENT,
    );

    // Fill distance matrix
    let distMat = new Float64Array((n * (n - 1)) / 2);
    let idx = 0;
    partialprogress = 0.0;
    pProgressStep = 1 / n;
    tProgressStep = pProgressStep * 0.4;
    for (let i = 0; i < n; i++) {
      partialprogress += pProgressStep;
      globalprogress += tProgressStep;
      for (let j = i + 1; j < n; j++) {
        distMat[idx++] = customFunction(inputPoints[i], inputPoints[j]);
      }
    }

    console.log(distMat);

    let distMatBuf = Module._malloc(
      ((n * (n - 1)) / 2) * Float64Array.BYTES_PER_ELEMENT,
    );
    Module.HEAPF64.set(distMat, distMatBuf / distMat.BYTES_PER_ELEMENT);

    let heightBuf = Module._malloc((n - 1) * Float64Array.BYTES_PER_ELEMENT);
    let mergeBuf = Module._malloc(2 * (n - 1) * Int32Array.BYTES_PER_ELEMENT);
    let labelsBuf = Module._malloc(
      n * zoomLevels * Int32Array.BYTES_PER_ELEMENT,
    );

    let totalprogressBuf = Module._malloc(Float32Array.BYTES_PER_ELEMENT);
    let partialprogressBuf = Module._malloc(Float32Array.BYTES_PER_ELEMENT);

    Module.HEAPF32.set(
      totalprogress,
      totalprogressBuf / totalprogress.BYTES_PER_ELEMENT,
    );

    Module.HEAPF32.set(
      partialprogress,
      partialprogressBuf / totalprogress.BYTES_PER_ELEMENT,
    );

    Module.HEAPF64.set(
      resultPoints,
      resultPointsBuf / resultPoints.BYTES_PER_ELEMENT,
    );

    // Actual function call to cluster
    Module.ccall(
      "clusterCustom",
      null,
      [
        "number",
        "number",
        "number",
        "number",
        "number",
        "number",
		"number",
		"number",
        "number",
        "number",
        "number",
        "number",
        "number",
        "number",
      ],
      [
        distMatBuf,
        heightBuf,
        mergeBuf,
        labelsBuf,
        n,
		zoomMode,
		zoomNumber,
        maxIterations,
        zoomLevels,
        distMethod,
        resultPointsBuf,
        scalingMethod,
        totalprogressBuf,
        partialprogressBuf,
      ],
    );

    totalprogress = 0.98;

    let labelsResult = new Int32Array(
      Module.HEAP32.subarray(
        labelsBuf / Int32Array.BYTES_PER_ELEMENT,
        labelsBuf / Int32Array.BYTES_PER_ELEMENT + n * zoomLevels,
      ),
    );
    let pointsResult = new Float64Array(
      Module.HEAPF64.subarray(
        resultPointsBuf / Float64Array.BYTES_PER_ELEMENT,
        resultPointsBuf / Float64Array.BYTES_PER_ELEMENT + n * 2,
      ),
    );

    for (var i = 0; i < n * 2; i += 2) {
      pointsToPlot.push({
        x: pointsResult[i],
        y: pointsResult[i + 1],
      });
    }

    console.log(labelsResult);

    // Free memory
    Module._free(resultPointsBuf);
    Module._free(distMatBuf);
    Module._free(heightBuf);
    Module._free(mergeBuf);
    Module._free(resultPointsBuf);
    Module._free(totalprogressBuf);
    Module._free(partialprogressBuf);

    var clusterInfos = getClusterInfo(
      zoomLevels,
      labelsResult,
      n,
      numflags_array, // Holds an array for each point, holding the numflag values for that point
      nonnumflags_array, // Holds an array for each point, holding the nonnumflag values for that point
	  names_array,
    );
    // -----------------------------------------------------------------
    // -----------------------------------------------------------------
    // -----------------------------------------------------------------
    // -----------------------------------------------------------------

    // Call the function of map to plot
    mapFunctions(
      labelsResult,
      pointsToPlot,
      n,
      zoomLevels,
      clusterInfos,
      flagColumnNames,
      numflags_array,
	  colour_mode,
	  ColorLegend,
    );
    totalprogress = 0.99;
  } else if (type == "preclustered") {
    var dataJson = JSON.parse(document.getElementById("distFunction").value);

    totalprogress = 0.99;

    let n = dataJson[1].length;

    var clusterInfos = getClusterInfo(
      zoomLevels,
      Object.values(dataJson[0]),
      n,
      numflags_array, // Holds an array for each point, holding the numflag values for that point
      nonnumflags_array, // Holds an array for each point, holding the nonnumflag values for that point
	  names_array,
    );

    // Call the function of map to plot
    mapFunctions(
      dataJson[0],
      dataJson[1],
      n,
      zoomLevels,
      clusterInfos,
      flagColumnNames,
      numflags_array,
	  colour_mode,
	  ColorLegend,
    );
  }

  // For euclidean inputs
  else if (type == "euclidean" || type == "earth-dist") {
    let isSperical = false;
    if (type == "earth-dist") {
      isSperical = true;
    }
    let pointsToPlot = [];
    n = inputPoints.length;
    if (inputPoints.length == 0) {
      var dim = 1;
    } else {
      var dim = inputPoints[0].length;
    }
    let flatInputPoints = inputPoints.flat();

    // For now hardcoded
    maxIterations = 5;

    // Stores the input points
    let points = new Float64Array(n * dim);

    for (let i = 0; i < n * dim; i++) {
      points[i] = parseFloat(flatInputPoints[i]);
    }

    // Heaps which wasm uses
    let pointsBuf = Module._malloc(n * dim * Float64Array.BYTES_PER_ELEMENT);
    let distMatBuf = Module._malloc(n * n * Float64Array.BYTES_PER_ELEMENT);
    let heightBuf = Module._malloc((n - 1) * Float64Array.BYTES_PER_ELEMENT);
    let mergeBuf = Module._malloc(2 * (n - 1) * Int32Array.BYTES_PER_ELEMENT);
    let labelsBuf = Module._malloc(
      n * zoomLevels * Int32Array.BYTES_PER_ELEMENT,
    );

    totalprogress = 0.05;
    let totalprogressBuf = Module._malloc(Float32Array.BYTES_PER_ELEMENT);
    let partialprogressBuf = Module._malloc(Float32Array.BYTES_PER_ELEMENT);

    Module.HEAPF32.set(
      totalprogress,
      totalprogressBuf / totalprogress.BYTES_PER_ELEMENT,
    );

    Module.HEAPF32.set(
      partialprogress,
      partialprogressBuf / totalprogress.BYTES_PER_ELEMENT,
    );

    // Move input points into heap
    Module.HEAPF64.set(points, pointsBuf / points.BYTES_PER_ELEMENT);
    console.log("Calculations started");

    // Actual function call to cluster
    Module.ccall(
      "clusterPoints",
      null,
      [
        "number",
        "number",
        "number",
        "number",
        "number",
        "number",
        "number",
		"number",
		"number",
        "number",
        "number",
        "number",
        "number",
        "number",
        "number",
        "number",
      ],
      [
        pointsBuf,
        dim,
        distMatBuf,
        heightBuf,
        mergeBuf,
        labelsBuf,
        n,
		zoomMode,
		zoomNumber,
        maxIterations,
        zoomLevels,
        distMethod,
        scalingMethod,
        isSperical,
        totalprogressBuf,
        partialprogressBuf,
      ],
    );
    console.log("Calculations finished");
    totalprogress = 0.98;
    // Copy results into js array
    let labelsResult = new Int32Array(
      Module.HEAP32.subarray(
        labelsBuf / Int32Array.BYTES_PER_ELEMENT,
        labelsBuf / Int32Array.BYTES_PER_ELEMENT + n * zoomLevels,
      ),
    );
    let pointsResult = new Float64Array(
      Module.HEAPF64.subarray(
        pointsBuf / Float64Array.BYTES_PER_ELEMENT,
        pointsBuf / Float64Array.BYTES_PER_ELEMENT + n * dim,
      ),
    );

    // Move points into array for map
    for (var i = 0; i < n * 2; i += 2) {
      pointsToPlot.push({ x: pointsResult[i], y: pointsResult[i + 1] });
    }
    // Free memory
    Module._free(pointsBuf);
    Module._free(distMatBuf);
    Module._free(heightBuf);
    Module._free(mergeBuf);
    Module._free(labelsBuf);
    Module._free(totalprogressBuf);
    Module._free(partialprogressBuf);

    // Create list of Cluster objects

    // -----------------------------------------------------------------
    // -----------------------------------------------------------------
    // -----------------------------------------------------------------
    // -----------------------------------------------------------------

    var clusterInfos = getClusterInfo(
      zoomLevels,
      labelsResult,
      n,
      numflags_array, // Holds an array for each point, holding the numflag values for that point
      nonnumflags_array, // Holds an array for each point, holding the nonnumflag values for that point
	  names_array,
    );
    // -----------------------------------------------------------------
    // -----------------------------------------------------------------
    // -----------------------------------------------------------------
    // -----------------------------------------------------------------

    // Call the function of map to plot
    mapFunctions(
      labelsResult,
      pointsToPlot,
      n,
      zoomLevels,
      clusterInfos,
      flagColumnNames,
      numflags_array,
	  colour_mode,
	  colorLegend,
    );
    totalprogress = 0.99;
  } else if (type == "tanimotoFingerprints" || type == "edit-distance") {
    // convert type information to int
    if (type == "tanimotoFingerprints") {
      type = 0;
      bit_bool = 1;
    } else if (type == "edit-distance") {
      type = 1;
      bit_bool = 0;
    }

    // Create one large string and create array of length of each string
    let n = inputPoints.length;
    let lengthOfString = new Uint32Array(n);
    let inputString = "";
    for (let i = 0; i < n; i++) {
      inputString += inputPoints[i];
      lengthOfString[i] = inputPoints[i].length;
    }
    console.log("Number points " + n);

    // Allocate memory for inputString
    let lengthBytes = lengthBytesUTF8(inputString) + 1;
    let stringOnHeap = _malloc(lengthBytes);
    stringToUTF8(inputString, stringOnHeap, lengthBytes);

    console.log("lengthBytes " + lengthBytes);
    console.log("Number points " + n);
    // For now hardcoded
    let pointsToPlot = [];
    let maxIterations = 5;

    // Stores the new configuration of points
    let resultPoints = new Float64Array(n * 2);

    // Heaps which wasm uses
    let resultPointsBuf = Module._malloc(
      n * 2 * Float64Array.BYTES_PER_ELEMENT,
    );
    let lengthOfStringBuf = Module._malloc(
      lengthOfString.length * lengthOfString.BYTES_PER_ELEMENT,
    );
    let distMatBuf = Module._malloc(n * n * Float64Array.BYTES_PER_ELEMENT);
    let heightBuf = Module._malloc((n - 1) * Float64Array.BYTES_PER_ELEMENT);
    let mergeBuf = Module._malloc(2 * (n - 1) * Int32Array.BYTES_PER_ELEMENT);
    let labelsBuf = Module._malloc(
      n * zoomLevels * Int32Array.BYTES_PER_ELEMENT,
    );

    totalprogress = 0.05;

    let totalprogressBuf = Module._malloc(Float32Array.BYTES_PER_ELEMENT);
    let partialprogressBuf = Module._malloc(Float32Array.BYTES_PER_ELEMENT);

    Module.HEAPF32.set(
      totalprogress,
      totalprogressBuf / totalprogress.BYTES_PER_ELEMENT,
    );

    Module.HEAPF32.set(
      partialprogress,
      partialprogressBuf / totalprogress.BYTES_PER_ELEMENT,
    );
    // Dont know what this does
    Module.HEAPF64.set(
      resultPoints,
      resultPointsBuf / resultPoints.BYTES_PER_ELEMENT,
    );

    // Move length of string into heap
    Module.HEAPU32.set(
      lengthOfString,
      lengthOfStringBuf / lengthOfString.BYTES_PER_ELEMENT,
    );

    console.log("lengthOfStringBuf length " + lengthOfString[0]);
    console.log("input lengths " + lengthOfString);
    console.log("Calculations start");
    // Actual function call to cluster
    Module.ccall(
      "clusterStrings",
      null,
      [
        "number",
        "number",
        "number",
        "number",
        "number",
        "number",
        "number",
        "number",
        "number",
		"number",
		"number",
        "number",
        "number",
        "number",
        "number",
        "number",
        "number",
        "number",
      ],
      [
        stringOnHeap,
        lengthOfStringBuf,
        distMatBuf,
        heightBuf,
        mergeBuf,
        labelsBuf,
        n,
		zoomMode,
		zoomNumber,
        maxIterations,
        zoomLevels,
        distMethod,
        scalingMethod,
        bit_bool,
        resultPointsBuf,
        type,
        totalprogressBuf,
        partialprogressBuf,
      ],
    );
    console.log("Calculations finished");
    totalprogress = 0.98;
    // Copy results into js array
    let labelsResult = new Int32Array(
      Module.HEAP32.subarray(
        labelsBuf / Int32Array.BYTES_PER_ELEMENT,
        labelsBuf / Int32Array.BYTES_PER_ELEMENT + n * zoomLevels,
      ),
    );
    let pointsResult = new Float64Array(
      Module.HEAPF64.subarray(
        resultPointsBuf / Float64Array.BYTES_PER_ELEMENT,
        resultPointsBuf / Float64Array.BYTES_PER_ELEMENT + n * 2,
      ),
    );

    // Create array for map
    for (var i = 0; i < n * 2; i += 2) {
      pointsToPlot.push({
        x: pointsResult[i],
        y: pointsResult[i + 1],
      });
    }

    // Free memory
    Module._free(resultPointsBuf);
    Module._free(distMatBuf);
    Module._free(heightBuf);
    Module._free(mergeBuf);
    Module._free(lengthOfStringBuf);
    Module._free(totalprogressBuf);
    Module._free(partialprogressBuf);
    _free(stringOnHeap);

    // -----------------------------------------------------------------

    var clusterInfos = getClusterInfo(
      zoomLevels,
      labelsResult,
      n,
      numflags_array,
      nonnumflags_array,
	  names_array,
    );
    // -----------------------------------------------------------------

    // Call the function of map to plot
    mapFunctions(
      labelsResult,
      pointsToPlot,
      n,
      zoomLevels,
      clusterInfos,
      flagColumnNames,
      numflags_array,
	  colour_mode,
	  colorLegend,
    );
    totalprogress = 0.99;
  }
  //close progress bar
}

class Slice {
  constructor(name, value, percentage) {
    this.name = name;
    this.value = value;
    this.percentage = percentage;
  }
}
class Cluster {
  constructor(
    label,
    numPoints = 0,
	nameCounters = [],
    nonnumflagCounters = [],
    numflagSums = [],
    numflagAverages = [],
    numflagMins = [],
    numflagMaxs = [],
    pointIndices = [],
    pieFlagIndices = [], // empty means it will calculate the pie charts for each flag. To calcululate none, set pieMaxNumSlicesDefault<=0
    pieMaxNumSlicesDefault = 5,
  ) {
    // label is the label of the cluster corresponding to the label in the labelsResult array
    this.label = label;
    // numPoints is the number of points in the cluster
    this.numPoints = numPoints;
	// nameCounters is an array which consists of the names of singleton data points within this cluster.
	this.nameCounters = nameCounters;
    // nonnumflagCounters is an array of dictionaries which count the occurences of each existent nonnumflag-value of one nonnumflag
    // the first array element corresponds to the first selected nonnumflag, the second to the second nonnumflag, ...
    this.nonnumflagCounters = nonnumflagCounters;
    // numflagSums is an array which contains the sum of each numflag
    // the first array element corresponds to the first selected numflag, the second to the second numflag, ...
    this.numflagSums = numflagSums;
    // numflagAverages is an array which contains the average of each numflag
    this.numflagAverages = numflagAverages;
    // numflagMins is an array which contains the minimum of each numflag
    this.numflagMins = numflagMins;
    // numflagMaxs is an array which contains the maximum of each numflag
    this.numflagMaxs = numflagMaxs;
    // this.pointIndices = pointIndices;
    this.pointIndices = pointIndices;

    this.pieMaxNumSlicesDefault = pieMaxNumSlicesDefault;
    this.pieFlagIndices = pieFlagIndices;

    this._pies = new Array(nonnumflagCounters.length)
      .fill(null)
      .map(() => null);
    /* this.pies = new Proxy(this._pies, {

      get: function (target, idx) {
        var pie = target[idx];
        if (pie == null) {
        }
        return target[idx];
      },
    }); */
  }
  get name() {
    return "Cluster #" + this.label;
  }

  /**
  - `nonnumflagCounterIndex`: The index of the nonnumflag in this.nonnumflagCounters for which to get the pie chart.

  - `maxSlices` __(optional)__: The maximum number of slices (excluding the automatic "other" slice) to be calculated.

  ## Returns

  - Array with with instances of Slice class, in descending order by Slice.value, with the last element always being the "other" slice
  */
  getPie(nonnumflagCounterIndex, maxSlices = this.pieMaxNumSlicesDefault) {
    if (nonnumflagCounterIndex >= this.nonnumflagCounters.length) {
      throw "given nonnumflagCounterIndex is >= this.nonnumflagCounters.length";
    }
    var totalPercent = 0;
    var totalValue = 0;
    // If the pie of this nonnumflag has not yet been calculated before, or there are not enough slices in it
    if (
      this._pies[nonnumflagCounterIndex] == null ||
      (this._pies[nonnumflagCounterIndex].length - 1 < maxSlices && // more slices allowed
        this.nonnumflagCounters[nonnumflagCounterIndex].size >
          this._pies[nonnumflagCounterIndex].length - 1) // more slices possible)
    ) {
      // console.log(`Creating new pie at nonnumflagCounterIndex: ${nonnumflagCounterIndex}`);
      // Find at most maxSlices biggest pie Slices  and store them in pieSlicesArray sorted desc with an added "other" Slice
      var pieSlicesArray = [];
      var smallestIdx = null;
      var idx = 0;
      // console.log("-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------")
      // console.log("this.nonnumflagCounters:");
      /* this.nonnumflagCounters.forEach((map, index) => {
        console.log(`Index ${index}:`);
        map.forEach((value, key) => {
          console.log(`${key}: ${value}`);
        });
      }); */
      // console.log(`this.nonnumflagCounters[nonnumflagCounterIndex]: ${this.nonnumflagCounters[nonnumflagCounterIndex]}`);
      // console.log(`this.nonnumflagCounters[nonnumflagCounterIndex].type: ${this.nonnumflagCounters[nonnumflagCounterIndex].type}`);
      for (let key of this.nonnumflagCounters[nonnumflagCounterIndex].keys()) {
        // console.log(`key: ${key}`);
        if (pieSlicesArray.length <= maxSlices) {
          var value = this.nonnumflagCounters[nonnumflagCounterIndex].get(key);
          totalValue += value;
          var percent = (100 * value) / this.numPoints;
          totalPercent += percent;
          pieSlicesArray.push(new Slice(key, value, percent));
          if (smallestIdx == null) {
            smallestIdx = 0;
          } else {
            if (pieSlicesArray[smallestIdx] >= value) {
              smallestIdx = idx;
            }
          }
        } else {
          if (smallestIdx != null) {
            var value =
              this.nonnumflagCounters[nonnumflagCounterIndex].get(key);
            totalValue += value;
            var percent = (100 * value) / this.numPoints;
            totalPercent += percent;
            totalValue -= pieSlicesArray[smallestIdx].value;
            totalPercent -= pieSlicesArray[smallestIdx].percent;
            pieSlicesArray[smallestIdx] = new Slice(key, value, percent);
          }
        }
        idx++;
      }
      pieSlicesArray.sort((s1, s2) => (s1.value > s2.value ? -1 : 0)); // Sort descendingly by value
      pieSlicesArray.push(
        new Slice("other", this.numPoints - totalValue, 100 - totalPercent),
      );
      this._pies[nonnumflagCounterIndex] = pieSlicesArray;

      return pieSlicesArray;
    }
    // If the pie of this nonnumflag has been calculated before, but the number of Slices is too great
    else if (this._pies[nonnumflagCounterIndex].length - 1 > maxSlices) {
      var removeNumber =
        maxSlices - this._pies[nonnumflagCounterIndex].length + 1;

      var extraValue = 0;
      var extraPercent = 0;
      for (
        var i = this._pies[nonnumflagCounterIndex].length - 2;
        i >= maxSlices;
        i--
      ) {
        extraValue += this._pies[nonnumflagCounterIndex][i].value;
        extraPercent += this._pies[nonnumflagCounterIndex][i].percent;
      }

      var pieView = this._pies[nonnumflagCounterIndex].slice(0, maxSlices); // slice is not in place, splice is in place
      // Copy over the "other" slice
      pieView.push(
        this._pies[nonnumflagCounterIndex][
          this._pies[nonnumflagCounterIndex].length - 1
        ],
      );

      // Adjust the "other" slice to the new pie
      pieView[pieView.length - 1].value += extraValue;
      pieView[pieView.length - 1].percent += extraPercent;

      this._pies[nonnumflagCounterIndex] = pieView;
      return pieView;
    }
    return this._pies[nonnumflagCounterIndex];
  }
}

// this function returns an array of arrays of Cluster objects
// the first element of the array corresponds to the first zoomlevel, the second to the second zoomlevel, ...
// the first element of the inner array corresponds to the first cluster, the second to the second cluster, ...
// look for the definiton of the cluster class to see what information is stored in each cluster
function getClusterInfo(
  zoom,
  labelsResult,
  n,
  numflags_array, // Holds an array for each point, holding the numflag values for that point
  nonnumflags_array, // Holds an array for each point, holding the nonnumflag values for that point
  names_array,
) {
  // Create an array for each Zoomlevel which contais the info of the clusters
  var clusterInfos = new Array(zoom);

  //fill clusterinfos with the clusterinfo for each zoomlevel
  for (var i = 0; i < zoom; i++) {
    //
    let currentLabels = labelsResult.slice(i * n, i * n + n);

    // determine the largest label so we know how many clusters there are
    let largestLabel = 0;
    currentLabels.forEach((label) => {
      if (label > largestLabel) {
        largestLabel = label;
      }
    });

    if (numflags_array.length == 0) {
      var numNumColumns = 0;
    } else {
      var numNumColumns = numflags_array[0].length;
    }

    if (nonnumflags_array.length == 0) {
      var numNonNumColumns = 0;
    } else {
      var numNonNumColumns = nonnumflags_array[0].length;
    }
	if (names_array.length == 0) {
      var numNameColumns = 0;
    } else {
      var numNameColumns = 1;
    }
    // Create an array of Cluster objects
    let clusters = new Array(largestLabel + 1).fill().map(
      (_, idx) =>
        new Cluster(
          idx,
          0,
		  [],
          new Array(numNonNumColumns).fill(null).map(() => new Map()),
          new Array(numNumColumns).fill(0),
          new Array(numNumColumns).fill(0),
          new Array(numNumColumns).fill(Infinity),
          new Array(numNumColumns).fill(-Infinity),
          [],
        ),
    );
    // console.log(`SOAGDUIGDJSHAVBDIHSAPDMNJSHABVDUOSALKDBJHUSABGDOISHALKDHBSOADHLKSANLDKAS`);
    // console.log(`clusters: ${clusters}`);

    // Count the number of points in each cluster
    let pointIdx = 0;
    currentLabels.forEach((label) => {
      clusters[label].numPoints++;
      clusters[label].pointIndices.push(pointIdx); // keep track of the points that are in the cluster
      pointIdx++;
    });

    //console.log("-------------------");
    //clusters.forEach((cluster) => {
    //console.log(cluster.name + " has " + cluster.numPoints + " points");
    //});
    //console.log("-------------------");
    // flags is array of values of the flag columns of the i'th point in labels
    // counting the nonnumflags of each cluster
    var point_idx = 0;
    nonnumflags_array.forEach((flags) => {
      let cluster_idx = currentLabels[point_idx];
      flag_idx = 0;
      flags.forEach((flag) => {
        if (clusters[cluster_idx].nonnumflagCounters[flag_idx].has(flag)) {
          var currentValue =
            clusters[cluster_idx].nonnumflagCounters[flag_idx].get(flag);
          clusters[cluster_idx].nonnumflagCounters[flag_idx].set(
            flag,
            currentValue + 1,
          );
        } else {
          clusters[cluster_idx].nonnumflagCounters[flag_idx].set(flag, 1);
        }

        flag_idx++;
      });
      point_idx++;
    });

    // flags is a list of values of the selceted columns of the i'th point in numflags_array
    // calculating average, max, min of numflags
    var numflags_array_idx = -1;
    numflags_array.forEach((flags) => {
      numflags_array_idx++;

      let cluster_idx = currentLabels[numflags_array_idx];

      flag_idx = -1;
      flags.forEach((flag) => {
        flag_idx++;

        clusters[cluster_idx].numflagSums[flag_idx] += flag;
        if (flag > clusters[cluster_idx].numflagMaxs[flag_idx]) {
          clusters[cluster_idx].numflagMaxs[flag_idx] = flag;
        }
        if (flag < clusters[cluster_idx].numflagMins[flag_idx]) {
          clusters[cluster_idx].numflagMins[flag_idx] = flag;
        }
      });
    });
	let singleton = 0;
	for (let cluster_idx = 0; cluster_idx < largestLabel + 1; cluster_idx++) {
        clusters[cluster_idx].pointIndices.forEach((singleton) => {
          clusters[cluster_idx].nameCounters.push(names_array[singleton][0])
		});
		console.log(clusters[cluster_idx].nameCounters)
	}
	
    // calculating average of numflags
    for (let cluster_idx = 0; cluster_idx < largestLabel + 1; cluster_idx++) {
      for (let flag_idx = 0; flag_idx < numNumColumns; flag_idx++) {
        clusters[cluster_idx].numflagAverages[flag_idx] =
          clusters[cluster_idx].numflagSums[flag_idx] /
          clusters[cluster_idx].numPoints;
      }
    }
    //console.log(clusters);
    clusterInfos[i] = clusters;

    // console.log(`clusterInfos[2]`)
    // console.log(`///////////////////////////////////////////`)
    // console.log(`${clusterInfos[2]}`)
    //console.log(
    //`Creating pies for each cluster in zoom layer ${i}, and logging them.`,
    //);
    clusterInfos[i].forEach((cluster) => {
      //console.log(`/////////////////////////////////////////////////////`);
      //console.log(`/////////////////////////////////////////////////////`);
      //console.log(`/////////////////////////////////////////////////////`);
      //console.log(`${cluster.name} INTERNAL cluster._pies BEFORE:`);
      //console.log(cluster._pies);
      //console.log(cluster.nonnumflagCounters);
      if (cluster.pieMaxNumSlicesDefault > 0) {
        if (cluster.pieFlagIndices.length == 0) {
          for (var i = 0; i < cluster.nonnumflagCounters.length; i++) {
            //console.log(`cluster.getPie(${i});`);
            var pie = cluster.getPie(i); // getPie also edits the internal Cluster._pies array in place
            //console.log(`pie for nonnumflag ${i}`);
            //console.log(pie);
          }
        } else {
          cluster.pieFlagIndices.forEach((idx) => {
            //console.log(`cluster.getPie(${i});`);
            var pie = cluster.getPie(idx);
            //console.log(`pie for nonnumflag ${i}`);
            //console.log(pie);
          });
        }
      }
      //console.log(`${cluster.name} INTERNAL cluster._pies AFTER:`);
      //console.log(cluster._pies);
      //console.log(`/////////////////////////////////////////////////////`);
      //console.log(`/////////////////////////////////////////////////////`);
      //console.log(`/////////////////////////////////////////////////////`);
    });
  }
  return clusterInfos.reverse();
}
