#!/usr/bin/env node

const hre = require("hardhat");
const { ethers } = hre;

async function main() {
  const contractAddress = process.env.POWERUP_CONTRACT_ADDRESS;
  const signerAddress = process.env.POWERUP_SIGNER_ADDRESS;

  if (!contractAddress) {
    throw new Error("POWERUP_CONTRACT_ADDRESS env var is required");
  }

  if (!signerAddress) {
    throw new Error("POWERUP_SIGNER_ADDRESS env var is required");
  }

  const powerUps = await ethers.getContractAt("PongPowerUps", contractAddress);
  const MINTER_ROLE = ethers.id("MINTER_ROLE");
  const GAME_ROLE = ethers.id("GAME_ROLE");

  console.log(`⚙️  Contract: ${contractAddress}`);
  console.log(`🙌 Signer:   ${signerAddress}`);

  const tx1 = await powerUps.populateTransaction.grantRole(MINTER_ROLE, signerAddress);
  const tx2 = await powerUps.populateTransaction.grantRole(GAME_ROLE, signerAddress);

  const signer = await powerUps.runner?.getAddress
    ? powerUps
    : powerUps.connect(await ethers.provider.getSigner());

  const signedTx1 = await signer.runner.sendTransaction(tx1);
  console.log(`⏳ Granting MINTER_ROLE (tx: ${signedTx1.hash})...`);
  await signedTx1.wait();
  console.log("✅ MINTER_ROLE granted");

  const signedTx2 = await signer.runner.sendTransaction(tx2);
  console.log(`⏳ Granting GAME_ROLE (tx: ${signedTx2.hash})...`);
  await signedTx2.wait();
  console.log("✅ GAME_ROLE granted");

  console.log("🎉 All roles granted successfully");
}

main().catch((error) => {
  console.error("❌ Failed to grant roles:", error);
  process.exit(1);
});
