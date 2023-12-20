#include <Eigen/Dense>
#include <cmath>
#include <iostream>
#include <random>

using namespace Eigen;

/**
 *  ____  __  __    _    ____ ___  _____    ___      ____ _    _   _ ____ _____ _____ ____  ___ _   _  ____ 
 * / ___||  \/  |  / \  / ___/ _ \|  ___|  ( _ )    / ___| |  | | | / ___|_   _| ____|  _ \|_ _| \ | |/ ___|
 * \___ \| |\/| | / _ \| |  | | | | |_     / _ \/\ | |   | |  | | | \___ \ | | |  _| | |_) || ||  \| | |  _ 
 *  ___) | |  | |/ ___ \ |__| |_| |  _|   | (_>  < | |___| |__| |_| |___) || | | |___|  _ < | || |\  | |_| |
 * |____/|_|  |_/_/   \_\____\___/|_|      \___/\/  \____|_____\___/|____/ |_| |_____|_| \_\___|_| \_|\____|                                                                                                         
 *
 * Implementation of the SMACOF-Algorithm for MDS as it is described in
 * [1] Modern Multidimensional Scaling. (2005). In Springer Series in
 * Statistics. Springer New York. https://doi.org/10.1007/0-387-28981-x
 */

/**
 * @brief Calculate weights matrix, entry is 1 if (dis)similarity is present,
 * else 0
 * @param distMat Distance matrix of original points
 * @return Weight matrix
 */
MatrixXd calculateWeights(MatrixXd distMat);

/**
 * @brief Calculate the V matrix according to e.q. (8.18)
 * @param weights The weight matrix
 * @return Matrix V
 */
MatrixXd calculateV(MatrixXd weights);

/**
 * @brief Calculate a random configuration matrix with values between -1 and 1
 * @param n Number of rows
 * @param m Number of columns
 * @return Z Matrix
 */
MatrixXd calculateRandomZ(int n, int m);

/**
 * @brief Calculate the B matrix according to e.q. (8.24)
 * @param Z The Z Matrix
 * @param weights The weight matrix
 * @return B The B matrix
 */
MatrixXd calculateB(MatrixXd Z, MatrixXd weights, MatrixXd distMat);

/**
 * @brief Calculates the first constant term of stress according to e.q. (8.15)
 * @param weights The weight matrix
 * @param distMat The distance matrix
 * @return term1 The first term of stress
 */
double calculateConst(MatrixXd weights, MatrixXd distMat);

/**
 * @brief Calculates the stress for a given configuration
 * @param X Configuration
 * @param Z The Z matrix
 * @param B The B matrix
 * @param weights The weight matrix
 * @param distMat The original distance matrix
 * @return stress Stress for given configuration
 */
double stressFunction(MatrixXd X, MatrixXd Z, MatrixXd B, MatrixXd weights,
                      MatrixXd distMat);

/**
 * @brief Calculate a square distance matrix for points
 * @param points Points in Euclidean space
 * @return distMat Distance Matrix
 */
MatrixXd distanceMatrix(MatrixXd points);

/**
 * @brief Calculate Euclidean distance between two points
 * @param pointA First point
 * @param pointB Second point
 * @return dist Euclidean distance between two points
 */
double euclideanDistance(VectorXd pointA, VectorXd pointB);

/**
 * @brief Apply Guttman transformation according to e.q. (8.28, 8.29)
 * @param n Number of points
 * @param B The B matrix
 * @param Z The Z matrix
 * @param weights The weights matrix
 * @return XUpdated Updated configuration after Guttman transformation
 */
MatrixXd guttmanTransform(int n, MatrixXd B, MatrixXd Z, MatrixXd weights);

/**
 * @brief Applies multidimensional scaling with SMACOF algorithm
 * @param distMat Original distance matrix
 * @param maxIt Maximum number of iterations
 * @param eps Cutoff for differences between new and old stress values
 * @param dim Dimensions to scale the data to
 * @return XUpdated Final configuration
 */
MatrixXd calculateMDS(MatrixXd distMat, int maxIt = 50, double eps = 10e-6,
                      int dim = 2);

/**
 * @brief Created n random m dimensional points
 * @param n Number of points
 * @param m Number of dimensions
 * @return points Points in matrix
 */
MatrixXd createRandomPoints(int n, int m);

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
                              int nPoints, int maxIterations, int zoomLevels, int calcDistMethod);

extern "C" {
    double calculateEuclideanDistance(double* vector1, double* vector2, int string_length);

    double* calculateEuclideanDistanceMatrix(double* array, int num_points, int dimension);

    int calculateHammingDistance(char* str1, char* str2, int string_length);

    int* calculateHammingDistanceMatrix(char** array, int num_strings, int string_length);
}