#include <Eigen/Dense>
#include <cmath>
#include <emscripten.h>
#include <iostream>
#include <map>
#include <random>

#include "clustering.h"
#include "fastcluster.h"

using namespace Eigen;

MatrixXd calculateWeights(MatrixXd distMat) {

  // TODO: Set to zero if element does not exist in distMat
  MatrixXd weights(distMat.rows(), distMat.cols());
  for (int i = 0; i < weights.rows(); i++) {
    for (int j = 0; j < weights.cols(); j++) {
      weights(i, j) = 1;
    }
  }

  return weights;
}

MatrixXd calculateV(MatrixXd weights) {
  MatrixXd V(weights.rows(), weights.cols());
  for (int i = 0; i < V.rows(); i++) {
    for (int j = 0; j < V.cols(); j++) {
      if (i == j) {
        V(i, j) = weights.row(i).sum() - weights(i, j); // Not optimal but works
      } else {
        V(i, j) = -weights(i, j);
      }
    }
  }

  return V;
}

MatrixXd calculateRandomZ(int n, int m) {

  // Create pseudo-random double values
  std::random_device rd;
  std::mt19937 gen(rd());
  std::uniform_real_distribution<double> dis(-1.0, 1.0);

  MatrixXd Z(n, m);
  for (int i = 0; i < n; i++) {
    for (int j = 0; j < m; j++) {
      Z(i, j) = dis(gen);
    }
  }

  return Z;
}

MatrixXd calculateB(MatrixXd Z, MatrixXd weights, MatrixXd distMat) {
  MatrixXd D = distanceMatrix(Z);
  MatrixXd B = D;

  // Calculate non-diagonal elements first
  for (int i = 0; i < B.rows(); i++) {
    for (int j = 0; j < B.cols(); j++) {
      if (i != j) {
        if (D(i, j) != 0) {
          B(i, j) = -(weights(i, j) * distMat(i, j)) / D(i, j);
        } else {
          B(i, j) = 0;
        }
      }
    }
  }

  // Now calculate diagonal elements
  for (int i = 0; i < B.rows(); i++) {
    for (int j = 0; j < B.cols(); j++) {
      if (i == j) {
        B(i, i) = -B.row(i).sum() + B(i, j); // Not optimal but works
      }
    }
  }

  return B;
}

double calculateConst(MatrixXd weights, MatrixXd distMat) {
  double term1 = 0;
  for (int i = 0; i < weights.rows(); i++) {
    for (int j = i + 1; j < weights.cols(); j++) {
      term1 += weights(i, j) * pow(distMat(i, j), 2);
    }
  }

  return term1;
}

double stressFunction(MatrixXd X, MatrixXd V, MatrixXd Z, MatrixXd B,
                      MatrixXd weights, MatrixXd distMat) {
  double term1 = calculateConst(weights, distMat);
  double term2 = (X.transpose() * V * X).trace();
  double term3 = -2 * (X.transpose() * B * X).trace();

  double stress = term1 + term2 + term3;

  return stress;
}

MatrixXd distanceMatrix(MatrixXd points) {
  int n = points.rows();
  MatrixXd distMat(n, n);
  for (int i = 0; i < n; i++) {
    for (int j = 0; j < n; j++) {

      // TODO: Implement other distance functions
      distMat(i, j) = euclideanDistance(points.row(i), points.row(j));
    }
  }

  return distMat;
}

double euclideanDistance(VectorXd pointA, VectorXd pointB) {
  return (pointA - pointB).norm();
}

MatrixXd guttmanTransform(int n, MatrixXd B, MatrixXd Z, MatrixXd weights) {
  // TODO: Implement Moore-Penrose inverse if there exists weight unequal to one
  bool weightsOne = true;
  for (int i = 0; i < weights.rows(); i++) {
    for (int j = 0; j < weights.cols(); j++) {
      if (weights(i, j) != 1) {
        weightsOne = false;
        break;
      }
    }
  }
  MatrixXd XUpdated = (1.0 / n) * (B.matrix() * Z.matrix());

  return XUpdated;
}

MatrixXd calculateMDS(MatrixXd distMat, int maxIt, double eps, int dim) {

  // Counter for iterations
  int k = 0;

  // Create weight matrix
  MatrixXd weights = calculateWeights(distMat);

  // Step 1: Set X_0 = Z with random start configuration
  MatrixXd Z = calculateRandomZ(distMat.rows(), dim);
  MatrixXd X = Z;
  MatrixXd XUpdated;

  // Step 2: Compute initial stress
  MatrixXd V = calculateV(weights);
  MatrixXd B = calculateB(Z, weights, distMat);
  double stress = stressFunction(X, V, X, B, weights, distMat);

  // Step 3: While-loop, stop if maximal number of iterations is reached
  while (k < maxIt) {

    // Step 4: Increase iteration counter
    k++;

    // Step 5: Compute Guttman transformation
    B = calculateB(Z, weights, distMat);
    XUpdated = guttmanTransform(B.rows(), B, Z, weights);

    // Step 6: Compute stress of updated configuration
    double newStress = stressFunction(XUpdated, V, Z, B, weights, distMat);

    // Step 7: Update Z
    Z = XUpdated;

    // TODO: Step 8: End while-loop if eps small enough
  }

  return XUpdated;
}

MatrixXd createRandomPoints(int n, int m) {
  std::random_device rd;
  std::mt19937 gen(rd());
  std::uniform_real_distribution<> dis(0, 500);

  MatrixXd points(n, m);
  for (int i = 0; i < n; i++) {
    for (int j = 0; j < m; j++) {
      points(i, j) = (int)dis(gen);
    }
  }

  return points;
}

EMSCRIPTEN_KEEPALIVE
extern "C" void clusterPoints(double *points, int dimension, double *distMat,
                              double *height, int *merge, int *labels,
                              int nPoints, int maxIterations, int zoomLevels, int calcDistMethod) {
  if(calcDistMethod == 1){

  
    // Move points into matrix
    MatrixXd pointMatrix(nPoints, dimension);
    for (int i = 0; i < nPoints; i++) {
      for (int j = 0; j < dimension; j++) {
        pointMatrix(i, j) = points[i * dimension + j];
      }
    }

    // Calculate distance matrix and apply SMACOF algorithm for MDS
    MatrixXd distMatMDS = distanceMatrix(pointMatrix);
    MatrixXd resultMDS = calculateMDS(distMatMDS, maxIterations);

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
  }
  else{
    double* distMatMDS = calculateEuclideanDistanceMatrix(points, nPoints, dimension);
  }


  // Do the clustering
  hclust_fast(nPoints, distMat, HCLUST_METHOD_COMPLETE, merge, height);

  // Find maximum distance in order to create good cuts of dendrogram
  // TODO: Check if its always last element
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

extern "C" {
    EMSCRIPTEN_KEEPALIVE
    double calculateEuclideanDistance(double* vector1, double* vector2, int string_length) {
        double sumOfSquares = 0.0;
        for (size_t i = 0; i < string_length; i++) {
            double diff = vector2[i] - vector1[i];
            sumOfSquares += diff * diff;
        }

        double distance = std::sqrt(sumOfSquares);
        return distance;
    }

    EMSCRIPTEN_KEEPALIVE
    double* calculateEuclideanDistanceMatrix(double* array, int num_points, int dimension) {

        double** distanceArray = new double*[num_points];

        for (size_t i = 0; i < num_points; ++i) {
            distanceArray[i] = new double[num_points];
        }
        for (size_t i = 0; i < num_points; i++) {
            for (size_t j = 0; j < i+1; j++) {
                double distance = calculateEuclideanDistance(array+i*dimension,
                array+j*dimension, dimension);
                distanceArray[i][j] = distance;
                distanceArray[j][i] = distance;
            }
        }
        // flatten the array
        double* flatArray = new double[num_points * (num_points + 1) / 2];
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
    int calculateHammingDistance(char* str1, char* str2, int string_length) {

        int distance = 0;
        for (size_t i = 0; i < string_length; i++) {
            if (str1[i] != str2[i]) {
                distance++;
            }
        }

        return distance;
    }


    EMSCRIPTEN_KEEPALIVE
    int* calculateHammingDistanceMatrix(char** array, int num_strings, int string_length) {

        int** distanceArray = new int*[num_strings];

        for (size_t i = 0; i < num_strings; ++i) {
            distanceArray[i] = new int[i + 1];
        }
        for (size_t i = 0; i < num_strings; i++) {
            for (size_t j = 0; j < i+1; j++) {
                int distance = calculateHammingDistance(array[i], array[j], string_length);
                distanceArray[i][j] = distance;
            }
        }
        // flatten the array
        int* flatArray = new int[num_strings * (num_strings + 1) / 2];
        int index = 0;
        for (size_t i = 0; i < num_strings; i++) {
            for (size_t j = 0; j < i+1; j++) {
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
