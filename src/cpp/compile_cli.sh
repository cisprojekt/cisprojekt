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
EIGEN_PATH=${EIGEN_PATH:-/usr/include/eigen3/}
BOOST_PATH=${BOOST_PATH:-/usr/local/include/}
PROJECT_ROOT=${PROJECT_ROOT:-/mnt/c/Program\ files/Ampps/www/wip/}

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
g++ -O3 dv_cli.cpp dv_main.cpp external/hclust/fastcluster.cpp distmat/distmat.cpp scaling/scikit.cpp scaling/smacof.cpp external/glimmer/glimmer.cpp -I "$EIGEN_PATH" -I "$BOOST_PATH" -I "$PROJECT_ROOT" -o ../../bin/scout

# Check if compilation successful
if [ $? -eq 0 ]
then
  echo -e "${GREEN}Compilation successful!${NC}"
else
  echo -e "${RED}Compilation failed!${NC}"
fi

echo -e "******************************************"
