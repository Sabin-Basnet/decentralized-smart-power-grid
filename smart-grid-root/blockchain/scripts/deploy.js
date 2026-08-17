const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log(`Deploying PowerGrid with account: ${deployer.address}`);

  const PowerGrid = await hre.ethers.getContractFactory("PowerGrid");
  const powerGrid = await PowerGrid.deploy();
  await powerGrid.waitForDeployment();

  const address = await powerGrid.getAddress();
  console.log(`PowerGrid deployed to: ${address}`);

  const deploymentInfo = {
    network: hre.network.name,
    contractAddress: address,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
  };

  const deploymentPath = path.join(__dirname, "..", "deployment.json");
  fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));

  const artifact = require(path.join(__dirname, "..", "artifacts", "contracts", "PowerGrid.sol", "PowerGrid.json"));
  const abiPath = path.join(__dirname, "..", "contract-abi.json");
  fs.writeFileSync(abiPath, JSON.stringify(artifact.abi, null, 2));

  console.log(`Deployment metadata written to ${deploymentPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
