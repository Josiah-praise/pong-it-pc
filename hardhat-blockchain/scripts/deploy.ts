import { ethers } from "hardhat";

async function main() {
  // Get the backend oracle address from environment or use default
  const backendOracleAddress = process.env.BACKEND_ORACLE_ADDRESS || 
    "0x9ad6b669EB355D4924eCa26ddF0636F4897aEF22";

  console.log("Deploying PongEscrow...");
  console.log("Backend Oracle:", backendOracleAddress);

  const PongEscrow = await ethers.getContractFactory("PongEscrow");
  const pongEscrow = await PongEscrow.deploy(backendOracleAddress);

  await pongEscrow.waitForDeployment();

  const address = await pongEscrow.getAddress();
  console.log("✅ PongEscrow deployed to:", address);
  console.log("\nTo verify on BlockScout:");
  console.log(`npx hardhat verify --network pushTestnet ${address} ${backendOracleAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

