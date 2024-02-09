// Promisify onRuntimeInitialized
let wasmReady = new Promise((resolve) => {
  Module.onRuntimeInitialized = resolve;
});

/**
 * This is the main clustering function, it parses the input data to
 * a suitable format and calls the scaling and clustering function
 * of the webassembly module.
 *
 * @param {array} inputPoints - The data of "distance information" columns.
 * @param {string} type - Type of data, e.g. euclidean, custom
 * @param {array} nonnumflags_array - The data of "not numerical flags" columns.
 * @param {array} numflags_array - The data of "numerical flags" columns.
 * @param {int} scalingMethod - Method of scaling: 1 (smacof), 2 (scikit), 3 (glimmer).
 * @param {int} distMethod - Method of clustering, e.g. complete, average.
 * @param {array} flagColumnNames -
 * @param {int} zoomMode -
 * @param {int} zoomNumber -
 */
async function calculateClusters(
  inputPoints,
  type,
  nonnumflags_array,
  numflags_array,
  scalingMethod,
  distMethod,
  flagColumnNames,
  zoomMode,
  zoomNumber,
) {
  // For now hardcoded
  maxIterations = 100;

  await wasmReady; // Make sure module is loaded
  console.log("Starting Clustering Program");

  var totalprogress = 0.0;
  var partialprogress = 0.0;
  var pProgressStep = 0.0;
  var tProgressStep = 0.0;
  //open progress_bar

  let n = inputPoints.length;
  var zoomLevels = 1;
  //determine ZoomMode and Number of Zoomlevels accordingly
  if (zoomMode == 0) {  
    //automatic - app chooses how many clusters are built
    //zoomLevels are given by user
    zoomLevels = zoomNumber; 
  }
  if (zoomMode == 1) {
    //number of cluster increase linear
    //zoomlevels proportional to increase per level
    zoomLevels = Math.ceil(n / zoomNumber);
  }
  if (zoomMode == 2) {
    //number of cluster increase exponential
    //zoomlevels logarithmic to zoomNumber
    zoomLevels = Math.ceil(Math.log(n / 2) / Math.log(zoomNumber));
  }

  /*
   * ##################
   * ## CUSTOM INPUT ##
   * ##################
   */
  if (type == "custom") {
    console.log(inputPoints);

    // Custom distance function
    // Will be read from textbox
    let customFunction;

    // Read functon from textarea and evaluate
    customFunction = eval(document.getElementById("distFunction").value);

    // Resulting points after scaling will be
    // saved in special array
    let pointsToPlot = [];

    // Memory allocation for wasm
    let resultPoints = new Float64Array(n * 2);
    let resultPointsBuf = Module._malloc(
      n * 2 * Float64Array.BYTES_PER_ELEMENT,
    );

    // Fill distance matrix using custom distance function
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

    // These buffers are necessary for clustering
    // and part of hclust
    let distMatBuf = Module._malloc(
      ((n * (n - 1)) / 2) * Float64Array.BYTES_PER_ELEMENT,
    );
    Module.HEAPF64.set(distMat, distMatBuf / distMat.BYTES_PER_ELEMENT);
    let heightBuf = Module._malloc((n - 1) * Float64Array.BYTES_PER_ELEMENT);
    let mergeBuf = Module._malloc(2 * (n - 1) * Int32Array.BYTES_PER_ELEMENT);
    let labelsBuf = Module._malloc(
      n * zoomLevels * Int32Array.BYTES_PER_ELEMENT,
    );

    //Buffers to keep track of progress of calculation
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
        "number", // distMatBuf
        "number", // heightBuf
        "number", // mergeBuf
        "number", // labelsBuf
        "number", // n
        "number", // zoomMode
        "number", // zoomNumber
        "number", // maxIterations
        "number", // zoomLevels
        "number", // distMethod
        "number", // resultPointsBuf
        "number", // scalingMethod
        "number", // totalprogressBuf
        "number", // partialprogressBuf
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

    // Copy results from wasm to local array
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

    // Save the points in a special format
    // to be used with D3
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
    Module._free(resultPointsBuf);
    Module._free(totalprogressBuf);
    Module._free(partialprogressBuf);

    // Get cluster info for overview of the data
    var clusterInfos = getClusterInfo(
      zoomLevels,
      labelsResult,
      n,
      numflags_array, // Holds an array for each point, holding the numflag values for that point
      nonnumflags_array, // Holds an array for each point, holding the nonnumflag values for that point
    );

    // Call the function of map to plot
    mapFunctions(
      labelsResult,
      pointsToPlot,
      n,
      zoomLevels,
      clusterInfos,
      flagColumnNames,
      numflags_array,
    );
    totalprogress = 0.99;

    /*
     * ########################
     * ## PRECLUSTERED INPUT ##
     * ########################
     */
  } else if (type == "preclustered") {
    // Read the JSON from a textarea
    var dataJson = JSON.parse(document.getElementById("distFunction").value);

    totalprogress = 0.99;

    // The second JSON entry contains to points
    // so to get n we look at its length
    let n = dataJson[1].length;

    // Get cluster info for overview of the data
    var clusterInfos = getClusterInfo(
      zoomLevels,
      Object.values(dataJson[0]),
      n,
      numflags_array, // Holds an array for each point, holding the numflag values for that point
      nonnumflags_array, // Holds an array for each point, holding the nonnumflag values for that point
    );

    // Call the function of map to plot
    mapFunctions(
      dataJson[0], // These are the labels (first entry in JSON file)
      dataJson[1], // These are points with x- and y-coordinates (second entry)
      n,
      zoomLevels,
      clusterInfos,
      flagColumnNames,
      numflags_array,
    );
  } else if (type == "euclidean" || type == "earth-dist") {
    /*
     * #####################
     * ## EUCLIDEAN INPUT ##
     * #####################
     */
    // isSpherical is to be used for earth distance
    let isSperical = false;
    if (type == "earth-dist") {
      isSperical = true;
    }

    // Resulting points after scaling will be
    // saved in special array
    let pointsToPlot = [];

    if (n == 0) {
      var dim = 1;
    } else {
      var dim = inputPoints[0].length;
    }
    let flatInputPoints = inputPoints.flat();

    // Stores the input points in a flattened array
    let points = new Float64Array(n * dim);
    for (let i = 0; i < n * dim; i++) {
      points[i] = parseFloat(flatInputPoints[i]);
    }

    // Allocate memory for storing the points in a flat array
    let pointsBuf = Module._malloc(n * dim * Float64Array.BYTES_PER_ELEMENT);

    // These buffers are necessary for clustering
    // and part of hclust
    let distMatBuf = Module._malloc(n * n * Float64Array.BYTES_PER_ELEMENT);
    let heightBuf = Module._malloc((n - 1) * Float64Array.BYTES_PER_ELEMENT);
    let mergeBuf = Module._malloc(2 * (n - 1) * Int32Array.BYTES_PER_ELEMENT);
    let labelsBuf = Module._malloc(
      n * zoomLevels * Int32Array.BYTES_PER_ELEMENT,
    );

    //Buffers to keep track of progress of calculation
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
        "number", // pointsBuf
        "number", // dim
        "number", // distMatBuf
        "number", // heightBuf
        "number", // mergeBuf
        "number", // labelsBuf
        "number", // n
        "number", // zoomMode
        "number", // zoomNumber
        "number", // maxIterations
        "number", // zoomLevels
        "number", // distMethod
        "number", // scalingMethod
        "number", // isSperical
        "number", // totalprogressBuf
        "number", // partialprogressBuf
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
    totalprogress = 0.98;

    // Copy results from wasm to local array
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

    // Save the points in a special format
    // to be used with D3
    for (var i = 0; i < n * 2; i += 2) {
      pointsToPlot.push({
        x: pointsResult[i],
        y: pointsResult[i + 1],
      });
    }
    // Free memory
    Module._free(pointsBuf);
    Module._free(distMatBuf);
    Module._free(heightBuf);
    Module._free(mergeBuf);
    Module._free(labelsBuf);
    Module._free(totalprogressBuf);
    Module._free(partialprogressBuf);

    // Get cluster info for overview of the data
    var clusterInfos = getClusterInfo(
      zoomLevels,
      labelsResult,
      n,
      numflags_array, // Holds an array for each point, holding the numflag values for that point
      nonnumflags_array, // Holds an array for each point, holding the nonnumflag values for that point
    );

    // Call the function of map to plot
    mapFunctions(
      labelsResult,
      pointsToPlot,
      n,
      zoomLevels,
      clusterInfos,
      flagColumnNames,
      numflags_array,
    );
    totalprogress = 0.99;
    /*
     * ###################
     * ## STRING INPUT  ##
     * ###################
     */
  } else if (type == "tanimotoFingerprints" || type == "edit-distance") {
    // Conver type information to integer
    if (type == "tanimotoFingerprints") {
      type = 0;
      bit_bool = 1;
    } else if (type == "edit-distance") {
      type = 1;
      bit_bool = 0;
    }

    // Create one large string and an array where i-th entry
    // is the length of string number i
    let n = inputPoints.length;
    let lengthOfString = new Uint32Array(n);
    let inputString = "";
    for (let i = 0; i < n; i++) {
      inputString += inputPoints[i];
      lengthOfString[i] = inputPoints[i].length;
    }

    // Allocate memory for inputString
    let lengthBytes = lengthBytesUTF8(inputString) + 1;
    let stringOnHeap = _malloc(lengthBytes);
    stringToUTF8(inputString, stringOnHeap, lengthBytes);

    // Resulting points after scaling will be
    // saved in special array
    let pointsToPlot = [];

    // Memory allocation for wasm
    let resultPoints = new Float64Array(n * 2);
    let resultPointsBuf = Module._malloc(
      n * 2 * Float64Array.BYTES_PER_ELEMENT,
    );
    let lengthOfStringBuf = Module._malloc(
      lengthOfString.length * lengthOfString.BYTES_PER_ELEMENT,
    );

    // These buffers are necessary for clustering
    // and part of hclust
    let distMatBuf = Module._malloc(n * n * Float64Array.BYTES_PER_ELEMENT);
    let heightBuf = Module._malloc((n - 1) * Float64Array.BYTES_PER_ELEMENT);
    let mergeBuf = Module._malloc(2 * (n - 1) * Int32Array.BYTES_PER_ELEMENT);
    let labelsBuf = Module._malloc(
      n * zoomLevels * Int32Array.BYTES_PER_ELEMENT,
    );
    
    totalprogress = 0.05;
    //Buffers to keep track of progress of calculation

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
    Module.HEAPU32.set(
      lengthOfString,
      lengthOfStringBuf / lengthOfString.BYTES_PER_ELEMENT,
    );

    // Actual function call to cluster
    Module.ccall(
      "clusterStrings",
      null,
      [
        "number", // stringOnHeap
        "number", // lengthOfStringBuf
        "number", // distMatBuf
        "number", // heightBuf
        "number", // mergeBuf
        "number", // labelsBuf
        "number", // n
        "number", // zoomMode
        "number", // zoomNumber
        "number", // maxIterations
        "number", // zoomLevels
        "number", // distMethod
        "number", // scalingMethod
        "number", // bit_bool
        "number", // resultPointsBuf
        "number", // type
        "number", // totalprogressBuf
        "number", // partialprogressBuf
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
    totalprogress = 0.98;

    // Copy results from wasm to local array
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

    // Save the points in a special format
    // to be used with D3
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

    // Get cluster info for overview of the data
    var clusterInfos = getClusterInfo(
      zoomLevels,
      labelsResult,
      n,
      numflags_array,
      nonnumflags_array,
    );

    // Call the function of map to plot
    mapFunctions(
      labelsResult,
      pointsToPlot,
      n,
      zoomLevels,
      clusterInfos,
      flagColumnNames,
      numflags_array,
    );
    totalprogress = 0.99;
  }
  //close progress bar
}

/**
 * Represents a slice of a pie chart.
 *
 * @property {string} name - The name of the slice.
 * @property {number} value - The numerical value of the slice.
 * @property {number} percentage - The percentage that this slice represents out of the total.
 *
 * @example
 * const slice = new Slice('Example Slice', 10, 25);
 */
class Slice {
  constructor(name, value, percentage) {
    this.name = name;
    this.value = value;
    this.percentage = percentage;
  }
}

/**
 * @typedef {Object} NonnumflagCounter
 * @property {string} key - The different values that appear for that nonnumflag.
 * @property {number} value - The number of points which take up that value.
 */
/** A class that holds the information of a cluster.
 *
 * Also contains information on which pie charts should be calculated and how many slices they should have.
 * However, the actual calculation happens not at construction, but in the getPie method.
 * This method may be called at any time for any flag, so this is not binding.
 * For more information on how pie charts are calculated and cached, see the getPie method.
 *
 * Conceptually, this class is built to be adaptable and flexible to possible
 * future usecases. This is part of the reasoning for the pointIndices property,
 * aswell as some other design choices.
 *
 *
 * @property {number} label - The label of the cluster corresponding to the label in the labelsResult array.
 * @property {number} numPoints - The number of points in the cluster.
 * @property {NonnumflagCounter[]} nonnumflagCounters - An array of maps, the i'th map corresponds to the i'th nonnumflag.
 * Each map counts the occurrences of the different values which occur for that nonnumflag.
 * @property {number[]} numflagSums - An array which contains the sum of each numflag.
 * @property {number[]} numflagAverages - An array which contains the average of each numflag.
 * @property {number[]} numflagMins - An array which contains the minimum of each numflag.
 * @property {number[]} numflagMaxs - An array which contains the maximum of each numflag.
 * @property {number[]} pointIndices - An array of the indices from the currentLabels array of the points in the cluster.
 * The i'th element corresponds to the index in currentLabels of the i'th point in the cluster.
 *
 * @property {number[]} pieFlagIndices - An array of the indices of the nonnumflags for which pie charts could be of interest.
 *
 * This is not binding, as pie charts are not calculated at construction, but may be used as information when getting pie charts for the cluster.
 * This allows for a potential dynamic implementation, where pie charts are only calculated for specific nonnumflags, even on a per-cluster basis.
 *
 * If empty, pie charts will be calculated for each flag. To calcululate none, set pieMaxNumSlicesDefault<=0.
 *
 * @property {number} pieMaxNumSlicesDefault - The maximum number of slices (excluding the automatic "other" slice) to be calculated.
 *
 * This is not binding, as pie charts are not calculated at construction, but used as default when calling the getPie method.
 *
 * @example
 * const cluster = new Cluster(label, numPoints, nonnumflagCounters, numflagSums, numflagAverages, numflagMins, numflagMaxs, pointIndices, pieFlagIndices, pieMaxNumSlicesDefault);
 */
class Cluster {
  constructor(
    label,
    numPoints = 0,
    nonnumflagCounters = [],
    numflagSums = [],
    numflagAverages = [],
    numflagMins = [],
    numflagMaxs = [],
    pointIndices = [],
    pieFlagIndices = [],
    pieMaxNumSlicesDefault = 5,
  ) {
    // Set the properties of the cluster
    this.label = label;
    this.numPoints = numPoints;
    this.nonnumflagCounters = nonnumflagCounters;
    this.numflagSums = numflagSums;
    this.numflagAverages = numflagAverages;
    this.numflagMins = numflagMins;
    this.numflagMaxs = numflagMaxs;
    this.pointIndices = pointIndices;
    this.pieMaxNumSlicesDefault = pieMaxNumSlicesDefault;
    this.pieFlagIndices = pieFlagIndices;
    // Initialiize empty pies cache
    /**
     * @private
     * @type {Array}
     * Cache for pie charts for the nonnumflags.
     */
    this._pies = new Array(nonnumflagCounters.length)
      .fill(null)
      .map(() => null);
  }

  /**
   * Getter method for the name of the cluster.
   *
   * @returns {string} - "Cluster #" + `this.label`.
   */
  get name() {
    return "Cluster #" + this.label;
  }

  /**
   * Returns a pie chart on the cluster for a given nonnumflag.
   *
   * The pie chart is represented as an array of {@link Slice} instances, ordered in descending order by their value.
   * The last slice is always the "other" slice, which represents all other values not included in the top slices.
   * The maximum number of slices can be specified, excluding the "other" slice.
   *
   * @param {number} nonnumflagCounterIndex - The index of the nonnumflag in `this.nonnumflagCounters` for which to get the pie chart.
   * @param {number} [maxSlices=this.pieMaxNumSlicesDefault] - The maximum number of slices (excluding the automatic "other" slice) to be calculated.
   * @returns {Array<Slice>} - Array of {@link Slice} instances, in descending order by `Slice.value`, with the last element always being the "other" slice.
   *
   * ### On implementation:
   *
   * The cluster class uses a form of caching to avoid unnecessary computations of pie charts.
   *
   * The piechart with the largest number of slices yet calculated is stored for each nonnumflag in the `Cluster._pies` array.
   * When getPie is called, it first checks if the pie has already been calculated:
   *
   * 1. If not, it calculates it and stores it in the `Cluster._pies` array.
   *
   * 2. If the pie has been calculated before, but the number of slices is too great, it removes the smaller slices and adjusts the "other" slice.
   *
   * 3. If the pie has been calculated before and the number of slices is too small, it recalculates the pie with the new number of slices.
   *
   * Current implementation of scenario 3 is not ideal, as it recalcualtes the pie from scratch instead of adjusting the percentages of the existing slices and adding
   * new ones. This is especially true as the Charts.js library used to display the pie charts does not use the percentage values of the
   * slices and instead calculates them anew; Though it is still sensical to have the percentages on hand for possible future usecases.
   * If a feature gets implemented where calculations of upwards scaling pie charts are a possibility, the necessary maximum number of slices should either
   * be calculated and thus cached early or this method should be adjusted to not recalculate pie charts from scratch that already have a smaller version cached.
   */
  getPie(nonnumflagCounterIndex, maxSlices = this.pieMaxNumSlicesDefault) {
    if (nonnumflagCounterIndex >= this.nonnumflagCounters.length) {
      throw "given nonnumflagCounterIndex is >= this.nonnumflagCounters.length";
    }
    // Keep track of total percent in the biggest maxSlices slices (for construction of the other slice)
    var totalPercent = 0;
    // Keep track of total value in the biggest maxSlices slices (for construction of the other slice)
    var totalValue = 0;
    // If the pie of this nonnumflag has not yet been calculated before, or there are not enough slices in it
    if (
      this._pies[nonnumflagCounterIndex] == null ||
      (this._pies[nonnumflagCounterIndex].length - 1 < maxSlices && // more slices allowed
        this.nonnumflagCounters[nonnumflagCounterIndex].size >
          this._pies[nonnumflagCounterIndex].length - 1) // more slices possible)
    ) {
      // Find at most maxSlices biggest pie Slices and store them in pieSlicesArray sorted desc with an added "other" Slice.
      // Where each slice corresponds to a flagValue (string) the nonnumflag takes up at some point in the cluster,
      // and the Slice.value is the number of points in the cluster which take up that flagValue (string).
      var pieSlicesArray = [];
      var smallestIdx = null;
      var idx = 0;
      // Iterate over the nonnumflags different values and add (up to) maxSlices of them as a Slice to the pieSlicesArray
      for (let key of this.nonnumflagCounters[nonnumflagCounterIndex].keys()) {
        // Case where the number of slices is not yet maxSlices
        if (pieSlicesArray.length <= maxSlices) {
          var value = this.nonnumflagCounters[nonnumflagCounterIndex].get(key);
          totalValue += value;
          var percent = (100 * value) / this.numPoints;
          totalPercent += percent;
          pieSlicesArray.push(new Slice(key, value, percent));
          if (smallestIdx == null) {
            smallestIdx = 0;
          } else {
            if (value < pieSlicesArray[smallestIdx].value) {
              smallestIdx = idx;
            }
          }
        } else {
          // Case where pieSlicesArray has reached max length, now we continually
          // replace the smallest element if the new element is bigger
          if (smallestIdx != null) {
            var value =
              this.nonnumflagCounters[nonnumflagCounterIndex].get(key);
            if (value > pieSlicesArray[smallestIdx].value) {
              totalValue += value;
              var percent = (100 * value) / this.numPoints;
              totalPercent += percent;
              totalValue -= pieSlicesArray[smallestIdx].value;
              totalPercent -= pieSlicesArray[smallestIdx].percent;
              pieSlicesArray[smallestIdx] = new Slice(key, value, percent);
              // Finding new smallest element
              // This whole operation could be better implemented using a minHeap,
              // or at least binary search, but current use cases only have at max 5 slices per chart
              smallestIdx = 0;
              let smallestValue = pieSlicesArray[0].value;
              pieSlicesArray.forEach((slice, index) => {
                if (slice.value < smallestValue) {
                  smallestIdx = index;
                  smallestValue = slice.value;
                }
              });
            }
          }
        }
        idx++;
      }
      // Sort descendingly by value
      pieSlicesArray.sort((s1, s2) => (s1.value > s2.value ? -1 : 0));
      // Add "other" slice
      pieSlicesArray.push(
        new Slice("other", this.numPoints - totalValue, 100 - totalPercent),
      );
      // Insert into cache
      this._pies[nonnumflagCounterIndex] = pieSlicesArray;

      return pieSlicesArray;
    }
    // If the pie of this nonnumflag has been calculated before, but the number of Slices is too great
    else if (this._pies[nonnumflagCounterIndex].length - 1 > maxSlices) {
      var removeNumber =
        maxSlices - this._pies[nonnumflagCounterIndex].length + 1;

      // Keep track of total removed (for reconstruction of the other slice)
      var extraValue = 0;
      // Keep track of total removed percent (for reconstruction of the other slice)
      var extraPercent = 0;
      // Iterate over the slices which are extra (too many),
      // starting with the last slice that is not the "other" slice (meaning the smallest)
      // and ending before the smallest slice that is not extra
      for (
        var i = this._pies[nonnumflagCounterIndex].length - 2;
        i >= maxSlices;
        i--
      ) {
        // Count the extra value and percent which will be removed
        extraValue += this._pies[nonnumflagCounterIndex][i].value;
        extraPercent += this._pies[nonnumflagCounterIndex][i].percent;
      }

      // Create a view of the pie that contains only the maxSlices biggest slices, without an "other" slice
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

      // Don't cache it. But might be useful depending on context at some point,
      // if for some reason pies are constantly scaled down, and/or scaling up is
      // implemented in a (more) efficient way
      //this._pies[nonnumflagCounterIndex] = pieView;

      return pieView;
    }

    // If the pie has been calculated before, and the number of slices is
    // conforming to maxSlices exactly
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
    let clusters = new Array(largestLabel + 1).fill().map(
      (_, idx) =>
        new Cluster(
          idx,
          0,
          new Array(numNonNumColumns).fill(null).map(() => new Map()),
          new Array(numNumColumns).fill(0),
          new Array(numNumColumns).fill(0),
          new Array(numNumColumns).fill(Infinity),
          new Array(numNumColumns).fill(-Infinity),
          [],
        ),
    );

    // Count the number of points in each cluster
    let pointIdx = 0;
    currentLabels.forEach((label) => {
      clusters[label].numPoints++;
      clusters[label].pointIndices.push(pointIdx); // keep track of the points that are in the cluster
      pointIdx++;
    });

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

    // calculating average of numflags
    for (let cluster_idx = 0; cluster_idx < largestLabel + 1; cluster_idx++) {
      for (let flag_idx = 0; flag_idx < numNumColumns; flag_idx++) {
        clusters[cluster_idx].numflagAverages[flag_idx] =
          clusters[cluster_idx].numflagSums[flag_idx] /
          clusters[cluster_idx].numPoints;
      }
    }
    clusterInfos[i] = clusters;

    //`Creating pies for each cluster in zoom layer ${i}, and logging them.`,
    //);
    clusterInfos[i].forEach((cluster) => {
      if (cluster.pieMaxNumSlicesDefault > 0) {
        if (cluster.pieFlagIndices.length == 0) {
          for (var i = 0; i < cluster.nonnumflagCounters.length; i++) {
            var pie = cluster.getPie(i); // getPie also edits the internal Cluster._pies array in place
          }
        } else {
          cluster.pieFlagIndices.forEach((idx) => {
            var pie = cluster.getPie(idx);
          });
        }
      }
    });
  }
  return clusterInfos.reverse();
}
