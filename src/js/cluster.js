// Promisify onRuntimeInitialized
let wasmReady = new Promise((resolve) => {
  Module.onRuntimeInitialized = resolve;
});

// inputPointsis NOT flattened!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
async function initializeMap(
  inputPoints,
  type,
  nonnumflags_array,
  numflags_array,
  scalingMethod,
) {
  await wasmReady; // Make sure module is loaded
  console.log("Starting Clustering Program");

  // For euclidean inputs
  if (type == "euclidean" || type == "earth-dist") {
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
    var zoomLevels = 20;
    maxIterations = 5;

    // Stores the input points
    let points = new Float64Array(n * dim);

    for (let i = 0; i < n * dim; i++) {
      points[i] = parseFloat(flatInputPoints[i]);
	  console.log(flatInputPoints[i]);
    }

    // Heaps which wasm uses
    let pointsBuf = Module._malloc(n * dim * Float64Array.BYTES_PER_ELEMENT);
    let distMatBuf = Module._malloc(n * n * Float64Array.BYTES_PER_ELEMENT);
    let heightBuf = Module._malloc((n - 1) * Float64Array.BYTES_PER_ELEMENT);
    let mergeBuf = Module._malloc(2 * (n - 1) * Int32Array.BYTES_PER_ELEMENT);
    let labelsBuf = Module._malloc(
      n * zoomLevels * Int32Array.BYTES_PER_ELEMENT,
    );

    // Move input points into heap
    Module.HEAPF64.set(points, pointsBuf / points.BYTES_PER_ELEMENT);

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
      ],
      [
        pointsBuf,
        dim,
        distMatBuf,
        heightBuf,
        mergeBuf,
        labelsBuf,
        n,
        maxIterations,
        zoomLevels,
        1,
        scalingMethod,
        isSperical,
        1,
      ],
    );
    console.log("Clustering finished");
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

    // Create list of Cluster objects

    // -----------------------------------------------------------------
    // -----------------------------------------------------------------
    // -----------------------------------------------------------------
    // -----------------------------------------------------------------

    console.log("moooooooooooooooooin");
    var clusterInfos = getClusterInfo(
      zoomLevels,
      labelsResult,
      n,
      numflags_array,
      nonnumflags_array,
    );
    // -----------------------------------------------------------------
    // -----------------------------------------------------------------
    // -----------------------------------------------------------------
    // -----------------------------------------------------------------

    // Call the function of map to plot
    mapFunctions(labelsResult, pointsToPlot, n, zoomLevels, clusterInfos);
  } else if (type == "tanimotoFingerprints") {
    // For fingerprints input

    // Create one large string and create array of length of each string
    let lengthOfString = [];
    let n = inputPoints.length;
    let inputString = "";
    for (let i = 0; i < n; i++) {
      inputString += inputPoints[i];
      lengthOfString[i] = inputPoints[i].length;
    }

    // Allocate memory for inputString
    let lengthBytes = lengthBytesUTF8(inputString) + 1;
    let stringOnHeap = _malloc(lengthBytes);
    stringToUTF8(inputString, stringOnHeap, lengthBytes);

    // For now hardcoded
    let zoomLevels = 20;
    let pointsToPlot = [];
    let maxIterations = 5;

    // Stores the new configuration of points
    let resultPoints = new Float64Array(n * 2);

    // Heaps which wasm uses
    let resultPointsBuf = Module._malloc(
      n * 2 * Float64Array.BYTES_PER_ELEMENT,
    );
    let lengthOfStringBuf = Module._malloc(n * Int32Array.BYTES_PER_ELEMENT);
    let distMatBuf = Module._malloc(n * n * Float64Array.BYTES_PER_ELEMENT);
    let heightBuf = Module._malloc((n - 1) * Float64Array.BYTES_PER_ELEMENT);
    let mergeBuf = Module._malloc(2 * (n - 1) * Int32Array.BYTES_PER_ELEMENT);
    let labelsBuf = Module._malloc(
      n * zoomLevels * Int32Array.BYTES_PER_ELEMENT,
    );

    // Dont know what this does
    Module.HEAPF64.set(
      resultPoints,
      resultPointsBuf / resultPoints.BYTES_PER_ELEMENT,
    );

    // Move length of string into heap
    Module.HEAPF64.set(
      lengthOfString,
      lengthOfStringBuf / lengthOfString.BYTES_PER_ELEMENT,
    );

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
      ],
      [
        stringOnHeap,
        lengthOfString,
        distMatBuf,
        heightBuf,
        mergeBuf,
        labelsBuf,
        n,
        maxIterations,
        zoomLevels,
        1,
        scalingMethod,
        resultPointsBuf,
        1,
      ],
    );

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
        x: pointsResult[i] * n * 2,
        y: pointsResult[i + 1] * n * 2,
      });
    }

    // Free memory
    Module._free(resultPointsBuf);
    Module._free(distMatBuf);
    Module._free(heightBuf);
    Module._free(mergeBuf);
    Module._free(resultPointsBuf);
    Module._free(lengthOfStringBuf);

    // -----------------------------------------------------------------

    console.log("moooooooooooooooooin");
    var clusterInfos = getClusterInfo(
      zoomLevels,
      labelsResult,
      n,
      numflags_array,
      nonnumflags_array,
    );
    // -----------------------------------------------------------------

    // Call the function of map to plot
    mapFunctions(labelsResult, pointsToPlot, n, zoomLevels, clusterInfos);
  }
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
    nonnumflagCounters = [{}],
    numflagSums = [],
    numflagAverages = [],
    numflagMins = [],
    numflagMaxs = [],
    pieMaxNumSlicesDefault = 5,
    pieFlagIndices = [] // empty means it will calculate the pie charts for each flag. To calcululate none, set pieMaxNumSlicesDefault<=0
  ) {
    // label is the label of the cluster corresponding to the label in the labelsResult array
    this.label = label;
    // numPoints is the number of points in the cluster
    this.numPoints = numPoints;
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

    this.pieMaxNumSlicesDefault = pieMaxNumSlicesDefault;
    this.pieFlagIndices = pieFlagIndices;

    this._pies = new Array(len(nonnumflagCounters)).fill(null).map(() => null);
    this.pies = new Proxy(_pies, {

      
      get: function (target, idx) {
        var pie = target[idx];
        if (pie == null) {
        }
        return target[idx];
      },
    });
    
    if (this.pieMaxNumSlicesDefault > 0) {
      if (this.pieFlagIndices.length == 0) {
        for (var i = 0; i <= this.nonnumflagCounters.length; i++) {
          this.getPie(i, this.pieMaxNumSlicesDefault);
        }
      } else {
        this.pieFlagIndices.forEach((idx) => {
          this.getPie(idx, this.pieMaxNumSlicesDefault)
        });
      }
    }
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
    if (nonnumflagCounterIndex >= len(this.nonnumflagCounters)) {
      throw "given nonnumflagCounterIndex is >= len(this.nonnumflagCounters)";
    }
    var totalPercent = 0;
    var totalValue = 0;
    // If the pie of this nonnumflag has not yet been calculated before, or there are not enough slices in it
    if (
      this._pies[nonnumflagCounterIndex] == null ||
      (len(this._pies[nonnumflagCounterIndex]) - 1 > maxSlices && // more slices allowed
        Object.keys(this.nonnumflagCounters[nonnumflagCounterIndex]).length >
          len(this._pies[nonnumflagCounterIndex]) - 1) // more slices possible)
    ) {
      // Find at most maxSlices biggest pie Slices  and store them in pieSlicesArray sorted desc with an added "other" Slice
      var pieSlicesArray = [];
      smallestIdx = null;
      idx = 0;
      for (key in this.nonnumflagCounters[nonnumflagCounterIndex]) {
        if (len(pieSlicesArray) <= maxSlices) {
          var value = this.nonnumflagCounters[nonnumflagCounterIndex][key];
          totalValue += value;
          var percent = (100 * value) / this.numPoints;
          totalPercent += percent;
          pieSlicesArray.add(Slice(key, value, percent));
          if (smallestIdx == null) {
            smallestIdx = 0;
          } else {
            if (pieSlicesArray[smallestIdx] >= value) {
              smallestIdx = idx;
            }
          }
        } else {
          if (smallestIdx != null) {
            var value = this.nonnumflagCounters[nonnumflagCounterIndex][key];
            totalValue += value;
            var percent = (100 * value) / this.numPoints;
            totalPercent += percent;
            totalValue -= pieSlicesArray[smallestIdx].value;
            totalPercent -= pieSlicesArray[smallestIdx].percent;
            pieSlicesArray[smallestIdx] = Slice(key, value, percent);
          }
        }
        idx++;
      }
      pieSlicesArray.sort((s1, s2) => (s1.value > s2.value ? -1 : 0)); // Sort descendingly by value
      pieSlicesArray.add(Slice(other, this.numPoints - totalValue, 100 - totalPercent));
      console.log(pieSlicesArray);
      return pieSlicesArray;
    }
    // If the pie of this nonnumflag has been calculated before, but the number of Slices is too great
    else if (len(this._pies[nonnumflagCounterIndex]) - 1 > maxSlices) {
      var removeNumber = maxSlices - len(this._pies[nonnumflagCounterIndex]) + 1;
      var extraValue = 0;
      var extraPercent = 0;
      for (var i = this._pies[nonnumflagCounterIndex].length - 2; i >= maxSlices; i--) {
        extraValue += this._pies[nonnumflagCounterIndex][i].value;
        extraPercent += this._pies[nonnumflagCounterIndex][i].percent;
      }
      var pieView = this._pies[nonnumflagCounterIndex].slice(0, maxSlices);
      pieView.add(this._pies[nonnumflagCounterIndex][len(this._pies[nonnumflagCounterIndex]) - 1]);

      pieView[pieView.length - 1].value += extraValue;
      pieView[pieView.length - 1].percent += extraPercent;

      return pieView;
    }
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
  numflags_array,
  nonnumflags_array,
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

    // Create an array of Cluster objects
    let clusters = new Array(largestLabel + 1)
      .fill()
      .map(
        (_, idx) =>
          new Cluster(
            (label = idx),
            (numPoints = 0),
            (nonnumflagCounters = new Array(numNonNumColumns)
              .fill(null)
              .map(() => ({}))),
            (numflagSums = new Array(numNumColumns).fill(0)),
            (numflagAverages = new Array(numNumColumns).fill(0)),
            (numflagMins = new Array(numNumColumns).fill(Infinity)),
            (numflagMaxs = new Array(numNumColumns).fill(-Infinity)),
          ),
      );

    // Count the number of points in each cluster
    currentLabels.forEach((label) => {
      clusters[label].numPoints++;
    });

    console.log("-------------------");
    clusters.forEach((cluster) => {
      console.log(cluster.name + " has " + cluster.numPoints + " points");
    });
    console.log("-------------------");
    // flags is array of values of the flag columns of the i'th point in labels
    // counting the nonnumflags of each cluster
    var point_idx = 0;
    nonnumflags_array.forEach((flags) => {
      let cluster_idx = currentLabels[point_idx];
      flag_idx = 0;
      flags.forEach((flag) => {
        if (flag in clusters[cluster_idx].nonnumflagCounters[flag_idx]) {
          clusters[cluster_idx].nonnumflagCounters[flag_idx][flag]++;
        } else {
          clusters[cluster_idx].nonnumflagCounters[flag_idx][flag] = 1;
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

    // calculating average of numflags
    for (let cluster_idx = 0; cluster_idx < largestLabel + 1; cluster_idx++) {
      for (let flag_idx = 0; flag_idx < numNumColumns; flag_idx++) {
        clusters[cluster_idx].numflagAverages[flag_idx] =
          clusters[cluster_idx].numflagSums[flag_idx] /
          clusters[cluster_idx].numPoints;
      }
    }
    console.log(
      "-----------------------------------------------------------------",
    );
    console.log(clusters);
    clusterInfos[i] = clusters;
  }
  return clusterInfos;
}
