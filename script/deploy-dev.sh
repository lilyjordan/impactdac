#!/bin/bash

forge script DAC.s.sol --fork-url http://localhost:8545 --broadcast --out ../frontend/artifacts;
cp ../broadcast/DAC.s.sol/31337/run-latest.json ../frontend/public;