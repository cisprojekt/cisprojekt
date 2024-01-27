// Copyright [year] <Copyright Owner>
#ifndef SRC_CPP_DISTMAT_DISTMAT_H_
#define SRC_CPP_DISTMAT_DISTMAT_H_

#include <Eigen/Dense>
#include <string>
#include <vector>

using Eigen::MatrixXd;
using Eigen::VectorXd;

// clang-format off

/**
 *  ____ ___ ____ _____ __  __    _  _____ 
 * |  _ \_ _/ ___|_   _|  \/  |  / \|_   _|
 * | | | | |\___ \ | | | |\/| | / _ \ | |  
 * | |_| | | ___) || | | |  | |/ ___ \| |  
 * |____/___|____/ |_| |_|  |_/_/   \_\_|  
 *                                         
 */

// clang-format on

/**
 * @brief Calculate a square distance matrix for points
 * @param points Points in Euclidean space
 * @return distMat Distance Matrix
 */
MatrixXd distanceMatrix(MatrixXd points, bool isSperical = false);

/**
 * @brief Calculate a square distance matrix for strings
 * @param strings Molecule fingerprints
 * @return distMat Distance Matrix
 */
MatrixXd distanceMatrix(std::vector<std::string> strings);

/**
 * @brief Calculate Euclidean distance between two points
 * @param pointA First point
 * @param pointB Second point
 * @return dist Euclidean distance between two points
 */
double euclideanDistance(VectorXd pointA, VectorXd pointB);

/**
 * @brief Calculate Anti-Tanimoto distance between two fingerprints
 * @param fingerprintA Fingerprint of first molecule
 * @param fingerprintB Fingerprint of second molecule
 * @return dist Euclidean distance between two points
 */
double tanimotoDistance(std::string fingerprintA, std::string fingerprintB);

extern "C" {
double calculateEuclideanDistance(double *vector1, double *vector2,
                                  int string_length);

double *calculateEuclideanDistanceMatrix(double *array, int num_points,
                                         int dimension);

int calculateHammingDistance(char *str1, char *str2, int string_length);

int *calculateHammingDistanceMatrix(char **array, int num_strings,
                                    int string_length);
}

double toRadians(double degree);
/**
 * @brief Calculate Earths Distance between two points given lat and lon
 * @param lat1 Latitude of first point
 * @param lon1 Longitude of first point
 * @param lat2 Latitude of second point
 * @param lon2 Longitude of second point
 * @return distance using the haversine formula
 */
double haversine(double lat1, double lon1, double lat2, double lon2);

#endif  // SRC_CPP_DISTMAT_DISTMAT_H_
