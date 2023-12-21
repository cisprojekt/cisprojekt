let wasmReady = new Promise((resolve) => {
  Module.onRuntimeInitialized = resolve;
});

async function initializeMap(inputPoints, type) {
  await wasmReady;
  console.log("Starting Clustering Program");

  // For euclidean inputs
  if (type == "euclidean") {
    let pointsToPlot = [];
    n = inputPoints.length / 2; // TODO make this dynamic with dimension
    console.log(n);
    console.log("Module loaded");
    dim = 2;
    var zoomLevels = 20;
    maxIterations = 5;

    points = new Float64Array(n * dim);

    for (let i = 0; i < n * dim; i++) {
      points[i] = parseFloat(inputPoints[i]);
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
    Module._free(pointsBuf);
    Module._free(distMatBuf);
    Module._free(heightBuf);
    Module._free(mergeBuf);
    Module._free(labelsBuf);

    console.log("here " + zoomLevels);

    mapFunctions(labelsResult, pointsToPlot, n, zoomLevels);
  }
}
