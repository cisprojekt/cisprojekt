#ifndef SRC_CPP_DV_MAIN_H_
#define SRC_CPP_DV_MAIN_H_

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

#include <float.h>
#include <math.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>

#include <Eigen/Dense>
#include <boost/dynamic_bitset.hpp>
#include <cmath>
#include <iostream>
#include <map>
#include <random>

#include "distmat/distmat.h"
#include "external/hclust/fastcluster.h"
#include "scaling/scaling.h"

using Eigen::MatrixXd;
using Eigen::VectorXd;

extern "C" void clusterCustom(double *distMat, double *height, int *merge,
                              int *labels, int n, int maxIterations,
                              int zoomLevels, int calcDistMethod,
                              double *resultPoint, int calcScalingMethod);

extern "C" void clusterStrings(char *inputStringChar, int *lengthOfString,
                               double *distMat, double *height, int *merge,
                               int *labels, int nStrings, int maxIterations,
                               int zoomLevels, int calcDistMethod,
                               int calcScalingMethod, int bool_bit,
                               double *resultPoints, int type);

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
 * @param calcDistMethod Distance calculation method
 * @param calcScalingMethod Scaling method
 * @param bool_bit
 * @param resultPoints Resulting points after multidimensional scaling
 * @param type Type of distance calculation 0 = tanimoto, 1 = editdistance
 */
extern "C" void clusterPoints(double *points, int dimension, double *distMat,
                              double *height, int *merge, int *labels,
                              int nPoints, int maxIterations, int zoomLevels,
                              int calcDistMethod, int calcScalingMethod,
                              bool isSpherical);

#endif  // SRC_CPP_DV_MAIN_H_
