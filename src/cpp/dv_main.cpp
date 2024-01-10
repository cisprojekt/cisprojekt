// Copyright [year] <Copyright Owner>
#include "src/cpp/dv_main.h"
#include <string>
#include <vector>

using Eigen::MatrixXd;

EMSCRIPTEN_KEEPALIVE
extern "C" void clusterStrings(char *inputStringChar, double *lengthOfString,
                               double *distMat, double *height, int *merge,
                               int *labels, int nStrings, int maxIterations,
                               int zoomLevels, int calcDistMethod,
                               int calcScalingMethod, double *resultPoints) {
  // Split the long string into smaller strings
  // and put them in a vector
  std::string inputString(inputStringChar);
  std::vector<std::string> stringVector(nStrings);
  int startLength = 0;
  for (int i = 0; i < nStrings; i++) {
    std::string tempString = inputString.substr(startLength, lengthOfString[i]);
    stringVector[i] = tempString;
    startLength += lengthOfString[i];
  }

  // For now we assume the input are fingerprints, not SMILES
  MatrixXd distMatMDS = distanceMatrix(stringVector);
  /*(Todo Timo: case - different scaling algorithms
  calculateMDSglimmer()
  calculateMDSscikit()
  */

  switch (calcScalingMethod) {
  case 1:
    MatrixXd resultMDS = calculateMDSsmacof(distMatMDS, maxIterations);
    break;
  case 2:
    MatrixXd resultMDS = calculateMDSscikit(distMatMDS, maxIterations);
    break;
  case 3:
    MatrixXd resultMDS = calculateMDSglimmer(distMatMDS, maxIterations);
    break;
  default:
    printf("no valid scaling algorithm was chosen");
    break;
  }

  // Overwrite points with the new configuration
  for (int i = 0; i < nStrings; i++) {
    for (int j = 0; j < 2; j++) {
      resultPoints[i * 2 + j] = resultMDS(i, j);
    }
  }

  // Create condensed distance matrix to work with hclust-cpp
  int k = 0;
  for (int i = 0; i < nStrings; i++) {
    for (int j = i + 1; j < nStrings; j++) {
      distMat[k] = euclideanDistance(resultMDS.row(i), resultMDS.row(j));
      k++;
    }
  }

  // Do the clustering
  hclust_fast(nStrings, distMat, HCLUST_METHOD_COMPLETE, merge, height);

  // Find maximum distance in order to create good cuts of dendrogram
  // TODO(Jonas): Check if its always last element
  double maxHeight = 0;
  for (int i = 0; i < nStrings - 1; i++) {
    if (height[i] > maxHeight) {
      maxHeight = height[i];
    }
  }

  // For each zoomlevel calculate a labels assignment
  int *oneLabel = new int[nStrings];
  for (int i = 0; i < zoomLevels; i++) {
    cutree_cdist(nStrings, merge, height, (i + 1) * maxHeight / zoomLevels,
                 oneLabel);
    std::memcpy(labels + i * nStrings, oneLabel, nStrings * sizeof(int));
  }

  delete[] oneLabel;
}

EMSCRIPTEN_KEEPALIVE
extern "C" void clusterPoints(double *points, int dimension, double *distMat,
                              double *height, int *merge, int *labels,
                              int nPoints, int maxIterations, int zoomLevels,
                              int calcDistMethod, int calcScalingMethod,
                              bool isSpherical) {
  /**
   * Two different types of distance matrices exist:
   * (1) reduced condensed distance matrix
   * (2) full distance matrix
   * Depending on which MDS algorithm is to be used
   * the appropriate type is choosen
   */

  // Calculate full distance matrix
  // For MDS using SMACOF
  if (calcDistMethod == 1) {
    // Move points into matrix
    MatrixXd pointMatrix(nPoints, dimension);
    for (int i = 0; i < nPoints; i++) {
      for (int j = 0; j < dimension; j++) {
        pointMatrix(i, j) = points[i * dimension + j];
      }
    }

    // Calculate distance matrix and apply SMACOF algorithm for MDS
    MatrixXd distMatMDS = distanceMatrix(pointMatrix, isSpherical);

    switch (calcScalingMethod) {
    case 1:
      MatrixXd resultMDS = calculateMDSsmacof(distMatMDS, maxIterations);
      break;
    case 2:
      MatrixXd resultMDS = calculateMDSscikit(distMatMDS, maxIterations);
      break;
    case 3:
      MatrixXd resultMDS = calculateMDSglimmer(N, distMatMDS);
      break;
    default:
      printf("no valid scaling algorithm was chosen");
      break;
    }

    // Overwrite points with the new configuration
    for (int i = 0; i < nPoints; i++) {
      for (int j = 0; j < dimension; j++) {
        points[i * dimension + j] = resultMDS(i, j);
      }
    }

    // Create condensed distance matrix to work with hclust-cpp
    int k = 0;
    for (int i = 0; i < nPoints; i++) {
      for (int j = i + 1; j < nPoints; j++) {
        distMat[k] = euclideanDistance(resultMDS.row(i), resultMDS.row(j));
        k++;
      }
    }

    // Calculate condensed distance matrix
  } else {
    double *distMatMDS =
        calculateEuclideanDistanceMatrix(points, nPoints, dimension);
  }

  // Do the clustering
  hclust_fast(nPoints, distMat, HCLUST_METHOD_COMPLETE, merge, height);

  // Find maximum distance in order to create good cuts of dendrogram
  // TODO(Jonas): Check if its always last element
  double maxHeight = 0;
  for (int i = 0; i < nPoints - 1; i++) {
    if (height[i] > maxHeight) {
      maxHeight = height[i];
    }
  }

  // For each zoomlevel calculate a labels assignment
  int *oneLabel = new int[nPoints];
  for (int i = 0; i < zoomLevels; i++) {
    cutree_cdist(nPoints, merge, height, (i + 1) * maxHeight / zoomLevels,
                 oneLabel);
    std::memcpy(labels + i * nPoints, oneLabel, nPoints * sizeof(int));
  }

  delete[] oneLabel;
}
