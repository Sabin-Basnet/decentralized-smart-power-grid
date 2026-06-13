const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    console.log("🚀 Deploying PrepaidGrid Smart Contract...");

    // Get deployer account
    const [deployer] = await ethers.getSigners();
    console.log(`📍 Deploying with account: ${deployer.address}`);

    // Get account balance
    const balance = await ethers.provider.getBalance(deployer.address);
    console.log(`💰 Account balance: ${ethers.utils.formatEther(balance)} ETH`);

    // Deploy contract
    const PrepaidGrid = await ethers.getContractFactory("PrepaidGrid");
    const contract = await PrepaidGrid.deploy();
    await contract.deployed();

    console.log(`✅ PrepaidGrid deployed to: ${contract.address}`);

    // Save deployment info
    const deploymentInfo = {
        network: hre.network.name,
        contractAddress: contract.address,
        deployerAddress: deployer.address,
        deploymentTime: new Date().toISOString(),
        chainId: (await ethers.provider.getNetwork()).chainId,
    };

    const deploymentPath = path.join(__dirname, "..", "deployment.json");
    fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
    console.log(`📄 Deployment info saved to: ${deploymentPath}`);

    // Get contract ABI
    const contractABI = require("../artifacts/contracts/PrepaidGrid.sol/PrepaidGrid.json").abi;
    const abiPath = path.join(__dirname, "..", "contract-abi.json");
    fs.writeFileSync(abiPath, JSON.stringify(contractABI, null, 2));
    console.log(`📋 Contract ABI saved to: ${abiPath}`);

    // Test the contract
    console.log("\n🧪 Testing contract functions...");

    // Purchase tokens
    const tx1 = await contract.purchaseTokens({
        value: ethers.utils.parseEther("10")
    });
    await tx1.wait();
    console.log(`✓ Purchased 10 ETH worth of tokens`);

    // Check balance
    const balance1 = await contract.getBalance(deployer.address);
    console.log(`✓ User balance: ${ethers.utils.formatEther(balance1)} tokens`);

    // Check authorization
    const isAuthorized = await contract.checkAuthorization(deployer.address);
    console.log(`✓ User authorized: ${isAuthorized}`);

    // Get statistics
    const stats = await contract.getStatistics();
    console.log(`✓ Total distributed: ${ethers.utils.formatEther(stats.distributed)} tokens`);

    console.log("\n🎉 Deployment and testing completed successfully!");
    console.log("\n📝 Integration Steps:");
    console.log(`1. Copy the contract address: ${contract.address}`);
    console.log("2. Update backend/blockchain_bridge.py with CONTRACT_ADDRESS");
    console.log("3. Copy ABI from contract-abi.json into backend");
    console.log("4. Start the event listener in blockchain_bridge.py");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
