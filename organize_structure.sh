#!/bin/bash

# Ensure the required directories exist
mkdir -p src/contracts
mkdir -p build/contracts
mkdir -p contracts
mkdir -p migrations
mkdir -p test
mkdir -p public

# Move Solidity contracts to the contracts directory
mv -v *.sol contracts/ 2>/dev/null

# Move JSON files to the src/contracts directory
mv -v *.json src/contracts/ 2>/dev/null

# Move compiled contracts to the build/contracts directory
mv -v build/contracts/*.json src/contracts/ 2>/dev/null

# Ensure the presence of essential files in the correct locations
if [ -f "contracts/Voting.sol" ]; then
  echo "Voting.sol is in the correct location."
else
  echo "Voting.sol is missing. Please ensure it is present in the contracts directory."
fi

if [ -f "src/contracts/Voting.json" ]; then
  echo "Voting.json is in the correct location."
else
  echo "Voting.json is missing. Please ensure it is present in the src/contracts directory."
fi

# Check for duplicate contracts and provide warning
for contract in contracts/*.sol; do
  contract_name=$(basename "$contract" .sol)
  if [ -f "src/contracts/$contract_name.json" ]; then
    echo "Duplicate contract found: $contract_name"
  fi
done

echo "Directory structure organized successfully."
