using Eigen::MatrixXd;
using Eigen::VectorXd;

/**
 * @brief Calculate a square distance matrix for points
 * @param points Points in Euclidean space
 * @return distMat Distance Matrix
 */
MatrixXd distanceMatrix(MatrixXd points);

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
double calculateEuclideanDistance(double* vector1, double* vector2,
                                  int string_length);

double* calculateEuclideanDistanceMatrix(double* array, int num_points,
                                         int dimension);

int calculateHammingDistance(char* str1, char* str2, int string_length);

int* calculateHammingDistanceMatrix(char** array, int num_strings,
                                    int string_length);
}
