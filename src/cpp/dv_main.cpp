// Copyright [2024] <cisprojekt>
#include "src/cpp/dv_main.h"

#include <time.h>

#include <boost/dynamic_bitset.hpp>
#include <iostream>
#include <string>
#include <vector>

using Eigen::MatrixXd;

extern "C" void clusterCustom(double *distMat, double *height, int *merge,
                              int *labels, int n, int zoomMode, int zoomNumber,
                              int maxIterations, int zoomLevels,
                              int calcDistMethod, double *resultPoints,
                              int calcScalingMethod, float *totalprogress,
                              float *partialprogress) {
  // Calculate distance matrix
  MatrixXd distMatMDS =
      distanceMatrix(distMat, n, totalprogress, partialprogress);

  MatrixXd resultMDS;  // Will save resulting configuration

  // Choose scaling method based on user input
  switch (calcScalingMethod) {
    case 1:
      resultMDS = calculateMDSsmacof(distMatMDS, totalprogress, partialprogress,
                                     maxIterations);
      break;
    case 2:
      resultMDS =
          calculateMDSscikit(n, distMatMDS, totalprogress, partialprogress);
      break;
    case 3:
      resultMDS =
          calculateMDSglimmer(n, distMatMDS, totalprogress, partialprogress);
      break;
    default:
      std::cout << "no valid scaling algorithm was chosen" << std::endl;
      break;
  }

  // Overwrite points with the new configuration
  for (int i = 0; i < n; i++) {
    for (int j = 0; j < 2; j++) {
      resultPoints[i * 2 + j] = resultMDS(i, j);
    }
  }

  // Do the clustering
  hclust_fast(n, distMatMDS, calcDistMethod, merge, height, totalprogress,
              partialprogress);

  // For each zoomlevel calculate a labels assignment
  // based on chosen zoomMode
  int *oneLabel = new int[n];  // One label array for each zoomLevel
  switch (zoomMode) {
    case 0: {
      // Find maximum height
      double maxHeight = 0;

      for (int i = 0; i < n - 1; i++) {
        if (height[i] > maxHeight) {
          maxHeight = height[i];
        }
      }
      //extract part of the dendrogram based on input height-threshold
      for (int i = 0; i < zoomLevels; i++) {
        cutree_cdist(n, merge, height, (i + 1) * maxHeight / zoomLevels,
                     oneLabel);
        std::memcpy(labels + i * n, oneLabel, n * sizeof(int));
      }
      break;
    }
    //extract part of the dendrogram based on input number of clusters
    //cluster quantity refreshed by substraction by zoomNumber (linear change)
    case 1: {
      for (int i = 0; i < zoomLevels; i++) {
        cutree_k(n, merge, n - (i * zoomNumber), oneLabel);
        std::memcpy(labels + i * n, oneLabel, n * sizeof(int));
      }
      break;
    }
    //extract part of the dendrogram based on input number of clusters
    //cluster quantity refreshed by division by zoomNumber (exponential change)
    case 2: {
      int numclust = n;
      for (int i = 0; i < zoomLevels; i++) {
        cutree_k(n, merge, numclust, oneLabel);
        std::memcpy(labels + i * n, oneLabel, n * sizeof(int));
        numclust = static_cast<int>(numclust /= zoomNumber);
      }
      break;
    }
  }
  delete[] oneLabel;
}

extern "C" void clusterStrings(char *inputStringChar, int *lengthOfString,
                               double *distMat, double *height, int *merge,
                               int *labels, int nStrings, int zoomMode,
                               int zoomNumber, int maxIterations,
                               int zoomLevels, int calcDistMethod,
                               int calcScalingMethod, int bool_bit,
                               double *resultPoints, int type,
                               float *totalprogress, float *partialprogress) {
  // Split the long string into smaller strings
  // and put them in a vector
  clock_t start_time1 = clock();
  MatrixXd distMatMDS(nStrings, nStrings);

  // String is converted to bitstring instead of std::string
  // if boolBit is true and input only contains [0,1]
  if (bool_bit == 1) {
    //initialize parameter
    int substringlength = lengthOfString[0];
    std::cout << "clusterStrings start" << std::endl;
    std::vector<boost::dynamic_bitset<>> bitstringVector;

    //copy information from long string to vector of bitsets 
    for (int i = 0; i < nStrings; i++) {
      boost::dynamic_bitset<> currentbitset(substringlength);
      int startidx = i * substringlength; //find the correct pos in long string
      for (int j = 0; j < substringlength; j++) {
        //overwrite default zeros when finding '1'
        if (inputStringChar[startidx + j] == '1') {
          currentbitset[j] = 1;
        }
      }
      bitstringVector.push_back(currentbitset);
    }
    std::cout << "calculate distanceMatrix start" << std::endl;

    // Calculate distance matrix
    distMatMDS = distanceMatrix(bitstringVector, substringlength, totalprogress,
                                partialprogress);
    std::cout << "calculate distancematrix finished" << std::endl;
  } else { //arbitrary string input
    std::cout << "clusterStrings start" << std::endl;
    //convert inputString in Cpp string
    std::string inputString(inputStringChar);
    //Container for extracted strings
    std::vector<std::string> stringVector(nStrings);
    int startLength = 0;
    //extract strings from long string
    for (int i = 0; i < nStrings; i++) {
      std::string tempString =
          inputString.substr(startLength, lengthOfString[i]);
      std::cout << tempString << std::endl;
      stringVector[i] = tempString;
      startLength += lengthOfString[i];
    }
    std::cout << "calculate distanceMatrix start" << std::endl;

    // Calculate distance matrix
    distMatMDS =
        distanceMatrix(stringVector, type, totalprogress, partialprogress);
    std::cout << "calculate distancematrix finished" << std::endl;
  }

  MatrixXd resultMDS;  // Will save resulting configuration
  std::cout << "scaling start" << std::endl;
  // Choose scaling method based on user input
  switch (calcScalingMethod) {
    case 1:
      resultMDS = calculateMDSsmacof(distMatMDS, totalprogress, partialprogress,
                                     maxIterations);
      break;
    case 2:
      resultMDS = calculateMDSscikit(nStrings, distMatMDS, totalprogress,
                                     partialprogress);
      break;
    case 3:
      resultMDS = calculateMDSglimmer(nStrings, distMatMDS, totalprogress,
                                      partialprogress);
      break;
    default:
      printf("no valid scaling algorithm was chosen");
      break;
  }
  std::cout << "scaling finished" << std::endl;
  std::cout << "clustering start" << std::endl;
  // Overwrite points with the new configuration
  for (int i = 0; i < nStrings; i++) {
    for (int j = 0; j < 2; j++) {
      resultPoints[i * 2 + j] = resultMDS(i, j);
    }
  }

  // Do the clustering
  hclust_fast(nStrings, distMatMDS, calcDistMethod, merge, height,
              totalprogress, partialprogress);
  std::cout << "clustering finished" << std::endl;
  std::cout << "cutree start" << std::endl;
  clock_t start_time3 = clock();

  // For each zoomlevel calculate a labels assignment
  // based on chosen zoomMode
  int *oneLabel = new int[nStrings];
  switch (zoomMode) {
    case 0: {
      // Find maximum height
      double maxHeight = 0;

      for (int i = 0; i < nStrings - 1; i++) {
        if (height[i] > maxHeight) {
          maxHeight = height[i];
        }
      }
      //extract part of the dendrogram based on input height-threshold
      for (int i = 0; i < zoomLevels; i++) {
        cutree_cdist(nStrings, merge, height, (i + 1) * maxHeight / zoomLevels,
                     oneLabel);
        std::memcpy(labels + i * nStrings, oneLabel, nStrings * sizeof(int));
      }
      break;
    }
    //extract part of the dendrogram based on input number of clusters
    //cluster quantity refreshed by substraction by zoomNumber (linear change)
    case 1: {
      for (int i = 0; i < zoomLevels; i++) {
        cutree_k(nStrings, merge, nStrings - (i * zoomNumber), oneLabel);
        std::memcpy(labels + i * nStrings, oneLabel, nStrings * sizeof(int));
      }
      break;
    }
    //extract part of the dendrogram based on input number of clusters
    //cluster quantity refreshed by division by zoomNumber (exponential change)
    case 2: {
      int numclust = nStrings;
      for (int i = 0; i < zoomLevels; i++) {
        cutree_k(nStrings, merge, numclust, oneLabel);
        std::memcpy(labels + i * nStrings, oneLabel, nStrings * sizeof(int));
        numclust = static_cast<int>(numclust /= zoomNumber);
      }
      break;
    }
  }
  std::cout << "tree cut" << std::endl;
  delete[] oneLabel;
  clock_t start_time2 = clock();
  std::cout << "cutree needed "
            << static_cast<float>(start_time2 - start_time3) / (CLOCKS_PER_SEC)
            << "s for calculating clusterlabels\n";
  std::cout << "ClusterStrings needed "
            << static_cast<float>(start_time2 - start_time1) / (CLOCKS_PER_SEC)
            << "s in total\n";
}

extern "C" void clusterPoints(double *points, int dimension, double *distMat,
                              double *height, int *merge, int *labels,
                              int nPoints, int zoomMode, int zoomNumber,
                              int maxIterations, int zoomLevels,
                              int calcDistMethod, int calcScalingMethod,
                              bool isSpherical, float *totalprogress,
                              float *partialprogress) {
  // Calculate full distance matrix
  // Move points into matrix
  std::cout << "clusterPoints start" << std::endl;
  MatrixXd pointMatrix(nPoints, dimension);
  for (int i = 0; i < nPoints; i++) {
    for (int j = 0; j < dimension; j++) {
      pointMatrix(i, j) = points[i * dimension + j];
    }
  }

  std::cout << "pointmatrix initialized" << std::endl;
  // Calculate distance matrix
  std::cout << "calculate distancematrix start" << std::endl;
  MatrixXd distMatMDS =
      distanceMatrix(pointMatrix, isSpherical, totalprogress, partialprogress);
  std::cout << "calculate distancematrix finished" << std::endl;

  MatrixXd resultMDS;  // Will save resulting configuration
  std::cout << "scaling start" << std::endl;
  // Choose scaling method based on user input
  switch (calcScalingMethod) {
    case 1:
      resultMDS = calculateMDSsmacof(distMatMDS, totalprogress, partialprogress,
                                     maxIterations);
      break;
    case 2:
      resultMDS = calculateMDSscikit(nPoints, distMatMDS, totalprogress,
                                     partialprogress);
      break;
    case 3:
      resultMDS = calculateMDSglimmer(nPoints, distMatMDS, totalprogress,
                                      partialprogress);
      break;
    default:
      printf("no valid scaling algorithm was chosen");
      break;
  }

  std::cout << "scaling finished" << std::endl;

  // Overwrite points with the new configuration
  for (int i = 0; i < nPoints; i++) {
    for (int j = 0; j < 2; j++) {
      points[i * 2 + j] = resultMDS(i, j);
    }
  }

  // Do the clustering
  std::cout << "clustering start" << std::endl;
  hclust_fast(nPoints, distMatMDS, calcDistMethod, merge, height, totalprogress,
              partialprogress);
  std::cout << "clustering finished" << std::endl;
  std::cout << "cutree start" << std::endl;
  clock_t start_time3 = clock();
 
  // For each zoomlevel calculate a labels assignment
  // based on chosen zoomMode
  int *oneLabel = new int[nPoints];
  switch (zoomMode) {
    case 0: {
      double maxHeight = 0;

      // Find the maximum height
      for (int i = 0; i < nPoints - 1; i++) {
        if (height[i] > maxHeight) {
          maxHeight = height[i];
        }
      }
      //extract part of the dendrogram based on input height-threshold
      for (int i = 0; i < zoomLevels; i++) {
        cutree_cdist(nPoints, merge, height, (i + 1) * maxHeight / zoomLevels,
                     oneLabel);
        std::memcpy(labels + i * nPoints, oneLabel, nPoints * sizeof(int));
      }
      break;
    }
    //extract part of the dendrogram based on input number of clusters
    //cluster quantity refreshed by substraction by zoomNumber (linear change)
    case 1: {
      for (int i = 0; i < zoomLevels; i++) {
        cutree_k(nPoints, merge, nPoints - (i * zoomNumber), oneLabel);
        std::memcpy(labels + i * nPoints, oneLabel, nPoints * sizeof(int));
      }
      break;
    }
    //extract part of the dendrogram based on input number of clusters
    //cluster quantity refreshed by division by zoomNumber (exponential change)
    case 2: {
      int numclust = nPoints;
      for (int i = 0; i < zoomLevels; i++) {
        cutree_k(nPoints, merge, numclust, oneLabel);
        std::memcpy(labels + i * nPoints, oneLabel, nPoints * sizeof(int));
        numclust = static_cast<int>(numclust /= zoomNumber);
      }
      break;
    }
  }
  // end time measurement for cutree
  std::cout << "tree cut" << std::endl;
  clock_t start_time4 = clock();
  delete[] oneLabel;
  std::cout << "cutree needed "
            << static_cast<float>(start_time4 - start_time3) / (CLOCKS_PER_SEC)
            << "s for calculating clusterlabels\n";
  std::cout << "ClusterPoints needed "
            << static_cast<float>(start_time2 - start_time1) / (CLOCKS_PER_SEC)
            << "s in total\n";
}
