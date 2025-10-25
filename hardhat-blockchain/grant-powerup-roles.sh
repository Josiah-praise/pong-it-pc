#!/usr/bin/env bash

set -euo pipefail

if [[ $# -ne 3 ]]; then
  cat <<'USAGE'
Usage: ./grant-powerup-roles.sh <network> <contract-address> <signer-address>

Example:
  ./grant-powerup-roles.sh pushTestnet 0xContractAddr 0xSignerAddr
USAGE
  exit 1
fi

NETWORK="$1"
CONTRACT_ADDRESS="$2"
SIGNER_ADDRESS="$3"

POWERUP_CONTRACT_ADDRESS="$CONTRACT_ADDRESS" \
POWERUP_SIGNER_ADDRESS="$SIGNER_ADDRESS" \
npx hardhat run scripts/grant-powerup-roles.js --network "$NETWORK"
