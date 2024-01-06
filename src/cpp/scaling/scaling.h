#ifndef SRC_CPP_SCALING_SCALING_H_
#define SRC_CPP_SCALING_SCALING_H_
// Copyright [year] <Copyright Owner>
#include <algorithm>

using Eigen::MatrixXd;
using Eigen::VectorXd;

// SMACOF funtions

//

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
MatrixXd calculateMDSsmacof(MatrixXd distMat, int maxIt = 50,
                            double eps = 10e-6, int dim = 2);

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

// full distance-matrix needed!

// Scikit functions
double scikit_mds_single(double *dissimilarities, double *x, double *x_inter,
                         int n_samples, bool init, bool metric,
                         int n_components, int max_iter, bool verbose,
                         double eps, int random_state, bool normalized_stress);

void scikit_mds_multi(double *dissimilarities, double *x, double *x_inter,
                      int n_iterations, int n_samples, bool init, bool metric,
                      int n_components, int max_iter, bool verbose, double eps,
                      int random_state, bool normalized_stress);

void outputscikit(double *embedding);

int calculateMDSscikit(void);

// Glimmer functions

typedef struct _INDEXTYPE {
  int index;    // index of the other point
  float highd;  // high dimensional distance
  float lowd;   // low dimensional distance
} INDEXTYPE;

typedef struct _VECTYPE {
  int index;
  float value;
} VECTYPE;

int calculateMDSglimmer(void);
int myrand(void);
int distcomp(const void *a, const void *b);
int idxcomp(const void *a, const void *b);
float max(float a, float b);
float min(float a, float b);
int terminate(INDEXTYPE *idx_set, int size);
void force_directed(int size, int fixedsize, float *distmat);
void init_embedding(float *embedding);
int fill_level_count(int input, int *h);

#endif  // SRC_CPP_SCALING_SCALING_H_
