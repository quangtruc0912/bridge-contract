import { ethers } from "hardhat";

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log(`Deploying contracts with account: ${deployer.address}`);

    // Deploy TokenBSC
    const TokenBsc = await ethers.getContractFactory("TokenBSC");
    const tokenBsc = await TokenBsc.deploy();
    await tokenBsc.waitForDeployment();
    const tokenBscAddress = await tokenBsc.getAddress();
    console.log("TokenBSC deployed at:", tokenBscAddress);

    // Deploy BridgeBSC
    const BridgeBsc = await ethers.getContractFactory("BridgeBSC");
    const bridgeBsc = await BridgeBsc.deploy(tokenBscAddress);
    await bridgeBsc.waitForDeployment();
    const bridgeBscAddress = await bridgeBsc.getAddress();
    console.log("BridgeBSC deployed at:", bridgeBscAddress);

    // Update token admin
    await tokenBsc.updateAdmin(bridgeBscAddress);
    console.log(`TokenBSC admin updated to: ${bridgeBscAddress}`);
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});