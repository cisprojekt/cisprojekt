#!/bin/bash

###################################
# PLEASE ADD THESE TO YOUR BASHRC #
# ------------------------------- #
# export EIGEN_PATH=...           #
# export BOOST_PATH=...           #
# export PROJECT_ROOT=...         #
# and then execute                #
# source ~/.bashrc                #
###################################

# Set default EIGEN_PATH and PROJECT_ROOT variables
EIGEN_PATH=${EIGEN_PATH:-/home/konrad/dev/eigen-3.4.0}
BOOST_PATH=${BOOST_PATH:-/home/konrad/dev/boost_1_82_0}
PROJECT_ROOT=${PROJECT_ROOT:-/home/konrad/Uni/Cis_Projekt/cisprojekt}

# Printing
GREEN='\033[0;32m'
ORANGE='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m'
echo -e "****** starting compilation process ******"
echo -e "eigen_path: ${ORANGE}$EIGEN_PATH${NC}"
echo -e "boost_path: ${ORANGE}$BOOST_PATH${NC}"
echo -e "project_root: ${ORANGE}$PROJECT_ROOT${NC}\n"

# Use variables to compile
em++ -o ../../build/clustering.js -O3 --no-entry dv_main.cpp external/hclust/fastcluster.cpp distmat/distmat.cpp scaling/scikit.cpp scaling/smacof.cpp external/glimmer/glimmer.cpp -I "$EIGEN_PATH" -I "$BOOST_PATH" -I "$PROJECT_ROOT" -s "EXPORTED_FUNCTIONS=['_malloc', '_free', '_clusterPoints', '_clusterStrings', '_clusterCustom']" -s "EXPORTED_RUNTIME_METHODS=['ccall', 'stringToUTF8']" -s ALLOW_MEMORY_GROWTH -s MAXIMUM_MEMORY=4gb
cd 
# Check if compilation successful
if [ $? -eq 0 ]
then
  echo -e "${GREEN}Compilation successful!${NC}"
else
  echo -e "${RED}Compilation failed!${NC}"
fi

echo -e "******************************************"
