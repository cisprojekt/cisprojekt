#ifndef SRC_CPP_DV_MAIN_H_
#define SRC_CPP_DV_MAIN_H_

// Copyright [year] <Copyright Owner>

#include <emscripten.h>
#include <float.h>
#include <math.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>

#include <Eigen/Dense>
#include <cmath>
#include <iostream>
#include <map>
#include <random>

#include "./clustering/fastcluster.h"
#include "./distmat/distmat.h"
#include "./scaling/scaling.h"

using Eigen::MatrixXd;
using Eigen::VectorXd;

extern "C" void clusterStrings(char *inputStringChar, double *lengthOfString,
                               double *distMat, double *height, int *merge,
                               int *labels, int nStrings, int maxIterations,
                               int zoomLevels, int calcDistMethod,
                               double *resultPoints);

/**
 * @brief Webassembly function, will apply multidimensional scaling and
 * clustering for given points
 * @param points The points to cluster
 * @param dimension Dimension of the input points
 * @param distMat Distance matrix for the points
 * @param height Cluster distance for each step
 * @param merge Encoded dendrogram
 * @param labels Label assignment for clusters
 * @param nPoints Number of points
 * @param maxIterations Maximum number of iterations
 * @param zoomLevels Number of zoomlevels for the d3js plot
 */
extern "C" void clusterPoints(double *points, int dimension, double *distMat,
                              double *height, int *merge, int *labels,
                              int nPoints, int maxIterations, int zoomLevels,
                              int calcDistMethod);

#endif  // SRC_CPP_DV_MAIN_H_