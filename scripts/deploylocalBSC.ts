import { ethers } from "hardhat";

async function main() {
    //  Get deployer
    const [deployer, owner2, owner3] = await ethers.getSigners();
    console.log(`Deploying contracts with account: ${deployer.address}`);

    //  Deploy TokenBSC
    const TokenBsc = await ethers.getContractFactory("TokenBSC");
    const tokenBsc = await TokenBsc.deploy();
    await tokenBsc.waitForDeployment();
    const tokenBscAddress = await tokenBsc.getAddress();
    console.log("TokenBsc deployed at:", tokenBscAddress);

    //  Deploy BridgeBSC with multisig owners
    const owners = [deployer.address, owner2.address, owner3.address];
    const requiredSignatures = 2; // 2-of-3 multisig
    const BridgeBsc = await ethers.getContractFactory("BridgeBSC");
    const bridgeBsc = await BridgeBsc.deploy(tokenBscAddress, owners, requiredSignatures);
    await bridgeBsc.waitForDeployment();
    const bridgeBscAddress = await bridgeBsc.getAddress();
    console.log("BridgeBsc deployed at:", bridgeBscAddress);

    const bridgeContract = await ethers.getContractAt("BridgeBSC", bridgeBscAddress);

    console.log("\nDepositing 2 ETH into the bridge...");
    const depositTx = await bridgeContract.depositEth({ value: ethers.parseEther("2") });
    await depositTx.wait();
    console.log("Deposited 2 ETH into the bridge");

    // Check bridge BSC balance
    let bridgeBalance = await ethers.provider.getBalance(bridgeBscAddress);
    console.log(`Bridge BSC Balance: ${ethers.formatEther(bridgeBalance)} ETH`);

    // Update token admin
    await tokenBsc.updateAdmin(bridgeBscAddress);
    console.log(`TokenBSC admin updated to: ${bridgeBscAddress}`);
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});