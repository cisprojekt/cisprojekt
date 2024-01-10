// Copyright [year] <Copyright Owner>
#include <emscripten.h>

#include <Eigen/Dense>
#include <cmath>
#include <iostream>
#include <map>
#include <random>

#include "src/cpp/dv_main.h"
#include "src/cpp/external/hclust/fastcluster.h"

using Eigen::MatrixXd;

MatrixXd distanceMatrix(MatrixXd points) {
  int n = points.rows();
  MatrixXd distMat(n, n);
  for (int i = 0; i < n; i++) {
    for (int j = 0; j < n; j++) {
      // TODO(Jonas): Implement other distance functions
      distMat(i, j) = euclideanDistance(points.row(i), points.row(j));
    }
  }

  return distMat;
}

MatrixXd distanceMatrix(std::vector<std::string> strings) {
  int n = strings.size();
  MatrixXd distMat(n, n);
  for (int i = 0; i < n; i++) {
    for (int j = 0; j < n; j++) {
      // TODO(Jonas): Implement other distance functions
      distMat(i, j) = tanimotoDistance(strings[i], strings[j]);
    }
  }

  return distMat;
}

double euclideanDistance(VectorXd pointA, VectorXd pointB) {
  return (pointA - pointB).norm();
}

double tanimotoDistance(std::string fingerprintA, std::string fingerprintB) {
  int molA = 0, molB = 0, molC = 0;
  // We assume both fingerprints have equal length
  for (std::string::size_type i = 0; i < fingerprintA.size(); i++) {
    if (fingerprintA[i] == '1')
      molA++;
    if (fingerprintB[i] == '1')
      molB++;
    if (fingerprintA[i] == '1' && fingerprintB[i] == '1')
      molC++;
  }

  double dist = 1 - (static_cast<double>(molC) / (molA + molB - molC));
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
