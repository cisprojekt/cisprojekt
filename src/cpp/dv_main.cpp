// Copyright [year] <Copyright Owner>
#include "src/cpp/dv_main.h"

#include <time.h>

#include <boost/dynamic_bitset.hpp>
#include <string>
#include <vector>

using Eigen::MatrixXd;

EMSCRIPTEN_KEEPALIVE
extern "C" void clusterStrings(char *inputStringChar, int *lengthOfString,
                               double *distMat, double *height, int *merge,
                               int *labels, int nStrings, int maxIterations,
                               int zoomLevels, int calcDistMethod,
                               int calcScalingMethod, int bool_bit,
                               double *resultPoints, int type) {
  // Split the long string into smaller strings
  // and put them in a vector
  clock_t start_time1 = clock();
  MatrixXd distMatMDS(nStrings, nStrings);
  if (bool_bit == 1) {
    int substringlength = lengthOfString[0];
    std::cout << "clusterStrings start" << std::endl;
    std::vector<boost::dynamic_bitset<>> bitstringVector;

    for (int i = 0; i < nStrings; i++) {
      boost::dynamic_bitset<> currentbitset(substringlength);
      int startidx = i * substringlength;
      for (int j = 0; j < substringlength; j++) {
        if (inputStringChar[startidx + j] == '1') {
          currentbitset[j] = 1;
        }
      }
      bitstringVector.push_back(currentbitset);
    }
    std::cout << "start distancematrix" << std::endl;
    distMatMDS = distanceMatrix(bitstringVector, substringlength);
  } else {
    std::cout << "clusterStrings start" << std::endl;
    std::string inputString(inputStringChar);
    std::vector<std::string> stringVector(nStrings);
    int startLength = 0;
    std::cout << "tempstrings " << std::endl;
    for (int i = 0; i < nStrings; i++) {
      std::string tempString =
          inputString.substr(startLength, lengthOfString[i]);
      std::cout << tempString << std::endl;
      stringVector[i] = tempString;
      startLength += lengthOfString[i];
      std::cout << "Stringvector " << i << " " << stringVector[i] << std::endl;
    }
    std::cout << "inputString " << inputString << std::endl;

    // For now we assume the input are fingerprints, not SMILES
    std::cout << "start distanceMatrix" << std::endl;
    distMatMDS = distanceMatrix(stringVector, type);
  }
  std::cout << "distanceMatrix finished" << std::endl;
  MatrixXd resultMDS;

  switch (calcScalingMethod) {
  case 1:
    resultMDS = calculateMDSsmacof(distMatMDS, maxIterations);
    break;
  case 2:
    resultMDS = calculateMDSscikit(nStrings, distMatMDS);
    break;
  case 3:
    resultMDS = calculateMDSglimmer(nStrings, distMatMDS);
    break;
  default:
    printf("no valid scaling algorithm was chosen");
    break;
  }
  std::cout << "Scaling finished" << std::endl;
  // std::cout << resultMDS << std::endl;
  // Overwrite points with the new configuration
  for (int i = 0; i < nStrings; i++) {
    for (int j = 0; j < 2; j++) {
      resultPoints[i * 2 + j] = resultMDS(i, j);
    }
  }
  /*
    // Create condensed distance matrix to work with hclust-cpp
    int k = 0;
    for (int i = 0; i < nStrings; i++) {
      for (int j = i + 1; j < nStrings; j++) {
        distMat[k] = euclideanDistance(resultMDS.row(i), resultMDS.row(j));
        k++;
      }
    }
  */
  // Do the clustering
  hclust_fast(nStrings, distMatMDS, calcDistMethod, merge, height);
  std::cout << "clustering finished" << std::endl;
  clock_t start_time3 = clock();
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
  std::cout << "cutree finished" << std::endl;
  delete[] oneLabel;
  clock_t start_time2 = clock();
  std::cout << "cutree needed "
            << static_cast<float>(start_time2 - start_time3) / (CLOCKS_PER_SEC)
            << "s for calculating clusterlabels\n";
  std::cout << "ClusterStrings needed "
            << static_cast<float>(start_time2 - start_time1) / (CLOCKS_PER_SEC)
            << "s in total\n";
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
  if (calcDistMethod == 1) {
    // Move points into matrix
    MatrixXd pointMatrix(nPoints, dimension);
    for (int i = 0; i < nPoints; i++) {
      for (int j = 0; j < dimension; j++) {
        pointMatrix(i, j) = points[i * dimension + j];
      }
    }

    std::cout << "pointmatrix initialized" << std::endl;
    // Calculate distance matrix and apply SMACOF algorithm for MDS
    MatrixXd distMatMDS = distanceMatrix(pointMatrix, isSpherical);
    std::cout << "distancematrix calculated" << std::endl;
    MatrixXd resultMDS;
    switch (calcScalingMethod) {
    case 1:
      resultMDS = calculateMDSsmacof(distMatMDS, maxIterations);
      break;
    case 2:
      resultMDS = calculateMDSscikit(nPoints, distMatMDS);
      break;
    case 3:
      resultMDS = calculateMDSglimmer(nPoints, distMatMDS);
      break;
    default:
      printf("no valid scaling algorithm was chosen");
      break;
    }
    std::cout << "scaling finished" << std::endl;
    // Overwrite points with the new configuration
    for (int i = 0; i < nPoints; i++) {
      for (int j = 0; j < dimension; j++) {
        points[i * dimension + j] = resultMDS(i, j);
      }
    }
    /*
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
    */
    // Do the clustering
    std::cout << "start clustering" << std::endl;
    hclust_fast(nPoints, distMatMDS, HCLUST_METHOD_COMPLETE, merge, height);
    std::cout << "clustering finished" << std::endl;
    clock_t start_time3 = clock();
    // Find maximum distance in order to create good cuts of dendrogram
    // TODO(Jonas): Check if its always last element
    double maxHeight = 0;
    for (int i = 0; i < nPoints - 1; i++) {
      if (height[i] > maxHeight) {
        maxHeight = height[i];
      }
    }
    std::cout << "maxheight calculated" << std::endl;
    // For each zoomlevel calculate a labels assignment
    int *oneLabel = new int[nPoints];
    for (int i = 0; i < zoomLevels; i++) {
      cutree_cdist(nPoints, merge, height, (i + 1) * maxHeight / zoomLevels,
                   oneLabel);
      std::memcpy(labels + i * nPoints, oneLabel, nPoints * sizeof(int));
    }
    std::cout << "tree cut" << std::endl;
    clock_t start_time4 = clock();
    std::cout << "cutree needed "
              << static_cast<float>(start_time4 - start_time3) /
                     (CLOCKS_PER_SEC)
              << "s for calculating clusterlabels\n";
    delete[] oneLabel;
  }
}
