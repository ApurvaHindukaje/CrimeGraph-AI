const hre = require("hardhat");

async function main() {
  const EvidenceRegistry = await hre.ethers.getContractFactory("EvidenceRegistry");
  const registry = await EvidenceRegistry.deploy();

  await registry.waitForDeployment();

  const contractAddress = await registry.getAddress();
  console.log(`EvidenceRegistry deployed to: ${contractAddress}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
