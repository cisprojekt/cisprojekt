// Copyright [year] <Copyright Owner>

#include "src/cpp/distmat/distmat.h"

#include <emscripten.h>
#include <time.h>

#include <Eigen/Dense>
#include <boost/dynamic_bitset.hpp>
#include <cmath>
#include <iostream>
#include <map>
#include <random>

#include "src/cpp/dv_main.h"
#include "src/cpp/external/hclust/fastcluster.h"

using Eigen::MatrixXd;

MatrixXd distanceMatrix(double *distMatFilled, int n) {
  MatrixXd distMat(n, n);
  for (int i = 0; i < n; i++) {
    for (int j = i + 1; j < n; j++) {
      int idx = i * (n - 1) + j - ((i + 1) * (i + 2)) / 2;
      distMat(i, j) = distMatFilled[idx];
      distMat(j, i) = distMatFilled[idx];
    }
    distMat(i, i) = 0;
  }

  return distMat;
}

MatrixXd distanceMatrix(MatrixXd points, bool isSperical) {
  int n = points.rows();
  MatrixXd distMat(n, n);
  for (int i = 0; i < n; i++) {
    for (int j = 0; j < n; j++) {
      // TODO(Jonas): Implement other distance functions
      if (isSperical) {
        distMat(i, j) =
            haversine(points(i, 0), points(i, 1), points(j, 0), points(j, 1));
      } else {
        distMat(i, j) = euclideanDistance(points.row(i), points.row(j));
      }
    }
  }

  return distMat;
}

MatrixXd distanceMatrix(std::vector<std::string> strings) {
  int n = strings.size();
  MatrixXd distMat(n, n);
  for (int i = 0; i < n; i++) {
    std::cout << "DistMat did row " << i << "from " << n << std::endl;
    for (int j = 0; j < n; j++) {
      // TODO(Jonas): Implement other distance functions
      distMat(i, j) = tanimotoDistance(strings[i], strings[j]);
    }
  }

  return distMat;
}

MatrixXd distanceMatrix(std::vector<boost::dynamic_bitset<>> bitstrings,
                        int bitset_size) {
  clock_t start_time1 = clock();
  int n = bitstrings.size();
  MatrixXd distMat(n, n);
  double *matrixpointer = distMat.data();
  /*
  boost::dynamic_bitset<> comparestring
  for (int i = 0; i < n*n; i++) {
  if (i % 1000000 == 0) {
    std::cout << "DistMat did " << i/1000000 << "M elements from " << n*n <<
  std::endl;
  }
  if (i % n == 0) {
    comparestring = bitstrings[i/n];
  }
  *matrixpointer = tanimotoDistanceBitwise(comparestring, bitstrings[i%n],
  bitset_size); matrixpointer++;
  }
  */
  for (int i = 0; i < n; i++) {
    boost::dynamic_bitset<> comparestring = bitstrings[i];
    std::vector<boost::dynamic_bitset<>>::iterator bitstringptr;
    for (bitstringptr = bitstrings.begin(); bitstringptr < bitstrings.end();
         bitstringptr++) {
      *matrixpointer =
          tanimotoDistanceBitwise(comparestring, *bitstringptr, bitset_size);
      matrixpointer++;
    }
  }
  /*
  *matrixpointer = tanimotoDistanceBitwise(comparestring, bitstrings[i%n],
  bitset_size); matrixpointer++;
  }
  */
  /*
    std::vector<boost::dynamic_bitset<>>::iterator bitstringptr;
      for (bitstringptr = bitstrings.begin(); bitstringptr < bitstrings.end();
    bitstringptr++) { *matrixpointer = tanimotoDistanceBitwise(comparestring,
    *bitstringptr, bitset_size); matrixpointer++;
      }
    }
  */
  clock_t start_time2 = clock();
  std::cout << "distanceMatrix_bitstring needed "
            << static_cast<float>(start_time2 - start_time1) / (CLOCKS_PER_SEC)
            << "s to calculate\n";
  return distMat;
}

double euclideanDistance(VectorXd pointA, VectorXd pointB) {
  return (pointA - pointB).norm();
}

double tanimotoDistanceBitwise(boost::dynamic_bitset<> fingerprintA,
                               boost::dynamic_bitset<> fingerprintB,
                               int bitset_size) {
  int molA = 0, molB = 0, molC = 0;
  boost::dynamic_bitset<> fingerprintC = fingerprintA & fingerprintB;
  // We assume both fingerprints have equal length
  molA = fingerprintA.count();
  molB = fingerprintB.count();
  molC = fingerprintC.count();

  double dist = 1 - (static_cast<double>(molC) / (molA + molB - molC));
  return dist;
}

double tanimotoDistance(std::string fingerprintA, std::string fingerprintB) {
  int molA = 0, molB = 0, molC = 0;
  // We assume both fingerprints have equal length
  for (std::string::size_type i = 0; i < fingerprintA.size(); i++) {
    if (fingerprintA[i] == '1') molA++;
    if (fingerprintB[i] == '1') molB++;
    if (fingerprintA[i] == '1' && fingerprintB[i] == '1') molC++;
  }

  double dist = 1 - (static_cast<double>(molC) / (molA + molB - molC));
  if (molA + molB - molC == 0) {
    dist = 0;
  }
  return dist;
}

extern "C" {
EMSCRIPTEN_KEEPALIVE
double calculateEuclideanDistance(double *vector1, double *vector2,
                                  int string_length) {
  double sumOfSquares = 0.0;
  for (size_t i = 0; i < string_length; i++) {
    double diff = vector2[i] - vector1[i];
    sumOfSquares += diff * diff;
  }

  double distance = std::sqrt(sumOfSquares);
  return distance;
}

EMSCRIPTEN_KEEPALIVE
double *calculateEuclideanDistanceMatrix(double *array, int num_points,
                                         int dimension) {
  double **distanceArray = new double *[num_points];

  for (size_t i = 0; i < num_points; ++i) {
    distanceArray[i] = new double[num_points];
  }
  for (size_t i = 0; i < num_points; i++) {
    for (size_t j = 0; j < i + 1; j++) {
      double distance = calculateEuclideanDistance(
          array + i * dimension, array + j * dimension, dimension);
      distanceArray[i][j] = distance;
      distanceArray[j][i] = distance;
    }
  }
  // flatten the array
  double *flatArray = new double[num_points * (num_points + 1) / 2];
  int index = 0;
  for (size_t i = 0; i < num_points; i++) {
    for (size_t j = 0; j < num_points; j++) {
      flatArray[index] = distanceArray[i][j];
      index++;
    }
  }
  // free memory
  for (size_t i = 0; i < num_points; ++i) {
    delete[] distanceArray[i];
  }
  delete[] distanceArray;

  return flatArray;
}

EMSCRIPTEN_KEEPALIVE
int calculateHammingDistance(char *str1, char *str2, int string_length) {
  int distance = 0;
  for (size_t i = 0; i < string_length; i++) {
    if (str1[i] != str2[i]) {
      distance++;
    }
  }

  return distance;
}

EMSCRIPTEN_KEEPALIVE
int *calculateHammingDistanceMatrix(char **array, int num_strings,
                                    int string_length) {
  int **distanceArray = new int *[num_strings];

  for (size_t i = 0; i < num_strings; ++i) {
    distanceArray[i] = new int[i + 1];
  }
  for (size_t i = 0; i < num_strings; i++) {
    for (size_t j = 0; j < i + 1; j++) {
      int distance =
          calculateHammingDistance(array[i], array[j], string_length);
      distanceArray[i][j] = distance;
    }
  }
  // flatten the array
  int *flatArray = new int[num_strings * (num_strings + 1) / 2];
  int index = 0;
  for (size_t i = 0; i < num_strings; i++) {
    for (size_t j = 0; j < i + 1; j++) {
      flatArray[index] = distanceArray[i][j];
      index++;
    }
  }
  // free memory
  for (size_t i = 0; i < num_strings; ++i) {
    delete[] distanceArray[i];
  }
  delete[] distanceArray;

  return flatArray;
}
}

double toRadians(double degree) { return degree * (M_PI / 180.0); }

double haversine(double lat1, double lon1, double lat2, double lon2) {
  double EarthRadiusKm = 6371.0;
  // Convert latitude and longitude from degrees to radians

  lat1 = toRadians(lat1);
  lon1 = toRadians(lon1);
  lat2 = toRadians(lat2);
  lon2 = toRadians(lon2);

  // Differences in coordinates
  double dlat = lat2 - lat1;
  double dlon = lon2 - lon1;

  // Haversine formula
  double a =
      std::sin(dlat / 2) * std::sin(dlat / 2) +
      std::cos(lat1) * std::cos(lat2) * std::sin(dlon / 2) * std::sin(dlon / 2);
  double c = 2 * std::atan2(sqrt(a), sqrt(1 - a));
  double distance = EarthRadiusKm * c;

  return distance;
}
