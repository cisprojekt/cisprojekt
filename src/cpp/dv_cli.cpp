// Copyright [year] <Copyright Owner>
#include <algorithm>
#include <fstream>
#include <iostream>
#include <sstream>
#include <string>
#include <vector>

#include "src/cpp/dv_main.h"

int main() {
  // default values
  float totalprogress = 0.0;
  float partialprogress = 0.0;
  int maxIterations = 100;
  int zoomLevels = 20;
  int calcScalingMethod = 1;
  int calcDistMethod = 1;
  int dataStreampherical = 0;
  std::string dataType = "euclidean";
  std::string inputFile = "example.csv";
  std::string outputFile = "output.json";
  std::vector<int> cols;

  // read config file
  std::ifstream configFile("config.cfg");

  // check if config file exists
  if (!configFile) {
    std::cerr << "config file not found!" << std::endl;
    exit(1);
  }

  std::string line;

  // read config file
  while (std::getline(configFile, line)) {
    std::cout << "reading config line" << std::endl;
    std::istringstream dataStream(line);
    std::string parameter;

    // get parameter values
    if (std::getline(dataStream, parameter, '=')) {
      std::string value;
      if (std::getline(dataStream, value)) {
        if (parameter == "maxIterations") {
          maxIterations = std::stoi(value);
        } else if (parameter == "zoomLevels") {
          zoomLevels = std::stoi(value);
        } else if (parameter == "calcScalingMethod") {
          calcScalingMethod = std::stoi(value);
        } else if (parameter == "calcDistMethod") {
          calcDistMethod = std::stoi(value);
        } else if (parameter == "dataStreampherical") {
          dataStreampherical = std::stoi(value);
        } else if (parameter == "dataType") {
          dataType = value;
        } else if (parameter == "inputFile") {
          inputFile = value;
        } else if (parameter == "outputFile") {
          outputFile = value;

          // cols is list of columns which contain distance data
        } else if (parameter == "cols") {
          std::istringstream dataStreamCols(value);
          std::string col;
          while (std::getline(dataStreamCols, col, ',')) {
            cols.push_back(std::stoi(col));
          }
        } else {
          std::cerr << "config file contains invalid entry" << std::endl;
          exit(1);
        }
      }
    }
  }

  // for euclidean data
  if (dataType == "euclidean") {
    // count the number of lines (header not included)
    std::ifstream countFile(inputFile);
    int numLines = std::count(std::istreambuf_iterator<char>(countFile),
                              std::istreambuf_iterator<char>(), '\n');
    std::cout << "number lines: " << numLines << std::endl;
    std::cout << "number columns: " << cols.size() << std::endl;
    countFile.close();

    std::ifstream dataFile(inputFile);

    // allocate memory for the points array
    double* points = reinterpret_cast<double*>(
        malloc(numLines * cols.size() * sizeof(double)));
    int pointIndex = 0;

    // will be used to skip reading the header
    bool firstLine = 1;

    // read dataFile
    while (std::getline(dataFile, line)) {
      // skip the first line of csv file
      if (firstLine) {
        firstLine = 0;
        continue;
      }

      std::cout << "reading data line" << std::endl;
      std::istringstream dataStream(line);
      std::string value;

      // save current column number
      int colIndex = 0;

      // read each column and append to points
      while (std::getline(dataStream, value, ',')) {
        // check if current column is specified in config
        if (std::find(cols.begin(), cols.end(), colIndex) != cols.end()) {
          std::cout << std::stod(value) << std::endl;
          points[pointIndex] = std::stod(value);
          pointIndex++;
        }
        colIndex++;
      }
    }

    std::cout << "starting print" << std::endl;

    // print the points
    for (int i = 0; i < numLines * cols.size(); i++) {
      std::cout << points[i] << std::endl;
    }

    // create arrays for clustering algorithm
    double* distMat = new double[(numLines * (numLines - 1)) / 2];
    int* merge = new int[2 * (numLines - 1)];
    double* height = new double[numLines - 1];
    int* labels = new int[numLines * zoomLevels];

    // call clustering function
    clusterPoints(points, cols.size(), distMat, height, merge, labels, numLines,
                  maxIterations, zoomLevels, calcDistMethod, calcScalingMethod,
                  dataStreampherical, &totalprogress, &partialprogress);

    // print the points
    for (int i = 0; i < numLines * cols.size(); i++) {
      std::cout << points[i] << std::endl;
    }

    // save result to json file

    // save labels array
    std::string json = "[{";
    for (int i = 0; i < numLines * zoomLevels; i++) {
      json +=
          "\"" + std::to_string(i) + "\":" + std::to_string(labels[i]) + ",";
    }

    // remove last comma
    json.pop_back();
    json += "},[";

    // save points to plot
    for (int i = 0; i < numLines * cols.size(); i += 2) {
      json += "{\"x\":" + std::to_string(points[i]) + ",";
      json += "\"y\":" + std::to_string(points[i + 1]) + "},";
    }

    // remove last comma and add closing brackets
    json.pop_back();
    json += "]]";

    // JSON result
    std::cout << json << std::endl;

    // writing json file
    std::cout << "writing to json file" << std::endl;
    std::ofstream out(outputFile);
    out << json;
    out.close();

    // deallocate memory
    free(points);
    free(distMat);
    free(merge);
    free(height);
    free(labels);
  }

  return 0;
}
