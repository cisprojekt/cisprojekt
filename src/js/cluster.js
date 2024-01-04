let wasmReady = new Promise((resolve) => {
  Module.onRuntimeInitialized = resolve;
});

// inputPointsis NOT flattened!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
async function initializeMap(inputPoints, type) {
  await wasmReady;
  console.log("Starting Clustering Program");

  // For euclidean inputs
  if (type == "euclidean") {
    let pointsToPlot = [];
    n = inputPoints.length;
    console.log(n);
    console.log("Module loaded");
    if (inputPoints.length == 0) {
      var dim = 1;
    } else {
      var dim = inputPoints[0].length;
    }
    let flatInputPoints = inputPoints.flat();

    var zoomLevels = 20;
    maxIterations = 5;

    let points = new Float64Array(n * dim);

    for (let i = 0; i < n * dim; i++) {
      points[i] = parseFloat(flatInputPoints[i]);
    }

    console.log(points);

    let pointsBuf = Module._malloc(n * dim * Float64Array.BYTES_PER_ELEMENT);
    let distMatBuf = Module._malloc(
      ((n * (n - 1)) / 2) * Float64Array.BYTES_PER_ELEMENT,
    );
    let heightBuf = Module._malloc((n - 1) * Float64Array.BYTES_PER_ELEMENT);
    let mergeBuf = Module._malloc(2 * (n - 1) * Int32Array.BYTES_PER_ELEMENT);
    let labelsBuf = Module._malloc(
      n * zoomLevels * Int32Array.BYTES_PER_ELEMENT,
    );

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
      ],
    );

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

    for (var i = 0; i < n * 2; i += 2) {
      pointsToPlot.push({ x: pointsResult[i], y: pointsResult[i + 1] });
    }

    console.log(labelsResult);

    // Free memory
    Module._free(pointsBuf);
    Module._free(distMatBuf);
    Module._free(heightBuf);
    Module._free(mergeBuf);
    Module._free(labelsBuf);

    // Call the function of map to plot
    mapFunctions(labelsResult, pointsToPlot, n, zoomLevels);
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

    console.log(n);
    console.log(inputString);
    console.log("Module loaded");
    let zoomLevels = 20;
    let pointsToPlot = [];
    let maxIterations = 5;

    let resultPoints = new Float64Array(n * 2);

    let resultPointsBuf = Module._malloc(
      n * 2 * Float64Array.BYTES_PER_ELEMENT,
    );
    let lengthOfStringBuf = Module._malloc(n * Int32Array.BYTES_PER_ELEMENT);
    let distMatBuf = Module._malloc(
      ((n * (n - 1)) / 2) * Float64Array.BYTES_PER_ELEMENT,
    );
    let heightBuf = Module._malloc((n - 1) * Float64Array.BYTES_PER_ELEMENT);
    let mergeBuf = Module._malloc(2 * (n - 1) * Int32Array.BYTES_PER_ELEMENT);
    let labelsBuf = Module._malloc(
      n * zoomLevels * Int32Array.BYTES_PER_ELEMENT,
    );

    Module.HEAPF64.set(
      resultPoints,
      resultPointsBuf / resultPoints.BYTES_PER_ELEMENT,
    );
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
        resultPointsBuf,
      ],
    );

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
        x: pointsResult[i] * n * 2,
        y: pointsResult[i + 1] * n * 2,
      });
    }

    console.log(labelsResult);

    // Free memory
    Module._free(resultPointsBuf);
    Module._free(distMatBuf);
    Module._free(heightBuf);
    Module._free(mergeBuf);
    Module._free(resultPointsBuf);
    Module._free(lengthOfStringBuf);

    // Call the function of map to plot
    mapFunctions(labelsResult, pointsToPlot, n, zoomLevels);
  }
}
