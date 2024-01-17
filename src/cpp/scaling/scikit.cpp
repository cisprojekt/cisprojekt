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
// full distance-matrix needed!

int n = 0;

double scikit_mds_single(Eigen::MatrixXd &dissimilarities, Eigen::MatrixXd &x, Eigen::MatrixXd &x_inter,
                         int n_samples, bool init = false, bool metric = true,
                         int n_components = 2, int max_iter = 1000,
                         bool verbose = 0, double eps = 1e-5,
                         int random_state = 0, bool normalized_stress = false) {
  int m = n_samples * (n_samples - 1) / 2;
  srand(time(NULL));
  if (!init) {
    for (int it = 0; it < n_samples; it++) {
      x_inter(it,0) = drand48();
      x_inter(it,1) = drand48();
    }
  } else {
    x_inter(0,0) = 0.0;
    x_inter(0,1) = 0.0;
    x_inter(1,0) = 1.0;
    x_inter(1,1) = -1.0;
    x_inter(2,0) = -1.0;
    x_inter(2,1) = 1.0;
    x_inter(3,0) = 1.0;
    x_inter(3,1) = 1.0;
    x_inter(4,0) = -1.0;
    x_inter(4,1) = -1.0;
  }
  double old_stress = 1e15;
  //Eigen::MatrixXd disparities(n_samples,n_samples);     //needed for non-metric case
  Eigen::MatrixXd dis(n_samples,n_samples);
  double stress = 0;
  // isotonic regression
  for (int it = 0; it < max_iter; it++) {
    for (int f = 0; f < n_samples; f++) {
      for (int g = 0; g < n_samples; g++) {
        dis(f, g) =
            sqrt(pow(x_inter(f,0) - x_inter(g,0), 2) +
                 pow(x_inter(f,1) - x_inter(g,1), 2));
      }
    }
    /*
    if (metric) {
          disparities(i, j) = dissimilarities(i, j);
        }
      }
    }
    //non-metric case
    else {
      disparities_flat = ir.fit_transform(sim_flat_w aka dissimilarities, dis)
      disparities = dis.copy
      disparities[sim_flat != 0] = disparities_flat
      disparities *= sqrt(n_samples * n_samples-1)/2 / (disparities**2).sum() /
    2)
    }
    */
    double normalizer;
    for (int i = 0; i < n_samples; i++) {
      for (int j = 0; j < n_samples; j++) {  
        stress += pow(dis(i,j) - dissimilarities(i,j), 2);
        if (dis(i,j) == 0) {
          dis(i,j) = 1e-5;
        }
      }
    }
    stress *= 0.5;
    if (normalized_stress) {
      for (int i = 0; i < n_samples; i++) {
        for (int j = 0; j < n_samples; j++) { 
          normalizer += pow(dissimilarities(i,j), 2);
        }
      }
      normalizer *= 0.5;
      stress = sqrt(stress / normalizer);
    }
    //Eigen::MatrixXd B(n_samples, n_samples);
    Eigen::MatrixXd ratio(n_samples, n_samples);

    ratio.array() = -1.0*(dissimilarities.array() / dis.array());
    //B.array() = -ratio.array();
    
    for (int i = 0; i < n_samples; i++) {
      ratio(i,i) += -1.0*(ratio.col(i).sum());
      //B(i, i) += sum;
    }
    //Eigen::MatrixXd X_c(2, n_samples);
    //X_c = x_inter;
    x_inter = ratio * x_inter;
    x_inter.array() = 1.0 / n_samples * x_inter.array();
    Eigen::MatrixXd x_sq(n_samples, 2);
    x_sq = (x_inter.array()) * (x_inter.array());
    Eigen::VectorXd interm(n_samples);
    for (int i = 0; i < n_samples; i++) {
      interm(i) = sqrt(x_sq.row(i).sum());
    }
    double discrepancy = interm.sum();
    if ((old_stress - stress / discrepancy) < eps) {
      break;
    }
    old_stress = stress / discrepancy;
  }
  return stress;
}
void scikit_mds_multi(Eigen::MatrixXd &dissimilarities, Eigen::MatrixXd &x, Eigen::MatrixXd &x_inter,
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
      for (int k = 0; k < n_samples; k++) {
        x(k,0) = x_inter(k,0);
        x(k,1) = x_inter(k,1);
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
MatrixXd calculateMDSscikit(int n, MatrixXd &distanceMatrix) {
  // distmat = delta
  MatrixXd x(n, 2);
  MatrixXd x_inter(n, 2);
  // for (int g = 0; g < 2*n; g++) {
  // x_inter[g] = 0.1*g;
  //}
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

  return x;
}