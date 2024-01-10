#ifndef SRC_CPP_CLUSTERING_H_
#define SRC_CPP_CLUSTERING_H_

// Copyright [year] <Copyright Owner>

// clang-format off

/**
 *   ____ _    _   _ ____ _____ _____ ____  ___ _   _  ____ 
 *  / ___| |  | | | / ___|_   _| ____|  _ \|_ _| \ | |/ ___|
 * | |   | |  | | | \___ \ | | |  _| | |_) || ||  \| | |  _ 
 * | |___| |__| |_| |___) || | | |___|  _ < | || |\  | |_| |
 *  \____|_____\___/|____/ |_| |_____|_| \_\___|_| \_|\____|
 *                                                          
 */

// clang-format on

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

#include "src/cpp/distmat/distmat.h"
#include "src/cpp/external/hclust/fastcluster.h"
#include "src/cpp/scaling/scaling.h"

using Eigen::MatrixXd;
using Eigen::VectorXd;

extern "C" void clusterStrings(char *inputStringChar, double *lengthOfString,
                               double *distMat, double *height, int *merge,
                               int *labels, int nStrings, int maxIterations,
                               int zoomLevels, int calcDistMethod,
                               int calcScalingMethod, double *resultPoints);

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
                              int calcDistMethod, int calcScalingMethod,
                              bool isSpherical);

#endif  // SRC_CPP_CLUSTERING_H_
