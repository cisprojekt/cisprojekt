#ifndef SRC_CPP_DV_MAIN_H_
#define SRC_CPP_DV_MAIN_H_

// Copyright [2024] <cisprojekt>

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

#include "src/cpp/distmat/distmat.h"
#include "src/cpp/external/hclust/fastcluster.h"
#include "src/cpp/scaling/scaling.h"

using Eigen::MatrixXd;
using Eigen::VectorXd;

/**
 * @brief Function for clustering using custom distance function (distmat
 * already filled)
 * @param distMat Pre-filled distance matrix
 * @param height Cluster distance for each step
 * @param merge Encoded dendrogram
 * @param labels Label assignment for clusters
 * @param n Number of entries
 * @param zoomMode Way of cutting the dendrogram 0 = equidistant, 1 = relative
 * number, 2 = fixed number
 * @param zoomNumber Specifies how fine-grained the zoom-differences will be
 * @param maxIterations Maximum number of iterations
 * @param zoomLevels Number of zoomlevels for the d3js plot
 * @param calcDistMethod Distance calculation method
 * @param resultPoints Resulting points after MDS
 * @param calcScalingMethod Scaling method
 * @param totalprogress progress tracker for calculation over all tasks
 * @param partialprogress progress tracker calculation over recent task
 */
extern "C" void clusterCustom(double *distMat, double *height, int *merge,
                              int *labels, int n, int zoomMode, int zoomNumber,
                              int maxIterations, int zoomLevels,
                              int calcDistMethod, double *resultPoint,
                              int calcScalingMethod, float *totalprogress,
                              float *partialprogress);
/**
 * @brief Function for clustering strings, takes one large string as parameter
 * and splits it into smaller parts
 * @param inputStringChar One long concatenated string
 * @param lengthOfString Array where the i-th entry is the length of the i-th
 * string
 * @param distMat Distance matrix for the points
 * @param height Cluster distance for each step
 * @param merge Encoded dendrogram
 * @param labels Label assignment for clusters
 * @param nStrings Number of strings
 * @param zoomMode Way of cutting the dendrogram 0 = equidistant, 1 = relative
 * number, 2 = fixed number
 * @param zoomNumber Specifies how fine-grained the zoom-differences will be
 * @param maxIterations Maximum number of iterations
 * @param zoomLevels Number of zoomlevels for the d3js plot
 * @param calcDistMethod Distance calculation method
 * @param calcScalingMethod Scaling method
 * @param bool_bit 1 = string is bitstring, 0 = normal string
 * @param resultPoints Resulting points after MDS
 * @param type 0 = tanimoto, 1 = edit-distance
 * @param totalprogress progress tracker for calculation over all tasks
 * @param partialprogress progress tracker calculation over recent task
 */
extern "C" void clusterStrings(char *inputStringChar, int *lengthOfString,
                               double *distMat, double *height, int *merge,
                               int *labels, int nStrings, int zoomMode,
                               int zoomNumber, int maxIterations,
                               int zoomLevels, int calcDistMethod,
                               int calcScalingMethod, int bool_bit,
                               double *resultPoints, int type,
                               float *totalprogress, float *partialprogress);

/**
 * @brief Function for clustering points, either euclidean or earth
 * @param points The points to cluster
 * @param dimension Dimension of the input points
 * @param distMat Distance matrix for the points
 * @param height Cluster distance for each step
 * @param merge Encoded dendrogram
 * @param labels Label assignment for clusters
 * @param nPoints Number of points
 * @param zoomMode Way of cutting the dendrogram 0 = equidistant, 1 = relative
 * number, 2 = fixed number
 * @param zoomNumber Specifies how fine-grained the zoom-differences will be
 * @param maxIterations Maximum number of iterations
 * @param zoomLevels Number of zoomlevels for the d3js plot
 * @param calcDistMethod Distance calculation method
 * @param calcScalingMethod Scaling method
 * @param isSpherical 0 = euclidean, 1 = earth-distance
 * @param totalprogress progress tracker for calculation over all tasks
 * @param partialprogress progress tracker calculation over recent task
 */
extern "C" void clusterPoints(double *points, int dimension, double *distMat,
                              double *height, int *merge, int *labels,
                              int nPoints, int zoomMode, int zoomNumber,
                              int maxIterations, int zoomLevels,
                              int calcDistMethod, int calcScalingMethod,
                              bool isSpherical, float *totalprogress,
                              float *partialprogress);

#endif  // SRC_CPP_DV_MAIN_H_
