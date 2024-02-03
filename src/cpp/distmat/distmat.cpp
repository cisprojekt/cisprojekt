// Copyright [year] <Copyright Owner>
#include "src/cpp/distmat/distmat.h"

#include <time.h>

#include <Eigen/Dense>
#include <algorithm>
#include <boost/dynamic_bitset.hpp>
#include <cmath>
#include <iostream>
#include <map>
#include <random>

#include "src/cpp/dv_main.h"
#include "src/cpp/external/hclust/fastcluster.h"

using Eigen::MatrixXd;

MatrixXd distanceMatrix(double *distMatFilled, int n,
                        float *totalprogress, float *partialprogress) {
  MatrixXd distMat(n, n);
  *partialprogress = 0.0;
  float tStep = 1/n*0.35;
  float pStep = 1/n;
  for (int i = 0; i < n; i++) {
  *totalprogress += tStep;
  *partialprogress += pStep;
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

MatrixXd distanceMatrix(MatrixXd points, bool isSperical,
                        float *totalprogress, float *partialprogress) {
  int n = points.rows();
  MatrixXd distMat(n, n);
  *partialprogress = 0.0;
  float tStep = 1/n*0.35;
  float pStep = 1/n;
  for (int i = 0; i < n; i++) {
  *totalprogress += tStep;
  *partialprogress += pStep;
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

MatrixXd distanceMatrix(std::vector<std::string> strings, int type,
                        float *totalprogress, float *partialprogress) {
  int n = strings.size();
  MatrixXd distMat(n, n);
  *partialprogress = 0.0;
  float tStep = 1/n*0.35;
  float pStep = 1/n;
  for (int i = 0; i < n; i++) {
    *totalprogress += tStep;
    *partialprogress += pStep;
    std::cout << "DistMat did row " << i << "from " << n << std::endl;
    for (int j = 0; j < n; j++) {
      // TODO(Jonas): Implement other distance functions
      if (type == 0) {
        distMat(i, j) = tanimotoDistance(strings[i], strings[j]);
      } else if (type == 1) {
        distMat(i, j) = editdistance(strings[i], strings[j]);
      }
    }
  }

  return distMat;
}

MatrixXd distanceMatrix(std::vector<boost::dynamic_bitset<>> bitstrings,
                        int bitset_size,
                        float *totalprogress, float *partialprogress) {
  clock_t start_time1 = clock();
  int n = bitstrings.size();
  MatrixXd distMat(n, n);
  double *matrixpointer = distMat.data();
  *partialprogress = 0.0;
  float tStep = 1/n*0.35;
  float pStep = 1/n;
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
    *totalprogress += tStep;
    *partialprogress += pStep;
    boost::dynamic_bitset<> comparestring = bitstrings[i];
    std::vector<boost::dynamic_bitset<>>::iterator bitstringptr;
    for (bitstringptr = bitstrings.begin(); bitstringptr < bitstrings.end();
         bitstringptr++) {
      *matrixpointer = tanimotoDistanceBitwise(comparestring, *bitstringptr,
                                               bitset_size);
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

  double distance = 1 - (static_cast<double>(molC) / (molA + molB - molC));
  return distance;
}

double tanimotoDistance(std::string fingerprintA, std::string fingerprintB) {
  int molA = 0, molB = 0, molC = 0;
  // We assume both fingerprints have equal length
  for (std::string::size_type i = 0; i < fingerprintA.size(); i++) {
    if (fingerprintA[i] == '1') molA++;
    if (fingerprintB[i] == '1') molB++;
    if (fingerprintA[i] == '1' && fingerprintB[i] == '1') molC++;
  }

  double distance = 1 - (static_cast<double>(molC) / (molA + molB - molC));
  if (molA + molB - molC == 0) {
    distance = 0;
  }
  return distance;
}

int editdistance(std::string seq1, std::string seq2) {
  int len_seq1 = seq1.length() + 1;
  int len_seq2 = seq2.length() + 1;

  // Create a matrix to store the edit distances between substrings
  std::vector<std::vector<int>> matrix(len_seq1, std::vector<int>(len_seq2, 0));

  // Initialize the matrix
  for (int i = 0; i < len_seq1; ++i) {
    matrix[i][0] = i;
  }
  for (int j = 0; j < len_seq2; ++j) {
    matrix[0][j] = j;
  }

  // Fill in the matrix based on the edit distances
  for (int i = 1; i < len_seq1; ++i) {
    for (int j = 1; j < len_seq2; ++j) {
      int cost = (seq1[i - 1] == seq2[j - 1]) ? 0 : 1;
      matrix[i][j] = std::min({
          matrix[i - 1][j] + 1,        // Deletion
          matrix[i][j - 1] + 1,        // Insertion
          matrix[i - 1][j - 1] + cost  // Substitution
      });
    }
  }

  // The bottom-right cell of the matrix contains the Levenshtein distance
  return matrix[len_seq1 - 1][len_seq2 - 1];
}

int hammingDistance(char *str1, char *str2, int string_length) {
  int distance = 0;
  for (size_t i = 0; i < string_length; i++) {
    if (str1[i] != str2[i]) {
      distance++;
    }
  }

  return distance;
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
