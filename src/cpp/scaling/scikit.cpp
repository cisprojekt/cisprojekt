#include <float.h>
#include <math.h>
#include <stdbool.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>

#include <Eigen/Dense>
#include <iostream>

using Eigen::MatrixXd
    // full distance-matrix needed!

    int n = 0;

double scikit_mds_single(MatrixXd dissimilarities, double *x, double *x_inter,
                         int n_samples, bool init = false, bool metric = true,
                         int n_components = 2, int max_iter = 1000,
                         bool verbose = 0, double eps = 1e-5,
                         int random_state = 0, bool normalized_stress = false) {
  int m = n_samples * (n_samples - 1) / 2;
  srand(time(NULL));
  if (!init) {
    for (int it = 0; it < 2 * n_samples; it++) {
      x_inter[it] = drand48();
    }
  } else {
    x_inter[0] = 0.0;
    x_inter[1] = 0.0;
    x_inter[2] = 1.0;
    x_inter[3] = -1.0;
    x_inter[4] = -1.0;
    x_inter[5] = 1.0;
    x_inter[6] = 1.0;
    x_inter[7] = 1.0;
    x_inter[8] = -1.0;
    x_inter[9] = -1.0;
  }
  double old_stress = 1e15;
  double *disparities = new double[n_samples * n_samples];
  double *dis = new double[n_samples * n_samples];
  double stress = 0;
  // isotonic regression
  for (int it = 0; it < max_iter; it++) {
    for (int f = 0; f < n_samples; f++) {
      for (int g = 0; g < n_samples; g++) {
        dis[n_samples * f + g] =
            sqrt(pow(x_inter[2 * f] - x_inter[2 * g], 2) +
                 pow(x_inter[2 * f + 1] - x_inter[2 * g + 1], 2));
      }
    }
    if (metric) {
      for (int i = 0; i < n_samples; i++) {
        for (int i = 0; i < n_samples; j++) {
          disparities[i * n_samples + j] = dissimilarities(i, j);
        }
      }
    }
    /* non-metric case
    else {
      disparities_flat = ir.fit_transform(sim_flat_w aka dissimilarities, dis)
      disparities = dis.copy
      disparities[sim_flat != 0] = disparities_flat
      disparities *= sqrt(n_samples * n_samples-1)/2 / (disparities**2).sum() /
    2)
    }
    */
    double normalizer;
    for (int i = 0; i < n_samples * n_samples; i++) {
      stress += pow(dis[i] - disparities[i], 2);
    }
    stress *= 0.5;
    if (normalized_stress) {
      for (int i = 0; i < n_samples * n_samples; i++) {
        normalizer += pow(disparities[i], 2);
      }
      normalizer *= 0.5;
      stress = sqrt(stress / normalizer);
    }
    Eigen::MatrixXd B(n_samples, n_samples);
    Eigen::MatrixXd ratio(n_samples, n_samples);
    Eigen::MatrixXd X_m(2, n_samples);

    for (int h = 0; h < 2 * n_samples; h += 2) {
      X_m(0, h / 2) = x_inter[h];
      X_m(1, h / 2) = x_inter[h + 1];
    }
    for (int i = 0; i < n_samples * n_samples; i++) {
      if (dis[i] == 0) {
        dis[i] = 1e-5;
      }
    }
    for (int i = 0; i < n_samples; i++) {
      for (int j = 0; j < n_samples; j++) {
        ratio(i, j) = disparities[i * n_samples + j] / dis[i * n_samples + j];
        B(i, j) = -ratio(i, j);
      }
    }
    for (int i = 0; i < n_samples; i++) {
      double sum = 0;
      for (int r = 0; r < n_samples; r++) {
        sum += ratio(i, r);
      }
      B(i, i) += sum;
    }
    Eigen::MatrixXd X_c(2, n_samples);
    X_c = X_m;
    X_m = X_c * B;
    X_m = 1.0 / n_samples * X_m;
    Eigen::MatrixXd X_sq(2, n_samples);
    X_sq = (X_m.array()) * (X_m.array());
    Eigen::VectorXd interm(n_samples);
    for (int i = 0; i < n_samples; i++) {
      double sum = 0;
      for (int r = 0; r < 2; r++) {
        sum += (X_sq)(r, i);
      }
      interm(i) = sqrt(sum);
    }
    double discrepancy = interm.sum();
    if ((old_stress - stress / discrepancy) < eps) {
      break;
    }
    old_stress = stress / discrepancy;
    for (int e = 0; e < 2 * n_samples; e += 2) {
      x_inter[e] = X_m(0, e / 2);
      x_inter[e + 1] = X_m(1, e / 2);
    }
  }
  delete disparities;
  delete dis;
  return stress;
}
void scikit_mds_multi(MatrixXd dissimilarities, double *x, double *x_inter,
                      int n_iterations, int n_samples, bool init = false,
                      bool metric = true, int n_components = 2,
                      int max_iter = 1000, bool verbose = 0, double eps = 1e-5,
                      int random_state = 0, bool normalized_stress = false) {
  double min_stress = 1e18;
  double stress;
  for (int i = 0; i < n_iterations; i++) {
    stress = scikit_mds_single(dissimilarities, x, x_inter, n_samples, init,
                               metric, n_components, max_iter, verbose, eps,
                               random_state, normalized_stress);
    if (stress < min_stress) {
      for (int k = 0; k < 2 * n_samples; k++) {
        x[k] = x_inter[k];
      }
      min_stress = stress;
    }
  }
}
/*
void outputCSV(double *embedding) {
  // open the file
  FILE *fp = NULL;
  if ((fp = fopen("scikit_result.csv", "w")) == NULL) {
    printf("ERROR: Can't open points output file %s\n", "scikit_result.csv");
    exit(0);
  }

  // output header
  fprintf(fp, "X,Y\nDOUBLE,DOUBLE\n");

  // output data to file
  for (int i = 0; i < n; i++) {
    for (int j = 0; j < 2; j++) {
      fprintf(fp, "%f", embedding[2 * i + j]);
      if (j < 1)
        fprintf(fp, ",");
    }
    fprintf(fp, "\n");
  }

  // close the file
  fclose(fp);
}
*/
MatrixXd calculateMDSscikit(int n, MatrixXd distanceMatrix) {

  // distmat = delta
  MatrixXd XUpdated(n, 2);
  double *x_inter = new double[2 * n];
  // for (int g = 0; g < 2*n; g++) {
  // x_inter[g] = 0.1*g;
  //}
  double *x = new double[2 * n];
  int n_iterations = 2;
  bool init = false;
  bool metric = true;
  int n_samples = n;
  int n_components = 2;
  int max_iter = 100;
  bool verbose = 0;
  double eps = 1e-5;
  int random_state = 0;
  bool normalized_stress = false;

  scikit_mds_multi(distanceMatrix, x, x_inter, n_iterations, n_samples, init,
                   metric, n_components, max_iter, verbose, eps, random_state,
                   normalized_stress);
  for (int it_1; it_1 < 2 * n; it_1++) {
    XUpdated(it_1, 1) = x[2 * it_1];
    XUpdated(it_1, 2) = x[2 * it_1 + 1];
  }

  return XUpdated;
}
