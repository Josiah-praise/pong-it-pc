import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const PongPowerUpsModule = buildModule("PongPowerUpsModule", (m) => {
  const admin = m.getParameter(
    "admin",
    "0x9ad6b669EB355D4924eCa26ddF0636F4897aEF22"
  );

  const minter = m.getParameter("minter", admin);
  const gameOperator = m.getParameter("gameOperator", admin);
  const baseURI = m.getParameter(
    "baseURI",
    "https://storage.googleapis.com/pong-it-powerups/{id}.json"
  );

  const powerUps = m.contract("PongPowerUps", [baseURI, admin, minter, gameOperator]);

  return { powerUps };
});

export default PongPowerUpsModule;
