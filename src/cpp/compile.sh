#!/bin/bash

# Set default EIGEN_PATH and PROJECT_ROOT variables
EIGEN_PATH=${EIGEN_PATH:-/usr/include/eigen3/}
PROJECT_ROOT=${PROJECT_ROOT:-/mnt/c/Program\ Files/Ampps/www/compile_test/}

# Printing
GREEN='\033[0;32m'
ORANGE='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m'
echo -e "****** starting compilation process ******"
echo -e "eigen_path: ${ORANGE}$EIGEN_PATH${NC}"
echo -e "project_root: ${ORANGE}$PROJECT_ROOT${NC}\n"

# Use variables to compile
#em++ -o ../../build/clustering.js --no-entry dv_main.cpp -I "$EIGEN_PATH" -I "$PROJECT_ROOT" -s "EXPORTED_FUNCTIONS=['_malloc', '_free', '_clusterPoints', '_clusterStrings']" -s "EXPORTED_RUNTIME_METHODS=['ccall']" -s ALLOW_MEMORY_GROWTH
em++ -o ../../build/clustering.js --no-entry dv_main.cpp ./external/hclust/fastcluster.cpp ./distmat/distmat.cpp ./scaling/scikit.cpp ./scaling/smacof.cpp -I "$EIGEN_PATH" -I "$PROJECT_ROOT" -s "EXPORTED_FUNCTIONS=['_malloc', '_free', '_clusterPoints', '_clusterStrings']" -s "EXPORTED_RUNTIME_METHODS=['ccall']" -s ALLOW_MEMORY_GROWTH

# Check if compilation successful
if [ $? -eq 0 ]
then
  echo -e "${GREEN}Compilation successful!${NC}"
else
  echo -e "${RED}Compilation failed!${NC}"
fi

echo -e "******************************************"
