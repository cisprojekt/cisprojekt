// Copyright [year] <Copyright Owner>
#include <float.h>
#include <math.h>
#include <stdbool.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>

#include <Eigen/Dense>
#include <iostream>

using Eigen::MatrixXd;

int n = 0;

double scikit_mds_single(const Eigen::MatrixXd &dissimilarities,
                         const Eigen::MatrixXd &x,
                         const Eigen::MatrixXd &x_inter, int n_samples,
                         int n_iterations, float *totalprogress,
                         float *partialprogress, bool init = false,
                         bool metric = true, int n_components = 2,
                         int max_iter = 1000, bool verbose = 0,
                         double eps = 1e-5, int random_state = 0,
                         bool normalized_stress = false) {
  int m = n_samples * (n_samples - 1) / 2;
  srand(time(NULL));
  if (!init) {
    for (int it = 0; it < n_samples; it++) {
      const_cast<MatrixXd &>(x_inter)(it, 0) = drand48();
      const_cast<MatrixXd &>(x_inter)(it, 1) = drand48();
    }
  } else {
    const_cast<MatrixXd &>(x_inter)(0, 0) = 0.0;
    const_cast<MatrixXd &>(x_inter)(0, 1) = 0.0;
    const_cast<MatrixXd &>(x_inter)(1, 0) = 1.0;
    const_cast<MatrixXd &>(x_inter)(1, 1) = -1.0;
    const_cast<MatrixXd &>(x_inter)(2, 0) = -1.0;
    const_cast<MatrixXd &>(x_inter)(2, 1) = 1.0;
    const_cast<MatrixXd &>(x_inter)(3, 0) = 1.0;
    const_cast<MatrixXd &>(x_inter)(3, 1) = 1.0;
    const_cast<MatrixXd &>(x_inter)(4, 0) = -1.0;
    const_cast<MatrixXd &>(x_inter)(4, 1) = -1.0;
  }
  double old_stress = 1e15;
  Eigen::MatrixXd dis(n_samples, n_samples);
  double stress = 0;
  float pStep = 1 / (n_iterations * max_iter);
  float tStep = 0.4 * pStep;
  for (int it = 0; it < max_iter; it++) {
    *totalprogress += tStep;
    *partialprogress += pStep;
    for (int f = 0; f < n_samples; f++) {
      for (int g = 0; g < n_samples; g++) {
        dis(f, g) = sqrt(pow(x_inter(f, 0) - x_inter(g, 0), 2) +
                         pow(x_inter(f, 1) - x_inter(g, 1), 2));
      }
    }

    double normalizer;
    for (int i = 0; i < n_samples; i++) {
      for (int j = 0; j < n_samples; j++) {
        stress += pow(dis(i, j) - dissimilarities(i, j), 2);
        if (dis(i, j) == 0) {
          dis(i, j) = 1e-5;
        }
      }
    }
    stress *= 0.5;
    if (normalized_stress) {
      for (int i = 0; i < n_samples; i++) {
        for (int j = 0; j < n_samples; j++) {
          normalizer += pow(dissimilarities(i, j), 2);
        }
      }
      normalizer *= 0.5;
      stress = sqrt(stress / normalizer);
    }
    Eigen::MatrixXd ratio(n_samples, n_samples);

    ratio.array() = -1.0 * (dissimilarities.array() / dis.array());

    for (int i = 0; i < n_samples; i++) {
      ratio(i, i) += -1.0 * (ratio.col(i).sum());
    }
    const_cast<MatrixXd &>(x_inter) = ratio * x_inter;
    const_cast<MatrixXd &>(x_inter).array() = 1.0 / n_samples * x_inter.array();
    Eigen::MatrixXd x_sq(n_samples, 2);
    x_sq = (x_inter.array()) * (x_inter.array());
    Eigen::VectorXd interm(n_samples);
    for (int i = 0; i < n_samples; i++) {
      interm(i) = sqrt(x_sq.row(i).sum());
    }
    double discrepancy = interm.sum();
    if ((old_stress - stress / discrepancy) < eps) {
      *partialprogress += pStep * (max_iter - it);
      *totalprogress += tStep * (max_iter - it);
      break;
    }
    old_stress = stress / discrepancy;
  }
  return stress;
}
void scikit_mds_multi(const Eigen::MatrixXd &dissimilarities,
                      const Eigen::MatrixXd &x, const Eigen::MatrixXd &x_inter,
                      int n_iterations, float *totalprogress,
                      float *partialprogress, int n_samples, bool init = false,
                      bool metric = true, int n_components = 2,
                      int max_iter = 1000, bool verbose = 0, double eps = 1e-5,
                      int random_state = 0, bool normalized_stress = false) {
  double min_stress = 1e18;
  double stress;
  *partialprogress = 0.0;
  for (int i = 0; i < n_iterations; i++) {
    stress = scikit_mds_single(dissimilarities, x, x_inter, n_samples,
                               n_iterations, totalprogress, partialprogress,
                               init, metric, n_components, max_iter, verbose,
                               eps, random_state, normalized_stress);
    if (stress < min_stress) {
      for (int k = 0; k < n_samples; k++) {
        const_cast<MatrixXd &>(x)(k, 0) = const_cast<MatrixXd &>(x_inter)(k, 0);
        const_cast<MatrixXd &>(x)(k, 1) = const_cast<MatrixXd &>(x_inter)(k, 1);
      }
      min_stress = stress;
    }
  }
}

MatrixXd calculateMDSscikit(int n, const MatrixXd &distanceMatrix,
                            float *totalprogress, float *partialprogress) {
  clock_t start_time1 = clock();
  MatrixXd x(n, 2);
  MatrixXd x_inter(n, 2);

  int n_iterations = 5;
  bool init = false;
  bool metric = true;
  int n_samples = n;
  int n_components = 2;
  int max_iter = 100;
  bool verbose = 0;
  double eps = 1e-5;
  int random_state = 0;
  bool normalized_stress = false;

  scikit_mds_multi(distanceMatrix, x, x_inter, n_iterations, totalprogress,
                   partialprogress, n_samples, init, metric, n_components,
                   max_iter, verbose, eps, random_state, normalized_stress);
  double *matrixpointer = x.data();
  double min_value = 1e100;
  double max_value = -1e100;
  double factor;
  for (int i = 0; i < 2 * n_samples; i++, matrixpointer++) {
    if (*matrixpointer < min_value) {
      min_value = *matrixpointer;
    }
    if (*matrixpointer > max_value) {
      max_value = *matrixpointer;
    }
  }

  if (max_value < -min_value) {
    factor = -min_value;
  } else {
    factor = max_value;
  }

  matrixpointer = x.data();

  for (int i = 0; i < 2 * n_samples; i++, matrixpointer++) {
    *matrixpointer /= factor;
  }
  clock_t start_time2 = clock();
  std::cout << "Scikit-MDS needed "
            << static_cast<float>(start_time2 - start_time1) / (CLOCKS_PER_SEC)
            << "s for scaling\n";
  return x;
}
