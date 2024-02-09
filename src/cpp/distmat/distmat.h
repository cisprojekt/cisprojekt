// Copyright [2024] <cisprojekt>

#ifndef SRC_CPP_DISTMAT_DISTMAT_H_
#define SRC_CPP_DISTMAT_DISTMAT_H_

#include <string>
#include <vector>

#include "src/cpp/dv_main.h"

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
 * @param distMatFilled pre-calculated flattened distance matrix
 * @param n number of points represented by distMatFilled
 * @param totalprogress progress tracker for calculation over all tasks
 * @param partialprogress progress tracker calculation over recent task
 * @return distMat Distance Matrix
 */

MatrixXd distanceMatrix(double *distMatFilled, int n, float *totalprogress,
                        float *partialprogress);

/**
 * @brief Calculate a square distance matrix for points
 * @param points Points in Euclidean space
 * @param isSperical decider whether coordinates are earth-coordinates
 * @param totalprogress progress tracker for calculation over all tasks
 * @param partialprogress progress tracker calculation over recent task
 * @return distMat Distance Matrix
 */

MatrixXd distanceMatrix(MatrixXd points, bool isSperical = 0,
                        float *totalprogress, float *partialprogress);

/**
 * @brief Calculate a square distance matrix for strings
 * @param strings Molecule fingerprints
 * @param type which data represented by strings (dna, fingerprint, ...)
 * @param totalprogress progress tracker for calculation over all tasks
 * @param partialprogress progress tracker calculation over recent task
 * @return distMat Distance Matrix
 */

MatrixXd distanceMatrix(std::vector<std::string> strings, int type,
                        float *totalprogress, float *partialprogress);

/**
 * @brief Calculate a square distance matrix for bitstrings
 * @param bitstrings Molecule fingerprints
 * @param bitset_size Number of bits/length of one bitstring
 * @param totalprogress progress tracker for calculation over all tasks
 * @param partialprogress progress tracker calculation over recent task
 * @return distMat Distance Matrix
 */

MatrixXd distanceMatrix(std::vector<boost::dynamic_bitset<>> bitstrings,
                        int bitset_size, float *totalprogress,
                        float *partialprogress);
/**
 * @brief Calculate Euclidean distance between two points
 * @param pointA First point
 * @param pointB Second point
 * @return dist Euclidean distance between two points
 */

double euclideanDistance(VectorXd pointA, VectorXd pointB);

/**
 * @brief Calculate Anti-Tanimoto distance between two strings
 * @param fingerprintA first string
 * @param fingerprintB second string
 * @return dist distance between two strings
 */

double tanimotoDistance(std::string fingerprintA, std::string fingerprintB);

/**
 * @brief Calculate Anti-Tanimoto distance between two bitfingerprints
 * @param fingerprintA Fingerprint of first molecule
 * @param fingerprintB Fingerprint of second molecule
  *@param bitset_size number of bits/length of one string
 * @return dist distance between two strings
 */

double tanimotoDistanceBitwise(boost::dynamic_bitset<> fingerprintA,
                               boost::dynamic_bitset<> fingerprintB,
                               int bitset_size);

/**
 * @brief Converts degree angle into radian angle
 * @param degree angle value in degrees
 * @return angle value in radian
 */

double toRadians(double degree);

/**
 * @brief Calculate Earth Distance between two points given lat and lon
 * @param lat1 Latitude of first point
 * @param lon1 Longitude of first point
 * @param lat2 Latitude of second point
 * @param lon2 Longitude of second point
 * @return distance using the haversine formula
 */

double haversine(double lat1, double lon1, double lat2, double lon2);

/**
 * @brief Calculate edit distance between two strings using the unit cost
 * @param str1 First sequence
 * @param str2 Second sequence
 */

int editdistance(std::string seq1, std::string seq2);

#endif  // SRC_CPP_DISTMAT_DISTMAT_H_
