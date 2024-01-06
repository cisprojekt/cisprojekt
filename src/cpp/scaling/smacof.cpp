// Copyright [year] <Copyright Owner>
#include <emscripten.h>

#include <Eigen/Dense>
#include <cmath>
#include <iostream>
#include <map>
#include <random>

#include "./fastcluster.h"
#include "src/cpp/dv_main.h"

using Eigen::MatrixXd;

MatrixXd calculateWeights(MatrixXd distMat) {
  // TODO(Jonas): Set to zero if element does not exist in distMat
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
        V(i, j) =
            weights.row(i).sum() - weights(i, j);  // Not optimal but works
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
        B(i, i) = -B.row(i).sum() + B(i, j);  //  Not optimal but works
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

MatrixXd guttmanTransform(int n, MatrixXd B, MatrixXd Z, MatrixXd weights) {
  // TODO(Jonas): Implement Moore-Penrose inverse if there exists weight unequal
  // to one
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

MatrixXd calculateMDSsmacof(MatrixXd distMat, int maxIt, double eps, int dim) {
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

    // TODO(Jonas): Step 8: End while-loop if eps small enough
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
      points(i, j) = static_cast<int>(dis(gen));
    }
  }

  return points;
}
