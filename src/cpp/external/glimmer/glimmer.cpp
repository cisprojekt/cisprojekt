// Copyright [2008] <Stephen Ingram>
// glimmer.cpp : Console program to compute Glimmer CPU MDS on a set of input
// coordinates

// Stephen Ingram (sfingram@cs.ubc.ca) 02/08


// structs are not defined in glimmer.cpp but in scaling.h

/*
  Adjustments made by Timo Hofmann:
  * removed loadCSV function
  * added calculateMDSGlimmer (modified from original main-function)
  * removed calculation of distance from input data
  * substituted editing distance highd value through reading
    MatrixXd distanceMatrix entries
  * removed alternative setting of constants V_SET_SIZE and S_SET_SIZE
*/
#include <Eigen/Dense>
#include <float.h>
#include <stdlib.h>
#include <math.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>

#include <iostream>
#include <fstream>

#include "src/cpp/scaling/scaling.h"

/*
        CONSTANTS
*/
#define MIN_NUM_ARGS 0  // minimum command line arguments
#define SKIP_LINES 0    // number of lines to skip in the input CSV
#define V_SET_SIZE 8        // number of close neighbors
#define S_SET_SIZE 12       // number of randomly chosen neighbors
#define USE_GLUT 0          // comment this when timing tests are done
#define MAX_ITERATION 1000  // maximum number of iterations
#define COSCLEN 51          // length of cosc filter
#define EPS 1.e-12f         // termination threshold
#define MIN_SET_SIZE 1000   // recursion termination condition
#define DEC_FACTOR 8        // decimation factor

/*
        FORCE CONSTANTS
*/
#define SIZE_FACTOR (1.f / (static_cast<float>(V_SET_SIZE + S_SET_SIZE)))
#define DAMPING (0.3f)
#define SPRINGFORCE (0.7f)
#define FREENESS (0.85f)
#define DELTATIME (0.3f)

using Eigen::MatrixXd;
/*
        DATA STRUCTURES
*/

/*
        GLOBALS
*/
int g_done = 0;            // controls the movement of points
int g_interpolating = 0;   // specifies if we are interpolating yet
int g_current_level = 0;   // current level being processed
int g_heir[50];            // handles up to 8^50 points
int g_levels = 0;          // stores the point-counts at the associated levels
int iteration = 0;         // total number of iterations
int stop_iteration = 0;    // total number of iterations since changing levels
int N = 0;                 // number of points |V|
int n_original_dims = 2;   // original dimension h of the data (set in loadCSV)
int n_embedding_dims = 2;  // embedding dimensions l
float *g_embed = NULL;     // pointer to embedding coords
float *g_force = NULL;     // pointer to embedding coords' force vectors
float *g_vel = NULL;       // pointer to embedding coords' velocity vectors
float *g_data = NULL;      // pointer to input data coords
VECTYPE *g_vec_data = NULL;  // pointer to the sparse input data coordinates
int g_vec_dims = 0;          // max number of nonzero dims in vec dataset
INDEXTYPE *g_idx = NULL;     // pointer to INDEXTYPE coords
int g_chalmers = 0;          // flag for doing chalmers

// cosc filter
float cosc[] = {0.f,
                -0.00020937301404f,
                -0.00083238644375f,
                -0.00187445134867f,
                -0.003352219513758f,
                -0.005284158713234f,
                -0.007680040381756f,
                -0.010530536243981f,
                -0.013798126870435f,
                -0.017410416484704f,
                -0.021256733995966f,
                -0.025188599234624f,
                -0.029024272810166f,
                -0.032557220569071f,
                -0.035567944643756f,
                -0.037838297355557f,
                -0.039167132882787f,
                -0.039385989227318f,
                -0.038373445436298f,
                -0.036066871845685f,
                -0.032470479106137f,
                -0.027658859359265f,
                -0.02177557557417f,
                -0.015026761314847f,
                -0.007670107630023f,
                0.f,
                0.007670107630023f,
                0.015026761314847f,
                0.02177557557417f,
                0.027658859359265f,
                0.032470479106137f,
                0.036066871845685f,
                0.038373445436298f,
                0.039385989227318f,
                0.039167132882787f,
                0.037838297355557f,
                0.035567944643756f,
                0.032557220569071f,
                0.029024272810166f,
                0.025188599234624f,
                0.021256733995966f,
                0.017410416484704f,
                0.013798126870435f,
                0.010530536243981f,
                0.007680040381756f,
                0.005284158713234f,
                0.003352219513758f,
                0.00187445134867f,
                0.00083238644375f,
                0.00020937301404f,
                0.f};
float sstress[MAX_ITERATION];  // sparse stress calculation

/*
        32 bit random number generation (default is 16 bit)
*/
int myrand() {
  unsigned int n = (unsigned int)rand();
  unsigned int m = (unsigned int)rand();

  return (static_cast<int>((n << 16) + m));
}

/*
        Output the embedding coordinates to a CSV file
*/
void outputCSV(const char *filename, float *embedding) {
  // open the file
  FILE *fp = NULL;
  if ((fp = fopen(filename, "w")) == NULL) {
    printf("ERROR: Can't open points output file %s\n", filename);
    exit(0);
  }

  // output header
  fprintf(fp, "X,Y\n");

  // output data to file
  for (int i = 0; i < N; i++) {
    for (int j = 0; j < n_embedding_dims; j++) {
      fprintf(fp, "%f", embedding[(i * n_embedding_dims) + j]);
      if (j < n_embedding_dims - 1)
        fprintf(fp, ",");
    }
    fprintf(fp, "\n");
  }

  // close the file
  fclose(fp);
}

/*
        distance and index comparison functions for qsort
*/
int distcomp(const void *a, const void *b) {
  const INDEXTYPE *da = (const INDEXTYPE *)a;
  const INDEXTYPE *db = (const INDEXTYPE *)b;
  if (da->highd == db->highd)
    return 0;
  return (da->highd - db->highd) < 0.f ? -1 : 1;
}
int idxcomp(const void *a, const void *b) {
  const INDEXTYPE *da = (const INDEXTYPE *)a;
  const INDEXTYPE *db = (const INDEXTYPE *)b;
  return static_cast<int>(da->index - db->index);
}

float max(float a, float b) { return (a < b) ? b : a; }
float min(float a, float b) { return (a < b) ? a : b; }

/*
        Sparse Stress Termination Condition
*/
int terminate(INDEXTYPE *idx_set, int size) {
  float numer = 0.f;  // sq diff of dists
  float denom = 0.f;  // sq dists
  float temp = 0.f;

  if (iteration > MAX_ITERATION) {
    return 1;
  }

  // compute sparse stress
  for (int i = 0; i < size; i++) {
    for (int j = 0; j < (V_SET_SIZE + S_SET_SIZE); j++) {
      temp = (idx_set[i * (V_SET_SIZE + S_SET_SIZE) + j].highd == 1.000f)
                 ? 0.f
                 : (idx_set[i * (V_SET_SIZE + S_SET_SIZE) + j].highd -
                    idx_set[i * (V_SET_SIZE + S_SET_SIZE) + j].lowd);
      numer += temp * temp;
      denom += (idx_set[i * (V_SET_SIZE + S_SET_SIZE) + j].highd == 1.000f)
                   ? 0.f
                   : (idx_set[i * (V_SET_SIZE + S_SET_SIZE) + j].highd *
                      idx_set[i * (V_SET_SIZE + S_SET_SIZE) + j].highd);
    }
  }
  sstress[iteration] = numer / denom;

  // convolve the signal
  float signal = 0.f;
  if (iteration - stop_iteration > COSCLEN) {
    for (int i = 0; i < COSCLEN; i++) {
      signal += sstress[(iteration - COSCLEN) + i] * cosc[i];
    }

    if (fabs(signal) < EPS) {
      stop_iteration = iteration;
      return 1;
    }
  }

  return 0;
}

/*
        calculate the cosine distance between two points in g_vec_data
*/

/*
        Compute Chalmers' an iteration of force directed simulation on subset of
   size 'size' holding fixedsize fixed
*/
void force_directed(int size, int fixedsize, const MatrixXd &distanceMatrix) {
  // initialize index sets
  if (iteration == stop_iteration) {
    for (int i = 0; i < size; i++) {
      for (int j = 0; j < V_SET_SIZE; j++) {
        g_idx[i * (V_SET_SIZE + S_SET_SIZE) + j].index =
            rand() % (g_interpolating ? fixedsize : size);
      }
    }
  }


  // perform the force simulation iteration
  float *dir_vec = reinterpret_cast<float *>(malloc(sizeof(float) *
                                                   n_embedding_dims));
  float *relvel_vec = reinterpret_cast<float *>(malloc(sizeof(float) *
                                                      n_embedding_dims));
  float diff = 0.f;
  float norm = 0.f;
  float lo = 0.f;
  float hi = 0.f;
  int akk = 0;

  // compute new forces for each point
  for (int i = fixedsize; i < size; i++) {
    if (i == fixedsize) {
      for (int q = 0; q <= fixedsize; q++) {
        akk += q;
      }
    } else {
      akk += i;
    }

    for (int j = 0; j < V_SET_SIZE + S_SET_SIZE; j++) {
      // update the S set with random entries

      if (j >= V_SET_SIZE) {
        g_idx[i * (V_SET_SIZE + S_SET_SIZE) + j].index =
            rand() % (g_interpolating ? fixedsize : size);
      }
      // calculate high dimensional distances
      int idx = g_idx[i * (V_SET_SIZE + S_SET_SIZE) + j].index;

      g_idx[i * (V_SET_SIZE + S_SET_SIZE) + j].highd =
          static_cast<float>(const_cast<MatrixXd&>(distanceMatrix)(i, idx));

    }

    // sort index set by index
    qsort(&(g_idx[i * (V_SET_SIZE + S_SET_SIZE)]), (V_SET_SIZE + S_SET_SIZE),
          sizeof(INDEXTYPE), idxcomp);



    // sort index set by distance
    qsort(&(g_idx[i * (V_SET_SIZE + S_SET_SIZE)]), (V_SET_SIZE + S_SET_SIZE),
          sizeof(INDEXTYPE), distcomp);

    // move the point
    for (int j = 0; j < (V_SET_SIZE + S_SET_SIZE); j++) {
      //  get a reference to the other point in the index set
      int idx = g_idx[i * (V_SET_SIZE + S_SET_SIZE) + j].index;

      norm = 0.f;
      for (int k = 0; k < n_embedding_dims; k++) {
        //  calculate the direction vector
        dir_vec[k] = g_embed[2 * idx * n_embedding_dims + k] -
                     g_embed[i * n_embedding_dims + k];
        norm += dir_vec[k] * dir_vec[k];
      }
      norm = sqrt(norm);
      g_idx[i * (V_SET_SIZE + S_SET_SIZE) + j].lowd = norm;
      if (norm > 1.e-6 && g_idx[i * (V_SET_SIZE + S_SET_SIZE) + j].highd !=
                              1000.f) {  // check for zero norm or mark
        // normalize direction vector
        for (int k = 0; k < n_embedding_dims; k++) {
          dir_vec[k] /= norm;
        }

        // calculate relative velocity
        for (int k = 0; k < n_embedding_dims; k++) {
          relvel_vec[k] = g_vel[idx * n_embedding_dims + k] -
                          g_vel[i * n_embedding_dims + k];
        }

        // calculate difference between lo and hi distances
        lo = g_idx[i * (V_SET_SIZE + S_SET_SIZE) + j].lowd;
        hi = g_idx[i * (V_SET_SIZE + S_SET_SIZE) + j].highd;
        diff = (lo - hi) * SPRINGFORCE;

        // compute damping value
        norm = 0.f;
        for (int k = 0; k < n_embedding_dims; k++) {
          norm += dir_vec[k] * relvel_vec[k];
        }
        diff += norm * DAMPING;

        // accumulate the force
        for (int k = 0; k < n_embedding_dims; k++) {
          g_force[i * n_embedding_dims + k] += dir_vec[k] * diff;
        }
      }
    }

    // scale the force by the size factor
    for (int k = 0; k < n_embedding_dims; k++) {
      g_force[i * n_embedding_dims + k] *= SIZE_FACTOR;
    }
  }

  // compute new velocities for each point with Euler integration
  for (int i = fixedsize; i < size; i++) {
    for (int k = 0; k < n_embedding_dims; k++) {
      float foo = g_vel[i * n_embedding_dims + k];
      float bar = foo + g_force[i * n_embedding_dims + k] * DELTATIME;
      float baz = bar * FREENESS;
      g_vel[i * n_embedding_dims + k] = max(min(baz, 2.0), -2.0);
    }
  }

  // compute new positions for each point with Euler integration
  for (int i = fixedsize; i < size; i++) {
    for (int k = 0; k < n_embedding_dims; k++) {
      g_embed[i * n_embedding_dims + k] +=
          g_vel[i * n_embedding_dims + k] * DELTATIME;
    }
  }

  // clean up memory allocation
  free(dir_vec);
  free(relvel_vec);
}

void init_embedding(float *embedding) {
  unsigned int seed = time(NULL);
  for (int i = 0; i < N; i++) {
    for (int j = 0; j < n_embedding_dims; j++) {
      embedding[i * (n_embedding_dims) + j] =
      static_cast<float>(rand_r(&seed) % 10000) / 10000.f - 0.5f;
    }
  }
}

/*
        computes the input level heirarchy and size
*/
int fill_level_count(int input, int *h) {
  static int levels = 0;
  h[levels] = input;
  levels++;
  if (input <= MIN_SET_SIZE)
    return levels;
  return fill_level_count(input / DEC_FACTOR, h);
}

/*
        main function
*/
MatrixXd calculateMDSglimmer(int num_p, const MatrixXd &distanceMatrix,
                             float *totalprogress, float *partialprogress) {
  // begin timing
  clock_t start_time1 = clock();
  // initialize function parameters
  N = num_p;
  MatrixXd XUpdated(N, 2);
  int skip = 0;
  int k = 0;
  double max_dist = 0;
  *partialprogress = 0.0;

  for (int it_1 = 0; it_1 < N; it_1++) {
    for (int it_2 = it_1; it_2 < N; it_2++) {
      if (distanceMatrix(it_1, it_2) > max_dist) {
        max_dist = distanceMatrix(it_1, it_2);
      }
    }
  }
  // max_dist = biggest distance in distancematrix

  const_cast<MatrixXd&>(distanceMatrix).array() /= max_dist;

  clock_t start_time2 = clock();

  // allocate embedding and associated data structures
  g_levels = fill_level_count(N, g_heir);
  g_current_level = g_levels - 1;
  float tStep = 1/g_current_level*0.4;
  float pStep = 1/g_current_level;

  // float *embedding = NULL;
  // embedding = (float *)malloc(sizeof(float) * n_embedding_dims * N);
  g_embed = reinterpret_cast<float *>(malloc(sizeof(float) *
                                            n_embedding_dims * N));
  g_vel = reinterpret_cast<float *>(calloc(n_embedding_dims * N,
                                          sizeof(float)));
  g_force = reinterpret_cast<float *>(calloc(n_embedding_dims * N,
                                            sizeof(float)));
  g_idx =
      reinterpret_cast<INDEXTYPE *>(malloc(sizeof(INDEXTYPE) *
                                          N * (V_SET_SIZE + S_SET_SIZE)));

  time_t t;
  srand((unsigned)(time(&t)));
  // initialize embedding
  init_embedding(g_embed);
  // std::cout << "init_embedding" << std::endl;
  // for (int i = 0; i < 2 * N; i++) {
  //   std::cout << g_embed[i] << std::endl;
  //}
  clock_t start_time3 = clock();

  int chalm = 0;
  if (chalm == 1) {
    //   if( !strcmp( argv[4], "chalm" ) ) {
    g_chalmers = 1;
    for (int i = 0; i < N; i++) {
      force_directed(N, 0, distanceMatrix);
      // }
    }
  } else {
    while (!g_done) {
      // move the points
      if (g_interpolating)
        force_directed(g_heir[g_current_level], g_heir[g_current_level + 1],
                       distanceMatrix);
      else
        force_directed(g_heir[g_current_level], 0, distanceMatrix);

      // check the termination condition

      if (terminate(g_idx, g_heir[g_current_level])) {
        if (g_interpolating) {
          g_interpolating = 0;
        } else {
          g_current_level--;  // move to the next level down
          g_interpolating = 1;
          *totalprogress += tStep;
          *partialprogress += pStep;

          // check if the algorithm is complete (no more levels)
          if (g_current_level < 0) {
            g_done = 1;
          }
        }
      }

      iteration++;  // increment the current iteration count
    }
  }

  clock_t start_time4 = clock();

  float max_value = -1.e37f;
  float min_value = 1.e37f;
  float factor = 0.0;
  for (int i = 0; i < N*n_embedding_dims; i++) {
    if (g_embed[i] < min_value) { min_value = g_embed[i]; }
    if (g_embed[i] > max_value) { max_value = g_embed[i]; }
  }

  if (max_value < -min_value) {factor = -min_value;
  } else { factor = max_value; }

  for (int i = 0; i < N*n_embedding_dims; i++) {
    g_embed[i] /= factor;
  }
  clock_t start_time5 = clock();


  for (int it_1 = 0; it_1 < N; it_1++) {
    XUpdated(it_1, 0) = static_cast<double>(g_embed[(it_1 * n_embedding_dims)]);
    XUpdated(it_1, 1) = static_cast<double>(g_embed[(it_1 *
                                                    n_embedding_dims + 1)]);
  }
  clock_t start_time6 = clock();

  std::cout << "Glimmer needed "
  << static_cast<float>(start_time6 - start_time1) / (CLOCKS_PER_SEC)
  << "s for scaling\n";
  return XUpdated;
}
