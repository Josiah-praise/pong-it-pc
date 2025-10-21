import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const PongEscrowModule = buildModule("PongEscrowModule", (m) => {
  // Get backend oracle address from parameters
  // Default to a placeholder - replace with your actual address
  const backendOracleAddress = m.getParameter(
    "backendOracle",
    "0x9ad6b669EB355D4924eCa26ddF0636F4897aEF22"
  );

  const pongEscrow = m.contract("PongEscrow", [backendOracleAddress]);

  return { pongEscrow };
});

export default PongEscrowModule;

